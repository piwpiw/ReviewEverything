# KUCOOK Data Graph

## Goal

쿠쿡 화면에서 레스토랑, 셰프, 음식, 재료, 분류체계, 상관관계를 분리 저장하지 않고 하나의 연결 그래프로 다루기 위한 DB 기준 문서다.

핵심 원칙:

- `Restaurant -> Chef -> Dish -> Ingredient`를 기본 축으로 둔다.
- 분류는 문자열 컬럼이 아니라 `TaxonomyTerm` 계층으로 관리한다.
- 관계 강도는 단순 연결이 아니라 `score`, `confidence`, `source_type`으로 저장한다.
- 각 taxonomy는 `icon_emoji`, `icon_key`, `badge_color`, `sort_order`를 가져 쿠쿡 화면 배지/UI에 바로 연결한다.
- 쿠쿡 화면은 이 구조를 기반으로 `대표요리`, `셰프 스타일`, `레스토랑 포지션`, `유사/대체/페어링 음식`을 한 번에 보여줄 수 있다.

## Core Entities

- `Restaurant`
  - 레스토랑 본체
  - 위치, 서비스 모델, 가격대, 브랜드 정보 포함
- `Chef`
  - 셰프 본체
  - 경력, 국적, 시그니처 스타일 포함
- `Dish`
  - 메뉴/요리 단위
  - 난이도, 매운 정도, 온도, 기원 지역 포함
- `Ingredient`
  - 재료 단위
  - 식재료 군, 계절성 포함

## Taxonomy Strategy

`TaxonomyKind`는 최대한 세분화해서도 재사용 가능한 축만 남겼다.

- `CUISINE`
  - 한식, 일식, 중식, 양식, 프렌치, 이탈리안, 스패니시, 멕시칸, 동남아, 퓨전
- `REGION`
  - 국가, 광역권, 도시, 로컬 식문화권
- `DISH_TYPE`
  - 탕, 찜, 구이, 면, 덮밥, 디저트, 안주, 브런치, 오마카세 코스요리
- `COURSE`
  - 애피타이저, 메인, 사이드, 디저트, 페어링, 시그니처
- `PROTEIN`
  - 소고기, 돼지고기, 닭고기, 양고기, 생선, 갑각류, 조개류, 두부, 콩, 계란
- `MAIN_INGREDIENT`
  - 쌀, 밀, 버섯, 해산물, 허브, 치즈, 토마토, 고추, 트러플 등
- `COOKING_TECHNIQUE`
  - 숯불, 직화, 수비드, 에이징, 발효, 훈연, 튀김, 브레이징, 리덕션
- `FLAVOR`
  - 감칠맛, 산미, 매운맛, 단맛, 짠맛, 쌉싸름함, 고소함, 허브향
- `TEXTURE`
  - 바삭함, 쫄깃함, 부드러움, 크리미함, 촉촉함, 묵직함
- `TEMPERATURE`
  - 냉, 온, 핫, 룸템퍼러처
- `SERVICE_STYLE`
  - 파인다이닝, 캐주얼다이닝, 비스트로, 오마카세, 테이스팅, 바, 포장중심
- `DIETARY`
  - 비건, 베지테리언, 글루텐프리, 저탄고지, 할랄, 코셔
- `ALLERGEN`
  - 유제품, 갑각류, 견과류, 밀, 대두, 계란
- `OCCASION`
  - 데이트, 회식, 가족모임, 혼밥, 기념일, 접대, 야식
- `BEVERAGE_PAIRING`
  - 내추럴와인, 샴페인, 사케, 하이볼, 전통주, 무알콜 페어링
- `PRICE_TIER`
  - 엔트리, 미들, 프리미엄, 럭셔리

## Emoji Matching

모든 항목은 taxonomy 레코드 단위로 이모지와 배지색을 가진다.

- 예시 컬럼
  - `icon_emoji`: `🍣`
  - `icon_key`: `sushi`
  - `badge_color`: `rose`
  - `sort_order`: `11`

대표 예시:

- 한식 `🍚`
- 일식 `🍣`
- 디저트 `🍰`
- 구이 `🍖`
- 발효 `🫙`
- 매운맛 `🌶️`
- 바삭함 `🥨`
- 파인다이닝 `🍾`
- 비건 `🌱`
- 알레르기 `⚠️`
- 데이트 `❤️`
- 레드와인 `🍷`
- 프리미엄 `💎`

## Structural Relations

### Direct Relations

- `ChefRestaurant`
  - 셰프와 레스토랑의 소속/역할 관계
- `RestaurantDish`
  - 레스토랑의 메뉴 구성
  - `is_signature`, `is_seasonal`, `price`로 화면 노출 우선순위 제어
- `DishIngredient`
  - 요리의 핵심 재료와 서브 재료 구분

### Taxonomy Assignments

- `DishTaxonomyAssignment`
  - 요리의 분류 연결
- `ChefTaxonomyAssignment`
  - 셰프의 전문 영역, 대표 스타일 연결
- `RestaurantTaxonomyAssignment`
  - 레스토랑 포지셔닝 연결
- `IngredientTaxonomyAssignment`
  - 재료를 카테고리 그래프와 연결

각 assignment는 아래 값을 가진다.

- `relevance_score`
  - 해당 분류가 얼마나 강하게 맞는지
- `is_primary`
  - 메인 노출용 대표 카테고리 여부
- `source_type`
  - 운영자 수기, 외부 수집, 추론, 집계 중 어디서 왔는지

## Correlation Layer

### Dish Correlation

`DishCorrelation`은 음식 간 상관관계를 명시한다.

- `PAIRS_WITH`
  - 같이 잘 팔리거나 같이 먹는 조합
- `SIMILAR_TO`
  - 유사한 메뉴
- `CONTRASTS_WITH`
  - 상반된 맛/텍스처 조합
- `SUBSTITUTES_FOR`
  - 대체 가능 메뉴
- `DERIVED_FROM`
  - 파생/변형 관계
- `INFLUENCES`
  - 문화적 영향 관계
- `SIGNATURE_FOR`
  - 특정 셰프/매장 정체성과 강하게 연결
- `POPULAR_WITH`
  - 특정 소비 맥락/카테고리에서 동반 인기
- `TREND_ALIGNS_WITH`
  - 동일 트렌드 축에 있는 메뉴

### Taxonomy Relation

`TaxonomyRelation`은 분류 간 연관 지식을 저장한다.

예시:

- `한식` -> `발효` (`INFLUENCES`)
- `직화구이` -> `훈연향` (`POPULAR_WITH`)
- `해산물` -> `화이트와인` (`PAIRS_WITH`)
- `브런치` -> `캐주얼다이닝` (`POPULAR_WITH`)

## Analytics Layer

- `DishAnalyticsSnapshot`
  - 날짜별 메뉴 언급량, 입점 레스토랑 수, 메뉴 수, 평균 가격, 인기도
- `TaxonomyAnalyticsSnapshot`
  - 날짜별 카테고리 확산도

이 두 테이블로 쿠쿡 화면에서 다음을 만들 수 있다.

- 급상승 메뉴
- 셰프 스타일 변화
- 특정 지역/카테고리 조합의 성장률
- 페어링 추천의 실제 인기도 기반 보정

## Campaign Bridge

기존 리뷰 캠페인 도메인과 연결하기 위해 `Campaign`에 다음을 추가했다.

- `restaurant_id`
- `representative_dish_id`

이렇게 하면 체험단/리뷰 캠페인을 쿠쿡 데이터 그래프와 바로 연결할 수 있다.

예시:

- 어떤 캠페인이 어느 레스토랑의 어떤 대표요리와 연결되는지
- 해당 요리의 유사 메뉴, 대체 메뉴, 페어링 메뉴까지 탐색
- 셰프 시그니처와 연결된 캠페인만 필터링

## Recommended Seed Order

1. `TaxonomyTerm`
2. `Ingredient`
3. `Restaurant`
4. `Chef`
5. `Dish`
6. `ChefRestaurant`
7. `RestaurantDish`
8. `DishIngredient`
9. `*TaxonomyAssignment`
10. `DishCorrelation`, `TaxonomyRelation`
11. `DishAnalyticsSnapshot`, `TaxonomyAnalyticsSnapshot`

## Seed Coverage

`prisma/seed.ts`는 아래를 같이 넣도록 확장됐다.

- 전체 taxonomy + 이모지 매칭 seed
- 샘플 레스토랑 1개
- 샘플 셰프 1명
- 샘플 메뉴 2개
- 메뉴-재료-카테고리-페어링 상관관계 예시
- 기존 campaign 도메인과 restaurant/dish 브릿지 예시

## Screen Query Examples

- 레스토랑 상세
  - `Restaurant` + `ChefRestaurant` + `RestaurantDish` + 대표 taxonomy
- 셰프 상세
  - `Chef` + `ChefTaxonomyAssignment` + `Dish`
- 메뉴 탐색
  - `Dish` + `DishTaxonomyAssignment` + `DishCorrelation`
- 추천 그래프
  - 현재 dish -> correlated dishes -> shared taxonomy -> matching restaurants
