# Scraper Operations Playbook (Beta 2.0)

이 문서는 현재 서비스 기준으로 수집 파이프라인을 운영하면서, 새 사이트 확장까지 한 번에 대응할 수 있도록 정리했습니다.

## 1. 운영 SLO

- 수집 성공률: 24시간 기준 95% 이상
- 레이턴시: 기본 수집 트리거 응답 3초 이내 반환
- 수집량: 플랫폼별 1회 최소 3~5페이지
- 품질 경보: 핵심 지표 급락 시 1~2개 임계치 경고 발행

## 2. 현재 파이프라인 매핑

- 수집 트리거: `GET /api/cron`
- 수집 실행: `lib/backgroundWorker.ts`, `lib/ingest.ts`
- 플랫폼 등록/라우팅: `sources/registry.ts`
- 공통 인터페이스: `sources/types.ts` (`IPlatformAdapter`)
- 정규화: `sources/normalize.ts`
- 원시 fetch: `lib/fetcher.ts`

데이터 흐름:
- Scheduler(`/api/cron`) -> Job enqueue -> Adapter fetch -> normalize/dedupe -> DB upsert -> snapshot append

## 3. 정기 수집 운영 정책

- 기본 동작: 30~60분 간격 `/api/cron`
- 긴급 동작: `runNow=true` 즉시 실행 모드
- 페이지 제한: 기본 10페이지, 플랫폼별 `MAX_PAGES_PER_RUN` 적용
- 재시도: 3회 지수 백오프(+jitter)
- RUNNING lock stale: 45분 초과시 자동 점검

권장 스케줄
- 00:05 `GET /api/cron` (enqueue only)
- 00:10 `GET /api/cron?runNow=true&limit=6`
- 00:40 `GET /api/cron?runNow=true&limit=6` (건수 점검)
- 03:10 `GET /api/cron` (enqueue only)
- 03:20 `GET /api/cron?runNow=true&limit=6`

## 4. 어댑터 구현 규격

필수 필드
- `platformId: number`
- `baseUrl: string`
- `fetchList(page: number): Promise<ScrapedCampaign[]>`

정규화 필수 값
- `original_id`
- `title`
- `campaign_type`
- `media_type`
- `url`
- `apply_end_date`
- `recruit_count`, `applicant_count`

- `campaign_type`/`media_type`은 공통 타입으로 매핑 (VST/SHP/PRS, BP/IP/YP 등)

적용 규칙
- DOM selector는 본선 + fallback 2개 이상 구성
- page=1 결과는 대표성 샘플 확보
- page>1은 selector 실패 시 `continue`로 내구 처리 가능

## 5. 신규 사이트 온보딩 6단계

1. Platform 등록
- DB `platforms`에 `is_active=true`로 등록

2. adapter 작성
- `sources/adapters/<platform>.ts` 생성
- `IPlatformAdapter` 계약 구현

3. registry 연결
- `sources/registry.ts`에 새 adapter export/등록

4. 정규화 연동
- `sources/normalize.ts`에 타입/단위/날짜 규칙 추가

5. 운영 검증
- `/api/admin/ingest` 또는 `/api/cron`로 실제 적재 테스트

6. 증빙 확보
- `/admin` 또는 `/system`에서 성공 run, 실패 사유, 홈 노출 3종 캡처 저장

## 6. 실패 대응 Runbook

- HTTP 403/429
- User-Agent/Referer 점검 및 호출 텀 조정
- 1초 -> 2초 -> 3초 백오프
- 해당 페이지는 skip 처리하고 경보 기록

- DOM 변경
- selector 본선/대체 selector 동시 업데이트
- 핵심 필드(제목, 링크, 마감일) 3개 중 2개 이상 누락 시 경고

- 데이터 급락
- 직전 24시간 대비 50% 이상 하락 시 경보

- RUNNING stale
- 45분 이상 진행중이면 `stale` 판정, 수동 재시작 가이드 노출

## 7. 품질 게이트(출시 직전)

- AC-1: page=1에서 5개 이상 수집
- AC-2: 핵심 필드(title/url/deadline) 누락률 5% 이하
- AC-3: `reward_value` 파싱 성공률 80% 이상
- AC-4: 24시간 내 최소 1회 성공 run 존재

## 8. 팀 책임 분리

- T01_SCRAPER: adapter/fetch/retry
- T02_NORMALIZER: 타입 매핑/파서 규칙
- T03_DATABASE: upsert/snapshot 성능
- T04_WORKER: run/retry/lock/heartbeat
- T09_VALIDATION: 회귀 게이트
- T10_OBSERVABILITY: SLA/알림 연동

## 9. 실행 체크리스트

- [ ] page=1 수집 샘플 5개 확보
- [ ] 24시간 수집 성공률 95% 달성
- [ ] 지표 급락 경보 임계치 50% 점검
- [ ] 신규 adapter/registry/normalize PRD 증빙 3종 확보
- [ ] 운영 API(`/api/admin/quality`, `/api/admin/alerts`, `/api/admin/alerts/actions`) 연동 및 노출 확인
