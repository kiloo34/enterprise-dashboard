"""
Kafka Consumer — Listens for events from other microservices.

Specifically listens to `engine.data_processed` to trigger
asynchronous metric synchronization without blocking the Engine.
"""
import asyncio
import json
import logging
from typing import Dict, Any

from app.core.config import settings

logger = logging.getLogger(__name__)

# Control flag for graceful shutdown
_running = False

async def start_kafka_consumer():
    """
    Background loop that continuously polls Kafka for messages.
    Run this as an asyncio Task during application lifespan.
    """
    global _running
    _running = True

    try:
        from confluent_kafka import Consumer, KafkaError
    except ImportError:
        logger.warning("confluent-kafka not installed! Consumer will not start.")
        return

    consumer = Consumer({
        "bootstrap.servers": settings.KAFKA_BOOTSTRAP_SERVERS,
        "group.id": getattr(settings, "KAFKA_CONSUMER_GROUP", "analytics-group"),
        "auto.offset.reset": "earliest",
        "enable.auto.commit": False,  # We commit manually after successful processing
    })

    topic = settings.KAFKA_TOPIC_DATA_PROCESSED
    consumer.subscribe([topic])
    logger.info(f"[Kafka Consumer] Subscribed to topic: {topic}")

    while _running:
        # poll with timeout so we can yield control and check _running flag
        # Need to run blocking poll in thread pool to avoid blocking async loop
        msg = await asyncio.to_thread(consumer.poll, 1.0)
        
        if msg is None:
            continue
        if msg.error():
            if msg.error().code() == KafkaError._PARTITION_EOF:
                continue
            else:
                logger.error(f"[Kafka Consumer] Error: {msg.error()}")
                continue

        # Process the message
        try:
            val = msg.value().decode("utf-8")
            payload = json.loads(val)
            logger.info(f"[Kafka Consumer] Received event on topic {msg.topic()}: {payload}")
            
            await _handle_event(msg.topic(), payload)
            
            # Commit offset only after successful processing
            await asyncio.to_thread(consumer.commit, msg)
        except Exception as e:
            logger.error(f"[Kafka Consumer] Failed to process message: {e}", exc_info=True)

    consumer.close()
    logger.info("[Kafka Consumer] Shutting down.")


async def stop_kafka_consumer():
    """Trigger the consumer loop to exit gracefully."""
    global _running
    _running = False


async def _handle_event(topic: str, payload: Dict[str, Any]):
    """Route events based on topic and payload."""
    if topic == settings.KAFKA_TOPIC_DATA_PROCESSED:
        target_table = payload.get("target_table", "")
        # If the backend engine just finished importing fact_kinerjaprc
        if "fact_kinerjaprc" in target_table.lower():
            logger.info("[Kafka Consumer] FactKinerjaPrc data updated! Triggering metric sync...")
            from app.services.sync import SyncService
            await SyncService().sync_dashboard_metrics()

