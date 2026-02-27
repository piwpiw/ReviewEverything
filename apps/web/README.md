# ReviewEverything (인플루언서 캠페인 통합 허브)

국내 7개 인플루언서 리뷰 플랫폼(Revu, Reviewnote, DinnerQueen, ReviewPlace, Seouloppa, MrBlog, GangnamFood)의 캠페인 데이터를 한 곳으로 모아주는 통합 검색/분석 대시보드입니다.

## 🚀 코어 상태(Core State) 및 구동 현황

현재 본 프로젝트는 **[100% Mock + UI 렌더링]** 상태로 최적화되어, 데이터베이스(Postgres)가 없는 로컬/Edge 환경에서도 완벽한 프론트엔드 구동이 가능합니다.

* **동작 URL**: `http://localhost:3001` (포트 중복 시 자동 대응 적용됨)
* **API 라우터**: `/api/campaigns` (검색 및 정렬 쿼리 빌더 연동 완료)
* **크롤링 모듈(Adapters)**: 7개 플랫폼의 DOM 파서 인터페이스 및 `Delay(Rate Limiting)` 모의 구동 엔진 코어 연동 완료
* **DB 프레임워크**: Prisma + Supabase Schema `prisma.config.ts` 및 모델 구조 세팅 완료 (설치 즉시 사용 가능)

## ✨ 핵심 기능 (Core Features)

1. **초협업 멀티-스크래핑 아키텍처 (Multi-Platform Adapter)**
   * `IPlatformAdapter` 인터페이스를 통한 개별 7개 모듈화.
   * Concurrent 딜레이 로직 내장으로 서버 로드 밸런싱 및 WAF(웹 방화벽) 우회 최적화.
2. **프리미엄 UI/UX & Glassmorphism 디자인 적용**
   * 반응형(Responsive) 카드 마이크로 애니메이션, 그라디언트 섀도우.
   * `Search Params` 기반 클라이언트 라우팅(Client Routing)으로 새로고침 없는 상태 보존 정렬(Sort).
3. **꿀알바 식별 알고리즘 (Low Competition)**
   * 스냅샷(Snapshot) 기반으로 모집인원 대비 지원자가 적은 캠페인을 선별하여 `<꿀알바 배지>` 부착.
4. **관제 센터 및 무중단 대비 폴백(Fallback)**
   * `/admin` 페이지에서 1, 2선(Primary/Secondary) 배치 크롤링 작업 헬스 체크.
   * IP 블록/구조 변경(DOM Shift) 발생 시, 관리자가 CSV로 수동 병합할 수 있는 컴포넌트 탑재.

## 🛠 핵심 작업 (Core Tasks Next Steps)

- [x] Next.js v15 App Router + Tailwind 기반 인프라 구축
- [x] Prisma ORM 스키마 설계 및 백엔드 뼈대 작성
- [x] 프리미엄 검색 인터페이스 및 카드 컴포넌트 제작
- [x] 7개 Adapter 멀티-에이전트 동시 수정(Scrape Interface) + Mock 딜레이 이관
- [ ] (보류/선택) `.env` 파일에 실제 Supabase Postgres URL 매핑 
- [ ] (보류/선택) Vercel 배포 및 `/api/cron` 서버리스 트리거 가동

---

**[사용 방법]**
터미널에서 `npm run dev` 만 입력하시면 즉각적으로 모든 아키텍처를 테스트하실 수 있습니다.
