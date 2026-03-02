# 문서-코드 정합성 체크리스트 (스크린 단위)

생성시각: 2026-03-02T12:05:00+09:00

## Home/Search
- [x] `GET /api/campaigns`
- [x] `GET /api/analytics`

## Campaign Detail
- [x] `GET /api/campaigns/:id`
- [x] `GET /api/campaigns/:id/related`

## Manager/Me
- [x] `GET /api/me/board`
- [x] `GET /api/me/revenue`
- [x] `GET /api/me/pro`
- [x] `POST /api/me/pro`
- [x] `GET /api/me/curation`
- [x] `GET /api/me/schedules`
- [x] `POST /api/me/schedules`
- [x] `PATCH /api/me/schedules/:id`
- [x] `DELETE /api/me/schedules/:id`
- [x] `GET /api/me/notifications`
- [x] `POST /api/me/notifications`
- [x] `PATCH /api/me/notifications`
- [x] `DELETE /api/me/notifications/:id`
- [x] `POST /api/me/notifications/test`
- [x] `GET /api/me/notification-channels`
- [x] `GET /api/me/notification-preferences`
- [x] `PUT /api/me/notification-preferences`

## Admin/Operations
- [x] `POST /api/admin/ingest`
- [x] `GET /api/admin/runs`
- [x] `GET /api/admin/quality`
- [x] `GET /api/admin/alerts`
- [x] `POST /api/admin/alerts/actions`
- [x] `GET /api/cron`
- [x] `GET /api/health`
- [x] `POST /api/jobs` (internal, `CRON_SECRET`)

### Notes
- 알림 채널은 `kakao`, `telegram`, `push`가 `lib/notificationSender.ts`에서 지원되며, 루트 `.env.example`에 연동 키가 모두 명시되어 있습니다.
- `DELETE /api/me/notifications/:id`는 실제 코드상 동작 라우트(RESTful id route)로 구현되어 있습니다.

