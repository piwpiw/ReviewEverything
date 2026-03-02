import "dotenv/config";
import { db } from "../lib/db";
import { executeIngestionTask } from "../lib/ingest";
import { InitializedAdapters, PLATFORM_CATALOG } from "../sources/registry";

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
  const catalogMap = new Map(PLATFORM_CATALOG.map((platform) => [platform.name.toLowerCase(), platform]));
  const readySet = new Set(Object.keys(InitializedAdapters).map((name) => name.toLowerCase()));

  const worker = async () => {
    while (true) {
      const platform = queue.shift();
      if (!platform) return;

      const adapter = InitializedAdapters[platform.name.toLowerCase()];
      if (!adapter) {
        const catalog = catalogMap.get(platform.name.toLowerCase());
        if (catalog?.is_active) {
          console.warn(`[Ingest] Adapter missing for active platform: ${platform.name}`);
        } else {
          console.log(`[Ingest] Platform is currently inactive in catalog: ${platform.name}`);
        }
        results.push({ platform: platform.name, success: false, skipped: true });
        continue;
      }

      const catalogMeta = catalogMap.get(platform.name.toLowerCase());
      if (!readySet.has(platform.name.toLowerCase())) {
        console.warn(`[Ingest] Adapter not registered in registry map anymore: ${platform.name}`);
        results.push({ platform: platform.name, success: false, skipped: true });
        continue;
      }

      if (catalogMeta && !catalogMeta.is_active) {
        console.log(`[Ingest] Catalog marks inactive for ${platform.name}, skip run.`);
        results.push({ platform: platform.name, success: false, skipped: true });
        continue;
      }

      try {
        const startTime = Date.now();
        const result = await executeIngestionTask(adapter, platform.id);
        const duration = (Date.now() - startTime) / 1000;

        if (result.success) {
          console.log(`[Ingest SUCCESS] ${platform.name}: Added ${result.added}, Updated ${result.updated} (Took ${duration}s)`);
        } else {
          console.error(`[Ingest FAILED] ${platform.name}: ${result.reason || result.error} (Took ${duration}s)`);
        }
        results.push({ platform: platform.name, success: !!result.success, skipped: false });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[Ingest CRITICAL] ${platform.name}: ${message}`);
        results.push({ platform: platform.name, success: false, skipped: false });
      }
    }
  };

  const startTimeAll = Date.now();
  const workers = Array.from({ length: Math.min(CONCURRENCY, platforms.length) }, () => worker());
  await Promise.all(workers);

  const totalDuration = (Date.now() - startTimeAll) / 1000;
  const successCount = results.filter((r) => r.success).length;
  const skippedCount = results.filter((r) => r.skipped).length;
  const failedCount = results.length - successCount - skippedCount;

  console.log(`\n================================`);
  console.log(`Ingestion Summary Log`);
  console.log(`Total Time: ${totalDuration}s`);
  console.log(`Success: ${successCount}`);
  console.log(`Failed: ${failedCount}`);
  console.log(`Skipped: ${skippedCount}`);
  console.log(`================================\n`);
}

main().catch((error) => {
  console.error('Fatal error during ingestion:', error);
  process.exit(1);
});
