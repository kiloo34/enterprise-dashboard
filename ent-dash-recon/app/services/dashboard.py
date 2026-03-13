from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.rekon import RekonQrisAj, RekonQrisOnus, RekonQrisRintis
from app.schemas.dashboard import QrisStatsResponseDto, DailyAnalysisResponseDto
import httpx
import os
from cachetools import TTLCache

# Simple in-memory cache for 24 hours (86400 seconds)
analysis_cache = TTLCache(maxsize=100, ttl=86400)

async def get_qris_stats(db: AsyncSession) -> QrisStatsResponseDto:
    # Total count
    total_result = await db.execute(select(func.count(RekonQrisAj.id_row)))
    totalTransactions = total_result.scalar() or 0
    
    # Settled Amount (MATCH)
    settled_result = await db.execute(
        select(func.sum(RekonQrisAj.transaction_amount)).where(RekonQrisAj.status_rekon == 'MATCH')
    )
    settledAmount = float(settled_result.scalar() or 0)
    
    # Unsettled Amount (UNMATCH, SUSPECT)
    unsettled_result = await db.execute(
        select(func.sum(RekonQrisAj.transaction_amount)).where(RekonQrisAj.status_rekon.in_(['UNMATCH', 'SUSPECT']))
    )
    unsettledAmount = float(unsettled_result.scalar() or 0)
    
    # Discrepancy Amount (UNMATCH)
    discrepancy_result = await db.execute(
        select(func.sum(RekonQrisAj.transaction_amount)).where(RekonQrisAj.status_rekon == 'UNMATCH')
    )
    totalDiscrepancyAmount = float(discrepancy_result.scalar() or 0)
    
    return QrisStatsResponseDto(
        totalTransactions=totalTransactions,
        settledAmount=settledAmount,
        unsettledAmount=unsettledAmount,
        totalDiscrepancyAmount=totalDiscrepancyAmount
    )

async def get_onus_stats(db: AsyncSession) -> QrisStatsResponseDto:
    total = await db.execute(select(func.count(RekonQrisOnus.id)))
    settled = await db.execute(select(func.sum(RekonQrisOnus.transaction_amount)).where(RekonQrisOnus.status_rekon == 'MATCH'))
    unsettled = await db.execute(select(func.sum(RekonQrisOnus.transaction_amount)).where(RekonQrisOnus.status_rekon.in_(['UNMATCH', 'SUSPECT'])))
    discrepancy = await db.execute(select(func.sum(RekonQrisOnus.transaction_amount)).where(RekonQrisOnus.status_rekon == 'UNMATCH'))
    return QrisStatsResponseDto(
        totalTransactions=total.scalar() or 0,
        settledAmount=float(settled.scalar() or 0),
        unsettledAmount=float(unsettled.scalar() or 0),
        totalDiscrepancyAmount=float(discrepancy.scalar() or 0)
    )

async def get_rintis_stats(db: AsyncSession) -> QrisStatsResponseDto:
    total = await db.execute(select(func.count(RekonQrisRintis.id)))
    settled = await db.execute(select(func.sum(RekonQrisRintis.transaction_amount)).where(RekonQrisRintis.status_rekon == 'MATCH'))
    unsettled = await db.execute(select(func.sum(RekonQrisRintis.transaction_amount)).where(RekonQrisRintis.status_rekon.in_(['UNMATCH', 'SUSPECT'])))
    discrepancy = await db.execute(select(func.sum(RekonQrisRintis.transaction_amount)).where(RekonQrisRintis.status_rekon == 'UNMATCH'))
    return QrisStatsResponseDto(
        totalTransactions=total.scalar() or 0,
        settledAmount=float(settled.scalar() or 0),
        unsettledAmount=float(unsettled.scalar() or 0),
        totalDiscrepancyAmount=float(discrepancy.scalar() or 0)
    )

async def get_daily_analysis(db: AsyncSession, date: str, network: str) -> DailyAnalysisResponseDto:
    # Note: In Laravel it used whereDate. We will cast to date or just do a generic text match for now.
    from sqlalchemy import cast, Date
    from datetime import datetime
    
    target_date = datetime.strptime(date, '%Y-%m-%d').date()
    
    result = await db.execute(
        select(
            func.count(RekonQrisAj.id_row).label('total_trx'),
            func.sum(RekonQrisAj.transaction_amount).label('total_amount'),
            func.sum(RekonQrisAj.interchange_fee).label('total_fee')
        ).where(cast(RekonQrisAj.transaction_date, Date) == target_date)
    )
    stats = result.first()
    
    if not stats or stats.total_trx == 0:
        return DailyAnalysisResponseDto(
            status='success',
            data={'analysis': f"Tidak ada data transaksi {network} yang tercatat pada tanggal {date} untuk dianalisa."}
        )
        
    cache_key = f"qris_ai_analysis_{network}_{date}"
    if cache_key in analysis_cache:
        analysis = analysis_cache[cache_key]
    else:
        api_key = os.getenv('GEMINI_API_KEY')
        total_amount = float(stats.total_amount or 0)
        total_fee = float(stats.total_fee or 0)
        prompt = (f"Anda adalah Analis Keuangan Profesional tingkat direksi. "
                  f"Analisa performa transaksi {network} berikut pada tanggal {date}: "
                  f"Total Volume Transaksi: {stats.total_trx} transaksi. "
                  f"Total Nominal (Rupiah): Rp {total_amount:,.0f}. "
                  f"Total Pendapatan Fee: Rp {total_fee:,.0f}. "
                  f"Tolong buatkan paragraf singkat (maksimal 3 kalimat) berbahasa Indonesia yang berisi "
                  f"kesimpulan performa dan satu insight/rekomendasi bisnis dari data tersebut.")
                  
        if not api_key:
            analysis = f"[Mode Simulasi / API Key Belum Diset]: Performa {network} pada tanggal ini menunjukkan volume stabil sebanyak {stats.total_trx}... (Ini adalah teks placeholder karena GEMINI_API_KEY kosong)."
            analysis_cache[cache_key] = analysis
        else:
            async with httpx.AsyncClient() as client:
                try:
                    response = await client.post(
                        f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}",
                        json={"contents": [{"parts": [{"text": prompt}]}]}
                    )
                    if response.status_code == 200:
                        analysis = response.json().get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', 'Analisis gagal di-generate.')
                        if analysis != 'Analisis gagal di-generate.':
                            analysis_cache[cache_key] = analysis
                    else:
                        error_data = response.json().get('error', {})
                        if error_data and 'code' in error_data and 'message' in error_data:
                            analysis = f"Terjadi kesalahan saat menghubungi server AI (Error {error_data['code']}): {error_data['message']}"
                        else:
                            analysis = f"Terjadi kesalahan saat menghubungi server AI: {response.status_code}"
                except Exception as e:
                    analysis = f"Gagal memanggil AI: {str(e)}"
                    
    return DailyAnalysisResponseDto(
        status='success',
        data={
            'date': date,
            'stats': {
                'total_trx': stats.total_trx,
                'total_amount': stats.total_amount,
                'total_fee': stats.total_fee,
            },
            'analysis': analysis.strip()
        }
    )
