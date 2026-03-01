import { fetchWithRetry } from '../lib/fetcher';

async function testMobileRevu() {
    const url = "https://m.revu.net/campaigns";
    try {
        console.log(`Fetching Mobile Revu: ${url}...`);
        const response = await fetchWithRetry(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
            }
        });

        console.log("Status:", response.status);
        console.log("Length:", response.data.length);
        console.log("Includes 'campaign':", response.data.includes('campaign'));

        if (response.data.includes('campaign')) {
            console.log("Snippet:", response.data.slice(response.data.indexOf('campaign') - 50, response.data.indexOf('campaign') + 200));
        }

    } catch (e: any) {
        console.error("Error:", e.message);
    }
}

testMobileRevu();
