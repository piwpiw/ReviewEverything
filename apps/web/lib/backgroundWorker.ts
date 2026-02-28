import { executeIngestionTask } from '@/lib/ingest';
import { InitializedAdapters } from '@/sources/registry';
import { db } from '@/lib/db';
import { dispatchNotification, normalizeDeliveryChannel } from '@/lib/notificationSender';

type JobType = 'INGEST_PLATFORM' | 'REMINDER_SCAN';

const JOB_STALE_MINUTES = 5;
type BackgroundJobWithPayload = {
  id: number;
  type: JobType;
  payload: string | null;
  platform_id: number | null;
  attempts: number;
  max_attempts: number;
};

const DEFAULT_RUN_LIMIT = 6;

function nowWithBuffer(minutes: number) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

function dateOnly(date: Date): Date {
  return new Date(date.toISOString().slice(0, 10));
}

function parsePayload(job: BackgroundJobWithPayload) {
  return job.payload ? JSON.parse(job.payload) : {};
}

export async function enqueueIngestJobs() {
  const platforms = await db.platform.findMany({ where: { is_active: true } });
  const created: any[] = [];

  for (const platform of platforms) {
    const exists = await db.backgroundJob.findFirst({
      where: {
        type: 'INGEST_PLATFORM',
        platform_id: platform.id,
        status: { in: ['PENDING', 'RUNNING'] },
      },
    });

    if (exists) continue;

    created.push(
      await db.backgroundJob.create({
        data: {
          type: 'INGEST_PLATFORM',
          platform_id: platform.id,
          payload: JSON.stringify({ platform_id: platform.id }),
          status: 'PENDING',
        },
      }),
    );
  }

  return created;
}

export async function enqueueReminderJob() {
  const exists = await db.backgroundJob.findFirst({
    where: {
      type: 'REMINDER_SCAN',
      status: { in: ['PENDING', 'RUNNING'] },
    },
  });

  if (exists) return exists;

  return db.backgroundJob.create({
    data: {
      type: 'REMINDER_SCAN',
      payload: JSON.stringify({ reason: 'scheduler_9am' }),
      status: 'PENDING',
    },
  });
}

export async function runJobs(limit = DEFAULT_RUN_LIMIT) {
  const now = new Date();
  const summary = {
    total: 0,
    processed: 0,
    succeeded: 0,
    failed: 0,
    skipped: 0,
  };

  const jobs = await db.backgroundJob.findMany({
    where: {
      status: 'PENDING',
      next_run_at: { lte: now },
    },
    orderBy: { created_at: 'asc' },
    take: limit,
  });

  const results: string[] = [];

  for (const job of jobs) {
    const claimed = await db.backgroundJob.updateMany({
      where: {
        id: job.id,
        status: 'PENDING',
        OR: [{ locked_until: null }, { locked_until: { lte: now } }],
      },
      data: {
        status: 'RUNNING',
        attempts: job.attempts + 1,
        started_at: now,
        locked_until: nowWithBuffer(JOB_STALE_MINUTES),
        locked_by: `worker-${process.pid}`,
        updated_at: now,
      },
    });

    if (claimed.count !== 1) {
      results.push(`job:${job.id}:skipped`);
      summary.skipped += 1;
      summary.total += 1;
      continue;
    }

    try {
      if (job.type === 'INGEST_PLATFORM') {
        const payload = parsePayload(job as BackgroundJobWithPayload);
        const platformId = Number(payload.platform_id);
        const platform = await db.platform.findUnique({ where: { id: platformId } });
        if (!platform) throw new Error(`platform ${platformId} not found`);

        const adapter = InitializedAdapters[platform.name.toLowerCase()];
        if (!adapter) throw new Error(`adapter for ${platform.name} not found`);

        const result = await executeIngestionTask(adapter, platformId);
        if (!result.success) throw new Error(result.reason || result.error || 'ingest failed');
      }

      if (job.type === 'REMINDER_SCAN') {
        await createReminderDeliveries();
        await dispatchPendingNotifications();
      }

      await db.backgroundJob.update({
        where: { id: job.id },
        data: {
          status: 'COMPLETED',
          finished_at: new Date(),
          locked_until: null,
          updated_at: new Date(),
          error_log: null,
        },
      });

      results.push(`job:${job.id}:ok`);
      summary.succeeded += 1;
      summary.processed += 1;
      summary.total += 1;
    } catch (error: any) {
      summary.failed += 1;
      summary.processed += 1;
      summary.total += 1;
      const hasRetry = job.attempts + 1 < job.max_attempts;
      await db.backgroundJob.update({
        where: { id: job.id },
        data: {
          status: hasRetry ? 'PENDING' : 'FAILED',
          error_log: error.message || String(error),
          next_run_at: hasRetry ? nowWithBuffer(15) : now,
          locked_until: null,
          updated_at: new Date(),
        },
      });
      results.push(`job:${job.id}:error:${error.message || 'unknown'}`);
    }
  }

  return { results, summary };
}

async function createReminderDeliveries() {
  const now = new Date();
  const day1 = new Date(now);
  day1.setDate(now.getDate() + 1);
  const day3 = new Date(now);
  day3.setDate(now.getDate() + 3);

  const targets = await db.userSchedule.findMany({
    where: {
      alarm_enabled: true,
      deadline_date: {
        gte: dateOnly(now),
        lte: dateOnly(day3),
      },
      status: { in: ['APPLIED', 'SELECTED', 'VISIT_PLANNED'] },
    },
    select: {
      id: true,
      user_id: true,
      deadline_date: true,
    },
  });

  for (const schedule of targets) {
    if (!schedule.deadline_date) continue;

    const distanceDays = Math.floor((+new Date(schedule.deadline_date) - +now) / (1000 * 60 * 60 * 24));
    if (![1, 3].includes(distanceDays)) continue;

    const exists = await db.notificationDelivery.findFirst({
      where: {
        user_id: schedule.user_id,
        user_schedule_id: schedule.id,
        due_days: distanceDays,
        status: { in: ['SENT', 'PENDING'] },
      },
    });

    if (exists) continue;

    await db.notificationDelivery.create({
      data: {
        user_id: schedule.user_id,
        user_schedule_id: schedule.id,
        channel: 'push',
        due_days: distanceDays,
        status: 'PENDING',
        message: `D-day reminder: ${distanceDays} day(s) before.`,
      },
    });
  }
}

async function dispatchPendingNotifications() {
  const deliveries = await db.notificationDelivery.findMany({
    where: { status: 'PENDING' },
    orderBy: { created_at: 'asc' },
  });

  for (const delivery of deliveries) {
    try {
      const channel = normalizeDeliveryChannel(delivery.channel) || 'push';
      const result = await dispatchNotification(channel, {
        userId: delivery.user_id,
        scheduleId: delivery.user_schedule_id,
        message: delivery.message || '',
      });

      if (!result.ok) throw new Error(result.detail || 'notification send failed');

      await db.notificationDelivery.update({
        where: { id: delivery.id },
        data: {
          status: 'SENT',
          sent_at: new Date(),
          error_message: null,
        },
      });
    } catch (error: any) {
      await db.notificationDelivery.update({
        where: { id: delivery.id },
        data: {
          status: 'FAILED',
          error_message: error.message || String(error),
        },
      });
    }
  }
}
