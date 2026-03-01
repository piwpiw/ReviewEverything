# COMMAND_CENTER: Master Core Document (V3)
> **Source of Truth**: "멀티 에이전트 10-Team 병렬 개발"을 100배 가속하기 위한 초고밀도 작전 지도 및 시스템 아키텍처 현황판입니다. 에이전트는 이 문서를 최우선으로 읽고 유기적으로 동작해야 합니다.

---

## 🏗️ 1. Architecture & Infrastructure (현재 확보된 기술 자산)

### 🗺️ GIS 듀얼 엔진 브릿지 (V3)
- **NAVER Maps V3 (Ncloud)**:
  - `Client ID`: `xqc9tm6yw6` (정식 적용 완료)
  - `MarkerClustering`: 수백 개 단위의 캠페인 위치를 격자(Grid)로 자동 그룹화.
  - `Reverse Geocoding`: 지도 이동 시 현재 중심 좌표를 실시간 행정구역(동)으로 분석.
  - `Static Map`: 썸네일 누락 시 자동 프리뷰 지도 이미지 생성.
- **KAKAO Maps V2.5**:
  - `JS_KEY`: `3d5f7ad7a080c5ea3f9b1f632f6ecadb` (로컬 `3000/3001` 및 Vercel 동기화 완료)
  - 프리미엄 펄스(Pulse) 애니메이션 및 지능형 마커 시스템 적용.

### 💾 Data & Database (Supabase)
- **Type**: PostgreSQL (Prisma ORM 연결)
- **DATABASE_URL / DIRECT_URL**: `.env` 및 `.env.local` 에 AWS AP-Northeast-2 Supabase 계정 연동 완료 (에러 500 차단 완료).
- **Core Tables**: `Campaign`, `Platform`, `IngestRun`, `CampaignSnapshot`

---

## 🧬 2. Cross-Module Organic Flow (유기적 동작 시나리오)

모든 에이전트는 아래의 파이프라인을 훼손하지 않으면서 병렬 확장해야 합니다:

1. **[T01 크롤러] & [T02 파서]**:
   - (Next Step) 정적 Fallback을 끄고, 실제 외부 사이트 DOM을 스크래핑.
   - 캠페인 제목, 좌표(`lat/lng`), 마감일을 추출하여 `T03`에 적재.
2. **[T03 데이터베이스]**:
   - 새로 들어온 캠페인을 Supabase에 Upsert.
   - 부족한 데이터(예: 썸네일 없음)는 `Ncloud Static Map URL` 스트링으로 자동 대체(Fallback).
3. **[T07 프론트엔드] & [T06 분석기]**:
   - `FilterBar.tsx`의 D-Day 슬라이더 및 '당첨확률 UP' 클릭 시 즉시 쿼리 변환.
   - `MapView.tsx`는 수집된 수백 개의 위치를 딜레이 없이 렌더링하고, 사용자가 엔진(Kakao/Naver)을 자유자재로 스위칭하도록 지원.
4. **[T08 매니저 (CRM)]**:
   - 사용자가 찜한 캠페인을 캘린더에 동기화.
   - 대시보드에서 향후 투입 시간 대비 `최저시급 환산(ROI) 로직` 자동 계산.

---

## 🚀 3. Next Sprint Directives (초고속 병렬 지시서)

현재 방해물이었던 DB 연결 에러와 지도 출력 장애가 모두 클리어되었습니다. 이제 **10개 팀은 즉시 아래 미션을 병렬로 전개**합니다.

| Team | Mission Category | Precise Action to Execute | Priority |
|---|---|---|---|
| **T01** | **Scraper Activation** | `RevuAdapter`, `DinnerQueenAdapter` 등의 `fetch` 로직에서 Fallback Mock을 실제 DOM 파싱 코드로 100% 전환. | **P0** (즉시) |
| **T03** | **DB Seeding & Align** | T01이 띄운 수백 개의 실제 데이터를 Supabase DB 스키마에 맞춰 Insert 및 중복 방지 방어벽 고도화. | **P0** (즉시) |
| **T08** | **AI Curation & ROI** | 현재 Mock-up 되어 있는 `/me` 대시보드의 '소셜 프루프'와 'ROI 분석' 로직을 DB 기반 동적 데이터로 연결. | P1 |
| **T06** | **External API Bridging** | 네이버 검색 API(옵션)를 연동하여 '내 블로그 주소' 입력 시 실시간 트래픽 조회를 수행하는 AI 도구뼈대 연구. | P2 |
| **T04** | **Payment & Upgrade** | PRO 멤버십 업그레이드 여정에 실제 토스/카카오페이 (Test 모드) 딥링크 스크립트 모듈 연동. | P2 |

---

### 🛡️ Agent Execution Guardrails (절대 규칙)
- **지도 엔진(Kakao/Naver) 파괴 금지**: `MapView.tsx` 내의 Singleton 초기화 로직 및 클러스터링 로직 수정 시 사전 승인 필수.
- **환경 변수 캐시 주의**: `.env`에 등록된 `xqc9tm6...` 관련 코드 건드리지 말 것.
- **문서 동시 업데이트**: 이 `COMMAND_CENTER.md`의 "Next Sprint Directives" 목표가 달성될 때마다 PR 내에서 즉시 `완료` 태그로 갱신할 것.
