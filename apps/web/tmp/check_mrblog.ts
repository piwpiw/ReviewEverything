import * as cheerio from "cheerio";
import * as fs from "fs";

async function checkMrBlog() {
    const html = fs.readFileSync("tmp/mb_root.html", "utf-8");
    const $ = cheerio.load(html);
    
    // Get campaign detail links (individual campaign pages)
    const detailLinks: string[] = [];
    $('a[href*="/campaigns/"]').each((i, el) => {
        const href = $(el).attr("href") || "";
        if (href.match(/\/campaigns\/\d+$/)) {
            detailLinks.push(href);
        }
    });
    console.log("Detail campaign links:", detailLinks.length);
    console.log("Sample:", detailLinks.slice(0, 5));

    // Look for data sections with campaign content on homepage
    const sections = $(".section, section, .content_area, .main_content, .campaign-section, .wrap");
    console.log("\nSections:", sections.length);
    sections.each((i, el) => {
        const text = $(el).text().replace(/\s+/g, " ").trim();
        if (text.length > 20 && text.length < 500 && (text.includes("체험단") || text.includes("캠페인") || text.includes("모집"))) {
            console.log(`  Section ${i}:`, text.substring(0, 150));
        }
    });

    // Look for any element containing campaign card-like content
    const fullText = $("body").text().replace(/\s+/g, " ").trim();
    console.log("\nLooking for recruit patterns in body text...");
    const recruits = fullText.match(/\d+명\s*모집|\d+명\s*신청|모집\s*\d+/g);
    console.log("Recruit patterns:", recruits?.slice(0, 10));
    
    // Find individual campaign items on homepage
    $('a[href*="/campaigns/"]').each((i, el) => {
        const href = $(el).attr("href") || "";
        if (!href.match(/\/campaigns\/\d+$/)) return;
        if (i >= 5) return;
        
        const $parent = $(el).closest("div, li, article, section");
        const parentText = $parent.text().replace(/\s+/g, " ").trim();
        const parentImg = $parent.find("img").first().attr("src") || $parent.find("img").first().attr("data-src") || "";
        console.log(`\n--- Campaign item ${i} ---`);
        console.log("Link:", href);
        console.log("Parent text:", parentText.substring(0, 200));
        console.log("Image:", parentImg);
    });
}

checkMrBlog().catch(console.error);
