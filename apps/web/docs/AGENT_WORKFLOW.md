# AGENT_WORKFLOW ? Advanced Orchestrator & Project Automation

> **ORCHESTRATOR**: 요청 단위로 팀을 분해하고, 실행 순서/품질 게이트/회귀 조건을 자동 동기화한다.

---

## 1. Dynamic Request Routing

요청 타입별 권장 경로:

| 요청/이벤트 | 처리 경로 |
|---|---|
| 수집 이슈 / 스크래핑 실패 | T01_SCRAPER -> T02_NORMALIZER -> T09_VALIDATION |
| 알림/운영 이상 감지 | T10_OBSERVABILITY -> T01_SCRAPER |
| UI/UX 개선 요청 | T07_FRONTEND -> T08_MANAGER -> T09_VALIDATION |
| 장애 지표 / 모니터링 개선 | T10_OBSERVABILITY -> T03_DATABASE -> T06_ANALYTICS |
| 스케줄/알림 워커 개선 | T04_WORKER -> T05_NOTIFIER -> T10_OBSERVABILITY |

---

## 2. Advanced Collaboration Hooks

- **[HOOK: DATA_READY]**
  - 발행: T01 완료 직후
  - 동작: T02 정규화 검사, T03 인덱스/쿼리 점검, T10 운영 알림 반영
- **[HOOK: SCHEMA_CHANGED]**
  - 발행: 스키마 또는 엔티티 변경
  - 동작: T07/T08/T09는 화면·타입 영향도 점검과 Typecheck 전파
- **[HOOK: QUALITY_WARN]**
  - 발행: 정합성/품질 경보 트리거
  - 동작: T10 경보 라벨 갱신, T01/02 임시 정지 가이드 제안
- **[HOOK: DEPLOY_GREEN]**
  - 발행: 배포 허가 조건 충족
  - 동작: T10 상태 라벨 + 운영 공지 텍스트 갱신, 운영 티켓 자동 링크 생성

---

## 3. Team-Tool Calling Hierarchy

1. **Core Agent 규칙**: `TEAM_CONTEXT.md`, `AGENT_WORKFLOW.md`를 우선 로드.
2. **전문 Team Skills**: 각 팀의 `docs/teams/T*.md` 실행 규약 우선 적용.
3. **MCP / 외부 도구**: 필요한 경우 Postgres/보안/리스크 점검 MCP를 보조 도구로 사용.
4. **자동 집행**: `scripts/` 기반 정합성 검사 도구 우선.

---

## 4. Standard Execution Order (Fallback)

4-Tier 실행 우선순위 (병렬/의존성 보장):

1. **Tier 4 (Ops Plane)**: T09, T10
2. **Tier 1 (Data Plane)**: T01, T02, T03
3. **Tier 2 (Logic Plane)**: T04, T06, T05
4. **Tier 3 (Product Plane)**: T07, T08
5. **최종 검증**: T09에서 lint/typecheck/smoke 또는 `agent:qa`를 통해 병합 가능 여부 판단

---

## 5. API Drift Guard (구현/문서 정합성)

### 현재 구현 기준
- 구현 API(라우트 존재):
  - `GET /api/campaigns`, `GET /api/analytics`, `GET /api/cron`, `POST /api/admin/ingest`, `GET /api/admin/runs`, `GET /api/health`
  - `GET /api/campaigns/:id`, `GET /api/campaigns/:id/related`
  - `GET /api/admin/creators`, `POST /api/admin/creators`, `PATCH /api/admin/creators/:id`, `DELETE /api/admin/creators/:id`, `GET /api/admin/creators/autologin`
  - `GET /api/admin/quality`, `GET /api/admin/alerts`, `POST /api/admin/alerts/actions`, `POST /api/jobs` (`CRON_SECRET`)
  - `GET /api/me/revenue`, `GET /api/me/board`, `GET /api/me/pro`, `POST /api/me/pro`, `GET /api/me/curation`, `GET /api/me/schedules`, `POST /api/me/schedules`, `PATCH /api/me/schedules/:id`, `DELETE /api/me/schedules/:id`, `GET /api/me/notifications`, `POST /api/me/notifications`, `PATCH /api/me/notifications`, `DELETE /api/me/notifications/:id`, `POST /api/me/notifications/test`, `GET /api/me/notification-channels`, `GET /api/me/notification-preferences`, `PUT /api/me/notification-preferences`
- 계획/API 미구현:

### 정합성 규칙
- 문서 라벨은 `implemented` 또는 `planned` 1개 값만 사용.
- 구현 상태는 실제 라우트 존재성으로 판단하고, API 계약은 구현이 확인된 팀 문서만 배포 게이트로 포함.
- 문서 갱신 순서는 `API.md` -> `ARCHITECTURE.md` -> `TEAM_CONTEXT.md` -> `AGENT_WORKFLOW.md` -> `PROJECT_STATUS.md`.
- `/api/admin/quality`, `/api/admin/alerts`, `POST /api/admin/alerts/actions`는 **계획이 아닌 구현 상태**로 취급.
- 문서 미동기 상태가 24시간 이상 유지되면 T09에서 조치 태스크 자동 생성.

### 즉시 점검 루틴 (오프라인/배포 전 고정)
- `scope=docs` 변경 후 배포 전에는 `PROJECT_STATUS_NEXT_ACTIONS.md`의 `12.9 API 정합성 즉시 점검`이 최신인지 반드시 확인.
- 동기화 근거는 핵심 3문서 병행 비교(`AGENT_WORKFLOW`/`TEAM_CONTEXT`/`PROJECT_STATUS_NEXT_ACTIONS`)로 잠금 후 PR 승인.
- `implemented`와 `planned` 충돌이 동일 항목에서 발생하면 해당 항목은 즉시 BLOCK 상태로 두고 담당 팀이 재정의까지 머지 금지.

### 드리프트 Hook
- API Drift 탐지 시: `api:contract-audit` 실패로 인한 게이트 실패 + `HOOK: QUALITY_WARN` 발행.
- 문서 업데이트 완료 시: `DEPLOY_GREEN` 직전 2중 검증(구현 라우트 + 화면 노출 AC).

---

## 6. Escalation & Self-Healing Protocol

1. 모니터링 이상 징후 탐지 (T10)
2. 원인 범위 제한(T04/T03/T01)
3. 일시 우회 또는 잠금/재시도 적용(T04)
4. 실패 케이스와 복구 절차 기록(T09)
5. 반복 실패 시 배포 보호([BLOCKED]) 및 주간 보고

### 통합 가드
- 핵심 문서: `API.md`, `ARCHITECTURE.md`, `TEAM_CONTEXT.md`, `PROJECT_STATUS.md`, `PROJECT_STATUS_NEXT_ACTIONS.md`, `docs/teams/*.md`
- API 검증: `npm run api:contract-audit` + `npm run api:contract-sync-audit` + `ci` 요약 리포트

---

## 7. API Contract Audit Automation

- `npm run api:contract-audit`은 `app/api` 실제 경로와 문서의 `implemented/planned` 매칭 검증.
- `npm run api:contract-sync-audit`은 `API.md` + 핵심 문서 집합(`ARCHITECTURE`, `TEAM_CONTEXT`, `PROJECT_STATUS`, `PROJECT_STATUS_NEXT_ACTIONS`, `SCRAPERS`, `docs/teams`)의 implemented/planned 교차 정합성까지 함께 검증해 12.9 리포트를 갱신.
- 실패 사유는 `reports/api-contract-audit.md` 및 `reports/api-contract-sync-audit.md`로 남기고 CI/Pipeline을 실패 처리.
- `agent:qa`는 `api:contract-audit`를 핵심 체크포인트로 유지.

---

## 8. Premium UI/UX Production Rules

- 화면 도메인 단위로 관리
  - T07: 핵심 화면 구조·컴포넌트
  - T08: 사용자 여정/매니저 동선
  - T06: 분석 라벨·인사이트 텍스트 가독성
  - T10: 운영 상태 문구 톤(정상/주의/위험/중단)
  - T09: 접근성·성능·회귀 패스 기준 강제
- 실행 규칙
  - 화면 PR은 AC와 `ui-qa-summary.md`를 반드시 첨부.
  - 계획 화면은 CTA 비활성 + `계획(미구현)` 배너 필수.
  - 회귀 지표는 전환율, 체류시간, 재진입율, 오류 복구 완료율을 필수 집계.
- 배포 연동
  - `agent:qa` 통과 전 화면 텍스트 변경은 금지.
  - 스모크 실패는 UI/네비게이션 재검증까지 블록.

---

## 9. UI/UX Delivery Grid (BETA 2.0)

### 9.1 화면별 담당
- `/`: T07, T06, T10
- `/campaigns/[id]`: T07, T06, T09
- `/map`: T07, T10
- `/me` / `/me/calendar` / `/me/stats`: T08, T07, T09
- `/admin` / `/system`: T08, T10, T09

### 9.2 검증 4단계
1. 화면 AC 충족
2. 에러/빈 상태 UX 검증
3. 접근성(aria, 키보드 포커스, 토스트 닫힘 순서)
4. `ui-qa-summary`, smoke, CI PASS

### 9.3 KPI
- T07: 핵심 화면 전환 가시성 100%
- T08: 매니저 입장-행동 완료율 100%
- T06: 인사이트 문구 정합성 100%
- T10: 운영 라벨 정확도 100%
- T09: 4경로 회귀 PASS 100%

---

## 10. 배포/게이트 속도 최적화 운영 원칙

- 문서/마크다운 변경은 `scope=docs`로 분류해 문서만 정합성 확인.
- 앱/컴포넌트/라이브러리 변경은 `scope=fast`로 분류해 `lint + typecheck + smoke` 우선 실행.
- 그 외 변경은 `scope=full`으로 `lint + typecheck + test + api:contract-audit + smoke` 실행.
- [필수 규칙] 사용자 수정 요청이 발생하면 배포/릴리즈 전에 로컬 검증(`npm run verify:local`)을 항상 먼저 실행한다.
  `--skip-verify`는 운영 자동화 명령에서만 허용되며, 사용 사유는 배포 티켓에 남겨야 한다.
- 단, 운영 자동화에서 `npm run release -- --skip-verify` 사용 시 예외 허용(사유/근거를 배포 티켓에 기록).
- Vercel 배포는 `scope=docs`에서 빌드/배포를 스킵.
- 동일 브랜치 병렬 실행은 이전 실행을 즉시 취소.
- 체험단/외부 채널 인증 자동화 작업은 `기획-데이터-운영` 3개 분기 병렬로 진행한다.
  - 분기 A (기획): 계정 스키마/보안 토큰 정책 합의, 자동로그인 실패 정책 정의.
  - 분기 B (데이터): `/api/admin/creators*` API 및 운영 증빙 데이터 구조 정합성.
  - 분기 C (운영): 관리자 화면/배치 라우트가 체험단 변경을 즉시 반영하도록 UX 테스트 추가.
- 운영 감사 로그 룰: `POST/PATCH/DELETE /api/admin/creators`는 `admin_audit` 로그 emit이 선결으로 동작해야 하며, 실패 코드(`REAUTH_REQUIRED`, `NOT_CONNECTED`, `LOGIN_ERROR`, `CONNECTED`)는 토스트/운영 메시지 규격과 일치해야 한다.
- `GET /api/admin/creators/autologin`은 `failure_code`와 `failure_label`을 함께 제공해 UI 라벨과 모니터링 규격이 동기화되어야 한다.

---

## 11. Post-Task Closing Protocol (Closing Routine)

하나의 큰 기능 구현이나 오류 수정을 마친 후에는 반드시 다음 **'마무리 루틴'**을 수행하여 프로젝트의 정합성과 품질을 유지한다.

### 11.1 문서 동기화 (Doc Sync)
작업 내용이 반영되도록 다음 문서들을 최신 상태로 갱신한다.
- `API.md`: 엔드포인트 구현 상태 (`implemented`/`planned`) 업데이트.
- `TEAM_CONTEXT.md`: `#api_contract_audit`, `#metadata` 및 진행 중인 스트림 상태 업데이트.
- `PROJECT_STATUS.md`: 완료된 마일스톤 체크 및 실제 구현된 기능 목록 업데이트.
- `PROJECT_STATUS_NEXT_ACTIONS.md`: 백로그 항목 체크오프 및 다음 우선순위 액션 정의.
- `SCRAPERS.md`/`CRAWLER_TOP20_RESEARCH_SPECS.md`: 수집 플랜(우선순위/병렬도/실패 라벨) 변경 시 즉시 동기화.
- 운영 감사 항목: `CREATOR_CREATE/UPDATE/DELETE` 로그, 실패 코드북(`REAUTH_REQUIRED` 등) 동작 여부를 다음 문서에 함께 정리해 동기화한다.

### 11.2 고도화 (Premium Sophistication)
결과물이 '단순 동작'을 넘어 '프리미엄' 수준이 되도록 고도화 작업을 병행한다.
- **안정성 고도화**: 핵심 로직에 대한 단위 테스트(Vitest) 및 엣지 케이스 처리 추가.
- **UI/UX 고도화**: 데이터 로딩 스켈레톤, 마이크로 애니메이션(Framer Motion), 빈 상태(Empty State) 디자인 강화.
- **성능 고도화**: 과도한 DB 요청 최적화(Batching), 프론트엔드 메모이제이션(`useMemo`, `useCallback`) 적용.
- **타입 고도화**: `any` 타입을 구체적인 인터페이스로 교체하여 빌드 안정성 확보.

### 11.3 최종 검증 (Final QA)
- `npm run verify:local`을 수정 직후 가장 먼저 실행해 로컬 빌드/타깃 정합성을 확인.
- `npm run deploy:env-check` → `npm run agent:review` 또는 `npm run agent:qa` 순으로 실행해 린트, 타입, 테스트 통과를 확인.
- apps/web/reports 산출물은 배포 전/후 동일 키로 덮어쓰기 하여 스모크/스캔 혼합을 방지.
- 반복 경고 정리 작업은 최우선 파일 2~3개 원칙으로 분할해 병렬 병행 큐로 처리.
- `reports/` 내의 정합성 리포트가 모두 녹색 상태인지 확인.




## 12.10 5시간 무인 고도화 오퍼레이터 (Autonomous Ops 5h+)

목적: 사용자 개입 없이 5시간(300분) 동안 수집 병렬 루프 + 문서/품질 셀프 체크를 반복하고 증거 로그를 남긴다.

실행 규칙
- 기본 실행: `npm run ops:autonomous` (`durationMinutes=300`, `cycleMinutes=20`, `phases=A,B,C`, `ingest/refactor/apiAudits` 동작)
- 5시간 정밀 실행: `npm run ops:autonomous:5h`
- 운영/수집 비활성화, 검토 작업리스트 전용: `npm run ops:review-list`, `npm run ops:review-list:5h`
- 권장 시작 전: 운영 중간 작업과 충돌이 없음을 확인하고 배포 동작은 별도 배포명령으로 분리
- 산출물: `apps/web/logs/autonomous/*`, `apps/web/reports/*`
- 제약: 배포/푸시 자동화는 기본 off. 자동 커밋은 `--autoCommit=false` 기본값.
- 강제 종료: `Ctrl+C` 또는 작업 신호 발생 시 현재 사이클 종료 후 정리 종료

로그 규약
- 루프 로그: `apps/web/logs/autonomous/autonomous-ops-<timestamp>.log`
- 사이클별 로그: `apps/web/logs/autonomous/cycle-<N>-refactor.log`, `cycle-<N>-api-audit.log`
- 요약 리포트: `apps/web/logs/autonomous/autonomous-ops-<timestamp>.json`

- [03/04/2026 01:05:47] autonomous loop: ops:autonomous:5h now uses ingest supervisor restart loop (on child exit, auto-restart within remaining window). Added parallel cycle execution for refactor + API audit tasks to keep 5h window throughput high.
