import asyncio
import logging
from fastapi import APIRouter, Request, Depends
from fastapi.responses import StreamingResponse
import redis.asyncio as redis
from app.core.config import settings

from app.api.deps import get_current_user_from_query

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/notifications")
async def stream_notifications(
    request: Request,
    payload: dict = Depends(get_current_user_from_query)
):
    """
    Server-Sent Events (SSE) endpoint for real-time notifications.
    Clients connect here to receive updates about file processing, recon status, etc.
    Uses get_message() polling pattern to allow graceful client disconnect detection.
    """
    async def event_generator():
        # Connect to Redis PubSub
        r = redis.from_url(settings.CELERY_BROKER_URL, decode_responses=True)
        pubsub = r.pubsub()
        await pubsub.subscribe("notifications")

        try:
            # Send initial connection success message
            yield "data: {\"type\": \"connected\", \"message\": \"SSE connection established\"}\n\n"

            # Poll for messages — allows disconnect detection between polls
            while True:
                if await request.is_disconnected():
                    break

                try:
                    message = await pubsub.get_message(
                        ignore_subscribe_messages=True, timeout=1.0
                    )
                    if message and message["type"] == "message":
                        data = message["data"]
                        yield f"data: {data}\n\n"
                except redis.exceptions.TimeoutError:
                    continue

        except asyncio.CancelledError:
            logger.info("SSE client disconnected.")
        finally:
            await pubsub.unsubscribe("notifications")
            await r.aclose()

    return StreamingResponse(event_generator(), media_type="text/event-stream")
