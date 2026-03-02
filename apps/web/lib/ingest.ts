import { db } from "./db";
import { processAndDedupeCampaign } from "@/sources/normalize";
import { IPlatformAdapter } from "@/sources/types";

const parseEnvInt = (value: string | undefined, fallback: number) => {
    const parsed = Number.parseInt(value ?? String(fallback), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const MAX_PAGES_PER_RUN = parseEnvInt(process.env.INGEST_MAX_PAGES_PER_RUN, 100);
const CHUNK_SIZE = parseEnvInt(process.env.INGEST_CHUNK_SIZE, 16);
const ACTIVE_RUN_STALE_MINUTES = 45;

export async function isPlatformCurrentlyInProgress(platformId: number): Promise<boolean> {
    const cutoff = new Date(Date.now() - ACTIVE_RUN_STALE_MINUTES * 60 * 1000);

    const running = await db.ingestRun.findFirst({
        where: {
            platform_id: platformId,
            status: 'RUNNING',
            start_time: { gte: cutoff }
        }
    });

    return Boolean(running);
}

export async function cleanupStaleRuns() {
    const cutoff = new Date(Date.now() - ACTIVE_RUN_STALE_MINUTES * 60 * 1000);

    try {
        const result = await db.ingestRun.updateMany({
            where: {
                status: 'RUNNING',
                start_time: { lt: cutoff }
            },
            data: {
                status: 'FAILED',
                end_time: new Date(),
                error_log: `Force terminated: Stale run detected (exceeded ${ACTIVE_RUN_STALE_MINUTES}m)`
            }
        });
        if (result.count > 0) {
            console.log(`[Ingest] Cleaned up ${result.count} stale runs.`);
        }
    } catch (error) {
        console.error("[Ingest] Failed to cleanup stale runs:", error);
    }
}

/**
 * Enhanced task executor to handle more pages and better logging.
 * In production, this would probably use a queue (BullMQ/SQS).
 */
export async function executeIngestionTask(adapter: IPlatformAdapter, platformId: number) {
    // Maintenance first
    await cleanupStaleRuns();

    if (await isPlatformCurrentlyInProgress(platformId)) {
        console.log(`[Ingest] Skip platform ${platformId}: already running`);
        return { success: false, reason: "already_running", platformId };
    }

    const run = await db.ingestRun.create({
        data: {
            platform_id: platformId,
            status: 'RUNNING'
        }
    });

    let addedCount = 0;
    let updatedCount = 0;
    let totalItems = 0;
    let emptyRunCount = 0;

    try {
        // Broaden range for full implementation (up to configured pages)
        for (let page = 1; page <= MAX_PAGES_PER_RUN; page++) {
            console.log(`[Ingest] Processing platform ${platformId}, page ${page}...`);
            const results = await adapter.fetchList(page);

            if (!results || results.length === 0) {
                emptyRunCount++;
                console.log(`[Ingest] No results for platform ${platformId} at page ${page}. emptyCount=${emptyRunCount}`);
                if (emptyRunCount >= 3) {
                    console.log(`[Ingest] Stopping platform ${platformId} after ${emptyRunCount} consecutive empty pages.`);
                    break;
                }
                continue;
            }
            emptyRunCount = 0;

            totalItems += results.length;

            // Use chunked parallel processing to avoid DB connection exhaustion
            for (let i = 0; i < results.length; i += CHUNK_SIZE) {
                const chunk = results.slice(i, i + CHUNK_SIZE);
                const outcomes = await Promise.allSettled(
                    chunk.map(item => processAndDedupeCampaign(platformId, item))
                );

                outcomes.forEach((outcome) => {
                    if (outcome.status === 'fulfilled') {
                        if (outcome.value.status === 'created') addedCount++;
                        else updatedCount++;
                    } else {
                        console.error(`[Ingest] Error processing item:`, outcome.reason);
                    }
                });
            }

            // Stagger page requests to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        await db.ingestRun.update({
            where: { id: run.id },
            data: {
                status: 'SUCCESS',
                end_time: new Date(),
                records_added: addedCount,
                records_updated: updatedCount,
                error_log: `Processed ${totalItems} items. ${addedCount} new, ${updatedCount} updated.`
            }
        });

        console.log(`[Ingest] Finished platform ${platformId}. Added: ${addedCount}, Updated: ${updatedCount}`);
        return { success: true, run_id: run.id, added: addedCount, updated: updatedCount };
    } catch (e: unknown) {
        const error = e as Error;
        console.error(`[Ingest] CRITICAL FAILURE for platform ${platformId}:`, error);
        await db.ingestRun.update({
            where: { id: run.id },
            data: {
                status: 'FAILED',
                end_time: new Date(),
                error_log: error.message || String(error)
            }
        });
        return { success: false, run_id: run.id, error: error.message };
    }
}
