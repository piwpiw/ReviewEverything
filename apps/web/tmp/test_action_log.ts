import { db } from "../lib/db";

async function testLog() {
  const campaign = await db.campaign.findFirst();
  if (!campaign) {
    console.log("No campaigns found yet for action log test.");
    return;
  }
  
  const log = await db.userActionLog.create({
    data: {
      campaign_id: campaign.id,
      action: "VIEW",
      platform: "WEB",
    }
  });
  
  console.log("✅ Action logged successfully:", log.id.toString());
  
  const totalLogs = await db.userActionLog.count();
  console.log("Total logs in DB:", totalLogs);
}

testLog().catch(console.error).finally(() => db.$disconnect());
