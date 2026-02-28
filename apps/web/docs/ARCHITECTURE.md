# 🏗 System Architecture & Data Flow

This document details the high-level architecture and data flow of the ReviewEverything project, specifically focusing on the Alpha-to-Beta advancements.

## 1. Core Data Ingestion Pipeline

The scraping engine is designed for resilience and extensibility.

- **Trigger**: The process is triggered either via a Vercel Cron Job hitting `/api/cron` or manually via the Next.js Admin Panel POSTing to `/api/admin/ingest`.
- **Ingest Manager (`lib/ingest.ts`)**: Handled by `executeIngestionTask()`. It utilizes `Promise.allSettled()` for concurrent campaign processing to maximize throughput.
- **Adapters (`sources/adapters/*.ts`)**: Network requests are routed through `fetchWithRetry` (which features exponential backoff) and DOM parsing is delegated to 7 specialized adapter classes. All implement `IPlatformAdapter`.
- **Normalization**: The raw scraped data often contains platform-specific strings. The system standardizes these into Enums:
  - `campaign_type`: `VST` (Visit), `SHP` (Shipping), `PRS` (Press/Reporter).
  - `media_type`: `BP` (Blog), `IP` (Instagram), `YP` (YouTube).
- **Snapshot Upserting**: Instead of just overwriting campaigns, the system records `CampaignSnapshot` entities. This is critical for the Trend Engine. It logs `recruit_count` and `applicant_count` alongside a `scraped_at` timestamp.

## 2. Trend Engine (`lib/analytics.ts`)

To avoid querying heavy calculations on the fly, the trend logic utilizes the `CampaignSnapshot` history.

1. **Query**: Fetches the 2 most recent snapshots for active campaigns.
2. **Velocity Calculation**: Calculates `((current_applicants - previous_applicants) / previous_applicants) * 100`.
3. **Hotness Threshold**: If the velocity exceeds a set threshold (e.g., > 50%), the campaign is flagged `is_hot = true`.
4. **API Delivery**: `/api/analytics` serves this data, bypassing the standard `/api/campaigns` route to allow customized caching strategies.

## 3. Storage & Infrastructure (Supabase + Vercel)

- **Database**: PostgreSQL hosted on Supabase.
- **Prisma Schema**: `prisma/schema.prisma`. 
  - To handle high-volume reads on the analytics engine, indexes (`@@index`) are placed on `scraped_at`, `applicant_count`, and `recruit_count`.
- **Edge Caching**: 
  - The core `/api/campaigns` API uses `NextResponse` headers: `Cache-Control: s-maxage=60, stale-while-revalidate=600`.
  - This guarantees that repeated filters/searches respond in sub-100ms without hitting the Supabase DB directly, drastically reducing database read units.
