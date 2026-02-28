# T04_WORKER — Async Job Automation Agent

## Mission
단일 서버 쓰레드 차단 방지를 위한 내구성 잡 대기열 (BackgroundJob)을 운영하며, Failed 작업의 회복(Self-Healing)을 자율적으로 통제한다.

---

## 1. Domain Scope (책임 영역)
- **워커 런타임**: `lib/backgroundWorker.ts`
- **잡 스케줄링 API**: `POST /api/jobs`, `GET /api/cron`
- **관리자 트리거**: `POST /api/admin/ingest`
- **모델**: `BackgroundJob` 테이블 (`INGEST_PLATFORM`, `REMINDER_SCAN` 등)

---

## 2. Agent Roles
- `job-enqueuer`: 동시 다발적 요청을 트랜잭셔널하게 큐에 병합 (PENDING).
- `lock-manager`: 분산/동시 실행 환경에서 중복 처리 방지를 위한 Mutex/Row 잠금 전략 운영.
- `failure-reporter`: FAILED 처리된 잡을 분석하여 벤오프(지수 지연) 후 PENDING 재예약.

---

## 3. Advanced Skills & MCP Integration
- **`JobScheduling Skill`**: 크론이나 특정 트리거 지연, 배치 한도(`limit=6`)를 메모리 부하에 맞춰 자율 조절.
- **`QueueTelemetry MCP`**: 잡 큐의 처리량(Throughput) 및 체류 시간(Latency) 실시간 모니터링, 병목 감지 시 오케스트레이터에 통보.

---

## 4. Execution Protocol & Automation Hooks
1. **Trigger**: 주기적 `/api/cron` 호출 또는 수동 API 요청 수신.
2. **Execute**: `BackgroundJob` 레코드 PENDING 발급. `POST /api/jobs` 병렬로 워커 가동.
3. **State Machine**: `PENDING -> RUNNING -> DONE/FAILED`.
4. **Hook [NOTIFIER_TRIGGER]**: `REMINDER_SCAN` 잡이 DONE 도달 시, 즉각적으로 T05_NOTIFIER 프로세스를 활성화.
5. **Auto-Recovery**: 연속 FAILED 상태 에러 메시지 분석 시, T10에 디버그 티켓 자동 전송.

---

## 5. Done Definition
- 큐에 남은 좀비(ZOMBIE) 상태 잡 없음. 제한된 limit 내 배치 작업 완료.
- 잡 처리 과정에서 예외가 크래시되지 않고 상태 업데이트로 정상 캡처됨.
