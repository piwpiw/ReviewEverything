# TEAM_CONTEXT ? Programmable Source of Truth

> **[READ_RULE]** 부분 로딩을 위해 전체 문서를 로드하지 말고, `grep_search`와 `#해시태그`를 결합하여 사용하십시오.

---

## #metadata
<!--
{
  "sprint": "Team-Agent Automation & Advanced Skills",
  "system_status": "AMBER",
  "priority_teams": ["T01", "T03", "T04", "T08", "T10"],
  "frozen_scopes": [],
  "last_updated": "2026-03-01T09:30:00Z",
  "automation_level": "AUTONOMOUS"
}
-->

---

## #objectives (Global Sprint)
| 주요 목표 | 관련 팀 | 성과 지표 |
|---|---|---|
| **MCP/Skill 통합** | 전 팀 | 각 팀 최소 1개 전문 MCP/Skill 연동 완료 |
| **자동 협업 루프** | ORCHESTRATOR | 요청 시나리오별 자율 Hook 3개 이상 정상 작동 |

---

## #telemetry (Real-time Status)
| Endpoint / Subsystem | Status | Note (MCP Insights) |
|---|---|---|
| `/api/health` | ?? 200 OK | DB connection stable |
| `BackgroundJob Queue` | ?? Idle | Pending jobs: 0 |
| `Deployment (Vercel)`| ?? Active | Last deploy: Green (Smoke passed) |

---

## #collaboration (Dynamic State)
- **Stream Alpha [Data]**: `T01` ↔ `T02` ↔ `T03` ? *가동 중*
- **Stream Beta [User]**: `T08` ↔ `T07` ? *대기 중*
- **Stream Gamma [Ops]**: `T10` ↔ `T09` ? *상시 백그라운드 구동 중*

---

## #constraints (Active Rules & Guardrails)
- `[AUTH_LOCK]`: 현재 임시 헤더(`x-user-id`) 파트 수정 시 보안 검증 필수.
- `[DEPLOY_GATE]`: PR 분류별 필수 통과 조건
  - `scope=docs`: docs-only 정합성 점검.
  - `scope=fast`: `lint`, `typecheck`, `smoke`.
  - `scope=full`: `lint`, `typecheck`, `test`, `api:contract-audit`, `api:contract-sync-audit`, `smoke`.
- `[DATA_APPEND]`: 스냅샷 행 삭제 금지.

---

## #changelog
| 일시 | 팀 | 로직 |
|---|---|---|
| 2026-03-01 | ORCHESTRATOR | Hashtag indexing 및 `AGENT_PROTOCOLS`, `COST_RULES` 규격 동기화 완료 |

## #api_contract_audit
- 기준 문서 우선순위: `API.md` -> `ARCHITECTURE.md` -> `TEAM_CONTEXT.md` -> `AGENT_WORKFLOW.md` -> `PROJECT_STATUS.md`
- POST /api/jobs는 공개 API가 아닌 내부 worker 실행 트리거 후보.
- 구현된 API: GET /api/campaigns, GET /api/analytics, GET /api/cron, POST /api/admin/ingest, GET /api/admin/runs, GET /api/admin/quality, GET /api/admin/alerts, POST /api/admin/alerts/actions, GET /api/health, GET /api/me/revenue, GET /api/me/board, GET /api/me/pro, POST /api/me/pro
- 미구현(계획): GET /api/campaigns/:id, GET /api/campaigns/:id/related, /api/me/schedules*, /api/me/notifications*.
- 정기 점검: 항목 변경 시 API.md/ARCHITECTURE.md/TEAM_CONTEXT.md/AGENT_WORKFLOW.md/PROJECT_STATUS.md 동시 갱신.
- 운영 규정: 배포 전 `PROJECT_STATUS_NEXT_ACTIONS.md` `12.9 API 정합성 즉시 점검`이 최신 상태여야 한다.

## #screen_delivery
- 화면 단위 오너십: `/`, `/campaigns/[id]`, `/map`, `/me`, `/me/calendar`, `/me/notifications`, `/admin`, `/system`
- 표준 오너: T07(렌더·컴포넌트), T08(사용자 플로우), T06(랭킹·인사이트 문구), T10(운영 라벨), T09(회귀 gate).
- 병렬 승인 규칙:
  - 변경이 생긴 화면은 `PROJECT_STATUS.md`의 화면별 AC와 `PROJECT_STATUS_NEXT_ACTIONS.md` 액션 항목 1:1 매핑.
  - `ui-qa-summary.md` 미생성 또는 미통과 시 해당 화면은 `P1` 차단.
  - 계획 API 연계 화면은 `계획(미구현)` 배너로 명시하고 버튼 비활성 처리.
- 문구/토큰 거버넌스:
  - 에러·빈 상태·권한/복구 문구는 문서 공통표에서만 발행.
  - 변경된 카피는 `2026-03-01` 기준으로 월 1회 이상 회귀 리뷰.

## #policy
- 신규 문서는 기본적으로 생성하지 않고 기존 문서의 누락 항목을 보강/갱신한다.
- 문서 정합성 변경 시 해당 항목은 `API.md`, `ARCHITECTURE.md`, `TEAM_CONTEXT.md`, `AGENT_WORKFLOW.md`, `PROJECT_STATUS.md`, `PROJECT_STATUS_NEXT_ACTIONS.md` 일괄 반영 대상.
- 미구현 API는 라벨 `계획(미구현)`을 유지하고, 공개 노출 경로를 차단한다.
- 정합성 감사 기준에서는 구현 상태 키워드를 `implemented`/`planned`로 공통 표기한다.
- `implemented`/`planned` 값은 증거(라우트 존재성, 화면 AC, 동작 증빙)로 고정하고, 서로 충돌 시 즉시 정합성 이슈로 분류한다.
- 운영 지침 실행 시 `npm run api:contract-sync-audit`으로 12.9 체크리포트를 갱신하고, 실패 항목은 같은 PR에서 먼저 정정한다.

## #deploy_speed_profile (2026-03-01)
- 1단 분기: 문서/마크다운 변경(`apps/web/docs/**`, `*.md`)은 `docs-only`로 분류해 경량 게이트로 처리.
- 2단 분기: UI 핵심 경로 변경(`apps/web/app/**`, `apps/web/components/**`, `apps/web/lib/**`, `apps/web/public/**`, `apps/web/styles/**`)은 Fast Path로 분류해 `lint`, `typecheck`, `smoke`만 실행.
- 3단 분기: 기타 변경은 Full Path로 분류해 기존 전체 게이트(`lint`, `typecheck`, `test`, `api:contract-audit`, `smoke`) 실행.
- Vercel 배포 경로는 docs-only 변경 시 무시(불필요 빌드/배포 차단)로 운영 리소스를 절약.
- 동시 실행 제어: 동일 브랜치에서 새 CI 실행이 들어오면 이전 실행은 즉시 취소.
- 적용 대상: PR/푸시 모두 동일.
- 문서 운영 규칙: `scope=docs/fast/full` 분류 근거와 결과를 24시간마다 스냅샷으로 팀 간 공유.

## #ux_policy
- 자동 정합성 게이트: `npm run api:contract-audit` + `npm run api:contract-sync-audit` (보고서: `reports/api-contract-audit.md`, `reports/api-contract-sync-audit.md`).
- UI/UX 실행 우선순위: `T07_FRONTEND` 중심 + `T08_MANAGER` + `T06_ANALYTICS` + `T10_OBSERVABILITY` + `T09_VALIDATION`.
- 핵심 KPI 추적: 탐색 전환율, 상세 이동 전환율, 일정 등록 완료율, 알림 설정 완료율.

## #ux_focus (2026-03-01)
- Product north star: 첫 화면 체류시간 + 상세 이동 전환율 + 일정/정산 전환 완주율 모두 60일 내 +30%
- 병렬 UX 스트림: T07(퍼널·컴포넌트), T08(개인화 플로우), T06(분석·랭킹 UX), T10(관측·건강도메인), T09(접근성·성능 리그레션)

## #beta2_release_gate (2026-03-01)
- 목적: BETA 2.0 출시 직전, 사용자 확인 가능한 실동작 기준으로 팀별 작업 완료를 강제.
- 완료 정의(DoD): 기능 존재가 아니라 `화면 액션 -> API 응답 -> 상태 반영`까지 확인되어야 완료.
- 팀 운영:
  - Data lane: T01/T02/T03/T04
  - Product lane: T07/T08/T06
  - Ops lane: T05/T09/T10
- 승인 기준: `PROJECT_STATUS_NEXT_ACTIONS.md`의 "11) BETA 2.0 출시 직전 팀별 실행 체크리스트" 항목 전체 체크.

## #beta2_command_center (2026-03-01)
- 운영 목적: 출시 직전 병렬 투입 중 충돌/지연을 1시간 내 감지하고 복구 우선순위를 강제한다.
- 지휘 라인:
  - 제품 동작 승인: T07 + T08
  - 데이터 정합 승인: T02 + T03
  - 배포/회귀 승인: T09
  - 운영 안정 승인: T10
- 에스컬레이션 규칙:
  - P0 기능 장애는 즉시 `No-Go` 전환, 수정 후 재승인.
  - P1 품질 이슈는 임시 우회 경로가 있으면 `Go with Guardrail`로 처리.
  - 동일 장애 2회 재발 시 원인 팀 외에 T10이 재발 방지 액션 소유.
- 상태 보고 SLA:
  - Data lane: 2시간 주기 업데이트.
  - Product lane: 2시간 주기 업데이트.
  - Ops lane: 1시간 주기 업데이트.
- 문서 동기화:
  - 상태 변경 발생 시 `PROJECT_STATUS_NEXT_ACTIONS.md` 11/12 섹션과 동시 갱신.


