from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.qris import DailyAnalysisResponseDto
import httpx
import os
from cachetools import TTLCache

# Simple in-memory per-process cache for AI analysis — 24 hours TTL
analysis_cache = TTLCache(maxsize=100, ttl=86400)


async def get_daily_analysis(db: AsyncSession, date: str, network: str) -> DailyAnalysisResponseDto:
    """
    AI-powered daily analysis via Gemini.
    Note: QRIS stats query is delegated — analytics uses its own aggregated data in future.
    For now returns a placeholder since QRIS rekon models live in the Recon service.
    """
    cache_key = f"qris_ai_analysis_{network}_{date}"
    if cache_key in analysis_cache:
        return DailyAnalysisResponseDto(status="success", data={"date": date, "analysis": analysis_cache[cache_key]})

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return DailyAnalysisResponseDto(
            status="success",
            data={"date": date, "analysis": f"[Simulation Mode]: No GEMINI_API_KEY set. Analytics service ready for {network} on {date}."}
        )

    prompt = (
        f"Anda adalah Analis Keuangan Profesional tingkat direksi. "
        f"Berikan analisis singkat performa jaringan {network} pada tanggal {date}."
    )

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}",
                json={"contents": [{"parts": [{"text": prompt}]}]}
            )
            if response.status_code == 200:
                analysis = response.json().get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "Analisis gagal.")
                analysis_cache[cache_key] = analysis
            else:
                err = response.json().get("error", {})
                analysis = f"Error {err.get('code', response.status_code)}: {err.get('message', 'Unknown error')}"
        except Exception as e:
            analysis = f"Gagal memanggil AI: {str(e)}"

    return DailyAnalysisResponseDto(status="success", data={"date": date, "analysis": analysis.strip()})
