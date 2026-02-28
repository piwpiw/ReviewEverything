# TEAM_CONTEXT — Programmable Source of Truth

> **[READ_RULE]** 부분 로딩을 위해 전체 문서를 로드하지 말고, `grep_search`와 `#해시태그`를 결합하여 사용하십시오.

---

## #metadata
<!--
{
  "sprint": "Team-Agent Automation & Advanced Skills",
  "system_status": "GREEN",
  "priority_teams": ["T01", "T03", "T09", "T10"],
  "frozen_scopes": [],
  "last_updated": "2026-03-01T01:45:00Z",
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
| `/api/health` | 🟢 200 OK | DB connection stable |
| `BackgroundJob Queue` | 🟢 Idle | Pending jobs: 0 |
| `Deployment (Vercel)`| 🟢 Active | Last deploy: Green (Smoke passed) |

---

## #collaboration (Dynamic State)
- **Stream Alpha [Data]**: `T01` ↔ `T02` ↔ `T03` — *가동 중*
- **Stream Beta [User]**: `T08` ↔ `T07` — *대기 중*
- **Stream Gamma [Ops]**: `T10` ↔ `T09` — *상시 백그라운드 구동 중*

---

## #constraints (Active Rules & Guardrails)
- `[AUTH_LOCK]`: 현재 임시 헤더(`x-user-id`) 파트 수정 시 보안 검증 필수.
- `[DEPLOY_GATE]`: 모든 PR은 T09 린트/타입체크/스모크 4종 의무 통과.
- `[DATA_APPEND]`: 스냅샷 행 삭제 금지.

---

## #changelog
| 일시 | 팀 | 로직 |
|---|---|---|
| 2026-03-01 | ORCHESTRATOR | Hashtag indexing 및 `AGENT_PROTOCOLS`, `COST_RULES` 규격 동기화 완료 |
