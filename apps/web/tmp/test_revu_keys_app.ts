import { fetchWithRetry } from '../lib/fetcher';

async function testRevuApi() {
    const keys = ["weble-v2", "revu-v2", "weble-web-v1", "revu-web-v2", "revu-pc-v1", "weble-app-v1", "web-pc"];
    const url = "https://api.revu.net/v2/campaigns?page=1&limit=24";

    for (const key of keys) {
        try {
            console.log(`Testing Key (App-Key header): ${key}...`);
            const response = await fetchWithRetry(url, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
                    "App-Key": key, // Notice: App-Key instead of X-App-Key
                    "Accept": "application/json",
                }
            });
            console.log(`Success with App-Key: ${key}! Status: ${response.status}`);
            console.log("Snippet:", JSON.stringify(response.data).slice(0, 1000));
            return;
        } catch (e: any) {
            console.error(`Fail with App-Key: ${key}: ${e.response?.status}`);
        }
    }
}

testRevuApi();
