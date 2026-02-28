# CONTEXT_ENGINE — Context Engineering Protocol

> 에이전트들의 컨텍스트 파싱 효율을 극대화하고, 시스템 지표에 의한 동적 컨텍스트 갱신(Self-updating Context)을 구현합니다.

---

## 1. Context Injection Efficiency & Caching (COST_RULES)

각 팀 에이전트는 무거운 마크다운 전체 파싱을 **엄격히 금지**합니다 (`COST_RULES.md` 참조).
대신, `TEAM_CONTEXT.md`을 읽을 때 반드시 **Hashtag(#) + `grep_search`** 를 활용해 필요한 데이터 블록만 부분 추출하십시오.

- **방법**: `grep_search "#metadata" docs/TEAM_CONTEXT.md` 와 같이 스캔.
- **가검증(Metadata Check)**: `system_status`가 "RED"이거나 자신이 `frozen_scopes`에 포함될 경우, 인간 승인 전까지 작업을 차단(Stale / Halt Gate)합니다.
- 토큰이 초과하는 전체 로드를 시도할 경우, 오케스트레이터가 즉각 SLA 위반을 선언합니다.

```json
// TEAM_CONTEXT.md 상단 예시
{
  "sprint": "Architecture Upgrade",
  "system_status": "GREEN",
  "priority_teams": ["T01", "T09"],
  "frozen_scopes": ["middleware.ts"]
}
```

- **조건 판단**: `system_status`가 "RED"이거나 자신이 `frozen_scopes`에 포함될 경우, 인간의 승인 없이 작업을 즉시 중단합니다 (Stale / Halt Gate).
- 통과 시에만 본문(Markdown)의 상세 Context Inputs를 숙지합니다.

---

## 2. Dynamic Priority Auto-Tuning

T10_OBSERVABILITY가 시스템 메트릭을 기반으로 `TEAM_CONTEXT.md`의 팀 우선순위를 자율적으로 조정합니다.

- **에러/장애 감지 시**: T09, T10 우선순위를 `P0`으로 상향하고, 연관 장애 팀(예: DB 타임아웃 시 T03)을 활성화.
- **주기적 크론 작업 중**: T04, T05의 우선순위를 `P1`으로 상향.
- **사용자 요청 도달 시**: `AGENT_WORKFLOW`의 라우팅 룰에 따라 해당 팀들을 즉시 `P0`으로 임시 상향.

---

## 3. Update Ownership & Triggers

TEAM_CONTEXT.md의 갱신은 다음의 트리거와 소유권에 의해 엄격하게 통제됩니다.

| Section | Owner | Update Trigger | Tool/Skill Used |
|---|---|---|---|
| **Metadata** | `ORCHESTRATOR` | 요청 분석, 프롬프트 입력 시 | `Context-Generator Skill` |
| **Health Signals** | `T10_OBSERVABILITY` | 배포, 잡 실패, 주기적 프로브 시 | `Log / Health MCP` |
| **Constraints** | `T09_VALIDATION` | 장애 롤백, 보안 취약점 발견 시 | `Security-Audit Skill` |
| **Changelog** | 갱신한 모든 팀 | 섹션 갱신 완료 직후 | Git/File MCP |

---

## 4. Conflict Resolution Strategy

멀티 에이전트 동시 다발적 갱신으로 인한 컨텍스트 충돌 발생 시:
1. `T09_VALIDATION`이 충돌을 최우선적으로 감지.
2. 시스템 안정성(Security & Health)을 주장하는 팀의 컨텍스트를 우선 채택(`P0` 반영 전략).
3. 버려진 컨텍스트를 주장한 팀(예: 신규 기능 개발 팀)에게 `[CONFLICT_RESOLVED_AGAINST]` 메시지를 보내어 작업을 보류하도록 지시.
