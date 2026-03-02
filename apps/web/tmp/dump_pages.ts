import * as cheerio from "cheerio";
import * as fs from "fs";

async function dumpPages() {
    // ReviewPlace
    console.log("=== ReviewPlace ===");
    const rpRes = await fetch("https://www.reviewplace.co.kr/pr/", { headers: { "User-Agent": "Mozilla/5.0" } });
    const rpHtml = await rpRes.text();
    fs.writeFileSync("tmp/rp_dump.html", rpHtml);
    const $rp = cheerio.load(rpHtml);
    console.log("Title:", $rp("title").text());
    // Print first few campaign-like sections
    const rpItems = $rp(".cmp_list li, .cmp_item, .cmp-list li, .item_list li, .pr_list li, li.item, .list_type1 li").slice(0, 3);
    console.log("Found items:", rpItems.length);
    rpItems.each((i, el) => {
        console.log(`  Item ${i}: ${$rp(el).text().replace(/\s+/g, ' ').trim().substring(0, 120)}`);
    });
    // Look for what CSS classes are used
    const rpClasses: string[] = [];
    $rp("[class]").each((_, el) => { const c = $rp(el).attr("class"); if (c) rpClasses.push(c); });
    const uniqueClasses = [...new Set(rpClasses)].filter(c => c.includes("cmp") || c.includes("camp") || c.includes("pr") || c.includes("list") || c.includes("item"));
    console.log("Relevant classes:", uniqueClasses.slice(0, 20));

    // MrBlog
    console.log("\n=== MrBlog ===");
    const mbRes = await fetch("https://www.mrblog.net/campaigns/today", { headers: { "User-Agent": "Mozilla/5.0" } });
    const mbHtml = await mbRes.text();
    fs.writeFileSync("tmp/mb_dump.html", mbHtml);
    const $mb = cheerio.load(mbHtml);
    console.log("Title:", $mb("title").text());
    const mbClasses: string[] = [];
    $mb("[class]").each((_, el) => { const c = $mb(el).attr("class"); if (c) mbClasses.push(c); });
    const mbUniqueClasses = [...new Set(mbClasses)].filter(c => c.includes("camp") || c.includes("card") || c.includes("item") || c.includes("list") || c.includes("thumb"));
    console.log("Relevant classes:", mbUniqueClasses.slice(0, 20));
}

dumpPages().catch(console.error);
