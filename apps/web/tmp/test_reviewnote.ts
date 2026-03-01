import { fetchWithRetry } from '../lib/fetcher';

async function testReviewnote() {
    const url = "https://www.reviewnote.co.kr/campaign/list?page=1";
    try {
        console.log(`Fetching Reviewnote: ${url}...`);
        const response = await fetchWithRetry(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            }
        });

        console.log("Status:", response.status);
        console.log("Length:", response.data.length);
        console.log("Includes 'campaign-item':", response.data.includes('campaign-item'));
        console.log("Includes 'campaign_item':", response.data.includes('campaign_item'));

        if (response.data.includes('campaign')) {
            const match = response.data.match(/campaign[^>"]+/g);
            console.log("Sample matches:", match?.slice(0, 10));
        }

    } catch (e: any) {
        console.error("Error:", e.message);
    }
}

testReviewnote();
