import { db } from "./db";
import { processAndDedupeCampaign } from "@/sources/normalize";
import { IPlatformAdapter, ScrapedCampaign } from "@/sources/types";
import { extractFetchFailureCode } from "@/lib/fetcher";

const parseEnvInt = (value: string | undefined, fallback: number) => {
    const parsed = Number.parseInt(value ?? String(fallback), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const MAX_CONSECUTIVE_EMPTY_PAGES = parseEnvInt(process.env.INGEST_MAX_EMPTY_PAGES, 3);
const MAX_PAGES_PER_RUN = parseEnvInt(process.env.INGEST_MAX_PAGES_PER_RUN, 100);
const CHUNK_SIZE = parseEnvInt(process.env.INGEST_CHUNK_SIZE, 16);
const ACTIVE_RUN_STALE_MINUTES = 45;
const PAGE_STAGGER_MS = parseEnvInt(process.env.INGEST_PAGE_STAGGER_MS, 1000);
const MIN_VALID_ITEM_RATE = Math.min(
    Math.max(parseEnvInt(process.env.INGEST_MIN_VALID_ITEM_RATE, 65), 0),
    100,
);
const MAX_CONSECUTIVE_FETCH_ERRORS = parseEnvInt(process.env.INGEST_MAX_CONSECUTIVE_FETCH_ERRORS, 3);
const PAGE_TIMEOUT_MS = parseEnvInt(process.env.INGEST_PAGE_TIMEOUT_MS, 60_000);
const MAX_ITEM_RETRIES = 3;
const MIN_EMPTY_DUPS_TO_STOP = parseEnvInt(process.env.INGEST_EMPTY_DUPS_STOP_THRESHOLD, 3);

function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
    return Promise.race([
        promise,
        new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`page_timeout_${timeoutMs}ms`)), timeoutMs)
        ),
    ]) as Promise<T>;
}

function buildRunLog(parts: Array<string | undefined>) {
    return parts.filter(Boolean).join(" | ");
}

function toFailureLabel(error: unknown) {
    if (error instanceof Error) return `${error.name}: ${error.message}`;
    return String(error);
}

function normalizeDedupeKey(raw: string | undefined) {
    const normalized = raw ? raw.trim().toLowerCase() : "";
    if (!normalized) return "";
    return normalized.split(/[?#]/)[0].replace(/\/+$/, "");
}

function recordFailure(map: Map<string, number>, key: string) {
    map.set(key, (map.get(key) ?? 0) + 1);
}

function buildFailureBucketsLine(buckets: Map<string, number>) {
    if (buckets.size === 0) return "No fetch failures";
    return `Fetch failure buckets: ${Array.from(buckets.entries())
        .map(([reason, count]) => `${reason}=${count}`)
        .join(", ")}`;
}

function classifyRunFailure(error: unknown) {
    const message = toFailureLabel(error).toLowerCase();
    if (message.includes("page_fetch_retry_exhausted")) return "page_fetch_retry_exhausted";
    if (message.includes("no_upserted_items")) return "no_upserted_items";
    if (message.includes("low_valid_item_rate")) return "low_valid_item_rate";
    if (message.includes("timeout")) return "page_timeout";
    if (message.includes("payload")) return "invalid_payload";
    return "unknown_runtime";
}

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
    let pagesScraped = 0;
    let invalidItems = 0;
    let failedPages = 0;
    let duplicateItems = 0;
    let consecutiveFetchErrors = 0;
    let processErrors = 0;
    let consecutiveDuplicatePages = 0;
    const seenItemKeys = new Set<string>();
    const fetchFailureBuckets = new Map<string, number>();

    try {
        const configuredPages = adapter.maxPagesPerRun ?? MAX_PAGES_PER_RUN;

        for (let page = 1; page <= configuredPages; page++) {
            console.log(`[Ingest] Processing platform ${platformId}, page ${page}...`);

            let results: any[];
            try {
                results = await withTimeout(adapter.fetchList(page), PAGE_TIMEOUT_MS);
                pagesScraped += 1;
                consecutiveDuplicatePages = 0;
                consecutiveFetchErrors = 0;
            } catch (error: unknown) {
                const fetchReason = extractFetchFailureCode(error);
                recordFailure(fetchFailureBuckets, fetchReason);
                failedPages += 1;
                consecutiveFetchErrors += 1;
                processErrors += 1;
                console.error(`[Ingest] Page ${page} failed for platform ${platformId}:`, error);
                if (consecutiveFetchErrors >= MAX_CONSECUTIVE_FETCH_ERRORS) {
                    throw new Error(`page_fetch_retry_exhausted:${consecutiveFetchErrors}`);
                }
                if (failedPages >= MAX_ITEM_RETRIES) {
                    throw error;
                }
                continue;
            }

            if (!results || results.length === 0) {
                emptyRunCount++;
                consecutiveDuplicatePages += 1;
                console.log(`[Ingest] No results for platform ${platformId} at page ${page}. emptyCount=${emptyRunCount}`);
                if (emptyRunCount >= MAX_CONSECUTIVE_EMPTY_PAGES) {
                    console.log(`[Ingest] Stopping platform ${platformId} after ${emptyRunCount} consecutive empty pages.`);
                    break;
                }
                if (consecutiveDuplicatePages >= MIN_EMPTY_DUPS_TO_STOP) {
                    console.log(`[Ingest] Stopping platform ${platformId} after duplicate/no-op pages.`);
                    break;
                }
                continue;
            }
            emptyRunCount = 0;

            const deduped = results
                .filter((item): item is ScrapedCampaign => Boolean(item && typeof item === "object"))
                .filter((item) => {
                    const originalId = String(item.original_id || "").trim();
                    const rawUrl = String(item.url || "").trim();
                    const dedupeKey = originalId
                      ? `id:${originalId}`
                      : rawUrl ? `url:${normalizeDedupeKey(rawUrl)}` : "";

                    if (!dedupeKey) return false;
                    if (seenItemKeys.has(dedupeKey)) {
                        duplicateItems += 1;
                        return false;
                    }
                    seenItemKeys.add(dedupeKey);
                    return true;
                });

            totalItems += deduped.length;
            const validItems = deduped.filter((item) => Boolean(item?.url) && Boolean(item?.title));
            invalidItems += deduped.length - validItems.length;

            if (validItems.length === 0) {
                consecutiveDuplicatePages += 1;
                continue;
            }
            consecutiveDuplicatePages = 0;

            const validRate = deduped.length > 0 ? (validItems.length / deduped.length) * 100 : 0;
            if (validRate < MIN_VALID_ITEM_RATE) {
                console.warn(
                    `[Ingest] platform ${platformId} low valid rate: page=${page}, valid=${validItems.length}/${deduped.length} (${validRate.toFixed(1)}%)`,
                );
            }

            // Use chunked parallel processing to avoid DB connection exhaustion
            for (let i = 0; i < validItems.length; i += CHUNK_SIZE) {
                const chunk = validItems.slice(i, i + CHUNK_SIZE);
                const outcomes = await Promise.allSettled(
                    chunk.map(item => processAndDedupeCampaign(platformId, item))
                );

                outcomes.forEach((outcome) => {
                    if (outcome.status === 'fulfilled') {
                        if (outcome.value.status === 'created') addedCount++;
                        else updatedCount++;
                    } else {
                        processErrors += 1;
                        console.error(`[Ingest] Error processing item:`, outcome.reason);
                    }
                });
            }

            // Stagger page requests to avoid rate limiting
            await new Promise((resolve) => setTimeout(resolve, PAGE_STAGGER_MS));
        }

        const validRateTotal = totalItems > 0 ? ((totalItems - invalidItems) / totalItems) * 100 : 100;
        const hasRecoveredData = addedCount > 0 || updatedCount > 0;
        if (pagesScraped > 0 && !hasRecoveredData && totalItems === 0) {
            throw new Error("no_upserted_items");
        }

        if (validRateTotal < MIN_VALID_ITEM_RATE && invalidItems > 0) {
            await db.ingestRun.update({
                where: { id: run.id },
                data: {
                    status: 'FAILED',
                    end_time: new Date(),
                    records_added: addedCount,
                    records_updated: updatedCount,
                    error_log: buildRunLog([
                    `Pages: ${pagesScraped}`,
                    `Total items: ${totalItems}`,
                    `Invalid: ${invalidItems}`,
                    `Duplicates skipped: ${duplicateItems}`,
                    buildFailureBucketsLine(fetchFailureBuckets),
                    `Process failures: ${processErrors}`,
                    `Valid item rate: ${validRateTotal.toFixed(1)}%`,
                    `Error: low_quality_data_rate`,
                ]),
                },
            });
            return { success: false, run_id: run.id, error: "low_valid_item_rate" };
        }

        await db.ingestRun.update({
            where: { id: run.id },
            data: {
                status: 'SUCCESS',
                end_time: new Date(),
                records_added: addedCount,
                records_updated: updatedCount,
                error_log: buildRunLog([
                    `Pages: ${pagesScraped}`,
                `Total items: ${totalItems}`,
                `Invalid: ${invalidItems}`,
                `Duplicates skipped: ${duplicateItems}`,
                buildFailureBucketsLine(fetchFailureBuckets),
                `Process failures: ${processErrors}`,
                `Added: ${addedCount}`,
                `Updated: ${updatedCount}`,
                failedPages ? `Failed pages: ${failedPages}` : undefined,
            ]),
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
                error_log: buildRunLog([
                    `Error: ${toFailureLabel(e)}`,
                    `Failure class: ${classifyRunFailure(e)}`,
                    `Pages: ${pagesScraped}`,
                    `Total items: ${totalItems}`,
                    `Invalid: ${invalidItems}`,
                    `Duplicates skipped: ${duplicateItems}`,
                    buildFailureBucketsLine(fetchFailureBuckets),
                    `Process failures: ${processErrors}`,
                    `Consecutive fetch errors: ${consecutiveFetchErrors}`,
                    `Reason: ${error.message}`,
                ]),
            }
        });
        return { success: false, run_id: run.id, error: error.message };
    }
}
