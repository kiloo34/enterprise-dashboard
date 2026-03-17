import { NextRequest, NextResponse } from 'next/server';

const RECON_URL = process.env.RECON_SERVICE_URL || process.env.BACKEND_URL || 'http://localhost';

export async function POST(request: NextRequest) {
    const authHeader = request.headers.get('Authorization') || '';

    try {
        const response = await fetch(`${RECON_URL}/api/recon/imports/reset-stuck`, {
            method: 'POST',
            headers: { 'Authorization': authHeader },
        });
        const data = await response.json().catch(() => ({}));
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('Reset-stuck proxy error:', error);
        return NextResponse.json({ code: 'PROXY_ERROR', message: 'Gagal mereset import macet.' }, { status: 502 });
    }
}
