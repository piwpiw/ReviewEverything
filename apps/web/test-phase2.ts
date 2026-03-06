import { InitializedAdapters } from "./sources/registry";

async function test() {
    const keys = ["ringble", "4blog", "mrblog", "mobble", "tble", "cloudreview"];

    for (const key of keys) {
        console.log(`\n===== Testing ${key} =====`);
        const adapter = InitializedAdapters[key];
        if (!adapter) {
            console.log(`Adapter ${key} not found`);
            continue;
        }
        try {
            const data = await adapter.fetchList(1);
            console.log(`${key}: ${data.length} items`);
            if (data.length > 0) {
                const first = data[0];
                console.log(`  Title: ${first.title}`);
                console.log(`  Reward: ${first.reward_text}`);
                console.log(`  URL: ${first.url}`);
            }
        } catch (e: any) {
            console.log(`${key}: ERROR - ${e.message}`);
        }
    }
}

test().catch(console.error);
