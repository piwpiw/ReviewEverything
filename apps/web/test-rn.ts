import { fetchWithRetry } from "./lib/fetcher";
import * as cheerio from "cheerio";

async function dumpReviewnote() {
    const { data } = await fetchWithRetry("https://www.reviewnote.co.kr/campaigns?page=1");
    const $ = cheerio.load(data);

    const firstEl = $("div[class*='relative pl-']").first();
    console.log("Full Texts:");
    firstEl.find("*").each((_, el) => {
        const text = $(el).contents().filter((_, node) => node.type === 'text').text().trim();
        if (text) {
            console.log(`[${$(el).prop('tagName')} class="${$(el).attr('class')}"]: ${text}`);
        }
    });

    // Revu test as well
    const revuData = await fetchWithRetry("https://www.revu.net/campaigns?page=1&per_page=20", {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
    });
    const $revu = cheerio.load(revuData.data);
    console.log("\nRevu first item:");
    console.log($revu(".campaign-card, .revu-campaign-item, .list-item, [class*='campaign']").first().html()?.substring(0, 500));
}

dumpReviewnote();
