import json
import logging
import asyncio
from app.core.config import settings

logger = logging.getLogger(__name__)

# Control variable to stop the background loop
_keep_running = True
_consumer_task = None


async def start_kafka_consumer():
    """
    Background loop that continuously polls Kafka for engine.data_processed messages.
    """
    global _keep_running
    _keep_running = True

    try:
        from confluent_kafka import Consumer, KafkaError
    except ImportError:
        logger.warning("confluent-kafka not installed! Consumer will not start.")
        return

    conf = {
        "bootstrap.servers": settings.KAFKA_BOOTSTRAP_SERVERS,
        "group.id": settings.KAFKA_CONSUMER_GROUP,
        "auto.offset.reset": "earliest",
        "enable.auto.commit": True,
    }

    try:
        consumer = Consumer(conf)
    except Exception as e:
        logger.error(f"[Kafka Consumer] Failed to create consumer: {e}")
        return

    topic = settings.KAFKA_TOPIC_DATA_PROCESSED
    logger.info(f"[Kafka Consumer] Subscribed to topic: {topic}")

    try:
        consumer.subscribe([topic])

        while _keep_running:
            # Poll for messages (non-blocking, short timeout)
            msg = consumer.poll(1.0)
            if msg is None:
                await asyncio.sleep(0.1)
                continue

            if msg.error():
                if msg.error().code() == KafkaError._PARTITION_EOF:
                    continue
                else:
                    logger.error(f"[Kafka Consumer] Error: {msg.error()}")
                    continue

            # Process payload
            try:
                payload = json.loads(msg.value().decode("utf-8"))
                logger.info(f"[Kafka Consumer] Received event on topic {msg.topic()}: {payload}")
                
                # Check status and table name
                status = payload.get("status")
                target_table = payload.get("target_table", "")

                if status in ("completed", "partial") and target_table:
                    # Import tasks dynamically inside loop to avoid circular import issues
                    from app.tasks.reconciliation import (
                        reconcile_qris_aj,
                        reconcile_qris_rintis,
                        reconcile_qris_onus,
                    )
                    
                    if target_table.endswith("rekon_qris_aj"):
                        logger.info("[Kafka Consumer] Triggering Artajasa reconciliation task...")
                        reconcile_qris_aj.delay()
                    elif target_table.endswith("rekon_qris_onus"):
                        logger.info("[Kafka Consumer] Triggering ONUS reconciliation task...")
                        reconcile_qris_onus.delay()
                    elif target_table.endswith("rekon_qris_rintis"):
                        logger.info("[Kafka Consumer] Triggering Rintis reconciliation task...")
                        reconcile_qris_rintis.delay()
                    
            except Exception as e:
                logger.error(f"[Kafka Consumer] Failed to process message: {e}", exc_info=True)

            await asyncio.sleep(0.1)

    except Exception as e:
        logger.error(f"[Kafka Consumer] Exception in background consumer loop: {e}")
    finally:
        consumer.close()
        logger.info("[Kafka Consumer] Shutting down.")


async def stop_kafka_consumer():
    """Stop the background consumer loop."""
    global _keep_running
    _keep_running = False
