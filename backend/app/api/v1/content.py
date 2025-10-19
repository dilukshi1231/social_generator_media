from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models.user import User
from app.models.content import Content, ContentStatus
from app.models.social_account import SocialAccount
from app.models.post import Post, PostStatus as PostStatusEnum
from app.api.v1.auth import get_current_user
from app.services.content_generator import ContentGeneratorService
from pydantic import BaseModel


router = APIRouter()


# Schemas
class ContentGenerateRequest(BaseModel):
    topic: str
    auto_approve: bool = False


class ContentResponse(BaseModel):
    id: int
    topic: str
    facebook_caption: Optional[str]
    instagram_caption: Optional[str]
    linkedin_caption: Optional[str]
    pinterest_caption: Optional[str]
    twitter_caption: Optional[str]
    threads_caption: Optional[str]
    image_prompt: Optional[str]
    image_url: Optional[str]
    extra_data: Optional[dict]
    status: ContentStatus
    created_at: datetime

    class Config:
        from_attributes = True


class ContentApprovalRequest(BaseModel):
    approved: bool
    feedback: Optional[str] = None


@router.post(
    "/generate", response_model=ContentResponse, status_code=status.HTTP_201_CREATED
)
async def generate_content(
    request: ContentGenerateRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Generate AI content for social media platforms.

    This endpoint:
    1. Generates platform-specific captions
    2. Creates an image prompt
    3. Generates an AI image
    4. Saves everything to the database
    """
    # Initialize content generator
    generator = ContentGeneratorService()

    try:
        # Generate complete content package
        content_data = await generator.generate_complete_content(request.topic)

        # Create content record
        new_content = Content(
            user_id=current_user.id,
            topic=request.topic,
            facebook_caption=content_data["captions"].get("facebook"),
            instagram_caption=content_data["captions"].get("instagram"),
            linkedin_caption=content_data["captions"].get("linkedin"),
            pinterest_caption=content_data["captions"].get("pinterest"),
            twitter_caption=content_data["captions"].get("twitter"),
            threads_caption=content_data["captions"].get("threads"),
            image_prompt=content_data.get("image_prompt"),
            image_data=content_data.get("image_base64"),
            image_url=content_data.get("image_data"),
            status=(
                ContentStatus.APPROVED
                if request.auto_approve
                else ContentStatus.PENDING_APPROVAL
            ),
            approved_at=datetime.utcnow() if request.auto_approve else None,
            extra_data={  # Changed from metadata to extra_data
                "image_mime": content_data.get("image_mime"),
                "generated_at": datetime.utcnow().isoformat(),
            },
        )
        db.add(new_content)
        await db.commit()
        await db.refresh(new_content)

        return new_content

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate content: {str(e)}",
        )


class ContentCreateRequest(BaseModel):
    topic: str
    facebook_caption: Optional[str] = None
    instagram_caption: Optional[str] = None
    linkedin_caption: Optional[str] = None
    pinterest_caption: Optional[str] = None
    twitter_caption: Optional[str] = None
    threads_caption: Optional[str] = None
    image_prompt: Optional[str] = None
    image_url: Optional[str] = None
    auto_approve: bool = False


@router.post(
    "/create", response_model=ContentResponse, status_code=status.HTTP_201_CREATED
)
async def create_content(
    request: ContentCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create and save content that was generated via webhook (n8n).
    This endpoint saves content without generating it.
    """
    try:
        # Create content record
        new_content = Content(
            user_id=current_user.id,
            topic=request.topic,
            facebook_caption=request.facebook_caption,
            instagram_caption=request.instagram_caption,
            linkedin_caption=request.linkedin_caption,
            pinterest_caption=request.pinterest_caption,
            twitter_caption=request.twitter_caption,
            threads_caption=request.threads_caption,
            image_prompt=request.image_prompt,
            image_url=request.image_url,
            status=(
                ContentStatus.APPROVED
                if request.auto_approve
                else ContentStatus.PENDING_APPROVAL
            ),
            approved_at=datetime.utcnow() if request.auto_approve else None,
            extra_data={
                "source": "webhook",
                "created_at": datetime.utcnow().isoformat(),
            },
        )
        db.add(new_content)
        await db.commit()
        await db.refresh(new_content)

        return new_content

    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create content: {str(e)}",
        )


@router.get("/", response_model=List[ContentResponse])
async def list_content(
    skip: int = 0,
    limit: int = 20,
    status_filter: Optional[ContentStatus] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all content for the current user."""
    query = select(Content).where(Content.user_id == current_user.id)

    if status_filter:
        query = query.where(Content.status == status_filter)

    query = query.offset(skip).limit(limit).order_by(Content.created_at.desc())

    result = await db.execute(query)
    contents = result.scalars().all()

    return contents


@router.get("/{content_id}", response_model=ContentResponse)
async def get_content(
    content_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get specific content by ID."""
    result = await db.execute(
        select(Content).where(
            Content.id == content_id, Content.user_id == current_user.id
        )
    )
    content = result.scalar_one_or_none()

    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Content not found"
        )

    return content


@router.post("/{content_id}/approve", response_model=ContentResponse)
async def approve_content(
    content_id: int,
    approval: ContentApprovalRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Approve or reject generated content."""
    result = await db.execute(
        select(Content).where(
            Content.id == content_id, Content.user_id == current_user.id
        )
    )
    content = result.scalar_one_or_none()

    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Content not found"
        )

    if approval.approved:
        content.status = ContentStatus.APPROVED
        content.approved_at = datetime.utcnow()
        content.approved_by = current_user.id
        # Create Post records for each connected & active social account
        # Query active social accounts for user
        accounts_result = await db.execute(
            select(SocialAccount).where(
                SocialAccount.user_id == current_user.id,
                SocialAccount.is_active == True,
                SocialAccount.is_connected == True,
            )
        )
        accounts = accounts_result.scalars().all()

        # Map content captions to platform-specific captions
        platform_caption_map = {
            "facebook": content.facebook_caption,
            "instagram": content.instagram_caption,
            "linkedin": content.linkedin_caption,
            "twitter": content.twitter_caption,
            "threads": content.threads_caption,
        }

        for acct in accounts:
            # Determine caption for this platform
            caption = (
                platform_caption_map.get(acct.platform.value, content.facebook_caption)
                or ""
            )

            new_post = Post(
                user_id=current_user.id,
                content_id=content.id,
                social_account_id=acct.id,
                platform=acct.platform,
                caption=caption,
                image_url=content.image_url,
                status=PostStatusEnum.SCHEDULED,
            )
            db.add(new_post)
    else:
        content.status = ContentStatus.REJECTED
        if approval.feedback:
            # Build a safe JSON dict for extra_data and persist via a direct UPDATE
            extra = content.extra_data or {}
            if not isinstance(extra, dict):
                extra = {}
            extra["rejection_feedback"] = approval.feedback

            # Use an explicit UPDATE statement to ensure JSON is persisted
            await db.execute(
                update(Content).where(Content.id == content_id).values(extra_data=extra)
            )

    await db.commit()
    await db.refresh(content)

    return content


@router.delete("/{content_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_content(
    content_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete content."""
    result = await db.execute(
        select(Content).where(
            Content.id == content_id, Content.user_id == current_user.id
        )
    )
    content = result.scalar_one_or_none()

    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Content not found"
        )

    await db.delete(content)
    await db.commit()

    return None


@router.post("/{content_id}/regenerate-image", response_model=ContentResponse)
async def regenerate_image(
    content_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Regenerate image for existing content."""
    result = await db.execute(
        select(Content).where(
            Content.id == content_id, Content.user_id == current_user.id
        )
    )
    content = result.scalar_one_or_none()

    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Content not found"
        )

    # Initialize generator
    generator = ContentGeneratorService()

    try:
        # Regenerate image
        image_data = await generator.generate_image_from_prompt(content.image_prompt)

        # Update content
        content.image_data = (
            image_data.split(",")[1] if image_data and "," in image_data else None
        )
        content.image_url = image_data
        content.status = ContentStatus.PENDING_APPROVAL

        await db.commit()
        await db.refresh(content)

        return content

    except ValueError as e:
        # This is likely an API configuration error
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        # Rollback any changes
        await db.rollback()
        # Log the full error for debugging
        import traceback

        print(f"Error regenerating image: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to regenerate image: {str(e)}",
        )


@router.post("/{content_id}/regenerate-captions", response_model=ContentResponse)
async def regenerate_captions(
    content_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Regenerate captions for existing content."""
    result = await db.execute(
        select(Content).where(
            Content.id == content_id, Content.user_id == current_user.id
        )
    )
    content = result.scalar_one_or_none()

    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Content not found"
        )

    # Initialize generator
    generator = ContentGeneratorService()

    try:
        # Regenerate captions
        captions = await generator.generate_platform_captions(content.topic)

        # Update content
        content.facebook_caption = captions.get("facebook")
        content.instagram_caption = captions.get("instagram")
        content.linkedin_caption = captions.get("linkedin")
        content.pinterest_caption = captions.get("pinterest")
        content.twitter_caption = captions.get("twitter")
        content.threads_caption = captions.get("threads")
        content.status = ContentStatus.PENDING_APPROVAL

        await db.commit()
        await db.refresh(content)

        return content

    except ValueError as e:
        # This is likely an API configuration error
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        # Rollback any changes
        await db.rollback()
        # Log the full error for debugging
        import traceback

        print(f"Error regenerating captions: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to regenerate captions: {str(e)}",
        )


class ImageGenerateRequest(BaseModel):
    prompt: str


class ImageGenerateResponse(BaseModel):
    image_url: str
    file_path: str


@router.post("/generate-image-proxy", response_model=ImageGenerateResponse)
async def generate_image_proxy(
    request: ImageGenerateRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Proxy endpoint to generate images using Cloudflare Worker.
    This avoids CORS issues by making the request from the backend.
    Saves the image to disk and returns the file path.
    """
    import httpx
    import os
    from datetime import datetime
    from pathlib import Path
    import uuid

    cloudflare_url = os.getenv(
        "CLOUDEFARE_WORKER_URL",
        "https://rapid-cherry-82e1.tharindukasthurisinghe.workers.dev",
    )
    auth_token = os.getenv(
        "CLOUDEFARE_WORKER_AUTH_TOKEN", "8704cf55-470b-40fb-8ad8-a5afa16f2a51"
    )

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                cloudflare_url,
                headers={
                    "Authorization": f"Bearer {auth_token}",
                    "Content-Type": "application/json",
                },
                json={"prompt": request.prompt},
            )

            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Image generation failed: {response.text}",
                )

            # Create uploads directory if it doesn't exist
            upload_dir = Path("uploads/images")
            upload_dir.mkdir(parents=True, exist_ok=True)

            # Generate unique filename
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            unique_id = str(uuid.uuid4())[:8]
            filename = f"{timestamp}_{current_user.id}_{unique_id}.jpg"
            file_path = upload_dir / filename

            # Save image to disk
            with open(file_path, "wb") as f:
                f.write(response.content)

            # Return relative path for database storage
            relative_path = f"uploads/images/{filename}"
            image_url = f"/uploads/images/{filename}"

            return ImageGenerateResponse(image_url=image_url, file_path=relative_path)

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Image generation timed out",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate image: {str(e)}",
        )
