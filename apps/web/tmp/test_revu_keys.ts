import { fetchWithRetry } from '../lib/fetcher';

async function testRevuApi() {
    const keys = ["weble-web-v1", "revu-web-v2", "revu-pc-v1", "weble-app-v1"];
    const url = "https://api.weble.net/v2/campaigns?page=1&limit=24";

    for (const key of keys) {
        try {
            console.log(`Testing Key: ${key}...`);
            const response = await fetchWithRetry(url, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
                    "App-Key": key,
                    "Accept": "application/json",
                }
            });
            console.log(`Success with ${key}! Status: ${response.status}`);
            console.log("Snippet:", JSON.stringify(response.data).slice(0, 500));
            return;
        } catch (e: any) {
            console.error(`Fail ${key}: ${e.response?.status}`);
        }
    }
}

testRevuApi();
