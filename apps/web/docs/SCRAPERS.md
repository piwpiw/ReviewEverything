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
- 병렬 실행: `INGEST_JOB_CONCURRENCY` (기본 4)로 runNow 배치 동시 처리 수 제어
- 알림 스캔 동시 실행 수: `INGEST_REMINDER_JOB_CONCURRENCY` (기본 2)로 `REMINDER_SCAN` 병렬 처리.
- 알림 디스패치 병렬성: `NOTIFICATION_DISPATCH_CONCURRENCY` (기본 6)로 대기 알림 발송 병렬 처리
- 알림 생성 병렬 배치: `REMINDER_DELIVERY_CREATE_BATCH` (기본 200) + `REMINDER_DELIVERY_CREATE_CONCURRENCY` (기본 2)
- 가중치 튜닝: `INGEST_JOB_WEIGHT_DIVISOR`, `INGEST_JOB_WEIGHT_MIN`, `INGEST_JOB_WEIGHT_MAX`로 `maxPagesPerRun` 기반 슬롯 가중치 조절.
- runNow 우선순위: `REMINDER_SCAN` 작업을 병렬 큐에서 우선 조회해 알림 경로 지연을 최소화.
- 큐 적재 성능: `enqueueIngestJobs`는 `createMany` 기반 배치 적재로 pending/running 중복 선점 조회를 회피.
- 실행 우선순위: 대형 후보는 `maxPagesPerRun` 기반으로 가중치 정렬해 병렬 슬롯을 우선 할당.
- 슬롯 계산: 병렬 배치에서는 단순 건수가 아니라 `maxPagesPerRun` 가중치 기준으로 실제 동시성 슬롯을 반영해 대형 작업 과점유를 완화.
- 재시도: 3회 기본 지수 백오프(+jitter), 403/429은 Retry-After 헤더 및 장기 쿨오프 반영
- 동적 임계치: 플랫폼별 `INGEST_MAX_EMPTY_PAGES`, `INGEST_MIN_VALID_ITEM_RATE`, `INGEST_MAX_CONSECUTIVE_FETCH_ERRORS`로 변동 대응
- RUNNING lock stale: 45분 초과시 자동 점검
- 수집 품질 정책: 페이지 내 중복 `original_id` 1차 필터링, 유효율 저하를 별도 경보로 분리
- Top20 후보 투입 규칙(연구 반영):
  - Phase-1: 리뷰노트/레뷰/디너의여왕/리뷰플레이스/서울오빠
  - Phase-2: 링블/티블/포블로그/미블/클라우드리뷰/모블
  - Phase-3: 강남맛집/슈퍼멤버스/아싸뷰/스타일C/체험단닷컴/리뷰윙/놀러와체험단/체험뷰
  - 플랫폼 직렬 실행 보호: `canRunInParallel=false` 플랫폼은 동시 실행 충돌 회피를 위해 즉시 재큐(`next_run_at`)로 보류
  - 각 phase는 1회차 3~5개 플랫폼만 동시 On, 실패율 상위 1개를 제외하고 고정 간격 보류

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

정규화 필수 값 (Rich Data 확장)
- `original_id`
- `title`
- `campaign_type`
- `media_type`
- `url`
- `apply_end_date`
- `recruit_count`, `applicant_count`
- `main_image` (캠페인 대표 이미지 URL)
- `brief_desc` (캠페인 핵심 문구/요약)
- `tags` (카테고리 및 특징 태그)

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
- 1초 -> 2초 -> 3초 백오프 이후 장애 지속 시 최대 30~120초 쿨오프
- 재시도 횟수 초과 시 run 실패를 `FAILED`로 기록하고 다음 주기에서 자동 복구 시도
- 해당 페이지는 skip 처리하고 `error_log`에 상태코드/실패원인 저장

- DOM 변경
- selector 본선/대체 selector 동시 업데이트
- 핵심 필드(제목, 링크, 마감일) 3개 중 2개 이상 누락 또는 원본중복 급증 시 경고
- `in-run dedupe`는 `original_id` 우선, URL/제목 보조로 정합성 유지

- 데이터 급락
- 직전 24시간 대비 50% 이상 하락 시 경보

- 403/429/타임아웃은 `low_quality_data_rate`와 구분되는 별도 경보 코드로 분리해 분석 속도 향상
- 연구 반영형 운영 룰(실전 튜닝):
  - `http_429_rate_limit` 또는 `http_403_rate_limit` 반복 플랫폼은 동일 플랫폼 1:1 병렬 재시도 대신 45~90분 쿨오프 후 보강 실행을 1~2회 수행.
  - `low_valid_item_rate`는 재수집 실패로 간주하지 않고 파서 점검 플로우(`selector`/`normalization`)로 분류.
  - `no_upserted_items`는 수집 소스 점검 신호로 보고, 1시간 뒤 샘플 1페이지만 보강하고 즉시 전체 수집으로 복구하지 않음.
  - 중복 제거율이 40% 이상이면 해당 페이지 구간은 정지하고 `quality_gate` 태그로 운영 큐에 남김.

## 10. 연구 반영형 수집 전략(리스크 낮은 고도화 모드)

- 목적: 실패 유형을 구분해 일괄 중단이 아니라 회복 가능한 실행만 반복하도록 한다.
- 핵심 적용:
  - 상태코드 기반 fetch 재시도 + retry-after 반영
  - run 로그에 fetch 실패, 처리 실패, 중복 건수 분리 저장
  - `campaignUrl` 폴백과 upsert/snapshot 트랜잭션 처리로 partial write 축소
  - 플랫폼 단위 지수 재시도(5~90분)로 과도한 동시 재실행 완화

- 실행 순서:
  1. 3개 연속 fetch 실패 감지 시 해당 플랫폼 run 종료
  2. `valid rate` 저하와 selector 누락을 분리해 경보 라벨링
  3. 동일 플랫폼은 1~2시간 내 2회 보강 실행으로 공백 보정
  4. 운영 runbook에서 원인 코드 기반 대응 템플릿 사용

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
