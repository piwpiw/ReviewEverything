import { fetchWithRetry } from '../lib/fetcher';

async function testRevuApi() {
    const keys = ["web-pc", "revu-pc", "revu-web", "weble-web", "revu-web-v2", "revu-pc-v1"];
    const url = "https://api.revu.net/v2/campaigns?page=1&limit=24";

    for (const key of keys) {
        try {
            console.log(`Testing Key (X-App-Key): ${key}...`);
            const response = await fetchWithRetry(url, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
                    "X-App-Key": key,
                    "Accept": "application/json",
                }
            });
            console.log(`Success with X-App-Key: ${key}! Status: ${response.status}`);
            console.log("Keys:", Object.keys(response.data));
            if (response.data.data) {
                console.log("Data length:", Array.isArray(response.data.data) ? response.data.data.length : "Not an array");
                if (Array.isArray(response.data.data) && response.data.data.length > 0) {
                    console.log("First item sample:", JSON.stringify(response.data.data[0]).slice(0, 500));
                }
            } else {
                console.log("Snippet:", JSON.stringify(response.data).slice(0, 1000));
            }
            return;
        } catch (e: any) {
            console.error(`Fail X-App-Key ${key}: ${e.response?.status}`);
        }
    }
}

testRevuApi();
