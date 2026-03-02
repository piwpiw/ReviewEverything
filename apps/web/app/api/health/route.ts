import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getEnvironmentMode, getMissingEnvVars, REQUIRED_DB_ENV } from '@/lib/runtimeEnv';

export async function GET(req: NextRequest): Promise<NextResponse> {
    const includeAdapters = req.nextUrl.searchParams.get('adapters') === 'true';

    let dbStatus: 'ok' | 'down' = 'ok';
    let dbError: string | undefined;
    const envMode = getEnvironmentMode();
    const isLocal = envMode !== 'production';
    const missingCritical = getMissingEnvVars(REQUIRED_DB_ENV);

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

    const isHealthy = dbStatus === 'ok' && missingCritical.length === 0;
    const httpStatus = isHealthy || isLocal ? 200 : 503;

    if (!isHealthy && !isLocal) {
        payload.status = 'error';
        payload.message = 'Database and environment verification failed';
        if (dbError) {
            payload.db_error = dbError;
        }
    }

    if (missingCritical.length > 0) {
        payload.status = 'error';
        payload.message = 'Missing critical runtime env vars';
        payload.missing_runtime_env = missingCritical;
    }

    return NextResponse.json(payload, { status: httpStatus });
}
