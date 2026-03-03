import { executeIngestionTask } from '@/lib/ingest';
import { InitializedAdapters, normalizePlatformKey } from '@/sources/registry';
import { db } from '@/lib/db';
import {
  normalizeDeliveryChannel,
  pickDeliveryChannelWithPreferences,
  dispatchNotificationWithRetry,
} from '@/lib/notificationSender';

type JobType = 'INGEST_PLATFORM' | 'REMINDER_SCAN';
const ADAPTER_NOT_READY_CODE = "ADAPTER_NOT_READY";
const DEFAULT_RATE_LIMIT_BACKOFF_MINUTES = 45;
const DEFAULT_QUALITY_BACKOFF_MINUTES = 180;
const DEFAULT_RETRY_BACKOFF_MINUTES = 5;

const JOB_STALE_MINUTES = 5;
const MAX_RETRY_BACKOFF_MINUTES = 90;
const MAX_RATE_LIMIT_BACKOFF_MINUTES = 180;
type BackgroundJobWithPayload = {
  id: number;
  type: JobType;
  payload: string | null;
  platform_id: number | null;
  attempts: number;
  max_attempts: number;
};

type IngestionPayload = {
  platform_id?: number | string;
};

const DEFAULT_RUN_LIMIT = 12;
const DEFAULT_JOB_CONCURRENCY = parseEnvInt("INGEST_JOB_CONCURRENCY", 4);
const DEFAULT_NOTIFICATION_CONCURRENCY = parseEnvInt("NOTIFICATION_DISPATCH_CONCURRENCY", 6);
const RATE_LIMIT_BACKOFF_MINUTES = parseEnvInt("INGEST_RATE_LIMIT_BACKOFF_MINUTES", DEFAULT_RATE_LIMIT_BACKOFF_MINUTES);
const QUALITY_BACKOFF_MINUTES = parseEnvInt("INGEST_QUALITY_BACKOFF_MINUTES", DEFAULT_QUALITY_BACKOFF_MINUTES);
const BASE_RETRY_MINUTES = parseEnvInt("INGEST_BASE_RETRY_MINUTES", DEFAULT_RETRY_BACKOFF_MINUTES);
const DEFAULT_REMINDER_JOB_CONCURRENCY = parseEnvInt("INGEST_REMINDER_JOB_CONCURRENCY", 2);
const REMINDER_DELIVERY_CREATE_BATCH = parseEnvInt("REMINDER_DELIVERY_CREATE_BATCH", 200);
const REMINDER_DELIVERY_CREATE_CONCURRENCY = parseEnvInt("REMINDER_DELIVERY_CREATE_CONCURRENCY", 2);
const JOB_WEIGHT_DIVISOR = parseEnvInt("INGEST_JOB_WEIGHT_DIVISOR", 4);
const JOB_WEIGHT_MIN = parseEnvInt("INGEST_JOB_WEIGHT_MIN", 1);
const JOB_WEIGHT_MAX = parseEnvInt("INGEST_JOB_WEIGHT_MAX", 4);
const MAX_DUE_SERIAL_DELAY_MINUTES = 10;

type IngestionScope = {
  platformKeys?: string[];
};

function parseEnvInt(name: string, fallback: number) {
  const parsed = Number.parseInt(process.env[name] ?? String(fallback), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function nowWithBuffer(minutes: number) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

function calcRetryBackoffMinutes(attempt: number) {
  const safeAttempt = Math.max(1, Math.min(attempt, 6));
  const expo = 5 * Math.pow(2, safeAttempt - 1);
  return Math.min(MAX_RETRY_BACKOFF_MINUTES, Math.round(expo));
}

function classifyIngestFailureReason(message: string) {
  const normalized = (message || "").toLowerCase();
  if (normalized.includes("page_fetch_retry_exhausted") || normalized.includes("timeout")) return "fetch_retry_exhausted";
  if (normalized.includes("http_429") || normalized.includes("rate_limit") || normalized.includes("retry_after")) return "rate_limit";
  if (normalized.includes("low_valid_item_rate") || normalized.includes("no_upserted_items")) return "quality_gate";
  if (normalized.includes("already_running") || normalized.includes("not found") || normalized.includes("invalid_payload_json")) return "manual_check";
  return "transient";
}

function calcIngestRetryBackoffMinutes(attempt: number, reason: string) {
  if (reason === "rate_limit") {
    return Math.min(
      MAX_RATE_LIMIT_BACKOFF_MINUTES,
      Math.max(RATE_LIMIT_BACKOFF_MINUTES, BASE_RETRY_MINUTES * Math.pow(2, attempt)),
    );
  }
  if (reason === "quality_gate") return QUALITY_BACKOFF_MINUTES;
  return calcRetryBackoffMinutes(attempt);
}

function isRetryableIngestError(message: string) {
  if (!message) return true;
  return classifyIngestFailureReason(message) !== "manual_check" && classifyIngestFailureReason(message) !== "quality_gate";
}

function dateOnly(date: Date): Date {
  return new Date(date.toISOString().slice(0, 10));
}

function parsePayload(job: BackgroundJobWithPayload) {
  if (!job.payload) return {};
  try {
    return JSON.parse(job.payload);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`invalid_payload_json: ${message}`);
  }
}

function resolvePlatformScope(platforms: Array<{ id: number; name: string }>, platformKeys: string[] | undefined) {
  const normalized = (platformKeys || []).map((key) => normalizePlatformKey(key)).filter(Boolean);
  if (normalized.length === 0) return null;

  const allow = new Set(normalized);
  const selected = platforms.filter((platform) => allow.has(normalizePlatformKey(platform.name)));
  if (selected.length === 0) return null;

  return new Set(selected.map((platform) => platform.id));
}


function estimateJobWeight(platformMeta?: { maxPagesPerRun?: number; canRunInParallel?: boolean }) {
  const maxPages = platformMeta?.maxPagesPerRun ?? 1;
  if (platformMeta?.canRunInParallel === false) return 1;
  const divisor = Math.max(1, JOB_WEIGHT_DIVISOR);
  const boundedMin = Math.max(1, JOB_WEIGHT_MIN);
  const boundedMax = Math.max(boundedMin, JOB_WEIGHT_MAX);
  return Math.max(boundedMin, Math.min(Math.ceil(maxPages / divisor), boundedMax));
}

type JobRunDelta = {
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
};

type JobRunOutcome = {
  result: string;
  delta: JobRunDelta;
};

export async function enqueueIngestJobs(scope: IngestionScope = {}) {
  const allPlatforms = await db.platform.findMany({ where: { is_active: true } });
  const scopePlatformIds = resolvePlatformScope(allPlatforms, scope.platformKeys);
  const platforms = scopePlatformIds ? allPlatforms.filter((platform) => scopePlatformIds.has(platform.id)) : allPlatforms;
  if (platforms.length === 0) return [];

  const existing = await db.backgroundJob.findMany({
    where: {
      type: 'INGEST_PLATFORM',
      status: { in: ['PENDING', 'RUNNING'] },
      ...(scopePlatformIds ? { platform_id: { in: Array.from(scopePlatformIds) } } : {}),
    },
    select: { platform_id: true },
  });
  const activePlatformIds = new Set(platforms.map((platform) => platform.id));
  const occupiedPlatformIds = new Set(existing.map((job) => job.platform_id).filter((id): id is number => id !== null));
  const payloads = platforms
    .filter((platform) => activePlatformIds.has(platform.id) && !occupiedPlatformIds.has(platform.id))
    .map((platform) => ({
      type: 'INGEST_PLATFORM',
      platform_id: platform.id,
      payload: JSON.stringify({ platform_id: platform.id }),
      status: 'PENDING' as const,
    }));

  if (payloads.length === 0) return [];

  const result = await db.backgroundJob.createMany({
    data: payloads,
  });

  // createMany only returns count, so return an empty array for compatibility.
  return new Array(result.count).fill(0).map((_, index) => ({
    id: -(index + 1),
  })) as any[];
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

async function runSingleJob(job: BackgroundJobWithPayload, now: Date): Promise<JobRunOutcome> {
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
    },
  });

  const skippedDelta: JobRunDelta = {
    total: 1,
    processed: 1,
    succeeded: 0,
    failed: 0,
    skipped: 1,
  };

  const successDelta: JobRunDelta = {
    total: 1,
    processed: 1,
    succeeded: 1,
    failed: 0,
    skipped: 0,
  };

  const failedDelta: JobRunDelta = {
    total: 1,
    processed: 1,
    succeeded: 0,
    failed: 1,
    skipped: 0,
  };

  if (claimed.count !== 1) {
    return { result: `job:${job.id}:skipped`, delta: skippedDelta };
  }

  try {
    if (job.type === 'INGEST_PLATFORM') {
      const payload = parsePayload(job as BackgroundJobWithPayload) as IngestionPayload;
      const platformId = Number(payload.platform_id);
      if (!Number.isInteger(platformId)) {
        throw new Error(`invalid_platform_id_in_payload:${platformId}`);
      }
      const platform = await db.platform.findUnique({ where: { id: platformId } });
      if (!platform) throw new Error(`platform ${platformId} not found`);

      const adapter = InitializedAdapters[platform.name.toLowerCase()];
      if (!adapter) {
        const err: Error & { code?: string } = new Error(`adapter for ${platform.name} not found`);
        err.code = ADAPTER_NOT_READY_CODE;
        throw err;
      }
      if (adapter.canRunInParallel === false) {
        const runningSibling = await db.backgroundJob.findFirst({
          where: {
            type: 'INGEST_PLATFORM',
            platform_id: platformId,
            status: 'RUNNING',
            NOT: { id: job.id },
          },
        });
        if (runningSibling) {
          await db.backgroundJob.update({
            where: { id: job.id },
            data: {
              status: 'PENDING',
              locked_until: null,
              next_run_at: nowWithBuffer(MAX_DUE_SERIAL_DELAY_MINUTES),
              error_log: `reason=platform_serial_conflict retry_in=${MAX_DUE_SERIAL_DELAY_MINUTES}m`,
            },
          });
          return { result: `job:${job.id}:skipped`, delta: skippedDelta };
        }
      }

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
        error_log: null,
      },
    });

    return { result: `job:${job.id}:ok`, delta: successDelta };
  } catch (error: any) {
    const message = error?.message || String(error);
    const hasRetry =
      error?.code !== ADAPTER_NOT_READY_CODE &&
      isRetryableIngestError(message) &&
      job.attempts + 1 < job.max_attempts;
    const reason = classifyIngestFailureReason(message);
    const retryMinutes = hasRetry ? calcIngestRetryBackoffMinutes(job.attempts + 1, reason) : 0;

    await db.backgroundJob.update({
      where: { id: job.id },
      data: {
        status: hasRetry ? 'PENDING' : 'FAILED',
        error_log: hasRetry ? `reason=${reason} ${message} (retry ${job.attempts + 1}/${job.max_attempts}, +${retryMinutes}m)` : message,
        next_run_at: hasRetry ? nowWithBuffer(retryMinutes) : now,
        locked_until: null,
      },
    });

    return { result: `job:${job.id}:error:${message}`, delta: failedDelta };
  }
}

export async function runJobs(limit = DEFAULT_RUN_LIMIT, scope: IngestionScope = {}) {
  const now = new Date();
  const jobLimit = Math.min(Math.max(limit, 1), 100);
  const reminderJobConcurrency = Math.min(Math.max(DEFAULT_REMINDER_JOB_CONCURRENCY, 1), jobLimit);
  const jobConcurrency = Math.min(Math.max(DEFAULT_JOB_CONCURRENCY, 1), jobLimit);
  const summary = {
    total: 0,
    processed: 0,
    succeeded: 0,
    failed: 0,
    skipped: 0,
  };
  const activePlatforms = await db.platform.findMany({ where: { is_active: true } });
  const scopePlatformIds = resolvePlatformScope(activePlatforms, scope.platformKeys);
  const reminderJobs = await db.backgroundJob.findMany({
    where: {
      status: 'PENDING',
      type: 'REMINDER_SCAN',
      next_run_at: { lte: now },
    },
    orderBy: { created_at: 'asc' },
    take: reminderJobConcurrency,
  });
  const reminderCount = reminderJobs.length;
  const remainingLimit = Math.max(0, jobLimit - reminderCount);
  const ingestWhere: Record<string, unknown> = {
    status: 'PENDING',
    type: 'INGEST_PLATFORM',
    next_run_at: { lte: now },
  };
  if (scopePlatformIds) {
    ingestWhere.platform_id = { in: Array.from(scopePlatformIds) };
  }

  const ingestionJobs = await db.backgroundJob.findMany({
    where: ingestWhere,
    orderBy: { created_at: 'asc' },
    take: remainingLimit,
  });

  const ingestionPlatformIds = Array.from(
    new Set(
      ingestionJobs
        .map((job) => job.platform_id)
        .filter((platformId): platformId is number => Number.isInteger(platformId)),
    ),
  );
  const platformsForIngestion = await db.platform.findMany({
    where: { id: { in: ingestionPlatformIds } },
    select: { id: true, name: true },
  });
  const platformMetaById = new Map(
    platformsForIngestion.map((platform) => {
      const adapter = InitializedAdapters[platform.name.toLowerCase()];
      return [
        platform.id,
        {
          maxPagesPerRun: adapter?.maxPagesPerRun,
          canRunInParallel: adapter?.canRunInParallel,
        },
      ] as const;
    }),
  );

  const prioritizedIngestionJobs = [...ingestionJobs].sort((left, right) => {
    const leftMeta = platformMetaById.get(left.platform_id ?? -1);
    const rightMeta = platformMetaById.get(right.platform_id ?? -1);
    const leftWeight = estimateJobWeight(leftMeta);
    const rightWeight = estimateJobWeight(rightMeta);
    if (leftWeight !== rightWeight) return rightWeight - leftWeight;
    const leftId = left.id;
    const rightId = right.id;
    return leftId - rightId;
  });

  const jobs: BackgroundJobWithPayload[] = [
    ...reminderJobs,
    ...prioritizedIngestionJobs,
  ].slice(0, jobLimit) as BackgroundJobWithPayload[];

  const results: string[] = [];

  const jobsWithWeight = jobs.map((job) => {
    if (job.type !== 'INGEST_PLATFORM') {
      return { job, weight: 1 };
    }

    const platformMeta = platformMetaById.get(job.platform_id ?? -1);
    return { job, weight: estimateJobWeight(platformMeta) };
  });

  for (let cursor = 0; cursor < jobsWithWeight.length;) {
    let usedWeight = 0;
    const batch: BackgroundJobWithPayload[] = [];
    const limitWeight = Math.max(1, jobConcurrency);

    while (cursor < jobsWithWeight.length) {
      const { job, weight } = jobsWithWeight[cursor];
      const slot = Math.max(1, weight);
      if (batch.length > 0 && usedWeight + slot > limitWeight) break;

      batch.push(job);
      usedWeight += slot;
      cursor += 1;

      if (slot > limitWeight) break;
    }

    const outcomes = await Promise.allSettled(
      batch.map((job) => runSingleJob(job, now)),
    );

    for (const outcome of outcomes) {
      if (outcome.status === 'fulfilled') {
        const { result, delta } = outcome.value;
        results.push(result);
        summary.total += delta.total;
        summary.processed += delta.processed;
        summary.succeeded += delta.succeeded;
        summary.failed += delta.failed;
        summary.skipped += delta.skipped;
        continue;
      }

      const message = outcome.reason instanceof Error ? outcome.reason.message : String(outcome.reason);
      results.push(`job:unknown:error:${message}`);
      summary.failed += 1;
      summary.processed += 1;
      summary.total += 1;
    }
  }

  return { results, summary };
}

async function createReminderDeliveries() {
  const now = new Date();
  const day3 = dateOnly(new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000));
  const today = dateOnly(now);

  const targets = await db.userSchedule.findMany({
    where: {
      alarm_enabled: true,
      deadline_date: {
        gte: today,
        lte: day3,
      },
      status: { in: ['APPLIED', 'SELECTED', 'VISIT_PLANNED'] },
    },
    select: {
      id: true,
      user_id: true,
      deadline_date: true,
      user: {
        select: {
          notify_kakao_enabled: true,
          notify_telegram_enabled: true,
          notify_push_enabled: true,
        },
      },
    },
  });

  if (targets.length === 0) return;

  const candidates = [];
  for (const schedule of targets) {
    if (!schedule.deadline_date) continue;

    const deadlineDate = dateOnly(schedule.deadline_date);
    const distanceDays = Math.floor((+deadlineDate - +today) / (1000 * 60 * 60 * 24));
    if (![1, 3].includes(distanceDays)) continue;

    const channel = pickDeliveryChannelWithPreferences({
      kakao: schedule.user.notify_kakao_enabled,
      telegram: schedule.user.notify_telegram_enabled,
      push: schedule.user.notify_push_enabled,
    });
    if (!channel) continue;

    candidates.push({
      user_id: schedule.user_id,
      user_schedule_id: schedule.id,
      channel,
      due_days: distanceDays,
      message: `D-day reminder: ${distanceDays} day(s) before.`,
    });
  }

  if (candidates.length === 0) return;

  const scheduleIds = Array.from(new Set(candidates.map((candidate) => candidate.user_schedule_id)));
  const dueDaySet = Array.from(new Set(candidates.map((candidate) => candidate.due_days)));

  const existingDeliveries = await db.notificationDelivery.findMany({
    where: {
      user_schedule_id: { in: scheduleIds },
      due_days: { in: dueDaySet },
      status: { in: ['SENT', 'PENDING'] },
    },
    select: { user_schedule_id: true, due_days: true },
  });

  const existingSet = new Set(
    existingDeliveries.map((delivery) => `${delivery.user_schedule_id}:${delivery.due_days}`),
  );

  const createRows = candidates
    .filter((candidate) => !existingSet.has(`${candidate.user_schedule_id}:${candidate.due_days}`))
    .map((candidate) => ({
      user_id: candidate.user_id,
      user_schedule_id: candidate.user_schedule_id,
      channel: candidate.channel,
      due_days: candidate.due_days,
      status: 'PENDING' as const,
      message: candidate.message,
    }));

  if (createRows.length === 0) return;

  const chunkSize = Math.max(1, REMINDER_DELIVERY_CREATE_BATCH);
  const concurrency = Math.max(1, REMINDER_DELIVERY_CREATE_CONCURRENCY);
  const batches: typeof createRows[] = [];
  for (let i = 0; i < createRows.length; i += chunkSize) {
    batches.push(createRows.slice(i, i + chunkSize));
  }

  const running: Array<Promise<unknown>> = [];
  for (const batch of batches) {
    running.push(db.notificationDelivery.createMany({ data: batch }));

    if (running.length >= concurrency) {
      await Promise.allSettled(running);
      running.length = 0;
    }
  }

  if (running.length > 0) {
    await Promise.allSettled(running);
  }
}

async function dispatchPendingNotifications() {
  const deliveries = await db.notificationDelivery.findMany({
    where: { status: 'PENDING' },
    orderBy: { created_at: 'asc' },
  });

  const concurrency = Math.max(1, DEFAULT_NOTIFICATION_CONCURRENCY);

  for (let i = 0; i < deliveries.length; i += concurrency) {
    const batch = deliveries.slice(i, i + concurrency);
    await Promise.allSettled(batch.map((delivery) => dispatchNotificationDelivery(delivery)));
  }
}

async function dispatchNotificationDelivery(delivery: {
  id: number;
  user_id: number;
  user_schedule_id: number;
  channel: string;
  message: string | null;
}) {
  const channel = normalizeDeliveryChannel(delivery.channel) || 'push';
  let attemptedChannels: string | null = null;

  try {
    const dispatchResult = await dispatchNotificationWithRetry(channel, {
      userId: delivery.user_id,
      scheduleId: delivery.user_schedule_id,
      message: delivery.message || '',
    });
    attemptedChannels = JSON.stringify(dispatchResult.attemptedChannels);

    if (dispatchResult.ok) {
      await db.notificationDelivery.update({
        where: { id: delivery.id },
        data: {
          status: 'SENT',
          sent_at: new Date(),
          error_message: null,
          channel: dispatchResult.finalChannel,
          attempted_channels: attemptedChannels,
        },
      });
      return;
    }

    throw new Error(dispatchResult.detail || 'notification send failed');
  } catch (error: any) {
    await db.notificationDelivery.update({
      where: { id: delivery.id },
      data: {
        status: 'FAILED',
        error_message: error.message || String(error),
        attempted_channels: attemptedChannels,
      },
    });
  }
}
