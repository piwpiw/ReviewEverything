import { NextRequest, NextResponse } from 'next/server';
import { enqueueIngestJobs, enqueueReminderJob, runJobs } from '@/lib/backgroundWorker';

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const [created, reminder] = await Promise.all([
            enqueueIngestJobs(),
            enqueueReminderJob()
        ]);

        const runNow = req.nextUrl.searchParams.get('runNow') === 'true';
        const parsed = Number(req.nextUrl.searchParams.get('limit') || '6');
        const limit = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 100) : 6;
        const runResult = runNow ? await runJobs(limit) : null;

        return NextResponse.json({
            message: 'Cron executed',
            enqueue: {
                ingestJobs: created.length,
                reminderJob: reminder.id ? 1 : 0,
                runNow,
            },
            run: runResult,
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
