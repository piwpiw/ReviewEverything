# ReviewEverything (Beta)

AI-driven aggregator for multi-platform influencer campaigns. Consolidates data from 7 major Korean review platforms into a unified searchable hub with real-time competition analysis.

## ?? System Architecture & Agent Index

```mermaid
graph TD
    A[Cron Job / Admin] -->|Trigger| B[Ingestion Engine]
    B --> C{Adapter Registry}
    C -->|Revu| D[Adapter: Revu]
    C -->|Reviewnote| E[Adapter: ReviewNote]
    C -->|...| F[Adapter: 5+ Others]
    D & E & F -->|Scraped Data| G[Normalization Layer]
    G --> H[Dedupe & Snapshot Logic]
    H --> I[(Postgres SQL / Supabase)]
    J[Next.js App] -->|QueryBuilder| I
    J --> K[Premium UI/UX & Trending]
```

### ?쭬 Agent Quick Index (Fast Onboarding)
For future AI agents modifying this project, here are the core locations and their purposes:

- **Main Configs**: 
  - `prisma/schema.prisma` (DB models, Indexes for `scraped_at`, `applicant_count`)
  - `.env` (Requires `DATABASE_URL`, `DIRECT_URL`, `ADMIN_PASSWORD`, `CRON_SECRET`)
- **Scraping Adapters** (`sources/adapters/*.ts`): 
  - 100% Live Cheerio Scrapers for 7 Platforms: `revu`, `reviewnote`, `dinnerqueen`, `reviewplace`, `mrblog`, `seouloppa`, `gangnamfood`.
  - Interfaces in `sources/types.ts`.
- **Core Logic**:
  - `lib/ingest.ts` (Handles the ETL pipeline from Adapters -> DB)
  - `lib/analytics.ts` (Calculates "Trending" and "Hot" campaigns based on applicant velocity)
  - `lib/queryBuilder.ts` (URL parameters -> Prisma `WhereInput`)
- **API Routes** (`app/api/`):
  - `/campaigns/route.ts` (Main API, utilizes Vercel Edge Caching `s-maxage=60`)
  - `/analytics/route.ts` (Returns trending campaigns)
  - `/admin/ingest/route.ts` (Protected by Basic Auth via `middleware.ts`)
- **UI Components** (`components/`):
  - `CampaignCard.tsx` (Premium Jeomsin-style UI, handles "HOT LOW COMP" / "TRENDING" badges)
  - `FilterBar.tsx` / `SortBar.tsx` (Advanced search logic)
- **Pages**:
  - `app/page.tsx` (Main grid & Trending section)
  - `app/admin/page.tsx` (Dashboard for triggering manual ingestion)
  - `app/loading.tsx` (Glassmorphism skeleton screens)

### ?뱴 Detailed Documentation
For an in-depth understanding, see the specialized technical documents:
1. **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)**: Details on the data pipeline, the Trend Engine logic, and database snapshotting models.
2. **[API.md](./docs/API.md)**: Complete guide to all endpoint parameters and Vercel Edge caching strategies.
3. **[SCRAPERS.md](./docs/SCRAPERS.md)**: Extensibility guide for the `Cheerio` adapters, WAF resilience (delays, headers), and fallback mechanisms.
4. **[PROJECT_STATUS.md](./docs/PROJECT_STATUS.md)**: Current implementation status, gaps, and prioritized next work.

## ?썱 Tech Stack

| Layer | Technology | Role |
| :--- | :--- | :--- |
| **Frontend** | Next.js 15 (App Router) | SSR, Routing, UI Components |
| **Styling** | Vanilla CSS + Tailwind | Premium Aesthetics, Responsive Design |
| **ORM** | Prisma | Schema management, Type-safe DB access, Indexed |
| **Database** | Supabase (Postgres) | Persistent storage |
| **Analytics** | Custom Logic | Velocity-based trending calculations |
| **Infrastructure**| Vercel Edge Cache | Sub-100ms API response times |
| **Scraping** | Axios + Cheerio | DOM Parsing & HTTP Client |

## ?? Key Technical Features (Beta)

### 1. Unified Ingestion & Resilience
- **Multi-Adapter Pattern**: Extensible `IPlatformAdapter` interface covering 7 distinct platforms.
- **Auto-Standardization**: Normalizes varied platform mechanics.
- **Industrial-grade Fetcher**: Implemented `fetchWithRetry` using exponential backoff to handle 5xx errors and network timeouts efficiently.
- **Fallbacks & Delays**: Implemented randomized delays and fallback dummy data logic to handle WAF blocks and DOM structure shifts gracefully.

### 2. Analytics & Trend Engine
- **Trend Snapshotting**: Periodically snapshots the ratio of `applicant_count` to `recruit_count`.
- **Velocity Tracking**: `analytics.ts` dynamically calculates the hottest campaigns based on growth rates and highlights them on the homepage.
- **Database Optimization**: `scraped_at` and `applicant_count` are fully indexed in Prisma for rapid analytic queries.

### 3. Engineering Excellence
- **Zero-DB Fallback**: High-fidelity mock system kicks in automatically if the Postgres DB is unreachable, ensuring continuous UI/UX operations.
- **Edge Caching**: `/api/campaigns` leverages `Cache-Control` headers for maximum CDN scalability.
- **Security**: `/admin` operations are securely gated by JWT/Basic Auth middleware.

## ?슗 Operational Status

- **Phase**: Beta (Stabilization)
- **Platforms Supported**: 7/7 (Real-time Scraping)
- **Test Status (2026-02-28)**: `61 passed / 0 failed / 61 total` (see `test_output.txt`)

## ?뱰 Developer Guide

### Running Local Tasks
```bash
npm install     # Install dependencies
npm run dev     # Start development server
npx prisma generate # Generate Prisma client
npx prisma db push  # Sync schema to your Postgres DB
npm test        # Run Vitest suite
npx prisma studio   # Direct database management
```

### CI / Deployment
- GitHub Actions workflow: `.github/workflows/ci.yml` (`main` 브랜치 `push`/`pull_request` 기준)
- CI 실행 명령: `apps/web` 디렉터리에서 `npm run test:ci`
- 테스트 로그는 `apps/web/test_output.txt`로 남기고 워크플로우 아티팩트(`web-test-output`, 14일)로 보관됩니다.
- [Campaigns](../app/page.tsx)
- [Admin](../app/admin/page.tsx)
+ [Campaigns](./app/page.tsx)
+ [Admin](./app/admin/page.tsx)
+
+## Fast Release Command
+
+Use one command to run the full deployment flow:
+
+```bash
+npm run release -- --auto-commit
+```
+
+What it does:
+- run lint
+- run typecheck
+- run full test suite
+- run build
+- commit local changes with a default message (or override with `--message="..."`)
+- push current branch
+- run `vercel --prod --yes`
+- print the production deployment URL
+
+Recommended options:
+- `npm run release -- --auto-commit --message="release: ..."`
+- `npm run release -- --auto-commit --skip-tests`
+- `npm run release -- --auto-commit --skip-build`
+- `npm run release -- --auto-commit --no-push`
+
+Prerequisites:
+- Vercel CLI installed (`npm i -g vercel`) or available in PATH
+- `VERCEL_TOKEN` configured if your shell requires token-based deployment
+- Working tree clean before release (or use `--auto-commit`)

## Fast Release Command

One command can run the whole flow now:

```bash
npm run release -- --message="release: production"
```

Flow:
- run `lint`, `typecheck`, `test:ci`, `build`
- auto-commit local changes when needed
- push current branch
- run `vercel --prod --yes`
- print the production URL

Optional flags:
- `--skip-tests`: skip test run
- `--skip-build`: skip build
- `--no-push`: run locally without pushing
- `--auto-commit` is enabled for `release`, can be replaced in `npm run release:dry-run`
- `--message="..."` custom commit message

Prerequisites:
- Vercel CLI installed and available in PATH (`npm i -g vercel`)
- `VERCEL_TOKEN` if required by your deployment environment

## Fast Release Command

One command can run the whole flow now:

```bash
npm run release -- --message="release: production"
```

Flow:
- run `lint`, `typecheck`, `test:ci`, `build`
- auto-commit local changes when needed
- push current branch
- run `vercel --prod --yes`
- print the production URL

Optional flags:
- `--skip-tests`: skip test run
- `--skip-build`: skip build
- `--no-push`: run locally without pushing
- `--auto-commit` is enabled for `release`, can be replaced in `release:dry-run`
- `--message="..."` custom commit message

Prerequisites:
- Vercel CLI installed and available in PATH (`npm i -g vercel`)
- `VERCEL_TOKEN` if required by your deployment environment
