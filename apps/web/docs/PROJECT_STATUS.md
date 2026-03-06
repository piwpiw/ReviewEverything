# Project Status Update (2026-03-01)

## Current Snapshot
- Scope: `apps/web` (Next.js app, Prisma schema, adapters, API routes)
- Current phase: Beta in active stabilization
- Latest recorded test run: `61 passed / 0 failed / 61 total` from `test_output.txt`
- Test status currently reflects adapter contract normalization and health/admin hardening work
- Baseline docs synced on 2026-03-01 (`README.md`, `docs/API.md`, `docs/ARCHITECTURE.md`, `docs/AGENT_WORKFLOW.md`, `docs/PROJECT_STATUS.md`)

## Completed In This Update
- **GIS Dual Engine Setup**: Complete integration of Kakao Maps V2.5 and Naver Maps V3, including `MarkerClustering`, `Reverse Geocoding`, and `Static Map` fallback for visual thumbnails.
- **Database Connection Hardening**: Stabilized `DATABASE_URL` and `DIRECT_URL` environment variables pointing to reliable Supabase AP-Northeast-2 pooler.
- Updated `README.md` operational status to reflect latest recorded test result.
- Aligned `docs/API.md` ingest request contract with implementation (`platform_id` single value).
- Fixed platform filter option mapping and completed 7-platform coverage in `FilterBar.tsx`.
- Implemented actual low-competition ordering for `competition_asc` in web page and campaigns API.
- Synced adapter fixture expectations with current fallback contract for `MrBlogAdapter` and `GangnamFoodAdapter`.
- Removed default `ADMIN_PASSWORD` fallback in `middleware.ts` and added fail-closed behavior.
- Updated admin dashboard health check to consume `/api/health` response (`db` field) before rendering ONLINE status.
- Added GitHub Actions CI workflow (`.github/workflows/ci.yml`) to run `apps/web` tests on `main` push/PR.

## What Is Implemented
- Data model and indexing are defined in Prisma:
  - `Platform`, `Campaign`, `CampaignSnapshot`, `IngestRun`
  - snapshot/query indexes for ingestion and analytics workloads
- Main API routes exist and are wired:
  - `GET /api/campaigns`
  - `GET /api/analytics`
  - `GET /api/cron`
  - `POST /api/admin/ingest`
  - `POST /api/jobs` (internal)
  - `GET /api/admin/runs`
  - `GET /api/admin/quality`
  - `GET /api/admin/alerts`
  - `POST /api/admin/alerts/actions`
  - `GET /api/health`
  - `GET /api/me/revenue`
  - `GET /api/me/board`
  - `GET /api/me/pro`, `POST /api/me/pro`
  - `GET /api/campaigns/:id`, `GET /api/campaigns/:id/related`
- `GET /api/me/schedules`, `POST /api/me/schedules`, `PATCH /api/me/schedules/:id`, `DELETE /api/me/schedules/:id`, `GET /api/me/notifications`, `POST /api/me/notifications`, `PATCH /api/me/notifications`, `DELETE /api/me/notifications/:id`, `POST /api/me/notifications/test`, `GET /api/me/notification-channels`, `GET /api/me/notification-preferences`, `GET /api/me/curation`
- Ingestion pipeline is implemented:
  - adapter fetch loop (up to 5 pages)
  - dedupe/normalize processing
  - ingest run tracking (`RUNNING`, `SUCCESS`, `FAILED`)
- Adapter registry contains 7 platforms (`sources/registry.ts`)
- Admin dashboard exists with:
  - health check
  - ingest trigger per platform/all
  - run log polling

## Gaps And Risks
- Security and operation hardening completed; remaining validation:
  - Regression coverage on adapter fixture expectations was completed in this cycle.
  - CI now includes lint + test checks and failure issue creation; behavior should be verified on first real PR/merge.
- CI consistency note:
  - `test_output.txt` artifact path was corrected to `test_output.txt` in workflow (relative to `apps/web` working directory).
- Current hard blocker (pre-existing): 프로젝트 전체 ESLint `no-explicit-any` 룰 위반 다수로 lint가 현재 실패 상태입니다. 기존 코드 범위 정리가 필요합니다.
- Product polish pending:
  - Minor UX copy and zero-state messaging can be aligned with final brand tone.

## Next Work (Prioritized)
1. P2: Monitor first real PR/MR CI run and adjust `ci-failure`/`automated` issue labels, if needed.

## Suggested Update Cadence
- Revisit this document after each of:
  - adapter contract decision
  - test suite stabilization
  - auth hardening merge

## PRD Fit Review (All-in-One Upgrade, 2026-02-28)

This section maps the requested integrated PRD to the current implementation.
Status labels:
- `Implemented`: already working in production code paths
- `Partial`: available but limited, fragile, or not yet production-grade
- `Missing`: not implemented yet

### 1) Discovery / Curation
- `Implemented`: multi-dimensional filtering (`campaign_type`, `media_type`, `region_depth1/2`, `category`) via `lib/queryBuilder.ts` and `components/FilterBar.tsx`.
- `Implemented`: numeric filters for low competition (`max_comp`) and reward threshold (`min_reward`) via denormalized DB fields.
- `Implemented`: recent filter history (top 5) in `localStorage` via `components/FilterBar.tsx`.
- `Implemented`: quick outbound actions in cards (store/map/product link behavior) via `components/CampaignCard.tsx`.
- `Implemented`: map view exists (`components/MapView.tsx`) with mature Naver/Kakao dual engine, highly scalable `MarkerClustering`, and `Reverse Geocoding` context overlay.
- `Partial`: reward parsing exists (`sources/normalize.ts`) but is regex-only and not robust enough for broad free-text patterns.

### 2) Smart Manager (CRM)
- `Missing`: user auth/account domain (`users` table and authenticated app flows).
- `Missing`: schedule/calendar domain (`user_schedules`, calendar UI, manual external sponsorship entry).
- `Missing`: revenue dashboard domain (monthly/yearly sponsorship/ad-fee analytics).
- `Partial`: PWA prompt component exists (`components/PWAPrompt.tsx`), but manifest/service-worker assets are not present, so install path is incomplete.

### 3) Background Processing / Worker Reliability
- `Implemented`: scheduled ingestion trigger exists (`vercel.json` -> `/api/cron`) and admin/manual trigger exists (`/api/admin/ingest`).
- `Partial`: cron/admin handler now avoids fire-and-forget and records per-platform result, but still runs inline in route lifecycle (not yet durable queue worker).
- `Implemented`: cron-aware notification worker integration for reminder dispatch runs (`/api/cron`, `backgroundWorker`), with retry/fallback behavior.  
  (`POST /api/jobs` is now an internal execution endpoint (`CRON_SECRET`), while durability hardening is still in progress.)

### 4) Data Model Alignment
- `Implemented`: `platforms`, `campaigns`, `campaign_snapshots`, `ingest_runs` equivalents exist in Prisma schema.
- `Implemented`: campaign supports `region_depth1/2`, `reward_value`, `competition_rate`, `lat/lng`, outbound URL fields.
- `Partial`: index strategy is strong but not yet aligned to a single composite filter index strategy from PRD; current schema uses multiple focused indexes.
- `Missing`: `users` and `user_schedules` tables and their indexes.

## Design Update For Next Upgrade (Do not rewrite, extend)

The next iteration should extend the existing Aggregator architecture, not replace it.

### Target Architecture Lanes
- `Lane A - Aggregator Core (existing, keep and harden)`: scraping, normalization, dedupe, campaign search/map, analytics.
- `Lane B - Manager Core (new)`: user identity, schedule lifecycle, manual entries, reminders, revenue aggregation.
- `Lane C - Worker Core (new)`: durable job execution for ingestion and notifications with retry, lock, and observability.

### Phase Plan (Recommended)

#### Phase 1: Worker hardening + parser upgrade (highest priority)
- Replace cron fire-and-forget with durable execution strategy:
  - option 1: DB-backed job table + worker loop
  - option 2: managed queue (preferred if infra allows)
- Add run-level locking to avoid overlapping full-platform jobs.
- Upgrade reward parsing pipeline to layered strategy:
  - deterministic regex rules
  - unit dictionary (KR currency/text variants)
  - fallback parser score and confidence logging
- Add reliability metrics (`run_time_ms`, `failed_platforms`, `retry_count`) to ingest telemetry.

#### Phase 2: Manager data foundation
- Add Prisma models and migrations:
  - `User`
  - `UserSchedule`
  - optional `NotificationDelivery` audit table
- Define schedule status machine:
  - `APPLIED -> SELECTED -> VISIT_PLANNED -> REVIEW_COMPLETED`
- Add APIs:
  - `GET/POST /api/me/schedules`
  - `PATCH /api/me/schedules/:id`
  - `GET /api/me/revenue?month=...`

#### Phase 3: Manager UX + reminders
- Implement calendar UI and manual entry modal.
- Implement monthly/yearly revenue dashboard cards/charts.
- Add 9AM daily reminder worker (deadline D-3, D-1) with provider abstraction:
  - `push`, `kakao`, and `telegram` sender implementations behind one interface.

#### Phase 4: Map/PWA completion
- Add marker clustering and viewport-based lazy marker loading in map mode.
- Add real `manifest.json` + service worker strategy and offline-safe shell behavior.
- Add mobile install funnel tracking to measure PWA adoption.

## Immediate Backlog For Next Sprint
- 현재 실행 항목은 작업 목록 고도화(구조 통합) 섹션의 백로그 통합 항목으로 관리합니다.

## Parallel Execution Update (2026-02-28)

- Aggregation Team:
  - Ingestion guard + inline execution completion in `/api/cron`, `/api/admin/ingest`.
  - Next move: add durable queue/job state and explicit lock heartbeat table.
- Parsing Team:
  - `normalizeRewardValue` upgraded to unit-aware parse + max-candidate extraction.
  - Next move: add parser fixture tests and confidence score for fallback decisions.
- Manager Team:
  - `User` and `UserSchedule` models added.
- `GET /api/me/schedules`, `POST /api/me/schedules`, `PATCH /api/me/schedules/:id`, `DELETE /api/me/schedules/:id`, `GET /api/me/notifications`, `POST /api/me/notifications`, `PATCH /api/me/notifications`, `DELETE /api/me/notifications/:id`, `POST /api/me/notifications/test`, `GET /api/me/notification-channels`, `GET /api/me/notification-preferences`, `PUT /api/me/notification-preferences`, `GET /api/me/curation`는 공개 라우트로 구현되어 있습니다.
- `/api/me/revenue`는 현재 구현 상태이므로 운영 우선도 목록에서 우선 유지.
  - Next move: calendar query optimization for dashboard.

## 실시간 후속 업데이트 (2026-03-01)
- Aggregation Queue Team: `cleanupStaleRuns` 도입으로 hung process 방지 로직 강화.
- Parsing Team: 금액 파서에 '억', '만(원)', 'usd' 등 다양한 단위 대응 및 layered regex 전략 적용 완료.
- Manager Team: `UserSchedule` CRUD API(`/api/me/schedules`, `/api/me/schedules/:id`) 구현 완료.

---

# 작업 목록 고도화(구조 통합)

## 1) 백로그 통합 (중복 제거)

즉시 적용: 
- `P1` 스키마 정합성 점검(중복 컬럼/누락 컬럼)
- `P1` `BackgroundJob` 락/재시도 가시성 보강
- `P1` `/api/campaigns/:id` + `/api/cron` 관련 AC 우선 충족

단기 Backlog(M0):
- `P1` `/api/cron` 내구성 전환 (큐 디스패치 보강)
- `P1` 기존 `Immediate Backlog` 항목 재정렬(중복 제거)
  - User/UserSchedule 마이그레이션 계획 수립
  - `/api/cron` 큐 적재 실패 상태 가시성 강화
  - reward 파서 fixture 게이트 추가
  - `/api/me` 계약 문서 정리

추천 우선순위 (Impact/Confidence/Effort):
1. Worker 내구성 + 파서 품질 게이트 (High/Med/Med)
2. Manager 데이터 모델 + 캘린더 UX (High/Med/High)
3. 알림 채널 통합 + 리마인더 워커 (High/Med/Med)
4. 지도 클러스터링 + PWA 완성 (Med/Med/Med)
5. 홈/상세 UX 완성 (Med/High/Low)

## 2) PRD Fit Review 하위로 통합한 실행 기준

아래 고도화 항목은 PRD의 `Lane A/B/C`에 맞춰 정렬합니다.

- Lane A (Aggregator Core): 캠페인 탐색/지도/상세, 검색 정확도/정렬
- Lane B (Manager Core): 일정/캘린더/정산, 알림 설정
- Lane C (Worker Core): 큐, 리마인더 워커, 품질 지표, 운영 관측

### PRD 연결 체크포인트

- 검색/필터/지도는 Lane A와 연동되어 `/api/campaigns`와 `/api/analytics` 중심으로 검증.
- 매니저/일정/캘린더는 Lane B로 통합해 `/api/me` 계열 API 일괄 정합성 보장.
- 큐·알림·SLA는 Lane C에서 운영 품질 게이트로 분리 관리.

## 3) 화면/기능/필수 요소 (단일 사전)

### 홈 / 캠페인 탐색 (`/`)
- 기능: 다차원 필터, 정렬, 리스트/지도 전환, 최근 필터 히스토리.
- 필수 요소: 필터 바, 결과 요약, 카드 라벨(보상/경쟁도/마감일), 상태 배지, 빈 상태 대체 액션.

### 캠페인 상세 (`/campaigns/[id]`)
- 기능: 상세 데이터(보상·기간·요구사항), 링크 동작, 유사 캠페인 추천.
- 필수 요소: 요약 카드, 위치 정보, 행동 버튼(신청/저장/공유), 수집 메타.

### 지도 모드 (`/map` 또는 홈 탭)
- 기능: 클러스터링, 위치 기반 재검색, 뷰포트 lazy 로딩.
- 필수 요소: 지도 캔버스, 재검색 CTA, 하단 카드 시트, 위치 권한 배너.

### 매니저 대시보드 (`/me`)
- 기능: KPI 요약, 다음 일정, 캘린더/통계 진입.
- 필수 요소: 일정 상태 요약 카드, 타임라인, 일정 추가 CTA, 알림 상태 배너.

### 캘린더 (`/me/calendar`)
- 기능: 월/주/일 보기, 일정 CRUD, 만료 경고 배지.
- 필수 요소: 월간 그리드, 날짜 상세 패널, 범례, 수동 추가 모달.

### 통계/정산 (`/me/stats`)
- 기능: 월/연 보상 합계, 분포, 목표 대비 달성률.
- 필수 요소: 기간 선택, 누적 그래프, Top 플랫폼, 인사이트 카드.

### 알림 설정 (`/me/notifications`)
- 기능: D-3/D-1 스케줄, 채널 선택, 테스트 발송.
- 필수 요소: 채널 토글/권한, 시간 스케줄, 최근 발송 로그.

### 인증/온보딩 (`/auth`, `/onboarding`)
- 기능: 로그인, 프로필/관심사 설정, 동의/권한.
- 필수 요소: 로그인 카드, 체크리스트, 약관/개인정보 링크.

### 관리자 (`/admin`)
- 기능: 수집 실행·상태 모니터링, 실패 재실행.
- 필수 요소: 플랫폼 상태 표, 실행 버튼, 런 로그, DB 상태.

### 시스템 신뢰/품질 (`/system`)
- 기능: 파서/수집 정확도 모니터링, 이상 경보.
- 필수 요소: 품질 KPI 카드, 경보 리스트, 7일 트렌드.

## 4) 수용 기준(AC) 단일 테이블

### AC 그룹 A (핵심 탐색)
- AC-S01: 필터 적용 시 요약값과 칩 동기화.
- AC-S02: 0건일 때 빈 상태 및 조건 완화 액션 노출.
- AC-S03: 카드 필수 속성 노출 누락 없음.

### AC 그룹 B (상세/지도)
- AC-S04: 상세 정보(보상·기간·요구사항·마감일) 누락 없음.
- AC-S05: 뷰포트 변경 시 재검색 CTA 노출.
- AC-S06: 링크 미존재 시 비활성 + 안내.

### AC 그룹 C (관리)
- AC-S07: 일정 CRUD 즉시 반영과 충돌 없는 상태 갱신.
- AC-S08: 관리자 상태 값과 `/api/health` 일치.
- AC-S09: 최근 7일 지표 갱신 실패 시 폴백 메시지 노출.

## 5) API/데이터/에러/테스트 정합성(중복 제거)

- API 세트, 데이터 요구사항, 에러 케이스는 페이지별로 동일한 항목 집합으로 통합 정의
- 기존에 분산되던 스냅샷을 다음 규칙으로 정렬:
  - API 문서: `GET /api/campaigns`, `GET /api/analytics`, `GET /api/me/revenue`, `GET /api/me/schedules`, `GET /api/admin/runs`, `GET /api/admin/quality`
  - 예외 처리: 404, 403, 네트워크 실패, 값 누락/지연 공통 처리 정책 1종 적용
  - 테스트: 필터 정합성, 정렬 회귀, 큐 적재 실패 상태, health 503 케이스를 회귀 기준으로 고정

## 6) 데이터 스키마(요청 집합) 통합

- `User`: 기본 인증 식별자 + 유니크 이메일
- `UserSchedule`: 사용자 일정/상태/기한 중심
- `NotificationDelivery`: 알림 발송 감사/재시도 트레이싱
- `BackgroundJob`: 락/재시도/오류 메모 필수 인덱스
- `Campaign`: 운영에 필요한 보상/경쟁률/기한 메타의 인덱싱 정리

## 7) 관측/알람

- SLO/SLA 및 알람 임계값은 단일 세트로 유지:
  - API p95 < 800ms, 수집 성공률 > 98%, 알림 성공률 > 95%, DB 가용성 > 99.5%
  - 임계 초과 시 `/system` 경보 대시보드에서 동일 기준으로 이슈화

## 8) 운영 IA/권한 규칙

- IA는 글로벌: 홈/지도/매니저/통계/알림/관리자(권한)로 고정.
- 권한은 `guest/user/admin` 3단 구성, 데이터 접근 범위는 도메인별로 단일 규칙 적용.
- 관리자 전용: 수집/품질/헬스.
- 사용자 전용: 본인 일정/알림 도메인.

## 9) 마일스톤 배분(M1~M5)

### M1 (0~4주)
- Worker 내구성, 큐/락/재시도, 파서 품질 게이트 핵심.
- 산출물: `/system` 신뢰지표 기본판, BackgroundJob 상태 트레이싱.

### M2 (5~10주)
- Manager 핵심: `User`, `UserSchedule`, 캘린더/일정 상태 머신, `/me/calendar` 기본 UX.

### M3 (11~14주)
- 알림 채널/리마인더 워커 구축, `/me/notifications` 운영화.

### M4 (15~17주)
- 지도 클러스터링, PWA 매니페스트/서비스워커, 모바일 설치 퍼널.

### M5 (18~19주)
- 홈/상세/캘린더 예외 UX, 카피 고도화, 품질 리포트 일관화.

### 기능-마일스톤 연결(요약)
- M1: 시스템/운영(`/system`) + 핵심 수집 안정성
- M2: 매니저 도메인(`/me`, `/me/calendar`)
- M3: 알림 도메인(`/me/notifications`)
- M4: 지도, 사용자 경험 채널(`/map`, PWA)
- M5: UX 마감(홈/상세/캘린더/통계)


## 누락 항목 보완(삭제/대체 없이 정합 강화)

### A. 화면별 UX 카피(유지 보완)

#### 홈 / 캠페인 탐색
- 빈 상태: "조건을 조금 완화하면 더 많은 캠페인을 찾을 수 있어요."
- 상태 배지 라벨: `마감 임박`, `신규`, `인기`
- 요약 라벨: "총 {n}개 캠페인, {k}개 조건 적용됨"

#### 캠페인 상세
- 신뢰 표기: "마지막 수집: {date}"
- 링크 미존재: "현재 연결된 외부 링크가 없습니다."

#### 지도 모드
- 위치 권한: "현재 위치를 허용하면 가까운 캠페인을 볼 수 있어요."
- 재검색: "이 영역에서 다시 찾기"

#### 매니저 대시보드
- 일정 비어있음: "예정된 일정이 없습니다. 새로운 일정을 추가해보세요."
- 알림 배너: "알림이 꺼져 있어요. 설정에서 켜주세요."

#### 캘린더
- 모달 제목: "일정 추가"
- 상태 라벨: `신청`, `선정`, `방문 예정`, `리뷰 완료`

#### 통계/정산
- 0원 상태: "아직 정산 내역이 없습니다."
- 인사이트: "이번 달은 지난달보다 {x}% 증가했어요."

#### 알림 설정
- 테스트 발송 성공: "테스트 알림이 전송되었습니다."
- 테스트 발송 실패: "전송에 실패했습니다. 잠시 후 다시 시도해주세요."

#### 인증/온보딩
- 체크리스트: "3분이면 설정 완료"
- 동의 문구: "계속하면 서비스 약관과 개인정보 처리방침에 동의합니다."

#### 관리자/시스템
- 최근 수집 성공: "최근 수집 성공: {date}"
- 최근 수집 실패: "최근 수집 실패: {date}"
- 경고: "정확도 저하가 감지되었습니다."
- 정상: "모든 지표가 안정적입니다."

### B. 페이지별 에러·예외 케이스(구체 복구)

#### 홈
- 필터 조건 과다(결과 0건): 즉시 조건 완화 제안 CTA 표시.
- API/네트워크 실패: 재시도 버튼 및 마지막 성공 상태 유지.
- `reward_value`/`competition_rate` 누락: 라벨 fallback 표시.

#### 캠페인 상세
- 404(삭제/만료): 캠페인 삭제/만료 안내 및 홈 복귀 버튼.
- 외부 링크 누락: 링크 비활성화 + 안내 문구.
- 스냅샷 부재: "최신 데이터 수집 대기중" 배너.

#### 지도 모드
- 위치 권한 거부: 권한 유도 배너와 수동 지역 선택 모드.
- 지도 SDK 로딩 실패: 텍스트 목록 모드 fallback.
- 클러스터 계산 실패: 마커 단순 표기 fallback.

#### 매니저 대시보드
- 일정 없음: 빈 상태 가이드+캘린더 이동 CTA.
- API 지연: 스켈레톤 + 마지막 동기화 시각 표시.
- 로그인 만료: 로그인 안내 + 상태 보존 후 복귀.

#### 캘린더
- 월간 로딩 실패: 재시도 및 캐시된 이전 일정 표시.
- 삭제 실패: 즉시 롤백 + 실패 토스트.
- 중복 일정 충돌: 중복 경고 후 수동 확인 흐름.

#### 통계/정산
- 0원/0건: 영점 차트 + 안내 문구.
- 기간 계산 오류: 범위 고정 및 사용자 선택 제한 피드백.
- 차트 데이터 불일치: 경고 배지 + 로그 링크.

#### 알림 설정
- 권한 미승인: 채널별 켜기 가이드.
- 테스트 발송 실패: 실패 코드 노출 + 재시도.
- 스케줄 중복: 저장 차단 + 병합 제안.

#### 관리자
- 권한 없음(403): 접근 거부 메시지 + 지원 채널.
- DB 다운: 헬스 지표와 수집 메뉴 비활성.
- 수집 실패 재시도 제한: 남은 재시도 횟수 및 다음 시도 시각 표시.

#### 시스템 신뢰
- 지표 지연: 마지막 정상시각 표시.
- 이상 탐지 없음: "탐지된 이상 없음" 상태 라벨.
- 알림 폭주: 묶음 요약 알림 + 상세 접기/펼치기.

### C. 화면별 API/데이터 요구사항(복원)

#### 홈
- 데이터: `Campaign`, 필터 메타, `competition_rate`, `reward_value`, `deadline_at`
- API: `GET /api/campaigns`, `GET /api/analytics`

#### 캠페인 상세
- 데이터: `Campaign` 상세, `CampaignSnapshot` 최신 버전, `outbound_store_url`, `outbound_map_url`, `outbound_product_url`
- API: `GET /api/campaigns/:id`, `GET /api/campaigns/:id/related`

#### 지도
- 데이터: `lat/lng`
- API: `GET /api/campaigns` (bbox/viewport)

#### 매니저/캘린더
- 데이터: `UserSchedule`, `next_schedule`, `visit_date`, `status`
- API: `GET /api/me/schedules`, `POST /api/me/schedules`, `PATCH /api/me/schedules/:id`, `DELETE /api/me/schedules/:id`

#### 정산
- 데이터: `monthly_revenue`, `yearly_revenue`, `platform_breakdown`, `category_breakdown`
- API: `GET /api/me/revenue`

#### 알림
- 데이터: 채널 권한, 스케줄, `NotificationDelivery`
- API: `GET /api/me/notifications`, `POST /api/me/notifications`, `PATCH /api/me/notifications`, `DELETE /api/me/notifications/:id`, `POST /api/me/notifications/test`, `GET /api/me/notification-channels`, `GET /api/me/notification-preferences`, `PUT /api/me/notification-preferences`

#### 관리자
- 데이터: 플랫폼별 런 상태, 실패 로그, `db` 지표
- API: `GET /api/admin/runs`, `POST /api/admin/ingest`, `GET /api/health`, `GET /api/admin/quality`, `GET /api/admin/alerts`

### D. 테스트 시나리오(구체 체크리스트 복구)

#### 통합
- 필터 조합 후 결과 목록/요약/카드 일치.
- 캠페인 상세에서 외부 링크 이동 정상.
- 캘린더 일정 등록이 대시보드 KPI에 즉시 반영.
- 알림 설정 변경 후 테스트 발송 로그 적재.

#### 회귀
- `competition_asc` 정렬 변경 시 순서 불변성.
- reward 파서 변경 후 기존 fixture 회귀 통과.
- `/api/cron` 큐 적재 실패 시 상태 보고.
- `/api/health`에서 DB 다운 시 `503` + `db: down`.

### E. 데이터 거버넌스(운영 보강)

#### 규칙
- `Campaign` 핵심 지표(`reward_value`, `competition_rate`, `deadline_at`)는 수집 정규화 파이프라인에서 최소값/최대값 경계 검증.
- `UserSchedule`은 사용자 본인 ID 범위 제약 + 상태 값(enum 고정.
- `NotificationDelivery`는 발송 이력 90일 보존, 실패 사유 코드는 표준 코드북 적용.
- `BackgroundJob`은 락 유효 기간 만료 시 강제 해제 후 경고 알림.

#### 정합성 점검
- API 변경 시 `docs/API.md`와 스키마/라우팅 계약 동시 업데이트.
- 수동 입력 일정은 `campaign_id` nullable 허용 + 중복 후보 감지.
- 상태 전이 시 `updated_at` 갱신 + 감사 로그 저장.

### F. 운영 런북(장애/롤백/모니터링)

#### 장애 대응
- ingest 실패 다발(동일 플랫폼 3회 연속): 해당 플랫폼 자동 정지, 수동 재실행 가이드 제시.
- DB 장애: `/api/health` 기반 모드 강등(읽기 경량 모드) 유지 여부 판단 및 운영 알림.
- 알림 발송 장애 급증(24h): 채널별 fallback 전환(푸시→카카오/이메일).

#### 롤백
- API 응답 오류율 급등 시 이전 안정 빌드로 라우트 단위 롤백.
- 파서 버전 이슈 발생 시 파서 규칙 set을 이전 버전으로 롤백.
- 스케줄 큐 과부하: 배치 크기 하향 + 수동 분배.

#### 모니터링
- 주기: 5분 수치 스냅샷(수집 성공률, 큐 적재/완료, API p95).
- 일일: `/system` 지표 브리핑 + 알람 임계 초과 리스트.
- 주간: 마일스톤 항목별 완료율 리뷰.

### G. 역할/접근 권한(보완 버전)

#### 권한 경계(명확화)
- `guest`: 홈/지도/상세/검색만 읽기 가능.
- `user`: 자기 일정/알림 도메인 및 매니저/통계 조회 가능.
- `admin`: 관리자/품질/헬스 실행/조회 가능.

#### 접근 테스트
- `403` 발생 시 공통 메시지 + 1초 후 대체 화면 전환.
- 토큰 만료: 토큰 갱신 후 이전 작업 재실행 큐 유지.

## API 정합성 상태 보강 (PROJECT_STATUS 내부 반영)

### 구현 완료 API
- `GET /api/campaigns`
- `GET /api/campaigns/:id`
- `GET /api/campaigns/:id/related`
- `GET /api/analytics`
- `GET /api/cron` (`runNow`, `limit`)
- `POST /api/admin/ingest`
- `GET /api/admin/runs`
- `GET /api/health`
- `GET /api/me/revenue`
- `GET /api/me/board`
- `GET /api/me/pro`
- `POST /api/me/pro`
- `GET/POST /api/me/schedules`
- `PATCH/DELETE /api/me/schedules/:id`
- `GET /api/me/notifications`
- `DELETE /api/me/notifications/:id`
- `POST /api/me/notifications/test`
- `GET /api/me/notification-channels`

### 계획/API 미구현 상태
- 없음

### 문서-실행 연결 규칙
- 구현 기준: 실제 앱 라우트 경로 존재 여부를 우선 적용
- 문서 반영: 구현 전 항목은 항상 `계획/미구현` 라벨로 명시
- 배포 승인 룰: 계획 항목은 별도 릴리즈 체크 후 문서 상태 전환

## 고도화 단일 템플릿(운영용)

- 범주: 인프라/기능/품질/운영
- 규칙: 구현 항목은 라우트 존재 기반, 계획 항목은 `계획(미구현)` 라벨 필수

### 1) 구현 항목 (Done)
- [x] `GET /api/campaigns`
- [x] `GET /api/campaigns/:id`
- [x] `GET /api/campaigns/:id/related`
- [x] `GET /api/analytics`
- [x] `GET /api/cron`
- [x] `POST /api/admin/ingest`
- [x] `GET /api/admin/runs`
- [x] `GET /api/admin/quality`
- [x] `GET /api/admin/alerts`
- [x] `POST /api/admin/alerts/actions`
- [x] `GET /api/health`
- [x] `GET /api/me/revenue`
- [x] `GET /api/me/board`
- [x] `GET/POST /api/me/pro`
- [x] `GET/POST /api/me/schedules`
- [x] `PATCH/DELETE /api/me/schedules/:id`
- [x] `GET /api/me/notifications`
- [x] `POST /api/me/notifications`
- [x] `PATCH /api/me/notifications`
- [x] `DELETE /api/me/notifications/:id`
- [x] `POST /api/me/notifications/test`
- [x] `GET /api/me/notification-channels`
- [x] `GET /api/me/notification-preferences`
- [x] `PUT /api/me/notification-preferences`
- [x] `GET /api/me/curation`

### 2) 고도화 항목 (Planned)
- [ ] 운영 품질 액션 UX: alerts action 응답 상태를 `/system` 화면 라벨/피드백에 반영
- [x] 워커 내부 API 정합성: jobs 실행 경로는 `CRON_SECRET` 기반 내부 엔드포인트로 반영

### 3) 정합성 체크
- [ ] `API.md`, `ARCHITECTURE.md`, `AGENT_WORKFLOW.md`, `TEAM_CONTEXT.md`, `PROJECT_STATUS.md` 동시 갱신
- [ ] AGENT 체크리스트 템플릿 기준 주간 감사 통과
- [ ] 문서 내 한글/영문 용어 통일률 점검(오류 표기 제거)
## UI/UX 고도화 총괄(100억급 사용자 가치 전략)
- 철학: 탐색 정확성보다 먼저 `결정 피로도`를 낮추고, 전환 행동(상세/일정/알림)까지 자연스럽게 연결한다.
- KPI 중심: 홈 검색 전환율, 상세 이동 전환율, 일정 등록 완료율, 알림 설정 완료율을 4개 핵심 지표로 주간 보고.
- 병렬 실행 맵: `T07_FRONTEND`(렌더/컴포넌트), `T08_MANAGER`(개인화 플로우), `T06_ANALYTICS`(우선순위 노출), `T10_OBSERVABILITY`(운영 신호 UX), `T09_VALIDATION`(회귀 게이트).
- 문서-실행 정합성 규칙: 화면별 AC(A/B/C 그룹)와 에러 복구 문구는 `AGENT_WORKFLOW`, `TEAM_CONTEXT`, `TEAM_CONTEXT #api_contract_audit`와 함께 동기화.
- 다음 단계: PROJECT_STATUS_NEXT_ACTIONS.md의 "UI/UX 집중 고도화 액션(병렬)" 항목을 실행 단위로 스프린트 배포.

## 화면 중심 운영 게이트(구조 정합성)

### 화면별 KPI 책임 체계
- `/`(홈): 탐색 전환율의 1차 책임은 `T07_FRONTEND`, 보정 지표는 `T06_ANALYTICS`.
- `/campaigns/[id]`: 상세 이탈률 개선의 1차 책임은 `T07_FRONTEND`.
- `/me*`: 일정 완료율/재방문 전환 개선은 `T08_MANAGER`.
- `/admin`, `/system`: 운영 메시지 정확도는 `T10_OBSERVABILITY`.

### 전환 실패 대비 문구 레이어
- 동일 메시지 계층을 3중으로 유지한다.
  - 즉시 동작 CTA(버튼)
  - 상태 복구 설명(2~3줄)
  - 다음 경로 제안(홈/재시도/도움)
- 운영 상태 경고는 색상만 바꾸지 말고, 라벨 + 조치 링크를 항상 같이 제공한다.

### 문서 동기화 룰
- 화면 문구/에러 패턴이 바뀌면 `TEAM_CONTEXT.md #screen_delivery`와 `PROJECT_STATUS_NEXT_ACTIONS.md` 병렬 항목을 업데이트.
- 구현/계획 상태가 바뀌면 `AGENT_WORKFLOW.md #9`(실행 플랜) 및 API 정합성 표와 동기화.
