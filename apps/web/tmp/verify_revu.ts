import * as fs from 'fs';
import * as cheerio from 'cheerio';

async function testLocalRevu() {
    const html = fs.readFileSync('d:\\BohemianStudio\\ReviewEverything\\apps\\web\\tmp\\revu_campaigns.html', 'utf8');
    const $ = cheerio.load(html);
    const campaigns: any[] = [];

    // Revu usually has .campaign-item or .campaign-card
    // Based on revu.ts line 31: const listSelector = ".campaign-card, .revu-campaign-item, .list-item, [class*='campaign'], .campaign_box";

    $(".campaign-item, .campaign-card, [class*='campaign']").each((i, el) => {
        const title = $(el).find(".title, .tit, h3, h4").text().trim();
        if (title) {
            campaigns.push({ title });
        }
    });

    console.log(`Found ${campaigns.length} potential campaign elements`);
    if (campaigns.length > 0) {
        console.log("Samples:", campaigns.slice(0, 3));
    } else {
        // If not found, maybe it's Angular and content is empty in base HTML
        console.log("No campaigns found. HTML length:", html.length);
        console.log("Snippet:", html.slice(0, 500));
    }
}

testLocalRevu();
