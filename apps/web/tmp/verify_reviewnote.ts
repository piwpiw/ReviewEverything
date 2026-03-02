import * as fs from 'fs';
import * as cheerio from 'cheerio';
import { ReviewnoteAdapter } from '../sources/adapters/reviewnote';

async function testLocalReviewnote() {
    const html = fs.readFileSync('d:\\BohemianStudio\\ReviewEverything\\apps\\web\\tmp\\reviewnote_live.html', 'utf8');
    const adapter = new ReviewnoteAdapter();

    // We need to bypass the fetchList call and just use the parsing logic
    // But since fetchList is private, we'll just replicate the parsing logic here or use a proxy
    const $ = cheerio.load(html);
    const campaigns: any[] = [];

    $("div.relative.pl-\\[2\\.5px\\]").each((i, el) => {
        const $el = $(el);
        const $link = $el.find("a[href^='/campaigns/']").last();
        const title = $link.text().trim();
        const href = $link.attr("href") || "";
        const reward = $el.find("div.mt-1.truncate.text-gray-600.text-14r").text().trim();

        if (title) {
            campaigns.push({ title, href, reward });
        }
    });

    console.log(`Found ${campaigns.length} campaigns`);
    if (campaigns.length > 0) {
        console.log("First item:", campaigns[0]);
    }
}

testLocalReviewnote();
