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

create policy "Landlords own properties" on properties
  for all using (landlord_id = auth.uid());

create policy "Landlords see applications" on applications
  for select using (
    property_id in (select id from properties where landlord_id = auth.uid())
  );

create policy "Applicants see own" on applications
  for select using (applicant_id = auth.uid());

create policy "Tenants insert service requests" on service_requests
  for insert with check (tenant_id = auth.uid());

create policy "Landlords see service requests" on service_requests
  for select using (
    property_id in (select id from properties where landlord_id = auth.uid())
  );

create policy "Users see own profile" on profiles
  for all using (id = auth.uid());
