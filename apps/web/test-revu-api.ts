import { fetchWithRetry } from "./lib/fetcher";

async function dumpRevuAPI() {
    try {
        const { data } = await fetchWithRetry("https://www.revu.net/api/campaigns?page=1&per_page=20", {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                "Accept": "application/json"
            }
        });
        console.log("Response starts with:", data.substring(0, 500));
        console.log("Is JSON:", data.startsWith("{") || data.startsWith("["));
    } catch (e) {
        console.error("API error:", e);
    }
}

dumpRevuAPI();
