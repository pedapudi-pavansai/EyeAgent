# Diligence worker — operations

_Keystone · CSB Tech Day Hackathon codebase._

## Health checks

- **Queue depth**: count rows with `diligence_status = 'queued'` on `applications`.
- **Failures**: spike in `diligence_status = 'failed'` or repeated `diligence_error` patterns.
- **Stuck runs**: rows in `running` older than the reconciliation window (~15 minutes) should be flipped to `failed` on the next worker tick; if they persist, investigate worker/cron availability.

## Vercel

- Cron schedule: [`vercel.json`](../vercel.json) hits `/api/cron/diligence-worker` every minute.
- Ensure the deployment has `GOOGLE_API_KEY`, screening env (if not using stub), and that the worker route’s `maxDuration` (see `app/api/cron/diligence-worker/route.ts`) is sufficient for your slowest vendor + LLM path.

## Logs

Log **order ids and statuses** only; avoid logging full screening payloads or SSNs in application logs.
