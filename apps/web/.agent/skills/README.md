# Hyper-Skills

단순한 지시가 아니라, 특정 도메인 로직이나 복잡한 문제를 에이전트가 통제 가능하도록 엮어둔 **MCP Tool Chain Sequence**입니다.

## Core Skills
- `auto-refactor` (예정): linter 경고를 기반으로 원인 분석 후 `multi_replace`로 치환하는 연쇄 체인
- `zero-shot-fix` (예정): T09 테스트 실패 원인을 AST로 분석하여 단일 시도(one-shot)에 복구 시도
- `component-gen` (예정): Figma/Design Token을 JSON으로 받아와 100% 대응되는 React TSX 컴포넌트 출력

이 기술들은 `AGENT_WORKFLOW.md` 상에서 각 팀 에이전트가 문제를 해결할 때 호출하는 고도화된 스크립트 모음집으로 활용될 예정입니다.
