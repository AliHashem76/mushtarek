-- Phase 5: provider subscription fee (drives MRR)
alter table public.providers
  add column if not exists monthly_fee_usd numeric(10,2) not null default 25;
