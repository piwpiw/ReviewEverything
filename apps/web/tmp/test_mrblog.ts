import { fetchWithRetry } from '../lib/fetcher';

async function testMrBlog() {
    const url = "https://mrblog.net/campaign/list?page=1";
    try {
        console.log(`Fetching MrBlog: ${url}...`);
        const response = await fetchWithRetry(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            }
        });

        console.log("Status:", response.status);
        console.log("Length:", response.data.length);
        console.log("Includes 'campaign':", response.data.includes('campaign'));

    } catch (e: any) {
        console.error("Error:", e.message);
    }
}

testMrBlog();
