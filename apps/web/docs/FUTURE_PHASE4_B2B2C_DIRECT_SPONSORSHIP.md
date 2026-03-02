# Future Expansion: Phase 4 B2B2C Direct Sponsorship

## Status
- `status`: `PARKED`
- `decision_date`: `2026-03-02`
- `owner`: `ReviewEverything Product/Engineering`
- `execution_policy`: `Do not implement now`

## Purpose
이 문서는 ReviewEverything의 추후 초고도화 시점에 진행할 B2B2C 양면 마켓플레이스 확장안을 별도 관리하기 위한 보류 문서다.

현재 개발 범위(스크래핑 기반 모아보기/운영 기능)와 혼합하지 않고, 이후 확장 트랙으로 분리한다.

## Deferred Scope (Phase 4)
- 광고주 셀프서브 캠페인 등록/운영 포털
- 에스크로 기반 결제/정산 파이프라인
- 인플루언서 DB 기반 자동 매칭(양방향 추천)
- SNS 공식 OAuth 연동 및 성과 검증 자동화
- 광고주 CRM 축적 및 리타겟팅 운영

## Why Deferred
- 현재 제품의 우선순위는 기본 탐색/운영 UX 완성도와 안정성 확보
- 결제/정산/OAuth는 보안/정합성/운영 리스크가 높아 별도 트랙이 필요
- 기술 부채 최소화를 위해 도메인 분리를 먼저 설계한 뒤 단계적으로 도입해야 함

## Resume Trigger
아래 조건이 충족되면 본 문서를 활성화하여 개발을 재개한다.

1. 현재 핵심 화면 및 운영 플로우 안정화 완료
2. 운영 지표 기반 확장 투자 의사결정 확정
3. 결제/정산 법무/정책 검토 완료
4. 보안 요구사항(OAuth 토큰/개인정보/감사로그) 합의 완료

## Implementation Order (When Resumed)
1. 결제/에스크로 도메인 모델 + 상태머신 설계
2. 광고주 계정/권한/캠페인 빌더 API
3. 매칭 및 승인/거절 워크플로우
4. SNS OAuth 연동과 포스팅 검증 자동화
5. AI 매칭 고도화 및 운영 대시보드

## Guardrails
- 본 문서 스코프는 `현재 스프린트 인스코프 아님`
- 별도 승인 없이 API/DB 스키마를 본 스코프로 확장하지 않음
- 착수 시 신규 브랜치/마이그레이션 계획/롤백 전략을 먼저 수립

## Notes
- 기존 논의 키워드: `JoinBrands`, `Collabstr`, `Escrow`, `B2B2C`, `Self-Serve`, `AI Matching`
- 이 문서는 제품 방향성 기록용이며, 즉시 구현 명세서가 아니다.
