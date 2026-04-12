import { createAdminClient } from '@/lib/supabase/admin'
import { estimateApplicantScore } from '@/lib/screening/estimate-applicant'

export async function runScoringAgent(applicationId: string) {
  const supabase = createAdminClient()

  const { data: app, error: appError } = await supabase
    .from('applications')
    .select('*')
    .eq('id', applicationId)
    .single()

  if (appError || !app) throw new Error('Application not found')

  const { data: property } = await supabase
    .from('properties')
    .select('monthly_rent')
    .eq('id', app.property_id)
    .maybeSingle()

  const { score, insights } = estimateApplicantScore({
    annual_income: Number(app.annual_income) || 0,
    fico_score: Number(app.fico_score) || 0,
    monthly_debts: Number(app.monthly_debts) || 0,
    rental_history: app.rental_history,
    monthly_rent: property?.monthly_rent != null ? Number(property.monthly_rent) : null,
  })

  const { error: updateError } = await supabase
    .from('applications')
    .update({
      ai_score: score,
      ai_insights: insights,
      status: 'under_review',
    })
    .eq('id', applicationId)

  if (updateError) throw new Error(updateError.message)
}
