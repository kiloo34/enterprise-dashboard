from celery import Celery

celery_app = Celery(
    "ent_dash_worker",
    broker="redis://redis:6379/0",
    backend="redis://redis:6379/0",
    include=["app.tasks.imports"],
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
