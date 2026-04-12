-- Reset all application data while keeping schema, RLS, indexes, and extensions.
-- Does NOT delete auth.users — sign-ups remain; you may want to remove users in
-- Dashboard → Authentication if you need a fully blank slate.
--
-- Run in Supabase → SQL Editor (or `psql` against your DB).

begin;

truncate table
  application_tokens,
  applications,
  service_requests,
  properties,
  landlord_financials,
  marketplace_listings,
  profiles
restart identity cascade;

commit;

-- Optional: re-seed marketplace demo rows (from seed.sql in this folder).
-- insert into marketplace_listings ...
