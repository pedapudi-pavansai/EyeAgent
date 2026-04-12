import { Resend } from 'resend'

export type SendTenantInviteParams = {
  to: string
  inviteUrl: string
  applicantName?: string
  propertyAddress?: string
}

/**
 * Sends the tenant signup link. Requires RESEND_API_KEY and EMAIL_FROM at runtime.
 * Returns ok:false when misconfigured or the provider errors (caller may fall back to manual link).
 */
export async function sendTenantInviteEmail(
  params: SendTenantInviteParams
): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM
  if (!apiKey || !from) {
    console.warn('[sendTenantInviteEmail] Missing RESEND_API_KEY or EMAIL_FROM')
    return { ok: false, error: 'Email not configured' }
  }

  const resend = new Resend(apiKey)
  const name = params.applicantName?.trim() || 'there'
  const propertyLine = params.propertyAddress?.trim()
    ? `<p style="margin:16px 0 0;color:#64748b;font-size:14px;">Property: ${escapeHtml(params.propertyAddress.trim())}</p>`
    : ''

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family:system-ui,sans-serif;line-height:1.5;color:#0f172a;max-width:480px;">
  <p>Hi ${escapeHtml(name)},</p>
  <p>Your rental application was accepted. Create your tenant account using the link below:</p>
  <p style="margin:24px 0;">
    <a href="${escapeAttr(params.inviteUrl)}" style="display:inline-block;background:#059669;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;">Complete tenant signup</a>
  </p>
  <p style="font-size:13px;color:#64748b;">If the button does not work, paste this URL into your browser:<br/>
  <span style="word-break:break-all;">${escapeHtml(params.inviteUrl)}</span></p>
  ${propertyLine}
</body>
</html>`

  try {
    const { error } = await resend.emails.send({
      from,
      to: params.to,
      subject: 'Your application was accepted — complete your tenant account',
      html,
    })
    if (error) {
      console.error('[sendTenantInviteEmail] Resend error:', error)
      return { ok: false, error: error.message }
    }
    return { ok: true }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    console.error('[sendTenantInviteEmail]', e)
    return { ok: false, error: message }
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}
