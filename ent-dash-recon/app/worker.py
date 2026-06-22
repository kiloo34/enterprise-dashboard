from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "ent_dash_recon_worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_BROKER_URL,
    include=["app.tasks.reconciliation"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="Asia/Jakarta",
    enable_utc=True,
    task_track_started=True,
    broker_transport_options={
        'priority_steps': list(range(10)),
        'queue_order_strategy': 'priority',
    }
)
