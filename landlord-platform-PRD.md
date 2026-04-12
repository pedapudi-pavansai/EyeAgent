PRD: Keystone — AI-Powered Property Management Platform (CSB Tech Day Hackathon)
Version: 1.0
 Stack: Next.js 14 (App Router) · Supabase (Auth + Postgres + Storage) · LangChain + LangGraph · Google Gemini
 Status: CSB Tech Day Hackathon MVP

1. Overview
Keystone is a full-stack property management platform that helps independent landlords manage their entire rental lifecycle — from onboarding and listing properties, to screening tenants with AI, to handling payments and service requests — in a single unified product.
The AI layer (Gemini via LangChain/LangGraph) powers tenant scoring, background check summarization, and property investment recommendations based on landlord financial data.

2. User Roles
Role
Description
landlord
Platform owner. Manages properties, views tenants, reviews applications
applicant
Prospective tenant. Fills out application via unique property link
tenant
Accepted applicant. Can pay rent and file service requests

Role transitions: applicant → tenant upon landlord approval (Supabase RLS + role column update).

3. Core Feature Modules
3.1 Landlord Onboarding
Goal: Collect landlord identity, portfolio, and financial profile to personalize the platform.
Fields collected:
Personal info: name, email, phone, LLC/business name (optional)
Property entries (repeatable): address, unit count, property type, purchase price, current rent
Financial data: gross annual income, total debt, target IRR, preferred market(s)
AI hook: After onboarding, Gemini generates a personalized "Investment Opportunity Report" based on financial profile — comparable to Zillow's Zestimate but for acquisition targets.

3.2 Property Dashboard (Card Grid)
Goal: Give landlords a bird's-eye view of all owned properties.
Layout: Responsive card grid (3 cols desktop, 2 tablet, 1 mobile)
Each card shows:
Property photo (from Supabase Storage)
Address + unit count
Occupancy status badge (Fully Occupied / Partially Vacant / Vacant)
Monthly rent collected vs. expected
Quick actions: View Details, Add Unit, Generate Application Link
Card Modal (tabbed):
Tab
Content
Overview
Address, square footage, amenities, notes, lease dates
Tenants / Applications
List of current tenants + open applicants (see 3.3)
Service Requests
Open/closed maintenance tickets for this property


3.3 Tenant & Applicant Management
Goal: See all applicants per property, review details, and use AI scoring to accelerate decisions.
Applicant Card shows:
Name, application date, status badge (Pending / Under Review / Accepted / Rejected)
AI Score (0–100, Gemini-generated)
Applicant Detail Modal:
Full application data (income, FICO, employer, references)
AI Insights panel: Gemini summary of risk profile, flags, recommendation
Landlord action buttons: Accept / Reject / Request More Info
On Accept:
Supabase row update: role = 'tenant', status = 'active'
Supabase Auth invite email triggered
Applicant gains access to Tenant Portal

3.4 Application Flow (Tenant-Facing)
Trigger: Landlord sends unique URL /apply/[property_id]/[token] to interested prospect.
Multi-step form:
Personal info (name, email, phone, DOB)
Employment & income (employer, job title, annual income, pay stubs upload)
Rental history (prior addresses, references)
Financial health (self-reported FICO score, monthly debts)
Review & submit
On submit:
Row inserted to applications table
LangGraph agent triggered: pulls application data → calls Gemini → generates score + summary → stored in ai_insights column
Landlord notified (email or in-app)

3.5 Property Marketplace (Zillow-style)
Goal: Let landlords browse investment opportunities recommended by the AI.
Layout: Split view — filter sidebar + property listing cards
Filter sidebar:
Market / city
Price range
Cap rate range
Property type
Bedrooms / units
Listing card:
Property photo, address, price, cap rate, est. cash-on-cash return
AI tag: "Strong Match" / "Consider" / "Avoid" based on landlord's financial profile
Detail view:
Full property breakdown
Gemini investment thesis (2–3 sentences)
Link to external listing (Zillow, Realtor.com, etc.)

3.6 Tenant Portal
Access: Only users with role = 'tenant'
Features:
View lease details (unit, start/end date, monthly rent)
Make rent payment (Stripe integration recommended, out of scope for MVP — use placeholder)
Submit service request (category, description, photo upload)
View payment history and service request status

3.7 Service Request Management (Landlord View)
Accessed via: Property card → Service Requests tab
Each request shows:
Submitted by (tenant name), date, category (Plumbing / HVAC / Electrical / Other)
Description + attached photos
Status: Open / In Progress / Resolved
Landlord notes field

4. AI Architecture (LangChain + LangGraph + Gemini)
4.1 Tenant Scoring Agent
Graph: application_scoring_agent

Nodes:
  1. load_application       → fetches applicant row from Supabase
  2. score_financials       → Gemini prompt: income-to-rent ratio, FICO assessment
  3. assess_risk_profile    → Gemini prompt: rental history, employment stability
  4. synthesize_insights    → Gemini prompt: generate score (0–100) + narrative summary
  5. write_to_db            → upserts ai_insights into applications table

Edges: linear (1→2→3→4→5), no branching for MVP

4.2 Investment Recommendation Agent
Graph: property_recommendation_agent

Nodes:
  1. load_landlord_profile  → fetches landlord financial data
  2. fetch_listings         → pulls from marketplace table (seeded or API)
  3. rank_properties        → Gemini: score each listing vs. landlord IRR/income/risk tolerance
  4. generate_thesis        → Gemini: 2-3 sentence investment thesis per top-5 result
  5. return_results         → returns ranked list to frontend

Edges: linear

4.3 Gemini Model Config
llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-pro",
    temperature=0.2,
    google_api_key=os.environ["GOOGLE_API_KEY"]
)


5. Database Schema (Supabase / Postgres)
profiles
Column
Type
Notes
id
uuid (FK → auth.users)


role
enum: landlord, applicant, tenant


full_name
text


email
text


phone
text


business_name
text
nullable
created_at
timestamptz



landlord_financials
Column
Type
Notes
id
uuid


landlord_id
uuid (FK → profiles)


annual_income
numeric


total_debt
numeric


target_irr
numeric
percent
preferred_markets
text[]



properties
Column
Type
Notes
id
uuid


landlord_id
uuid (FK → profiles)


address
text


unit_count
int


property_type
text
Single Family, Multi-Family, etc.
purchase_price
numeric


monthly_rent
numeric


photo_url
text
Supabase Storage
created_at
timestamptz



applications
Column
Type
Notes
id
uuid


property_id
uuid (FK → properties)


applicant_id
uuid (FK → profiles)
nullable until signup
email
text
for pre-signup applicants
status
enum: pending, under_review, accepted, rejected


income
numeric


fico_score
int


employer
text


rental_history
jsonb


ai_score
int
0–100
ai_insights
text
Gemini-generated summary
submitted_at
timestamptz



service_requests
Column
Type
Notes
id
uuid


property_id
uuid (FK → properties)


tenant_id
uuid (FK → profiles)


category
text


description
text


photo_url
text


status
enum: open, in_progress, resolved


landlord_notes
text


created_at
timestamptz



marketplace_listings
Column
Type
Notes
id
uuid


address
text


price
numeric


cap_rate
numeric


cash_on_cash
numeric


property_type
text


bedrooms
int


photo_url
text


external_url
text


ai_tag
text
Strong Match / Consider / Avoid
ai_thesis
text
Gemini-generated


6. Application Link System
Landlord clicks "Generate Application Link" on a property card
Backend creates a unique token tied to property_id
Shareable URL: /apply/[property_id]?token=[uuid]
Token validated server-side before rendering the form
On submit, applicant row created with role = 'applicant'

7. Role Authorization (Supabase RLS)
Table
Landlord
Applicant
Tenant
properties
CRUD own
Read (via token)
Read own unit
applications
Read/Update own properties
Insert own
Read own
service_requests
Read/Update own properties
—
Insert/Read own
ai_insights
Read own
—
—

Row Level Security policies enforce these via auth.uid() checks and role column on profiles.

8. MVP Scope vs. Future
Feature
MVP
Future
Landlord onboarding
✅


Property card grid + modal
✅


Applicant management + AI scoring
✅


Application link flow
✅


Tenant portal (view + service req)
✅


Marketplace (Zillow-style)
✅ (seeded data)
Live listing API
Rent payments
❌
Stripe
Mobile app
❌
React Native
Document e-signing
❌
DocuSign API
Multi-user landlord teams
❌
Org-level accounts


9. Non-Functional Requirements
Auth: Supabase Auth (email/password + magic link)
File storage: Supabase Storage (property photos, pay stubs)
Env vars: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, GOOGLE_API_KEY
Rate limiting: LangGraph agent calls debounced per applicant (1 call max per submission)
Error handling: All AI calls wrapped in try/catch with fallback UI state
Responsive: Mobile-first, Tailwind CSS

