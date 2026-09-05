import asyncio
import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.exceptions import setup_exception_handlers
from app.api.main import api_router
from app.core.events import start_kafka_consumer, stop_kafka_consumer
from app.core.grpc_client import init_grpc_channel, close_grpc_channel
from app.db.init_db import init_db
from app.core.cache import init_redis, close_redis

from prometheus_fastapi_instrumentator import Instrumentator

# ── Structured logging (konsisten dengan IAM & Engine) ────────────────────────
logging.basicConfig(
    stream=sys.stdout,
    level=logging.INFO,
    format="%(message)s",
)
logging.getLogger("uvicorn.access").disabled = True

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # T2: Init DB tables on startup
    try:
        await init_db()
    except Exception as e:
        logger.error(f"[Analytics] Startup DB init failed: {e}")

    # Init gRPC singleton channel
    await init_grpc_channel(settings.engine_grpc_address)

    # Init Redis connection pool
    await init_redis()

    # C5 fix: Gunakan asyncio.Event untuk shutdown graceful yang tidak hang.
    # consumer_task di-cancel saat shutdown, bukan di-await selamanya.
    stop_event = asyncio.Event()
    consumer_task = asyncio.create_task(start_kafka_consumer())

    yield

    # Shutdown: sinyal stop dulu, tunggu task selesai dengan timeout
    await stop_kafka_consumer()
    try:
        await asyncio.wait_for(consumer_task, timeout=5.0)
    except asyncio.TimeoutError:
        consumer_task.cancel()
        logger.warning("[Analytics] Kafka consumer did not stop in time, cancelled.")
    except asyncio.CancelledError:
        pass

    await close_grpc_channel()
    await close_redis()
    logger.info("[Analytics] Shutdown complete.")


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        docs_url=f"{settings.API_V1_STR}/docs",
        redoc_url=f"{settings.API_V1_STR}/redoc",
        lifespan=lifespan,
    )

    # T4: RequestLoggingMiddleware — structured JSON access log
    try:
        from app.core.middleware import RequestLoggingMiddleware
        app.add_middleware(RequestLoggingMiddleware)
    except ImportError:
        pass

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_origin_regex=r"http://(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+)(:\d+)?",
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization", "Accept"],
        expose_headers=["Content-Type"],
    )

    setup_exception_handlers(app)
    app.include_router(api_router, prefix=settings.API_V1_STR)

    Instrumentator().instrument(app).expose(app)

    @app.get("/health")
    def health_check():
        return {"service": "analytics", "status": "healthy"}

    return app


app = create_app()
