-- Tenants need to read the property row for an accepted lease (portal rent / address).
drop policy if exists "Tenants see property for accepted application" on properties;
create policy "Tenants see property for accepted application" on properties
  for select using (
    id in (
      select property_id from applications
      where applicant_id = auth.uid() and status = 'accepted'
    )
  );

-- Tenants could insert service requests but had no SELECT; allow reading own rows.
drop policy if exists "Tenants see own service requests" on service_requests;
create policy "Tenants see own service requests" on service_requests
  for select using (tenant_id = auth.uid());
