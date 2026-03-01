import { fetchWithRetry } from '../lib/fetcher';
import * as fs from 'fs';

async function testRevuList() {
    const baseUrl = "https://www.revu.net";
    try {
        console.log("Fetching Revu campaigns list...");
        const response = await fetchWithRetry(`${baseUrl}/campaigns`, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
                "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
            }
        });

        console.log("Status:", response.status);
        console.log("Includes 'campaign-item':", response.data.includes('campaign-item'));
        console.log("Includes 'campaign-card':", response.data.includes('campaign-card'));
        console.log("Includes 'ng-view':", response.data.includes('ng-view'));

        fs.writeFileSync('d:\\BohemianStudio\\ReviewEverything\\apps\\web\\tmp\\revu_campaigns.html', response.data);

    } catch (e: any) {
        console.error("Error:", e.message);
    }
}

testRevuList();
