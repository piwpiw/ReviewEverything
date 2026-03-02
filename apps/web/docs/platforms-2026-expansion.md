# 2026 기준 수집 플랫폼 정리 (리뷰에브리띵 적용 기준)

## 1. 운영 중인 수집 대상(요약)

| No | 플랫폼 | 주소 |
| --- | --- | --- |
| 1 | 리뷰노트 | https://www.reviewnote.co.kr |
| 2 | 레뷰 | https://www.revu.net |
| 3 | 디너의여왕 | https://dinnerqueen.net |
| 4 | 서울오빠 | https://www.seouloppa.co.kr |
| 5 | 포블로그 | https://4blog.net |
| 6 | 핌블 | https://pimble.co.kr |
| 7 | 아싸뷰 | https://assaview.co.kr |
| 8 | 놀러와체험단 | https://cometoplay.kr |
| 9 | 모두의체험단 | https://www.modan.kr |
| 10 | 리뷰플레이스 | https://www.reviewplace.co.kr |
| 11 | 위블 | https://www.weble.kr |
| 12 | 링블 | https://www.ringble.co.kr |
| 13 | 모블 | https://www.mobble.kr |
| 14 | 픽미 | https://pickmee.kr |
| 15 | 리뷰원정대 | https://xn--vk1bn0kvydxrlprb.com |
| 16 | 체험뷰 | https://chehumview.com |
| 17 | 강남맛집체험단 | https://gnreview.co.kr |
| 18 | 데일리뷰 | https://dailyview.kr |
| 19 | 리얼리뷰단 | https://realreview.kr |
| 20 | 블로그체험단닷컴 | https://blogreview.co.kr |

## 2. 이번 단계 반영 우선순위

- 공통 스키마 정합성 고도화
  - `platform`, `title`, `category`, `region_depth1`, `region_depth2`, `type`, `deadline`, `url`를 표준화
- 검색 정확도
  - 지역(시/구) + 키워드 AND
  - 동의어(펜션=숙박=호텔) 자동 확장
  - 오타 보정 + 최근 검색어/자동완성 강화
- 수집 품질
  - 타입 정규화(방문/배송/SNS) 강화
  - 지역명 정규화(서울 강남/강남구 등)
  - 중복 후보 탐지(동일 플랫폼 내 타이틀+지역+마감)

## 3. 다음 버전 확장 체크리스트

- 로그인/세션 의존 플랫폼 분리 수집 경로 설계
- JS 렌더링 대상은 `fetchList` 동시성 + 지연 정책 적용
- 형태소/유사어 기반 검색 인덱스 도입
- 지도 노출 안정화(좌표 누락 캠페인 보정)
- 캐시 계층에서 인기 검색어 캐싱

