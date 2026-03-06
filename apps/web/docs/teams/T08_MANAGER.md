# T08_MANAGER — Manager Workflow Agent

## Mission
단순한 API CRUD를 제공하는 것을 넘어, 사용자의 캠페인 일정, 수익 실적 데이터 등 프라이빗한 개인화 기능을 통합 인증 체계(Auth MCP) 위장 하에 안전하게 처리한다.

---

## 1. Domain Scope (책임 영역)
- **라우팅/API (implemented)**: `/api/me/revenue`, `/api/me/board`, `/api/me/pro`, `POST /api/me/pro`, `/api/me/curation`, `GET /api/me/schedules`, `POST /api/me/schedules`, `PATCH /api/me/schedules/:id`, `DELETE /api/me/schedules/:id`, `GET /api/me/notifications`, `POST /api/me/notifications`, `PATCH /api/me/notifications`, `DELETE /api/me/notifications/:id`, `POST /api/me/notifications/test`, `/api/me/notification-channels`, `/api/me/notification-preferences`
- **라우팅/API (planned / 미구현)**: 없음
- **화면(UI 종속)**: `app/me/`, `ManagerDashboard.tsx`
- **데이터 모델**: `User`, `UserSchedule`

---

## 2. Agent Roles
- `schedule-crud-agent`: 사용자 마감일, 방문 날짜, 리워드 등 개별 데이터 레코드 읽기/쓰기/수정/삭제 관리.
- `revenue-aggregator`: 캠페인 별 협찬 수익(`sponsorship_value`)과 원고료 수익(`ad_fee`)의 월/연 단위 고속 집계.
- `auth-bridge`: 임시 `x-user-id` 헤더 인증과 향후 Real-Auth 메커니즘 간의 매핑 보안 담당.

---

## 3. Advanced Skills & MCP Integration
- **`Auth / Identity MCP`**: 향후 OAuth(Kakao/Google) 세션 트랜잭션을 분석하거나 권한 분리(ACL)를 위한 외부 IAM과 통신.
- **`RevenueForecast Skill`**: 사용자의 월 초중반 승인 액수를 바탕으로 이번 달 예상 총 수입액을 선형 회귀 AI로 자동 예측하여 리포액팅.
- **`ScheduleConflict Skill`**: 방문일(`visit_date`)이 타 캠페인 일정과 너무 가깝거나 물리적 위치(좌표)상 비현실적인 동선일 경우 캘린더 경고를 발생.

---

## 4. Execution Protocol & Automation Hooks
1. **Trigger**: API 호출 즉시 헤더에서 User 컨텍스트 파싱.
2. **Action**: CRUD 처리 및 금액 롤링 통계 테이블 갱신 유도.
3. **Hook [USER_ACTIVITY_DETECTED]**: 사용자가 매니저 액션을 행한 시점, T06/T10에 유저 활성 지표(MAU/DAU) 기록 트리거 전달.
4. **Integration**: `deadline_date` 및 `alarm_enabled` 필드 조작 즉시 `[SCHEDULE_UPDATED]` 이벤트를 발송하여 T05_NOTIFIER 스캐너가 참조하도록 지연 동기화.

---

## 5. Done Definition
- 구현된 매니저 API 호출은 인증 가드(또는 임시 Auth)의 보호를 받음.
- 어그리게이션 연산(월매출 계산 등)이 O(N)에서 벗어나 충분히 빠르거나 캐싱됨.
- ManagerDashboard 페이지 진입 시 깜빡임이나 서버 에러(500) 없이 1초 내로 렌더링.

## 6. API 상태 (implemented / planned)
- implemented: `/api/me/revenue`, `/api/me/board`, `/api/me/pro`, `POST /api/me/pro`, `/api/me/curation`, `GET /api/me/schedules`, `POST /api/me/schedules`, `PATCH /api/me/schedules/:id`, `DELETE /api/me/schedules/:id`, `GET /api/me/notifications`, `POST /api/me/notifications`, `PATCH /api/me/notifications`, `DELETE /api/me/notifications/:id`, `POST /api/me/notifications/test`, `/api/me/notification-channels`, `/api/me/notification-preferences`
- planned: 없음




## 7.7 화면 연동 규칙 (UI 공용)

- 매니저 화면(`/me`, `/me/calendar`, `/me/stats`, `/me/revenue`)의 UX는 `T07_FRONTEND`와 라벨/문구 체계를 공유한다.
- 새 CTA/에러 문구는 `T07_FRONTEND`에서 제안하고 T10의 운영 라벨 톤과 충돌하지 않도록 사전 동기화.
- `/me`/`/me/calendar`/`/me/notifications` 화면은 구현된 알림/일정 API를 우선 사용하고, 미구현 API 진입은 차단한다.


