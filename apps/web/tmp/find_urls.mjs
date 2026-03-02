// Find campaign URLs on ReviewPlace and MrBlog
async function findUrls() {
    // ReviewPlace
    const rp = await fetch("https://www.reviewplace.co.kr");
    const rpHtml = await rp.text();
    const rpLinks = rpHtml.match(/href="([^"]*)"[^>]*>/gi) || [];
    const rpUnique = [...new Set(rpLinks.map(l => l.match(/href="([^"]*)"/)?.[1]).filter(Boolean))];
    console.log("=== ReviewPlace Links ===");
    rpUnique.filter(l => !l.includes(".css") && !l.includes(".js") && !l.includes(".png") && !l.includes("google") && !l.startsWith("#")).forEach(l => console.log(" ", l));

    // MrBlog
    const mb = await fetch("https://mrblog.net");
    const mbHtml = await mb.text();
    const mbLinks = mbHtml.match(/href="([^"]*)"[^>]*>/gi) || [];
    const mbUnique = [...new Set(mbLinks.map(l => l.match(/href="([^"]*)"/)?.[1]).filter(Boolean))];
    console.log("\n=== MrBlog Links ===");
    mbUnique.filter(l => !l.includes(".css") && !l.includes(".js") && !l.includes(".png") && !l.includes("google") && !l.startsWith("#")).forEach(l => console.log(" ", l));
}
findUrls().catch(console.error);
