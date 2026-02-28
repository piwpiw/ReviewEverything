# 📡 API Reference & Fetch Strategies

ReviewEverything uses Next.js Route Handlers (`app/api/...`) to serve data dynamically. To ensure high performance, caching is strictly implemented.

## 1. Endpoints

### `GET /api/campaigns`
The primary endpoint for retrieving paginated, filtered, and sorted campaigns.

- **Query Parameters**:
  - `q`: Keyword search (applies to `title` and `location`).
  - `platform_id`: ID of the platform to filter by (e.g., `1` for Revu).
  - `campaign_type`: `VST`, `SHP`, `PRS`.
  - `media_type`: `BP`, `IP`, `YP`.
  - `sort`: Defines standard sorting (e.g., `latest_desc`, `competition_asc`).
  - `page`: Pagination offset.
- **Response**: Returns a structured JSON containing `data` arrays and `meta` (total items, total pages).
- **Caching (`Vercel Edge`)**: 
  - Header: `Cache-Control: s-maxage=60, stale-while-revalidate=600`
  - *Strategy*: Serves cached responses instantly. Revalidates in the background if the cache is older than 60 seconds. Served data can be stale up to 10 minutes.

### `GET /api/analytics`
Dedicated lightweight endpoint for retrieving "Hot" and "Trending" campaigns.

- **Purpose**: Feeds the "Trending" reel on the Homepage.
- **Logic**: Returns campaigns sorted by recent applicant velocity.

### `POST /api/admin/ingest`
Protected backend worker route to trigger manual scrapers.

- **Headers Needed**: `Authorization: Basic <base64(admin:password)>`
- **Body**: `{ platform_id: number }`
- **Action**: Triggers `lib/ingest.ts` for one platform immediately.
- **Note**: For multi-platform ingestion, call this endpoint once per platform (the current admin UI follows this pattern).

## 2. Security Middleware

The application utilizes `middleware.ts` located in the root `apps/web`.

- **Protected Paths**: `/admin/*` and `/api/admin/*`.
- **Auth Provider**: Basic HTTP Authentication.
- **Reference Variable**: Checks the `Authorization` header against the `ADMIN_PASSWORD` variable defined in `.env`.
- **Response behavior**: 
  - Unauthenticated: Returns `401 Unauthorized` causing browsers to prompt natively for credentials.
