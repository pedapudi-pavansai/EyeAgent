-- Optional gate for consumer screening: set when applicant authorizes a third-party report
alter table applications
  add column if not exists screening_consent_at timestamptz;

comment on column applications.screening_consent_at is 'When set, indicates recorded consent before ordering third-party screening (used when DILIGENCE_CONSENT_REQUIRED is enabled).';
