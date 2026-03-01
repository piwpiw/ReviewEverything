import { fetchWithRetry } from '../lib/fetcher';
import * as fs from 'fs';

async function findKey() {
    const url = "https://www.revu.net/build/www.min.js";
    try {
        console.log(`Downloading JS: ${url}...`);
        const response = await fetchWithRetry(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            }
        });

        const content = response.data;
        const index = content.indexOf("App-Key");
        if (index !== -1) {
            console.log("Found App-Key! Context:", content.slice(index - 50, index + 50));
        } else {
            console.log("App-Key not found in JS.");
        }

        // Search for api URLs
        const apiMatch = content.match(/https?:\/\/api\.[a-zA-Z0-9.-]+\//g);
        if (apiMatch) {
            console.log("Found API URLs:", [...new Set(apiMatch)]);
        }

    } catch (e: any) {
        console.error("Error:", e.message);
    }
}

findKey();
