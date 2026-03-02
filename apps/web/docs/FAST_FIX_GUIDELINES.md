# Fast Fix & Deployment Guidelines

## 1) Core Rule
- Do only what is needed to pass the specific failure.
- Verify root cause before changing formatting/locale/encoding.
- If a fix is repeated, convert it into a script or checklist item.

## 2) Parallel First
- Run these in parallel whenever possible:
  - log review + changed file scan
  - route/mapping scans + static syntax checks
  - dependency/gate-level risk checks
- Keep each branch of work independent and reversible.

## 3) Scope Control
- app/lib/scripts changes -> run lint/typecheck/smoke/test gates as required.
- docs-only changes -> keep deploy path docs-only when possible.
- avoid editing unrelated files; prefer minimal diff.

## 4) Deployment Hygiene
- Local flow:
  - `npm run check`
  - `npm run build`
- CI flow:
  - standard install flags: `npm ci --no-audit --no-fund --prefer-offline`
  - keep artifact names stable (`ci-reports-*`) for issue automation
  - summary from failure issues should include run links and top lines

## 5) Residual Issue Protocol
- If a new residual issue appears, record it in this doc under a numbered checklist item.
- Fixes should target a small number of files and include a one-line reason.
- After each fix, update this file only when a new repeat pattern is established.

## 6) Known Native Dependency Recovery (Windows build)
- If build fails with missing `lightningcss` or `@tailwindcss/oxide` native binaries on Windows, install the native optional packages with:
  - `npm i --no-save lightningcss-win32-x64-msvc @tailwindcss/oxide-win32-x64-msvc`
- Prefer keeping these modules as `optionalDependencies` so Linux CI remains unaffected while Windows local builds stay recoverable.
- If optional module installation is missing, verify npm platform config (`npm config get os`) before rerunning `npm ci`.

## 7) Parallel Residual Tasks
- Track residual issues in a short checklist (max 5 items per cycle):
  1. Reproducible parser/syntax failure (code-path specific) => fix first and re-check with `npm run build`.
  2. Deploy runtime mismatch (`npm/requirements`, start command, health check) => align runtime settings and retry once.
  3. CI gate noise increase => add scoped summaries before changing rules.
  4. Platform-specific dependency drift (Windows optional binaries) => refresh optionalDependencies + local npm config check.
  5. Deployment automation gap => add one missing health/deploy signal and verify in one PR.

## 8) Active Residual Issues
- [ ] Lint warnings (non-blocking): 88 warnings remain; do not expand scope beyond required fixes unless a warning blocks deploy.
  - Focus first on high-impact files touched by deployment paths: `app/api/campaigns/route.ts`, `app/api/health/route.ts`, `components/*`, `lib/*`.
  - Apply changes in small batches (max 5 files) and gate with `npm run lint` each batch.
- [ ] Next middleware deprecation warning (`middleware` convention): migrate only when route-level impact is confirmed.
  - Current risk: warning only; no functional regression currently.
  - Candidate path: `next.config`/edge proxy path migration under dedicated PR.
- [ ] Image optimization warnings (`<img>` in several pages/components): optional UX/perf cleanup.
  - Done for: `app/trending/page.tsx`, `app/campaigns/[id]/page.tsx`
  - Remaining candidates: `components/AICuration.tsx`, `components/MapView.tsx`
- [ ] Local/CI parity for mock fallback behavior:
  - Keep current behavior but document expected `DATABASE_URL`/`DIRECT_URL` validation in release checks.

## 9) Parallel Fix Queue (next cycle, max 2 branches)
- Branch A (Infra/Runtime): verify deployment checks and runtime contracts.
  - `render.yaml` parity: add required env var presence checks in local pre-deploy flow.
  - Confirm `/api/health` semantics for Render health probes.
  - Run `npm run deploy:env-check` before `npm run predeploy:local`.
- Branch B (Code Quality): reduce highest-impact warnings only.
  - Prioritize files with highest warning density and direct user impact.
  - Re-check after each branch to keep rollback boundaries clear.
- Branch C (Release Safety): enforce env + smoke alignment.
  - Keep `npm run predeploy:local` as the default local release gate.
  - Add one-line gate checklist before push: env check, lint, typecheck, test, build.

## 10) Operational Residuals (Non-blocking)
- [ ] Lint warning hotspots to handle by priority (post-stability):
  - app/trending/page.tsx (previously handled <img> and runtime fallback warning).
  - apps/web/app/me/notifications/page.tsx (single eslint-disable-next-line waiver).
- [ ] Clean temporary script artifacts in apps/web/tmp at deployment checkpoints (historical debug scripts and large HTML dumps).
- [ ] CI artifact hygiene:
  - Keep apps/web/reports bounded by overwriting fixed filenames (agent-review-summary.md, smoke.json, ci-summary.md) to avoid stale cross-run confusion.
  - Add a periodic cleanup rule when running local smoke/build loops.
- [ ] Docs/encoding consistency:
  - Remove mojibake risk from docs headers before introducing new public-facing docs.
  - Update any malformed Unicode section titles in localized docs when touched.

## 11) Additional Parallel Update Batches
- Batch A (Runtime safety):
  - Add one-line smoke gate for /api/health in deploy preflight (once stable).
  - Ensure CRON path (/api/jobs) and CRON_SECRET error messaging remain explicit.
- Batch B (Code cleanup):
  - Narrow warnings by file batches of 2-3 files per pass (trending, components/AICuration, components/MapView).
  - Keep each pass under one reviewer cycle, then re-run npm run lint.



