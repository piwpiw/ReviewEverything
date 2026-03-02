import { fetchWithRetry } from '../lib/fetcher';
import * as fs from 'fs';

async function checkDQ() {
    const url = "https://dinnerqueen.net/taste";
    try {
        console.log(`Fetching DQ: ${url}...`);
        const response = await fetchWithRetry(url, {
            headers: { "User-Agent": "Mozilla/5.0 Chrome/121.0.0.0 Safari/537.36" }
        });
        console.log("Status:", response.status);
        fs.writeFileSync('d:\\BohemianStudio\\ReviewEverything\\apps\\web\\tmp\\dq_taste.html', response.data);
        console.log("Saved to dq_taste.html");

        // Find links
        const links = response.data.match(/href="\/[^"]+"/g);
        if (links) {
            console.log("Sample links:", [...new Set(links)].slice(0, 10));
        }
    } catch (e: any) {
        console.error("Error:", e.message);
    }
}

checkDQ();
