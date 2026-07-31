# Keystone

> AI-powered property management platform that helps independent landlords screen applicants, evaluate investments, and automate rental workflows.

![Keystone Dashboard](docs/images/dashboard.png)

---

## Overview

Keystone is a full-stack property management platform built for independent landlords. The platform combines deterministic applicant scoring with AI-powered analysis to streamline tenant screening, investment evaluation, and portfolio management.

Unlike traditional property management software, Keystone separates high-stakes, explainable decisions from AI-generated insights, ensuring applicant evaluations remain transparent while leveraging LLMs for financial analysis and investment recommendations.

---

## Features

- 🏠 Portfolio dashboard for managing rental properties
- 📝 Secure tenant application portal
- 📊 Deterministic applicant scoring engine
- 🤖 AI-powered financial and risk analysis
- 💰 Investment marketplace with personalized recommendations
- ⚡ Asynchronous multi-agent diligence pipeline
- 🔐 Secure authentication and Row-Level Security

---

## Architecture

```text
                  Applicant
                      │
                      ▼
              Next.js Web Platform
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
              Diligence Reports
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
- Deterministic Scoring Engine
- Multi-Agent Workflow

### Infrastructure
- Vercel
- Supabase
- Background Cron Workers

---

## System Design

Keystone separates deterministic decision making from AI reasoning.

Applicant qualification is computed using a fully deterministic scoring algorithm based on affordability, debt-to-income ratio, credit profile, and rental history. AI is only introduced after the scoring stage to generate financial summaries, risk assessments, and investment recommendations.

This architecture keeps critical decisions transparent while allowing language models to synthesize complex financial information.

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

- Multi-property analytics dashboard
- Real-time rent payment tracking
- Maintenance request management
- AI lease generation
- Mobile application
- Multi-owner portfolio support

---

## License

MIT
