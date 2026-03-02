import 'dotenv/config';
import { db } from '../lib/db';
import { executeIngestionTask } from '../lib/ingest';
import { InitializedAdapters } from '../sources/registry';

async function main() {
  console.log('🚀 Starting full ingestion for all active platforms...');
  
  const platforms = await db.platform.findMany({
    where: { is_active: true }
  });

  console.log(`📡 Found ${platforms.length} active platforms.`);

  for (const platform of platforms) {
    const adapter = InitializedAdapters[platform.name.toLowerCase()];
    if (!adapter) {
      console.warn(`⚠️ No adapter found for platform: ${platform.name}`);
      continue;
    }

    console.log(`\n--- Processing ${platform.name} ---`);
    try {
      const result = await executeIngestionTask(adapter, platform.id);
      if (result.success) {
        console.log(`✅ Success: Added ${result.added}, Updated ${result.updated}`);
      } else {
        console.error(`❌ Failed: ${result.reason || result.error}`);
      }
    } catch (error: any) {
      console.error(`💥 Critical failure for ${platform.name}:`, error.message);
    }
  }

  console.log('\n✨ Ingestion cycle complete.');
}

main().catch(error => {
  console.error('Fatal error during ingestion:', error);
  process.exit(1);
});
