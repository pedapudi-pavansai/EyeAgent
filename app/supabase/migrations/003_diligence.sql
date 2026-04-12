-- Full diligence (third-party screening + Gemini synthesis), separate from fast ai_score / ai_insights

alter table applications
  add column if not exists diligence_status text not null default 'none'
    check (diligence_status in ('none', 'queued', 'running', 'complete', 'failed')),
  add column if not exists diligence_queued_at timestamptz,
  add column if not exists diligence_started_at timestamptz,
  add column if not exists diligence_completed_at timestamptz,
  add column if not exists diligence_provider text,
  add column if not exists diligence_external_order_id text,
  add column if not exists diligence_report jsonb,
  add column if not exists diligence_error text;

comment on column applications.diligence_status is 'Background screening + synthesis lifecycle; complete means one successful run (no re-run).';
comment on column applications.diligence_report is 'Structured JSON: vendor snapshot + Gemini sections; see lib/diligence/schema.ts';
