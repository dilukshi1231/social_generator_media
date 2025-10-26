from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from app.database import get_db
from app.models.user import User
from app.models.content import Content, ContentStatus
from app.models.post import Post, PostStatus
from app.models.social_account import SocialAccount, PlatformType
from app.api.v1.auth import get_current_user
from app.services.social_media_poster import SocialMediaPosterService


router = APIRouter()


# Schemas
class PostCreateRequest(BaseModel):
    content_id: int
    platforms: List[PlatformType]
    scheduled_for: Optional[datetime] = None


class PostResponse(BaseModel):
    id: int
    content_id: int
    platform: PlatformType
    caption: str
    status: PostStatus
    platform_post_id: Optional[str]
    platform_post_url: Optional[str]
    scheduled_for: Optional[datetime]
    posted_at: Optional[datetime]
    error_message: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class PostStatsResponse(BaseModel):
    post_id: int
    platform: PlatformType
    likes_count: int
    comments_count: int
    shares_count: int
    impressions_count: int

    class Config:
        from_attributes = True


async def publish_to_platform(post_id: int, db: AsyncSession):
    """Background task to publish post to social media platform."""
    # Get post
    result = await db.execute(select(Post).where(Post.id == post_id))
    post = result.scalar_one_or_none()

    if not post:
        return

    # Update status to posting
    post.status = PostStatus.POSTING
    await db.commit()

    try:
        # Get social account
        result = await db.execute(
            select(SocialAccount).where(SocialAccount.id == post.social_account_id)
        )
        social_account = result.scalar_one_or_none()

        if not social_account or not social_account.is_active:
            raise Exception("Social account not found or inactive")

        # Get content
        result = await db.execute(select(Content).where(Content.id == post.content_id))
        content = result.scalar_one_or_none()

        if not content:
            raise Exception("Content not found")

        # Initialize poster service
        poster = SocialMediaPosterService()

        # Prepare credentials based on platform
        credentials = {
            str(post.platform.value): {
                "access_token": social_account.access_token,
                "refresh_token": social_account.refresh_token,
                # Add platform-specific credentials from platform_data
                **social_account.platform_data,
            }
        }

        # Post to platform
        results = await poster.post_to_multiple_platforms(
            platforms=[str(post.platform.value)],
            captions={str(post.platform.value): post.caption},
            credentials=credentials,
            image_base64=content.image_data,
            image_url=content.image_url,
        )

        # Get result for this platform
        result = results.get(str(post.platform.value), {})

        if result.get("success"):
            post.status = PostStatus.PUBLISHED
            post.posted_at = datetime.utcnow()
            post.platform_post_id = result.get("data", {}).get("post_id") or result.get(
                "post_id"
            )

            # Update social account last posted time
            social_account.last_posted_at = datetime.utcnow()
        else:
            post.status = PostStatus.FAILED
            post.error_message = result.get("error", "Unknown error")
            post.retry_count += 1

        await db.commit()

    except Exception as e:
        post.status = PostStatus.FAILED
        post.error_message = str(e)
        post.retry_count += 1
        await db.commit()


@router.post(
    "/", response_model=List[PostResponse], status_code=status.HTTP_201_CREATED
)
async def create_posts(
    request: PostCreateRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create and schedule posts to multiple platforms.

    If scheduled_for is None, posts immediately.
    """
    # Verify content exists and is approved
    result = await db.execute(
        select(Content).where(
            Content.id == request.content_id, Content.user_id == current_user.id
        )
    )
    content = result.scalar_one_or_none()

    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Content not found"
        )

    if content.status != ContentStatus.APPROVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Content must be approved before posting",
        )

    created_posts = []

    for platform in request.platforms:
        # Get social account for platform
        result = await db.execute(
            select(SocialAccount).where(
                SocialAccount.user_id == current_user.id,
                SocialAccount.platform == platform,
                SocialAccount.is_active == True,
            )
        )
        social_account = result.scalar_one_or_none()

        if not social_account:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No active {platform} account connected",
            )

        # Get appropriate caption for platform
        caption_map = {
            PlatformType.FACEBOOK: content.facebook_caption,
            PlatformType.INSTAGRAM: content.instagram_caption,
            PlatformType.LINKEDIN: content.linkedin_caption,
            PlatformType.TWITTER: content.twitter_caption,
            PlatformType.TIKTOK: content.instagram_caption,  # Use Instagram caption for TikTok
        }

        caption = caption_map.get(platform, "")

        # Create post
        new_post = Post(
            user_id=current_user.id,
            content_id=content.id,
            social_account_id=social_account.id,
            platform=platform,
            caption=caption,
            image_url=content.image_url,
            status=PostStatus.SCHEDULED,
            scheduled_for=request.scheduled_for,
        )

        db.add(new_post)
        await db.flush()  # Get the ID

        # If no schedule time, post immediately
        if not request.scheduled_for:
            background_tasks.add_task(publish_to_platform, new_post.id, db)

        created_posts.append(new_post)

    # Update content status
    content.status = ContentStatus.PUBLISHED

    await db.commit()

    for post in created_posts:
        await db.refresh(post)

    return created_posts


@router.get("/", response_model=List[PostResponse])
async def list_posts(
    skip: int = 0,
    limit: int = 20,
    platform: Optional[PlatformType] = None,
    status_filter: Optional[PostStatus] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all posts for the current user."""
    query = select(Post).where(Post.user_id == current_user.id)

    if platform:
        query = query.where(Post.platform == platform)

    if status_filter:
        query = query.where(Post.status == status_filter)

    query = query.offset(skip).limit(limit).order_by(Post.created_at.desc())

    result = await db.execute(query)
    posts = result.scalars().all()

    return posts


@router.get("/{post_id}", response_model=PostResponse)
async def get_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get specific post by ID."""
    result = await db.execute(
        select(Post).where(Post.id == post_id, Post.user_id == current_user.id)
    )
    post = result.scalar_one_or_none()

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Post not found"
        )

    return post


@router.post("/{post_id}/retry", response_model=PostResponse)
async def retry_failed_post(
    post_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retry a failed post."""
    result = await db.execute(
        select(Post).where(Post.id == post_id, Post.user_id == current_user.id)
    )
    post = result.scalar_one_or_none()

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Post not found"
        )

    if post.status != PostStatus.FAILED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only failed posts can be retried",
        )

    if post.retry_count >= 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum retry attempts reached",
        )

    # Reset status
    post.status = PostStatus.SCHEDULED
    post.error_message = None
    await db.commit()

    # Retry posting
    background_tasks.add_task(publish_to_platform, post.id, db)

    await db.refresh(post)
    return post


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a post (only if not published)."""
    result = await db.execute(
        select(Post).where(Post.id == post_id, Post.user_id == current_user.id)
    )
    post = result.scalar_one_or_none()

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Post not found"
        )

    if post.status == PostStatus.PUBLISHED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete published posts",
        )

    await db.delete(post)
    await db.commit()

    return None


@router.get("/{post_id}/stats", response_model=PostStatsResponse)
async def get_post_stats(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get analytics/stats for a published post."""
    result = await db.execute(
        select(Post).where(Post.id == post_id, Post.user_id == current_user.id)
    )
    post = result.scalar_one_or_none()

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Post not found"
        )

    return PostStatsResponse(
        post_id=post.id,
        platform=post.platform,
        likes_count=post.likes_count,
        comments_count=post.comments_count,
        shares_count=post.shares_count,
        impressions_count=post.impressions_count,
    )
