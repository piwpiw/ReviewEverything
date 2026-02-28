# API Reference

> ⚠️ **이 문서는 Team-Agent 아키텍처 전환으로 이관되었습니다.**
>
> 각 API 엔드포인트는 담당 팀 문서에서 관리됩니다:
>
> | 엔드포인트 | 담당 팀 | 문서 위치 |
> |---|---|---|
> | `GET /api/campaigns` | T03_DATABASE | [T03_DATABASE](./teams/T03_DATABASE.md) § Tasks |
> | `GET /api/analytics` | T06_ANALYTICS | [T06_ANALYTICS](./teams/T06_ANALYTICS.md) § API Reference |
> | `POST /api/jobs` | T04_WORKER | [T04_WORKER](./teams/T04_WORKER.md) § API Reference |
> | `GET /api/cron` | T04_WORKER | [T04_WORKER](./teams/T04_WORKER.md) § API Reference |
> | `POST /api/admin/ingest` | T04_WORKER | [T04_WORKER](./teams/T04_WORKER.md) § API Reference |
> | `GET /api/me/revenue` | T08_MANAGER | [T08_MANAGER](./teams/T08_MANAGER.md) § API Reference |
> | `GET/POST /api/me/schedules` | T08_MANAGER | [T08_MANAGER](./teams/T08_MANAGER.md) § API Reference |
> | `PATCH/DELETE /api/me/schedules/[id]` | T08_MANAGER | [T08_MANAGER](./teams/T08_MANAGER.md) § API Reference |
> | `GET /api/health` | T10_OBSERVABILITY | [T10_OBSERVABILITY](./teams/T10_OBSERVABILITY.md) § Scope |
>
> - 보안 미들웨어 (`middleware.ts`, Basic Auth, `/admin/*` 보호) → `T09_VALIDATION § Tools`
> - 캐싱 전략 (`s-maxage`, `stale-while-revalidate`) → `T06_ANALYTICS § Caching Strategy`
> - API 응답 계약 (`data`, `meta`, `error`) → `ARCHITECTURE.md § System-wide Invariants`
