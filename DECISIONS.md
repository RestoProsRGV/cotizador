# Design & Business Logic Decisions

## How to use this document
Every significant decision is recorded here with:
- What was decided
- Why it was decided that way
- What alternatives were considered

---

## Workflow Decisions

### claude.ai vs Claude Code separation
**Decision:** claude.ai handles analysis, architecture, UX design, and prompt
generation. Claude Code only implements what claude.ai has already decided.
**Why:** Claude Code tends to implement the first option it analyzes without
exploring alternatives. Architectural decisions need exploration first.
**Alternative considered:** Everything in Claude Code — rejected because it
mixes design thinking with implementation.

### /gstack:review before every push
**Decision:** /gstack:review is mandatory before every push to main.
**Why:** Catches TypeScript errors, logic bugs, and code quality issues
before they reach production. Two failed Vercel deploys on April 3 would
have been prevented by this rule.
**Alternative considered:** Only run on major features — rejected because
bugs don't announce themselves as major.

### Spec docs before complex features
**Decision:** Any feature touching 3+ files or involving new business logic
gets a spec doc in docs/SPEC-[feature].md before implementation.
**Why:** Prevents mid-implementation architecture changes and documents
edge cases before they become bugs.
**Alternative considered:** Design in the PR description — rejected because
PR descriptions aren't read by Claude Code in future sessions.

### CLAUDE.md split threshold
**Decision:** Split CLAUDE.md into domain files when it exceeds 150 lines.
**Why:** Claude Code reads CLAUDE.md at the start of each session but loses
context from later sections in long conversations. Shorter focused files
are read more reliably.

### Sentry — prod only
**Decision:** Sentry initializes only when `import.meta.env.PROD` is true.
tracesSampleRate: 0.2 (20% of transactions). Auth errors are filtered out
(expected, not bugs). One ErrorBoundary at root, not per-component.
**Why:** Dev and test environments generate noise that pollutes error dashboards.
Auth errors are normal logout/session-expiry behavior, not application bugs.
One root boundary catches all unhandled errors without wrapping every component.

### Suggestion Rules — DB-driven with hardcoded fallback
**Decision:** Admin UI reads/writes the `suggestion_rules` table in Supabase.
The field app (Demo.tsx, Prep.tsx) continues to use hardcoded rules from
demoItems.ts and prepItems.ts. The two systems coexist until a future session
migrates the field app to read from DB at runtime.
**Why:** Adding a Supabase fetch to Demo.tsx would make field screens async-
dependent, risking latency or failure on-site. The admin UI is desktop-only
and can tolerate the network round-trip. This lets the owner configure rules
without a code deployment while keeping the field app reliable.
**Alternative considered:** Replace hardcoded with DB at runtime — rejected
because field screens need to work even with spotty connectivity.

---

## Architecture Decisions

### Per-area module structure
**Decision:** Prep, Demo, Cleaning, and Equipment are scoped per area. General is project-level.
**Why:** Each room has different materials, different demo scope, and different equipment needs. A bathroom demo is completely different from a kitchen demo.
**Alternative considered:** Global modules (one Demo list for the whole job) — rejected because it made it impossible to know which items belonged to which room.

### Mobile vs Desktop split
**Decision:** Mobile app = field tool only. Desktop = configuration and admin.
**Why:** Field techs need speed and large tap targets. Admins need configuration screens that don't make sense on a phone.
**Alternative considered:** One app for everything — rejected because mobile screen real estate is too limited for complex configuration.

### PWA manifest and service worker
**Decision:** App is installable on iPhone home screen via Safari "Add to Home Screen". `display: standalone` ensures `useDeviceRedirect` routes to mobile experience. Service worker is minimal pass-through only — no offline caching yet.
**Why:** Field techs work on-site and need fast access. Installing the PWA removes browser chrome (no address bar) and puts the icon on the home screen. The standalone display mode is what makes `useDeviceRedirect` correctly force mobile routing even on iPad.
**Alternative considered:** Vite PWA plugin — skipped for now to keep setup minimal; plain manifest.json + sw.js is sufficient for installability without adding plugin complexity.

### Device routing at entry points
**Decision:** Root URL (`/`) and `/estimates` auto-detect context. PWA (standalone display mode) always routes to mobile (`/estimates/*`). Browser with width ≥ 1024px routes to desktop (`/desktop/*`). Browser under 1024px routes to mobile. Deep links bypass detection and load directly.
**Why:** Techs install the PWA on their phone — standalone mode guarantees they always get the mobile field tool regardless of screen size. Owners reviewing estimates on a desktop browser get the wider layout automatically, no manual URL typing required.
**Alternative considered:** Manual toggle or separate login — rejected because techs shouldn't have to think about which URL to use.

### Desktop UI uses Encircle layout pattern
**Decision:** 64px dark sidebar (icon-only, `#1e2535`) + full-width content area. Routes at `/desktop/*`. Same Supabase backend, same hooks, read-only estimate/area/line-item views.
**Why:** Encircle's sidebar navigation is already familiar to RestoPros team. Icon-only keeps the sidebar compact while preserving visual grounding. Mobile (`/estimates/*`) is the field tool — desktop (`/desktop/*`) is the review and management tool.
**Alternative considered:** Top navigation bar — rejected because Encircle uses sidebar and we're following their visual language.

### i18n from day one
**Decision:** All UI strings use translation keys from en.json. Zero hardcoded text.
**Why:** Module names like "Demo" may change to "Mitigation" for market launch. With i18n, that's a one-file change.

### Encircle visual language
**Decision:** UI design replicates Encircle's visual patterns with RestoPros blue replacing Encircle orange.
**Why:** RestoPros team already uses Encircle daily. Making the cotizador feel like an Encircle extension reduces training time to near zero.

---

## Business Logic Decisions

### Disinfectant — Cat 2/Cat 3 only
**Decision:** Disinfectant auto-generates only for Category 2 or Category 3 jobs.
**Why:** Per IICRC S500 Section 7.1, antimicrobial use is generally not warranted for Cat 1. Validated against 62 real estimates — only 32% of jobs had Disinfectant.
**Alternative considered:** Always include Disinfectant — rejected because it over-charges Cat 1 clients.

### Containment always includes Zipper
**Decision:** When Containment Barrier is added, Peel & Seal Zipper is automatically added (1 EA).
**Why:** In 92% of real jobs analyzed, Containment and Zipper appeared together. A containment without a zipper is not functional.
**Alternative considered:** Zipper as a separate manual selection — rejected because it would always be forgotten.

### Flood Cut 2ft vs 4ft are separate items
**Decision:** Two separate line items: Drywall Flood Cut 2ft (LF) and Drywall Flood Cut 4ft (LF).
**Why:** Insulation suggestion formula differs: 2ft → LF×2 SF, 4ft → LF×4 SF.
**Alternative considered:** One Flood Cut item with a height selector — more complex UI with same result.

### Equipment default 3 days
**Decision:** All equipment defaults to 3 rental days.
**Why:** RestoPros standard for out-of-pocket jobs. Day 3 includes the drying evaluation.

### Emergency Fee — $250 flat
**Decision:** Jobs outside Monday-Friday 8am-5pm automatically add $250 Emergency Fee.
**Why:** Matches Xactimate emergency service charge rate used by RestoPros. Configurable in Admin.

### Supervision fee tiers
**Decision:** Flat fee by job size: Small (1-2 areas) = $150, Medium (3-4 areas) = $250, Large (5+) = $400.
**Why:** Out-of-pocket clients need simple pricing. Flat tiers are easy to explain.

### Material selection — closest match + note
**Decision:** If a material is not in the catalog, tech selects closest match and adds a note.
**Why:** System must always have a priceable item. "Other" with no price breaks the estimate.
**Alternative considered:** "Other" with manual price — rejected because it bypasses the pricing engine.

### Area-type pre-loading
**Decision:** When an area is named (Bathroom, Kitchen, etc.), Demo and Prep pre-suggest relevant items.
**Why:** Validated against 62 real estimates — bathroom jobs always have vanity/sink/faucet, kitchen jobs always have cabinets.

### Prep Work is per-area, General is project-level
**Decision:** Containment, floor protection, appliance detach = Prep (per area). Debris, PPE, supervision = General (whole job).
**Why:** Prep items vary by room. General items apply once to the whole job regardless of room count.

---

## Pricing Decisions

### Xactimate Excel sync (monthly)
**Decision:** Prices update monthly via Excel export from Xactimate.
**Why:** ESX files are encrypted in modern Xactimate versions. Excel export is clean and parseable.
**Code mapping:** Cat+'/'+Sel columns = unique price code (e.g., WTR/DRY for Air Movers).

### IICRC S500 formulas (maximum recommended)
**Decision:** Always use maximum IICRC recommended equipment quantities.
**Why:** Out-of-pocket clients expect thorough work. Under-equipping risks incomplete drying and callbacks.

```
Air Movers:     1 per 50 SF of floor area
Dehumidifiers:  cubic feet of chamber ÷ 100
Air Scrubbers:  1 per 300 SF of total affected area
```

---

## Future Decisions (Planned, Not Yet Built)

### Suggestion Rules Manager (Admin Desktop)
Each tenant will configure which items trigger which suggestions and what formula calculates the suggested quantity. Currently seeded with RestoPros defaults in suggestion_rules table.

### Desktop UI
Configuration screens (Suggestion Rules, Materials catalog, Price Management) will move to /desktop/* routes in a future session.

### Market launch naming
Module names may change for market launch. All names are i18n keys — zero code changes required.

### PWA / installable app
App needs a PWA manifest so techs can install it on their phone home screen. Not yet configured.
