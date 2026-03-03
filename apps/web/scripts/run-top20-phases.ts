import 'dotenv/config';
import { enqueueIngestJobs, enqueueReminderJob, runJobs } from '../lib/backgroundWorker';
import { getSourceKeysByIngestPhases } from '../sources/registry';
import fs from "node:fs/promises";
import path from "node:path";

type RawArgs = Record<string, string | undefined>;

type PhaseResult = {
  phase: string;
  platformKeys: string[];
  enqueued: number;
  runSummary?: {
    results: string[];
    summary: {
      total: number;
      processed: number;
      succeeded: number;
      failed: number;
      skipped: number;
    };
  };
};

const DEFAULT_PHASES = ['A', 'B', 'C'];
const DEFAULT_LIMIT = 12;
const DEFAULT_INTERVAL_MINUTES = 30;
const DEFAULT_ITERATIONS = 1;
const EXIT_GRACE_SECONDS = 5;
const DEFAULT_LOG_FILE = "./logs/top20-runner.log";

function parseArgMap(argv: string[]) {
  const parsed: RawArgs = {};

  argv.forEach((arg) => {
    if (!arg.startsWith('--')) return;
    const [rawKey, rawValue] = arg.replace(/^--/, '').split('=', 2);
    const key = rawKey.trim();
    const value = rawValue !== undefined ? rawValue.trim() : 'true';
    parsed[key] = value;
  });

  return parsed;
}

function parsePhases(raw: string | undefined): string[] {
  if (!raw) return [...DEFAULT_PHASES];
  const parsed = raw
    .split(',')
    .map((value) => value.trim().toUpperCase())
    .filter(Boolean);
  return parsed.length > 0 ? parsed : [...DEFAULT_PHASES];
}

function parsePlatformKeys(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((key) => key.trim().toLowerCase())
    .filter(Boolean);
}

function parsePositiveInt(raw: string | undefined, fallback: number) {
  const parsed = Number.parseInt(raw ?? String(fallback), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function clampRange(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function nowIso() {
  return new Date().toISOString();
}

async function appendLog(logFile: string, message: string) {
  try {
    const dir = path.dirname(logFile);
    await fs.mkdir(dir, { recursive: true });
    await fs.appendFile(logFile, `[${nowIso()}] ${message}\n`, "utf8");
  } catch {
    // Logging must not break ingest run.
  }
}

async function runPhase(phase: string, limit: number, forcedPlatformKeys: string[] = []): Promise<PhaseResult> {
  const platformKeys =
    forcedPlatformKeys.length > 0 ? forcedPlatformKeys : getSourceKeysByIngestPhases([phase]);

  if (platformKeys.length === 0) {
    return {
      phase,
      platformKeys,
      enqueued: 0,
    };
  }

  const jobs = await enqueueIngestJobs({ platformKeys });
  const run = await runJobs(limit, { platformKeys });

  return {
    phase,
    platformKeys,
    enqueued: jobs.length,
    runSummary: {
      results: run.results,
      summary: run.summary,
    },
  };
}

function formatLog(entry: PhaseResult) {
  const keys = entry.platformKeys.length === 0 ? '[]' : `[${entry.platformKeys.join(', ')}]`;
  if (!entry.runSummary) {
    return `phase=${entry.phase} skipped (targets: ${keys})`;
  }

  const { summary } = entry.runSummary;
  return (
    `phase=${entry.phase} ` +
    `targets=${keys} ` +
    `enqueued=${entry.enqueued} ` +
    `processed=${summary.processed} ` +
    `succeeded=${summary.succeeded} ` +
    `failed=${summary.failed} ` +
    `skipped=${summary.skipped}`
  );
}

function summarizePhaseTotals(results: PhaseResult[]) {
  return results.reduce(
    (acc, result) => {
      acc.platforms += result.platformKeys.length;
      acc.enqueued += result.enqueued;

      if (result.runSummary) {
        acc.processed += result.runSummary.summary.processed;
        acc.succeeded += result.runSummary.summary.succeeded;
        acc.failed += result.runSummary.summary.failed;
        acc.skipped += result.runSummary.summary.skipped;
      }

      return acc;
    },
    { platforms: 0, enqueued: 0, processed: 0, succeeded: 0, failed: 0, skipped: 0 },
  );
}

async function main() {
  const args = parseArgMap(process.argv.slice(2));
  const phases = parsePhases(args.phases || args.phase);
  const limit = parsePositiveInt(args.limit, DEFAULT_LIMIT);
  const iterations = parsePositiveInt(args.iterations, DEFAULT_ITERATIONS);
  const durationMinutes = parsePositiveInt(args.durationMinutes, 0);
  const intervalMinutes = clampRange(parsePositiveInt(args.interval, DEFAULT_INTERVAL_MINUTES), 1, 1440);
  const intervalMs = intervalMinutes * 60 * 1000;
  const forcedPlatformKeys = parsePlatformKeys(
    args.platform_keys || args.platformKeys || args.platform_key || args.platformKey,
  );
  const runReminderFirst = String(args.reminder || 'true').toLowerCase() !== 'false';
  const forceInfinite = args.iterations === 'infinite' || iterations <= 0;
  const logFile = args.log_file || args.logFile || DEFAULT_LOG_FILE;

  let stopReason = 'iteration-boundary';
  const stopAt = durationMinutes > 0 ? Date.now() + durationMinutes * 60 * 1000 : Number.MAX_SAFE_INTEGER;
  if (durationMinutes > 0) {
    stopReason = 'duration-boundary';
  }

  if (durationMinutes > 0) {
    console.log(`[top20-runner] duration_minutes=${durationMinutes}, hard stop at ${new Date(stopAt).toISOString()}`);
  }

  if (forceInfinite) {
    console.log('[top20-runner] iterations is set to infinite mode');
  }
  if (runReminderFirst) {
    const reminder = await enqueueReminderJob();
    console.log(`[top20-runner] reminder_scan_enqueued=${reminder ? 1 : 0}`);
    await appendLog(logFile, `reminder_scan_enqueued=${reminder ? 1 : 0}`);
  }

  let cyclesExecuted = 0;
  let totalEnqueued = 0;
  let totalProcessed = 0;
  let totalSucceeded = 0;
  let totalFailed = 0;
  let totalSkipped = 0;
  let isShuttingDown = false;

  const onSigint = () => {
    console.log(`\\n[top20-runner] SIGINT/TERM received. finish current cycle and exit within ${EXIT_GRACE_SECONDS}s.`);
    isShuttingDown = true;
  };
  process.on('SIGINT', onSigint);
  process.on('SIGTERM', onSigint);

  for (let cycle = 1; forceInfinite || cycle <= iterations; cycle += 1) {
    if (Date.now() >= stopAt) {
      stopReason = 'duration-boundary';
      break;
    }

    console.log(`\n[top20-runner] cycle=${cycle} phases=${phases.join(',')} start=${nowIso()} stop-mode=${stopReason}`);
    await appendLog(
      logFile,
      `cycle=${cycle} phases=${phases.join(",")} start=${nowIso()} stop-mode=${stopReason}`,
    );

    const phaseResults = await Promise.all(phases.map((phase) => runPhase(phase, limit, forcedPlatformKeys)));
    const cycleTotals = summarizePhaseTotals(phaseResults);

    for (const phase of phaseResults) {
      console.log(`[top20-runner] ${formatLog(phase)}`);
      await appendLog(logFile, formatLog(phase));
    }
    console.log(
      `[top20-runner] cycle=${cycle} summary ` +
        `platforms=${cycleTotals.platforms} enqueued=${cycleTotals.enqueued} ` +
        `processed=${cycleTotals.processed} succeeded=${cycleTotals.succeeded} ` +
        `failed=${cycleTotals.failed} skipped=${cycleTotals.skipped}`,
    );
    await appendLog(
      logFile,
      `cycle=${cycle} summary platforms=${cycleTotals.platforms} enqueued=${cycleTotals.enqueued} ` +
        `processed=${cycleTotals.processed} succeeded=${cycleTotals.succeeded} ` +
        `failed=${cycleTotals.failed} skipped=${cycleTotals.skipped}`,
    );

    totalEnqueued += cycleTotals.enqueued;
    totalProcessed += cycleTotals.processed;
    totalSucceeded += cycleTotals.succeeded;
    totalFailed += cycleTotals.failed;
    totalSkipped += cycleTotals.skipped;
    cyclesExecuted += 1;

    if (isShuttingDown) {
      console.log('[top20-runner] shutdown requested. stop after current cycle.');
      break;
    }
    if (!forceInfinite && cycle >= iterations) break;
    if (Date.now() >= stopAt) {
      stopReason = 'duration-boundary';
      break;
    }

    console.log(`[top20-runner] waiting ${intervalMinutes}m before next cycle...`);
    await sleep(intervalMs);
  }

  console.log(
    `[top20-runner] done cycles=${cyclesExecuted} stop_reason=${stopReason} ` +
      `totals enqueued=${totalEnqueued} processed=${totalProcessed} ` +
      `succeeded=${totalSucceeded} failed=${totalFailed} skipped=${totalSkipped}`,
  );
  await appendLog(
    logFile,
    `done cycles=${cyclesExecuted} stop_reason=${stopReason} totals ` +
      `enqueued=${totalEnqueued} processed=${totalProcessed} succeeded=${totalSucceeded} ` +
      `failed=${totalFailed} skipped=${totalSkipped}`,
  );
}

main().catch((error) => {
  console.error('[top20-runner] failed', error);
  process.exit(1);
});
