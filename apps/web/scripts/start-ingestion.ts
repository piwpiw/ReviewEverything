import ' + "'" + 'dotenv/config' + "'" + ';
import { db } from ' + "'../lib/db'" + ';
import { executeIngestionTask } from ' + "'../lib/ingest'" + ';
import { InitializedAdapters } from ' + "'../sources/registry'" + ';

async function main() {
  console.log(' + "'" + '시작: 모든 활성 플랫폼 병렬 데이터 수집' + "'" + ');

  const platforms = await db.platform.findMany({
    where: { is_active: true },
  });

  console.log(`활성 플랫폼: ${platforms.length}개`);

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
        console.warn(`⚠️ Adapter 없음: ${platform.name}`);
        results.push({ platform: platform.name, success: false, skipped: true });
        continue;
      }

      try {
        const result = await executeIngestionTask(adapter, platform.id);
        if (result.success) {
          console.log(`✅ ${platform.name}: 추가 ${result.added}, 업데이트 ${result.updated}`);
        } else {
          console.error(`❌ ${platform.name}: ${result.reason || result.error}`);
        }
        results.push({ platform: platform.name, success: !!result.success, skipped: false });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`🚨 ${platform.name}: ${message}`);
        results.push({ platform: platform.name, success: false, skipped: false });
      }
    }
  };

  const workers = Array.from({ length: Math.min(CONCURRENCY, platforms.length) }, () => worker());
  await Promise.all(workers);

  const successCount = results.filter((r) => r.success).length;
  const skippedCount = results.filter((r) => r.skipped).length;
  const failedCount = results.length - successCount - skippedCount;
  console.log(`\n완료. 성공: ${successCount}, 실패: ${failedCount}, 스킵: ${skippedCount}`);
}

main().catch((error) => {
  console.error('Fatal error during ingestion:', error);
  process.exit(1);
});