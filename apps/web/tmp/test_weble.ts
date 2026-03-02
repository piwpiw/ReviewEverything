import { fetchWithRetry } from "../lib/fetcher";

async function testWeble() {
  const urls = [
    "https://api.weble.net/api/v1/campaigns",
    "https://api.weble.net/api/v2/campaigns",
    "https://api.weble.net/api/campaigns",
    "https://api.weble.net/campaigns",
    "https://api.weble.net/api/v3/campaigns",
    "https://www.revu.net/api/campaigns"
  ];
  for (const url of urls) {
      try {
        const { data } = await fetchWithRetry(url, { headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" }});
        console.log("Success:", url, "->", typeof data === "string" ? data.substring(0, 100) : "Object");
      } catch (error) {
        const message = error instanceof Error ? error.message : "unknown error";
        console.log("Failed:", url, message);
      }
  }
}
testWeble();
