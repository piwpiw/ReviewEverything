import { fetchWithRetry } from '../lib/fetcher';
import * as cheerio from 'cheerio';

async function testGangnamFood() {
    const url = "https://gangnamfood.net/list_v.php"; // common list name
    try {
        console.log(`Fetching GangnamFood: ${url}...`);
        const response = await fetchWithRetry(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            }
        });

        console.log("Status:", response.status);
        const $ = cheerio.load(response.data);

        const results: any[] = [];
        // Common PHP list patterns: table tr, .box, .list_item
        $('.box, .list_item, tr').each((i, el) => {
            const $el = $(el);
            const title = $el.find('.title, .subject, a').text().trim();
            if (title.length > 5) {
                results.push({
                    title,
                    link: $el.find('a').attr('href')
                });
            }
        });

        console.log(`Potential campaigns found: ${results.length}`);
        if (results.length > 0) {
            console.log("Sample:", results[0]);
        }

    } catch (e: any) {
        console.error("Error:", e.message);
    }
}

testGangnamFood();
