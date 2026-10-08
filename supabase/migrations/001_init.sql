-- Mushtarak | Phase 1 schema

create table public.providers (
  id uuid primary key references auth.users(id) on delete cascade,
  business_name text not null,
  owner_name text not null,
  phone text not null,
  role text not null default 'provider' check (role in ('provider','super_admin')),
  subscription_status text not null default 'active' check (subscription_status in ('active','suspended')),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.provider_settings (
  provider_id uuid primary key references public.providers(id) on delete cascade,
  usd_rate numeric(12,2) not null default 89500,
  kwh_price_usd numeric(10,4) not null default 0.35,
  base_generator_fee numeric(10,2) not null default 0
);

create table public.subscribers (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  full_name text not null,
  phone text not null,
  address_zone text,
  address_building text,
  address_floor text,
  has_generator boolean not null default false,
  generator_type text check (generator_type in ('meter','flat')),
  meter_number text,
  last_meter_reading numeric(12,2) not null default 0,
  generator_flat_price numeric(10,2),
  has_internet boolean not null default false,
  internet_plan_name text,
  internet_price numeric(10,2),
  has_satellite boolean not null default false,
  satellite_price numeric(10,2),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  subscriber_id uuid not null references public.subscribers(id) on delete cascade,
  billing_month date not null,
  prev_reading numeric(12,2),
  curr_reading numeric(12,2),
  kwh_consumed numeric(12,2),
  generator_amount numeric(10,2) not null default 0,
  internet_amount numeric(10,2) not null default 0,
  satellite_amount numeric(10,2) not null default 0,
  previous_debt numeric(10,2) not null default 0,
  total_amount_usd numeric(10,2) not null default 0,
  total_amount_lbp numeric(18,0) not null default 0,
  status text not null default 'unpaid' check (status in ('unpaid','paid')),
  created_at timestamptz not null default now(),
  unique (subscriber_id, billing_month)
);

create index on public.subscribers (provider_id, is_active);
create index on public.subscribers (provider_id, address_zone);
create index on public.invoices (provider_id, billing_month);
create index on public.invoices (subscriber_id, status);

-- Auto-create default settings for every new provider
create or replace function public.handle_new_provider()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.provider_settings (provider_id) values (new.id) on conflict do nothing;
  return new;
end $$;

create trigger on_provider_created
after insert on public.providers
for each row execute function public.handle_new_provider();

-- RLS: flat, no nested lookups. Super admin writes go through the service-role client.
alter table public.providers enable row level security;
alter table public.provider_settings enable row level security;
alter table public.subscribers enable row level security;
alter table public.invoices enable row level security;

create policy "own profile read" on public.providers
  for select using (id = auth.uid());

create policy "own settings" on public.provider_settings
  for all using (provider_id = auth.uid()) with check (provider_id = auth.uid());

create policy "own subscribers" on public.subscribers
  for all using (provider_id = auth.uid()) with check (provider_id = auth.uid());

create policy "own invoices" on public.invoices
  for all using (provider_id = auth.uid()) with check (provider_id = auth.uid());

-- Bootstrap Super Admin:
-- 1) Authentication > Users > Add user (email + password)
-- 2) Run, replacing the UUID:
-- insert into public.providers (id, business_name, owner_name, phone, role)
-- values ('<AUTH_USER_UUID>', 'Mushtarak', 'Admin', '96100000000', 'super_admin');
