-- Run in Supabase SQL Editor to clear diligence state on all applications.
-- Restart `npm run dev` afterward so any in-flight LangGraph work on your machine stops.

UPDATE applications
SET
  diligence_status = 'none',
  diligence_queued_at = NULL,
  diligence_started_at = NULL,
  diligence_completed_at = NULL,
  diligence_provider = NULL,
  diligence_external_order_id = NULL,
  diligence_report = NULL,
  diligence_error = NULL
WHERE TRUE;
