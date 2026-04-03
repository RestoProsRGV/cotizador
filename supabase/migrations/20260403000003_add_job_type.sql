-- ============================================================
-- Migration: add_job_type
-- Separates job_type (Water/Mold/Storm) from category (Cat 1/2/3).
-- category becomes nullable — null for storm jobs (no subcategory).
-- ============================================================

-- Add job_type column; default 'water' covers all existing rows
alter table public.estimates
  add column job_type text not null default 'water'
  check (job_type in ('water', 'mold', 'storm'));

-- Backfill: rows with category='mold' are mold jobs
update public.estimates set job_type = 'mold' where category = 'mold';

-- Make category nullable (storm jobs have no water category)
alter table public.estimates alter column category drop not null;

comment on column public.estimates.job_type is 'Primary job type: water, mold, or storm';
comment on column public.estimates.category is 'Water damage category (cat1/cat2/cat3); null for mold/storm jobs';
