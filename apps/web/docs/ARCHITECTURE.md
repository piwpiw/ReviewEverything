# System Architecture

## Scope
This document is the source of truth for architecture-level decisions in `apps/web`.

## Runtime Topology
- `Next.js App Router` serves UI pages and API routes.
- `Prisma + PostgreSQL (Supabase)` is the primary datastore.
- `Adapter layer` under `sources/adapters` normalizes external campaign pages.
- `Ingestion orchestrator` in `lib/ingest.ts` executes platform jobs and persists campaign snapshots.

## Data Flow
1. Trigger paths:
- Scheduled: `/api/cron`
- Manual: `/api/admin/ingest`
2. Ingest pipeline:
- Select adapters by platform id.
- Fetch via resilient HTTP client (`fetchWithRetry` behavior in adapters/lib).
- Normalize to internal campaign schema.
- Upsert campaign and snapshot rows.
3. Read pipeline:
- `/api/campaigns` provides list/search/filter responses.
- `/api/analytics` computes trend-oriented views from snapshot history.
- `/api/admin/runs` exposes run states for the admin dashboard.

## Reliability Rules
- Ingestion must not block on one failing platform; use per-platform isolation.
- API responses must preserve stable shape for UI (`data`, `meta`, and error contract).
- Pages may degrade to mock/fallback mode only when DB read paths are unavailable.
- Health endpoint `/api/health` is the canonical liveness probe.

## Performance Rules
- Keep read-heavy endpoints cache-aware (`s-maxage`, stale-while-revalidate when appropriate).
- Avoid N+1 reads in list APIs; prefer include/select with bounded fields.
- Snapshot writes should be append-oriented to support trend calculations.

## Security and Ops
- No secrets in client bundles.
- Server-only env vars must be read only in server routes/libs.
- CI gates (`lint`, `typecheck`, `test`, `smoke`) are required before merge.

## Change Control
When architecture changes, update this file in the same PR with:
- Changed components/routes
- New invariants
- Migration impact
