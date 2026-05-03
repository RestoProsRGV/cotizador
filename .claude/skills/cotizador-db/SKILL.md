---
name: cotizador-db
description: >
  Reference guide for the cotizador Supabase database schema, RLS policy
  patterns, and MCP limitations. Covers all 9 tables, key columns, tenant
  isolation approach, public share policies for the Present-to-Client
  feature, and the hard rule that DDL must run manually in the SQL Editor.
  Use when writing migrations, querying Supabase, setting up RLS policies,
  asking about cotizador table structure, adding columns, or debugging
  data access issues. Triggers on: "cotizador schema", "database tables",
  "RLS policy", "write a migration", "add a column", "Supabase query",
  "table structure", "tenant isolation", "share token", "SQL Editor".
---

# Cotizador — Database Schema & RLS Reference

Supabase project ID: `dyomdboadrcfswfnvlhj`

## Tables

| Table | Purpose | Key columns |
|-------|---------|-------------|
| `tenants` | One row per company | `id`, `name` |
| `users` | Auth + profile | `id`, `tenant_id`, `role` (`tech`/`owner`) |
| `estimates` | Job estimates | `id`, `tenant_id`, `user_id`, `status`, `share_token`, `customer_signature_url`, `approved_at` |
| `areas` | Rooms in an estimate | `id`, `estimate_id`, `name`, `area_sf` |
| `line_items` | Priced items per area or general | `id`, `estimate_id`, `area_id` (nullable for general), `module`, `code`, `qty`, `unit_price` |
| `materials` | Material catalog per tenant | `id`, `tenant_id`, `name`, `code` |
| `price_items` | Xactimate price list per tenant | `id`, `tenant_id`, `code`, `unit_price` |
| `suggestion_rules` | Admin-configured auto-suggest rules | `id`, `tenant_id`, `trigger_item_code`, `suggested_item_code`, `qty_formula` |
| `drying_chambers` | Chamber dimensions per area | `id`, `area_id`, `length_ft`, `width_ft`, `height_ft` |

## Key column notes

- **`tenant_id`** — present on every table except `drying_chambers` (scoped via `areas → estimates → tenant_id`)
- **`estimates.status`** — `draft` → `approved` → `invoiced` (one-directional, no reversals)
- **`estimates.share_token`** — non-null enables unauthenticated read (Present to Client)
- **`estimates.customer_signature_url`** — base64 PNG stored directly in the row (~5-20 KB)
- **`estimates.approved_at`** — set when customer signs

## RLS pattern

Standard tenant isolation USING clause (use for SELECT/UPDATE/DELETE):

```sql
tenant_id = (
  SELECT tenant_id FROM users
  WHERE id = auth.uid()
)
```

Or via the `current_tenant_id()` helper function (same result, slightly cleaner):

```sql
tenant_id = current_tenant_id()
```

For child tables scoped through `estimates`:

```sql
estimate_id IN (
  SELECT id FROM estimates
  WHERE tenant_id = current_tenant_id()
    AND (user_id = auth.uid() OR is_owner())
)
```

INSERT policies use `with_check`, not `qual` (USING is null for INSERT — that is normal).

## Public share policies (intentional — do not remove)

`estimates` and `line_items` have SELECT policies that allow unauthenticated reads when `share_token IS NOT NULL`. This powers the **Present to Client** feature (read-only estimate view sent to homeowners). These policies are correct and intentional.

```sql
-- estimates: public share view
USING (share_token IS NOT NULL)

-- line_items: public share read
USING (
  estimate_id IN (
    SELECT id FROM estimates WHERE share_token IS NOT NULL
  )
)
```

## DDL rule — always manual

`CREATE TABLE`, `ALTER TABLE`, `DROP TABLE` must be run manually in the Supabase SQL Editor. MCP DDL calls (`apply_migration`, `execute_sql` with DDL) time out or fail in this project.

Workflow:
1. Write SQL to `supabase/migrations/YYYYMMDDHHMMSS_description.sql`
2. Tell user: "Run this file in Supabase SQL Editor"
3. Never call MCP for DDL

## Examples

### Example 1: Adding a column to estimates
User says: "Add a `notes` text column to estimates"

Actions:
1. Write migration: `ALTER TABLE estimates ADD COLUMN notes text;`
2. Save to `supabase/migrations/YYYYMMDDHHMMSS_add_notes_to_estimates.sql`
3. Instruct user to run in SQL Editor
4. Update TypeScript types if needed

### Example 2: Writing a new RLS policy
User says: "Add RLS to the new `notes` table"

Actions:
1. Enable RLS: `ALTER TABLE notes ENABLE ROW LEVEL SECURITY;`
2. Add policy using standard pattern above (tenant_id join through users)
3. Include INSERT with_check clause
4. Write to migration file — run manually in SQL Editor

### Example 3: Querying estimates for a tenant
```typescript
const { data } = await supabase
  .from("estimates")
  .select("*, areas(*), line_items(*)")
  .order("created_at", { ascending: false })
// RLS automatically filters to current user's tenant
```

## Troubleshooting

### Error: Query returns 0 rows for valid estimate
**Cause:** RLS policy references `profiles` instead of `users`.
**Solution:** Check all USING clauses — replace `FROM profiles` with `FROM users`.

### Error: apply_migration times out
**Cause:** DDL via MCP always fails in this project.
**Solution:** Write SQL to migrations file; user runs it in Supabase SQL Editor.

### Error: Cannot read signature on approved estimate
**Cause:** `customer_signature_url` is null — estimate was approved without signature flow.
**Solution:** Check `approved_at` first; only render signature when non-null.
