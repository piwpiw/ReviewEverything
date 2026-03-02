import * as fs from 'fs';
import * as cheerio from 'cheerio';

async function analyzeDQ() {
    const html = fs.readFileSync('d:\\BohemianStudio\\ReviewEverything\\apps\\web\\tmp\\dq_taste.html', 'utf8');
    const $ = cheerio.load(html);

    const cards = $(".qz-dq-card");
    console.log(`Found ${cards.length} cards`);

    cards.slice(0, 5).each((i, el) => {
        const $el = $(el);
        console.log(`--- Card ${i} ---`);
        // Extract title - usually the first strong or b, or something with a specific class
        const title = $el.find(".qz-text-h4, b, strong").first().text().trim();
        const benefit = $el.find(".qz-text-body2, span").last().text().trim();
        const href = $el.find("a").first().attr("href");
        const img = $el.find("img").attr("src");

        console.log("Title:", title);
        console.log("Benefit:", benefit);
        console.log("Href:", href);
        console.log("Img:", img);
    });
}

analyzeDQ();
