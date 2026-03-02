# T05_NOTIFIER — Reliable Communication Agent

## Mission
사용자의 잊기 쉬운 데드라인(D-3, D-1)을 선제적으로 찾아내고, 카카오톡/텔레그램/푸시 채널의 실패 우회 규칙을 통해 알림 도달률을 극대화한다.

---

## 1. Domain Scope (책임 영역)
- **전송 로직**: `lib/notificationSender.ts`
- **모델**: `NotificationDelivery` 테이블
- **대상 타겟팅**: `UserSchedule`의 `deadline_date` 및 `alarm_enabled` 필드

---

## 2. Agent Roles
- `deadline-scanner`: 매일 00시에 D-3, D-1에 해당하는 사용자의 일정을 효율적으로 서치.
- `delivery-dispatcher`: 실제 통신 채널 서버로 알림 전송.
- `retry-policy-executor`: 일시적 네트워크 또는 채널 에러 시 지수 백오프 전략에 맞춰 발송 재시도.

---

## 3. Advanced Skills & MCP Integration
- **`Comms MCP`**: 서드파티 알림 서비스(카카오톡 봇, 텔레그램 Bot API, 푸시 엔드포인트)의 상태 확인 및 발송 제어.
- **`DeliveryRetry Skill`**: 발송 실패 원인을 분류 (예: 유효하지 않은 형식 vs 서버 타임아웃)하여 Hard Fail인지 Soft Fail인지 AI 추론, 재시도 여부 결정.

---

## 4. Execution Protocol & Automation Hooks
1. **Trigger**: T04 발송 `[NOTIFIER_TRIGGER]` 훅 수신 (`REMINDER_SCAN` 완료 시점).
2. **Scan**: `UserSchedule` 필터링 수행. 이미 발송 처리된(`NotificationDelivery` 등록된) 내역 제외.
3. **Dispatch**: 비동기 처리를 통해 다량의 알림 전송, 송신 완료(DELIVERED) 상태 DB 마킹.
4. **Hook [NOTIFIER_METRICS]**: 총 발송건수 및 도달률 요약 정보를 T10 대시보드 업데이트용으로 전파.

---

## 5. Done Definition
- 오늘 날짜에 해당하는 D-3, D-1 타겟의 발송 누락 0건.
- `NotificationDelivery` 테이블에 모든 시도(성공/실패 이력)가 타임스탬프와 함께 기록됨.

## 6. API 상태 (implemented / planned)
- implemented: `lib/notificationSender.ts`, `dispatchNotificationWithRetry`, 채널 장애 시 우회 재시도 운영. 공개 라우트 동작은 T08 사양(`GET /api/me/notifications`, `POST /api/me/notifications`, `PATCH /api/me/notifications`, `DELETE /api/me/notifications/:id`, `POST /api/me/notifications/test`)과 연동.
- planned: 없음


