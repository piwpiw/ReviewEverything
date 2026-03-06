# Project Scorecard (Expanded Review)

Date: 2026-03-06
Scope: `apps/web`
Method: backend + frontend + UI/UX + role-based test readiness

## Final Score

- Overall score: **41 / 100**
- Previous backend-gate-centric score: 34 / 100
- Interpretation: Screen implementation exists and is non-trivial, but release reliability is still low.

## Weighted Breakdown

| Area | Weight | Score | Weighted | Why |
|---|---:|---:|---:|---|
| Product Coverage (Frontend + Backend surfaces) | 15 | 11 | 11.0 | 14 pages, 8 layouts, 30+ components, broad API routes |
| UI/UX Design Quality | 15 | 8 | 8.0 | Strong visual composition and state cards, but copy/encoding integrity issues and no formal UX audit artifact |
| User Journey Reliability | 15 | 6 | 6.0 | Recovery/fallback paths exist, but no E2E scenario evidence |
| Engineering Quality (Type/Lint health) | 15 | 8 | 8.0 | typecheck pass; lint currently fails/noisy |
| Test Reliability (unit/integration) | 15 | 4 | 4.0 | 37 failed / 88 total in `test:ci` |
| CI/CD + Ops Readiness | 15 | 4 | 4.0 | build pass, but smoke skipped, contract audit fail, sync audit script fail, env check fail |
| Planning/Documentation Alignment | 10 | 0 | 0.0 | API contract drift report fail count is high (50 fail signals) |
| **Total** | **100** |  | **41.0** |  |

## Evidence Snapshot

- PASS
  - `npm run typecheck`
  - `npm run build`
  - `npm run bench:workspace-search:ci`
  - `npm run deploy:target-check`
- FAIL or SKIP
  - `npm run test:ci` -> 37 failed / 88
  - `npm run lint:ci` -> fail result
  - `npm run api:contract-audit` -> fail report
  - `npm run api:contract-sync-audit` -> BOM parse error
  - `npm run deploy:env-check` -> DB/ADMIN env validation fail
  - `npm run smoke:ci` -> skipped

## UI/UX-Specific Findings

- UI surface is present and rich:
  - Home, campaign detail, map redirect/fallback, me dashboard, admin/system consoles.
- Accessibility intent is present:
  - focus-visible styles and aria-label usage are visible across pages.
- Critical UX quality issue:
  - garbled text appears in core metadata/docs paths (`app/layout.tsx`, `README.md`, several docs), degrading trust and clarity.
- Validation gap:
  - no automated UI regression suite and no role-based manual acceptance artifacts in `reports/`.

## Score Improvement Targets

- Target 55+: fix P0 blockers
  - Test failures (dedupe/normalize/fixture)
  - API contract drift
  - BOM issue in `api-contract-sync-audit.js`
  - smoke/env gate activation
- Target 70+: add role-based acceptance evidence
  - Execute `ROLE_BASED_TEST_SCENARIOS.md` P0 set with artifacts
  - Add UI E2E baseline for critical flows
