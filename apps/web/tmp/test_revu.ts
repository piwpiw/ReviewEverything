import { fetchWithRetry } from '../lib/fetcher';
import * as cheerio from 'cheerio';
import * as fs from 'fs';

async function testRevu() {
    const baseUrl = "https://www.revu.net";
    try {
        console.log("Fetching Revu...");
        const response = await fetchWithRetry(`${baseUrl}/campaigns?page=1&per_page=24`, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
                "Referer": "https://www.revu.net/",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
                "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
                "Cookie": "PHPSESSID=session_placeholder" // Just to mimic real browser cookie
            }
        });

        fs.writeFileSync('d:\\BohemianStudio\\ReviewEverything\\apps\\web\\tmp\\revu_debug.html', response.data);
        console.log("Saved HTML to revu_debug.html (Length:", response.data.length, ")");

        const $ = cheerio.load(response.data);
        console.log("Page Title:", $('title').text());
        console.log("Meta descriptions:", $('meta[name="description"]').attr('content'));

    } catch (e: any) {
        console.error("Error Status:", e.response?.status);
        console.error("Error Code:", e.code);
    }
}

testRevu();
