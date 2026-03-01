import { fetchWithRetry } from '../lib/fetcher';

async function testWeble() {
    const url = "https://api.weble.net/v2/campaigns?page=1&limit=24";
    try {
        console.log(`Testing: ${url}...`);
        const response = await fetchWithRetry(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
                "App-Key": "revu-web-v2", // Try the standard app key
                "Accept": "application/json",
                "X-Platform": "web"
            }
        });
        console.log(`Success! Status: ${response.status}`);
        console.log("Data snippet:", JSON.stringify(response.data).slice(0, 1000));
    } catch (e: any) {
        console.error(`Fail Status: ${e.response?.status}`);
        console.error("Data:", e.response?.data);
    }
}

testWeble();
