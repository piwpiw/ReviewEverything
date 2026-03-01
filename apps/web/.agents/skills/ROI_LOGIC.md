# ROI & Revenue Logic Skill (ROI_LOGIC)

본 스킬은 체험단 캠페인에 투입된 시간 대비 수익(ROI)을 계산하고, 물품의 재판매 가치를 환산하는 비즈니스 로직을 정의합니다. 
AI 에이전트는 새로운 대시보드나 정산 페이지를 구현할 때 반드시 본 로직을 참조하여 일관된 지표를 제공해야 합니다.

---

## 🔢 1. 핵심 계산 공식 (Core Formulas)

### 1.1 순수익 산출 (Net Profit)
사용자가 실제로 손에 쥐는 경제적 이익의 합계입니다.
- **공식:** `순수익 = 고료(Ad Fee) + 예상 재판매 수익(Resale Revenue)`
- **예상 재판매 수익:** `총 협찬 물품 가치(Sponsorship Value) * 0.4` (당근마켓/중고나라 처분가 40% 적용)

### 1.2 실제 시간당 이익 (Real Hourly Rate)
투입된 노동력 대비 효율을 최저시급과 비교하기 위한 지표입니다.
- **투입 시간 산정:** `진행 캠페인 건수 * 3.5h` (방문 2h + 이동 0.5h + 리뷰 작성 1h 평균)
- **공식:** `실제 시급 = 순수익 / 총 투입 시간`
- **비교 지표:** `내 시급 가치 = 총 투입 시간 * 9,860원` (2024년 최저시급 기준 기회비용)

---

## 🎨 2. UI 구현 가이드라인 (Implementation)

계산된 데이터를 화면에 표기할 때는 다음의 시각적 위계를 준수합니다.

1. **강조 컬러:**
   - **순수익:** `Violet-600` (신비롭고 가치 있는 최종 합계)
   - **재판매 수익:** `Emerald-500` (추가적인 현금 흐름)
   - **경고/비용:** `Rose-500` (기회비용 손실)
   - **실제 시급:** `Blue-600` (핵심 분석 지표)

2. **단위 표기:**
   - 금액은 반드시 `.toLocaleString()`을 사용하여 천 단위 콤마를 찍습니다.
   - 시간은 뒤에 `h` 또는 `시간` 접미사를 붙입니다.
   - 시급은 `원/h` 단위를 사용합니다.

---

## 🛠️ 3. 코드 참조 예시 (Usage Example)

```typescript
// ROI 분석 로직 적용 예시
const sponsorshipValue = 100000; // 10만원 물품
const adFee = 30000; // 3만원 고료
const campaignsCount = 1;

const resalableValue = Math.floor(sponsorshipValue * 0.4); // 40,000원
const netProfit = adFee + resalableValue; // 70,000원
const totalHours = campaignsCount * 3.5; // 3.5시간
const hourlyRate = Math.floor(netProfit / totalHours); // 20,000원/h

// 최저시급(9860원) 대비 약 2배의 효율임을 강조
```

---

## 📝 4. 업데이트 이력
- **2024-03-01:** 초기 스킬 정의. 재판매 가치 40%, 건당 소요 시간 3.5시간 기준 정립.
