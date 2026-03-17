import { NextRequest, NextResponse } from 'next/server';

// Target: the recon API service (via Traefik or directly)
const RECON_URL = process.env.RECON_SERVICE_URL || process.env.BACKEND_URL || 'http://localhost';

export async function POST(request: NextRequest) {
    const authHeader = request.headers.get('Authorization') || '';

    try {
        // Stream the body directly — no buffering in Next.js
        const body = await request.arrayBuffer();
        const contentType = request.headers.get('content-type') || '';

        const response = await fetch(`${RECON_URL}/api/recon/imports/upload`, {
            method: 'POST',
            headers: {
                'Authorization': authHeader,
                'Content-Type': contentType,
            },
            body: body,
        });

        const data = await response.json().catch(() => ({}));
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('Upload proxy error:', error);
        return NextResponse.json(
            { code: 'PROXY_ERROR', message: 'Gagal meneruskan request upload ke server.' },
            { status: 502 }
        );
    }
}
