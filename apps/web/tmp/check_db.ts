import 'dotenv/config';
import { db } from '../lib/db';

async function check() {
  try {
    const platforms = await db.platform.findMany();
    console.log('--- Platforms ---', platforms.length);
    
    const campaignsCount = await db.campaign.count();
    console.log('--- Campaigns ---', campaignsCount);

    const snapshotCount = await db.campaignSnapshot.count();
    console.log('--- Snapshots ---', snapshotCount);

    const statsCount = await db.platformStats.count();
    console.log('--- Stats ---', statsCount);
  } catch (e: any) {
    console.error('Error connecting to DB:', e.message);
  } finally {
    await db.$disconnect();
  }
}
check();
