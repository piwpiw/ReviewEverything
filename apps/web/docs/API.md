# API Reference

## Source of Truth
- `apps/web` 코드 기준으로 공개 라우트와 계획 라우트를 분리해 관리
- 공통 응답 스키마: `data`, `meta`, `error`

## Implemented public endpoints

- `GET /api/campaigns`
- `GET /api/analytics`
- `GET /api/cron` (query: `runNow`, `limit`)
- `POST /api/admin/ingest`
- `GET /api/admin/runs`
- `GET /api/health`
- `GET /api/me/revenue`
- `GET /api/me/board` (프리미엄 대시보드 mock)
- `GET /api/me/pro`
- `POST /api/me/pro`

### Team owner mapping (implemented)

- `T03_DATABASE`
  - `GET /api/campaigns`
  - `GET /api/analytics`
- `T04_WORKER`
  - `GET /api/cron`
  - `POST /api/admin/ingest`
- `T10_OBSERVABILITY`
  - `GET /api/health`

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
- `GET /api/admin/quality`
- `GET /api/admin/alerts`

### Team owner mapping (planned)

- `T08_MANAGER`
  - `/api/me/schedules*`
  - `/api/me/notifications*`
- `T05_NOTIFIER`
  - 알림 발송/재시도 트리거 및 상태 노출
- `T04_WORKER`
  - `POST /api/jobs` (내부 실행 포인트)
- `T10_OBSERVABILITY`
  - `GET /api/admin/quality`
  - `GET /api/admin/alerts`
