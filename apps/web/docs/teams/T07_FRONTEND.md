# T07_FRONTEND — Autonomous UI & UX Agent

## Mission
14종의 React UI 컴포넌트(썸네일, 맵, 필터 등)와 상태 관리 훅을 최적화하고, Figma MCP 연동을 통해 인간-머신 간의 완벽한 디자인 일관성을 실현한다.

---

## 1. Domain Scope (책임 영역)
- **컴포넌트**: `components/*.tsx` (CampaignCard, FilterBar, MapView, PWAPrompt 등 14개 전체)
- **스타일/레이아웃**: `app/globals.css`, `app/layout.tsx`
- **페이지 엔트리**: `app/page.tsx`, `app/campaigns/`

---

## 2. Agent Roles
- `component-builder`: 재사용 가능하며 사이드 이펙트 없는(Server/Client 분리) 컴포넌트 조합 담당.
- `pwa-maintainer`: 오프라인 캐시 및 Manifest 무결성 검증, 브라우저 알림 권한 프롬프트 최적화.
- `accessibility-checker`: 키보드 탐색, 스크린 리더용 ARIA 라벨 자동 점검.

---

## 3. Advanced Skills & MCP Integration
- **`Figma / DesignSystem MCP`**: UI 토큰(색상, 간격) 변경 사항을 감지하여 코드베이스(Tailwind 또는 CSS 변수)에 직접 동기화 적용.
- **`Accessibility Check Skill`**: HTML 렌더 트리를 읽어 명도 대비 규칙 위반, 접근성 누락 등 WCAG 표준을 자동 스캔.
- **`Asset Optimize Skill`**: TSX 파일 내 직접 포함된 `<img>` 태그를 찾아 `next/image` 컴포넌트로 스마트 변환 및 `sizes` 속성 제안.

---

## 4. Execution Protocol & Automation Hooks
1. **Trigger**: 디자인 수정 요청 또는 T08/T06의 새로운 데이터 명세 도달.
2. **Build**: 컴포넌트 코드 작성 및 VDOM 분석.
3. **Check**: ARIA 검수 및 `next/link` 런타임 검사 패스.
4. **Hook [UI_READY_FOR_TEST]**: 프론트 수정을 커밋하고 T09_VALIDATION의 Headless Browser(Smoke) 테스터에게 랜더링 무결성 스캔 요청 자동 발송.

---

## 5. Done Definition
- `next build` 과정 중 미사용 변수나 구문 에러가 일절 없음.
- 브라우저 Lighthouse 기준 Accessibility 및 Best Practices 점수 90점 이상 유지.

## 6. API 상태 (implemented / planned)
- implemented: 소비 API = `GET /api/campaigns`, `GET /api/analytics`, `GET /api/me/revenue`
- planned: `/api/campaigns/:id`, `/api/me/schedules*`, `/api/me/notifications*` (공개되지 않은 API 전개 대기)


## 7. UI/UX Premiumization Blueprint (100억 기준)

### 7.1 UI 목표
- 목표: 초단위 반응속도(첫 렌더 < 1초), 탐색 전환 30% 상승, 재방문율 +25%.
- 원칙: 모든 화면은 `의사결정 비용`을 낮추는 방향으로 단일 액션 중심 설계.
- 우선순위: 홈 탐색 안정성 > 상세 신뢰도 > 캘린더/매니저 전환.

### 7.2 화면 고도화 우선순위
- **홈/캠페인 탐색 (`/`)**  
  - 검색/필터 피라미드: 필수 필터 1차 노출, 고급 필터는 접힘.
  - 카드는 스캔 우선 구성(보상/마감일/거리/신뢰도) + 스와이프/키보드 액션.
  - 오류 빈도/로딩/빈 결과를 1열 액션으로 통합.
- **상세 (`/campaigns/[id]`)**  
  - 상단: 핵심 지표 요약 + CTA 트리오(신청/저장/공유).  
  - 중단: 기간/요건/조건을 구조화된 칩으로 가독화.  
  - 하단: 유사 캠페인/재검색 루프.
- **지도 모드 (`/map`)**  
  - 마커 밀도에 따른 클러스터, 뷰포트 재검색, 오프라인 fallback 텍스트 모드.
- **매니저 (`/me`, `/me/calendar`, `/me/stats`)**  
  - 일정 CRUD를 캘린더-타임라인-통계로 한 번에 연결.
  - 수입 예측 카드, 상태 전환 가이드, 알림 상태를 한 화면에서 확인.
- **관리자 (`/admin`, `/system`)**  
  - 실행 이력, 실패 상세, 복구 CTA를 한곳에서 정렬.

### 7.3 다중팀 병렬 실행(동시 투입)
- **T07(Primary)**: 컴포넌트/페이지 구조, 토큰 체계, 접근성 패턴.
- **T08(Parallel)**: 사용자 여정, 일정/알림 연계, 권한별 화면 라우팅.
- **T06(Parallel)**: 탐색 정렬 해설, 트렌드 가시성, 인사이트 문구 정합성.
- **T10(Parallel)**: 운영 상태 표기, 신뢰도 라벨, 경보 메시지 UX.
- **T09(Safety Gate)**: 빌드 스냅샷·Lighthouse·접근성 회귀와 연동.

### 7.4 UI/UX 품질 게이트
- `FCP < 1.6s`, `INP` 점진 개선 목표, `CLS < 0.1`.
- Lighthouse: Accessibility/Performance/Best Practices 각각 90 이상.
- 인터랙션 규칙: 모든 핵심 버튼/토글은 `aria-label`, 키보드 포커스 가시성 확보.
- 에러 패턴: 404/403/네트워크 실패의 빈 상태 메시지와 복구 CTA를 공통 템플릿으로 고정.

### 7.5 화면별 UX AC(집행)
- `A-01`: 필터 변화 시 결과 요약 수치 즉시 반영.
- `A-02`: 카드 핵심 속성(보상·마감일·거리)은 1개 카드 뷰 내 필수 노출.
- `A-03`: 지도에서 위치 권한 거부 시 텍스트 지역선택 모드 fallback.
- `A-04`: 일정 등록 후 1초 내로 대시보드 KPI 반영(또는 낙관적 업데이트).
- `A-05`: 알림 설정 변경 후 24시간 내 스캔 동작 가시 로그 링크 제공.

## 7.6 화면 단위 운영 사양(재배포 불변 항목)

- `/` 홈 탐색:
  - 우선순위: 검색 정확도 > 필터 신뢰도 > 다음 행동 유도.
  - 공통 요소: 필터 칩 요약, 결과 집계 배지, 에러 복구 CTA, 빈 상태 가이드.
- `/campaigns/[id]` 상세:
  - 우선순위: 정합성 확인 > 신뢰도 전달 > CTA 동선 확정.
  - 공통 요소: 핵심 메트릭(보상/마감일/경쟁률), 링크 상태 배지, 유사 캠페인 진입.
- `/map` 지도:
  - 우선순위: 위치 적합도 > 성능 > 오프라인 접근성.
  - 공통 요소: 재검색 CTA, 클러스터/개별 마커 구분, 권한 실패 텍스트 경로.
- `/me`, `/me/calendar`, `/me/stats`:
  - 우선순위: 일정 진입 > 상태 추적 > 데이터 가시성.
  - 공통 요소: 상태 칩, 즉시 동작(추가/편집), 요약 수치/차트 fallback.
- `/admin`, `/system`:
  - 우선순위: 이상 탐지 가시성 > 액션 우선순위 > 복구 경로.
  - 공통 요소: 상태 라벨, 실패 로그 링크, 수동 재시도 버튼.

## 7.7 UI/UX 자동 회귀 설계 원칙

- 문장 템플릿은 화면별 1회성 문구를 금지하고 `PROJECT_STATUS.md` 문구표를 참조해 공통화한다.
- 에러·예외 상태는 다음 4종으로 통일한다.
  - 필수 데이터 없음(0건), 네트워크 실패, 권한 거부, 스키마 변형.
- 팀 간 의사결정 지연을 줄이기 위해 다음 2단계를 강제한다.
  - 화면 작업 -> `AGENT_WORKFLOW` `ScreenReady` 체크 -> `ui-qa-summary` 연결.
  - 성공 시 `TEAM_CONTEXT.md`의 `#ux_policy`와 월간 KPI 지표에 반영.

## 7.8 병렬 작업 실행 프레임(금주의 기준)

- T07: 페이지 skeleton, 컴포넌트 토큰 반영, 인터랙션 안정성.
- T08: 일정·알림 도메인 화면 템플릿 정합.
- T06: 랭킹/인사이트 문구, 우선순위/경고 톤 정렬.
- T10: 운영 라벨(정상/주의/위험), 관리자/시스템 메시지 톤 정리.
- T09: Lighthouse/접근성/스냅샷 회귀와 `ui-qa-summary` 자동 연동.
