# Keystone — web application

**CSB Tech Day Hackathon** submission.

**Product and architecture overview:** see **[`../README.md`](../README.md)** (LangGraph × Gemini, deterministic scoring, stack).

This document is **only** how to install dependencies, configure Supabase and AI keys, apply migrations, and **run the platform locally**.

---

## Prerequisites

- **Node.js 18+**
- A **Supabase** project (Postgres + Auth + API keys)
- A **Google AI** API key for Gemini (marketplace recommendations + LangGraph diligence nodes)

---

## 1. Install dependencies

From this directory (`platform/app`):

```bash
npm install
```

---

## 2. Environment variables

Create **`.env.local`** in `platform/app/` (same folder as `package.json`):

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GOOGLE_API_KEY=your_google_ai_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

| Variable | Where to get it |
|----------|------------------|
| Supabase URL & keys | Supabase dashboard → **Project Settings → API** |
| `GOOGLE_API_KEY` | [Google AI Studio](https://aistudio.google.com) |

**Notes**

- **Marketplace AI** and **diligence LangGraph** nodes require `GOOGLE_API_KEY`. Without it, those features fail at runtime.
- **Applicant screening score** on submit uses the **deterministic** estimator in `lib/screening/`—no Gemini for that path.

---

## 3. Database: migrations and seed

In the Supabase dashboard, open the **SQL Editor** and run every file under `supabase/migrations/` **in numeric order** (paths relative to `platform/app/`):

`001_initial_schema.sql` → `002_applications_rls_and_policies.sql` → … through `010_application_tokens_select_policy.sql` (or whatever the latest `NNN_*.sql` is in your checkout).

Then run `supabase/seed.sql` if you want seeded marketplace listings.

---

## 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Useful scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server (after build) |
| `npm run lint` | ESLint |
| `npm test` | Vitest |

---

## Project structure (abbreviated)

```text
app/
├── app/
│   ├── (auth)/              # login, register
│   ├── (landlord)/          # dashboard, onboarding, marketplace, properties
│   ├── (tenant)/portal/     # tenant portal
│   ├── apply/[property_id]/ # public application (token-gated)
│   └── api/
│       ├── ai/              # score-applicant, recommend
│       ├── applications/    # submit, generate-link, accept, reject
│       ├── diligence/       # start full diligence
│       ├── cron/            # e.g. diligence worker
│       └── ...
├── lib/
│   ├── supabase/
│   ├── screening/           # deterministic applicant score
│   ├── diligence/           # LangGraph + Gemini agents
│   └── ai/                  # Gemini config, marketplace chain
├── components/
└── supabase/                # migrations, seed
```

For **API behavior** (diligence rules, scoring vs LLM), use **[`../README.md`](../README.md)** and `docs/` inside this app.

---

## Production deployment

Deploy to **Vercel** (or any Node host). Mirror all `.env.local` variables in the host’s environment. Set `NEXT_PUBLIC_APP_URL` to your production URL.

```bash
vercel --prod
```

---

## Quick demo

1. Register at `/register`, complete onboarding.  
2. From a property card, **Copy App Link** and open it in an incognito window to submit a test application.  
3. Open the property modal to see the **deterministic score** and flows described in the main README.
