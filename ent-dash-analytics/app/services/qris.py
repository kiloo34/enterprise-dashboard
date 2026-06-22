"""
QRIS Service — Business Logic Layer for AI-powered daily analysis.

Implements OOP pattern: QrisService encapsulates all AI analysis
logic including caching and Gemini API integration.
"""
import os
import httpx
from cachetools import TTLCache
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.qris import DailyAnalysisResponseDto


# Module-level cache: shared across all QrisService instances (per-process)
_analysis_cache: TTLCache = TTLCache(maxsize=100, ttl=86400)


class QrisService:
    """
    Provides AI-powered QRIS daily analysis via the Gemini API.
    Uses an in-memory TTL cache to avoid redundant API calls.
    """

    def __init__(self, db: AsyncSession):
        # db kept for future direct QRIS metric queries
        self._db = db
        self._cache = _analysis_cache

    async def get_daily_analysis(self, date: str, network: str) -> DailyAnalysisResponseDto:
        """
        Returns AI analysis for a given QRIS network and date.
        Hits cache first; falls back to Gemini API; degrades gracefully
        when no API key is configured (simulation mode).
        """
        cache_key = f"qris_ai_analysis_{network}_{date}"
        if cache_key in self._cache:
            return DailyAnalysisResponseDto(
                status="success",
                data={"date": date, "analysis": self._cache[cache_key]}
            )

        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return DailyAnalysisResponseDto(
                status="success",
                data={
                    "date": date,
                    "analysis": (
                        f"[Simulation Mode]: No GEMINI_API_KEY set. "
                        f"Analytics service ready for {network} on {date}."
                    ),
                }
            )

        analysis = await self._call_gemini(date, network, api_key)
        self._cache[cache_key] = analysis

        return DailyAnalysisResponseDto(
            status="success",
            data={"date": date, "analysis": analysis}
        )

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    async def _call_gemini(self, date: str, network: str, api_key: str) -> str:
        """Calls the Gemini API and returns the analysis text."""
        prompt = (
            f"Anda adalah Analis Keuangan Profesional tingkat direksi. "
            f"Berikan analisis singkat performa jaringan {network} pada tanggal {date}."
        )
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/"
            f"models/gemini-2.5-flash:generateContent?key={api_key}"
        )
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(
                    url,
                    json={"contents": [{"parts": [{"text": prompt}]}]}
                )
                if response.status_code == 200:
                    return (
                        response.json()
                        .get("candidates", [{}])[0]
                        .get("content", {})
                        .get("parts", [{}])[0]
                        .get("text", "Analisis gagal.")
                        .strip()
                    )
                err = response.json().get("error", {})
                return f"Error {err.get('code', response.status_code)}: {err.get('message', 'Unknown error')}"
            except Exception as e:
                return f"Gagal memanggil AI: {str(e)}"
