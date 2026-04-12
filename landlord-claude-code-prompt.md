Claude Code Implementation Prompt — Keystone (CSB Tech Day Hackathon)
Paste this entire prompt into Claude Code (or a similar agentic coding tool) as the initial scaffolding instruction.

SYSTEM CONTEXT
You are building Keystone, a full-stack AI-powered property management platform for the CSB Tech Day Hackathon. The stack is:
Frontend: Next.js 14 (App Router, TypeScript, Tailwind CSS)
Backend/DB: Supabase (Auth, Postgres, Storage, RLS)
AI: LangChain + LangGraph + Google Gemini 1.5 Pro
Styling: Tailwind CSS + shadcn/ui components
Build the entire application end-to-end. Use the file structure, schema, and feature spec below exactly.

ENVIRONMENT VARIABLES
Create a .env.local file with:
NEXT_PUBLIC_SUPABASE_URL= https://gjcttzjfzryouqvuyuwd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY= eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqY3R0empmenJ5b3VxdnV5dXdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzg2MDUsImV4cCI6MjA5MDg1NDYwNX0.4AODCpfklbmjmlGh1I_N8MMgMCuKUowKpngEuAwvuBw
SUPABASE_SERVICE_ROLE_KEY= eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqY3R0empmenJ5b3VxdnV5dXdkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTI3ODYwNSwiZXhwIjoyMDkwODU0NjA1fQ.b6iGSN34jzwy1bgIDdCJUlBqlLzz9E7el2C7ACmNFkc
GOOGLE_API_KEY= 


DIRECTORY STRUCTURE
keystone/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (landlord)/
│   │   ├── dashboard/page.tsx          ← property card grid
│   │   ├── onboarding/page.tsx         ← multi-step form
│   │   ├── marketplace/page.tsx        ← Zillow-style listing browser
│   │   └── properties/[id]/page.tsx    ← property detail (tabbed modal content)
│   ├── (tenant)/
│   │   └── portal/page.tsx             ← tenant payment + service requests
│   ├── apply/
│   │   └── [property_id]/page.tsx      ← public application form
│   └── api/
│       ├── ai/score-applicant/route.ts ← LangGraph scoring agent
│       ├── ai/recommend/route.ts       ← LangGraph investment rec agent
│       └── applications/generate-link/route.ts
├── components/
│   ├── PropertyCard.tsx
│   ├── PropertyModal.tsx               ← tabbed: Overview, Tenants, Service Requests
│   ├── ApplicantCard.tsx
│   ├── ApplicantModal.tsx
│   ├── ApplicationForm.tsx             ← multi-step public form
│   ├── MarketplaceCard.tsx
│   ├── ServiceRequestCard.tsx
│   └── TenantPortal.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                   ← createBrowserClient
│   │   └── server.ts                   ← createServerClient
│   ├── ai/
│   │   ├── scoring-agent.ts            ← LangGraph: applicant scoring
│   │   └── recommendation-agent.ts     ← LangGraph: property recommendations
│   └── types.ts                        ← all TypeScript types
└── supabase/
    └── migrations/
        └── 001_initial_schema.sql


STEP 1: DATABASE SCHEMA
Create supabase/migrations/001_initial_schema.sql:
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles (extends auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  role text not null default 'landlord' check (role in ('landlord', 'applicant', 'tenant')),
  full_name text,
  email text,
  phone text,
  business_name text,
  created_at timestamptz default now()
);

-- Landlord financial profile
create table landlord_financials (
  id uuid primary key default uuid_generate_v4(),
  landlord_id uuid references profiles(id) on delete cascade,
  annual_income numeric,
  total_debt numeric,
  target_irr numeric,
  preferred_markets text[],
  created_at timestamptz default now()
);

-- Properties
create table properties (
  id uuid primary key default uuid_generate_v4(),
  landlord_id uuid references profiles(id) on delete cascade,
  address text not null,
  unit_count int default 1,
  property_type text,
  purchase_price numeric,
  monthly_rent numeric,
  photo_url text,
  created_at timestamptz default now()
);

-- Applications (pre and post auth)
create table applications (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid references properties(id) on delete cascade,
  applicant_id uuid references profiles(id),
  email text,
  full_name text,
  phone text,
  employer text,
  job_title text,
  annual_income numeric,
  fico_score int,
  monthly_debts numeric,
  rental_history jsonb,
  status text default 'pending' check (status in ('pending', 'under_review', 'accepted', 'rejected')),
  ai_score int,
  ai_insights text,
  submitted_at timestamptz default now()
);

-- Service Requests
create table service_requests (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid references properties(id) on delete cascade,
  tenant_id uuid references profiles(id) on delete cascade,
  category text,
  description text,
  photo_url text,
  status text default 'open' check (status in ('open', 'in_progress', 'resolved')),
  landlord_notes text,
  created_at timestamptz default now()
);

-- Marketplace listings (seeded)
create table marketplace_listings (
  id uuid primary key default uuid_generate_v4(),
  address text,
  city text,
  price numeric,
  cap_rate numeric,
  cash_on_cash numeric,
  property_type text,
  bedrooms int,
  photo_url text,
  external_url text,
  ai_tag text,
  ai_thesis text
);

-- Application tokens
create table application_tokens (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid references properties(id) on delete cascade,
  token text unique not null default uuid_generate_v4()::text,
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '30 days')
);

-- RLS Policies
alter table profiles enable row level security;
alter table properties enable row level security;
alter table applications enable row level security;
alter table service_requests enable row level security;
alter table landlord_financials enable row level security;

-- Landlords can only see their own properties
create policy "Landlords own properties" on properties
  for all using (landlord_id = auth.uid());

-- Landlords see applications for their properties
create policy "Landlords see applications" on applications
  for select using (
    property_id in (select id from properties where landlord_id = auth.uid())
  );

-- Tenants see their own applications
create policy "Applicants see own" on applications
  for select using (applicant_id = auth.uid());

-- Service requests: tenants insert, landlords read
create policy "Tenants insert service requests" on service_requests
  for insert with check (tenant_id = auth.uid());

create policy "Landlords see service requests" on service_requests
  for select using (
    property_id in (select id from properties where landlord_id = auth.uid())
  );

-- Profiles: users see own profile
create policy "Users see own profile" on profiles
  for all using (id = auth.uid());


STEP 2: SUPABASE CLIENT SETUP
lib/supabase/client.ts:
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

lib/supabase/server.ts:
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}


STEP 3: TYPESCRIPT TYPES
lib/types.ts:
export type Role = 'landlord' | 'applicant' | 'tenant'
export type ApplicationStatus = 'pending' | 'under_review' | 'accepted' | 'rejected'
export type ServiceRequestStatus = 'open' | 'in_progress' | 'resolved'

export interface Profile {
  id: string
  role: Role
  full_name: string
  email: string
  phone?: string
  business_name?: string
  created_at: string
}

export interface Property {
  id: string
  landlord_id: string
  address: string
  unit_count: number
  property_type: string
  purchase_price: number
  monthly_rent: number
  photo_url?: string
  created_at: string
}

export interface Application {
  id: string
  property_id: string
  applicant_id?: string
  email: string
  full_name: string
  phone: string
  employer: string
  job_title: string
  annual_income: number
  fico_score: number
  monthly_debts: number
  rental_history: any
  status: ApplicationStatus
  ai_score?: number
  ai_insights?: string
  submitted_at: string
}

export interface ServiceRequest {
  id: string
  property_id: string
  tenant_id: string
  category: string
  description: string
  photo_url?: string
  status: ServiceRequestStatus
  landlord_notes?: string
  created_at: string
}

export interface MarketplaceListing {
  id: string
  address: string
  city: string
  price: number
  cap_rate: number
  cash_on_cash: number
  property_type: string
  bedrooms: number
  photo_url?: string
  external_url?: string
  ai_tag?: string
  ai_thesis?: string
}


STEP 4: AI AGENTS
lib/ai/scoring-agent.ts
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { StateGraph, END } from '@langchain/langgraph'
import { createClient } from '@/lib/supabase/server'

const llm = new ChatGoogleGenerativeAI({
  model: 'gemini-1.5-pro',
  temperature: 0.2,
  apiKey: process.env.GOOGLE_API_KEY!,
})

interface ScoringState {
  application_id: string
  application: any
  financial_score: string
  risk_assessment: string
  final_score: number
  insights: string
}

export async function runScoringAgent(applicationId: string) {
  const supabase = await createClient()

  const graph = new StateGraph<ScoringState>({
    channels: {
      application_id: { value: (x: string) => x },
      application: { value: (x: any) => x },
      financial_score: { value: (x: string) => x },
      risk_assessment: { value: (x: string) => x },
      final_score: { value: (x: number) => x },
      insights: { value: (x: string) => x },
    }
  })

  graph.addNode('load_application', async (state: ScoringState) => {
    const { data } = await supabase
      .from('applications')
      .select('*')
      .eq('id', state.application_id)
      .single()
    return { application: data }
  })

  graph.addNode('score_financials', async (state: ScoringState) => {
    const app = state.application
    const prompt = `You are a property rental risk analyst. Evaluate this applicant's financial profile:
- Annual Income: $${app.annual_income}
- Monthly Rent: (check against property)
- FICO Score: ${app.fico_score}
- Monthly Debts: $${app.monthly_debts}
- Employer: ${app.employer}, ${app.job_title}

Score their financial stability from 0-100 and explain briefly. Respond in JSON: {"score": number, "rationale": "string"}`

    const response = await llm.invoke(prompt)
    return { financial_score: response.content as string }
  })

  graph.addNode('assess_risk', async (state: ScoringState) => {
    const app = state.application
    const prompt = `Evaluate rental risk for this applicant:
- FICO: ${app.fico_score}
- Rental History: ${JSON.stringify(app.rental_history)}
- Income-to-Debt Ratio: ${(app.annual_income / 12 / (app.monthly_debts || 1)).toFixed(2)}

Identify any red flags and provide a risk tier (Low/Medium/High). Respond in JSON: {"risk_tier": "string", "flags": ["string"], "summary": "string"}`

    const response = await llm.invoke(prompt)
    return { risk_assessment: response.content as string }
  })

  graph.addNode('synthesize', async (state: ScoringState) => {
    const prompt = `Based on these assessments, generate a final applicant score and recommendation:

Financial Assessment: ${state.financial_score}
Risk Assessment: ${state.risk_assessment}

Generate a final composite score (0-100) and a 3-4 sentence narrative for the landlord.
Respond in JSON: {"score": number, "insights": "string"}`

    const response = await llm.invoke(prompt)
    let parsed: any = {}
    try {
      const clean = (response.content as string).replace(/```json|```/g, '').trim()
      parsed = JSON.parse(clean)
    } catch {
      parsed = { score: 60, insights: response.content as string }
    }
    return { final_score: parsed.score, insights: parsed.insights }
  })

  graph.addNode('write_to_db', async (state: ScoringState) => {
    await supabase
      .from('applications')
      .update({
        ai_score: state.final_score,
        ai_insights: state.insights,
        status: 'under_review'
      })
      .eq('id', state.application_id)
    return {}
  })

  graph.setEntryPoint('load_application')
  graph.addEdge('load_application', 'score_financials')
  graph.addEdge('score_financials', 'assess_risk')
  graph.addEdge('assess_risk', 'synthesize')
  graph.addEdge('synthesize', 'write_to_db')
  graph.addEdge('write_to_db', END)

  const compiled = graph.compile()
  await compiled.invoke({ application_id: applicationId })
}

lib/ai/recommendation-agent.ts
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { StateGraph, END } from '@langchain/langgraph'
import { createClient } from '@/lib/supabase/server'

const llm = new ChatGoogleGenerativeAI({
  model: 'gemini-1.5-pro',
  temperature: 0.3,
  apiKey: process.env.GOOGLE_API_KEY!,
})

export async function runRecommendationAgent(landlordId: string) {
  const supabase = await createClient()

  const { data: financials } = await supabase
    .from('landlord_financials')
    .select('*')
    .eq('landlord_id', landlordId)
    .single()

  const { data: listings } = await supabase
    .from('marketplace_listings')
    .select('*')
    .limit(20)

  if (!financials || !listings) return []

  const prompt = `You are a real estate investment advisor. 

Landlord financial profile:
- Annual Income: $${financials.annual_income}
- Total Debt: $${financials.total_debt}
- Target IRR: ${financials.target_irr}%
- Preferred Markets: ${financials.preferred_markets?.join(', ')}

Available listings:
${listings.map((l: any, i: number) => `${i+1}. ${l.address} | $${l.price} | Cap Rate: ${l.cap_rate}% | C-o-C: ${l.cash_on_cash}% | Type: ${l.property_type}`).join('\n')}

For each listing, assign:
1. ai_tag: "Strong Match", "Consider", or "Avoid"
2. ai_thesis: 2-sentence investment rationale tailored to this landlord's goals

Respond ONLY in JSON array: [{"id": "listing_address", "ai_tag": "...", "ai_thesis": "..."}]`

  const response = await llm.invoke(prompt)
  let recommendations: any[] = []
  try {
    const clean = (response.content as string).replace(/```json|```/g, '').trim()
    recommendations = JSON.parse(clean)
  } catch {
    return listings
  }

  const enriched = listings.map((listing: any) => {
    const rec = recommendations.find((r: any) => r.id === listing.address)
    return { ...listing, ai_tag: rec?.ai_tag, ai_thesis: rec?.ai_thesis }
  })

  for (const item of enriched) {
    await supabase
      .from('marketplace_listings')
      .update({ ai_tag: item.ai_tag, ai_thesis: item.ai_thesis })
      .eq('id', item.id)
  }

  return enriched
}


STEP 5: API ROUTES
app/api/ai/score-applicant/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { runScoringAgent } from '@/lib/ai/scoring-agent'

export async function POST(req: NextRequest) {
  const { application_id } = await req.json()
  if (!application_id) return NextResponse.json({ error: 'Missing application_id' }, { status: 400 })
  try {
    await runScoringAgent(application_id)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Scoring failed' }, { status: 500 })
  }
}

app/api/applications/generate-link/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { property_id } = await req.json()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('application_tokens')
    .insert({ property_id })
    .select()
    .single()

  if (error) return NextResponse.json({ error }, { status: 500 })

  const url = `${process.env.NEXT_PUBLIC_APP_URL}/apply/${property_id}?token=${data.token}`
  return NextResponse.json({ url })
}

app/api/applications/accept/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { application_id, applicant_id } = await req.json()
  const supabase = await createClient()

  await supabase
    .from('applications')
    .update({ status: 'accepted' })
    .eq('id', application_id)

  if (applicant_id) {
    await supabase
      .from('profiles')
      .update({ role: 'tenant' })
      .eq('id', applicant_id)
  }

  return NextResponse.json({ success: true })
}


STEP 6: PAGE IMPLEMENTATIONS
app/(landlord)/onboarding/page.tsx
Build a multi-step wizard with these steps:
Personal Info — full_name, email, phone, business_name
Add Properties — repeatable form: address, unit_count, property_type, purchase_price, monthly_rent, photo upload
Financial Profile — annual_income, total_debt, target_irr, preferred_markets (multi-select chips)
Review & Submit — summary of all entered data
On submit:
Upsert profiles table
Insert landlord_financials row
Insert all properties rows
Redirect to /dashboard
app/(landlord)/dashboard/page.tsx
Fetch all properties for auth.uid()
Render a responsive grid of <PropertyCard /> components
Each card opens a <PropertyModal /> with tabs: Overview, Applications, Service Requests
app/(landlord)/marketplace/page.tsx
Fetch marketplace_listings from Supabase
Sidebar: filter by city, price range, property_type, bedrooms
Main area: grid of <MarketplaceCard /> showing price, cap rate, ai_tag badge, ai_thesis
"Refresh AI Recommendations" button triggers /api/ai/recommend
app/apply/[property_id]/page.tsx
Validate token query param against application_tokens table (server-side)
If invalid/expired: show error page
If valid: render multi-step <ApplicationForm />:
Personal info
Employment & income
Rental history (add prior addresses)
Financial health (FICO, monthly debts)
Review & submit
On submit:
Insert to applications table
Call /api/ai/score-applicant with new application_id (fire and forget)
Show confirmation screen
app/(tenant)/portal/page.tsx
Require role = 'tenant' (redirect otherwise)
Show: lease details, rent payment placeholder card, service request submission form, list of past requests

STEP 7: KEY COMPONENTS
components/PropertyModal.tsx
Tabs:
  - Overview: address, type, unit count, purchase price, monthly rent, photo
  - Applications: list of <ApplicantCard /> for this property
  - Service Requests: list of <ServiceRequestCard /> with status controls

components/ApplicantCard.tsx
Shows: name, submitted date, status badge, ai_score (colored: green ≥75, yellow 50–74, red <50)
Click: opens <ApplicantModal /> with full details + AI insights + Accept/Reject buttons

components/ApplicationForm.tsx
Multi-step with progress bar
State managed with useState + object accumulator
Final step POSTs to Supabase directly


STEP 8: SEED DATA
Create supabase/seed.sql with 10 fake marketplace listings across Austin TX, Denver CO, and Nashville TN with realistic prices, cap rates, and cash-on-cash returns.

STEP 9: PACKAGES TO INSTALL
npm install @supabase/supabase-js @supabase/ssr
npm install @langchain/google-genai @langchain/langgraph @langchain/core langchain
npm install @radix-ui/react-tabs @radix-ui/react-dialog @radix-ui/react-badge
npm install lucide-react clsx tailwind-merge
npm install react-hook-form zod @hookform/resolvers


STEP 10: IMPLEMENTATION ORDER
Build in this sequence to avoid dependency issues:
Supabase schema + seed data (001_initial_schema.sql, seed.sql)
lib/supabase/client.ts, lib/supabase/server.ts, lib/types.ts
Auth pages (/login, /register) with Supabase Auth
Middleware to protect /dashboard, /portal routes by role
Onboarding wizard (/onboarding)
Dashboard + PropertyCard + PropertyModal
Application token API + /apply/[property_id] form
AI scoring agent + /api/ai/score-applicant
Applicant management UI within PropertyModal
Accept/Reject flow + role promotion
Tenant portal
Marketplace + AI recommendation agent
Service requests (tenant submit + landlord view)

ADDITIONAL NOTES FOR CLAUDE CODE
Use shadcn/ui for all UI primitives (Dialog, Tabs, Badge, Card, Button, Input, Select)
All forms should use react-hook-form + zod for validation
Protect all landlord routes with a middleware check: if (profile.role !== 'landlord') redirect('/portal')
The AI scoring call after application submit should be non-blocking (don't await on the frontend)
Use Supabase Storage bucket named property-photos for image uploads
Keep all Gemini prompts in the agent files, not inline in API routes
For the CSB Tech Day Hackathon demo: pre-seed the marketplace with 10 listings and one demo landlord account

