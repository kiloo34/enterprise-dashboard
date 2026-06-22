"""
Unit tests for SSE notifications endpoint.

Tests the generator directly to bypass ASGI/httpx/anyio lifecycle bugs
when forcefully closing streams in pytest-asyncio strict/auto mode.
"""
import pytest
import json
from unittest.mock import AsyncMock, MagicMock, patch
from app.api.routes.notifications import stream_notifications


def _build_redis_mock(messages: list) -> MagicMock:
    call_count = 0

    async def fake_get_message(ignore_subscribe_messages=True, timeout=1.0):
        nonlocal call_count
        if call_count < len(messages):
            msg = messages[call_count]
            call_count += 1
            return msg
        return None

    pubsub_mock = MagicMock()
    pubsub_mock.subscribe = AsyncMock()
    pubsub_mock.unsubscribe = AsyncMock()
    pubsub_mock.get_message = fake_get_message

    redis_mock = MagicMock()
    redis_mock.pubsub.return_value = pubsub_mock
    redis_mock.aclose = AsyncMock()

    return redis_mock


@pytest.mark.asyncio
async def test_sse_connection_established():
    """SSE endpoint emits a 'connected' event immediately on connect."""
    redis_mock = _build_redis_mock([])

    # Simulate client connected for 1st loop, then disconnected for 2nd loop
    request_mock = MagicMock()
    request_mock.is_disconnected = AsyncMock(side_effect=[False, True])

    with patch("app.api.routes.notifications.redis.from_url", return_value=redis_mock):
        response = await stream_notifications(request=request_mock, payload={"sub": "1"})
        
        events = []
        async for chunk in response.body_iterator:
            events.append(chunk)

        # First chunk should be the connection established message
        assert len(events) >= 1
        assert "SSE connection established" in events[0]
        assert "connected" in events[0]


@pytest.mark.asyncio
async def test_sse_delivers_published_message():
    """SSE endpoint forwards a Redis message to the HTTP stream."""
    payload = json.dumps({"type": "success", "message": "Import done", "details": "ok"})
    redis_message = {"type": "message", "data": payload}

    redis_mock = _build_redis_mock([redis_message])

    # Simulate client connected for 2 loops (init + msg), then disconnect
    request_mock = MagicMock()
    request_mock.is_disconnected = AsyncMock(side_effect=[False, False, True])

    with patch("app.api.routes.notifications.redis.from_url", return_value=redis_mock):
        response = await stream_notifications(request=request_mock, payload={"sub": "1"})
        
        events = []
        async for chunk in response.body_iterator:
            events.append(chunk)

        assert len(events) == 2
        # First chunk is connected message
        assert "SSE connection established" in events[0]
        # Second chunk is our payload
        assert "Import done" in events[1]
