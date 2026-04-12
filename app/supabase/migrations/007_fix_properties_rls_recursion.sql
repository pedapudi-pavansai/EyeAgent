-- Break RLS recursion: policies on applications/service_requests subqueried `properties`,
-- while tenant policy on `properties` subqueried `applications` → infinite recursion.
-- This function reads `properties` with definer rights so the inner SELECT does not re-enter RLS.

create or replace function public.landlord_owns_property(p_property_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.properties p
    where p.id = p_property_id
      and p.landlord_id = auth.uid()
  );
$$;

grant execute on function public.landlord_owns_property(uuid) to authenticated;
grant execute on function public.landlord_owns_property(uuid) to anon;

drop policy if exists "Landlords see applications" on applications;
create policy "Landlords see applications" on applications
  for select using (landlord_owns_property(property_id));

drop policy if exists "Landlords update applications for their properties" on applications;
create policy "Landlords update applications for their properties" on applications
  for update
  using (landlord_owns_property(property_id))
  with check (landlord_owns_property(property_id));

drop policy if exists "Landlords see service requests" on service_requests;
create policy "Landlords see service requests" on service_requests
  for select using (landlord_owns_property(property_id));
