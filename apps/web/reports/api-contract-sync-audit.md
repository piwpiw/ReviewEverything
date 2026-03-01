# API Contract Sync Audit
Generated: 2026-03-01T03:24:53.646Z
Actual routes: 12
API.md implemented: 5
API.md planned: 4
Tracked route entries from documents: 8
Result: FAIL

## Failures
- [FAIL] OVERLAP: /api/campaign appears in both implemented and planned in API.md
- [FAIL] UNTRACKED_ROUTE: 실제 라우트 /api/admin/alerts/actions 가 API.md에 구현/계획 모두 누락
- [FAIL] UNTRACKED_ROUTE: 실제 라우트 /api/admin/alerts 가 API.md에 구현/계획 모두 누락
- [FAIL] UNTRACKED_ROUTE: 실제 라우트 /api/admin/ingest 가 API.md에 구현/계획 모두 누락
- [FAIL] UNTRACKED_ROUTE: 실제 라우트 /api/admin/quality 가 API.md에 구현/계획 모두 누락
- [FAIL] UNTRACKED_ROUTE: 실제 라우트 /api/admin/runs 가 API.md에 구현/계획 모두 누락
- [FAIL] UNTRACKED_ROUTE: 실제 라우트 /api/analytics 가 API.md에 구현/계획 모두 누락
- [FAIL] UNTRACKED_ROUTE: 실제 라우트 /api/campaigns 가 API.md에 구현/계획 모두 누락
- [FAIL] UNTRACKED_ROUTE: 실제 라우트 /api/cron 가 API.md에 구현/계획 모두 누락
- [FAIL] UNTRACKED_ROUTE: 실제 라우트 /api/health 가 API.md에 구현/계획 모두 누락
- [FAIL] UNTRACKED_ROUTE: 실제 라우트 /api/me/board 가 API.md에 구현/계획 모두 누락
- [FAIL] UNTRACKED_ROUTE: 실제 라우트 /api/me/pro 가 API.md에 구현/계획 모두 누락
- [FAIL] UNTRACKED_ROUTE: 실제 라우트 /api/me/revenue 가 API.md에 구현/계획 모두 누락
- [FAIL] STALE_IMPLEMENTED: API.md implemented /api/campaign 가 app/api에서 미존재
- [FAIL] STALE_IMPLEMENTED: API.md implemented /api/analytic 가 app/api에서 미존재
- [FAIL] STALE_IMPLEMENTED: API.md implemented /api/admin/inge 가 app/api에서 미존재
- [FAIL] STALE_IMPLEMENTED: API.md implemented /api/admin/run 가 app/api에서 미존재
- [FAIL] STALE_IMPLEMENTED: API.md implemented /api/admin/alert 가 app/api에서 미존재
- [FAIL] DOC_CONFLICT: /api/campaign marked as implemented+planned across documents
- [FAIL] DOC_CONFLICT: /api/analytic marked as implemented+planned across documents
- [FAIL] DOC_CONFLICT: /api/admin/inge marked as implemented+planned across documents
- [FAIL] DOC_CONFLICT: /api/admin/run marked as implemented+planned across documents
- [FAIL] DOC_CONFLICT: /api/admin/alert marked as implemented+planned across documents
- [FAIL] DOC_CONFLICT: /api/me marked as implemented+planned across documents
- [FAIL] DOC_CONFLICT: /api/me/notification marked as implemented+planned across documents
- [FAIL] DOC_CONFLICT: /api/job marked as implemented+planned across documents

## Cross-ref (docs)
- /api/admin/alert: implemented@API.md, implemented@PROJECT_STATUS.md, planned@PROJECT_STATUS.md, implemented@PROJECT_STATUS_NEXT_ACTIONS.md, planned@PROJECT_STATUS_NEXT_ACTIONS.md, planned@T06_ANALYTICS.md, implemented@T10_OBSERVABILITY.md
- /api/admin/inge: implemented@API.md, implemented@PROJECT_STATUS.md, planned@PROJECT_STATUS_NEXT_ACTIONS.md, implemented@T04_WORKER.md
- /api/admin/run: implemented@API.md, implemented@PROJECT_STATUS.md, planned@PROJECT_STATUS_NEXT_ACTIONS.md, implemented@T10_OBSERVABILITY.md
- /api/analytic: implemented@API.md, implemented@PROJECT_STATUS.md, planned@PROJECT_STATUS_NEXT_ACTIONS.md, implemented@T06_ANALYTICS.md, implemented@T07_FRONTEND.md
- /api/campaign: implemented@API.md, planned@API.md, implemented@PROJECT_STATUS.md, planned@PROJECT_STATUS.md, implemented@PROJECT_STATUS_NEXT_ACTIONS.md, planned@PROJECT_STATUS_NEXT_ACTIONS.md, implemented@T07_FRONTEND.md, planned@T07_FRONTEND.md
- /api/job: planned@API.md, implemented@PROJECT_STATUS.md, planned@PROJECT_STATUS.md, implemented@PROJECT_STATUS_NEXT_ACTIONS.md, planned@PROJECT_STATUS_NEXT_ACTIONS.md, planned@T04_WORKER.md
- /api/me: planned@API.md, implemented@PROJECT_STATUS.md, planned@PROJECT_STATUS.md, planned@PROJECT_STATUS_NEXT_ACTIONS.md, planned@T07_FRONTEND.md, planned@T08_MANAGER.md
- /api/me/notification: planned@API.md, implemented@PROJECT_STATUS.md, planned@PROJECT_STATUS.md, planned@PROJECT_STATUS_NEXT_ACTIONS.md, planned@T05_NOTIFIER.md, planned@T07_FRONTEND.md, planned@T08_MANAGER.md
