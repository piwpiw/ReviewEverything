# ReviewEverything (Beta)

AI-driven aggregator for multi-platform influencer campaigns. Consolidates data from 7 major Korean review platforms into a unified searchable hub with real-time competition analysis.

## 🚀 System Architecture & Agent Index

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

### 📍 Agent Quick Index (Fast Onboarding)
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

### 📚 Detailed Documentation
For an in-depth understanding, see the specialized technical documents:
1. **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)**: Details on the data pipeline, the Trend Engine logic, and database snapshotting models.
2. **[API.md](./docs/API.md)**: Complete guide to all endpoint parameters and Vercel Edge caching strategies.
3. **[SCRAPERS.md](./docs/SCRAPERS.md)**: Extensibility guide for the `Cheerio` adapters, WAF resilience (delays, headers), and fallback mechanisms.
4. **[PROJECT_STATUS.md](./docs/PROJECT_STATUS.md)**: Current implementation status, gaps, and prioritized next work.

## 🛠️ Tech Stack

| Layer | Technology | Role |
| :--- | :--- | :--- |
| **Frontend** | Next.js 15 (App Router) | SSR, Routing, UI Components |
| **Styling** | Vanilla CSS + Tailwind | Premium Aesthetics, Responsive Design |
| **ORM** | Prisma | Schema management, Type-safe DB access, Indexed |
| **Database** | Supabase (Postgres) | Persistent storage |
| **Analytics** | Custom Logic | Velocity-based trending calculations |
| **Infrastructure**| Vercel Edge Cache | Sub-100ms API response times |
| **Scraping** | Axios + Cheerio | DOM Parsing & HTTP Client |

## 💎 Key Technical Features (Beta)

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

## 📡 Operational Status

- **Phase**: Beta (Stabilization)
- **Platforms Supported**: 7/7 (Real-time Scraping)
- **Test Status (2026-02-28)**: `61 passed / 0 failed / 61 total` (see `test_output.txt`)

## 📖 Developer Guide

### Running Local Tasks
```bash
npm install     # Install dependencies
npm run dev     # Start development server
npx prisma generate # Generate Prisma client
npx prisma migrate deploy # Applies all SQL migrations (required on fresh DB)
npx prisma db seed # Seed sample data after migrations
npx prisma db push  # Sync schema to your Postgres DB
npm test        # Run Vitest suite
npx prisma studio   # Direct database management
```

### Worker/배치 병렬성 튜닝(운영 권장)

`lib/backgroundWorker.ts`의 병렬 실행은 아래 env로 직접 조절할 수 있습니다.

- `INGEST_JOB_CONCURRENCY` (기본 4): INGEST job 집합의 총 동시성 슬롯
- `INGEST_REMINDER_JOB_CONCURRENCY` (기본 2): `REMINDER_SCAN` 우선 job 동시성 슬롯
- `NOTIFICATION_DISPATCH_CONCURRENCY` (기본 6): 알림 전송 큐(`PENDING` 배달)의 동시 발송 슬롯
- `REMINDER_DELIVERY_CREATE_BATCH` (기본 200): 리마인더 생성 배치 크기
- `REMINDER_DELIVERY_CREATE_CONCURRENCY` (기본 2): 리마인더 생성 배치 동시성
- `INGEST_JOB_WEIGHT_DIVISOR` (기본 4): `maxPagesPerRun` 가중치 계산 분모
- `INGEST_JOB_WEIGHT_MIN` (기본 1): 슬롯 가중치 하한
- `INGEST_JOB_WEIGHT_MAX` (기본 4): 슬롯 가중치 상한

운영 가이드 예시
- 1차 트러블슈팅: `INGEST_JOB_CONCURRENCY=6`, `NOTIFICATION_DISPATCH_CONCURRENCY=8`
- 부하 급등 시: `INGEST_JOB_WEIGHT_MAX=3`, `INGEST_REMINDER_JOB_CONCURRENCY=2`
- 안정화 우선: `INGEST_REMINDER_JOB_CONCURRENCY=1`, `NOTIFICATION_DISPATCH_CONCURRENCY=4`

### Fresh Supabase DB bootstrap (first time)
If the Supabase `Table Editor` shows no tables, it means the migration set has not been applied.

1. Add the environment variables to `.env.local` (or Vercel environment variables) in this order:
   - `DATABASE_URL=postgresql://postgres:[PASSWORD]@db.jhvanyvkgvprttrjvzgz.supabase.co:5432/postgres?sslmode=require`
   - `DIRECT_URL=postgresql://postgres:[PASSWORD]@db.jhvanyvkgvprttrjvzgz.supabase.co:5432/postgres?sslmode=require`
2. Run migration + seed:
```bash
npx prisma migrate deploy
npx prisma db seed
```
3. Verify in table editor:
   - `Platform`, `Campaign`, `CampaignSnapshot`, `IngestRun`, `BackgroundJob`, `User`, `UserSchedule`, `NotificationDelivery`

Note: if you run with Prisma through Supabase pooler endpoint, use the password and username format from Supabase dashboard for that endpoint. If `tenant or user not found` appears, switch back to the direct DB endpoint first.

### CI / Deployment
- GitHub Actions workflow: `.github/workflows/ci.yml` (`main` 브랜치 `push`/`pull_request` 기준)
- CI 실행 명령: `apps/web` 디렉터리에서 `npm run test:ci`
- 테스트 로그는 `apps/web/test_output.txt`로 남기고 워크플로우 아티팩트(`web-test-output`, 14일)로 보관됩니다.
- [Campaigns](./app/page.tsx)
- [Admin](./app/admin/page.tsx)

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
- `--skip-verify`: release 전용 빠른 실행. `deploy:target-check`만 수행하고 `verify:local`은 건너뜀.

Prerequisites:
- Vercel CLI installed and available in PATH (`npm i -g vercel`)
- `VERCEL_TOKEN` if required by your deployment environment

## TOP20 멀티 에이전트 수집 런북

### TOP20 위상별 즉시 실행

- `npm run ingest:top20 -- --phases=A,B,C --limit=12`
- `npm run ingest:top20 -- --phases=A --platform_keys=reviewnote,revu,dinnerqueen`

### 3시간 지속 병렬 루프

- `npm run ingest:top20:loop`
- 기본 동작: A/B/C 병렬 실행, 20분 간격, 3시간(180분) 자동 종료
- 종료: `Ctrl+C`(현재 사이클 완료 후 즉시 종료)

### API 수동 트리거

- `GET /api/cron?runNow=true&phases=A,B,C&limit=12`
- `POST /api/jobs` with body: `{"runNow":true,"phases":["A","C"],"limit":12}`

로그 저장:
- `npm run ingest:top20 -- --phases=A,B,C --log_file=./logs/top20-runner.log`

### 3시간 멀티 에이전트 동시 구동

- `npm run ingest:top20:agents:3h`
- 내부적으로 `A/B/C`를 각각 독립 프로세스로 동시에 구동하고 로그를 분리(`./logs/top20-agents/agent-*.log`) 기록
