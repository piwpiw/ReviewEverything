import 'dotenv/config';
import { db } from '../lib/db';

const PLATFORMS = [
  { name: 'Revu', baseUrl: 'https://www.revu.net', is_active: true },
  { name: 'Reviewnote', baseUrl: 'https://www.reviewnote.co.kr', is_active: true },
  { name: 'DinnerQueen', baseUrl: 'https://dinnerqueen.net', is_active: true },
  { name: 'ReviewPlace', baseUrl: 'https://www.reviewplace.co.kr', is_active: true },
  { name: 'MrBlog', baseUrl: 'https://www.mrblog.net', is_active: true },
  { name: 'SeoulOppa', baseUrl: 'https://seouloppa.com', is_active: false },
  { name: 'GangnamFood', baseUrl: 'https://gangnamfood.net', is_active: false },
];

async function main() {
  console.log('🛠️ Synchronizing platform metadata in DB...');
  
  for (const p of PLATFORMS) {
    try {
      const platform = await db.platform.upsert({
        where: { name: p.name },
        update: { base_url: p.baseUrl, is_active: p.is_active },
        create: { name: p.name, base_url: p.baseUrl, is_active: p.is_active }
      });
      console.log(`✅ ${p.is_active ? 'Active' : 'Inactive'} platform ready: ${platform.name}`);
    } catch (error: any) {
      console.error(`❌ Failed to sync platform ${p.name}:`, error.message);
    }
  }

  console.log('✨ Platform sync complete.');
}

main().catch(console.error);
