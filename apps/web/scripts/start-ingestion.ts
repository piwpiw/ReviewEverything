import "dotenv/config";
import { db } from "../lib/db";
import { executeIngestionTask } from "../lib/ingest";
import { InitializedAdapters } from "../sources/registry";

async function main() {
  console.log("Starting parallel ingestion for all active platforms...");

  const platforms = await db.platform.findMany({
    where: { is_active: true },
  });

  console.log(`Found ${platforms.length} active platform(s).`);

  const maxConcurrency = Number(process.env.INGEST_MAX_CONCURRENCY || 3);
  const CONCURRENCY = Math.max(1, Number.isNaN(maxConcurrency) ? 3 : maxConcurrency);
  const queue = [...platforms];
  const results: Array<{ platform: string; success: boolean; skipped: boolean }> = [];

  const worker = async () => {
    while (true) {
      const platform = queue.shift();
      if (!platform) return;

      const adapter = InitializedAdapters[platform.name.toLowerCase()];
      if (!adapter) {
        console.warn(`Adapter missing for platform: ${platform.name}`);
        results.push({ platform: platform.name, success: false, skipped: true });
        continue;
      }

      try {
        const result = await executeIngestionTask(adapter, platform.id);
        if (result.success) {
          console.log(`[Ingest Result] ${platform.name}: Added ${result.added}, Updated ${result.updated}`);
        } else {
          console.error(`[Ingest Result] ${platform.name}: ${result.reason || result.error}`);
        }
        results.push({ platform: platform.name, success: !!result.success, skipped: false });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[Ingestion Error] ${platform.name}: ${message}`);
        results.push({ platform: platform.name, success: false, skipped: false });
      }
    }
  };

  const workers = Array.from({ length: Math.min(CONCURRENCY, platforms.length) }, () => worker());
  await Promise.all(workers);

  const successCount = results.filter((r) => r.success).length;
  const skippedCount = results.filter((r) => r.skipped).length;
  const failedCount = results.length - successCount - skippedCount;
  console.log(`\nSummary: Success: ${successCount}, Failed: ${failedCount}, Skipped: ${skippedCount}`);
}

main().catch((error) => {
  console.error('Fatal error during ingestion:', error);
  process.exit(1);
});
