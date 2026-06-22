"""
Thin Kafka/Redpanda producer wrapper for microservice event publishing.

Decouples Kafka producer instantiation from per-service code.
Import is safe even if `confluent-kafka` is NOT installed — the module
will raise ImportError only when `publish_event()` is actually called.

Usage:
    from ent_dash_common.kafka import publish_event

    publish_event(
        bootstrap_servers="redpanda:9092",
        topic="engine.file_uploaded",
        payload={"import_id": "...", "object_name": "..."},
        key="import_id_value",
    )
"""
import json
import logging
from typing import Any

logger = logging.getLogger(__name__)


def publish_event(
    bootstrap_servers: str,
    topic: str,
    payload: dict[str, Any],
    key: str | None = None,
    client_id: str = "ent-dash-service",
) -> None:
    """
    Publish a JSON event to a Kafka/Redpanda topic.

    Args:
        bootstrap_servers: Comma-separated Kafka broker addresses.
        topic:             Target topic name.
        payload:           Event data — will be JSON-serialized.
        key:               Optional partition key for ordering guarantees.
        client_id:         Producer client identifier (use service name).

    Note:
        Failures are logged but NOT re-raised — event publishing should
        never block or fail an HTTP request. Implement retry logic in
        consumers or use dead-letter queues for critical events.
    """
    try:
        from confluent_kafka import Producer
    except ImportError:
        logger.warning("confluent-kafka not installed — Kafka event not published.")
        return

    def _delivery_report(err, msg):
        if err:
            logger.error(f"[Kafka] Delivery failed | topic={msg.topic()} | error={err}")
        else:
            logger.debug(
                f"[Kafka] Delivered | topic={msg.topic()} | partition={msg.partition()} | offset={msg.offset()}"
            )

    try:
        producer = Producer({
            "bootstrap.servers": bootstrap_servers,
            "client.id": client_id,
            "acks": "all",
            "retries": 3,
            "retry.backoff.ms": 300,
        })
        producer.produce(
            topic=topic,
            key=key.encode("utf-8") if key else None,
            value=json.dumps(payload).encode("utf-8"),
            callback=_delivery_report,
        )
        producer.poll(0)  # Non-blocking delivery queue flush
        logger.info(f"[Kafka] Event published | topic={topic} | key={key}")
    except Exception as exc:
        logger.error(f"[Kafka] Failed to publish to '{topic}': {exc}")
