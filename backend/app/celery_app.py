from celery import Celery
from celery.schedules import crontab
from app.core.config import settings

# Initialize Celery
celery_app = Celery(
    "social_media_automation",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

# Celery configuration
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
    # Auto-discover tasks from these modules
    imports=[
        'app.tasks.content_tasks',
        'app.tasks.posting_tasks',
        'app.tasks.scraping_tasks'
    ]
)

# Periodic tasks schedule
celery_app.conf.beat_schedule = {
    # Scrape trending topics every hour
    'scrape-trending-topics': {
        'task': 'app.tasks.scraping_tasks.scrape_all_trends',
        'schedule': crontab(minute=0),  # Every hour
    },
    # Check for scheduled posts every 5 minutes
    'check-scheduled-posts': {
        'task': 'app.tasks.posting_tasks.process_scheduled_posts',
        'schedule': crontab(minute='*/5'),  # Every 5 minutes
    },
    # Refresh expired tokens daily
    'refresh-social-tokens': {
        'task': 'app.tasks.posting_tasks.refresh_expired_tokens',
        'schedule': crontab(hour=2, minute=0),  # Daily at 2 AM
    },
    # Clean up old content monthly
    'cleanup-old-content': {
        'task': 'app.tasks.content_tasks.cleanup_old_content',
        'schedule': crontab(day_of_month=1, hour=3, minute=0),  # Monthly
    },
}

# Task routes (optional)
celery_app.conf.task_routes = {
    'app.tasks.content_tasks.*': {'queue': 'content'},
    'app.tasks.posting_tasks.*': {'queue': 'posting'},
    'app.tasks.scraping_tasks.*': {'queue': 'scraping'},
}