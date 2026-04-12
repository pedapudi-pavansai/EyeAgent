-- application_tokens had no RLS; restrict inserts to landlords for their own properties.
alter table application_tokens enable row level security;

create policy "Landlords insert tokens for own properties" on application_tokens
  for insert
  with check (
    property_id in (select id from properties where landlord_id = auth.uid())
  );
