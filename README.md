# Keystone

**CSB Tech Day Hackathon** project.

<div align="center">

```
██╗  ██╗███████╗██╗   ██╗███████╗████████╗ ██████╗ ███╗   ██╗███████╗
██║ ██╔╝██╔════╝╚██╗ ██╔╝██╔════╝╚══██╔══╝██╔═══██╗████╗  ██║██╔════╝
█████╔╝ █████╗   ╚████╔╝ ███████╗   ██║   ██║   ██║██╔██╗ ██║█████╗
██╔═██╗ ██╔══╝    ╚██╔╝  ╚════██║   ██║   ██║   ██║██║╚██╗██║██╔══╝
██║  ██╗███████╗   ██║   ███████║   ██║   ╚██████╔╝██║ ╚████║███████╗
╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝   ╚═╝    ╚═════╝ ╚═╝  ╚═══╝╚══════╝
```

**Independent landlords. Professional-grade workflows.**

</div>

---

## Run locally

1. **Install dependencies** (Next.js app lives in `app/`):

   ```bash
   cd app && npm install
   ```

2. **Environment:** copy `app/.env.example` to `app/.env.local` and fill in values (Supabase + `GOOGLE_API_KEY` minimum).

3. **Start dev** — from the **repository root**:

   ```bash
   npm run dev
   ```

   Or from `app/`: `npm run dev` → [http://localhost:3000](http://localhost:3000).

4. **Database:** apply SQL migrations in order under `app/supabase/migrations/` (see [`app/README.md`](./app/README.md)).

---

## Deploy to Vercel

1. **New project** → Import this Git repository.
2. **Root Directory:** set to **`app`** (required so Next.js, `app/vercel.json` crons, and `package-lock.json` resolve correctly).
3. **Framework preset:** Next.js (auto-detected).
4. **Build & install:** leave defaults (`npm run build`, `npm install`).
5. **Node.js:** 20.x (optional: enable “Use Node version from `.nvmrc’” — file is in `app/.nvmrc`).
6. **Environment variables:** add the same keys as `app/.env.example` in **Project → Settings → Environment Variables** (Production + Preview). Set `NEXT_PUBLIC_APP_URL` to your Vercel URL (e.g. `https://your-project.vercel.app`).
7. **Cron:** `app/vercel.json` schedules `/api/cron/diligence-worker` — ensure **`CRON_SECRET`** is set if your worker checks it.

Full setup detail: **[`app/README.md`](./app/README.md)**. Architecture and features: this file below.

---

> **Note:** The repo root `package.json` only forwards scripts into `app/` (`npm run dev`, `npm run build`, …). Dependencies are installed under **`app/`**.

---

## What Keystone is

Keystone is a full-stack **Next.js** application backed by **Supabase** (Postgres, Auth, Row-Level Security, Storage). It gives solo landlords:

- A **portfolio dashboard** and property detail views (applications, service, diligence).
- **Shareable, token-gated application links** for applicants without accounts.
- A **deterministic applicant score** (0–100) plus templated insights at submit time—auditable, not generative.
- **Investment marketplace** listings with **Google Gemini**–driven fit tags (Strong Match / Consider / Avoid) against the landlord’s financial profile.
- **Deep diligence**: a **LangGraph** pipeline that pulls normalized screening data, runs **deterministic affordability math**, then uses **Gemini** for financial narrative, risk narrative, and a merged structured report—executed **asynchronously** via a queue + cron worker.

The product deliberately **separates** “must be explainable in court / to a tenant” (deterministic scoring) from “synthesis and preference matching” (LLMs).

---

## Architecture at a glance

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                         BROWSER (React 19)                               │
│   Server Components · Client islands · Tailwind · Radix                  │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    NEXT.JS 16 (APP ROUTER)                               │
│   Route handlers · Server Actions · Middleware/proxy · Cron routes       │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    SUPABASE     │    │  DETERMINISTIC  │    │   GOOGLE AI     │
│  Postgres+RLS   │    │  SCORING ENGINE │    │  Gemini (GenAI) │
│  Auth · Storage │    │  (no LLM)       │    │  via LangChain  │
└─────────────────┘    └─────────────────┘    └────────┬────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │   LANGGRAPH     │
                                              │ Diligence graph │
                                              └─────────────────┘
```

---

## LangGraph × Gemini: diligence pipeline

**Full diligence** is separate from the fast score. A landlord enqueues work; a **background worker** runs a **compiled LangGraph** (`@langchain/langgraph`) so the HTTP path stays fast.

**Gemini** is invoked through **`@langchain/google-genai`** (`ChatGoogleGenerativeAI`) in three nodes: **financial** analysis, **risk** analysis, and **merge** into a validated JSON report. Screening vendor data and **deterministic** rent/income math feed those prompts.

### Control flow (simplified)

```text
     START
       │
       ▼
 ┌─────────────┐     ┌──────────────┐     ┌─────────────────────┐
 │ loadContext │ ──► │  screening   │ ──► │ computeDeterministic │
 └─────────────┘     │ vendor+parse │     │  rent/DTI math       │
                     └──────────────┘     └──────────┬──────────┘
                                                     │
       ┌─────────────────────────────────────────────┘
       │
       ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ financial    │ ──► │ risk         │ ──► │ mergeReport  │
│ Agent        │     │ Agent        │     │ (Gemini)     │
│ (Gemini)     │     │ (Gemini)     │     │              │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                                                  ▼
                                                END
```

Sub-agents consume **normalized screening payload** + **deterministic fit**; the merge node produces the persisted **`diligence_report`**. Failures surface as job errors; reconciliation handles stuck `running` rows. Deeper node-level docs: [`app/docs/DILIGENCE_LANGGRAPH.md`](./app/docs/DILIGENCE_LANGGRAPH.md).

---

## Deterministic scoring (applicant screening estimate)

When an application is submitted, Keystone computes an **`ai_score` from 0–100** using **fixed weights and thresholds**—no LLM. The intent is **consistency, auditability, and defensibility** for a high-stakes decision.

```text
                    ┌──────────────────────────────────────┐
                    │     APPLICANT SCORE (0 ─────── 100)   │
                    └──────────────────────────────────────┘
                                        ▲
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
             ┌──────┴──────┐     ┌──────┴──────┐     ┌──────┴──────┐
             │ AFFORDABILITY│     │    FICO     │     │    DEBT     │
             │   vs rent    │     │    band     │     │  vs income  │
             │   (weight)   │     │  (weight)   │     │  (weight)   │
             └─────────────┘     └─────────────┘     └─────────────┘
                    │                   │                   │
                    └───────────────────┼───────────────────┘
                                        │
                                 ┌──────┴──────┐
                                 │   RENTAL   │
                                 │  HISTORY   │
                                 │  (weight)  │
                                 └────────────┘
```

**Dimensions** (implementation: `app/lib/screening/estimate-applicant.ts`):

| Pillar | Role |
|--------|------|
| **Affordability** | Income vs listed rent |
| **FICO band** | Self-reported credit tier |
| **Debt load** | Monthly obligations vs gross monthly income |
| **Rental history** | Signals from prior addresses on the application |

The engine emits **templated insight lines** (not free-form hallucination) so the UI can show green / amber / red bands with readable explanations.

---

### ASCII “multi-agent” view

```text
   ┌─────────────────────────────────────────────────────────────┐
   │                    LANGGRAPH STATE                            │
   │  vendor report · deterministic metrics · agent text slices    │
   └─────────────────────────────────────────────────────────────┘
          │                              │
          │         ┌────────────────────┼────────────────────┐
          │         │                    │                    │
          ▼         ▼                    ▼                    ▼
    ┌──────────┐ ┌──────────┐      ┌──────────┐        ┌──────────┐
    │ FINANCIAL│ │   RISK   │      │  MERGE   │        │ Postgres │
    │  GEMINI  │ │  GEMINI  │ ───► │  GEMINI  │ ─────► │ diligence│
    │  NODE    │ │  NODE    │      │  NODE    │        │  report  │
    └──────────┘ └──────────┘      └──────────┘        └──────────┘
```

---

## Gemini elsewhere: marketplace personalization

For **investment listings**, Keystone uses **Gemini** (via LangChain) to tag each listing against the landlord’s **targets and profile**—IRR appetite, income, debt, preferred markets, and property types—yielding **Strong Match / Consider / Avoid** plus a short thesis. That is **judgment and synthesis**, not a binary credit decision—so it stays in the LLM layer.

---

## Security & data model

- **Row-Level Security** on Supabase enforces isolation for landlords, applicants, and tenants.
- **Application links** use **expiring tokens** scoped to a property; submission paths are validated server-side.
- **Diligence** enforces single-success and non-overlapping runs per business rules documented in [`app/docs/DILIGENCE.md`](./app/docs/DILIGENCE.md).

---

## Stack (summary)

| Layer | Technology |
|-------|------------|
| App | Next.js 16, App Router, TypeScript, React 19 |
| UI | Tailwind CSS, Radix UI, React Hook Form, Zod |
| Data | Supabase (Postgres, Auth, RLS) |
| Maps | Leaflet / React Leaflet |
| Applicant score | Deterministic algorithm (no LLM) |
| Marketplace AI | Google Gemini via LangChain |
| Diligence | LangGraph + Gemini sub-agents + screening adapters |
| Tests | Vitest |

---

## Repository layout (high level)

```text
landlord/
├── README.md                 ← you are here (overview index at repo root)
└── platform/
    ├── README.md             ← this file (technical overview)
    └── app/                  ← Next.js application
        ├── README.md         ← install, env, migrations, npm run dev
        ├── app/              ← routes, API, UI
        ├── lib/              ← Supabase clients, AI, diligence graph, screening
        └── supabase/         ← SQL migrations & seeds
```

---

## Next steps

- **Run locally:** [`app/README.md`](./app/README.md)
- **Diligence behavior:** [`app/docs/DILIGENCE.md`](./app/docs/DILIGENCE.md) and [`app/docs/DILIGENCE_LANGGRAPH.md`](./app/docs/DILIGENCE_LANGGRAPH.md)
