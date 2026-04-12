import type { DeterministicFit } from '@/lib/diligence/schema'

export function computeDeterministicFit(input: {
  annual_income: number
  monthly_debts: number
  monthly_rent: number | null
}): DeterministicFit {
  const monthly_income = input.annual_income / 12
  const monthly_debts = Math.max(0, input.monthly_debts)
  const rent = input.monthly_rent

  let estimated_dti_percent: number | null = null
  if (monthly_income > 0) {
    const totalOut = monthly_debts + (rent ?? 0)
    estimated_dti_percent = Math.round((totalOut / monthly_income) * 1000) / 10
  }

  let rent_to_income_ratio: number | null = null
  if (rent != null && monthly_income > 0) {
    rent_to_income_ratio = Math.round((rent / monthly_income) * 1000) / 10
  }

  let rent_affordability_note = ''
  if (rent_to_income_ratio != null) {
    if (rent_to_income_ratio <= 30) {
      rent_affordability_note = 'Rent is within a common 30% of gross monthly income guideline (informational only).'
    } else if (rent_to_income_ratio <= 40) {
      rent_affordability_note = 'Rent is elevated relative to income; consider additional verification (informational only).'
    } else {
      rent_affordability_note = 'Rent is high relative to stated income; elevated risk from a budget perspective (informational only).'
    }
  } else {
    rent_affordability_note = 'Monthly rent unknown; income ratio not computed.'
  }

  return {
    monthly_rent: rent,
    annual_income: input.annual_income,
    monthly_debts: input.monthly_debts,
    estimated_dti_percent,
    rent_to_income_ratio,
    rent_affordability_note,
  }
}
