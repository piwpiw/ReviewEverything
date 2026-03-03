import { db } from '@/lib/db';

type HealthLevel = 'ok' | 'warn' | 'critical';
type AlertLevel = 'info' | 'warn' | 'critical';

export type OpsAlert = {
  id: string;
  level: AlertLevel;
  source: string;
  title: string;
  detail: string;
  actionPath?: string;
  createdAt: string;
};

export type QualitySnapshot = {
  status: HealthLevel;
  windowHours: number;
  measuredAt: string;
  metrics: {
    ingest: {
      total: number;
      success: number;
      failed: number;
      successRate: number;
    };
    jobs: {
      total: number;
      completed: number;
      failed: number;
      pending: number;
      running: number;
      completionRate: number;
    };
    notifications: {
      total: number;
      sent: number;
      failed: number;
      successRate: number;
      pending: number;
    };
    reminders: {
      total: number;
      created24h: number;
      pending: number;
      sent: number;
      failed: number;
      successRate: number;
    };
    dataFreshness: {
      lastCampaignUpdateAt: string | null;
      ageMinutes: number | null;
    };
  };
  thresholds: {
    ingestSuccessMin: number;
    notificationSuccessMin: number;
    freshnessMaxMinutes: number;
    staleRunningJobMaxMinutes: number;
    reminderPendingMax: number;
  };
  alerts: OpsAlert[];
};

const HOURS_WINDOW = 24;
const THRESHOLDS = {
  ingestSuccessMin: 90,
  notificationSuccessMin: 95,
  freshnessMaxMinutes: 180,
  staleRunningJobMaxMinutes: 30,
  reminderPendingMax: 500,
} as const;

function rate(success: number, total: number): number {
  if (total <= 0) return 100;
  return Number(((success / total) * 100).toFixed(2));
}

function minutesBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / 60000);
}

function buildAlert(
  id: string,
  level: AlertLevel,
  source: string,
  title: string,
  detail: string,
  actionPath?: string,
): OpsAlert {
  return {
    id,
    level,
    source,
    title,
    detail,
    actionPath,
    createdAt: new Date().toISOString(),
  };
}

export async function getQualitySnapshot(): Promise<QualitySnapshot> {
  const now = new Date();
  const since = new Date(now.getTime() - HOURS_WINDOW * 60 * 60 * 1000);
  let runs: Array<{ status: string }> = [];
  let jobs: Array<{ status: string }> = [];
  let deliveries: Array<{ status: string }> = [];
  let latestCampaign: { updated_at: Date } | null = null;
  let staleRunningJobs = 0;

  try {
    [runs, jobs, deliveries, latestCampaign, staleRunningJobs] = await Promise.all([
      db.ingestRun.findMany({
        where: { start_time: { gte: since } },
        select: { status: true },
      }),
      db.backgroundJob.findMany({
        where: { created_at: { gte: since } },
        select: { status: true },
      }),
        db.notificationDelivery.findMany({
        where: { created_at: { gte: since } },
        select: { status: true },
      }),
      db.campaign.findFirst({
        orderBy: { updated_at: 'desc' },
        select: { updated_at: true },
      }),
      db.backgroundJob.count({
        where: {
          status: 'RUNNING',
          started_at: { lt: new Date(now.getTime() - THRESHOLDS.staleRunningJobMaxMinutes * 60000) },
        },
      }),
    ]);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'db_unavailable';
    return {
      status: 'critical',
      windowHours: HOURS_WINDOW,
      measuredAt: now.toISOString(),
      metrics: {
        ingest: { total: 0, success: 0, failed: 0, successRate: 0 },
        jobs: { total: 0, completed: 0, failed: 0, pending: 0, running: 0, completionRate: 0 },
        notifications: { total: 0, sent: 0, failed: 0, pending: 0, successRate: 0 },
        reminders: { total: 0, created24h: 0, pending: 0, sent: 0, failed: 0, successRate: 0 },
        dataFreshness: { lastCampaignUpdateAt: null, ageMinutes: null },
      },
      thresholds: THRESHOLDS,
      alerts: [
        buildAlert(
          'db-fallback-mode',
          'critical',
          'system',
          'DB unavailable: quality metrics in fallback mode',
          `Quality snapshot switched to fallback: ${message}`,
          '/admin',
        ),
      ],
    };
  }

  const ingestTotal = runs.length;
  const ingestSuccess = runs.filter((r) => r.status === 'SUCCESS').length;
  const ingestFailed = runs.filter((r) => r.status === 'FAILED').length;
  const ingestSuccessRate = rate(ingestSuccess, ingestTotal);

  const jobsTotal = jobs.length;
  const jobsCompleted = jobs.filter((j) => j.status === 'COMPLETED').length;
  const jobsFailed = jobs.filter((j) => j.status === 'FAILED').length;
  const jobsPending = jobs.filter((j) => j.status === 'PENDING').length;
  const jobsRunning = jobs.filter((j) => j.status === 'RUNNING').length;
  const jobsCompletionRate = rate(jobsCompleted, jobsTotal);

  const notificationTotal = deliveries.length;
  const notificationSent = deliveries.filter((d) => d.status === 'SENT').length;
  const notificationFailed = deliveries.filter((d) => d.status === 'FAILED').length;
  const notificationPending = deliveries.filter((d) => d.status === 'PENDING').length;
  const notificationSuccessRate = rate(notificationSent, notificationTotal);

  const reminderTotal = deliveries.length;
  const reminderSent = deliveries.filter((d) => d.status === 'SENT').length;
  const reminderFailed = deliveries.filter((d) => d.status === 'FAILED').length;
  const reminderPending = deliveries.filter((d) => d.status === 'PENDING').length;
  const reminderCreated24h = reminderTotal;
  const reminderSuccessRate = rate(reminderSent, reminderTotal);

  const latestUpdateAt = latestCampaign?.updated_at ?? null;
  const freshnessAgeMinutes = latestUpdateAt ? minutesBetween(latestUpdateAt, now) : null;

  const alerts: OpsAlert[] = [];

  if (ingestSuccessRate < THRESHOLDS.ingestSuccessMin) {
    alerts.push(
      buildAlert(
        'ingest-success-rate',
        'warn',
        'ingest',
        'Ingestion success rate below target',
        `Last ${HOURS_WINDOW}h success rate is ${ingestSuccessRate}% (target ${THRESHOLDS.ingestSuccessMin}%+)`,
        '/admin',
      ),
    );
  }

  if (notificationTotal > 0 && notificationSuccessRate < THRESHOLDS.notificationSuccessMin) {
    alerts.push(
      buildAlert(
        'notification-success-rate',
        'warn',
        'notification',
        'Notification success rate below target',
        `Last ${HOURS_WINDOW}h success rate is ${notificationSuccessRate}% (target ${THRESHOLDS.notificationSuccessMin}%+)`,
        '/system',
      ),
    );
  }

  if (reminderPending > THRESHOLDS.reminderPendingMax) {
    alerts.push(
      buildAlert(
        'reminder-queue-backlog',
        'warn',
        'notification',
        'Reminder delivery backlog is high',
        `Pending reminders: ${reminderPending}. Queue threshold: ${THRESHOLDS.reminderPendingMax}.`,
        '/admin',
      ),
    );
  }

  if (freshnessAgeMinutes !== null && freshnessAgeMinutes > THRESHOLDS.freshnessMaxMinutes) {
    alerts.push(
      buildAlert(
        'campaign-freshness',
        'critical',
        'data',
        'Campaign data freshness degraded',
        `Latest campaign update is ${freshnessAgeMinutes} minutes old (limit ${THRESHOLDS.freshnessMaxMinutes}m).`,
        '/admin',
      ),
    );
  }

  if (staleRunningJobs > 0) {
    alerts.push(
      buildAlert(
        'stale-running-jobs',
        'critical',
        'worker',
        'Stale running jobs detected',
        `${staleRunningJobs} job(s) have been RUNNING longer than ${THRESHOLDS.staleRunningJobMaxMinutes} minutes.`,
        '/admin',
      ),
    );
  }

  if (jobsFailed > 0) {
    alerts.push(
      buildAlert(
        'failed-background-jobs',
        'warn',
        'worker',
        'Failed background jobs in last 24h',
        `${jobsFailed} failed background job(s) detected in the last ${HOURS_WINDOW} hours.`,
        '/admin',
      ),
    );
  }

  const status: HealthLevel = alerts.some((a) => a.level === 'critical')
    ? 'critical'
    : alerts.some((a) => a.level === 'warn')
      ? 'warn'
      : 'ok';

  return {
    status,
    windowHours: HOURS_WINDOW,
    measuredAt: now.toISOString(),
    metrics: {
      ingest: {
        total: ingestTotal,
        success: ingestSuccess,
        failed: ingestFailed,
        successRate: ingestSuccessRate,
      },
      jobs: {
        total: jobsTotal,
        completed: jobsCompleted,
        failed: jobsFailed,
        pending: jobsPending,
        running: jobsRunning,
        completionRate: jobsCompletionRate,
      },
      notifications: {
        total: notificationTotal,
        sent: notificationSent,
        failed: notificationFailed,
        pending: notificationPending,
        successRate: notificationSuccessRate,
      },
      reminders: {
        total: reminderTotal,
        created24h: reminderCreated24h,
        pending: reminderPending,
        sent: reminderSent,
        failed: reminderFailed,
        successRate: reminderSuccessRate,
      },
      dataFreshness: {
        lastCampaignUpdateAt: latestUpdateAt ? latestUpdateAt.toISOString() : null,
        ageMinutes: freshnessAgeMinutes,
      },
    },
    thresholds: THRESHOLDS,
    alerts,
  };
}
