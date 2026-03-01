import { fetchWithRetry } from '../lib/fetcher';
import * as fs from 'fs';

async function testReviewNoteLive() {
    const url = "https://www.reviewnote.co.kr/campaigns?page=1";
    try {
        const response = await fetchWithRetry(url, {
            headers: { "User-Agent": "Mozilla/5.0 Chrome/121.0.0.0 Safari/537.36" }
        });
        fs.writeFileSync('d:\\BohemianStudio\\ReviewEverything\\apps\\web\\tmp\\reviewnote_live.html', response.data);
        console.log("Written HTML to reviewnote_live.html", response.data.length);
    } catch (e: any) {
        console.error("Error:", e.message);
    }
}

testReviewNoteLive();
