# Tenant diligence pipeline

_Keystone · CSB Tech Day Hackathon codebase._

This document describes how **full diligence** works in Keystone. It is separate from the **fast score** (`ai_score` / `ai_insights`), which is computed synchronously from application data.

## Overview

1. A landlord enqueues diligence for an application via `POST /api/diligence/start`.
2. The application row moves to `diligence_status = queued` with `diligence_queued_at` set.
3. A background worker (`/api/cron/diligence-worker`) claims queued rows, sets `running`, then runs a **LangGraph** pipeline (`lib/diligence/graph/`) that:
   - Calls the configured **screening provider** (stub or HTTP vendor adapter); see also [`docs/SCREENING_VENDOR.md`](SCREENING_VENDOR.md).
   - Normalizes the vendor payload to `NormalizedScreeningReport` (see `lib/diligence/schema.ts`).
   - Computes **deterministic** rent/income metrics (`lib/diligence/deterministic.ts`).
   - Runs **financial** and **risk** Gemini sub-agents, then a **merge** step into structured `diligence_report` JSON (`lib/diligence/agents/`).

For **node-level detail**, see [`docs/DILIGENCE_LANGGRAPH.md`](DILIGENCE_LANGGRAPH.md).
4. On success: `diligence_status = complete`, `diligence_completed_at`, `diligence_report` populated.
5. On failure: `diligence_status = failed`, `diligence_error` set; landlord may **retry** (re-queues).

**Rules**

- **One successful diligence per application**: while `diligence_status = complete`, starting again returns `409`.
- **No overlapping runs on the same application**: while `queued` or `running` on that row, starting again returns `409`.
- **One inflight run per landlord**: you cannot queue diligence for a second application while any other application on your properties is already `queued` or `running` (`409` with `diligence_inflight`).
- **Immediate worker kick**: after a successful enqueue, `POST /api/diligence/start` schedules `processNextDiligenceJob()` via Next.js `after()`, so you are not limited to the cron schedule for the first processing attempt (cron still helps drain the queue and retries).
- **Stuck jobs**: rows in `running` for longer than 15 minutes are marked `failed` by the worker reconciliation step so they can be retried.

## Environment variables

| Variable | Purpose |
|----------|---------|
| `GOOGLE_API_KEY` | Required for Gemini synthesis. |
| `SCREENING_PROVIDER` | Optional: `stub` (default when no vendor keys) or `backgroundchecks`. |
| `SCREENING_API_BASE_URL` | Vendor API base (e.g. sandbox URL). |
| `SCREENING_API_TOKEN` | Vendor API token. |
| `SCREENING_ORDER_PATH` | Optional override for create-order path (default `/v1/screening_orders`). |
| `SCREENING_ORDER_STATUS_PATH` | Optional override for order status path (default `/v1/screening_orders`). |
| `CRON_SECRET` | For **local** or **non-Vercel** worker invocations: send `Authorization: Bearer <secret>` or `x-cron-secret`. |
| `DILIGENCE_CONSENT_REQUIRED` | If `true`, `POST /api/diligence/start` requires `applications.screening_consent_at` to be set (migration `004_screening_consent.sql`). Default: unset / false for dev. |

On **Vercel**, scheduled Cron calls include `x-vercel-cron: 1` and are accepted without `CRON_SECRET`.

The worker route sets `maxDuration = 300` seconds to allow vendor polling plus multiple Gemini calls. See [`docs/MONITORING.md`](MONITORING.md) for operational checks.

## Screening providers

### Stub (default)

No external keys. Returns deterministic normalized flags so the pipeline and UI can be tested end-to-end.

### BackgroundChecks-style HTTP

Set `SCREENING_PROVIDER=backgroundchecks` and provide `SCREENING_API_BASE_URL` + `SCREENING_API_TOKEN`. The client in `lib/diligence/providers/backgroundchecks.ts` uses configurable paths; **adjust paths and JSON mapping** to match your vendor contract (sandbox vs production).

## Database

Migrations `003_diligence.sql` and `004_screening_consent.sql` add diligence columns and optional `screening_consent_at` on `applications`. Apply with Supabase CLI or dashboard.

## Local development

1. Apply migrations and ensure `GOOGLE_API_KEY` is set.
2. Start the app (`npm run dev`).
3. Enqueue diligence from the UI (`/diligence`).
4. Process the queue by calling the worker (Cron runs every minute on Vercel; locally run manually):

```bash
curl -s -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/diligence-worker
```

If `CRON_SECRET` is unset locally, pass a value and set the same in `.env.local`.

## Compliance

Full diligence may involve **consumer reports** and **fair housing** obligations. This implementation is **not legal advice**. Production use requires appropriate **disclosures**, **permissible purpose**, and **adverse action** flows where applicable—coordinate with counsel before enabling real applicant data with a live vendor.

**Engineering checklist (non-exhaustive):** obtain legal sign-off; use `DILIGENCE_CONSENT_REQUIRED` + `screening_consent_at` when you need a recorded consent gate; document applicant-facing disclosure copy outside this repo as required by your counsel.
