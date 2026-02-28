# 🚀 Team Agent Architecture Migration Guide

새로운 프로젝트나 기존의 다른 프로젝트에 현재 완성된 **초고도화된 Team Agent 아키텍처(Event-Driven, Context Engineering, 10-Team Handoff)**를 이식하고 싶을 때 사용하는 공식 지침서입니다.

새로운 프로젝트의 에이전트에게 아래의 **프롬프트(명령어)**를 복사해서 전달하기만 하면, 에이전트가 스스로 이 프로젝트의 구조를 분석하여 동일한 시스템을 구축하게 됩니다.

---

## 📋 Migration Prompt (새 프로젝트 적용용 프롬프트)

새 프로젝트를 열고 AI 에이전트(또는 대표 에이전트)에게 아래 텍스트를 복사하여 그대로 전송하십시오.

> **[시스템 아키텍처 이식 명령]**
> 
> 현재 프로젝트에 최고 수준의 체계화된 다중 에이전트 협업 시스템인 **Event-Driven Team Agent Architecture**를 셋업해주세요.
> 이 아키텍처는 단순 코딩 봇이 아닌, **아키텍처 레이어(Context, Protocol, Team), 동적 자동화 Handoff, 스마트 캐싱(Hashtag Indexing)**을 강제하는 시스템입니다.
> 
> 다음 절차에 따라 `.agent/` 디렉토리와 내부 에코시스템을 전면 구성하십시오.
> 
> **1. Architecture Hub & Protocol (루트 시스템)**
> - `.agent/AGENT_SYSTEM.md`: 10개 팀의 Registry, 3단계 레이어 구조, 실행 규칙 맵 생성.
> - `.agent/CONTEXT_ENGINE.md`: 프로젝트의 기술 스택, 상태 맵, 에러 카탈로그 등을 `#`태그 (예: `#identity`, `#filemap`, `#errors`) 기법을 사용해 생성. (에이전트가 `grep_search`로 부분 로딩할당 가능하게 설계)
> - `.agent/AGENT_PROTOCOLS.md`: 팀 간의 Handoff 스키마 포맷 결정, 봇들 스스로 `trigger_event`를 발생시켜 다음 로직/작업(`TEST_QA_FAILED` ➔ T7 등)을 호출하는 연쇄 협업 룰 작성.
> - `.agent/COST_RULES.md`: `view_file` 무지성 호출(전체 로드) 차단, 원샷 타격 수정(`multi_replace`) 명시, Team별 SLA 생성.
> 
> **2. Team Agent Registry (전문 팀 10개 구성)**
> - `.agent/teams/` 아래에 `team-01-planning.md`부터 `team-10-growth.md`까지 생성. (프로젝트 도메인에 맞게 Role을 매핑)
> - 각 팀 문서는 반드시 [목적, Scope(R/W권한 엄격 분리), Tool Protocols(읽기 순서), Handoff 스키마, Failure Modes] 섹션을 갖출 것.
> 
> **3. Agent Automation Workflows (절차/결합)**
> - `.agent/workflows/` 디렉토리에 `dispatch.md`(중앙 통제 통신), `feature-dev.md`(스마트 컨텍스트 인젝션+영향도 파악+원샷구현 8단계 레벨업 방식), `lint-sweep.md`, `perf-check.md`, `vibe-coding.md` 등 프로젝트 상황에 맞는 최적화된 워크플로우를 파일 당 40L 이내로 생성.
> 
> **4. Hyper-Skills (지능화 도구)**
> - `.agent/skills/` 내부에 `api-gen`, `component-gen`, `zero-shot-fix`, `code-review`, `test-gen` 스킬 생성. 단순 생성이 아닌, **에러 수집 ➔ 분석 ➔ 교체 ➔ Handoff 알림** 으로 이어지는 MCP Tool Chain Sequence 룰을 포함시킬 것.
> 
> **[유의사항]**
> - 생성하는 모든 `.md` 파일은 인간이 읽는 매뉴얼이 아닌 **에이전트(봇)가 읽고 파싱하는 프로그래밍된 프로토콜**처럼 정밀하게 작성되어야 합니다.
> - 현재 프로젝트의 도메인(디자인 토큰, 폴더 구조, 프레임워크 종류)을 먼저 파악(`tree` 또는 `ls` 류 도구 활용)한 뒤, 위 규격에 맞게 시스템을 커스터마이징하여 구축하십시오.

---

## 💡 How it works (어떻게 작동하나요?)

1. **상황 인식**: 명령을 받은 새 에이전트는 먼저 해당 프로젝트의 파일 구조와 기술 스택(예: React, Python, Spring 등)을 빠르게 스캔합니다.
2. **레이어 구성**: 기존 프로젝트에서 완성했던 3-Layer(Hub ➔ Protocol ➔ Teams)를 해당 프로젝트 언어 및 환경에 맞춰 스스로 번역하여 작성합니다.
3. **지식 해시태그 스냅샷**: `CONTEXT_ENGINE.md`를 그 프로젝트에 맞게 구축하여, 토큰 폭주를 막는 부분 로딩(`#` 인덱싱 룰) 체계를 세웁니다.
4. **팀 커스터마이징**: 10개 팀이 무조건 복사되는 것이 아니라, 새 프로젝트의 성격에 맞춰(예: AI 프로젝트면 Data/Inference 팀 강화) 팀의 R/W(읽기/쓰기) 스코프가 세팅됩니다.

이 프롬프트만 있으면, 어느 개발 환경에서든 최상위 티어의 Team Agent 협업 생태계를 즉시 부화(Incubate) 시킬 수 있습니다.
