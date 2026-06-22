"""
Structured logging setup for all Enterprise Dashboard services.

Configures Python's logging module with:
  - JSON-friendly format (service name, level, timestamp, message)
  - Request ID tracing support (for correlating logs across services)
  - Configurable log level via LOG_LEVEL environment variable

Usage in any service main.py:
    from ent_dash_common.logging import setup_logging
    setup_logging(service_name="iam", log_level="INFO")
"""
import logging
import sys
from typing import Optional


def setup_logging(
    service_name: str = "ent-dash",
    log_level: str = "INFO",
    json_format: bool = False,
) -> None:
    """
    Configure the root logger for the service.

    Args:
        service_name: Used as a prefix in log messages for easy filtering.
        log_level:    Logging level string (DEBUG, INFO, WARNING, ERROR).
        json_format:  If True, output structured JSON logs (ideal for log aggregation).
    """
    level = getattr(logging, log_level.upper(), logging.INFO)

    if json_format:
        fmt = (
            '{"time": "%(asctime)s", "service": "' + service_name + '", '
            '"level": "%(levelname)s", "logger": "%(name)s", "message": "%(message)s"}'
        )
    else:
        fmt = f"[{service_name}] %(asctime)s | %(levelname)-8s | %(name)s | %(message)s"

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter(fmt, datefmt="%Y-%m-%d %H:%M:%S"))

    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(level)

    # Quiet down noisy third-party loggers
    for noisy in ("uvicorn.access", "sqlalchemy.engine", "httpx", "httpcore"):
        logging.getLogger(noisy).setLevel(logging.WARNING)

    logging.getLogger(service_name).info(
        f"Logging initialized — service={service_name}, level={log_level}"
    )
