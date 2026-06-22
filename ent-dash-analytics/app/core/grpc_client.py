"""
Singleton gRPC Channel — Analytics → Engine.

Masalah sebelumnya:
  - grpc.aio.insecure_channel() dibuka baru di setiap Kafka event masuk.
  - Setiap call = TCP handshake baru + HTTP/2 negotiation → overhead besar.

Solusi:
  - Channel di-init sekali saat app startup (via FastAPI lifespan).
  - Channel di-close saat app shutdown.
  - Semua call ke Engine gRPC berbagi satu channel yang sama (connection reuse).

Usage:
    # Di main.py lifespan:
    await init_grpc_channel(settings.engine_grpc_address)

    # Di service:
    stub = get_engine_stub()
    response = await stub.GetFactKinerjaAggregate(request)
"""
import logging
import grpc
from ent_dash_common.grpc import engine_pb2_grpc

logger = logging.getLogger(__name__)

_channel: grpc.aio.Channel | None = None
_stub: engine_pb2_grpc.EngineServiceStub | None = None


async def init_grpc_channel(address: str) -> None:
    """Init singleton gRPC channel. Call once at app startup."""
    global _channel, _stub
    _channel = grpc.aio.insecure_channel(
        address,
        options=[
            ("grpc.keepalive_time_ms", 30000),           # ping setiap 30 detik
            ("grpc.keepalive_timeout_ms", 10000),         # timeout ping 10 detik
            ("grpc.keepalive_permit_without_calls", True), # ping meskipun tidak ada call aktif
            ("grpc.http2.max_pings_without_data", 0),
        ],
    )
    _stub = engine_pb2_grpc.EngineServiceStub(_channel)
    logger.info(f"[gRPC] Singleton channel initialized → {address}")


async def close_grpc_channel() -> None:
    """Close singleton gRPC channel. Call once at app shutdown."""
    global _channel, _stub
    if _channel:
        await _channel.close()
        _channel = None
        _stub = None
    logger.info("[gRPC] Singleton channel closed.")


def get_engine_stub() -> engine_pb2_grpc.EngineServiceStub:
    """Get the shared Engine gRPC stub. Raises if channel not initialized."""
    if _stub is None:
        raise RuntimeError(
            "gRPC channel not initialized. "
            "Ensure init_grpc_channel() is called in app lifespan."
        )
    return _stub
