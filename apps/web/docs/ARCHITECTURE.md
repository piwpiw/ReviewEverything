# System Architecture

> **Source of Truth**: 이 문서는 `apps/web`의 아키텍처 결정 사항을 정의합니다.  
> 아키텍처 변경 시 동일 PR에서 이 문서를 반드시 갱신하세요.

---

## 1. Two-Layer Team-Agent Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     CONTEXT ENGINEERING LAYER                            │
│  TEAM_CONTEXT.md   ←  단일 진실: 스프린트 목표·시스템 상태·제약·우선순위 │
│  CONTEXT_ENGINE.md ←  갱신 프로토콜, Stale 게이트, inject 패턴          │
└─────────────────────────────┬────────────────────────────────────────────┘
                              │ context injection (모든 팀이 읽음)
┌─────────────────────────────▼────────────────────────────────────────────┐
│                     AGENT ENGINEERING LAYER                              │
│                                                                          │
│  AGENT_WORKFLOW.md  ←  ORCHESTRATOR (10팀 실행 조율·handoff·에스컬레이션)│
│                                                                          │
│  TIER 1 | DATA PLANE                                                     │
│    T01_SCRAPER     → T02_NORMALIZER     → T03_DATABASE                   │
│                                                                          │
│  TIER 2 | LOGIC PLANE                                                    │
│    T04_WORKER      T05_NOTIFIER         T06_ANALYTICS                    │
│                                                                          │
│  TIER 3 | PRODUCT PLANE                                                  │
│    T07_FRONTEND    T08_MANAGER                                           │
│                                                                          │
│  TIER 4 | OPERATIONS PLANE (상시 병렬)                                   │
│    T09_VALIDATION  T10_OBSERVABILITY                                     │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Runtime Topology

- **`Next.js App Router`** — UI 페이지 및 API 라우트 서빙
- **`Prisma + PostgreSQL (Supabase)`** — 기본 데이터스토어
- **`sources/adapters/`** — 외부 캠페인 페이지 정규화 어댑터 레이어
- **`lib/ingest.ts`** — 플랫폼 잡 실행 및 캠페인 스냅샷 영속화 오케스트레이터
- **`lib/backgroundWorker.ts`** — BackgroundJob 테이블 기반 내구성 배치 실행기
- **`lib/notificationSender.ts`** — NotificationDelivery 테이블 기반 알림 발송기

---

## 3. Data Flow

### Ingestion Pipeline (T01 → T02 → T03)
1. **트리거**: `/api/cron` (스케줄) 또는 `/api/admin/ingest` (수동)
2. **T01_SCRAPER**: 플랫폼별 어댑터 격리 실행, fetchWithRetry, fallback 페이로드
3. **T02_NORMALIZER**: 내부 캠페인 스키마 변환, 파싱 신뢰도 검증, 중복 제거
4. **T03_DATABASE**: 캠페인 upsert + 스냅샷 append

### Background Job Pipeline (T03 → T04 → T05)
1. Cron/Admin이 `BackgroundJob` 행 생성
2. `GET /api/cron?runNow=true (runNow=true, limit=6)`로 배치 실행 (limit=6)
3. `REMINDER_SCAN` 잡 → `NotificationDelivery` 행 생성 → T05_NOTIFIER 발송

### Read Pipeline (T03/T06 → T07/T08)
- `/api/campaigns` — 리스트/검색/필터 응답
- `/api/analytics` — Hot/Trending 트렌드 뷰
- `/api/me/*` — 사용자 일정·매출 데이터

---

## 4. Team Document Index

| 팀 | 문서 경로 | 주요 담당 |
|---|---|---|
| ORCHESTRATOR | `docs/AGENT_WORKFLOW.md` | 10팀 실행 조율 |
| T01_SCRAPER | `docs/teams/T01_SCRAPER.md` | 7플랫폼 수집·어댑터 |
| T02_NORMALIZER | `docs/teams/T02_NORMALIZER.md` | 파싱·정규화·중복제거 |
| T03_DATABASE | `docs/teams/T03_DATABASE.md` | DB 읽기/쓰기·쿼리 |
| T04_WORKER | `docs/teams/T04_WORKER.md` | 내구성 잡·재시도 |
| T05_NOTIFIER | `docs/teams/T05_NOTIFIER.md` | 알림 전달·D-1/D-3 |
| T06_ANALYTICS | `docs/teams/T06_ANALYTICS.md` | 트렌드·캐싱 |
| T07_FRONTEND | `docs/teams/T07_FRONTEND.md` | UI 컴포넌트·PWA |
| T08_MANAGER | `docs/teams/T08_MANAGER.md` | 사용자·일정·매출 |
| T09_VALIDATION | `docs/teams/T09_VALIDATION.md` | CI·게이팅·배포 |
| T10_OBSERVABILITY | `docs/teams/T10_OBSERVABILITY.md` | 모니터링·리포팅 |

---

## 5. System-wide Invariants

**Reliability**
- 하나의 플랫폼 실패가 전체 수집을 차단하지 않음 (플랫폼 격리 필수)
- API 응답은 안정적인 shape 유지 (`data`, `meta`, `error` 계약)
- DB 읽기 경로 불가 시에만 mock/fallback 허용

**Performance**
- 읽기 집약 엔드포인트는 캐시 인식 (`s-maxage`, `stale-while-revalidate`)
- 리스트 API에서 N+1 읽기 금지; bounded field include/select 사용
- 스냅샷 쓰기는 append 전용 (트렌드 계산 지원)

**Security**
- 시크릿은 클라이언트 번들에 포함 금지
- 서버 전용 env 변수는 서버 라우트/lib에서만 읽음
- CI 게이트(`lint`, `typecheck`, `test`, `smoke`) 통과가 머지 조건

---

## 6. Change Control

아키텍처 변경 시 동일 PR에서 갱신:
- 변경된 컴포넌트/라우트
- 신규 불변 조건
- 마이그레이션 영향
- 해당 팀 문서(`docs/teams/T*.md`) 동시 갱신
- 코어 문서 동기 순서: `API.md` -> `ARCHITECTURE.md` -> `TEAM_CONTEXT.md` -> `AGENT_WORKFLOW.md` -> `PROJECT_STATUS.md`


## 7) API 정합성 표기 규칙

- 구현된 API(라우트 존재)
  - `GET /api/campaigns`
  - `GET /api/analytics`
  - `GET /api/cron` (`runNow`, `limit`)
  - `GET /api/campaigns/:id`, `GET /api/campaigns/:id/related`
  - `POST /api/admin/ingest`
  - `GET /api/admin/runs`
  - `GET /api/admin/quality`
  - `GET /api/admin/alerts`
  - `POST /api/admin/alerts/actions`
  - `GET /api/health`
  - `GET /api/me/revenue`
  - `GET /api/me/board`
  - `GET /api/me/pro`, `POST /api/me/pro`
- `GET /api/me/schedules`
- `GET /api/me/notifications`, `POST /api/me/notifications`, `PATCH /api/me/notifications`, `DELETE /api/me/notifications/:id`
- `GET /api/me/notification-channels`
- `GET /api/me/notification-preferences`, `PUT /api/me/notification-preferences`
- `GET /api/me/curation`
- `POST /api/jobs` (내부 실행 엔드포인트)

- 계획/API 미구현

- 운영 규칙
  - 구현 상태가 바뀌면 `API.md`, `TEAM` 문서, `PROJECT_STATUS.md`를 동시 갱신
  - `계획` 항목은 UI/알림 문구에서 "오퍼레이션 대상 아님" 라벨 처리
