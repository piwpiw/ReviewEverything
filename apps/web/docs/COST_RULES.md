# COST_RULES — Token Optimization & SLA

> **[경고]** 에이전트의 불필요한 토큰 소모와 환각(Hallucination)을 막기 위한 행동 강령입니다. 위반 시 강제 차단(Halt).

## 1. File Read Limits (무지성 로드 차단)
- `view_file` 툴을 사용하여 500줄 이상의 파일을 목적 없이 전체 로드하는 행위를 **엄격히 금지**합니다.
- 파일 탐색 시 반드시 `view_file_outline`으로 전체 구조를 파악하거나, `grep_search`를 통해 타겟 함수/클래스만 검색하십시오.

## 2. Context Loading (Hashtag Retrieval)
- `TEAM_CONTEXT.md` 등 컨텍스트 문서를 읽을 때 파일 전체를 부르지 마십시오.
- `grep_search "#티어" docs/TEAM_CONTEXT.md` 와 같이 정해진 `#해시태그` 인덱스를 통해 필요한 섹션만 부분 점유하십시오.

## 3. Atomic Targeting (원샷 타격 수정)
- 코드를 수정할 때 파일을 통째로 덮어쓰거나(Overwrite) 대규모 `replace_file_content` 호출을 피하십시오.
- 여러 줄의 비연속적인 수정이 필요할 경우, 반드시 **`multi_replace_file_content`** 도구를 사용하여 정확히 타겟 라인(Start/End)만 정밀 타격(One-shot)하여 수정하십시오.

## 4. Team SLA (Service Level Agreement)
- 각 팀 에이전트는 하나의 Task당 최대 3회의 수정 사이클 내에 `Done Gate`를 통과해야 합니다.
- 3회 초과 시 코드를 롤백하고 `T10_OBSERVABILITY`에 `#SLA_BREACH` 이벤트를 발생시키고 멈추십시오.
