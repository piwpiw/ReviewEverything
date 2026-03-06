# ReviewEverything Agent Policy — Gemini Edition

> **[BOOT PROTOCOL]** 이 파일이 자동 로드되면 즉시 아래 §7을 실행하여 현재 프로젝트 상태를 파악하십시오. 사용자 재설명 없이 작업을 이어갑니다.

Scope: `d:\BohemianStudio\ReviewEverything`
Last Updated: 2026-03-05

---

## 1) 토큰 효율 정책

- 파일 탐색은 전체 로드 대신 outline/부분 읽기 우선.
- 500줄 초과 파일은 반드시 섹션 지정 후 읽기. 목적 없는 전체 로드는 SLA 위반.
- `TEAM_CONTEXT.md` 등 컨텍스트 문서는 `#해시태그` 인덱스로 필요 섹션만 추출.
- 수정 시 파일 전체 덮어쓰기 금지 — 타겟 라인만 정밀 교체 (Atomic Targeting).
- 결정 사항은 콤팩트 불릿으로 요약. 문서 간 중복 서술 금지.

## 2) 네이밍 표준

- 소스 모듈: `feature-<domain>.ts` / API 핸들러: `route.ts` / 어댑터: `adapters/<platform>-adapter.ts`
- 함수: 동사 우선 (`fetchCampaigns`, `normalizeRewardValue`, `runWorkerLoop`)
- 워커/잡: `worker-<purpose>.ts`, `job-<purpose>.ts`, `crontask-<purpose>.ts`
- 유틸: `*.util.ts` / 서비스: `*.service.ts` / DB I/O: `*.repo.ts`

## 3) 반복 자동화 (PR/빌드 루프)

- PR 사전 검증: `npm run agent:review` (lint + typecheck + test)
- 배포 품질 게이트: `npm run agent:qa` (lint + typecheck + test + smoke + build)
- 사용자 수정 요청 후 배포 전: `npm run verify:local` 선실행 필수
- 산출물: `apps/web/reports/agent-<mode>-summary.md`

## 4) PR 효율 (크로스 에이전트)

모든 코드 변경은 아래 4개 도메인 중 1개로 분류:
- `DISCOVERY`: 캠페인 필터/탐색/정규화
- `CRM`: 일정/정산/매니저 경로
- `WORKER`: 큐/크론/알림
- `INFRA`: CI/배포/스크립트/관측

PR 필수 포함: 변경 파일(최대 8개), 영향 API 경로, 위험 포인트, 롤백 계획.

## 5) 가드레일

- `lane-safe` 원칙: 대체 가능한 소규모 확장이 있으면 전면 교체 금지.
- 스키마 마이그레이션: 하위 호환성 유지, 마이그레이션 노트 없는 breaking change 금지.
- Task 실패 시 (`DB`, `Vercel`, 외부 MCP): 첫 번째 유의미한 실패에서 멈추고 정확한 원인 보고.

## 6) 배포 전 필수 체크포인트

- `npm run predeploy:local` 실행 후 결과 기록.
- 파서 오류(JSX 미닫힘, 문자열 깨짐) 발견 시 즉시 중단 — 문법 오류만 먼저 수정.
- `npm run build` 실패 시 첫 번째 에러 파일/라인을 보존하고 0이 될 때까지 진행 금지.

---

## 7) 프로젝트 부팅 (세션 시작 시 필수 실행)

새 세션 시작 시 아래 순서로 읽어 프로젝트 상태를 **30초 내에 파악**하십시오:

```
Step 1 (10초): SESSION_HANDOFF.md #session_handoff
  → 이전 에이전트가 뭘 했고, 다음에 뭘 해야 하는지

Step 2 (10초): TEAM_CONTEXT.md #metadata
  → system_status, priority_teams, frozen_scopes 확인

Step 3 (필요 시): AGENT_WORKFLOW.md §1 Dynamic Request Routing
  → 요청 유형별 팀 라우팅 확인

Step 4 (필요 시): PROJECT_STATUS_NEXT_ACTIONS.md §12.1
  → BETA 2.0 P0 임계 경로 현황
```

**빠른 참조 경로**:
- 현재 마일스톤: `PROJECT_STATUS.md §9`
- BETA 2.0 체크리스트: `PROJECT_STATUS_NEXT_ACTIONS.md §11`
- 실행 트랙 (§13~15): `PROJECT_STATUS_NEXT_ACTIONS.md`
- 작업풀: `AUTONOMOUS_WORK_POOL.md`
- 팀별 역할: `docs/teams/T01~T10.md`

---

## 8) Multi-Agent 세션 프로토콜

이 프로젝트는 **Claude, Gemini, Codex가 교대로 작업**합니다.

### 세션 시작 시
```
1. SESSION_HANDOFF.md #session_handoff 읽기 (§7 Step 1)
2. pending_work.immediate → 즉시 착수할 작업 확인
3. cost_hint → 이 세션에 Gemini가 적합한 작업인지 판단
```

### 세션 완료 시 (AGENT_WORKFLOW.md §11 Post-Task에 병합)
```
1. SESSION_HANDOFF.md #session_handoff JSON 갱신
   - last_agent: "GEMINI"
   - timestamp: 현재 시각
   - last_session.summary: 이번 세션 요약 (2줄 이내)
   - last_session.files_modified: 수정한 파일 목록
   - pending_work: 다음 AI가 이어서 할 구체적 작업

2. #session_log 테이블에 1행 append (10건 초과 시 가장 오래된 행 삭제)

3. 이후 기존 Post-Task Closing 루틴 수행 (API.md, TEAM_CONTEXT.md 등 동기화)
```

---

## 9) Gemini 특화 최적화

### 장점 활용 영역
- **대규모 코드 리뷰**: 100만 토큰 컨텍스트 → 수백 파일 동시 분석 적합
- **문서 교차 정합성 감사**: 여러 `.md` 파일을 한 번에 비교 (§12.9 API 점검)
- **워크풀 분류/우선순위 정렬**: `AUTONOMOUS_WORK_POOL.md` 대량 항목 분석
- **멀티모달 분석**: UI 스크린샷 + 코드 동시 분석 (§11.2 고도화)

### Gemini Flash 우선 사용 경우
- 반복적인 문서 갱신, 패턴 기반 작업, 빠른 응답이 필요한 경우
- 토큰당 비용: Flash > Pro 순으로 효율적

### 도구 매핑 (COST_RULES 준수)
- 파일 읽기: 부분 읽기 우선 (전체 파일 로드 지양)
- 파일 수정: 비연속 다중 수정 시 멀티 청크 교체 도구 사용
- 검색: 해시태그 인덱싱 우선, 필요 시 키워드 검색
