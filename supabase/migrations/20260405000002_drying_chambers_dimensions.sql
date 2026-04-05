-- Add per-area chamber dimensions to drying_chambers.
-- The original schema used area_ids[] (multi-area grouping).
-- This migration adds per-area dimension columns for the field UI.

alter table public.drying_chambers
  add column if not exists area_id    uuid references public.areas(id) on delete cascade,
  add column if not exists length_ft  numeric(8,2) not null default 0,
  add column if not exists width_ft   numeric(8,2) not null default 0,
  add column if not exists height_ft  numeric(8,2) not null default 0;

comment on column public.drying_chambers.area_id    is 'Which area this chamber belongs to';
comment on column public.drying_chambers.length_ft  is 'Chamber length in feet';
comment on column public.drying_chambers.width_ft   is 'Chamber width in feet';
comment on column public.drying_chambers.height_ft  is 'Chamber height in feet';
