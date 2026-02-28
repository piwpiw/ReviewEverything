### Worker/Manager/Parsing Fast-Track Progress (2026-02-28)

- Queue/Worker Track:
  - Cron route now supports queue-only mode by default.
  - Add `runNow=true` query when immediate run is required.
  - Job execution path moved to shared worker runner with lock + retry.

- Notification Track:
  - Added `lib/notificationSender.ts` with channel adapters (`push`, `kakao`).
  - Reminder scan now creates `NotificationDelivery` rows and dispatch pass marks SEND/FAILED.

- Parser Track:
  - Added regression tests for `normalizeRewardValue` covering 만원/천원/원/fallback.
  - Next: harden by adding mixed-unit fixtures in a dedicated parser fixture file if needed.

- Execution Efficiency Track:
  - Added claude.md with token policy, MCP search policy, and naming requirements.
  - Added reusable gate automation for PR/build quality checks:
    - 
pm run agent:review => lint + typecheck + test:ci
    - 
pm run agent:qa => lint + typecheck + test:ci + smoke:ci + build
  - Reports are generated at apps/web/reports/agent-<mode>-summary.md

