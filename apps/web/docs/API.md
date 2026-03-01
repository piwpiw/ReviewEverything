# API Reference

## Source of Truth
- `apps/web` 코드 기준으로 공개 라우트와 계획 라우트를 분리해 관리
- 공통 응답 스키마: `data`, `meta`, `error`

## 운영 규칙 (문서-코드 정합성)
- 라우트 존재성 = 구현(`implemented`) 기준은 `apps/web/app/api` 실제 경로 존재 여부만 사용
- 문서 라벨은 `implemented` / `planned` 1개 규칙으로 고정
- 기능 노출은 화면별 노출 정책(`팀 문서` + `PROJECT_STATUS_NEXT_ACTIONS`)과 동기화
- 변경 반영 순서: `API.md` -> `ARCHITECTURE.md` -> `TEAM_CONTEXT.md` -> `AGENT_WORKFLOW.md` -> `PROJECT_STATUS.md`

## Implemented public endpoints

- `GET /api/campaigns`
- `GET /api/analytics`
- `GET /api/cron` (query: `runNow`, `limit`)
- `POST /api/admin/ingest`
- `GET /api/admin/runs`
- `GET /api/admin/quality`
- `GET /api/admin/alerts`
- `POST /api/admin/alerts/actions` (`ack`, `snooze`)
- `GET /api/health`
- `GET /api/me/revenue`
- `GET /api/me/board`
- `GET /api/me/pro`
- `POST /api/me/pro`

Note:
- `POST /api/admin/alerts/actions` suppression state is runtime-memory based for current beta operation window.

### Team owner mapping (implemented)

- `T03_DATABASE`
  - `GET /api/campaigns`
  - `GET /api/analytics`
- `T04_WORKER`
  - `GET /api/cron`
  - `POST /api/admin/ingest`
- `T10_OBSERVABILITY`
  - `GET /api/health`
  - `GET /api/admin/runs`
  - `GET /api/admin/quality`
  - `GET /api/admin/alerts`
  - `POST /api/admin/alerts/actions`
- `T08_MANAGER`
  - `GET /api/me/revenue`
  - `GET /api/me/board`
  - `GET /api/me/pro`
  - `POST /api/me/pro`

## Planned / 미구현 API (roadmap)

- `GET /api/campaigns/:id`
- `GET /api/campaigns/:id/related`
- `GET /api/me/schedules`
- `GET /api/me/schedules/summary`
- `GET /api/me/schedules/:id`
- `POST /api/me/schedules`
- `PATCH /api/me/schedules/:id`
- `DELETE /api/me/schedules/:id`
- `GET /api/me/notifications`
- `PATCH /api/me/notifications`
- `POST /api/me/notifications/test`
- `POST /api/jobs` (내부 worker 트리거 후보, 현재 공개 라우트 없음)

### Team owner mapping (planned)

- `T08_MANAGER`
  - `/api/me/schedules*`
  - `/api/me/notifications*`
- `T05_NOTIFIER`
  - 알림 발송/재시도 트리거 및 상태 노출
- `T04_WORKER`
  - `POST /api/jobs` (내부 실행 포인트)
