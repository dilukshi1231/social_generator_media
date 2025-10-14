from app.celery_app import celery_app
from app.database import SessionLocal
from app.models.content import Content, ContentStatus
from datetime import datetime, timedelta
from sqlalchemy import select


@celery_app.task(name="app.tasks.content_tasks.cleanup_old_content")
def cleanup_old_content():
    """
    Clean up old rejected or draft content (older than 90 days).
    """
    db = SessionLocal()
    try:
        # Calculate cutoff date (90 days ago)
        cutoff_date = datetime.utcnow() - timedelta(days=90)
        
        # Delete old draft and rejected content
        deleted_count = db.query(Content).filter(
            Content.status.in_([ContentStatus.DRAFT, ContentStatus.REJECTED]),
            Content.created_at < cutoff_date
        ).delete(synchronize_session=False)
        
        db.commit()
        
        return {
            "deleted": deleted_count,
            "cutoff_date": cutoff_date.isoformat()
        }
    except Exception as e:
        db.rollback()
        return {"error": str(e)}
    finally:
        db.close()


@celery_app.task(name="app.tasks.content_tasks.auto_approve_content")
def auto_approve_content(content_id: int):
    """
    Auto-approve content after generation if requested.
    """
    db = SessionLocal()
    try:
        content = db.query(Content).filter(Content.id == content_id).first()
        
        if not content:
            return {"error": "Content not found"}
        
        if content.status == ContentStatus.PENDING_APPROVAL:
            content.status = ContentStatus.APPROVED
            content.approved_at = datetime.utcnow()
            db.commit()
            
            return {
                "success": True,
                "content_id": content_id,
                "status": "approved"
            }
        
        return {
            "success": False,
            "error": f"Content status is {content.status}, cannot auto-approve"
        }
    except Exception as e:
        db.rollback()
        return {"error": str(e)}
    finally:
        db.close()


@celery_app.task(name="app.tasks.content_tasks.regenerate_failed_content")
def regenerate_failed_content():
    """
    Retry generating content that failed.
    """
    db = SessionLocal()
    try:
        # Get failed content from last 24 hours
        cutoff = datetime.utcnow() - timedelta(hours=24)
        
        failed_contents = db.query(Content).filter(
            Content.status == ContentStatus.FAILED,
            Content.created_at >= cutoff
        ).all()
        
        retried = 0
        for content in failed_contents:
            # Reset to pending and trigger regeneration
            content.status = ContentStatus.PENDING_APPROVAL
            retried += 1
        
        db.commit()
        
        return {"retried": retried}
    except Exception as e:
        db.rollback()
        return {"error": str(e)}
    finally:
        db.close()


@celery_app.task(name="app.tasks.content_tasks.archive_old_published_content")
def archive_old_published_content():
    """
    Archive published content older than 180 days.
    """
    db = SessionLocal()
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=180)
        
        # Update extra_data to mark as archived (using the property)
        contents = db.query(Content).filter(
            Content.status == ContentStatus.PUBLISHED,
            Content.created_at < cutoff_date
        ).all()
        
        archived = 0
        for content in contents:
            # Use the metadata property which maps to extra_data
            current_data = content.metadata or {}
            current_data["archived"] = True
            current_data["archived_at"] = datetime.utcnow().isoformat()
            content.metadata = current_data
            archived += 1
        
        db.commit()
        
        return {
            "archived": archived,
            "cutoff_date": cutoff_date.isoformat()
        }
    except Exception as e:
        db.rollback()
        return {"error": str(e)}
    finally:
        db.close()