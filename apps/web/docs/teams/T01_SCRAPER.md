# T01_SCRAPER — Data Acquisition Agent

## Mission
고정된 로직을 넘어, MCP와 동적 선택자(Skill)를 결합하여 7개 이상의 리뷰 플랫폼(Revu, ReviewNote 등)에서 극한의 환경에서도 데이터를 탄력적으로 수집한다.

---

## 1. Domain Scope (책임 영역)
- **어댑터**: `sources/adapters/*.ts` (revu, reviewnote, dinnerqueen, reviewplace, seouloppa, mrblog, gangnamfood)
- **플랫폼 관리**: `sources/registry.ts`
- **HTTP 통신**: `lib/fetcher.ts` (fetchWithRetry)

---

## 2. Agent Roles
- `adapter-architect`: `SelectorAutoDiscovery`를 사용하여 사이트 구조 변경 방어 및 자율 룰 수정.
- `stealth-operator`: 봇 감지 우회를 위한 WAF 바이패스 (랜덤 딜레이, User-Agent 위장).
- `retry-handler`: 지수 백오프 기반 실패 복구 (최대 3회), Fallback 페이로드 발생.

---

## 3. Advanced Skills & MCP Integration
- **`Puppeteer / Browser MCP`**: CSR(Client Side Rendering) 전용 페이지나 캡차(Captcha)가 존재하는 복잡한 플랫폼에서 시각적 렌더링을 통한 데이터 추출 수행.
- **`SelectorAutoDiscovery Skill`**: 플랫폼의 DOM 구조가 변경되어 파싱 에러가 발생하면, AI가 인접 텍스트 문맥을 분석해 새로운 CSS Selector를 자율 탐색.
- **`Filesystem MCP`**: 오류가 발생한 원시 HTML 코드를 `/tmp`에 캐싱하여 T02 및 인간 디버깅에 즉시 제공.

---

## 4. Execution Protocol & Automation Hooks
1. **Trigger**: `AGENT_WORKFLOW`의 "수집" 라우팅 또는 크론.
2. **Execute**: 7개 플랫폼 비동기 병렬 스크래핑.
   - 봇 차단 시 `stealth-operator`가 핑거프린트 교체 후 재시도.
3. **Hook [DATA_READY]**: 수집에 성공하는 즉시 해당 데이터 청크를 T02_NORMALIZER에 이벤트 기반으로 자동 전달.
4. **Fallback**: 완전 실패 플랫폼은 T10에 로그를 보내고 빈 스키마로 우회 처리하여 파이프라인 단절 방지.

---

## 5. Done Definition
- 7개 어댑터 중 5개 이상의 유효한 결과물 도출.
- DOM 파싱 및 네트워크 예외가 수집 프로세스 전체를 다운시키지 않고 완벽히 격리(Try-Catch)됨.
