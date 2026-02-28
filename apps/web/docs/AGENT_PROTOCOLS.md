# AGENT_PROTOCOLS — Inter-Team Handoff & Trigger Events

> 팀과 팀 사이의 통신은 단순 문자열이 아닌, 구조화된 Handoff 스키마와 이벤트 트리거(`trigger_event`)로 명확히 전파됩니다.

## 1. trigger_event 스키마 포맷

모든 팀은 자신의 역할을 완수한 후, 오케스트레이터 및 다음 팀에게 아래의 JSON 스키마 포맷으로 완료 신호(Handoff)를 남겨야 합니다. 

```json
{
  "trigger_event": "DATA_NORMALIZED",
  "source_team": "T02_NORMALIZER",
  "target_team": "T03_DATABASE",
  "payload": {
    "files_changed": ["sources/normalize.ts"],
    "status": "GREEN",
    "has_warnings": false
  },
  "action_required": "upsert_campaign_with_new_schema"
}
```

## 2. 연쇄 협업 룰 (Chain Collaboration)

봇들은 이 문서를 참조하여 스스로 다음 로직을 호출합니다.

- **[T01 ➔ T02] `SCRAPE_COMPLETED`**: 원시 데이터 확보 완료. T02는 파싱 품질 스키마 적용 시작.
- **[T02 ➔ T03] `DATA_NORMALIZED`**: T03은 페이로드를 받아 DB에 Bulk Upsert를 자동 실행.
- **[T09 ➔ 전팀] `TEST_QA_FAILED`**: T09 검증 실패 시, 페이로드에 "err_trace" 삽입 후 원인 팀으로 반환(Bounce). 대상 팀은 해당 스택 트레이스만 부분 분석 후 원샷 수정 적용.
- **[T03 ➔ T07, T08] `SCHEMA_MIGRATED`**: 스키마 구조 변경 발생 시 프론트엔드 및 매니저 API 팀이 자동 연쇄 활성화되어 타입스크립트 에러 사전 방어.

## 3. State Lockdown (Deadlock Prevention)

- `trigger_event` 발생 중에 `status: "RED"`가 수신되면, 타겟 팀(target_team) 외의 모든 병렬 팀들은 `IDLE` 모드로 진입하며 리소스를 반환해야 합니다.
