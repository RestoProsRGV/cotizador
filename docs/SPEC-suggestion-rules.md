# Spec: Suggestion Rules Manager

## Problem

When a tech selects item A in Demo or Prep, the app auto-suggests item B.
Example: "Drywall Flood Cut 4ft" → suggests "Insulation Removal" (qty × 4).

These rules are currently **hardcoded** in `src/constants/demoItems.ts` and
`src/constants/prepItems.ts`. The owner cannot change them without a code
deployment. The `suggestion_rules` table already exists in Supabase with
RestoPros defaults seeded, but the app ignores it.

## Options considered

**Option A — DB-driven with hardcoded fallback (chosen)**
- Admin UI reads/writes `suggestion_rules` table
- App logic remains unchanged: still reads hardcoded rules from demoItems.ts
- Two systems coexist until the migration is complete
- Safe: hardcoded rules continue to work if DB has no matching rule

**Option B — Replace hardcoded with DB at runtime**
- Demo.tsx and Prep.tsx fetch rules from Supabase before rendering
- Rejected: adds async dependency to field screens, risks latency/failure on-site

**Option C — Code editor in admin**
- Owner edits demoItems.ts via a text editor embedded in the admin UI
- Rejected: terrible DX, requires redeploy anyway

## Decision

Option A. Build the admin UI to manage rules in DB. Do not change Demo.tsx
or Prep.tsx yet — that migration is a separate session.

## Implementation plan

1. `docs/SPEC-suggestion-rules.md` — this file
2. `src/pages/desktop/DesktopSuggestionRules.tsx` — two-panel admin page
   - Left panel (320px): list of trigger items grouped from DB rules
   - Right panel: inline-editable suggestions table for selected trigger
   - Auto-save on change (same pattern as Setup screen)
3. `src/components/desktop/DesktopSidebar.tsx` — add Zap icon nav item
4. `src/App.tsx` — add `/desktop/admin/suggestion-rules` route (requireOwner)
5. `src/pages/desktop/__tests__/DesktopSuggestionRules.test.tsx` — 6 tests
6. `DECISIONS.md` — record the DB-driven + hardcoded fallback decision
7. `CHANGELOG.md` — session entry

## Item code catalog

Available item codes for dropdowns come from combining:
- `ALL_DEMO_ITEMS` from `src/constants/demoItems.ts` (~25 items)
- `ALL_PREP_ITEMS` from `src/constants/prepItems.ts` (~14 items)
Sorted alphabetically by name. Total ~39 items.

## DB schema (already exists in Supabase)

```sql
create table suggestion_rules (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade,
  trigger_item_code text not null,
  suggested_item_code text not null,
  qty_formula text not null default 'same_qty',  -- same_qty | multiplier | fixed
  qty_multiplier numeric,                          -- used when formula = multiplier
  active boolean not null default true,
  created_at timestamptz default now()
);

alter table suggestion_rules enable row level security;

create policy "tenant_isolation" on suggestion_rules
  using (tenant_id = (select tenant_id from users where id = auth.uid()));
```

If the table doesn't exist, apply the migration via Supabase MCP in claude.ai.

## Edge cases

- **Item code not in local catalog**: Show the raw code as fallback (future-proof
  for items added via DB directly or from other modules).
- **Duplicate suggested items**: UI prevents adding the same suggested_item_code
  twice for the same trigger.
- **Delete last suggestion for a trigger**: Trigger disappears from left panel
  (no suggestions = not visible). This is correct behavior.
- **No DB rules at all**: Left panel shows empty state, hardcoded rules still
  work in the field app.
- **Non-owner access**: RequireAuth + requireOwner redirects to /estimates.
- **Qty multiplier on save**: Only sent to DB when formula = 'multiplier',
  set to null otherwise to keep DB clean.
