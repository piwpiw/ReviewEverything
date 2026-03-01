import { fetchWithRetry } from '../lib/fetcher';
import * as cheerio from 'cheerio';

async function findLinks() {
    const sites = [
        "https://www.revu.net",
        "https://www.reviewnote.co.kr",
        "https://dinnerqueen.net",
        "https://www.reviewplace.co.kr"
    ];

    for (const site of sites) {
        try {
            console.log(`Searching links for: ${site}...`);
            const response = await fetchWithRetry(site, {
                headers: { "User-Agent": "Mozilla/5.0 Chrome/121.0.0.0 Safari/537.36" }
            });
            const $ = cheerio.load(response.data);
            const links: string[] = [];
            $('a').each((i, el) => {
                const href = $(el).attr('href');
                if (href && (href.includes('campaign') || href.includes('search') || href.includes('list'))) {
                    links.push(href);
                }
            });
            console.log(`Found links in ${site}:`, [...new Set(links)].slice(0, 10));
        } catch (e: any) {
            console.error(`Fail ${site}: ${e.message}`);
        }
    }
}

findLinks();
