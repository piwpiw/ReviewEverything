import { NextRequest, NextResponse } from "next/server";
import { enqueueIngestJobs, enqueueReminderJob, runJobs } from "@/lib/backgroundWorker";
import { getMissingEnvVars } from "@/lib/runtimeEnv";
import { getSourceKeysByIngestPhases } from '@/sources/registry';

function parsePhaseTokens(raw: unknown) {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.flatMap((item) => String(item).split(',').map((phase) => phase.trim())).filter(Boolean);
  }
  return String(raw).split(',').map((phase) => phase.trim()).filter(Boolean);
}

function buildPlatformScope(rawPhases: unknown, rawPlatformKeys: unknown) {
  if (rawPlatformKeys) {
    const explicit = Array.isArray(rawPlatformKeys)
      ? rawPlatformKeys.flatMap((item) => String(item).split(','))
      : String(rawPlatformKeys).split(',');
    const parsed = explicit.map((key) => key.trim()).filter(Boolean);
    return parsed.length > 0 ? parsed : [];
  }
  return getSourceKeysByIngestPhases(parsePhaseTokens(rawPhases));
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const missingCritical = getMissingEnvVars(["CRON_SECRET"]);

  if (missingCritical.length > 0) {
    return NextResponse.json(
      { error: "Cron secret is not configured", missing: missingCritical },
      { status: 500 },
    );
  }

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
        const body = await req.json().catch(() => ({}));
        const runNowRaw = body?.runNow;
        const limitRaw = body?.limit;
        const platformKeys = buildPlatformScope(body?.phases || body?.phase, body?.platform_keys);

        const runNow = String(runNowRaw).toLowerCase() === "true" ? true : runNowRaw === true;
        const parsedLimit = Number.parseInt(String(limitRaw ?? "6"), 10);
        const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 100) : 6;

        const [ingestJobs, reminderJob] = await Promise.all([
      enqueueIngestJobs({ platformKeys }),
      enqueueReminderJob(),
    ]);

        const run = runNow ? await runJobs(limit, { platformKeys }) : null;

    return NextResponse.json({
      message: "Jobs enqueued",
      enqueue: {
        ingestJobs: ingestJobs.length,
        reminderJob: reminderJob?.id ? 1 : 0,
      },
      run,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
