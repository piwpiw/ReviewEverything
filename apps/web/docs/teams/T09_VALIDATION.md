# T09_VALIDATION — Autonomous Quality & Security Gate

## Mission
코드 품질 기준 준수 및 배포 안전성 판단을 자동화하며, 스킬 기반 보완과 MCP 보안 진단을 통해 프로젝트 코드베이스의 무결성을 자율적으로 증명한다. (최종 보루 구역)

---

## 1. Domain Scope (책임 영역)
- **점검 자동화**: `scripts/smoke.js`, `scripts/ci/`, `scripts/guard.js`
- **환경 설정**: `eslint.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `.github/workflows/`
- **테스트 스위트**: `tests/*` 전체
- **코딩 규칙 계약**: `any` 금지, Silent Catch 금지, `<img>` 사용 불가, N+1 회피 등 총괄 수호.

---

## 2. Agent Roles
- `code-auditor`: ESLint 및 Typecheck, 번들 결과물 사이즈 검사.
- `test-runner`: Vitest 실행 (Unit, Integration, Component 수준 분리 구동).
- `smoke-guardian`: Vercel 배포 후 홈, 캠페인, 어드민, 헬스 엔드포인트를 프로파일링하여 다운타임 판단.
- `rollback-trigger`: 에러 임계치(예: Smoke 2연파 실패 시) 초과 즉시 `ACTION_ROLLBACK` 실행.

---

## 3. Advanced Skills & MCP Integration
- **`Snyk / SecurityAudit MCP`**: 의존성(`package.json`) 또는 커밋의 보안 취약점을 스캔, XSS/CORS/Auth 우회 시도를 원천 차단.
- **`Linter MCP`**: 단순 감지를 넘어, 에어비앤비 혹은 설정된 스타일 가이드 위반 사례를 `AutoRefactorSkill`을 통해 "자동 치환 (Auto-fix)"하여 병목 제거.
- **`Puppeteer / E2E MCP`**: Smoke 테스트의 엔드포인트 프로브 호출을 넘어, 버튼 클릭 시나리오 등 유저 여정을 직접 시뮬레이션("Headless Automation").

---

## 4. Execution Protocol & Automation Hooks
1. **Trigger**: 모든 타 팀의 `Done` 신호, 특히 T07/T08의 핵심 기능 Commit 발생 시.
2. **Execute**: `lint` -> `typecheck` -> `test suites` -> `AuraSecurityScan`.
3. **Hook [Validation_FAIL]**: 오류 감지 시 멈추지 않고, 에러 스택/위반 코드 스니펫과 수정 가이드를 묶어 원인 팀(예: T07 Front)에 즉시 "티켓" 전송 및 대기 열 차단.
4. **Hook [DEPLOY_GREEN]**: 완전 결함 없음 증명 시 오케스트레이터 및 `T10_OBSERVABILITY`에 [MERGE_APPROVE] 및 [RELEASE_READY] 시그널 발행.

---

## 5. Done Definition
- `reports/ci-summary.md` 산출물에 에러와 경고 항목이 완벽히 0임.
- 자동 롤백 트리거가 발동하지 않고, `/api/health`가 영구적 200 상태 유지.
- `TEAM_CONTEXT.md` 제약 준수 여부(예: 마이그레이션 금지 가드) 등 설정 위반 사항 없음.
