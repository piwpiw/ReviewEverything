import { executeIngestionTask } from "./lib/ingest";
import { InitializedAdapters } from "./sources/registry";
import { db } from "./lib/db";

async function runTest() {
    console.log("Starting actual ingestion...");
    // 2 is Reviewnote, 3 is DinnerQueen
    const rnAdapter = InitializedAdapters["reviewnote"];
    const dqAdapter = InitializedAdapters["dinnerqueen"];

    console.log("\n--- Reviewnote ---");
    const rnRes = await executeIngestionTask(rnAdapter, 2);
    console.log(rnRes);

    console.log("\n--- DinnerQueen ---");
    const dqRes = await executeIngestionTask(dqAdapter, 3);
    console.log(dqRes);

    // Check DB counts
    const count = await db.campaign.count();
    console.log(`\nTotal campaigns in DB: ${count}`);

    await db.$disconnect();
}

runTest().catch(console.error);
