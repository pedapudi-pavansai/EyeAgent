/**
 * Deterministic screening estimate (not underwriting). Tune weights via constants below.
 */

const AFFORDABILITY_MAX = 35
const FICO_MAX = 35
const DEBT_MAX = 20
const RENTAL_MAX = 10

/** When property rent is unknown, take half of affordability max (neutral band). */
const AFFORDABILITY_NEUTRAL = AFFORDABILITY_MAX / 2

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n))
}

function scoreAffordability(annualIncome: number, monthlyRent: number | null | undefined): number {
  if (monthlyRent == null || monthlyRent <= 0 || !Number.isFinite(monthlyRent)) {
    return AFFORDABILITY_NEUTRAL
  }
  const annualRent = monthlyRent * 12
  if (annualRent <= 0 || !Number.isFinite(annualIncome) || annualIncome <= 0) {
    return 0
  }
  const ratio = annualIncome / annualRent
  if (ratio < 2) return 5
  if (ratio < 2.5) return 15
  if (ratio < 3) return 25
  if (ratio < 3.5) return 30
  return AFFORDABILITY_MAX
}

function scoreFico(fico: number): number {
  if (!Number.isFinite(fico) || fico < 300) return 5
  if (fico < 580) return 10
  if (fico < 650) return 20
  if (fico < 700) return 28
  if (fico < 750) return 32
  return FICO_MAX
}

function ficoBandLabel(fico: number): string {
  if (!Number.isFinite(fico) || fico < 300) return 'Unknown / very low'
  if (fico < 580) return 'Below 580'
  if (fico < 650) return '580–649'
  if (fico < 700) return '650–699'
  if (fico < 750) return '700–749'
  return '750+'
}

/** Debt-to-income: monthly debts / gross monthly income */
function scoreDebt(monthlyDebts: number, annualIncome: number): number {
  const monthlyIncome = annualIncome / 12
  if (!Number.isFinite(monthlyIncome) || monthlyIncome <= 0) {
    return 0
  }
  const dti = monthlyDebts / monthlyIncome
  if (!Number.isFinite(dti)) return DEBT_MAX / 2
  if (dti <= 0.2) return DEBT_MAX
  if (dti <= 0.36) return 15
  if (dti <= 0.43) return 10
  return 5
}

function countRentalEntries(rentalHistory: unknown): number {
  if (!Array.isArray(rentalHistory)) return 0
  return rentalHistory.filter((entry) => {
    if (!entry || typeof entry !== 'object') return false
    const addr = String((entry as { address?: string }).address ?? '').trim()
    return addr.length > 2
  }).length
}

function scoreRentalHistory(rentalHistory: unknown): number {
  const n = countRentalEntries(rentalHistory)
  if (n === 0) return 2
  if (n === 1) return 5
  return RENTAL_MAX
}

export interface EstimateApplicantInput {
  annual_income: number
  fico_score: number
  monthly_debts: number
  rental_history: unknown
  /** From `properties.monthly_rent`; omit or null if unknown */
  monthly_rent?: number | null
}

export interface EstimateApplicantResult {
  score: number
  insights: string
}

/**
 * Composite 0–100 estimate with templated summary lines for landlords.
 */
export function estimateApplicantScore(input: EstimateApplicantInput): EstimateApplicantResult {
  const a = scoreAffordability(input.annual_income, input.monthly_rent)
  const b = scoreFico(input.fico_score)
  const c = scoreDebt(input.monthly_debts, input.annual_income)
  const d = scoreRentalHistory(input.rental_history)
  const raw = a + b + c + d
  const score = Math.round(clamp(raw, 0, 100))

  const annualRent =
    input.monthly_rent != null && input.monthly_rent > 0 ? input.monthly_rent * 12 : null
  let affordabilityLine: string
  if (annualRent && annualRent > 0 && input.annual_income > 0) {
    const mult = input.annual_income / annualRent
    affordabilityLine = `Estimated affordability: ${mult.toFixed(2)}× annual income vs annual rent (not a guarantee of approval).`
  } else {
    affordabilityLine = 'Affordability vs listed rent: not scored (missing rent on file).'
  }

  const monthlyIncome = input.annual_income / 12
  const dti =
    monthlyIncome > 0 ? (input.monthly_debts / monthlyIncome) * 100 : null
  const dtiLine =
    dti != null && Number.isFinite(dti)
      ? `Estimated debt load vs income: ${dti.toFixed(0)}% of gross monthly income.`
      : 'Debt load: could not be estimated (income missing).'

  const rentalN = countRentalEntries(input.rental_history)
  const rentalLine =
    rentalN === 0
      ? 'Rental history on application: no prior addresses listed.'
      : `Rental history on application: ${rentalN} prior address(es) with details.`

  const insights = [
    'This is an automated screening estimate only—not legal, credit, or investment advice.',
    affordabilityLine,
    `Self-reported FICO band: ${ficoBandLabel(input.fico_score)}.`,
    dtiLine,
    rentalLine,
  ].join('\n')

  return { score, insights }
}
