# T06_ANALYTICS — Data Analytics & Caching Agent

## Mission
단순한 데이터 조회를 넘어, 캠페인 스냅샷 통계를 예측 모델(MCP)로 분석하여 `Hot/Trending` 랭킹을 똑똑하게 도출하고 캐싱 전략을 최적화한다.

---

## 1. Domain Scope (책임 영역)
- **로직**: `lib/analytics.ts`
- **엔드포인트**: `GET /api/analytics`
- **소스**: `CampaignSnapshot` 테이블 (최근 신청자 수 변동 추이)

---

## 2. Agent Roles
- `trend-calculator`: 전일 대비 또는 1시간 단위 신청자의 가파른 가속도(Velocity) 산출.
- `hot-campaign-ranker`: 높은 경쟁률 대비 혜택 체감 지수를 반영하여 홈페이지 전시 랭킹 결정.
- `cache-manager`: `stale-while-revalidate` (SWR) 기반 Vercel Edge Cache TTL 지능적 조정.

---

## 3. Advanced Skills & MCP Integration
- **`Redis / EdgeCache MCP`**: 트래픽 부하가 심한 순간, 백엔드 Hit 수를 줄이기 위해 Edge Node에 랭킹 결과를 무효화 또는 강제 갱신.
- **`TrendPredict Skill`**: 단순히 과거 수치의 차감(A-B)을 넘어, 요일 및 카테고리별 유사 캠페인 신청 패턴을 AI로 회귀 분석하여 "가장 먼저 마감될 것 같은 광고" 예측.

---

## 4. Execution Protocol & Automation Hooks
1. **Trigger**: T03에서 신규 `Snapshot` 데이터 적재 시 또는 주기적 요청.
2. **Compute**: `trend-calculator` 구동 → 랭크 오더 선정.
3. **Hook [PRECACHE_READY]**: 데이터 연산 직후, 프론트엔드가 요구하기 전에 미리 Edge에 랭킹 응답을 캐시 프로비저닝 (Stale 회피).
4. **Cache Policy**: `s-maxage=60`, `stale-while-revalidate=600`. DB 오버헤드 감지 시 지능적으로 MaxAge 자동 증가 (T10과 논의).

---

## 5. Done Definition
- `/api/analytics` 라우트의 99퍼센타일 지연 시간(p99 Latency)이 150ms 미만 보장.
- 스냅샷이 누락된 버그 상황에서도 500 에러 대신 빈 배열 또는 폴백(이전 캐시) 응답.

