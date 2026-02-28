# Project Status Update (2026-02-28)

## Current Snapshot
- Scope: `apps/web` (Next.js app, Prisma schema, adapters, API routes)
- Current phase: Beta in active stabilization
- Latest recorded test run: `61 passed / 0 failed / 61 total` from `test_output.txt`
- Test status currently reflects adapter contract normalization and health/admin hardening work
- Baseline docs synced on 2026-02-28 (`README.md`, `docs/API.md`)

## Completed In This Update
- Updated `README.md` operational status to reflect latest recorded test result.
- Aligned `docs/API.md` ingest request contract with implementation (`platform_id` single value).
- Fixed platform filter option mapping and completed 7-platform coverage in `FilterBar.tsx`.
- Implemented actual low-competition ordering for `competition_asc` in web page and campaigns API.
- Synced adapter fixture expectations with current fallback contract for `MrBlogAdapter` and `GangnamFoodAdapter`.
- Removed default `ADMIN_PASSWORD` fallback in `middleware.ts` and added fail-closed behavior.
- Updated `/api/health` to verify DB availability and return `db: ok/down` with 503 on DB failure.
- Updated admin dashboard health check to consume `/api/health` response (`db` field) before rendering ONLINE status.
- Added GitHub Actions CI workflow (`.github/workflows/ci.yml`) to run `apps/web` tests on `main` push/PR.

## What Is Implemented
- Data model and indexing are defined in Prisma:
  - `Platform`, `Campaign`, `CampaignSnapshot`, `IngestRun`
  - snapshot/query indexes for ingestion and analytics workloads
- Main API routes exist and are wired:
  - `GET /api/campaigns`
  - `GET /api/analytics`
  - `POST /api/admin/ingest`
  - `GET /api/admin/runs`
  - `GET /api/health`
  - `GET /api/cron`
- Ingestion pipeline is implemented:
  - adapter fetch loop (up to 5 pages)
  - dedupe/normalize processing
  - ingest run tracking (`RUNNING`, `SUCCESS`, `FAILED`)
- Adapter registry contains 7 platforms (`sources/registry.ts`)
- Admin dashboard exists with:
  - health check
  - ingest trigger per platform/all
  - run log polling

## Gaps And Risks
- Security and operation hardening completed; remaining validation:
  - Regression coverage on adapter fixture expectations was completed in this cycle.
  - CI workflow now exists but should still be verified on first real PR/merge.
- Product polish pending:
  - Minor UX copy and zero-state messaging can be aligned with final brand tone.
- Data-source behavior:
  - Mock mode now has explicit semantics: DB unavailable -> mock fallback, DB empty -> clear empty state.

## Next Work (Prioritized)
1. P2: Verify CI gate on first PR/MR run and add failure notifications if needed.

## Suggested Update Cadence
- Revisit this document after each of:
  - adapter contract decision
  - test suite stabilization
  - auth hardening merge
