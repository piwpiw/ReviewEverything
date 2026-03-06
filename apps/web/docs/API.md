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
- `GET /api/campaigns/:id`
- `GET /api/campaigns/:id/related`
- `GET /api/analytics`
- `GET /api/cron` (query: `runNow`, `limit`, `phases`, `phase`, `platform_keys`)
- `POST /api/admin/ingest`
- `GET /api/admin/creators`
- `POST /api/admin/creators`
- `PATCH /api/admin/creators/:id`
- `DELETE /api/admin/creators/:id`
- `GET /api/admin/creators/autologin` (후보 정렬/상태 정책 조회). 응답 필드: `failure_code`, `failure_label` 포함.
- `GET /api/admin/analytics/stats`
- `GET /api/admin/platforms`
- `POST /api/admin/platforms`
- `PATCH /api/admin/platforms/:id`
- `DELETE /api/admin/platforms/:id`
- `GET /api/admin/runs`
- `GET /api/admin/quality`
- `GET /api/admin/alerts`
- `POST /api/admin/alerts/actions` (`ack`, `snooze`)
- `POST /api/analytics/log`
- `GET /api/health`
- `GET /api/public/stats`
- `GET /api/search/suggest`
- `POST /api/jobs` (internal endpoint, `CRON_SECRET` required)
  - 예시 body: `{"runNow":true,"phases":["A","B","C"],"limit":12,"platform_keys":["reviewnote","revu"]}`
- `GET /api/me/revenue`
- `GET /api/me/board`
- `GET /api/me/pro`
- `POST /api/me/pro`
- `GET /api/me/curation`
- `GET /api/me/schedules`
- `POST /api/me/schedules`
- `PATCH /api/me/schedules/:id`
- `DELETE /api/me/schedules/:id`
- `GET /api/me/notifications`
- `POST /api/me/notifications`
- `PATCH /api/me/notifications`
- `DELETE /api/me/notifications/:id`
- `POST /api/me/notifications/test`
- `GET /api/me/notification-channels`
- `GET /api/me/notification-preferences`
- `PUT /api/me/notification-preferences`

`GET /api/me/notifications` 지원 파라미터:
- `status=success|pending|failed`
- `channel=all|push|kakao|telegram`
- `from` / `to` (ISO8601)
- `days=7|30|90|...`
- `take` (default 50, min 10, max 100)
- `cursor` (id of the last item from previous page; used with `take`)

`GET /api/me/notifications` 응답:
- `{ data: NotificationDelivery[], meta: { count: number, hasMore: boolean, nextCursor: number | null } }`

Note:
- `POST /api/admin/alerts/actions` suppression state is runtime-memory based for current beta operation window.

### Team owner mapping (implemented)

- `T03_DATABASE`
  - `GET /api/campaigns`
  - `GET /api/analytics`
  - `GET /api/campaigns/:id`
  - `GET /api/campaigns/:id/related`
- `T04_WORKER`
  - `GET /api/cron`
  - `POST /api/admin/ingest`
  - `POST /api/jobs` (internal)
- `T10_OBSERVABILITY`
  - `GET /api/health`
  - `GET /api/admin/creators`
  - `POST /api/admin/creators`
  - `PATCH /api/admin/creators/:id`
  - `DELETE /api/admin/creators/:id`
  - `GET /api/admin/creators/autologin`
  - `GET /api/admin/analytics/stats`
  - `GET /api/admin/platforms`
  - `POST /api/admin/platforms`
  - `PATCH /api/admin/platforms/:id`
  - `DELETE /api/admin/platforms/:id`
  - `GET /api/admin/runs`
  - `GET /api/admin/quality`
  - `GET /api/admin/alerts`
  - `POST /api/admin/alerts/actions`
- `T06_ANALYTICS`
  - `POST /api/analytics/log`
  - `GET /api/public/stats`
  - `GET /api/search/suggest`
- `T08_MANAGER`
  - `GET /api/me/revenue`
  - `GET /api/me/board`
  - `GET /api/me/pro`
  - `POST /api/me/pro`
  - `GET /api/me/curation`
  - `GET /api/me/schedules`
  - `POST /api/me/schedules`
  - `PATCH /api/me/schedules/:id`
  - `DELETE /api/me/schedules/:id`
  - `GET /api/me/notifications`
  - `POST /api/me/notifications`
  - `PATCH /api/me/notifications`
  - `DELETE /api/me/notifications/:id`
  - `POST /api/me/notifications/test`
  - `GET /api/me/notification-channels`
  - `GET /api/me/notification-preferences`
  - `PUT /api/me/notification-preferences`

## Planned / 미구현 API (roadmap)

### Team owner mapping (planned)

- `T05_NOTIFIER`
  - 알림 발송/재시도 트리거 및 상태 노출
 



