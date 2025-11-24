from app.celery_app import celery_app
from app.database import SessionLocal
from app.models.post import Post, PostStatus
from app.models.social_account import SocialAccount
from app.models.content import Content
from app.services.social_media_poster import SocialMediaPosterService
from datetime import datetime, timedelta
from sqlalchemy import select
from loguru import logger


@celery_app.task(name="app.tasks.posting_tasks.publish_post")
def publish_post(post_id: int):
    """
    Celery task to publish a post to social media.
    """
    db = SessionLocal()

    try:
        # Get post
        post = db.query(Post).filter(Post.id == post_id).first()

        if not post:
            return {"error": "Post not found"}

        # Update status
        post.status = PostStatus.POSTING
        db.commit()

        # Get social account
        social_account = (
            db.query(SocialAccount)
            .filter(SocialAccount.id == post.social_account_id)
            .first()
        )

        if not social_account or not social_account.is_active:
            post.status = PostStatus.FAILED
            post.error_message = "Social account not found or inactive"
            db.commit()
            return {"error": "Social account issue"}

        # Get content
        content = db.query(Content).filter(Content.id == post.content_id).first()

        if not content:
            post.status = PostStatus.FAILED
            post.error_message = "Content not found"
            db.commit()
            return {"error": "Content not found"}

        # Initialize poster
        poster = SocialMediaPosterService()

        # Prepare credentials
        credentials = {
            str(post.platform.value): {
                "access_token": social_account.access_token,
                "refresh_token": social_account.refresh_token,
                **social_account.platform_data,
            }
        }

        # Post to platform (run async in sync context)
        import asyncio

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        results = loop.run_until_complete(
            poster.post_to_multiple_platforms(
                platforms=[str(post.platform.value)],
                captions={str(post.platform.value): post.caption},
                credentials=credentials,
                image_base64=content.image_data,
            )
        )

        result = results.get(str(post.platform.value), {})

        if result.get("success"):
            post.status = PostStatus.PUBLISHED
            post.posted_at = datetime.utcnow()
            post.platform_post_id = result.get("data", {}).get("post_id") or result.get(
                "post_id"
            )
            social_account.last_posted_at = datetime.utcnow()
        else:
            post.status = PostStatus.FAILED
            post.error_message = result.get("error", "Unknown error")
            post.retry_count += 1

        db.commit()

        return {
            "success": result.get("success", False),
            "post_id": post_id,
            "platform": str(post.platform.value),
        }

    except Exception as e:
        post.status = PostStatus.FAILED
        post.error_message = str(e)
        post.retry_count += 1
        db.commit()
        return {"error": str(e)}

    finally:
        db.close()


@celery_app.task(name="app.tasks.posting_tasks.process_scheduled_posts")
def process_scheduled_posts():
    """
    Process all scheduled posts that are due.
    """
    db = SessionLocal()

    try:
        # Get posts scheduled for now or earlier
        now = datetime.utcnow()
        posts = (
            db.query(Post)
            .filter(Post.status == PostStatus.SCHEDULED, Post.scheduled_for <= now)
            .all()
        )

        processed = 0
        for post in posts:
            # Queue for publishing
            publish_post.delay(post.id)
            processed += 1

        return {"processed": processed}

    finally:
        db.close()


@celery_app.task(name="app.tasks.posting_tasks.retry_failed_posts")
def retry_failed_posts():
    """
    Retry failed posts that haven't exceeded retry limit.
    """
    db = SessionLocal()

    try:
        # Get failed posts with retry count < 3
        posts = (
            db.query(Post)
            .filter(Post.status == PostStatus.FAILED, Post.retry_count < 3)
            .all()
        )

        retried = 0
        for post in posts:
            # Reset status and queue for retry
            post.status = PostStatus.SCHEDULED
            db.commit()

            publish_post.delay(post.id)
            retried += 1

        return {"retried": retried}

    finally:
        db.close()


@celery_app.task(name="app.tasks.posting_tasks.refresh_expired_tokens")
def refresh_expired_tokens():
    """
    Refresh expired social media account tokens.
    """
    db = SessionLocal()

    try:
        # Get accounts with expired tokens (within next 7 days)
        week_from_now = datetime.utcnow() + timedelta(days=7)

        accounts = (
            db.query(SocialAccount)
            .filter(
                SocialAccount.is_active == True,
                SocialAccount.token_expires_at <= week_from_now,
            )
            .all()
        )

        refreshed = 0
        for account in accounts:
            # Platform-specific token refresh not implemented yet.
            logger.warning(
                "token.refresh not implemented for account",
                account_id=account.id,
                platform=account.platform,
            )
            refreshed += 1

        return {"refreshed": refreshed}

    finally:
        db.close()
