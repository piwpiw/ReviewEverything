### Worker/Manager/Parsing Fast-Track Progress (2026-02-28)

- Queue/Worker Track:
  - Cron route now supports queue-only mode by default.
  - Add `runNow=true` query when immediate run is required.
  - Job execution path moved to shared worker runner with lock + retry.

- Notification Track:
  - Added `lib/notificationSender.ts` with channel adapters (`push`, `kakao`).
  - Reminder scan now creates `NotificationDelivery` rows and dispatch pass marks SEND/FAILED.

- Parser Track:
  - Added regression tests for `normalizeRewardValue` covering ����/õ��/��/fallback.
  - Next: harden by adding mixed-unit fixtures in a dedicated parser fixture file if needed.

- Execution Efficiency Track:
  - Added claude.md with token policy, MCP search policy, and naming requirements.
  - Added reusable gate automation for PR/build quality checks:
    - 
pm run agent:review => lint + typecheck + test:ci
    - 
pm run agent:qa => lint + typecheck + test:ci + smoke:ci + build
  - Reports are generated at apps/web/reports/agent-<mode>-summary.md


## API 정합성 추적 (추가)

- 공개 라우트 검증 기준 확장
  - `POST /api/jobs`는 현재 공개 라우트 미존재, `GET /api/cron` 기반 큐 실행으로 통일.
  - `GET /api/campaigns/:id` 및 일정/알림 상세 API는 계획 항목으로 분리 관리.
- API 문서 동기화
  - `apps/web/docs/API.md`를 구현 기준/계획 기준으로 재분리 완료.
  - `T04/T10/ARCH/NOTES`에 `/api/jobs` 표기를 런타임 실행 트리거 문구로 교체.
- 배포 전 점검 항목 추가
  - `/api/admin/quality`, `/api/admin/alerts`가 실제 제공되기 전까지 UI/문서에서 "계획(미구현)" 라벨 강제.

## 정합성 감사 체크리스트 (문서-실행 일치)

- [ ] 실제 라우트 존재성 점검: `app/api` 경로와 `API.md`의 구현 항목 일치 확인
- [ ] 계획 항목은 `PROJECT_STATUS.md`와 `TEAM` 문서에서 `미구현(계획)`로 표시
- [ ] `POST /api/jobs` 문구를 공개 API 대신 내부 실행 후보로 통일
- [ ] worker 실행 경로(`GET /api/cron`)와 스케줄러(`limit`, `runNow`) 동작 확인
- [ ] `/api/admin/quality`, `/api/admin/alerts` 노출 시점: 라우트 구현 전까지 기능 비노출 보장
'

## AGENT 정합성 주간 감사 템플릿

- [ ] 라우트 스캔: `app/api` 내 실제 라우트와 `apps/web/docs/API.md`의 구현 항목 일치
- [ ] T08/T04/T10 문서의 상태 플래그가 동일한지 교차 검증
- [ ] `/api/jobs`가 공개 문서에서 독립 엔드포인트로 노출되지 않았는지 확인
- [ ] 계획 항목(`GET /api/campaigns/:id` 등)에 `계획(미구현)` 표기 존재
- [ ] `/api/admin/quality`, `/api/admin/alerts` UI 노출 방지 상태 확인
- [ ] 배포 전 `TEAM_CONTEXT.md` `#api_contract_audit` 기준 점검 완료
'

## 자동 리뷰 체크 항목 (문서 정합성)

- [ ] team 문서 상태 태그: `implemented` 또는 `planned` 표기 준수
- [ ] 팀 문서의 API 책임 범위가 `API.md` 구현 목록과 일치
- [ ] 구현된 엔드포인트만 `Deployment`/`Smoke` 대상에 포함
- [ ] 계획 항목은 `계획(미구현)` 라벨과 출시 조건이 명시
- [ ] `POST /api/jobs` 관련 표기가 공개 API로 오해되지 않음
- [ ] PR 생성 전 TEAM_CONTEXT `#api_contract_audit` 갱신 여부 확인
