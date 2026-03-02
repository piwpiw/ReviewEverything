import { fetchWithRetry } from "./lib/fetcher";
import * as fs from "fs";

async function dumpRevu() {
    const { data } = await fetchWithRetry("https://www.revu.net/campaigns", {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/100.0.4896.127 Safari/537.36" }
    });
    fs.writeFileSync("revu_dump.html", data);
    console.log("Written to revu_dump.html");
}
dumpRevu();
