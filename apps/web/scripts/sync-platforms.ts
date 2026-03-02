import "dotenv/config";
import { db } from "../lib/db";

const PLATFORMS = [
  { name: "Revu", baseUrl: "https://www.revu.net", is_active: true },
  { name: "Reviewnote", baseUrl: "https://www.reviewnote.co.kr", is_active: true },
  { name: "DinnerQueen", baseUrl: "https://dinnerqueen.net", is_active: true },
  { name: "ReviewPlace", baseUrl: "https://www.reviewplace.co.kr", is_active: true },
  { name: "Seouloppa", baseUrl: "https://www.seouloppa.net", is_active: true },
  { name: "MrBlog", baseUrl: "https://www.mrblog.net", is_active: true },
  { name: "GangnamFood", baseUrl: "https://www.gangnamfood.net", is_active: true },
  { name: "4blog", baseUrl: "https://4blog.net", is_active: false },
  { name: "Pimble", baseUrl: "https://pimble.co.kr", is_active: false },
  { name: "Assaview", baseUrl: "https://assaview.co.kr", is_active: false },
  { name: "Cometoplay", baseUrl: "https://cometoplay.kr", is_active: false },
  { name: "Modan", baseUrl: "https://www.modan.kr", is_active: false },
  { name: "Weble", baseUrl: "https://www.weble.kr", is_active: false },
  { name: "Ringble", baseUrl: "https://www.ringble.co.kr", is_active: false },
  { name: "Mobble", baseUrl: "https://www.mobble.kr", is_active: false },
  { name: "Pickmee", baseUrl: "https://pickmee.kr", is_active: false },
  { name: "ReviewMarch", baseUrl: "http://xn--vk1bn0kvydxrlprb.com", is_active: false },
  { name: "Chehumview", baseUrl: "https://chehumview.com", is_active: false },
  { name: "GNReview", baseUrl: "https://gnreview.co.kr", is_active: false },
  { name: "Dailyview", baseUrl: "https://dailyview.kr", is_active: false },
  { name: "Realreview", baseUrl: "https://realreview.kr", is_active: false },
  { name: "Blogreview", baseUrl: "https://blogreview.co.kr", is_active: false },
];

async function main() {
  console.log("Synchronizing platform metadata in DB...");

  for (const p of PLATFORMS) {
    try {
      const platform = await db.platform.upsert({
        where: { name: p.name },
        update: { base_url: p.baseUrl, is_active: p.is_active },
        create: { name: p.name, base_url: p.baseUrl, is_active: p.is_active },
      });
      console.log(`${p.is_active ? "Active" : "Inactive"} platform ready: ${platform.name}`);
    } catch (error: any) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Failed to sync platform ${p.name}:`, message);
    }
  }

  console.log("Platform sync complete.");
}

main().catch(console.error);
