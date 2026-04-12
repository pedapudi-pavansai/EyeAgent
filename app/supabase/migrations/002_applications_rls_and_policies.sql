-- Public application inserts go through POST /api/applications/submit (service role), not anon RLS.

-- Landlords can update applications for properties they own (accept/reject, etc.)
create policy "Landlords update applications for their properties" on applications
  for update using (
    property_id in (select id from properties where landlord_id = auth.uid())
  )
  with check (
    property_id in (select id from properties where landlord_id = auth.uid())
  );

-- landlord_financials had RLS enabled with no policies; allow landlords to manage their own row(s)
create policy "Landlords select own financials" on landlord_financials
  for select using (landlord_id = auth.uid());

create policy "Landlords insert own financials" on landlord_financials
  for insert with check (landlord_id = auth.uid());

create policy "Landlords update own financials" on landlord_financials
  for update using (landlord_id = auth.uid())
  with check (landlord_id = auth.uid());
