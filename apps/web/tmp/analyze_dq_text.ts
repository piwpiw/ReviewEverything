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
        console.log("Full Text:", $el.text().replace(/\s+/g, ' ').trim());
    });
}

analyzeDQ();
