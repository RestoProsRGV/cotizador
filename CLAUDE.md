Read CLAUDE.md, docs/ARCHITECTURE.md, docs/MODULES.md, docs/CALCULATIONS.md, DECISIONS.md, CHANGELOG.md before change.

## How we work

### Roles
- **claude.ai** — analysis, architecture, UX, prompt gen
- **Claude Code** — implement only. No architecture decision without prompt from claude.ai session.

### Pre-push checklist (every push to main)
1. `/gstack:review` — fix all before push
2. `npm test` — all pass
3. Push
4. Verify Vercel deploy READY
5. Update CHANGELOG.md with deploy verification

### When to write a spec first
Before implement any: create spec in `docs/SPEC-[feature].md`:
- New modules or big features
- Pricing logic or IICRC formula changes
- Multi-step flows (approvals, versioning, PDF)
- Touch more than 3 files

Spec template:
```
# Spec: [Feature Name]
## Problem
## Options considered
## Decision
## Implementation plan
## Edge cases
```

### When CLAUDE.md gets too long
CLAUDE.md exceed 150 lines → split into domain files under `docs/`.

---

@AGENTS.md
@DECISIONS.md
@CHANGELOG.md

## How to use this project

- `CLAUDE.md` — rules + how we work
- `docs/ARCHITECTURE.md` — routes, Mobile vs Desktop, device routing, navigation
- `docs/MODULES.md` — module logic, materials, area pre-loading
- `docs/CALCULATIONS.md` — Flood Cut, IICRC formulas, pricing rules
- `DECISIONS.md` — why every decision made
- `CHANGELOG.md` — what built each session, what open

**Rule:** End of every session, update `CHANGELOG.md`:
1. New decisions
2. Commits pushed
3. New open items

Never change anything that contradicts `DECISIONS.md` without flagging user first.

## Stack
React 18 + Vite + TypeScript · Supabase (Postgres + Auth + RLS) · Vercel · Tailwind v4 · React Query · React Router v6 · Vitest + Testing Library · i18n via react-i18next

## Supabase table names
User profiles table: `users` (NOT `profiles`). Always use `users` in RLS policies and queries.

## Sentry
Sentry prod-only — no mock or init in tests. `initSentry()` no-op unless `import.meta.env.PROD` true.

## Supabase MCP in claude.ai
Supabase MCP connected to claude.ai (not just Claude Code). Use to audit prod data — verify line_items saved, totals match UI, validate pricing — no need ask Claude Code write query scripts.

## Skill routing

User request match skill → ALWAYS invoke with Skill tool FIRST. No direct answer. No other tools first.

Key routing:
- Product ideas, brainstorm → invoke office-hours
- Bugs, errors, 500 → invoke investigate
- Ship, deploy, push, PR → invoke ship
- QA, find bugs → invoke qa
- Code review, diff → invoke review
- Update docs after ship → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint → invoke checkpoint
- Code quality, health → invoke health