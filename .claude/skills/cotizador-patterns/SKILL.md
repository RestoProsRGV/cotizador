---
name: cotizador-patterns
description: >
  Enforces project-specific coding conventions and prevents common mistakes
  in the cotizador RestoPros codebase. Covers Supabase RLS table naming,
  tenant isolation schema, PWA-safe navigation, quantity input types, Sentry
  initialization guard, DDL restrictions, and pre-push checklist. Use when
  working on cotizador, adding a Supabase table, writing RLS policies,
  adding navigation calls, wiring quantity fields, initializing Sentry,
  or preparing to push to main. Triggers on: "cotizador patterns",
  "common mistakes", "project conventions", "add a table", "RLS policy",
  "navigate back", "quantity input", "Sentry init", "pre-push checklist",
  "push to main".
---

# Cotizador — Project Patterns & Common Mistakes

Repo-specific rules that prevent the most common errors in cotizador.
Apply these on every task without waiting to be asked.

## Rules

### 1. Supabase table names
- User profiles table is `users`. **Never** `profiles`.
- Use `users` in every RLS policy and every query.

```sql
-- CORRECT
SELECT tenant_id FROM users WHERE id = auth.uid()

-- WRONG — will 404 at runtime
SELECT tenant_id FROM profiles WHERE id = auth.uid()
```

### 2. New tables always need tenant_id
Every new table must include:

```sql
tenant_id uuid NOT NULL REFERENCES tenants(id)
```

Without this, RLS tenant isolation is impossible.

### 3. PWA-safe navigation
Always navigate to explicit paths. Never use `navigate(-1)` — PWA cold launches have no browser history.

```typescript
// CORRECT
navigate("/estimates")
navigate(`/estimates/${id}/total`)

// WRONG — breaks on fresh PWA launch
navigate(-1)
```

### 4. Quantity inputs accept math expressions
All qty fields use `CalcInput`, not `<input type="number">`.

```tsx
// CORRECT
<CalcInput value={qty} onChange={setQty} />

// WRONG — prevents math expressions like "3*12"
<input type="number" value={qty} onChange={...} />
```

If you need a plain input (non-qty), use `type="text" inputMode="decimal"`.

### 5. Sentry — prod only
Wrap any Sentry init/call in a PROD guard:

```typescript
// CORRECT
if (import.meta.env.PROD) {
  Sentry.init({ dsn: ... })
}

// WRONG — pollutes dev/test with noise
Sentry.init({ dsn: ... })
```

Never mock or import Sentry in tests.

### 6. DDL runs in Supabase SQL Editor — never via MCP
`CREATE TABLE`, `ALTER TABLE`, `DROP TABLE` always fail through MCP.
Write the migration SQL, then instruct the user to run it manually
in the Supabase SQL Editor.

```
// CORRECT workflow
1. Write migration file: supabase/migrations/YYYYMMDDHHMMSS_description.sql
2. Tell user: "Run this in Supabase SQL Editor"

// WRONG
mcp__supabase__apply_migration(...)  // will time out or error
```

### 7. Pre-push checklist
Before every push to `main`:
1. `/gstack:review` — fix all issues first
2. `npm test` — all tests must pass
3. Push
4. Verify Vercel deploy is READY
5. Update `CHANGELOG.md` with deploy verification

## Examples

### Example 1: Adding a new Supabase table
User says: "Add a `notes` table to the database"

Actions:
1. Write migration SQL with `tenant_id uuid NOT NULL REFERENCES tenants(id)`
2. Add RLS: `USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()))`
3. Tell user to run migration manually in Supabase SQL Editor
4. Do NOT call any MCP DDL tool

### Example 2: Adding a back button
User says: "Add a back button to the Setup screen"

Actions:
1. Use `navigate("/estimates")` — explicit path, not `navigate(-1)`
2. This works whether the user tapped the PWA icon (no history) or navigated normally

### Example 3: Wiring a quantity field
User says: "Add a length input to the new cleaning item"

Actions:
1. Import `CalcInput` from `src/components/ui/CalcInput`
2. Use `<CalcInput value={qty} onChange={setQty} />` — never `<input type="number">`
3. Supabase receives the evaluated number; expression string never persists

## Troubleshooting

### Error: RLS policy returns no rows for valid user
**Cause:** Policy references `profiles` table instead of `users`.
**Solution:** Replace every `FROM profiles` with `FROM users` in the policy USING clause.

### Error: navigate(-1) sends user to wrong screen or blank
**Cause:** PWA cold launch has no browser history stack.
**Solution:** Replace with `navigate("/estimates")` or the explicit target path.

### Error: MCP apply_migration times out
**Cause:** DDL operations via MCP always fail in this project.
**Solution:** Write the SQL to `supabase/migrations/` and ask user to run in SQL Editor.
