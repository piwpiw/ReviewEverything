# Agent Workflows

이 폴더는 특정 작업(Feature 개발, 버그 픽스 등)을 수행할 때 오케스트레이터와 팀 에이전트들이 준수해야 하는 **가이드 단위의 워크플로우**를 담고 있습니다.

## Core Workflows
- `dispatch.md` (예정): 중앙 통제 통신망 규칙
- `feature-dev.md` (예정): 새로운 기능의 8단계 개발 라이프사이클 (영향도 파악 ➔ 원샷 구현 포함)
- `lint-sweep.md` (예정): T09_VALIDATION 주도의 전역 에러 스위핑 패스 가이드
- `perf-check.md` (예정): T06, T10 주도의 병목 프로파일링 가이드

모든 워크플로우 스크립트는 `COST_RULES.md`와 `AGENT_PROTOCOLS.md`의 연쇄 통신 포맷을 기반으로 실행되어야 합니다.
