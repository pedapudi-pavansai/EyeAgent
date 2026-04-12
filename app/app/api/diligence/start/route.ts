import { NextRequest, NextResponse } from 'next/server'
import { after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { processNextDiligenceJob } from '@/lib/diligence/process-queue'

/**
 * Enqueue full diligence (background worker). Fast ai_score path remains separate.
 * Only one diligence may be queued or running at a time platform-wide (DB + admin check).
 * After enqueue, `after()` kicks the worker so local dev does not wait for cron.
 */
export async function POST(req: NextRequest) {
  const { application_id } = await req.json()
  if (!application_id) {
    return NextResponse.json({ error: 'Missing application_id' }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: appRow, error: appErr } = await supabase
    .from('applications')
    .select('id, diligence_status, property_id, screening_consent_at')
    .eq('id', application_id)
    .single()

  if (appErr || !appRow) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 })
  }

  const { data: property } = await supabase
    .from('properties')
    .select('landlord_id')
    .eq('id', appRow.property_id)
    .single()

  if (!property || property.landlord_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const status = appRow.diligence_status as string

  if (status === 'complete') {
    return NextResponse.json(
      { error: 'Diligence already completed for this application.' },
      { status: 409 }
    )
  }

  if (status === 'queued' || status === 'running') {
    return NextResponse.json(
      {
        error:
          'A diligence run is already in progress for this application. Wait until it finishes.',
      },
      { status: 409 }
    )
  }

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const admin = createAdminClient()
      const { data: inflightOthers } = await admin
        .from('applications')
        .select('id')
        .in('diligence_status', ['queued', 'running'])
        .neq('id', application_id)
        .limit(2)

      if (inflightOthers && inflightOthers.length > 0) {
        return NextResponse.json(
          {
            error:
              'Another diligence report is already queued or running. Only one full diligence runs at a time — wait for it to finish.',
            code: 'diligence_inflight',
          },
          { status: 409 }
        )
      }
    } catch (e) {
      console.error('[diligence/start] global inflight check:', e)
    }
  }

  const consentRequired = process.env.DILIGENCE_CONSENT_REQUIRED === 'true'
  if (consentRequired && !appRow.screening_consent_at) {
    return NextResponse.json(
      {
        error:
          'Screening consent is required before ordering a third-party report. Record applicant consent (screening_consent_at) before retrying.',
        code: 'consent_required',
      },
      { status: 403 }
    )
  }

  if (!process.env.GOOGLE_API_KEY) {
    return NextResponse.json(
      {
        error: 'AI scoring is not configured. Add GOOGLE_API_KEY to your environment variables.',
        code: 'ai_not_configured',
      },
      { status: 422 }
    )
  }

  const now = new Date().toISOString()
  const { error: upErr } = await supabase
    .from('applications')
    .update({
      diligence_status: 'queued',
      diligence_queued_at: now,
      diligence_error: null,
    })
    .eq('id', application_id)

  if (upErr) {
    if (upErr.code === '23505') {
      return NextResponse.json(
        {
          error:
            'Another diligence report is already queued or running. Only one full diligence runs at a time — wait for it to finish.',
          code: 'diligence_inflight',
        },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: upErr.message }, { status: 500 })
  }

  after(() => {
    processNextDiligenceJob().catch(err => {
      console.error('[diligence] processNextDiligenceJob after start:', err)
    })
  })

  return NextResponse.json({ ok: true, status: 'queued' }, { status: 202 })
}
