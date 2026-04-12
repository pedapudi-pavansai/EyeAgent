export type Role = 'landlord' | 'applicant' | 'tenant'
export type ApplicationStatus = 'pending' | 'under_review' | 'accepted' | 'rejected'

export type DiligenceStatus = 'none' | 'queued' | 'running' | 'complete' | 'failed'
export type ServiceRequestStatus = 'open' | 'in_progress' | 'resolved'

export interface Profile {
  id: string
  role: Role
  full_name: string
  email: string
  phone?: string
  business_name?: string
  created_at: string
}

export interface Property {
  id: string
  landlord_id: string
  address: string
  unit_count: number
  property_type: string
  purchase_price: number
  monthly_rent: number
  photo_url?: string
  created_at: string
}

export interface Application {
  id: string
  property_id: string
  applicant_id?: string
  email: string
  full_name: string
  phone: string
  employer: string
  job_title: string
  annual_income: number
  fico_score: number
  monthly_debts: number
  rental_history: any
  status: ApplicationStatus
  ai_score?: number
  ai_insights?: string
  submitted_at: string
  diligence_status?: DiligenceStatus
  diligence_queued_at?: string | null
  diligence_started_at?: string | null
  diligence_completed_at?: string | null
  diligence_provider?: string | null
  diligence_external_order_id?: string | null
  diligence_report?: Record<string, unknown> | null
  diligence_error?: string | null
  /** Set when applicant has authorized third-party screening (optional gate via DILIGENCE_CONSENT_REQUIRED) */
  screening_consent_at?: string | null
}

export interface ServiceRequest {
  id: string
  property_id: string
  tenant_id: string
  category: string
  description: string
  photo_url?: string
  status: ServiceRequestStatus
  landlord_notes?: string
  created_at: string
}

export interface MarketplaceListing {
  id: string
  address: string
  city: string
  price: number
  cap_rate: number
  cash_on_cash: number
  property_type: string
  bedrooms: number
  photo_url?: string
  external_url?: string
  ai_tag?: string
  ai_thesis?: string
}

export interface Payment {
  id: string
  tenant_id: string
  property_id: string
  amount: number
  status: string
  period_start: string
  paid_at: string
}

/** Shape returned by RentCast `GET /v1/listings/sale` (fields may be null/omitted). */
export interface RentCastSaleListing {
  id: string
  formattedAddress?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  zipCode?: string
  county?: string
  latitude?: number
  longitude?: number
  propertyType?: string
  bedrooms?: number
  bathrooms?: number
  squareFootage?: number
  lotSize?: number
  yearBuilt?: number
  status?: string
  price?: number
  listingType?: string
  listedDate?: string
  daysOnMarket?: number
  mlsName?: string
  mlsNumber?: string
}
