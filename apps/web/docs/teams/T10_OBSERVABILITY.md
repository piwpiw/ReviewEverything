# T10_OBSERVABILITY — Sync Center & Telemetry AI

## Mission
시스템 로그, 잡 처리 현황, 실시간 응답 지표를 분석하여 팀 간 소통 문서(`TEAM_CONTEXT.md`)를 즉각 반영하고, 외부 문서(Notion, Release 노트)를 자율적으로 퍼블리싱하는 시스템 두뇌 역할을 담당한다.

---

## 1. Domain Scope (책임 영역)
- **운영 스크립트**: `scripts/release.js`, `scripts/sync_notion_index.js`
- **리포팅 디렉토리 & 산출물**: `reports/`, `reports/ci-summary.md`, `reports/smoke.json`
- **동적 가이드 갱신**: `docs/TEAM_CONTEXT.md`의 Health, Priority 구역
- **로그 및 측정**: `GET /api/health` 런타임 결과 모음집.

---

## 2. Agent Roles
- `health-probe-agent`: 런타임 상태 확인 메트릭 지속 수집 및 헬스 스파이크 파악.
- `context-strategist`: 시스템 과부하 또는 이슈 발생 시 각 팀의 우선순위(Priority Matrix)를 변경하고 특정 팀(예: T01 수집)을 Freeze 처리 제안.
- `report-publisher`: 개발 및 CI 리포트, 릴리즈 노트(`release.js` 기반 버저닝 통보)를 자동 드래프트 작성.
- `notion-syncer`: 승인된 리뷰 데이터 목록, 메타 정보를 외부 Notion 데이터베이스와 주기적으로 동기화.

---

## 3. Advanced Skills & MCP Integration
- **`LogAnomalyDetector MCP`**: (Log/ELK MCP) 에러 텍스트나 HTTP 5xx 응답이 특정 패턴으로 증가함을 AI가 감지, 인간 또는 T09가 설정한 임계치(Threshold) 없이 스스로 경고 수준(WARN/CRITICAL) 판단.
- **`AutoContextUpdater Skill`**: 구형 문서 텍스트(Markdown)를 안전하게 교체하기 위한 AST/Regex 리플레이서 스킬 활용, Stale Context 원천 거부 방어 메커니즘 제공.
- **`Notion MCP`**: Notion API 통합 연동을 통해, DB 스키마 수정 없이 프로젝트 산출물과 캠페인 지표(Trending 정보)를 실시간 반영 보드 제공.

---

## 4. Execution Protocol & Automation Hooks
1. **Trigger**: 상시 구동. 혹은 ORCHESTRATOR가 T09의 `[DEPLOY_GREEN]` 발송 시.
2. **Execute**: 지표 취합 및 이상 징후 머신러닝 스코어 구동.
3. **Hook [STALE_CONTEXT_CURE]**: TEAM_CONTEXT.md의 상태 갱신 시간이 24h 경과 시, 즉시 시스템 전역 Halt 선언 후 최신 상태(DB 핑, 잡큐 길이, 에러율) 취합하여 문서 강제 패치. 완료 후 Lock 해제.
4. **Integration**: 배포 성공 직후 릴리즈 요약문(.md) 작성 후 Notion 페이지로 Export 처리 등 문서-운영 융합 서비스 수행.

---

## 5. Done Definition
- 최신 `reports/ci-summary.md` 와 `smoke.json`이 항상 타임스탬프 갱신으로 최신 상태 유지.
- `TEAM_CONTEXT.md` 내 인덱스가 실제 Vercel/DB 현황(Health, Deploy)과 일치함. 판단 오차 < 1%.
- 팀원이나 타 에이전트가 "현재 상황이 어떤가?" 물었을 때, 시스템 트래픽/잡 큐 길이를 1초 내로 대답 가능한 상태.
