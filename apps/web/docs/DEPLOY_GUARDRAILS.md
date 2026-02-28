# Deploy Guardrails

## Smoke Targets
After deployment, probe:
- `/`
- `/campaigns`
- `/admin`
- `/api/health`

## Pass Criteria
- Page routes return status `2xx` or `3xx`.
- `/api/health` returns `200` (or `503` only when DB outage is known and acknowledged).

## Rollback Trigger Conditions
Trigger rollback when any condition is true:
- Two consecutive smoke runs fail for the same endpoint.
- `/api/health` is non-responsive (timeout/error) for more than 3 minutes.
- Home or campaigns route returns `5xx` after deployment.

## Operational Notes
- Smoke script is `scripts/smoke.js`.
- CI consumes `SMOKE_BASE_URL` (or `VERCEL_URL`) for target base URL.
- Attach `reports/smoke.json` to incident/rollback record.
