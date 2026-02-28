# 🕷 Scraper Adapters Reference

The `ReviewEverything` project aggregates data using an array of Cheerio-based scrapers. All scrapers reside in `apps/web/sources/adapters/`.

## 1. Supported Platforms & File Index

| ID | Platform Name | Adapter File | Method |
|:---|:---|:---|:---|
| 1 | Revu (레뷰) | `revu.ts` | HTML DOM Parsing (Cheerio) |
| 2 | ReviewNote (리뷰노트) | `reviewnote.ts` | HTML DOM Parsing (Cheerio) |
| 3 | DinnerQueen (디너의여왕) | `dinnerqueen.ts` | HTML DOM Parsing (Cheerio) |
| 4 | ReviewPlace (리뷰플레이스) | `reviewplace.ts` | HTML DOM Parsing (Cheerio) |
| 5 | SeoulOppa (서울오빠) | `seouloppa.ts` | HTML DOM Parsing (Cheerio) |
| 6 | MrBlog (미스터블로그) | `mrblog.ts` | HTML DOM Parsing (Cheerio) |
| 7 | GangnamFood (강남맛집) | `gangnamfood.ts` | HTML DOM Parsing (Cheerio) |

## 2. Adapter Architecture (`IPlatformAdapter`)

Every adapter must implement the interface found in `sources/types.ts`:

```typescript
export interface IPlatformAdapter {
    platformId: number;
    baseUrl: string;
    fetchList(page: number): Promise<ScrapedCampaign[]>;
}
```

## 3. Resilience and Fallback Tactics

Scraping 7 platforms asynchronously presents challenges like IP blocking, WAF triggered errors, and dynamic HTML DOM rendering.

### Randomized Delays & Exponential Backoff
Before making requests, adapters implement a mandatory pseudo-random delay. Furthermore, all requests are routed through `fetchWithRetry` (`lib/fetcher.ts`) which automatically implements exponential backoff to handle network timeouts or `5xx` server errors up to 3 times before falling back.
```typescript
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
await delay(1500 + Math.random() * 500); // Base anti-bot delay
```

### Try-Catch Fallbacks
If a request fails (e.g., 403 Forbidden, 503 Gateway Error, DOM parsing undefined error due to site update), the system gracefully catches it.
Instead of crashing the ingestion task, the adapter logs the error, and provides a dummy `[Fallback]` payload to ensure testing and application UI does not break.

### Headers injection
All `axios` requests fake basic browser footprints to prevent rudimentary blocklists.
```typescript
headers: { 'User-Agent': 'Mozilla/5.0' }
```

## 4. Expanding the Pipeline

To add a new platform:
1. Create `new_platform.ts` in `adapters/`.
2. Add the `IPlatformAdapter` implementation.
3. Import and export it inside `sources/registry.ts`.
4. Trigger the platform ID via `/api/admin/ingest` to test.
