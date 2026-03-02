import { fetchWithRetry } from "./lib/fetcher";
import * as cheerio from "cheerio";

async function dumpReviewnoteAPI() {
    const rn = await fetchWithRetry("https://www.reviewnote.co.kr/campaigns?page=1");
    const $rn = cheerio.load(rn.data);
    const nextData = $rn("#__NEXT_DATA__").html();
    if (nextData) {
        const json = JSON.parse(nextData);
        const campaigns = json.props?.pageProps?.data?.objects || [];
        console.log("Items:", campaigns.length);
        console.log("First item:", JSON.stringify(campaigns[0], null, 2));
    }
}

dumpReviewnoteAPI();
