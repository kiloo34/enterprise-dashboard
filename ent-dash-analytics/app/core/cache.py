import json
import logging
from typing import Any, Optional
import redis.asyncio as redis
from app.core.config import settings

logger = logging.getLogger(__name__)

redis_client: Optional[redis.Redis] = None

async def init_redis():
    global redis_client
    redis_client = redis.from_url(settings.redis_url, encoding="utf-8", decode_responses=True)
    try:
        await redis_client.ping()
        logger.info("Connected to Redis successfully.")
    except Exception as e:
        logger.error(f"Failed to connect to Redis: {e}")
        redis_client = None

async def close_redis():
    global redis_client
    if redis_client:
        await redis_client.aclose()

async def get_cached_response(key: str) -> Optional[Any]:
    if not redis_client:
        return None
    try:
        data = await redis_client.get(key)
        if data:
            return json.loads(data)
    except Exception as e:
        logger.warning(f"Redis get error for {key}: {e}")
    return None

async def set_cached_response(key: str, data: Any, expire: int = 60):
    if not redis_client:
        return
    try:
        await redis_client.setex(key, expire, json.dumps(data))
    except Exception as e:
        logger.warning(f"Redis set error for {key}: {e}")
