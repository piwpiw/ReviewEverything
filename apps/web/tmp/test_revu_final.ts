import { fetchWithRetry } from '../lib/fetcher';

async function testRevuApi() {
    const key = "revu-pc-v1"; // Most common in recent logs
    const url = "https://api.revu.net/v2/campaigns?page=1&limit=24&type=visit";
    try {
        const response = await fetchWithRetry(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
                "App-Key": key,
                "Accept": "application/json",
            }
        });
        console.log("Status:", response.status);
        console.log("Full Body:", JSON.stringify(response.data, null, 2));
    } catch (e: any) {
        console.error(e.response?.status, e.response?.data);
    }
}

testRevuApi();
