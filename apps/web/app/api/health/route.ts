import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest): Promise<NextResponse> {
    const includeAdapters = req.nextUrl.searchParams.get('adapters') === 'true';

    let dbStatus: 'ok' | 'down' = 'ok';
    let dbError: string | undefined;

    try {
        await db.$queryRaw`SELECT 1`;
    } catch (error: unknown) {
        dbStatus = 'down';
        dbError = error instanceof Error ? error.message : 'database_unavailable';
        console.error('[health] DB check failed:', dbError);
    }

    const payload: Record<string, unknown> = {
        status: dbStatus === 'ok' ? 'ok' : 'error',
        db: dbStatus,
        timestamp: new Date().toISOString(),
        ...(dbError ? { db_error: dbError } : {}),
    };

    if (includeAdapters) {
        try {
            const { checkAllAdapters } = await import('@/sources/scraperHealth');
            const adapters = await checkAllAdapters();
            payload.adapters = adapters;
            payload.adapters_ok = adapters.filter(a => a.status === 'ok').length;
            payload.adapters_warn = adapters.filter(a => a.status === 'warn').length;
            payload.adapters_error = adapters.filter(a => a.status === 'error').length;
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            console.error('[health] adapter check failed:', msg);
            payload.adapters_error_msg = msg;
        }
    }

    const httpStatus = dbStatus === 'ok' ? 200 : 503;
    return NextResponse.json(payload, { status: httpStatus });
}
