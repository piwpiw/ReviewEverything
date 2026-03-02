# ReviewEverything MCP Server (Scraper & Analytics Hub)

This MCP server encapsulates the core business logic of ReviewEverything, allowing AI agents to directly interact with the platform and its data.

## 🛠️ Tools Provided

### 1. `list_platforms`
- **Description:** Returns a JSON list of all scraping platforms in the database.
- **Usage:** Check which platforms are currently supported.

### 2. `get_ingest_stats`
- **Description:** Fetch history of recent ingestion runs (Success/Failure/Added/Updated).
- **Arguments:** `limit` (number)
- **Usage:** Monitor system health and data freshment.

### 3. `calculate_roi` (Intelligence)
- **Description:** Real-time ROI and hourly efficiency calculator based on the `ROI_LOGIC` skill.
- **Arguments:**
  - `sponsorship_value`: Market value of goods.
  - `ad_fee`: Cash payment.
  - `campaigns_count`: (Default 1)
- **Usage:** Generate professional financial insights for users without manual calculation.

## 🚀 How to Run (Development)

```bash
cd mcp-servers/review-everything-mcp
npm install
npx tsx index.ts
```

## 📐 Architecture
- **Language:** TypeScript
- **Data Layer:** Prisma (shared with Next.js app)
- **Config:** Loads `.env` from `apps/web`
- **Standard:** Model Context Protocol (MCP) by Anthropic/Google
