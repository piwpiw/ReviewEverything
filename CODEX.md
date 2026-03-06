# ReviewEverything Agent Policy — Codex / ChatGPT Agent Edition

> **[BOOT PROTOCOL]** 이 파일이 자동 로드되면 즉시 §7을 실행하여 현재 프로젝트 상태를 파악하십시오. 사용자 재설명 없이 작업을 이어갑니다.

Scope: `d:\BohemianStudio\ReviewEverything` (Next.js / TypeScript / Prisma / Vercel)
Last Updated: 2026-03-05

---

## 1) 토큰 효율 정책

- 목적 없는 파일 전체 로드 금지. 필요한 섹션/함수만 읽기.
- 수정 시 파일 전체 재작성 대신 타겟 라인만 교체.
- 결정 사항은 콤팩트 불릿으로 기록. 서술형 중복 금지.
- `TEAM_CONTEXT.md`는 `#해시태그` 방식으로 필요 섹션만 부분 로드.

## 2) 네이밍 표준

- 어댑터: `adapters/<platform>-adapter.ts`
- 워커/잡: `worker-<purpose>.ts`, `job-<purpose>.ts`
- 유틸: `*.util.ts` / 서비스: `*.service.ts` / DB I/O: `*.repo.ts`
- 함수: 동사 우선 (`fetchCampaigns`, `normalizeRewardValue`)

## 3) 빌드/검증 루프

- PR 사전 검증: `npm run agent:review`
- 배포 품질: `npm run agent:qa`
- 배포 전 로컬 검증: `npm run verify:local` (항상 먼저)
- 산출물: `apps/web/reports/agent-<mode>-summary.md`

## 4) PR 분류 (도메인 태그 필수)

- `DISCOVERY` / `CRM` / `WORKER` / `INFRA` 중 1개 태그
- PR: 변경 파일 최대 8개, 영향 API, 위험 포인트, 롤백 계획 포함.

## 5) 가드레일

- 전면 교체 대신 최소 확장 원칙 (`lane-safe`).
- 스키마 변경: 하위 호환성 필수, 마이그레이션 노트 동반.
- 환경 의존 오류 (`DB`, `Vercel`, 네트워크) 발생 시 즉시 멈추고 원인 보고.

## 6) 배포 전 체크포인트

- `npm run predeploy:local` 필수. JSX/문자열 파서 오류 발견 시 즉시 중단.
- `npm run build` 성공 확인 후에만 push 진행.

---

## 7) 프로젝트 부팅 (세션 시작 시 필수)

새 세션 시작 시 아래 순서로 **30초 내에 현재 상태 파악**:

```
Step 1 (필수): SESSION_HANDOFF.md #session_handoff
  → 이전 에이전트 작업 내용, 다음 할 일, 빌드 상태 확인

Step 2 (필수): TEAM_CONTEXT.md #metadata
  → system_status, priority_teams, frozen_scopes 확인

Step 3 (요청 시): AGENT_WORKFLOW.md §1
  → 요청 유형별 팀 라우팅

Step 4 (요청 시): PROJECT_STATUS_NEXT_ACTIONS.md §12.1
  → BETA 2.0 P0 임계 경로 현황
```

**빠른 참조**:
- 현재 마일스톤: `PROJECT_STATUS.md §9`
- 실행 트랙 (§13~15): `PROJECT_STATUS_NEXT_ACTIONS.md`
- 작업풀: `AUTONOMOUS_WORK_POOL.md`
- 팀별 전문 역할: `docs/teams/T01~T10.md`

---

## 8) Multi-Agent 세션 프로토콜

이 프로젝트는 **Claude, Gemini, Codex가 교대로 작업**합니다.

### 세션 시작 시
```
1. SESSION_HANDOFF.md #session_handoff 읽기
2. pending_work → 착수 작업 확인
3. cost_hint → 이 세션에 Codex가 적합한 작업인지 확인
4. work_context.beta2_p0_status → P0 경로 현황 파악
```

### 세션 완료 시 (AGENT_WORKFLOW.md §11 Post-Task에 병합)
```
1. SESSION_HANDOFF.md #session_handoff JSON 갱신
   - last_agent: "CODEX"
   - timestamp: 현재 시각 (ISO 8601)
   - last_session.summary: 이번 작업 요약 (2줄 이내)
   - last_session.files_modified: 수정한 파일 목록
   - pending_work.immediate: 다음 AI가 이어서 할 구체적 작업

2. #session_log 테이블에 1행 추가 (10건 초과 시 가장 오래된 행 삭제)

3. 이후 기존 Post-Task Closing 루틴 수행
```

---

## 9) Codex 특화 최적화

### 장점 활용 영역
- **어댑터 반복 구현**: TOP20 플랫폼 어댑터 패턴 코드 빠른 생성 (§14.8)
- **테스트 코드 자동화**: Vitest fixture, 회귀 테스트, E2E 시나리오 (§D)
- **유틸리티/헬퍼 함수**: 반복 패턴, 타입 정의, 공통 유틸 정비
- **리팩토링**: 명확한 입출력 패턴의 함수 분리 및 최적화

### 샌드박스 환경 유의사항
- 네트워크 제한 가능 → 외부 API 직접 호출 전 환경 확인
- 로컬 빌드 검증 우선: `npm run agent:review` → `npm run verify:local`
- DB 연결 필요 작업은 환경 변수(`DATABASE_URL`) 확인 후 진행

### 작업 우선순위 기준
- `AUTONOMOUS_WORK_POOL.md` 작업번호 순서 준수
- P0 임계 경로 작업은 다른 작업보다 항상 우선
- `TEAM_CONTEXT.md #metadata`의 `priority_teams` 기준으로 팀 우선순위 결정
