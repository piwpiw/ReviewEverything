### 2026-03-04 11:00 중복/누락 제로 운영 동기화 (TEAM_CONTEXT)

- 운영 규칙 강화:
  - 작업 변경은 `작업키` 기준 중복 점검 후 등록하고, 동일 화면 동시 수정은 단계별 승인 후 병합한다.
  - 화면별 AC 미달 항목은 완전 보완 전까지 다음 단계로 이관하지 않는다.
  - `운영/문서/실행` 3층 문서 동기화 없이 배포를 진행하지 않는다.
  - `scope=fast` 변경은 변경된 화면 경로당 `ui-qa-summary` 항목을 최소 1건 유지해야 한다.
  - `/api/admin/alerts/actions`의 실패 코드북(`REAUTH_REQUIRED`, `NOT_CONNECTED`, `LOGIN_ERROR`, `CONNECTED`)은 UI 토스트 라벨과 1:1 매핑 검증.
