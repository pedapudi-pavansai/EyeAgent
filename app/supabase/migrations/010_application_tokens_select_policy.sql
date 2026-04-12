-- Required for insert().select() / PostgREST: returning rows needs a SELECT policy.
create policy "Landlords select tokens for own properties" on application_tokens
  for select
  using (
    property_id in (select id from properties where landlord_id = auth.uid())
  );
