import { NextRequest, NextResponse } from 'next/server';
import { enqueueIngestJobs, enqueueReminderJob, runJobs } from '@/lib/backgroundWorker';
import { getMissingEnvVars } from '@/lib/runtimeEnv';
import { getSourceKeysByIngestPhases } from '@/sources/registry';

function parsePhaseTokens(raw: string | null | undefined) {
  if (!raw) return [];
  const normalized = raw.split(',').map((value) => value.trim()).filter(Boolean);
  return normalized.length === 0 ? [] : normalized;
}

function buildPlatformScope(rawPhases: string | null | undefined, rawPlatformKeys: string | null | undefined) {
  if (rawPlatformKeys) {
    const explicit = rawPlatformKeys.split(',').map((value) => value.trim()).filter(Boolean);
    return explicit.length === 0 ? [] : explicit;
  }

  return getSourceKeysByIngestPhases(parsePhaseTokens(rawPhases));
}

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    const missingCritical = getMissingEnvVars();

    if (missingCritical.length > 0) {
        return NextResponse.json({ error: "Cron secret is not configured", missing: missingCritical }, { status: 500 });
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const phases = req.nextUrl.searchParams.get('phases') || req.nextUrl.searchParams.get('phase');
        const platformKeys = buildPlatformScope(phases, req.nextUrl.searchParams.get('platform_keys'));
        const [created, reminder] = await Promise.all([
            enqueueIngestJobs({ platformKeys }),
            enqueueReminderJob()
        ]);

        const runNow = req.nextUrl.searchParams.get('runNow') === 'true';
        const parsed = Number(req.nextUrl.searchParams.get('limit') || '6');
        const limit = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 100) : 6;
        const runResult = runNow ? await runJobs(limit, { platformKeys }) : null;

        return NextResponse.json({
            message: 'Cron executed',
            enqueue: {
                ingestJobs: created.length,
                reminderJob: reminder.id ? 1 : 0,
                runNow,
            },
            run: runResult,
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
