import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.main import api_router

from prometheus_fastapi_instrumentator import Instrumentator

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure DB schema and tables exist (idempotent — safe to re-run)
    from app.db.init_db import init_db
    await init_db()

    # Start gRPC server (serves FactKinerja from TABLEAU_REPORT schema)
    from app.grpc_server import serve_grpc
    grpc_server = await serve_grpc()

    yield

    # Stop gRPC server gracefully
    await grpc_server.stop(grace=5.0)
    logger.info("[DW] Shutting down DW service.")

def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        docs_url=f"{settings.API_V1_STR}/docs",
        redoc_url=f"{settings.API_V1_STR}/redoc",
        lifespan=lifespan,
    )

    # Set all CORS enabled origins
    # NOTE: Cannot use allow_origins=["*"] with allow_credentials=True — browser will block all requests.
    # We use allow_origin_regex to cover all local dev ports, and list known remote origins.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_origin_regex=r"http://(localhost|127\.0\.0\.1|172\.20\.10\.4)(:\d+)?",
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization", "Accept"],
        expose_headers=["Content-Type"],
    )

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        logger.error(f"HTTPException on {request.method} {request.url}: {exc.status_code} - {exc.detail}")
        if isinstance(exc.detail, dict):
            return JSONResponse(
                status_code=exc.status_code,
                content=exc.detail,
            )
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "code": f"HTTP_{exc.status_code}",
                "message": str(exc.detail)
            },
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        import traceback
        logger.error(f"CRITICAL: Unhandled exception on {request.method} {request.url}: {exc}")
        logger.error(traceback.format_exc())
        return JSONResponse(
            status_code=500,
            content={
                "code": "INTERNAL_SERVER_ERROR",
                "message": str(exc) if exc.args else "An unexpected error occurred."
            },
        )

    app.include_router(api_router, prefix=settings.API_V1_STR)

    Instrumentator().instrument(app).expose(app)

    @app.get("/")
    def root():
        return {"message": "Welcome to DW Service"}

    return app

app = create_app()
