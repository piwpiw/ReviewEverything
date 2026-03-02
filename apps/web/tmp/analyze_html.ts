import * as cheerio from "cheerio";
import * as fs from "fs";

// Analyze ReviewPlace HTML structure
const rpHtml = fs.readFileSync("tmp/rp_dump.html", "utf-8");
const $rp = cheerio.load(rpHtml);
console.log("=== ReviewPlace ===");
console.log("Items:", $rp(".campaign_list .item").length);
$rp(".campaign_list .item").slice(0, 2).each((i, el) => {
    console.log("---Item", i);
    console.log("Text:", $rp(el).text().replace(/\s+/g, " ").trim().substring(0, 200));
    console.log("href:", $rp(el).find("a").first().attr("href"));
    console.log("img:", $rp(el).find("img").first().attr("src"));
    const info = $rp(el).find(".item_info");
    console.log("Info text:", info.text().replace(/\s+/g, " ").trim().substring(0, 200));
});

// Analyze MrBlog HTML structure
const mbHtml = fs.readFileSync("tmp/mb_dump.html", "utf-8");
const $mb = cheerio.load(mbHtml);
console.log("\n=== MrBlog ===");
// Try to find campaign items
const selectors = [".campaign_item", ".card", ".item", "article", ".campaign-card", "a[href*='/campaigns/']"];
for (const sel of selectors) {
    const count = $mb(sel).length;
    if (count > 0) {
        console.log(`Selector "${sel}": ${count} matches`);
        $mb(sel).slice(0, 2).each((i, el) => {
            console.log(`  Item ${i}:`, $mb(el).text().replace(/\s+/g, " ").trim().substring(0, 150));
        });
    }
}
