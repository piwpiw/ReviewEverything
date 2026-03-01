import { fetchWithRetry } from '../lib/fetcher';

async function testDQ() {
    const url = "https://dinnerqueen.net/campaigns?page=1";
    try {
        console.log(`Fetching DinnerQueen: ${url}...`);
        const response = await fetchWithRetry(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            }
        });

        console.log("Status:", response.status);
        console.log("Length:", response.data.length);
        console.log("Includes 'campaign':", response.data.includes('campaign'));
        console.log("Includes 'item':", response.data.includes('item'));

        if (response.data.includes('campaign')) {
            console.log("Snippet near 'campaign':", response.data.slice(response.data.indexOf('campaign') - 50, response.data.indexOf('campaign') + 200));
        }

    } catch (e: any) {
        console.error("Error:", e.message);
    }
}

testDQ();
