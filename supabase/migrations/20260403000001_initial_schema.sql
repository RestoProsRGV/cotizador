-- ============================================================
-- Migration: initial_schema
-- Cotizador — Water Damage Restoration Estimate Tool
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ============================================================
-- TENANTS
-- ============================================================
create table public.tenants (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz not null default now()
);

comment on table public.tenants is 'Restoration companies using the platform (multi-tenant SaaS root)';

-- ============================================================
-- USERS
-- ============================================================
create table public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  email       text not null,
  role        text not null check (role in ('owner', 'tech')),
  created_at  timestamptz not null default now()
);

comment on table public.users is 'App users; role=owner sees all tenant data, role=tech sees own estimates only';
create index on public.users(tenant_id);

-- ============================================================
-- ESTIMATES
-- ============================================================
create table public.estimates (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  user_id       uuid not null references public.users(id) on delete restrict,
  client_name   text not null,
  job_address   text not null,
  category      text not null check (category in ('cat1', 'cat2', 'cat3', 'mold')),
  status        text not null default 'draft' check (status in ('draft', 'presented', 'approved', 'declined')),
  emergency     boolean not null default false,
  share_token   uuid not null default gen_random_uuid() unique,
  outcome       text check (outcome in ('approved', 'declined', 'no_response')),
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.estimates is 'Top-level estimate record; share_token is the public link for the client view';
create index on public.estimates(tenant_id);
create index on public.estimates(user_id);
create index on public.estimates(share_token);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger estimates_updated_at
  before update on public.estimates
  for each row execute function public.set_updated_at();

-- ============================================================
-- AREAS (rooms / zones within an estimate)
-- ============================================================
create table public.areas (
  id            uuid primary key default gen_random_uuid(),
  estimate_id   uuid not null references public.estimates(id) on delete cascade,
  name          text not null,             -- e.g. "Master Bathroom", "Kitchen"
  length        numeric(8,2),              -- feet
  width         numeric(8,2),             -- feet
  height        numeric(8,2),             -- feet
  materials     text[],                   -- e.g. ['drywall','hardwood','tile']
  created_at    timestamptz not null default now()
);

comment on table public.areas is 'Physical rooms/zones measured during inspection; dimensions drive equipment calculations';
create index on public.areas(estimate_id);

-- ============================================================
-- DRYING CHAMBERS
-- ============================================================
create table public.drying_chambers (
  id            uuid primary key default gen_random_uuid(),
  estimate_id   uuid not null references public.estimates(id) on delete cascade,
  name          text not null,             -- e.g. "Chamber 1 — Kitchen + Hallway"
  area_ids      uuid[] not null default '{}',  -- which areas are in this chamber
  created_at    timestamptz not null default now()
);

comment on table public.drying_chambers is 'Isolated drying zones; equipment is calculated per chamber independently';
create index on public.drying_chambers(estimate_id);

-- ============================================================
-- LINE ITEMS
-- ============================================================
create table public.line_items (
  id                  uuid primary key default gen_random_uuid(),
  estimate_id         uuid not null references public.estimates(id) on delete cascade,
  module              text not null,        -- WTR, EQP, DEM, CLN, DEB, GEN, HVA, FLR
  name                text not null,
  xactimate_code      text,
  unit                text not null,        -- SF, LF, EA, CY, day, flat
  quantity            numeric(10,3) not null default 0,
  unit_price          numeric(10,2) not null default 0,
  is_manual_override  boolean not null default false,
  system_value        numeric(10,3),        -- the calculated value before override
  sort_order          integer not null default 0,
  created_at          timestamptz not null default now()
);

comment on table public.line_items is 'Individual line items on an estimate; system_value preserved when tech overrides quantity';
create index on public.line_items(estimate_id);
create index on public.line_items(module);

-- ============================================================
-- PRICE ITEMS (per-tenant price book)
-- ============================================================
create table public.price_items (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  name            text not null,
  xactimate_code  text,
  unit_price      numeric(10,2) not null,
  unit            text not null,
  last_updated    timestamptz not null default now()
);

comment on table public.price_items is 'Tenant price book; overrides default Xactimate prices for that company';
create index on public.price_items(tenant_id);
create unique index on public.price_items(tenant_id, xactimate_code) where xactimate_code is not null;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Helper: get current user's tenant_id
create or replace function public.current_tenant_id()
returns uuid language sql stable security definer as $$
  select tenant_id from public.users where id = auth.uid()
$$;

-- Helper: check if current user is owner
create or replace function public.is_owner()
returns boolean language sql stable security definer as $$
  select exists(
    select 1 from public.users
    where id = auth.uid() and role = 'owner'
  )
$$;

-- Enable RLS on all tables
alter table public.tenants          enable row level security;
alter table public.users            enable row level security;
alter table public.estimates        enable row level security;
alter table public.areas            enable row level security;
alter table public.drying_chambers  enable row level security;
alter table public.line_items       enable row level security;
alter table public.price_items      enable row level security;

-- ---- TENANTS ------------------------------------------------
-- Users can only see their own tenant
create policy "tenants: read own" on public.tenants
  for select using (id = public.current_tenant_id());

-- ---- USERS --------------------------------------------------
-- Owners see all users in their tenant; techs see only themselves
create policy "users: owner reads all in tenant" on public.users
  for select using (
    tenant_id = public.current_tenant_id()
    and public.is_owner()
  );

create policy "users: tech reads self" on public.users
  for select using (id = auth.uid());

-- ---- ESTIMATES ----------------------------------------------
-- Owners see all estimates in tenant; techs see only their own
create policy "estimates: owner reads tenant" on public.estimates
  for select using (
    tenant_id = public.current_tenant_id()
    and public.is_owner()
  );

create policy "estimates: tech reads own" on public.estimates
  for select using (
    tenant_id = public.current_tenant_id()
    and user_id = auth.uid()
  );

create policy "estimates: insert" on public.estimates
  for insert with check (
    tenant_id = public.current_tenant_id()
    and user_id = auth.uid()
  );

create policy "estimates: update own" on public.estimates
  for update using (
    tenant_id = public.current_tenant_id()
    and (user_id = auth.uid() or public.is_owner())
  );

-- Public share token access (no auth required for client view)
create policy "estimates: public share view" on public.estimates
  for select using (share_token is not null);

-- ---- AREAS --------------------------------------------------
create policy "areas: via estimate" on public.areas
  for all using (
    estimate_id in (
      select id from public.estimates
      where tenant_id = public.current_tenant_id()
        and (user_id = auth.uid() or public.is_owner())
    )
  );

-- ---- DRYING CHAMBERS ----------------------------------------
create policy "drying_chambers: via estimate" on public.drying_chambers
  for all using (
    estimate_id in (
      select id from public.estimates
      where tenant_id = public.current_tenant_id()
        and (user_id = auth.uid() or public.is_owner())
    )
  );

-- ---- LINE ITEMS ---------------------------------------------
create policy "line_items: via estimate" on public.line_items
  for all using (
    estimate_id in (
      select id from public.estimates
      where tenant_id = public.current_tenant_id()
        and (user_id = auth.uid() or public.is_owner())
    )
  );

-- Public read for client view (via share token)
create policy "line_items: public share read" on public.line_items
  for select using (
    estimate_id in (
      select id from public.estimates where share_token is not null
    )
  );

-- ---- PRICE ITEMS -------------------------------------------
create policy "price_items: tenant only" on public.price_items
  for all using (tenant_id = public.current_tenant_id());
