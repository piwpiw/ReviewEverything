# ReviewEverything Agent Policy (Execution Handbook)

Last Updated: 2026-03-01
Scope: Project execution for `d:\BohemianStudio\ReviewEverything`

## 1) Token efficiency policy
- Load only what is needed: read docs using hashtag/indexed sections (`#metadata`, `#constraints`, `#next-steps`) before full file reads.
- Prefer precise commands over broad scans. Avoid scanning `node_modules`, `.next`, or large generated folders by default.
- When changing code, touch only target files and keep one reasoning pass in context at a time.
- Prefer incremental edits over full refactors unless data model/architecture changes are required.
- Summarize decisions in compact bullet form; avoid narrative duplication across docs and PR descriptions.

## 2) MCP tool policy
- MCP Tool Settings:
  - `search: true` (default for all tasks that require lookup, verification, or diff context)
  - `github: conditional` (only when issue/PR/commit context is missing)
  - `filesystem: on-demand`
- Before large edits, check if an MCP lookup can replace broad file reads.
- Keep MCP search results short and explicit: source, timestamp/commit hash, and decision.

## 3) Naming standard (new implementation)
- File naming:
  - Source modules: `feature-<domain>.ts` or `feature-<domain>/<name>.ts`
  - API domain handlers: `<domain>.ts`, route files remain `route.ts` by Next.js convention
  - Background/automation: `worker-<purpose>.ts`, `job-<purpose>.ts`, `crontask-<purpose>.ts`
  - Adapters: `adapters/<platform>-adapter.ts`
  - Shared utilities: `*.util.ts` (generic helpers), `*.service.ts` (coordinating use-cases), `*.repo.ts` (DB I/O)
- Function naming:
  - Use verb-first names: `fetchCampaigns`, `normalizeRewardValue`, `enqueueReminderJobs`, `runDueNotices`.
  - Prefer domain nouns in function suffixes (`Campaign`, `Schedule`, `Notification`), avoid ambiguous names (`process`, `handleData`).
- API functions:
  - `GET /api/...` handlers keep intent names: `listCampaigns`, `getRevenueSummary`, `saveSchedule`.
  - Worker entry functions: `runWorkerLoop`, `acquireJobLock`, `finalizeJob`.
- PRD alignment:
  - Keep names traceable to PRD sections (Discovery, CRM, Analytics, Worker/Notifier) for easier review and QA mapping.

## 4) Repeatable automation (PR/Build loop)
- Use one command for PR pre-check:
  - `npm run agent:review` (lint + typecheck + test)
- Use one command for delivery quality gate:
  - `npm run agent:qa` (lint + typecheck + test + smoke + build + summary report)
- For deployment safety:
  - run `npm run agent:review` before any PR comment / branch handoff.
  - run `npm run agent:qa` before requesting manual merge or release.
- Output artifact:
  - `apps/web/reports/agent-<mode>-summary.md` is generated for every run.

## 5) PR review efficiency (cross-agent)
- Link every code change to one of:
  - `DISCOVERY`: campaign filtering/filter UX/data normalization
  - `CRM`: schedule/revenue/private schedule path
  - `WORKER`: queue, cron, notifications
  - `INFRA`: CI, release, scripts, observability
- For each PR, include:
  - changed files (max 8 prioritized files),
  - impacted API route(s),
  - risk points and rollback plan.
- Any PR without summary and rollback note is considered incomplete.

## 6) Ongoing integration guardrails
- Do not replace major systems when small extension is possible (`lane-safe` principle).
- Maintain schema migrations backward-compatible (no breaking changes without migration notes).
- Keep `apps/web/reports` artifacts clean of stale artifacts by overwriting on each run.
- If a task fails due to environment dependency (`DB`, `Vercel`, external MCP), stop at first meaningful failure and report exact cause.

## 7) Update protocol for this document
- This file must stay under 500 lines.
- Edit only this file + related scripts in one patch when policy changes.
- Keep instructions action-oriented and machine-readable.

## 8) Single-doc and fast-response protocol
- Do not create or maintain multiple `claude.md` files. This file is the canonical policy document.
- For speed-oriented tasks, keep this order:
  1. validate: `npm run agent:review`
  2. fix blockers only (compile/runtime blockers, not warning cleanup first)
  3. rerun `npm run agent:review` for hard-stop confirmation
  4. if requested for deploy: perform commit/push/redeploy path immediately
- Deployment policy:
  - if release flow is requested, keep command path explicit and fast:
    - `npm run release -- --auto-commit --skip-tests --skip-build --message=...` for local verification
    - then `git push origin HEAD`
    - then `vercel --prod --yes` (or rely on GitHub→Vercel webhook if configured)
- Failure policy:
  - On first environment-blocking error (`DB`, `Vercel`, network, auth), stop implementation changes and report exact root cause + required credential fix.
 
## 9) Error checkpoint for pre-deploy (mandatory)
- Run `npm run predeploy:local` before any requested deploy and record result.
- If parser errors appear, stop immediately and fix only syntax blockers first:
  - JSX/TSX unclosed tags
  - broken string literals/backticks
  - missing/duplicated closing JSX fragments
- Keep `npm run build` output if it fails:
  - save the first file/line from `Parsing ecmascript source code failed`
  - do not proceed to push until that error is 0.
- Recurrence prevention:
  - one file changed => compile-check that file directly via `node -e "import('./')"` equivalent not needed; use full `npm run build` when edits touch shared components/layout.
  - if edit involves large text conversions, avoid command-line raw replacement; prefer direct patch.
