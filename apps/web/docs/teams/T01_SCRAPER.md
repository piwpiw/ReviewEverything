# T01_SCRAPER — Data Acquisition Team

## Mission

- Improve reliability and recoverability of `revu`, `reviewnote`, and other acquisition adapters from source through DB write.
- Keep crawler throughput stable under block/DOM change and ensure admin can observe concrete run causes.

## Scope

- `sources/adapters/*`
- `sources/registry.ts`
- `lib/fetcher.ts`
- `lib/ingest.ts`
- `sources/normalize.ts`
- `lib/backgroundWorker.ts`

## Strategy

- Fetch layer: separate retry rules by status code, honor Retry-After, and apply capped exponential + jitter backoff.
- Ingestion layer: track run quality with three counters: fetch failure, processing failure, and duplicate skip.
- Normalize layer: make URL handling and upsert/snapshot writes safer with transaction boundaries.
- Worker layer: use platform-scoped exponential retry interval when a run fails transiently.

## Execution Protocol

1. Update fetch layer retry classification (`403`, `429`, `5xx`, network errors) and timeouts.
2. Prevent run-level duplicate `original_id` writes in one pass.
3. Strengthen run logs for root-cause hints (`fetchFailures`, `duplicateItems`, `processErrors`).
4. Improve snapshot/campaign write consistency in normalize with transactionized create/update.
5. Adjust worker retry policy to exponential delay instead of fixed delay.
6. Add failure-class routing (fetch/quality/logic) and tie it to worker backoff selection.

## Quality Indicators

- Valid-item ratio below threshold must be reported as quality warning and stored in run logs.
- Consecutive fetch failures should stop the run earlier than silent skip loops.
- Duplicate IDs should not inflate snapshots or churn campaign rows.
- Failed run reasons should map to clear operational action: retry, wait, or adapter review.
- Fetch failures should preserve retry intent (`rate_limit`/`network`/`timeout`) and not be mixed with structural quality regressions.

## Done Definition

- Core retry paths changed and deployed without broad behavior breakage.
- `RUNNING` and `FAILED` reasons become sufficiently diagnosable from `/api/admin/runs`.
- Data loss risk reduced by safer transaction flow and fallback URL handling.
