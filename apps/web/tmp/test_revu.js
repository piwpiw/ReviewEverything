const { fetchWithRetry } = require('../lib/fetcher');
const cheerio = require('cheerio');

async function testRevu() {
    const baseUrl = "https://www.revu.net";
    try {
        console.log("Fetching Revu...");
        const response = await fetchWithRetry(`${baseUrl}/campaigns?page=1&per_page=20`, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/121.0.0.0 Safari/537.36",
            }
        });
        const $ = cheerio.load(response.data);

        console.log("HTML length:", response.data.length);

        // Let's print some classes we find in the body to identify the list
        const bodyClasses = $('body').attr('class');
        console.log("Body classes:", bodyClasses);

        // Find potential campaign containers
        const containers = $('.campaign-list, .campaign_list, .list_box, .list-box, ul, div');
        console.log("Found potential containers count:", containers.length);

        // Try to identify the specific card class
        const cards = $('.campaign-item, .campaign_item, .item_list, .list-item, .card');
        console.log("Potential cards count:", cards.length);

        // Sample first 500 chars of body
        console.log("Body snippet:", $('body').text().slice(0, 500).replace(/\s+/g, ' '));

    } catch (e) {
        console.error("Error:", e.message);
    }
}

testRevu();
