-- ============================================================
-- Migration: business_logic_rpcs
-- PostgreSQL functions mirroring src/lib/logic/*.ts
-- Rules live in the DB so they can be called from any client
-- or enforced server-side.
-- ============================================================

-- ============================================================
-- EQUIPMENT CALCULATIONS (IICRC S500)
-- ============================================================

-- Air movers: ceil(affected_sf / 50), minimum 2
create or replace function public.calc_air_movers(affected_sf numeric)
returns integer language plpgsql immutable as $$
begin
  if affected_sf <= 0 then return 0; end if;
  return greatest(2, ceil(affected_sf / 50.0)::integer);
end;
$$;

-- Dehumidifiers: ceil(length * width * height / 100), minimum 1
create or replace function public.calc_dehumidifiers(
  length_ft numeric,
  width_ft  numeric,
  height_ft numeric
) returns integer language plpgsql immutable as $$
declare
  volume_cf numeric;
begin
  volume_cf := length_ft * width_ft * height_ft;
  if volume_cf <= 0 then return 0; end if;
  return greatest(1, ceil(volume_cf / 100.0)::integer);
end;
$$;

-- Air scrubbers: ceil(affected_sf / 300), minimum 1
create or replace function public.calc_air_scrubbers(affected_sf numeric)
returns integer language plpgsql immutable as $$
begin
  if affected_sf <= 0 then return 0; end if;
  return greatest(1, ceil(affected_sf / 300.0)::integer);
end;
$$;

-- Full equipment package for a single area/chamber
create or replace function public.calc_equipment_for_area(
  affected_sf       numeric,
  length_ft         numeric,
  width_ft          numeric,
  height_ft         numeric,
  needs_air_scrubber boolean default false
) returns jsonb language plpgsql immutable as $$
begin
  return jsonb_build_object(
    'air_movers',     public.calc_air_movers(affected_sf),
    'dehumidifiers',  public.calc_dehumidifiers(length_ft, width_ft, height_ft),
    'air_scrubbers',  case when needs_air_scrubber
                          then public.calc_air_scrubbers(affected_sf)
                          else 0 end
  );
end;
$$;

-- ============================================================
-- SUPERVISION FEE
-- ============================================================

-- Returns flat fee amount based on total affected SF
create or replace function public.calc_supervision_fee(total_affected_sf numeric)
returns integer language plpgsql immutable as $$
begin
  if total_affected_sf < 500 then
    return 150;   -- small
  elsif total_affected_sf <= 1500 then
    return 250;   -- medium
  else
    return 400;   -- large
  end if;
end;
$$;

-- Job size label
create or replace function public.job_size_label(total_affected_sf numeric)
returns text language plpgsql immutable as $$
begin
  if total_affected_sf < 500 then return 'small';
  elsif total_affected_sf <= 1500 then return 'medium';
  else return 'large';
  end if;
end;
$$;

-- ============================================================
-- EMERGENCY FEE
-- ============================================================

-- Returns true when timestamp is outside M-F 8am-5pm
-- Uses AT TIME ZONE 'America/Chicago' (RestoPros is in Texas)
create or replace function public.is_emergency_call(call_time timestamptz)
returns boolean language plpgsql immutable as $$
declare
  local_time timestamptz;
  dow        integer;  -- 0=Sun, 1=Mon ... 6=Sat
  hour_of_day integer;
begin
  local_time  := call_time at time zone 'America/Chicago';
  dow         := extract(dow from local_time);
  hour_of_day := extract(hour from local_time);

  -- Weekend
  if dow = 0 or dow = 6 then return true; end if;
  -- Before 8am or at/after 5pm
  if hour_of_day < 8 or hour_of_day >= 17 then return true; end if;

  return false;
end;
$$;

-- ============================================================
-- DEBRIS CALCULATION
-- ============================================================

-- Calculates debris loads from a JSONB array of {material, quantity_sf}
-- e.g. '[{"material":"drywall","quantity_sf":200},{"material":"carpet","quantity_sf":150}]'
create or replace function public.calc_debris_loads(demo_scope jsonb)
returns integer language plpgsql immutable as $$
declare
  density_map jsonb := '{
    "drywall":    0.006,
    "insulation": 0.010,
    "hardwood":   0.004,
    "carpet":     0.003,
    "tile":       0.005,
    "subfloor":   0.004
  }';
  item       jsonb;
  total_cy   numeric := 0;
  density    numeric;
begin
  for item in select * from jsonb_array_elements(demo_scope)
  loop
    density := coalesce(
      (density_map ->> (item->>'material'))::numeric,
      0.005  -- default for unknown materials
    );
    total_cy := total_cy + (item->>'quantity_sf')::numeric * density;
  end loop;

  if total_cy <= 0 then return 0; end if;
  return greatest(1, ceil(total_cy / 10.0)::integer);
end;
$$;

-- ============================================================
-- FULL ESTIMATE RECALCULATION
-- Recalculates all system-generated line items for an estimate,
-- preserving any items where is_manual_override = true.
-- ============================================================

create or replace function public.recalculate_estimate(p_estimate_id uuid)
returns void language plpgsql security definer as $$
declare
  est         record;
  total_sf    numeric := 0;
  eq          jsonb;
  area_row    record;
  needs_scrubber boolean;
begin
  -- Load estimate
  select * into est from public.estimates where id = p_estimate_id;
  if not found then raise exception 'Estimate not found'; end if;

  needs_scrubber := est.category in ('cat2', 'cat3', 'mold');

  -- Sum affected SF across all areas
  select coalesce(sum(length * width), 0)
  into total_sf
  from public.areas
  where estimate_id = p_estimate_id;

  -- Recalculate equipment per area/chamber
  for area_row in
    select * from public.areas where estimate_id = p_estimate_id
  loop
    eq := public.calc_equipment_for_area(
      area_row.length * area_row.width,
      area_row.length,
      area_row.width,
      area_row.height,
      needs_scrubber
    );

    -- Update air movers (skip if manually overridden)
    update public.line_items
    set
      system_value = (eq->>'air_movers')::numeric,
      quantity     = case when is_manual_override then quantity
                          else (eq->>'air_movers')::numeric end
    where estimate_id = p_estimate_id
      and xactimate_code = 'EQP-AMVR';

    -- Update dehumidifiers (skip if manually overridden)
    update public.line_items
    set
      system_value = (eq->>'dehumidifiers')::numeric,
      quantity     = case when is_manual_override then quantity
                          else (eq->>'dehumidifiers')::numeric end
    where estimate_id = p_estimate_id
      and xactimate_code = 'EQP-DH-LG';

    -- Update air scrubbers (skip if manually overridden)
    update public.line_items
    set
      system_value = (eq->>'air_scrubbers')::numeric,
      quantity     = case when is_manual_override then quantity
                          else (eq->>'air_scrubbers')::numeric end
    where estimate_id = p_estimate_id
      and xactimate_code = 'EQP-ASCR';
  end loop;

  -- Supervision fee (never manually overridden — always recalculate)
  update public.line_items
  set
    system_value = public.calc_supervision_fee(total_sf),
    quantity     = public.calc_supervision_fee(total_sf)
  where estimate_id = p_estimate_id
    and xactimate_code = 'GEN-SUPV';

end;
$$;

-- Grant execute to authenticated users
grant execute on function public.calc_air_movers(numeric) to authenticated;
grant execute on function public.calc_dehumidifiers(numeric, numeric, numeric) to authenticated;
grant execute on function public.calc_air_scrubbers(numeric) to authenticated;
grant execute on function public.calc_equipment_for_area(numeric, numeric, numeric, numeric, boolean) to authenticated;
grant execute on function public.calc_supervision_fee(numeric) to authenticated;
grant execute on function public.job_size_label(numeric) to authenticated;
grant execute on function public.is_emergency_call(timestamptz) to authenticated;
grant execute on function public.calc_debris_loads(jsonb) to authenticated;
grant execute on function public.recalculate_estimate(uuid) to authenticated;
