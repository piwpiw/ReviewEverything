import * as fs from 'fs';
import * as cheerio from 'cheerio';

async function findDQSelector() {
    const html = fs.readFileSync('d:\\BohemianStudio\\ReviewEverything\\apps\\web\\tmp\\dq_taste.html', 'utf8');
    const $ = cheerio.load(html);

    // Find links containing /taste/
    const links = $("a").filter((_, a) => {
        const href = $(a).attr("href") || "";
        return /\/taste\/\d+/.test(href);
    });

    console.log(`Found ${links.length} links to /taste/XXX`);

    if (links.length > 0) {
        const firstLink = links.first();
        console.log("First link href:", firstLink.attr("href"));
        console.log("Parent classes:", firstLink.parent().attr("class"));
        console.log("Closest 'div' classes:", firstLink.closest("div").attr("class"));

        // Find a common container for these links
        const containers = links.map((_, a) => $(a).closest("div[class], li[class]").attr("class")).get();
        const counts = containers.reduce((acc, curr) => {
            acc[curr] = (acc[curr] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        console.log("Common container classes:", counts);
    }
}

findDQSelector();
