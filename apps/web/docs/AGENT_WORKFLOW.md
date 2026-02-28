# AGENT_WORKFLOW — Advanced Orchestrator & Project Automation

> **ORCHESTRATOR**는 단순 의존성 루프를 넘어, 사용자 요청(Request)의 의도를 파악하여 동적으로 팀을 라우팅하고, MCP와 Skill을 결합해 자율 협업 파이프라인(Project Automation)을 구동합니다.

---

## 1. Dynamic Request Routing (요청 기반 동적 활성화)

사용자의 프롬프트나 시스템 이벤트에 따라 필요한 팀 조합을 동적으로 구성하여 최단 경로로 실행합니다.

| Request / Event Type | Active Routing Path |
|---|---|
| **"신규 리뷰 사이트 연동해줘"** | T01_SCRAPER (어댑터 생성) → T02_NORMALIZER (파싱 스펙) → T09_VALIDATION |
| **"데이터 수집이 안 되는 것 같아"** | T10_OBSERVABILITY (로그 분석) → T01_SCRAPER (우회 전략 적용) |
| **"사용자 매니저 화면 UI 개선"** | T07_FRONTEND (UI/UX) → T08_MANAGER (API 연동) → T09_VALIDATION |
| **"캠페인 리스트 조회 성능 저하"** | T10_OBSERVABILITY (병목 감지) → T03_DATABASE (쿼리 튜닝) → T06_ANALYTICS |
| **"주기적인 스케줄/알림 점검"** | T04_WORKER (잡 실행) → T05_NOTIFIER (알림 전달) → T10_OBSERVABILITY |

---

## 2. Advanced Collaboration Hooks (팀별 협업 자동화)

팀 간의 Handoff는 대기가 아닌 **이벤트 기반 Hook**으로 즉각 전환됩니다. 각 팀은 특정 작업 완료 시 하위 팀을 자동으로 트리거하는 메시지를 발생시킵니다.

- **`[HOOK: DATA_READY]`**: T01 수집 완료 시 즉시 발송. T02가 원시 데이터를 넘겨받아 정규화 로직 자동 시작.
- **`[HOOK: SCHEMA_CHANGED]`**: T03 마이그레이션 발생 시 발송. T07/T08/T09가 변경된 스키마에 맞춰 타입 점검(Typecheck) 자동 트리거.
- **`[HOOK: QUALITY_WARN]`**: T02 파싱 신뢰도 저하 감지 시 발송. T10이 로그를 남기고 T01에 어댑터 룰셋 재검토 지시.
- **`[HOOK: DEPLOY_GREEN]`**: T09 스모크 테스트 통과 및 배포 완료 시 발송. T10이 릴리즈 노트를 생성하고 Notion 인덱스를 동기화.

---

## 3. Tool Calling Hierarchy

에이전트 팀은 문제를 해결하기 위해 다음 수준의 도구를 계층적으로 호출합니다.

1. **Core Agent Logic**: 팀별 `.md`에 정의된 역할(Roles)과 프로토콜(Protocols).
2. **Specialized Skills**: `scripts/` 내의 재사용 가능한 자동화 스크립트 (예: `SeedDataSkill`, `AutoRefactorSkill`).
3. **MCP (Model Context Protocol)**:
   - 팀 특화 권한 부여 (T03은 Postgres MCP, T09는 Snyk MCP 등).
   - 에이전트가 외부 시스템에 안전하고 표준화된 방식으로 접근하여 데이터 검색 및 액션 수행.

---

## 4. Standard Execution Order (Fallback)

명시적인 라우팅 규칙이 없을 경우, 안전을 위해 기본 4-Tier 순차 실행 프로토콜을 따릅니다.

1. **Tier 4 (Ops Plane)**: T09, T10 활성화 (모니터링 및 검증 준비).
2. **Tier 1 (Data Plane)**: T01 → T02 → T03 순차 실행.
3. **Tier 2 (Logic Plane)**: T04, T06 병렬 실행 → T04 완료 후 T05 실행.
4. **Tier 3 (Product Plane)**: T07, T08 병렬 실행.
5. **Final Validation**: T09의 모든 검증(Code, Test, Smoke) 통과 시 CI 리포트 발행.

---

## 5. Escalation & Self-Healing Protocol

문제가 발생했을 때 인간 엔지니어에게 의존하기 전 자율적으로 복구를 시도합니다.

1. **감지**: T10이 ELK/Log MCP를 통해 에러 스파이크를 감지.
2. **할당**: 에러 스택트레이스를 분석하여 책임 팀(예: T04)에 복구 티켓(Issue) 자동 발행.
3. **치유 시도**: 책임 팀이 관련 Skill을 활용하여 코드 및 데이터를 수정.
4. **검증**: 수정한 내용을 T09가 컴파일, 테스트, 정적 분석으로 검증.
5. **확정 또는 에스컬레이션**: T09 통과 시 자동 머지, 실패 시 인간 리뷰어(USER)에게 `[BLOCKED]` 신호 발송.
