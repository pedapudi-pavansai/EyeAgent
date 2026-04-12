-- At most one application may be queued or running for full diligence at a time (platform-wide).
create unique index if not exists applications_single_diligence_inflight
  on applications ((1))
  where diligence_status in ('queued', 'running');

comment on index applications_single_diligence_inflight is
  'Ensures only one diligence job is queued or running globally; pairs with worker + API checks.';
