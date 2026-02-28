import { db } from "./db";
import { processAndDedupeCampaign } from "@/sources/normalize";
import { IPlatformAdapter } from "@/sources/types";

export async function executeIngestionTask(adapter: IPlatformAdapter, platformId: number) {
    // Creating initial IngestRun Tracking record
    const run = await db.ingestRun.create({
        data: {
            platform_id: platformId,
            status: 'RUNNING'
        }
    });

    let addedCount = 0;
    let updatedCount = 0;

    try {
        // Fetch up to 5 pages for the MVP ingestion run
        for (let page = 1; page <= 5; page++) {
            const results = await adapter.fetchList(page);
            if (!results || results.length === 0) break;

            const promises = results.map(async (item) => {
                const res = await processAndDedupeCampaign(platformId, item);
                if (res.status === 'created') addedCount++;
                else updatedCount++;
            });
            const outcomes = await Promise.allSettled(promises);
            outcomes.forEach((outcome, idx) => {
                if (outcome.status === 'rejected') {
                    console.error(`Error processing item ${results[idx].original_id}:`, outcome.reason);
                }
            });

            // Optional: small delay between pages to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        await db.ingestRun.update({
            where: { id: run.id },
            data: {
                status: 'SUCCESS',
                end_time: new Date(),
                records_added: addedCount,
                records_updated: updatedCount
            }
        });
        return { success: true, run_id: run.id, added: addedCount, updated: updatedCount };
    } catch (e: any) {
        await db.ingestRun.update({
            where: { id: run.id },
            data: {
                status: 'FAILED',
                end_time: new Date(),
                error_log: e.message || String(e)
            }
        });
        return { success: false, run_id: run.id, error: e.message };
    }
}
