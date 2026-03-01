# Notes — Agent Queue

> ⚠️ **이 문서는 Team-Agent 아키텍처 전환으로 이관되었습니다.**
>
> 모든 잡 큐 및 알림 워크플로우 명세는 아래 팀 문서에서 관리됩니다:
>
> - `GET /api/cron?runNow=true (runNow=true, limit=6)`, `GET /api/cron` → **[T04_WORKER](./teams/T04_WORKER.md) § API Reference**
> - BackgroundJob 잡 타입 및 상태 전이 → **[T04_WORKER](./teams/T04_WORKER.md) § Job Types**
> - `NotificationDelivery` 워크플로우 → **[T05_NOTIFIER](./teams/T05_NOTIFIER.md)**
> - D-1/D-3 알림 리마인더 → **[T05_NOTIFIER](./teams/T05_NOTIFIER.md) § Notification Types**
> - `GET /api/me/revenue` → **[T08_MANAGER](./teams/T08_MANAGER.md) § API Reference**

