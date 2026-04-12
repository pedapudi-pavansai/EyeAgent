import { createAdminClient } from '@/lib/supabase/admin'
import { runDiligenceJob, markDiligenceFailed } from '@/lib/diligence/run-diligence-job'

const STUCK_AFTER_MS = 15 * 60 * 1000

/** Mark long-running jobs as failed so they can be retried (failed) or investigated. */
export async function reconcileStuckDiligenceJobs(): Promise<void> {
  const admin = createAdminClient()
  const cutoff = new Date(Date.now() - STUCK_AFTER_MS).toISOString()
  await admin
    .from('applications')
    .update({
      diligence_status: 'failed',
      diligence_error: 'Run timed out (worker reconciliation). You may retry if diligence has not completed.',
    })
    .eq('diligence_status', 'running')
    .lt('diligence_started_at', cutoff)
}

/**
 * Claim one queued application and run the diligence pipeline.
 * Returns true if a job was processed (success or failure recorded).
 */
export async function processNextDiligenceJob(): Promise<boolean> {
  await reconcileStuckDiligenceJobs()

  const admin = createAdminClient()
  const { data: queued } = await admin
    .from('applications')
    .select('id')
    .eq('diligence_status', 'queued')
    .order('diligence_queued_at', { ascending: true })
    .limit(1)

  const nextId = queued?.[0]?.id
  if (!nextId) return false

  const started = new Date().toISOString()
  const { data: claimed, error: claimErr } = await admin
    .from('applications')
    .update({
      diligence_status: 'running',
      diligence_started_at: started,
    })
    .eq('id', nextId)
    .eq('diligence_status', 'queued')
    .select('id')

  if (claimErr || !claimed?.length) {
    return false
  }

  try {
    await runDiligenceJob(nextId)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Diligence job failed'
    await markDiligenceFailed(nextId, msg)
  }

  return true
}
