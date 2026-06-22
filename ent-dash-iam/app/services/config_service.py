"""
ConfigService — In-memory cache for database-backed system configuration.

Usage:
    # On startup (lifespan):
    await config_service.load(db)

    # Anywhere in the app:
    origins = config_service.get_list("cors.allowed_origins", default=["http://localhost:3000"])
    ttl     = config_service.get_int("auth.access_token_expire_minutes", default=15)

    # After a PUT /system-config/{key}:
    await config_service.load(db)   # refresh cache
"""
import asyncio
import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# Refresh interval in seconds (background auto-refresh)
_REFRESH_INTERVAL = 300  # 5 minutes


class _ConfigService:
    def __init__(self):
        self._cache: Dict[str, str] = {}
        self._loaded: bool = False

    # ── Loaders ────────────────────────────────────────────────────────────────

    async def load(self, db) -> None:
        """Fetch all config rows from DB and populate the in-memory cache."""
        from app.crud.crud_system_config import system_config as crud
        try:
            self._cache = await crud.get_all_as_dict(db)
            self._loaded = True
            logger.info(f"[ConfigService] Loaded {len(self._cache)} configuration entries.")
        except Exception as e:
            logger.error(f"[ConfigService] Failed to load config from DB: {e}")

    async def start_background_refresh(self) -> None:
        """Starts an asyncio background task that refreshes the cache every 5 minutes."""
        asyncio.create_task(self._refresh_loop())

    async def _refresh_loop(self) -> None:
        while True:
            await asyncio.sleep(_REFRESH_INTERVAL)
            try:
                from app.db.session import AsyncSessionLocal
                async with AsyncSessionLocal() as db:
                    await self.load(db)
                logger.debug("[ConfigService] Background cache refreshed.")
            except Exception as e:
                logger.warning(f"[ConfigService] Background refresh failed: {e}")

    # ── Getters ─────────────────────────────────────────────────────────────────

    def get(self, key: str, default: Optional[str] = None) -> Optional[str]:
        return self._cache.get(key, default)

    def get_int(self, key: str, default: int = 0) -> int:
        raw = self._cache.get(key)
        if raw is None:
            return default
        try:
            return int(raw)
        except (ValueError, TypeError):
            return default

    def get_bool(self, key: str, default: bool = False) -> bool:
        raw = self._cache.get(key)
        if raw is None:
            return default
        return raw.lower() in ("true", "1", "yes")

    def get_list(self, key: str, default: Optional[List[str]] = None) -> List[str]:
        """Parse a comma-separated config value into a list of stripped strings."""
        raw = self._cache.get(key)
        if raw is None:
            return default or []
        return [item.strip() for item in raw.split(",") if item.strip()]

    def all(self) -> Dict[str, str]:
        return dict(self._cache)

    # ── Invalidation ────────────────────────────────────────────────────────────

    def set(self, key: str, value: str) -> None:
        """Directly update a single key in the cache (called after successful DB write)."""
        self._cache[key] = value
        logger.debug(f"[ConfigService] Cache updated: {key}")


# Singleton — import this everywhere
config_service = _ConfigService()
