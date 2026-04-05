-- Customer signature and approval timestamp for estimates.
-- Run manually in Supabase SQL Editor.

alter table public.estimates
  add column if not exists customer_signature_url text,
  add column if not exists approved_at             timestamptz;

comment on column public.estimates.customer_signature_url is 'Base64 PNG data URL of customer signature from Present to Client view';
comment on column public.estimates.approved_at           is 'Timestamp when customer signed/approved the estimate on-site';
