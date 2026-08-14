import logging
import sys
from fastapi import FastAPI
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.exceptions import setup_exception_handlers
from app.api.main import api_router
from app.db.init_db import init_db

from prometheus_fastapi_instrumentator import Instrumentator

# ── Structured logging (sama dengan IAM) ──────────────────────────────────────
logging.basicConfig(
    stream=sys.stdout,
    level=logging.INFO,
    format="%(message)s",
)
logging.getLogger("uvicorn.access").disabled = True


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Init DB tables on startup
    logger = logging.getLogger(__name__)
    try:
        await init_db()
    except Exception as e:
        logger.error(f"[Engine] Startup DB init failed: {e}")
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

    # T4: RequestLoggingMiddleware — structured JSON access log (konsisten dengan IAM)
    try:
        from app.core.middleware import RequestLoggingMiddleware
        app.add_middleware(RequestLoggingMiddleware)
    except ImportError:
        pass  # Middleware opsional — Engine tetap berjalan tanpa structured log

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,  # K4: eksplisit dari env var
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
        return {"service": "engine", "status": "healthy"}

    return app


app = create_app()
