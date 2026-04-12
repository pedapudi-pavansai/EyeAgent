import { createAdminClient } from '@/lib/supabase/admin'
import { getCompiledDiligenceGraph } from '@/lib/diligence/graph/compile'

export async function runDiligenceJob(applicationId: string): Promise<void> {
  const graph = getCompiledDiligenceGraph()
  const out = await graph.invoke({ applicationId })

  if (!out.finalReport) {
    throw new Error('Diligence graph did not produce a final report')
  }

  const admin = createAdminClient()
  const { error: upErr } = await admin
    .from('applications')
    .update({
      diligence_status: 'complete',
      diligence_completed_at: new Date().toISOString(),
      diligence_report: out.finalReport as unknown as Record<string, unknown>,
      diligence_error: null,
    })
    .eq('id', applicationId)

  if (upErr) throw new Error(upErr.message)
}

export async function markDiligenceFailed(applicationId: string, message: string) {
  const admin = createAdminClient()
  await admin
    .from('applications')
    .update({
      diligence_status: 'failed',
      diligence_error: message.slice(0, 2000),
    })
    .eq('id', applicationId)
}
