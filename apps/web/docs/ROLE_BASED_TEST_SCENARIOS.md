# Role-Based Test Scenarios (v1)

Updated: 2026-03-06
Scope: apps/web
Goal: Expand quality checks beyond backend to frontend, UI/UX, and stakeholder-specific validation.

## Baseline Quality Signals

- `npm run typecheck`: PASS
- `npm run build`: PASS
- `npm run test:ci`: FAIL (37 failed / 88 total)
- `npm run lint:ci`: FAIL
- `npm run smoke:ci`: SKIPPED (`SMOKE_BASE_URL_OR_VERCEL_URL_NOT_SET`)
- `npm run api:contract-audit`: FAIL
- `npm run api:contract-sync-audit`: FAIL (BOM parsing error)
- `npm run bench:workspace-search:ci`: PASS (guard passed)

## Scenario Matrix

| ID | Role | Scenario | Type | Priority | Current | Gate / Evidence |
|---|---|---|---|---|---|---|
| DEV-01 | Developer | Type safety regression check on changed modules | Auto | P0 | PASS | `npm run typecheck` |
| DEV-02 | Developer | Unit test regression for normalization and dedupe logic | Auto | P0 | FAIL | `npm run test:ci` (dedupe/normalize failures) |
| DEV-03 | Developer | API contract drift audit (route/doc alignment) | Auto | P0 | FAIL | `reports/api-contract-audit.md` |
| DEV-04 | Developer | API sync audit script execution integrity | Auto | P0 | FAIL | `scripts/api-contract-sync-audit.js` BOM issue |
| DEV-05 | Developer | Lint quality on source files only (exclude generated outputs) | Auto | P1 | PARTIAL | `reports/eslint.json` source warnings remain |
| DEV-06 | Developer | Build integrity with App Router pages and routes | Auto | P0 | PASS | `npm run build` |
| PM-01 | Planner | Requirements traceability between routes and docs (`implemented/planned`) | Manual | P0 | FAIL | API contract report has 50 fails |
| PM-02 | Planner | User journey acceptance: Home -> Detail -> Schedule | Manual | P0 | PARTIAL | Flow exists, no E2E acceptance artifact |
| PM-03 | Planner | Admin operational flow acceptance: ingest request -> queue -> done | Manual | P1 | PARTIAL | UI flow exists in `/admin`, no scenario evidence artifact |
| PM-04 | Planner | KPI/quality dashboard acceptance for `/system` | Manual | P1 | PARTIAL | UI exists, no acceptance checklist signed |
| PM-05 | Planner | Release checklist validation (env + smoke + contract) | Manual+Auto | P0 | FAIL | `deploy:env-check`, `smoke`, `api:contract-*` |
| DSN-01 | Designer | Visual system consistency (tokens, spacing, typography) | Manual | P1 | PARTIAL | `app/globals.css` tokens exist |
| DSN-02 | Designer | Responsive behavior at 360/768/1440 breakpoints | Manual | P0 | PARTIAL | Responsive classes present, no viewport QA report |
| DSN-03 | Designer | Accessibility keyboard focus order and visible focus | Manual | P0 | PARTIAL | focus-visible styles exist, no keyboard test report |
| DSN-04 | Designer | Empty/loading/error/not-found state quality | Manual | P0 | PARTIAL | routes exist: `loading.tsx`, `error.tsx`, `not-found.tsx` |
| DSN-05 | Designer | Text integrity and copy quality (garbled text detection) | Auto+Manual | P0 | FAIL | broken text in layout/docs files |
| DSN-06 | Designer | Dark/light contrast and component readability | Manual | P1 | PARTIAL | dark theme classes present, no contrast audit report |
| USR-01 | User | Campaign search/filter/sort completion under 10s | Manual+Auto | P0 | PARTIAL | no E2E metric, bench exists for workspace search only |
| USR-02 | User | Map flow fallback when permission denied | Manual | P1 | PARTIAL | map redirect and fallback banner implemented |
| USR-03 | User | Campaign detail quick actions and schedule add success | Manual | P0 | PARTIAL | UI exists, no scenario execution log |
| USR-04 | User | Me dashboard quick actions and recovery links | Manual | P1 | PARTIAL | `/me` recovery links implemented |
| USR-05 | User | Notification preference and delivery visibility | Manual+Auto | P1 | PARTIAL | APIs/routes exist, no end-to-end evidence |
| USR-06 | User | Error recovery experience (retry paths from fail states) | Manual | P0 | PARTIAL | retry controls exist in list/system/admin pages |

## Execution Policy

- P0 scenarios must pass before production release.
- P1 scenarios may ship only with an approved risk note.
- Standard gate command: `npm run quality:standard`
- Every manual scenario must produce an artifact in `apps/web/reports/`:
  - `scenario-id`, `tester-role`, `date`, `result`, `evidence-path`.

## Immediate Gap Summary

- Missing: UI/E2E acceptance artifacts by Planner/Designer/User roles.
- Missing: automated UI tests (Playwright/Cypress not wired).
- Blocking defects: test regression, API contract drift, BOM parsing error, smoke/env gating.
- Content quality issue: garbled text in key UI/document metadata paths.
