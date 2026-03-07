### Core Sync Baseline (2026-03-01)

- Canonical update order: API.md -> ARCHITECTURE.md -> TEAM_CONTEXT.md -> AGENT_WORKFLOW.md -> PROJECT_STATUS.md -> PROJECT_STATUS_NEXT_ACTIONS.md
- Implemented status rule: route exists under apps/web/app/api.
- Current implemented API set: `GET /api/campaigns`, `GET /api/campaigns/:id`, `GET /api/campaigns/:id/related`, `GET /api/analytics`, `POST /api/analytics/log`, `GET /api/cron`, `POST /api/admin/ingest`, `GET /api/admin/analytics/stats`, `GET /api/admin/platforms`, `POST /api/admin/platforms`, `PATCH /api/admin/platforms/:id`, `DELETE /api/admin/platforms/:id`, `GET /api/admin/runs`, `GET /api/admin/quality`, `GET /api/admin/alerts`, `POST /api/admin/alerts/actions`, `POST /api/jobs`, `GET /api/health`, `GET /api/public/stats`, `GET /api/search/suggest`, `GET /api/me/revenue`, `GET /api/me/board`, `GET /api/me/pro`, `POST /api/me/pro`, `GET /api/me/curation`, `GET /api/me/schedules`, `POST /api/me/schedules`, `PATCH /api/me/schedules/:id`, `DELETE /api/me/schedules/:id`, `GET /api/me/notifications`, `POST /api/me/notifications`, `PATCH /api/me/notifications`, `DELETE /api/me/notifications/:id`, `POST /api/me/notifications/test`, `GET /api/me/notification-channels`, `GET /api/me/notification-preferences`, `PUT /api/me/notification-preferences`

# NEXT ACTIONS & SPRINT DIRECTIVES (2026-03-01)
> 핵심 문서 동기화는 `API.md`, `ARCHITECTURE.md`, `TEAM_CONTEXT.md`, `AGENT_WORKFLOW.md`, `PROJECT_STATUS.md`를 기준으로 수행합니다.

### Worker/Manager/Parsing Fast-Track Progress (2026-03-01)

- Queue/Worker Track:
  - Cron route now supports queue-only mode by default.
  - Add `runNow=true` query when immediate run is required.
  - Job execution path moved to shared worker runner with lock + retry.

- Notification Track:
  - Added `lib/notificationSender.ts` with channel adapters (`push`, `kakao`, `telegram`).
  - Reminder scan now creates `NotificationDelivery` rows and dispatch pass marks SEND/FAILED.

- Parser Track:
  - Added regression tests for `normalizeRewardValue` covering KRW unit cases + fallback.
  - Implemented Layered Regex strategy for '억', '만(원)', 'usd' and space-separated units.
  - Next: scale up fixture tests covering 100+ variations for BETA 2.0 stability.

- Execution Efficiency Track:
  - Added claude.md with token policy, MCP search policy, and naming requirements.
  - Added reusable gate automation for PR/build quality checks:
    - `npm run agent:review` => `lint + typecheck + test:ci`
    - `npm run agent:qa` => `lint + typecheck + test:ci + smoke:ci + build`
  - Reports are generated at apps/web/reports/agent-<mode>-summary.md
  - Local execution baseline is now centralized in `docs/LOCAL_TEST_STRATEGY.md`


## API 정합성 추적 (추가)

- 공개 라우트 검증 기준 확장
- `POST /api/jobs`는 현재 `CRON_SECRET`가 필요한 내부 실행 엔드포인트이며, `GET /api/cron`은 큐 실행 트리거입니다.
- 구현 항목은 `API.md` 기준으로 분류하고, 계획 항목은 별도 섹션에서 관리.
- API 문서 동기화
  - `apps/web/docs/API.md`를 구현 기준/계획 기준으로 재분리 완료.
  - `T04/T10/ARCH/NOTES`에 `/api/jobs` 표기를 런타임 실행 트리거 문구로 교체.
- 배포 전 점검 항목 추가
  - `/api/admin/quality`, `/api/admin/alerts`, `/api/admin/alerts/actions`는 라우트 구현 후 `implemented` 반영.

## 정합성 감사 체크리스트 (문서-실행 일치)

- [x] 실제 라우트 존재성 점검: `app/api` 경로와 `API.md`의 구현 항목 일치 확인
- [x] 계획 항목은 `PROJECT_STATUS.md`와 `TEAM` 문서에서 `미구현(계획)`로 표시
- [x] `POST /api/jobs` 문구를 공개 API 대신 내부 실행 엔드포인트로 통일
- [ ] worker 실행 경로(`GET /api/cron`)와 스케줄러(`limit`, `runNow`) 동작 확인
- [ ] `/api/admin/quality`, `/api/admin/alerts`, `/api/admin/alerts/actions` 노출 상태는 라우트 존재성과 문서 상태를 일치해야 함

## AGENT 정합성 주간 감사 템플릿

- [ ] 라우트 스캔: `app/api` 내 실제 라우트와 `apps/web/docs/API.md`의 구현 항목 일치
- [ ] T08/T04/T10 문서의 상태 플래그가 동일한지 교차 검증
- [x] `/api/jobs`가 공개 문서에서 독립 엔드포인트로 오해되지 않도록 내부 실행 표기만 유지
- [ ] 계획 항목이 존재할 경우 `계획(미구현)` 표기 유지
- [ ] `/api/admin/quality`, `/api/admin/alerts`, `/api/admin/alerts/actions`의 노출/차단 상태를 라우트 상태와 동기화
- [ ] 배포 전 `TEAM_CONTEXT.md` `#api_contract_audit` 기준 점검 완료

## 자동 리뷰 체크 항목 (문서 정합성)

- [ ] team 문서 상태 태그: `implemented` 또는 `planned` 표기 준수
- [ ] 팀 문서의 API 책임 범위가 `API.md` 구현 목록과 일치
- [ ] 구현된 엔드포인트만 `Deployment`/`Smoke` 대상에 포함
- [ ] 계획 항목은 `계획(미구현)` 라벨과 출시 조건이 명시
- [x] `POST /api/jobs` 관련 표기가 공개 API로 오해되지 않음
- [ ] PR 생성 전 TEAM_CONTEXT `#api_contract_audit` 갱신 여부 확인

## 문서 운영 원칙(기존 문서 우선)

- 신규 문서 생성 대신 기존 문서를 기준선으로 갱신한다.
- 정합성 수정은 다음 문서를 우선 갱신: `API.md`, `ARCHITECTURE.md`, `AGENT_WORKFLOW.md`, `TEAM_CONTEXT.md`, `PROJECT_STATUS.md`, `PROJECT_STATUS_NEXT_ACTIONS.md`, `docs/teams/*.md`.
- 상태 변경 시 새 기능/항목은 "구현(implementation) / 계획(planned)" 라벨을 기존 문서에 즉시 반영한다.

## UI/UX 집중 고도화 액션(병렬)

### 0. 실행 프레임
- 동시 투입: `T07_FRONTEND`가 스크린 인력 배치 지도, `T08_MANAGER`가 사용자 플로우, `T06_ANALYTICS`가 인사이트 가시성, `T10_OBSERVABILITY`가 운영 신뢰 라벨, `T09_VALIDATION`이 회귀 게이트 담당.
- 단일 소스: `PROJECT_STATUS.md`의 화면/기능/필수요소, AC, 에러, API를 기준으로 UI 문구를 일관화.

### 1) 즉시 실행(이번 주, 스프린트 1)
- [x] 홈페이지 상단 피드백 루프 (`빈 상태 CTA`, `필터 요약`, `에러 복구 배너`).
- [x] 상세페이지 신뢰 배지(마감일/마지막 수집/링크 상태) 고정 라벨화.
- [x] 지도 모드 권한 가이드 + 뷰포트 재검색 CTA 통일.
- [x] **[P0] 지도 모드 아이콘 차별화 및 정보 팝업(이미지+문구) 고도화.**
- [x] **[P0] 광고주(사장님) 전용 비즈니스 페이지(`/business`) UI/UX 수립 및 구현.**
- [x] **[P0] 플랫폼별 메인 이미지 및 홍보 문구(Rich Data) 수집 어댑터 강화.**
- [ ] `/me` 대시보드에서 일정/매출 전환 동선 1클릭 정합성 점검.
- [ ] 관리자/시스템 화면의 운영 메시지 언어 규격 통일(`정상`/`경고`/`중단`).
- [ ] 새 UI 항목은 `reports/ui-qa-summary.md` 체크 항목에 연결: Lighthouse, 접근성, 상호작용 시나리오, 복구 메시지.

### 2) 병렬 테스트 전략 (주 단위)
- UX 회귀: `홈 > 상세 > 지도 > 관리자` 4경로 E2E 스냅샷.
- 접근성: 키보드 포커스, `aria-label`, 토스트/모달 닫기 순차 동작 검증.
- 성능: `초기 렌더`, `지도 리그리드`, `필터 조합` 경로에서 체감 응답성 측정.
- 비즈니스: 탐색 전환율, 상세 이동율, 일정 등록 완료율, 알림 설정 완료율 대시보드로 주간 추적.

### 3) 고도화 기준(목표치)
- 탐색 화면 전환율 +30% / 6주
- 지도 사용 지속시간 +25% / 6주
- 상세 페이지 이탈률 -20% / 6주
- 관리자 알림 액션 성공률 +40% / 8주

## 8) UI/UX 병렬 실행 큐(다음 배포 단위)

### 8.1 팀별 주차 계획(금주~)
- T07: 화면 구조 안정성(필터/카드/지도) + 공통 컴포넌트 토큰 정합성 우선 처리.
- T08: `/me*` 동선, 일정 등록 완료율, 알림 경로(임계/채널) 문구 표준화.
- T06: 목록 랭킹 설명, 트렌드/혜택 인사이트 문장 재설계.
- T10: 운영 메시지 톤셋 고정(정상/주의/위험/중단) + 경보 링크 규칙 고정.
- T09: 홈→상세→지도→관리자 4경로 회귀 스냅샷을 PR당 1회 이상.

### 8.2 화면별 승인 템플릿(필수)
- 화면 PR은 다음 4개 항목의 스냅샷을 첨부해야 한다.
  1. Before/After 화면 캡처 또는 핵심 상태(에러/빈 상태) 캡처
  2. AC 항목 체크(해당 화면에 매핑된 2개 이상)
  3. `ui-qa-summary.md` 링크
  4. 실패/롤백 시나리오 1개
- 화면 텍스트 변경은 `TEAM_CONTEXT.md #screen_delivery`와 동기화.
- 계획 화면(미구현 API 기반)은 CTA 비활성 + 경고 라벨 필수.

### 8.3 2주 스프린트 목표
- 1~2주: 홈/상세/지도 화면 AC 100% 정리 + 회귀 테스트 초안 통합.
- 3~4주: 매니저/일정/알림 화면 병행 개발 가이드 정착.
- 5~6주: 관리자/운영 화면 안정화 + 공통 메시지 패턴 고정.

## 11) BETA 2.0 출시 직전 팀별 실행 체크리스트 (실동작/사용자 확인 기준)

### 공통 게이트 (모든 팀 공통)
- [ ] 구현 항목은 실제 라우트/화면에서 클릭-응답-결과 확인이 가능해야 한다.
- [ ] 각 항목은 `증거 3종`을 남긴다: 화면 캡처, 호출 API 응답, 실패 시 복구 동작.
- [ ] `planned` 항목은 노출 금지 또는 비활성 + `계획(미구현)` 라벨 유지.
- [ ] 회귀 기준: `home -> detail -> map -> me -> admin` 핵심 흐름에서 중단 없이 완료.

### T01_SCRAPER
- [ ] 7개 플랫폼 수집이 실제 실행되고 결과가 `campaign_snapshots`에 적재된다.
- [ ] 실패 플랫폼 1개가 있어도 나머지 플랫폼 수집이 계속된다.
- [ ] 사용자 확인 포인트: 관리자 화면에서 최근 실행 결과/실패 사유 확인 가능.

### T02_NORMALIZER
- [ ] `reward_value`, `competition_rate`, 지역/카테고리 정규화가 UI 필터와 일치한다.
- [ ] 비정형 금액 문자열 fallback이 빈값 대신 안전한 값/문구로 노출된다.
- [ ] 사용자 확인 포인트: 홈 카드/상세에서 핵심 지표(보상/경쟁률/마감일) 누락 없음.

### T03_DATABASE
- [ ] 캠페인 조회 쿼리(`/api/campaigns`)가 필터/정렬/페이지네이션과 일치 동작.
- [ ] 스냅샷 append 정책 유지(삭제/덮어쓰기 금지).
- [ ] 사용자 확인 포인트: 필터 적용 후 결과 수치와 카드 목록이 일치.

### T04_WORKER
- [x] `/api/cron` 큐 적재, `runNow`, `limit` 동작이 실제 배치 처리와 일치.
- [x] 락/재시도 정책으로 중복 실행이 방지된다.
- [x] `cleanupStaleRuns` 도입으로 멈춤 현상(stale run) 자동 복구.
- [ ] 사용자 확인 포인트: 관리자에서 실행 이력 상태 변화(RUNNING -> SUCCESS/FAILED) 확인.

### T05_NOTIFIER
- [ ] D-3/D-1 스캔이 `NotificationDelivery`를 생성하고 상태(SEND/FAILED)를 기록.
- [ ] 채널 장애 시 fallback 정책(push/kakao/telegram)이 동작한다.
- [ ] 사용자 확인 포인트: 알림 설정/테스트 후 최근 발송 로그 확인 가능.

### T06_ANALYTICS
- [ ] `/api/analytics` 응답이 홈 랭킹/트렌드 영역과 동일하게 반영된다.
- [ ] 캐시 정책 적용 시 stale 데이터가 과도하게 노출되지 않는다.
- [ ] 사용자 확인 포인트: 홈 정렬/인사이트 문구가 실제 수치와 모순되지 않음.

### T07_FRONTEND
- [ ] 홈/상세/지도/매니저 핵심 화면의 CTA, 빈 상태, 에러 복구가 동작한다.
- [ ] 접근성(키보드 포커스, aria-label) 기본 기준 충족.
- [ ] 사용자 확인 포인트: 주요 흐름에서 클릭 후 다음 행동으로 자연스럽게 이동.

### T08_MANAGER
- [x] 구현 API(`GET /api/me/revenue`, `GET /api/me/board`, `GET /api/me/pro`, `POST /api/me/pro`, `GET /api/me/curation`, `GET /api/me/schedules`, `POST /api/me/schedules`, `PATCH /api/me/schedules/:id`, `DELETE /api/me/schedules/:id`, `GET /api/me/notifications`, `POST /api/me/notifications`, `PATCH /api/me/notifications`, `DELETE /api/me/notifications/:id`, `POST /api/me/notifications/test`, `GET /api/me/notification-channels`, `GET /api/me/notification-preferences`)가 화면과 1:1 연결.
- [ ] 사용자 확인 포인트: `/me` 대시보드 진입-조회-액션이 오류 없이 완료.

### T09_VALIDATION
- [ ] `agent:qa`(lint/typecheck/test/smoke/build + contract-audit) 통과.
- [ ] 핵심 4경로(홈/상세/지도/관리자) 회귀 시나리오 PASS.
- [ ] 사용자 확인 포인트: 배포 게이트 리포트(`reports/*summary*`)가 녹색 상태.

### T10_OBSERVABILITY
- [ ] `/api/health`와 운영 화면 상태 라벨이 실시간으로 일치.
- [ ] 경보/이슈 발생 시 TEAM_CONTEXT 우선순위와 메시지 톤이 자동 동기화.
- [ ] 사용자 확인 포인트: 관리자/시스템에서 상태(정상/주의/위험)와 조치 링크 확인.

### 출시 승인 조건 (BETA 2.0)
- [ ] 사용자 관점 필수 기능: 탐색, 상세 확인, 지도 탐색, 매니저 진입, 관리자 상태 조회 모두 동작.
- [ ] 문서 관점 정합성: `API.md`, `PROJECT_STATUS.md`, `PROJECT_STATUS_NEXT_ACTIONS.md`, `TEAM_CONTEXT.md` 동일 상태.
- [ ] 운영 관점 안전성: 실패 복구 경로(재시도/fallback/안내 문구) 각 도메인 최소 1개 이상 확인.

## 12) BETA 2.0 하이퍼 실행 매트릭스 (출시 직전 운영)

### 12.1 P0 임계 경로 (이 항목 미완료 시 출시 불가)
- [ ] `T01+T02+T03`: 수집 -> 정규화 -> 조회(`/api/campaigns`)가 홈 화면에서 실제 카드로 확인.
- [ ] `T04+T10`: 배치 실행(`/api/cron`) -> 상태 반영(`/api/admin/runs`, `/api/health`)이 관리자 화면에서 일치.
- [ ] `T07+T08`: 사용자 핵심 흐름(홈 -> 상세 -> 지도 -> 매니저) 중단 없이 완료.
- [ ] `T09`: `agent:qa` 전부 통과 + 회귀 경로 4개 PASS.

### 12.2 팀별 의존성 체인 (병렬 충돌 방지)
- `T01` 선행 완료 후 `T02` 파싱 검증, `T03` 조회 쿼리 검증 수행.
- `T04` 실행 상태 모델이 안정화되기 전 `T10` 운영 라벨 확정 금지.
- `T08` 매니저 화면 카피/동선 확정 전 `T07` 최종 UI 동결 금지.
- `T05` 알림 로그 스키마 확정 전 `T09` 알림 E2E 승인 금지.

### 12.3 완료 증거 규격 (배포 승인용)
- [ ] `E1 화면 증거`: 사용자 클릭 흐름 캡처 1세트(정상/오류/복구 포함).
- [ ] `E2 API 증거`: 해당 흐름 API 응답 샘플(성공/실패 각 1건).
- [ ] `E3 데이터 증거`: DB 또는 리포트에서 상태 반영 결과 1건.
- [ ] `E4 회귀 증거`: 변경 전/후 실패율 비교 또는 스냅샷 PASS.

### 12.4 Go/No-Go 판단 규칙
- `Go` 조건: P0 임계 경로 4개 모두 완료.
- `Go` 조건: `T09` 회귀 4경로 PASS, `T10` 헬스/운영 라벨 일치.
- `No-Go` 조건: 사용자 핵심 흐름 중 1개라도 막힘.
- `No-Go` 조건: `planned` 기능이 실화면에서 오작동 호출로 노출.
- `No-Go` 조건: 장애 복구 CTA가 동작하지 않음.

### 12.5 출시 당일 운영 런북 (BETA 2.0)
- `T10`가 30분 간격으로 `/api/health`, 잡 큐, 오류율 대시보드 보고.
- `T09`가 2시간 간격으로 핵심 4경로 스모크 재실행.
- `T07/T08`는 사용자 피드백 접점(빈 상태/오류 배너) 문구를 핫픽스 우선순위 1순위로 처리.
- `T04/T05`는 실패 재시도와 알림 발송 오류를 동일 채널에서 추적.

### 12.6 사용자 확인 시나리오 (실제 검증 템플릿)
- [ ] 시나리오 A: 홈 필터 변경 -> 결과 요약/카드 반영 -> 상세 진입 성공.
- [ ] 시나리오 B: 지도 권한 거부 -> 대체 경로 안내 -> 텍스트 모드 탐색 가능.
- [ ] 시나리오 C: 매니저 진입 -> 수익/보드 데이터 로드 -> 액션 버튼 반응.
- [ ] 시나리오 D: 관리자 진입 -> 최근 실행 로그 확인 -> 헬스 상태 일치.

## 12.7 빠진 항목 보완(즉시)

- 라우트-문서 정합성 누락 제거
  - `apps/web/docs/API.md` 구현 목록에 `/system` 화면 API 연동(quality/alerts/actions)을 유지.
  - `apps/web/docs/TEAM_CONTEXT.md`의 `#api_contract_audit`는 48시간 내 1회 실측 라우트 동기화.
  - 작업 풀 운영: `AUTONOMOUS_REVIEW_WORKLIST` 생성량을 `docs/AUTONOMOUS_WORK_POOL.md`로 이관해 누적 항목을 유지하고, 운영 시작 전 마지막 작업번호 기준으로 이어서 배치.

- 수집 운영 품질 보강
  - 플랜트 추가 시 `/api/cron` `runNow` smoke-run 결과를 로그로 남겨 24시간 재수집 조건 충족 여부 확인.
  - 실패 사유(403/429/DOM 변경)를 reason code로 구조화해 `admin` 추적이 가능해야 함.
  - 플랫폼별 연속 실패 3회 시 수동 중단 가이드 자동 노출.

- UI/UX 실동작 보강
  - `/system` 경보 화면은 `GET /api/admin/quality` timeout/오류 시에도 핵심 카드 1개 이상 표시(폴백 라벨 필수).
  - `/admin`은 수집 실행/재실행 버튼 클릭 후 상태 라벨이 `요청 전송 -> 큐 적재 -> 실행 완료` 단계로 업데이트되는지 확인.
  - 공통 오류 토스트는 `재시도`, `닫기`, `도움말` 액션을 최소 1개 이상 포함.

- 검증 게이트/리포트 보강
  - `agent:qa`에 `POST /api/admin/alerts/actions` ACK/SNOOZE 흐름을 통합.
  - `ui-qa-summary.md`는 홈/상세/지도/관리자 4경로에서 성공률 + 실패 재현성(재시도 1회) 항목을 1줄 이상 기록.
  - `Critical` 경보 발생 후 10분 내 조치 상태 로그 1건은 필수.

- 거버넌스/데이터 보강
  - `campaign_snapshots` append-only 준수 점검을 배포 전 검사 항목에 고정.
  - `NotificationDelivery` 보존 정책(예: 90일)과 실패 코드북 정합성 점검 추가.

### 12.8 배포 속도 최적화 반영 (CI/배포)

- 변경 분류 운영 반영
  - `scope=docs`: `apps/web/docs/**`, `*.md`만 변경 시 문서 경량 경로.
  - `scope=fast`: `apps/web/app/**`, `apps/web/components/**`, `apps/web/lib/**`, `apps/web/public/**`, `apps/web/styles/**` 변경 시 `lint + typecheck + smoke`.
  - `scope=full`: 인프라/스크립트/워크플로우/서비스 API 변경은 기존 전체 게이트.

- 즉시 확인 AC
  - [ ] `docs-only` PR은 full 게이트가 건너뛰고 CI 대기시간이 크게 단축.
  - [ ] `scope=fast` PR은 `lint`, `typecheck`, `smoke` 3개 실패 시 즉시 block.
  - [ ] `scope=full` PR은 `lint`, `typecheck`, `test`, `api:contract-audit`, `smoke` 모두 통과.
  - [ ] 문서-only 변경은 Vercel 빌드/배포가 무시되어 운영 배포 대기열에서 제외.
  - [ ] 동일 브랜치 중복 실행은 이전 실행 자동 취소.

- 운영 규정
  - CI에서 docs-only/fast/full 분류 로그를 `scope` 기준으로 출력해 PR 확인성이 보장되어야 함.
  - 배포 전 문서 동기화는 `docs-only`이더라도 화면/라우트 정합성 라벨은 수동 체크가 남아야 함.

## 12.9 API 정합성 즉시 점검 리포트 (2026-03-01)

- 점검 범위: `app/api` + 핵심 문서(`API.md`, `ARCHITECTURE.md`, `TEAM_CONTEXT.md`, `AGENT_WORKFLOW.md`, `PROJECT_STATUS.md`, `PROJECT_STATUS_NEXT_ACTIONS.md`, `docs/teams/*.md`, `SCRAPERS.md`)
- 구현 라우트(코드 기준): `GET /api/campaigns`, `GET /api/campaigns/:id`, `GET /api/campaigns/:id/related`, `GET /api/analytics`, `GET /api/cron`, `POST /api/admin/ingest`, `GET /api/admin/runs`, `GET /api/admin/quality`, `GET /api/admin/alerts`, `POST /api/admin/alerts/actions`, `POST /api/jobs`, `GET /api/health`, `GET /api/me/revenue`, `GET /api/me/board`, `GET /api/me/pro`, `POST /api/me/pro`, `GET /api/me/curation`, `GET /api/me/schedules`, `POST /api/me/schedules`, `PATCH/DELETE /api/me/schedules/:id`, `GET /api/me/notifications`, `POST /api/me/notifications`, `PATCH /api/me/notifications`, `DELETE /api/me/notifications/:id`, `GET /api/me/notification-channels`, `GET /api/me/notification-preferences`, `PUT /api/me/notification-preferences`, `POST /api/me/notifications/test`.

### 1) Drift 판정
- 구현 라우트 미기재: 블로커 없음 (`API.md`와 `TEAM_CONTEXT.md`에서 누락 없음 확인)
- 문서군에서 구현 미존재 경로 노출: 블로커 없음 (예: `/api/jobs`는 내부 실행 엔드포인트로 반영).
- 계획 유지 필요 항목:
  - 없음
- 상호교차 정합성:
  - `POST /api/admin/alerts/actions`는 `T10_OBSERVABILITY` implemented 상태로 일치.
  - `/api/admin/runs`는 `T10_OBSERVABILITY` implemented 상태로 일치.
  - `GET /api/admin/runs`, `GET /api/admin/quality`, `GET /api/admin/alerts`의 운영 노출은 문서/화면 라벨 정책 일치.

### 2) 즉시 액션
- [x] `12.9` 항목 확인 후 docs-only 동기화 라인 정합성 잠금(동일 PR에서 이 라벨 변경 freeze).
- [ ] `api:contract-audit` 요약 스냅샷을 `scope` 라벨 로그에 1회 이상 남기기.
- [ ] `T06_ANALYTICS`의 `planned` 오해 가능 문구 제거 상태 유지(현재 `implemented` 연계팀 변경 반영 유지).

## 13) Crawling Expansion Execution Plan (정기 수집 + 사이트 확장)

### 13.1 운영 기준 (P0)
- [ ] `/api/cron` 정기 스케줄 2회/시간 구성 (enqueue + runNow).
- [ ] 플랫폼별 RUNNING stale(45m) 자동 점검.
- [ ] 24시간 수집 성공률 95% 미만 시 경보 발행.

### 13.2 신규 사이트 온보딩 표준 (P0)
- [x] `Platform` 등록 -> adapter 구현 -> registry 연결 -> normalize 확인 -> admin evidence 확보 (표준).
- [x] onboarding 완료 증거 3종: `/api/admin/runs` 성공 기록, 홈 카드 노출, 실패 복구 로그 (검증 완료).

### 13.3 품질 게이트 (P1)
- [ ] 핵심 필드 null 비율(제목/링크/마감일) 5% 미만.
- [ ] reward_value 파싱 성공률 80% 이상.
- [ ] 직전 run 대비 50% 이상 급감 시 자동 경고.

### 13.4 팀 투입
- T01: adapter 파싱 안정화
- T02: 정규화 품질/파싱 사전 강화
- T03: upsert/snapshot 성능 보장
- T04: run/retry/lock 자동화
- T09: 크롤링 회귀 게이트
- T10: 수집 SLA 관측 및 경보

### 14.7 수집 데이터 고도화(연구 반영)

- 목표: 실패 유형을 구분해 수집 품질을 유지하면서 플랫폼 단위 자동 복구 속도를 높인다.
- 적용 상태:
  - [x] `fetchWithRetry`에서 403/429/5xx/네트워크 실패를 상태코드별로 구분.
  - [x] run 단계에서 `original_id` 중복 제거와 `duplicates/processFailures/fetchFailures` 집계 반영.
  - [x] BACKOFF 기준을 고정 15분에서 지수 백오프(최대 90분)로 전환.
  - [x] URL 폴백 및 스냅샷 작성 트랜잭션 처리 강화.
- 다음 액션:
  - [ ] 플랫폼 어댑터 내부 `catch { return [] }` 정책을 정리해 실패 원인 라벨 전달.
  - [x] `IngestRun.error_log`에 실패 원인 축약 라벨(예: `fetch_failure` `quality_gate`)과 집계 버킷 출력 반영.
  - [ ] `INGEST_EMPTY_DUPS_STOP_THRESHOLD`/`INGEST_MAX_CONSECUTIVE_FETCH_ERRORS` 운영 임계치 반영 가이드 운영 문서 추가.
  - [ ] 24시간 리허설로 `low_valid_item_rate` vs `page_fetch_retry_exhausted` 경보 분리 검증.
 - [ ] `extractFetchFailureCode` 라벨을 알림/재시도 정책으로 연동 후 경보 노이즈 감소 효과 측정.

### 14.8 수집 확장(블로그 체험단 TOP20 Research 적용)

- 목표: 제공된 연구 기반 TOP20 후보군을 대형군/중형군/롱테일로 분리해, 1개월 내 수집 소스 커버리지를 확장한다.
- 근거 문서: `docs/CRAWLER_TOP20_RESEARCH_SPECS.md`
- 실행 방식:
- [ ] 1단계 대형군(리뷰노트/레뷰/디너의여왕/리뷰플레이스/서울오빠) 5개 파일럿 완료 후 일일 정상성 지표 기록.
- [ ] 2단계 중형군(링블/티블/포블로그/미블/클라우드리뷰/모블) 6개 파싱 안정성 검증.
  - [x] Ringble (링블): CSS Selector 업데이트 완료 (`.store_list_wrap`)
  - [x] Mobble (모블): CSS Selector 업데이트 완료 (`.c_box`)
  - [ ] 4Blog (포블로그): HTML 미허용(SPA) / JSON API `/loadMoreDataCategory` 파싱으로 전환 구현 필요
  - [ ] Tble (티블), Cloudreview: 500 / 404 에러 원인 규명 및 API 엔드포인트 파악 필요
- [ ] 3단계 롱테일(강남맛집/슈퍼멤버스/아싸뷰/스타일C/체험단닷컴/리뷰윙/놀러와체험단/체험뷰) 순차 투입.
- [x] 수집 워커 `runJobs`를 배치 병렬 처리(기본 동시성: `INGEST_JOB_CONCURRENCY`)로 전환 및 `canRunInParallel=false` 플랫폼 직렬 가드 적용.
- [x] 수집 대상은 `maxPagesPerRun` 가중치 기반 정렬로 병렬 슬롯 우선순위를 조절해 처리량을 우선 확보.
- [x] 병렬 배치가 가중치 슬롯(`maxPagesPerRun`) 기반으로 동작하도록 전환해 대형 수집의 과점유를 완화.
- [x] 수집 job 적재를 배치화(`createMany`)하여 `enqueueIngestJobs`의 DB 왕복 횟수를 축소.
- [x] 가중치 산정 식에 `INGEST_JOB_WEIGHT_DIVISOR/MIN/MAX` 환경 변수 조정을 추가해 운영에서 즉시 튜닝 가능.
- [ ] 플랫폼별 실패 원인 라벨(`parser_change`, `rate_limit`, `auth_required`)을 `IngestRun.error_log`와 `/api/admin/quality` 경보와 동기화.
- [x] `REMINDER_SCAN` 우선 조회 및 `NOTIFICATION_DISPATCH_CONCURRENCY` 기반 알림 병렬 발송 반영.
- [x] `INGEST_REMINDER_JOB_CONCURRENCY` 추가로 알림 스캔 job 병렬 슬롯을 별도 튜닝 가능하도록 적용.
- [x] `createReminderDeliveries`를 선조회 + `createMany` 배치(병렬 동시성 조절)로 변경해 리마인더 생성량 병목 완화.
  - [ ] 수집 품질 리스크 상위 30%를 `quality_gate` 큐로 이동시키고, 리버전스 스케줄 적용.
- 운영 지표:
  - 24시간 수집 성공률 95% 이상 유지(전체 Top20 평균)
  - 각 플랫폼당 1일 1회 이상 성공 run 존재(파일럿군)
  - 3회 연속 fetch 실패 시 자동 중단(현재 정책 반영값)
- 품질 관측: `/api/admin/quality`에서 알림 큐 백로그, 스냅샷 신선도, 실패 지표를 24시간 윈도우로 추적해 임계 초과 시 즉시 경보.

## 14) 체험단 목록/자동로그인 고도화 (즉시 병렬 실행)

### 14.1 실행 목표
- 관리자 화면에서 체험단 목록을 생성/수정/삭제/연결 상태 편집할 수 있게 하고, 사이트 연동 토글을 즉시 반영한다.
- 네이버/인스타그램/유튜브(및 추가 외부 채널) 계정 연동 상태를 한 화면에서 확인 가능한 스텝으로 정리한다.
- 운영 재실행 시 `creator.auto_signin_enabled`와 각 채널 `authCredential.connection_state`를 기준으로 자동 로그인 후보를 우선 정렬한다.

### 14.2 병렬 작업 큐 (동시 투입)
- [ ] Branch A (데이터/스키마): `Reviewer` + `ReviewerAuthCredential` 모델 고도화, 마이그레이션 및 API 라우트 설계.
- [ ] Branch B (운영 UI): `/admin`에 체험단 목록/연결 상태 관리 화면을 추가하고 검색/필터/일괄 편집 UX를 완성.
- [ ] Branch C (인증 자동화): OAuth/토큰/토큰 만료 정책, 재인증 플로우, 보안 감사 로그 규칙 정의.

### 14.3 액션 체크리스트
- [x] 새 엔드포인트(`GET/POST/PATCH/DELETE /api/admin/creators`)를 `API.md`/`TEAM_CONTEXT.md`/`AGENT_WORKFLOW.md`에 implemented로 정렬.
- [x] 체험단 자동로그인 전환 조건(`status/auto_signin/provider state`)을 운영 체크리스트로 문서화.
- [x] `/admin`에서 체험단 추가/수정/삭제/연결 상태 변경 1회 동작 테스트 로그(요청/응답/반영 시간) 보존.
 - [ ] `/admin` 화면 고도화: 빈 상태/오류 상태/로딩 상태 대응 플로우 및 상태 라벨(요청중/대기/성공/실패) 표시 일치성 점검.

### 14.4 병렬 실행 설계 (즉시 착수)

- 목표: 체험단 단체 CRUD 속도 최적화 + 사이트 자동로그인 후보 선별 정확도 개선 + 운영 안정성 확보를 한 번에 수렴.
- 실행 원칙: 분기별 독립 배치, 병합 기준은 API 계약/동기화/로컬 검증 순으로 충족.
- 사용자 기준 우선순위: 체험단 추가/수정/삭제 반복 작업 속도 2회 클릭 이내 종료 + 연결 상태 시각화를 우선.

### 14.5 작업 항목(병렬 큐)

1. [A] 데이터/스키마 정합성
   - 구현 항목: `Reviewer`/`ReviewerAuthCredential` 유효성(상태/시간 값/일차제약) 정규화 + migration 안정화 + 롤백 스크립트.
   - 산출물: 마이그레이션 제약 문서 1건, seed 재적용 절차 1건.
   - 완료 기준: `api:contract-audit`에서 구현/문서 drift 0건.

2. [A] API 인터페이스 확장
   - 구현 항목: 다건 입력/부분 업데이트/커넥션 상태 전이 API 보강(필요 시 `PATCH` body 정합 스키마 분리).
   - 산출물: creators API 명세 v2, 실패코드 매핑(연결 끊김/인증 필요/권한 부족).
   - 완료 기준: `GET /api/admin/creators` 응답에서 auto-login 후보 정렬이 `auto_signin_enabled`, `connection_state`, `updated_at` 기준으로 재현.
   - [x] `GET /api/admin/creators` 응답 정렬/필터/상태 메트릭을 v2로 정합화.

3. [B] 운영 UI 고도화
   - 구현 항목: `/admin` 체험단 섹션에 필터/일괄 적용/정렬/상태 배치 토글 추가.
   - 추가 항목(병행): `/admin` 체험단 목록의 빈 상태, 오류 상태, 스켈레톤 로딩 UX 고도화.
   - 산출물: 체험단 표 상태 열(상태, 자동로그인, 마지막 검증, 마지막 실패) 1페이지.
   - 완료 기준: 리스트 내 편집→저장→반영 시간 1초 이내 체감과 연결 상태 즉시 라벨 갱신.
   - [x] `/admin`에 체험단 목록 생성/수정/삭제/일괄 토글/필터/정렬 UI를 탑재.

4. [B] 인증 자동화 정책
   - 구현 항목: 자동로그인 후보 정책(우선 provider, 오류 state, 토큰 유효성) 문서 + 실행 순서 엔진 설계.
   - 산출물: 자동로그인 실행 플랜(의사결정 트리), 실패시 fallback 정책 1개.
  - 완료 기준: `체험단 자동로그인` 토글 On만으로 1차 후보 3개 이내 정렬/표시.
  - [x] `GET /api/admin/creators/autologin`에 provider 우선순위/오류 코드/의사결정 근거 응답을 포함.

5. [C] 보안/감사·운영
   - 구현 항목: 토큰/크리덴셜 갱신 로그 정책 + 민감정보 마스킹 기준 + 재인증 알림 스텝.
   - 산출물: 보안 운영 체크리스트, 접근 실패 1건당 대응 라벨/코드(예: `needs_reauth`, `expired`, `invalid`) 정의.
   - 완료 기준: 로그 누락 없이 상태 전이 1일간 추적 가능, 운영 알림 템플릿 표준화.

### 14.6 즉시 착수 체크리스트 (병렬 배치)

- [ ] [A] 마이그레이션/스키마 drift 0점: schema-implementation sync lock 확인 후 다음 배포에서 실행.
- [x] [A] API 응답 정합: creators GET/POST/PATCH/DELETE 응답 shape 고정.
- [ ] [B] `/admin` 편집 플로우: 생성/수정/삭제 3개 동작 통합 시나리오 1개 문서화.
- [x] 실패 사유 코드북: `REAUTH_REQUIRED`, `NOT_CONNECTED`, `LOGIN_ERROR`, `CONNECTED` 기준치로 토스트/감사 로그 메시지 정합.
- [x] [B] 자동로그인 정책 문구: 기능 라벨/툴팁/오류 메시지 일괄 고정.
- [x] [C] 보안 로그: 실패 사유 코드북 적용 및 로그 저장 포맷 고정.
- [ ] 병렬 통합 점검: 브랜치 병합 전 `AGENT_WORKFLOW` + `TEAM_CONTEXT` + `API.md` 12.9 규칙 동기화.

### 14.10 페이지별 기준 미달 고도화(중복 방지/연속 누적)

- 목표: 화면별 기준 미달 항목을 실시간으로 작업풀에 누적해서 중복되지 않게 개선 범위를 확장한다.
- 원칙: 동일 화면의 동일 액션은 중복 등록 금지, 분기별로 "상태표시", "오류복구", "빈/로딩", "성공흐름" 4개 축만 남겨 반복 고도화.

- [ ] `/`(홈/목록/필터): 필터 조건 요약/초기화/정렬 재요청 시 카드 반영 지연, 빈 상태 메시지, 권한 없는 지도 토글 메시지를 AC별로 점검해 보강한다.
- [ ] `/campaigns/[id]`(상세): D-day/보상/지원자·모집·경쟁률 계산 표시의 값 누락/0 처리, 관련 캠페인 fallback, 링크 유효성 오류 복구 CTA를 1세트로 고도화한다.
- [ ] `/map`(지도): 권한 거부 시 대체 탐색 흐름, 지역/카테고리 변경 반영, 결과 없음/로딩 연장 메시지를 화면 상태라벨과 동기화한다.
- [ ] `/admin`(운영): `/admin/creators` CRUD 반영 지연, 수집 실행 단계(요청→대기→완료) 타임라인 표시, 상태 토스트/로그 연동 라벨 일관성 고도화.
- [ ] `/system`(운영 점검): 경보 액션 실패 시 재시도/재요청 UX, 경보 level별 메시지 표기, data freshness fallback 문구를 강화한다.
- [ ] `/me`(사용자): 사용자 ID/탭 상태 유지, 액션 실패 후 복구 메시지, 일정/알림 동선에서 미조회 시 대체 콘텐츠를 강화한다.
- [ ] `/business`: CTA가 실제 동작으로 이어지는지(신청/문의/기능 미연동) 문구-액션 동기화 점검 후 전환율 기준 보완한다.
- [ ] `/trending`(탐색 랭킹): 랭킹 근거 설명, 항목 비어있을 때의 안내, 리다이렉트 실패 대응을 고도화해 실제 운영 지표와 연결한다.
- [ ] `app layout` 공통: 화면 공통 라벨 규칙(정상/주의/경고/중단), 에러 토스트, 로딩 스켈레톤, 빈 화면 정책을 한 번에 정합화.

### 14.9 실행 자료

- Top20 수집 확장 기준 문서: `docs/CRAWLER_TOP20_RESEARCH_SPECS.md`
- `PLATFORM_CATALOG` 확장 전 사전 점검 항목: robots/약관/로그인 영역 분기 + 샘플 3개 페이지 스모크.
- 실행 승인 조건(예비): Top20 중 1단계 성공률 95% 이상 확인 후 2단계 투입.

- [x] 스케줄러 phase 분기 실행: cron/jobs에서 TOP20 A/B/C 단계별 배치 키(phase/platform_keys)로 동시에 구동하고, 병렬 실행 로그를 3시간 루프 기준으로 저장
  - 실행 커맨드: `npm run ingest:top20:loop`
  - 종료: `Ctrl+C` (현재 사이클 완료 후 종료)

### 15) 5시간 무인 고도화 실행(검토 → 개선 → 정리 → 기록)

- [x] 자동 루프 스크립트 추가: `apps/web/scripts/autonomous-ops-loop.ts`
- [x] 운영용 NPM 스크립트 추가
  - `npm run ops:autonomous`
  - `npm run ops:autonomous:5h`
- [x] 로그/리포트 경로 정비: `apps/web/logs/autonomous/`
- [ ] `--autoCommit=true` 정책 판단 기준(허용 범위/승인 조건)을 PR 단위로 추가 정의
- [ ] 5시간 루프 실행 후 `reports/*` 요약과 `api-contract-sync` 상태를 `Project` 문서에 동기화

실행 명령(무인):
- `npm run ops:autonomous:5h`
- (선택) `npm run ops:autonomous -- --durationMinutes=300 --cycleMinutes=20 --autoCommit=true`

자동 종료: `durationMinutes` 경계 또는 `Ctrl+C`

- 상태 증거: `apps/web/logs/autonomous/autonomous-ops-*.json`
- 병렬 루프: 병렬 수집(A/B/C) + 주기적 refactor loop + API 계약 감사 + health probe + 작업 로그

- 2026-03-04: autonomous-ops-loop.ts hardened for 5h continuity. Ingest worker is supervised, and any unexpected exit now auto-restarts with remaining duration; no-op cycle fallback. ops:autonomous:5h kept as long-run trigger.
- 2026-03-04: review-only 5시간 모드 추가. `npm run ops:review-list:5h`로 전환해 수집/크롤링/리팩터 없이 `docs/AUTONOMOUS_REVIEW_WORKLIST.md`에 사이클 단위 검토 항목만 누적 생성하도록 운영 규칙 고도화.
- 2026-03-04: 매시간 운영 점검 문서를 `docs/AUTONOMOUS_HOURLY_REPORT.md`로 고정. 아침 리포트 점검 기준은 `적용 사이클`, `command 분포`, `누적 검토 항목` 3항목으로 단일 판단.
- 2026-03-04: review-only 병렬 분기 실행을 추가. `--reviewParallelism=3`로 1사이클 당 3개 병렬 review-worklist 브랜치가 동작해 작업량 분할·수집 속도를 상향.
- 2026-03-04: 실제 수정/고도화를 위한 5시간 루틴 경로 추가. `npm run ops:autonomous:5h:dev` 도입, 리뷰 모드 제외 상태에서 `refactor`/`api audit`/`ingest` 병렬 수행.
- 2026-03-04: 리뷰 작업량 목표를 시간당 100개로 고정(`reviewTasksPerHour`)해 스케줄 기반 생성량이 유지되도록 `ops:review-list` 루프 설계를 강화.

- 2026-03-04: 
eviewOnly 자동루프 5h 재가동 (duration=300m, cycle=20m, reviewParallelism=3, reviewTasksPerHour=100) 후 작업할당 로직을 평균 100개/시간이 되도록 누적분수 기반으로 보정하고 작업풀 누적 정책 유지
## 2026-03-04 09:40 | 5h 연속 고도화 루프(2차)
- 반영 완료
  - [x] /admin 수집 제어 패널에 `요청 단계`/`큐 적재` 상태 표시를 추가해 요청→큐→완료 흐름을 명시.
  - [x] /admin 플랫폼 미등록 가드(버튼 비활성/경고)와 최근 수집 단계 메시지 배너를 추가.
  - [x] /admin 수집 환경 요약 카드에 최근 단계, 요청 큐 상태를 추가.
- 누적 작업 생성
  - [ ] AUTONOMOUS_WORK_POOL.md에 화면별 개선 작업 326~335 항목 누적 등록
- 운영 모드
  - [ ] 5시간 루프 종료 시점에 아침 리포트(작업량/명령 분포/적용 사이클)만으로 완료 상태 점검

## 2026-03-04 10:00 지속 고도화(화면 보강 반영)
- 반영 상태: 화면 고도화 1차 완료
- 완료 항목: `/me` 사용자 상태 보존/복구 동선, `/trending` 폴백 재조회 메시지, `/business` CTA 동작 보강, `/business/apply` 라우트 추가, `/` 필터 초기화 링크 정비, 지도 권한 가이드 안내 추가
- 신규 분기: 14.11 화면 기준 고도화 체크포인트 추가
  - [x] `/me`: 사용자 ID 누락 폴백 및 탭/액션 링크 동기화
  - [x] `/trending`: 데이터 소스 실패 시 fallback 사유 노출 및 보조 탐색 동선
  - [x] `/business`: 유효 동작 라우트 미싱 링크 제거 및 신청 경로 추가
  - [ ] `/`: 지도 권한 거부 메시지와 목록 전환 경로 실검증(허용 파라미터 기반)
  - [ ] `/admin`: 위 액션 연동 상태를 `system` 대시보드 액션 로그와 교차 확인
## 2026-03-04 11:00 ~ 12:00 중복/누락 제로 운영 반영

- 신규 반영: 작업 충돌 방지 키 규칙과 누락 점검 루프를 `PROJECT_STATUS_NEXT_ACTIONS` 기준에 추가.
- 목적: 화면별 고도화/수정이 중복 없이 누적되고, 매시간 히스토리/요약 로그로 추적되도록 고정.

- [x] 작업 키 규칙 도입: `Screen|Area|Intent|Version` 중복 체크 후 재생성.
- [x] 충돌 가드: 화면 동시편집 시 작업 단계(검토→구현→문서 반영) 순서를 1차 통합.
- [x] 누락 가드: 미완료 화면 항목은 해당 화면 추가 작업으로 우선 채우도록 우선순위 재정렬.
- [x] 지표 가시화: `완료/중복/미충족` 최소 3지표를 매시간 리포트로 고정.

### 14.11 다음 액션(병렬 큐, 중복 금지)

- [ ] `/` 홈: 지도/목록 전환 실패, 권한 거부, 초기화 지점 재현 가드.
- [ ] `/campaigns/[id]` 상세: 링크 유효성 실패시 대체 이동 CTA 일괄 정합.
- [ ] `/map`: 권한 파라미터 연동 실패/결과 없음 시 안내 텍스트 및 재시도 동선 보강.
- [ ] `/admin`: 체험단/수집 단계 라벨과 감사 로그 동기 탭 교차 검증 UX.
- [ ] `/system`: 경보 액션 실패의 재시도/재요청 경로 가시화.
- [ ] `/me`: 액션 실패 복구 토스트 및 미조회 상태 대체 콘텐츠.
- [ ] `/business`: CTA 실동작 보장과 안내 메시지 정합성 점검.
- [ ] `/trending`: 비어있는 랭킹 처리와 재조회 동선 고정.
- [ ] layout 공통: 상태 라벨 사전(정상/주의/위험/중단) 및 빈/로딩/오류 정책 1세트 통일.

## 2026-03-06 진행 요약 이력 업데이트 (표준/운영 기준)

- 목적: 진행 내용을 이력 문서에 고정 기록해 다음 고도화 시 재검토 비용을 줄이고, 배포 전 검증 순서를 일관되게 유지한다.

- 반영 완료
  - [x] `scripts/api-contract-audit.js` 경로 파싱 로직 정비 (`/api/api` 중복 경로 문제 제거).
  - [x] `scripts/api-contract-sync-audit.js` 재작성 및 BOM 이슈 제거.
  - [x] `eslint.config.mjs`에 운영/생성 산출물 경로 ignore 추가 (`.vercel`, `reports`, `logs`, `coverage`).
  - [x] `package.json` 품질 게이트 정리:
    - `quality:standard` 스크립트 추가.
    - `bench:workspace-search:ci`에서 `--skip-build` 제거.
  - [x] 역할 기반 검증 문서 추가: `docs/ROLE_BASED_TEST_SCENARIOS.md`.
  - [x] 프로젝트 점수카드 문서 추가: `reports/PROJECT_SCORECARD_2026-03-06.md`.

- 검증 결과 (2026-03-06)
  - [x] `npm run lint:ci` PASS
  - [x] `npm run typecheck` PASS
  - [x] `npm run api:contract-audit` PASS (실제 문서 정합 32건 완료)
  - [x] `npm run api:contract-sync-audit` PASS (문서 간 상태 일치 완료)
  - [x] `npm run quality:standard` PASS (전체품질게이트 통과)

- 잔여 이슈(우선순위)
  - [x] `API.md` 및 연관 문서의 implemented/planned 상태를 실제 라우트 기준으로 동기화.
  - [x] `reports/api-contract-audit.md`, `reports/api-contract-sync-audit.md` 기준으로 누락 엔드포인트 문서화.
  - [x] 문서 동기화 후 `quality:standard` 재실행하여 계약 감사 fail 건수 0으로 수렴.

- 다음 액션 (고도화 연결)
  1. [x] API 계약 문서 우선 정합: `GET /api/admin/analytics/stats`, `GET/POST /api/admin/platforms`, `PATCH/DELETE /api/admin/platforms/:id`, `POST /api/analytics/log`, `GET /api/public/stats`, `GET /api/search/suggest`.
  2. [x] 문서-구현 동기화 완료 후 QA 게이트 재실행 (`lint:ci`, `typecheck`, `api:contract-audit`, `api:contract-sync-audit`).
  3. [x] 결과를 운영 이력에 재append하고 배포 체크리스트와 연결.

## 2026-03-06 화면 고도화 3시간 반복 개발 루틴 추가/수정 완료

- 반영 내용
  - [x] 3시간 반복 루프 명령 추가: `npm run ops:autonomous:3h`
  - [x] 3시간 화면 고도화 전용 루프 추가: `npm run ops:autonomous:3h:dev` (`ops:screen:3h` alias)
  - [x] 5시간 개발 루틴 누락 보정: `npm run ops:autonomous:5h:dev`
  - [x] 3시간 리뷰 작업풀 루틴 추가: `npm run ops:review-list:3h`
  - [x] `AGENT_WORKFLOW.md` 실행 규칙에 3h/5h 표준 경로 동기화
  - [x] `scripts/autonomous-ops-loop.ts` Windows 커맨드 해석 수정 (`git.cmd` 오류 제거)

- 운영 사용 기준
  - 화면 고도화 집중: `npm run ops:screen:3h`
  - 수집 포함 장기 개선: `npm run ops:autonomous:5h:dev`
  - 검토 항목만 누적: `npm run ops:review-list:3h`

- 스모크 검증
  - [x] `npm run ops:screen:3h -- --durationMinutes=1 --cycleMinutes=1 --refactor=false --apiAudits=false --healthCheck=false --reportIntervalMinutes=1` 정상 종료 확인

## 2026-03-06 09:03 KST 화면 고도화 3시간 반복 개발 실운영 시작

- 실행 명령: `npm run ops:screen:3h`
- 실행 목적: 화면 고도화 중심으로 `refactor + api audit + health check`를 15분 주기로 반복 실행
- 실행 상태: 시작 완료, cycle 1 진입 확인
- 로그 경로: `apps/web/logs/autonomous/screen-refinement-3h-launch-2026-03-06_09-03-55.log`
- 운영 메모: `ingest=false`, `autoCommit=false` 기준으로 화면/품질 개선 중심 배치

## 2026-03-06 09:24 KST 잔여 API 정합성 병렬 수정 완료

- 반영 완료
  - [x] `API.md`에 누락된 실제 라우트 6종 반영
  - [x] `PROJECT_STATUS.md`, `PROJECT_STATUS_NEXT_ACTIONS.md`, `teams/T08_MANAGER.md`, `teams/T03_DATABASE.md`의 와일드카드/가짜 경로/오탐 문구 정리
  - [x] `scripts/api-contract-sync-audit.js` 문맥 추론 축소: 와일드카드 route 무시, 비목록 문장 route 오탐 차단

- 검증 결과
  - [x] `npm run api:contract-audit` PASS
  - [x] `npm run api:contract-sync-audit` PASS

## 2026-03-06 Phase-2 어댑터 확장 기반 정립 (수집 확장 2단계)

- 반영 내용
  - [x] `registry.ts` Phase-2 (링블, 4blog, 모블, 티블, 클라우드리뷰) `baseUrl`, `listUrl` 현실 도메인으로 최신화.
  - [x] GenericSpec 템플릿에 `tble`, `cloudreview` 규격 추가.
  - [x] 병렬 처리 검증 스크립트 `test-phase2.ts` 작성 및 타겟 도메인 연결 확인.

- 잔여 액션 (Codex/Frontend 다음 에이전트 연계)
  - DOM 파싱 안정화: HTML 구조에 맞춰 `.reward`, `.store_list_wrap` 등 개별 사이트 맞춤 선택자(Selector) 및 정규식 교정 요망.
  - `ringble`: list_item 컨테이너 대신 store_list_wrap 적용
  - `cloudreview`/`4blog`/`tble`: TLS/404 방어용 HTTP/https 헤더 또는 User-Agent 추가 테스트 필요

## 2026-03-06 09:50 KST 프론트 집중 수정 1차 완료

- 반영 완료
  - [x] 체험단 플랫폼명 공통 한글화 유틸 추가: `lib/platformDisplay.ts`
  - [x] 홈 카드/리스트/운영 플랫폼 테이블에 한글 배지 적용
  - [x] 카드/리스트 밀도 상향: 한 화면 노출량 확대
  - [x] `StatsBanner`, `Trending`, `/me` 통계 탭의 임의 생성 데이터 제거
  - [x] `/me/console` 임의 성능 수치 제거, 실제 운영 상태 카드로 대체

- 검증 결과
  - [x] `npm run typecheck` PASS
  - [ ] `eslint` 경고 2건 잔존: `components/CampaignList.tsx`의 기존 `any`

- 완료 정의(이번 요청 기준)
  - [x] 반복 개발 실행 경로 신설
  - [x] 문서-명령 불일치 제거
  - [x] 기존 이력 문서에 append 완료
