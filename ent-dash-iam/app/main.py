from contextlib import asynccontextmanager
import logging
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.exceptions import setup_exception_handlers
from app.core.middleware import RequestLoggingMiddleware
from app.api.main import api_router
from app.db.init_db import init_db
from app.services.config_service import config_service

from prometheus_fastapi_instrumentator import Instrumentator

# ── Structured logging setup ──────────────────────────────────────────────────
logging.basicConfig(
    stream=sys.stdout,
    level=logging.INFO,
    format="%(message)s",  # pure JSON lines — no extra prefix from basicConfig
)
logging.getLogger("uvicorn.access").disabled = True  # suppress duplicate access logs

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger = logging.getLogger(__name__)
    # 1. Initialize database schemas, tables, and seed data
    try:
        await init_db()
        logger.info("Database initialization successful.")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")

    # 2. Load dynamic system configuration into in-memory cache
    try:
        from app.db.session import AsyncSessionLocal
        async with AsyncSessionLocal() as db:
            await config_service.load(db)
        # Start background auto-refresh every 5 minutes
        await config_service.start_background_refresh()
        logger.info("System configuration cache loaded.")
    except Exception as e:
        logger.warning(f"Config service load failed (using env var defaults): {e}")

    yield

def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        docs_url=f"{settings.API_V1_STR}/docs",
        redoc_url=f"{settings.API_V1_STR}/redoc",
        lifespan=lifespan,
    )

    app.add_middleware(RequestLoggingMiddleware)

    # CORS origins: prefer DB-backed config, fallback to env var
    # Note: middleware is initialised once at startup; use /system-config/refresh-cache + restart
    # to apply CORS changes in production, or use the background refresh (5 min TTL).
    cors_origins = (
        config_service.get_list("cors.allowed_origins")
        or settings.cors_origins
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_origin_regex=r"http://(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+)(:\d+)?",
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization", "Accept"],
    )

    setup_exception_handlers(app)

    app.include_router(api_router, prefix=settings.API_V1_STR)

    # Expose /metrics endpoint untuk Prometheus scraping
    # (sebelumnya Instrumentator di-import tapi tidak pernah di-attach ke app)
    Instrumentator().instrument(app).expose(app)

    @app.get("/health")
    def health_check():
        return {"service": "iam", "status": "healthy"}

    return app

app = create_app()
