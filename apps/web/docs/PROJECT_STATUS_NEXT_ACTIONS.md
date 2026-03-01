### Core Sync Baseline (2026-03-01)

- Canonical update order: API.md -> ARCHITECTURE.md -> TEAM_CONTEXT.md -> AGENT_WORKFLOW.md -> PROJECT_STATUS.md -> PROJECT_STATUS_NEXT_ACTIONS.md
- Implemented status rule: route exists under apps/web/app/api.
- Current implemented API set: /api/campaigns, /api/analytics, /api/cron, /api/admin/ingest, /api/admin/runs, /api/admin/quality, /api/admin/alerts, /api/admin/alerts/actions, /api/health, /api/me/revenue, /api/me/board, /api/me/pro.

# NEXT ACTIONS & SPRINT DIRECTIVES (2026-03-01)
> 핵심 문서 동기화는 `API.md`, `ARCHITECTURE.md`, `TEAM_CONTEXT.md`, `AGENT_WORKFLOW.md`, `PROJECT_STATUS.md`를 기준으로 수행합니다.

### Worker/Manager/Parsing Fast-Track Progress (2026-03-01)

- Queue/Worker Track:
  - Cron route now supports queue-only mode by default.
  - Add `runNow=true` query when immediate run is required.
  - Job execution path moved to shared worker runner with lock + retry.

- Notification Track:
  - Added `lib/notificationSender.ts` with channel adapters (`push`, `kakao`).
  - Reminder scan now creates `NotificationDelivery` rows and dispatch pass marks SEND/FAILED.

- Parser Track:
  - Added regression tests for `normalizeRewardValue` covering KRW unit cases + fallback.
  - Next: harden by adding mixed-unit fixtures in a dedicated parser fixture file if needed.

- Execution Efficiency Track:
  - Added claude.md with token policy, MCP search policy, and naming requirements.
  - Added reusable gate automation for PR/build quality checks:
    - `npm run agent:review` => `lint + typecheck + test:ci`
    - `npm run agent:qa` => `lint + typecheck + test:ci + smoke:ci + build`
  - Reports are generated at apps/web/reports/agent-<mode>-summary.md


## API 정합성 추적 (추가)

- 공개 라우트 검증 기준 확장
  - `POST /api/jobs`는 현재 공개 라우트 미존재, `GET /api/cron` 기반 큐 실행으로 통일.
  - `GET /api/campaigns/:id` 및 일정/알림 상세 API는 계획 항목으로 분리 관리.
- API 문서 동기화
  - `apps/web/docs/API.md`를 구현 기준/계획 기준으로 재분리 완료.
  - `T04/T10/ARCH/NOTES`에 `/api/jobs` 표기를 런타임 실행 트리거 문구로 교체.
- 배포 전 점검 항목 추가
  - `/api/admin/quality`, `/api/admin/alerts`, `/api/admin/alerts/actions`는 라우트 구현 후 `implemented` 반영.

## 정합성 감사 체크리스트 (문서-실행 일치)

- [ ] 실제 라우트 존재성 점검: `app/api` 경로와 `API.md`의 구현 항목 일치 확인
- [ ] 계획 항목은 `PROJECT_STATUS.md`와 `TEAM` 문서에서 `미구현(계획)`로 표시
- [ ] `POST /api/jobs` 문구를 공개 API 대신 내부 실행 후보로 통일
- [ ] worker 실행 경로(`GET /api/cron`)와 스케줄러(`limit`, `runNow`) 동작 확인
- [ ] `/api/admin/quality`, `/api/admin/alerts`, `/api/admin/alerts/actions` 노출 상태는 라우트 존재성과 문서 상태를 일치해야 함

## AGENT 정합성 주간 감사 템플릿

- [ ] 라우트 스캔: `app/api` 내 실제 라우트와 `apps/web/docs/API.md`의 구현 항목 일치
- [ ] T08/T04/T10 문서의 상태 플래그가 동일한지 교차 검증
- [ ] `/api/jobs`가 공개 문서에서 독립 엔드포인트로 노출되지 않았는지 확인
- [ ] 계획 항목(`GET /api/campaigns/:id` 등)에 `계획(미구현)` 표기 존재
- [ ] `/api/admin/quality`, `/api/admin/alerts`, `/api/admin/alerts/actions`의 노출/차단 상태를 라우트 상태와 동기화
- [ ] 배포 전 `TEAM_CONTEXT.md` `#api_contract_audit` 기준 점검 완료

## 자동 리뷰 체크 항목 (문서 정합성)

- [ ] team 문서 상태 태그: `implemented` 또는 `planned` 표기 준수
- [ ] 팀 문서의 API 책임 범위가 `API.md` 구현 목록과 일치
- [ ] 구현된 엔드포인트만 `Deployment`/`Smoke` 대상에 포함
- [ ] 계획 항목은 `계획(미구현)` 라벨과 출시 조건이 명시
- [ ] `POST /api/jobs` 관련 표기가 공개 API로 오해되지 않음
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
- [ ] 홈페이지 상단 피드백 루프 도입 (`빈 상태 CTA`, `필터 요약`, `에러 복구 배너`).
- [ ] 상세페이지 신뢰 배지(마감일/마지막 수집/링크 상태) 고정 라벨화.
- [ ] 지도 모드 권한 가이드 + 뷰포트 재검색 CTA 통일.
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
- [ ] `/api/cron` 큐 적재, `runNow`, `limit` 동작이 실제 배치 처리와 일치.
- [ ] 락/재시도 정책으로 중복 실행이 방지된다.
- [ ] 사용자 확인 포인트: 관리자에서 실행 이력 상태 변화(RUNNING -> SUCCESS/FAILED) 확인.

### T05_NOTIFIER
- [ ] D-3/D-1 스캔이 `NotificationDelivery`를 생성하고 상태(SEND/FAILED)를 기록.
- [ ] 채널 장애 시 fallback 정책(push/kakao)이 동작한다.
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
- [ ] 구현 API(`/api/me/revenue`, `/api/me/board`, `/api/me/pro`)가 화면과 1:1 연결.
- [ ] 미구현 API(`/api/me/schedules*`, `/api/me/notifications*`)는 비노출/계획 라벨 처리.
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
- 구현 라우트(코드 기준): `GET /api/campaigns`, `GET /api/analytics`, `GET /api/cron`, `POST /api/admin/ingest`, `GET /api/admin/runs`, `GET /api/admin/quality`, `GET /api/admin/alerts`, `POST /api/admin/alerts/actions`, `GET /api/health`, `GET /api/me/revenue`, `GET /api/me/board`, `GET /api/me/pro`, `POST /api/me/pro`.

### 1) Drift 판정
- 구현 라우트 미기재: 블로커 없음 (`API.md`와 `TEAM_CONTEXT.md`에서 누락 없음 확인)
- 문서군에서 구현 미존재 경로 노출: 블로커 없음 (예: `/api/jobs`는 내부 후보로 계획 항목에 명시).
- 계획 유지 필요 항목:
  - `GET /api/campaigns/:id`, `GET /api/campaigns/:id/related`
  - `GET /api/me/schedules*`, `GET /api/me/notifications*`
- 상호교차 정합성:
  - `POST /api/admin/alerts/actions`는 `T10_OBSERVABILITY` implemented 상태로 일치.
  - `/api/admin/runs`는 `T10_OBSERVABILITY` implemented 상태로 일치.
  - `GET /api/admin/runs`, `GET /api/admin/quality`, `GET /api/admin/alerts`의 운영 노출은 문서/화면 라벨 정책 일치.

### 2) 즉시 액션
- [ ]  `12.9` 항목 확인 후 docs-only 동기화 라인 정합성 잠금(동일 PR에서 이 라벨 변경 freeze).
- [ ] `api:contract-audit` 요약 스냅샷을 `scope` 라벨 로그에 1회 이상 남기기.
- [ ] `T06_ANALYTICS`의 `planned` 오해 가능 문구 제거 상태 유지(현재 `implemented` 연계팀 변경 반영 유지).

## 13) Crawling Expansion Execution Plan (정기 수집 + 사이트 확장)

### 13.1 운영 기준 (P0)
- [ ] `/api/cron` 정기 스케줄 2회/시간 구성 (enqueue + runNow).
- [ ] 플랫폼별 RUNNING stale(45m) 자동 점검.
- [ ] 24시간 수집 성공률 95% 미만 시 경보 발행.

### 13.2 신규 사이트 온보딩 표준 (P0)
- [ ] `Platform` 등록 -> adapter 구현 -> registry 연결 -> normalize 확인 -> admin evidence 확보.
- [ ] onboarding 완료 증거 3종: `/api/admin/runs` 성공 기록, 홈 카드 노출, 실패 복구 로그.

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
