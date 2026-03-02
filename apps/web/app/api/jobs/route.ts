import { NextRequest, NextResponse } from "next/server";
import { enqueueIngestJobs, enqueueReminderJob, runJobs } from "@/lib/backgroundWorker";
import { getMissingEnvVars } from "@/lib/runtimeEnv";

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

    const runNow = String(runNowRaw).toLowerCase() === "true" ? true : runNowRaw === true;
    const parsedLimit = Number.parseInt(String(limitRaw ?? "6"), 10);
    const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 100) : 6;

    const [ingestJobs, reminderJob] = await Promise.all([
      enqueueIngestJobs(),
      enqueueReminderJob(),
    ]);

    const run = runNow ? await runJobs(limit) : null;

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
