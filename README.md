# EyeAgent

> AI-powered property intelligence platform that helps independent landlords screen tenants, evaluate investments, and automate rental decision making.

![EyeAgent Dashboard]


---

## Overview

EyeAgent is a full-stack property management platform that combines deterministic applicant screening with multi-agent AI workflows to streamline rental operations.

The platform enables landlords to manage portfolios, evaluate applicants, analyze investment opportunities, and generate comprehensive tenant diligence reports through an explainable AI pipeline.

Unlike traditional AI-first platforms, EyeAgent separates deterministic decision making from LLM reasoning, ensuring applicant evaluations remain transparent while leveraging AI for financial analysis, risk assessment, and investment recommendations.

---

## Features

- 🏠 Portfolio and property management dashboard
- 📄 Secure tenant application workflow
- 📈 Deterministic applicant scoring engine
- 🤖 Multi-agent AI diligence pipeline
- 💰 AI-powered investment marketplace recommendations
- 📊 Financial and risk analysis reports
- 🔐 Secure authentication with Supabase Row-Level Security

---

## Architecture

```text
                   Applicant
                       │
                       ▼
                Next.js Platform
                       │
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
    Supabase      Scoring Engine   Gemini AI
         │             │             │
         └─────────────┼─────────────┘
                       ▼
              LangGraph Agent Pipeline
                       │
                       ▼
             Diligence Report Generator
```

---

## Tech Stack

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS
- Radix UI

### Backend
- Supabase
- PostgreSQL
- LangGraph
- LangChain

### AI
- Google Gemini
- Deterministic Applicant Scoring
- Multi-Agent Workflow

### Infrastructure
- Vercel
- Supabase
- Background Cron Workers

---

## System Design

EyeAgent uses a hybrid decision-making architecture.

Applicant qualification is calculated through a deterministic scoring engine using affordability, debt-to-income ratio, credit profile, and rental history. Once eligibility is established, specialized AI agents generate financial summaries, risk assessments, and comprehensive diligence reports.

This separation ensures high-stakes decisions remain transparent and auditable while allowing language models to synthesize complex financial information.

---

## Repository Structure

```text
app/
├── app/
├── components/
├── lib/
├── supabase/
├── docs/
└── public/
```

---

## Running Locally

```bash
npm install
npm run dev
```

Application:

```
http://localhost:3000
```

---

## Future Improvements

- AI lease generation
- Maintenance request automation
- Rent payment analytics
- Multi-owner portfolio management
- Mobile application
- Predictive investment insights

---

## License

MIT
