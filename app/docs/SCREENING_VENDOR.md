# Third-party screening vendor integration

_Keystone · CSB Tech Day Hackathon codebase._

This app uses a pluggable **screening provider** (`lib/diligence/providers/`). The default HTTP implementation targets a **BackgroundChecks.com / ClearChecks-style** REST API; paths and payloads are **configurable** because each vendor contract differs.

## Environment

| Variable | Description |
|----------|-------------|
| `SCREENING_PROVIDER` | `stub` (no network) or `backgroundchecks` |
| `SCREENING_API_BASE_URL` | Base URL, e.g. vendor sandbox `https://sandbox.backgroundchecks.com/api` |
| `SCREENING_API_TOKEN` | API token (often passed as `api_token` query param; see vendor docs) |
| `SCREENING_ORDER_PATH` | POST path to create an order (default `/v1/screening_orders`) |
| `SCREENING_ORDER_STATUS_PATH` | GET path prefix for order status (default `/v1/screening_orders`) |

If `SCREENING_API_BASE_URL` and `SCREENING_API_TOKEN` are set but `SCREENING_PROVIDER` is unset, the factory may select the HTTP provider (see `getScreeningProvider()`).

## Mapping responses

Implementers should adjust `mapToNormalized()` in [`lib/diligence/providers/backgroundchecks.ts`](../lib/diligence/providers/backgroundchecks.ts) so vendor JSON maps to `NormalizedScreeningReport` in [`lib/diligence/schema.ts`](../lib/diligence/schema.ts).

Do **not** log full PII or raw reports in application logs; log `order_id` and status only.

## Sandbox end-to-end (manual)

1. Obtain sandbox credentials from the vendor.
2. Set env in `.env.local` and `SCREENING_PROVIDER=backgroundchecks`.
3. Run the app; open `/diligence`, enqueue **Run full diligence** for an application.
4. Trigger the worker: `curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/diligence-worker` (or wait for Vercel Cron).
5. Confirm `diligence_status` becomes `complete` and `diligence_report` is populated.

Automated CI typically uses `SCREENING_PROVIDER=stub` to avoid network calls.
