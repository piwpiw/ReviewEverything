import { fetchWithRetry } from '../lib/fetcher';

async function testRevuApi() {
    // Try some very common public API patterns
    const urls = [
        "https://api.revu.net/v2/campaigns/latest?page=1",
        "https://api.revu.net/v2/campaigns?type=visit&page=1",
        "https://api.revu.net/v3/campaigns?page=1"
    ];

    for (const url of urls) {
        try {
            console.log(`Testing API: ${url}...`);
            const response = await fetchWithRetry(url, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
                    "X-App-Key": "revu-web-v2",
                    "Accept": "application/json"
                }
            });
            console.log(`Success! Status: ${response.status}`);
            console.log("Full Body:", JSON.stringify(response.data, null, 2));
        } catch (e: any) {
            console.error(`Fail ${url}: ${e.response?.status}`);
        }
    }
}

testRevuApi();
