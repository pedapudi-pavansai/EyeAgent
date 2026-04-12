# Keystone

Devpost write-up for the **CSB Tech Day Hackathon**.

## Inspiration

The rental market in the United States has over 20 million independent landlords. The vast majority of them manage their properties the same way people did 30 years ago: spreadsheets, text messages, manila folders, and gut instinct. When a tenant applies, a landlord manually calls references, eyeballs pay stubs, and makes a decision based on feel. When a maintenance request comes in, it gets lost in a text thread. When they want to grow their portfolio, they browse Zillow and guess.

Meanwhile, large property management companies run sophisticated software stacks that automate screening, score applicants against financial benchmarks, and surface investment opportunities ranked to their criteria. That tooling is priced and designed for firms managing hundreds of units, not the person who owns a duplex and a single-family home.

We built Keystone to close that gap. We wanted a solo landlord to have the same operational leverage as a professional property management company, without hiring a team or paying enterprise SaaS prices. The whole product is built around one idea: the landlord should spend their time making decisions, not doing data entry.

## What it does

Keystone covers the entire independent landlord workflow from acquisition to ongoing management.

**Portfolio Dashboard**

The dashboard is the landlord's home base. It shows every property they own as a card with photo, address, property type, unit count, purchase price, and monthly rent. Application badges on each card show how many pending applicants are waiting for review. From the dashboard, landlords can navigate to any property's detail page, add new properties, or browse the investment marketplace. They can also delete properties they no longer own directly from the detail view, with a two-step confirmation to prevent accidents.

**Shareable Application Links**

Every property gets a unique, token-gated application URL that the landlord can copy and send to prospective tenants. The link expires after 30 days. Applicants do not need an account to apply. They fill out a structured 5-step form covering personal information, employment and income, rental history, financial details, and a final review before submission. The entire application flow is mobile-friendly and works without any landlord involvement after the link is sent.

**AI-Powered Tenant Scoring**

The moment an application is submitted, Keystone runs it through a deterministic scoring engine that produces a score from 0 to 100. The algorithm evaluates four weighted dimensions: income-to-rent ratio, debt-to-income ratio, FICO credit band, and rental history. Each factor is scored against real financial benchmarks and combined into a final score. The engine also generates plain-language insight labels explaining the score. Critically, this layer is not an LLM. We made a deliberate decision to keep pass/fail financial screening deterministic so landlords can explain and defend every decision.

**Applicant Pipeline**

All applications for a property surface in the Applications tab of the property detail page, sorted by AI score. Landlords can accept or reject applicants. Accepting an applicant transitions the property to the Tenant view and triggers the tenant onboarding flow, which creates a portal account for the accepted renter.

**Deep Diligence Workflow**

For applicants that look promising on the surface score, landlords can initiate a full background check through the Diligence panel. This kicks off a LangGraph multi-agent workflow. A financial analysis agent, a risk assessment agent, and a merge agent run in parallel, each processing vendor-provided background check data. The merge agent consolidates both analyses into a unified diligence report. The whole pipeline is queue-based with a cron worker and a webhook handler, so it runs asynchronously and the landlord gets results when they are ready.

**Tenant Portal**

Accepted tenants who create an account get access to a dedicated portal. From there they can submit service requests with a description and priority level, track the status of open requests, and view payment history. The landlord sees all service requests in the Service tab of the property detail view and can update statuses as work is completed.

**Investment Marketplace**

Keystone includes a full listing browser for independent real estate investors. The marketplace pulls curated high cap-rate listings across Austin, Denver, Nashville, Charlotte, and Raleigh. Each listing shows price, cap rate, cash-on-cash return, property type, and bedroom count. Landlords can filter and browse on an interactive map powered by Leaflet.

On the dashboard, the top listings are ranked and tagged using Google Gemini 1.5 Pro. The model evaluates every listing against the landlord's actual financial profile: their target IRR, annual income, total debt, markets where they already own, and property types they favor. Each listing gets tagged as Strong Match, Consider, or Avoid with a one-sentence thesis explaining the recommendation. This is where we use AI, because synthesis and preference-matching across multiple dimensions is exactly the kind of reasoning LLMs are suited for.

**Hosting and Deployment**

The application is deployed on Vercel with continuous deployment from the main branch. The custom domain is registered and managed through GoDaddy. Supabase handles the production database, authentication, and storage in a separate cloud environment.

## How we built it

**Frontend and Framework**

We used Next.js 16 with the App Router and TypeScript throughout. The UI is built with React 19 and Tailwind CSS 4, with Radix UI primitives for accessible dialogs, tabs, and select menus. Forms use React Hook Form with Zod validation schemas. The marketplace map uses Leaflet with React Leaflet.

We took the server/client component boundary seriously. Data fetching and database queries happen in server components. Client components are scoped to interactive pieces: the property gallery carousel, the application detail modals, the delete confirmation flow, and the tenant portal forms.

**Database and Auth**

Supabase provides Postgres, authentication, and real-time capabilities. Every table is protected by Row-Level Security policies so data isolation is enforced at the database layer, not just the application layer. The schema covers: profiles, properties, applications, application tokens, service requests, marketplace listings, landlord financials, and diligence jobs. We wrote and iterated on 8 migration files during the CSB Tech Day Hackathon to get the RLS policies right across the full multi-role system.

**AI Layer**

We split the AI responsibility deliberately across two approaches.

For tenant scoring, we use a deterministic weighted algorithm with no LLM involvement. Income-to-rent ratio, DTI, FICO band, and rental history each have defined thresholds and weights. The output is consistent, auditable, and explainable, which matters for a decision that affects someone's housing.

For investment recommendations, we use Google Gemini 1.5 Pro through LangChain. The prompt passes the landlord's financial profile alongside every listing's cap rate, price, location, and property type. Gemini returns a structured tag and thesis for each listing. This is a good fit for LLMs because it requires synthesizing personal preference signals against a set of options, not making a binary pass/fail judgment.

For diligence, we use LangGraph to orchestrate a multi-agent workflow. A financial agent and a risk agent process background check data in parallel. A merge agent then synthesizes both into a final report. The workflow runs asynchronously via a queue and cron worker so it does not block the UI.

**Infrastructure**

| Layer | Technology |
|---|---|
| Framework | Next.js 16, App Router, TypeScript |
| Hosting | Vercel |
| Domain | GoDaddy |
| Database and Auth | Supabase (Postgres, RLS, Auth) |
| AI Recommendations | Google Gemini 1.5 Pro via LangChain |
| AI Diligence | LangGraph multi-agent workflow |
| Tenant Scoring | Custom deterministic algorithm |
| UI Components | React 19, Tailwind CSS 4, Radix UI |
| Forms | React Hook Form, Zod |
| Maps | Leaflet, React Leaflet |
| Testing | Vitest |

## Challenges we ran into

**Next.js 16 Breaking Changes**

Next.js 16 introduced several breaking changes from our prior experience. The middleware file convention was deprecated and renamed to `proxy`. Turbopack changed how it handles the boundary between server and client components. We ran into a chunk loading error mid-development after accidentally importing a client component directly into a server component tree, which caused Turbopack to fail building the client bundle. Tracking down the boundary violation and reverting the problematic import took a meaningful chunk of debugging time.

**Designing the AI Layer Around the Right Problems**

Our first instinct was to use Gemini for tenant scoring since it felt like the natural place to apply AI. After building an initial prototype, we found the outputs were inconsistent across identical inputs and the model would occasionally invent plausible-sounding but fabricated reasons to accept or reject someone. We scrapped that approach and rebuilt scoring as a deterministic algorithm. That decision made the product more trustworthy and the scoring faster and cheaper to run. We then redirected the LLM budget toward investment recommendations and diligence synthesis, where the open-ended nature of the task is actually suited to generative AI.

**Multi-Role Data Model and RLS Policies**

A user in Keystone can be a landlord, an applicant, or a tenant, and the same person can hold multiple roles across different contexts. Writing Supabase RLS policies that correctly scope data across all three roles without creating recursive policy lookups or accidentally blocking legitimate reads took several iterations. At one point a policy on the properties table was recursively checking itself through a join, which caused queries to hang. We resolved it by restructuring the policy to avoid the self-reference.

**Image Reliability in Production**

We seeded the marketplace with Unsplash CDN URLs for listing photos. Two of those photo IDs returned 404 during the CSB Tech Day Hackathon because the original photographers had removed their images from the platform. We caught it by testing every URL in the seed data, replaced the broken ones with verified working photos, and fixed the dashboard server component to serve local placeholder images as the source of truth rather than depending on external CDN availability. We also built a client-side fallback image component that catches load failures post-hydration for any future cases.

**Application Token Security**

The public application form is accessible via a token in the URL, not an authenticated session, since applicants should not need an account just to apply. Getting the token validation right, scoping it correctly to a property, enforcing expiry, and ensuring the form submission could not be replayed or tampered with required careful design of the token generation and validation flow.

## Accomplishments that we're proud of

We shipped a full end-to-end product during the CSB Tech Day Hackathon. That means a landlord can sign up, add their properties, send application links, receive and score applicants, accept a tenant, and manage service requests without anything being mocked or stubbed at the user-facing level.

The LangGraph diligence pipeline is genuinely novel. Parallel financial and risk agents running on real vendor data, merged by a synthesis agent, triggered from a single button and delivered asynchronously, is not the kind of thing that typically gets built in a CSB Tech Day Hackathon timeframe.

The scoring algorithm produces results that feel fair and consistent because they are. We are proud that we resisted the pressure to use an LLM where a rule-based system was actually the better tool.

The investment recommendation experience is unusually personalized. Gemini is not sorting by cap rate, it is reading the landlord's actual financial goals and portfolio composition and making a judgment call about fit. That is a meaningfully different experience from a filter dropdown.

The deployment pipeline is production-grade. Continuous deployment from GitHub to Vercel with a custom domain through GoDaddy, environment-separated Supabase instances, CloudFlare for security, and RLS-enforced data isolation means this is not a demo that needs to be babied to show. It works.

## What we learned

Using the right tool for each layer matters more than using the fanciest tool everywhere. Deterministic scoring is more trustworthy than LLM scoring for consequential decisions. LLM synthesis is more useful than filter logic for open-ended preference matching. LangGraph multi-agent pipelines are genuinely well-suited to parallelizable research tasks like background checks.

Next.js App Router's server and client component model is powerful but demands deliberate architecture. The boundary is not just a performance concern, it affects how Turbopack bundles code, and violations surface as runtime errors that can be hard to trace. Having a clear mental model of which components fetch data and which handle interactivity made the codebase easier to debug.

Supabase RLS is the right approach for multi-role applications, but it requires treating policies as first-class code. They need to be tested, reviewed, and migrated with the same care as application logic.

Deploying early and often helped us. Having the app live on Vercel from day two meant we caught environment-specific bugs, image loading issues, and Turbopack behavior differences before the final push rather than during it.

## What's next for Keystone

**Real Screening Integrations**

The diligence vendor layer is built around pluggable adapters. The next step is wiring in live providers: Experian or TransUnion for credit, Checkr for criminal background, and Plaid for income verification. The architecture already supports it.

**Lease Generation**

Once an applicant is accepted, the landlord should be able to generate a jurisdiction-appropriate lease draft pre-filled with the property address, accepted rent amount, and tenant information. A Gemini-assisted document generation step fits naturally here.

**Rent Collection**

The payment history view in the tenant portal is already built. The next step is making it functional with ACH payment processing, automated rent reminders, and late fee calculation built directly into the portal rather than handled out-of-band.

**Mobile Application**

Landlords field maintenance calls, receive applications, and make decisions on their phones. A React Native version of the core landlord flows, particularly notifications for new applications and service requests, is the highest-leverage distribution expansion.

**Portfolio Analytics**

Long-term, the most valuable thing Keystone can do is show landlords how their portfolio is actually performing over time: vacancy rate trends, NOI by property, cap rate drift as rents and expenses change, and benchmarks against the markets they care about. The data is already in the system. Building the analytics layer on top of it is the natural next chapter.
