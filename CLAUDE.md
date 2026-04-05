Read CLAUDE.md, docs/ARCHITECTURE.md, docs/MODULES.md, docs/CALCULATIONS.md, DECISIONS.md, and CHANGELOG.md before making any changes.

## How we work

### Roles
- **claude.ai** — analysis, architecture decisions, UX design, prompt generation
- **Claude Code** — implementation only. Never make architectural decisions
  without a prompt that came from a claude.ai session.

### Pre-push checklist (every push to main)
1. `/gstack:review` — fix all issues before pushing
2. `npm test` — all tests must pass
3. Push
4. Verify Vercel deploy is READY
5. Update CHANGELOG.md with deploy verification

### When to write a spec first
Before implementing any of these, create a spec doc in `docs/SPEC-[feature].md`:
- New modules or major features
- Changes to pricing logic or IICRC formulas
- Multi-step flows (approvals, versioning, PDF generation)
- Anything that touches more than 3 files

Spec doc template:
```
# Spec: [Feature Name]
## Problem
## Options considered
## Decision
## Implementation plan
## Edge cases
```

### When CLAUDE.md gets too long
When CLAUDE.md exceeds 150 lines, split further into additional domain files under `docs/`.

---

@AGENTS.md
@DECISIONS.md
@CHANGELOG.md

## How to use this project

- `CLAUDE.md` — general rules + how we work
- `docs/ARCHITECTURE.md` — routes, Mobile vs Desktop, device routing, navigation
- `docs/MODULES.md` — per-module business logic, materials, area pre-loading
- `docs/CALCULATIONS.md` — Flood Cut logic, IICRC formulas, pricing rules
- `DECISIONS.md` — why every decision was made
- `CHANGELOG.md` — what was built in each session and what is open

**Rule:** At the end of every session, update `CHANGELOG.md` with:
1. New decisions made
2. Commits pushed
3. New open items discovered

Never make a change that contradicts a decision in `DECISIONS.md` without first flagging it to the user.

## Stack
React 18 + Vite + TypeScript · Supabase (Postgres + Auth + RLS) · Vercel · Tailwind v4 · React Query · React Router v6 · Vitest + Testing Library · i18n via react-i18next

## Supabase table names
User profiles table: `users` (NOT `profiles`). Always use `users` in RLS policies and queries.

## Sentry
Sentry is prod-only — never mock or initialize in tests. `initSentry()` is a no-op unless `import.meta.env.PROD` is true.

## Supabase MCP in claude.ai
Supabase MCP is connected to claude.ai (not just Claude Code).
Use it to audit production data directly — verify line_items saved correctly,
check that totals match UI, validate pricing calculations — without asking
Claude Code to write query scripts.

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health
