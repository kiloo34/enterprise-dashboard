import { NextRequest, NextResponse } from 'next/server';

const RECON_URL = process.env.RECON_SERVICE_URL || process.env.BACKEND_URL || 'http://localhost';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const authHeader = request.headers.get('Authorization') || '';

    try {
        const response = await fetch(`${RECON_URL}/api/recon/imports/${id}`, {
            headers: { 'Authorization': authHeader },
        });
        const data = await response.json().catch(() => ({}));
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('Import detail proxy error:', error);
        return NextResponse.json({ code: 'PROXY_ERROR', message: 'Gagal mendapatkan detail import.' }, { status: 502 });
    }
}
