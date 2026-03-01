import { fetchWithRetry } from '../lib/fetcher';

async function testReviewPlace() {
    const url = "https://www.reviewplace.co.kr/campaign/search?page=1";
    try {
        console.log(`Fetching ReviewPlace: ${url}...`);
        const response = await fetchWithRetry(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            }
        });

        console.log("Status:", response.status);
        console.log("Includes 'campaign-list':", response.data.includes('campaign-list'));
        console.log("Includes 'item':", response.data.includes('item'));
        console.log("Length:", response.data.length);

    } catch (e: any) {
        console.error("Error:", e.message);
    }
}

testReviewPlace();
