# Cotizador Design System

> Inspired by Encircle's field-proven UI patterns. Encircle's orange replaced
> with RestoPros blue (#2196F3). All tokens are CSS variables — swap one file
> to rebrand for any SaaS tenant.

---

## Product Context
Mobile-first field tool for restoration technicians. Used on-site, in bad
lighting, with dirty hands. Speed and clarity over visual complexity.
The client-facing output must look like a real company sent it.

## Users
- **Primary:** Restoration techs on phone/tablet in the field
- **Secondary:** Homeowner viewing the estimate on their phone (buying decision)

---

## Design Principles
1. **Field-first:** Min 48px touch targets, high contrast, works in sunlight
2. **One thing at a time:** Each screen has one job
3. **Speed of entry:** Selects, toggles, pre-checked suggestions — minimize typing
4. **Professional trust:** Client output looks like a real company, not a web form
5. **Calm utility:** Dense but readable, minimal chrome, utility language
6. **Flat, no shadows:** Encircle pattern — borders and background color create
   hierarchy, not elevation

---

## Color System (Theme-Ready)

All colors are CSS variables. Never use raw hex values in components.

```css
:root {
  /* Brand */
  --color-primary: #2196F3;          /* RestoPros blue — buttons, links, active states */
  --color-primary-dark: #1976D2;     /* Hover/pressed state */
  --color-primary-light: #BBDEFB;    /* Selected borders, highlights */
  --color-primary-bg: #E3F2FD;       /* Very light blue tint for selected sections */

  /* Headers */
  --color-header-primary: #2196F3;   /* Top navigation bar */
  --color-header-secondary: #2C3E50; /* Secondary header (job detail, sub-screens) */

  /* Surfaces */
  --color-background: #F5F5F5;       /* Page/screen background */
  --color-surface: #FFFFFF;          /* Cards, form areas, list rows */

  /* Text */
  --color-text-primary: #1A1A1A;     /* Primary text — names, titles, values */
  --color-text-secondary: #8E8E93;   /* Metadata, labels, timestamps */
  --color-text-on-primary: #FFFFFF;  /* Text on blue/dark backgrounds */

  /* Borders */
  --color-border: #E0E0E0;           /* Dividers, input borders, card edges */

  /* Status */
  --color-success: #4CAF50;
  --color-warning: #FF9800;
  --color-emergency: #F59E0B;        /* Emergency badge background/accent */
  --color-error: #F44336;
  --color-error-bg: #FFEBEE;
}
```

### Legacy aliases (keep for backward compat while migrating)
```css
:root {
  --color-bg: var(--color-surface);
  --color-bg-secondary: var(--color-background);
  --color-text: var(--color-text-primary);
  --color-primary-hover: var(--color-primary-dark);
}
```

---

## Typography
- **Font:** Inter (variable). Field-proven readability.
- **Scale:** 12 / 14 / 16 / 18 / 20 / 24px
- **Weights:** Regular 400 (data), Medium 500 (labels), Semibold 600 (names/titles), Bold 700 (screen titles)
- **Line height:** 1.5 body, 1.3 headers

### Usage
| Context | Size | Weight | Color |
|---|---|---|---|
| Screen title (header) | 18px | 600 | white |
| Client name / primary label | 16px | 600 | text-primary |
| Section label (above group) | 12px | 500 | text-secondary, uppercase |
| Field label (above input) | 12px | 400 | text-secondary |
| Body / input text | 16px | 400 | text-primary |
| Metadata / timestamps | 13px | 400 | text-secondary |
| Badge / tab label | 12px | 500 | varies |

---

## Spacing
- Base unit: 4px
- Scale: 4, 8, 12, 16, 20, 24, 32px
- Screen horizontal padding: 16px
- Section vertical spacing: 24px between sections, 12px between related fields
- Touch targets: 48px minimum height/width

---

## Component Patterns

### 1. App Header (Top Bar)
```
┌──────────────────────────────────────┐
│ ← [icon]    Screen Title      [icon] │  ← 56px tall, blue #2196F3
└──────────────────────────────────────┘
```
- Background: `--color-header-primary` (#2196F3)
- Text: white, 18px, semibold, centered
- Back button: white ChevronLeft icon, 48×48px tap target, left-aligned
- Action icons: white, 48×48px, right-aligned
- **No shadow** — completely flat

### 2. Secondary Header (Job Context Bar)
```
┌──────────────────────────────────────┐
│ John Smith — 123 Main St      [⋯] [+]│  ← dark #2C3E50
│ Water · Cat 2 · Emergency            │
└──────────────────────────────────────┘
```
- Background: `--color-header-secondary` (#2C3E50)
- Client name: 16px bold white
- Details: 13px white, 70% opacity
- Action icons right-aligned, white

### 3. Bottom Navigation
```
┌────────┬────────┬────────┬────────┐
│ 🏠     │ 📋     │ 🔧     │ 👤     │
│ Home   │ Jobs   │ Items  │ Profile │  ← 56px tall
└────────┴────────┴────────┴────────┘
```
- Background: `--color-surface` (white)
- Top border: 1px `--color-border`
- Active: icon + label in `--color-primary` (#2196F3)
- Inactive: icon + label in `--color-text-secondary` (#8E8E93)
- Outline icons (filled only when active)
- Labels: 11px

### 4. Form Fields
```
  field label                 ← 12px, gray #8E8E93, no bold
  ┌────────────────────────┐
  │ input value            │  ← 48px, border #E0E0E0, radius 4px
  └────────────────────────┘
  ↳ error message (if any)  ← 12px, #F44336
```
- Label: 12px, `--color-text-secondary`, not bold
- Input: 48px height, full-width, border `--color-border`, radius **4px**,
  black text `--color-text-primary`, white background
- Focus: border changes to `--color-primary`, no glow/shadow
- Error: border `--color-error`, red label below
- No rounded-lg — consistent 4px radius (Encircle style)

### 5. Select Button Group (Job Type / Category)
```
  SECTION LABEL               ← 12px gray uppercase
  ┌──────┐ ┌──────┐ ┌──────┐
  │Water │ │ Mold │ │Storm │  ← 56px, border 1.5px
  └──────┘ └──────┘ └──────┘
  Selected: blue fill + white text
  Unselected: white + gray border + dark text
```

### 6. Emergency Badge
```
  ┌──────────────────────────────────┐
  │ ⚠  Emergency Call               │  ← amber #F59E0B border + bg tint
  │    After-hours — $250 fee added  │
  └──────────────────────────────────┘
```

### 7. List Rows
```
  ┌──────────────────────────────────┐
  │ Client Name           Apr 3, '26 │  ← bold black + gray date, right
  │ EST-0042                         │  ← gray ID
  │ 123 Main St, McAllen TX    >     │  ← blue address (link style) + chevron
  ├──────────────────────────────────┤
  │ ...next row                      │
```
- Full-width rows, 64px min height
- Divider lines between rows (`--color-border`), **no shadows**
- **No border-radius** on rows (Encircle pattern)
- White surface background

### 8. Room / Area Grid Cards
```
  ┌──────────────┐ ┌──────────────┐
  │  [photo bg]  │ │  [photo bg]  │  ← 2-column grid
  │ Kitchen      │ │ Master Bath  │  ← white label, bottom overlay
  └──────────────┘ └──────────────┘
  ┌──────────────┐
  │   +          │  ← "Add Area": white bg, blue + icon + blue text
  │  Add Area    │
  └──────────────┘
```
- Grid: 2 columns, 8px gap
- Photo cards: 120px tall, `border-radius: 8px`, photo background
- Label: white text, bottom-left, 14px semibold, gradient overlay
- Add card: white bg, `--color-border` border, `border-radius: 8px`, centered

### 9. FAB (Floating Action Button)
```
                          ┌───┐
                          │ + │  ← 56px circle, blue #2196F3, white icon
                          └───┘
  Bottom nav ─────────────────
```
- Size: 56px × 56px
- Background: `--color-primary`
- Icon: white Plus (24px)
- Position: fixed, bottom 72px (above bottom nav), right 16px
- Shadow: `0 2px 8px rgba(0,0,0,0.20)` — exception to no-shadow rule

### 10. Tabs (Internal Navigation)
```
  ┌──────────┬──────────┬──────────┐
  │ 📷 Photos│ 📋 Items │ 📝 Notes │  ← white bg, border-bottom
  │   [3]    │   [12]   │          │
  └──────────┴──────────┴──────────┘
```
- Active: `--color-primary` text + 2px bottom border line
- Inactive: `--color-text-secondary` text
- Badge: small blue pill with count
- Background: white, bottom border `--color-border`

### 11. Bottom Primary Button (Fixed CTA)
```
  ┌──────────────────────────────────┐
  │        Start Estimate            │  ← 52px, full-width, blue, fixed bottom
  └──────────────────────────────────┘
```
- Fixed to bottom of screen (above any bottom nav)
- Background: `--color-primary`, white text, 16px semibold
- Height: 52px
- No border-radius variation — consistent 0px (full-bleed) OR 8px with 16px margin

---

## Responsive
- **Mobile (375px):** Single column. Primary design target.
- **Tablet (768px):** Two-column where useful (room grid → 3 cols, photos side-by-side)
- **Desktop (1024px+):** Sidebar nav + main content. Admin/analytics.

Mobile is the primary target. Desktop is a bonus.

---

## Accessibility
- All interactive elements: min 48px touch target
- Focus indicators: 2px `--color-primary` border (no glow on mobile)
- ARIA labels on all icon-only buttons
- Color is never the only state indicator
- Form errors announced to screen readers (`role="alert"`)
- Tab order follows visual reading order

---

## Animation
- **Transitions:** 150ms ease for color changes (buttons, borders)
- **Page transitions:** None (instant SPA — Encircle pattern)
- **Loading:** Spinner inline in button, not full-page
- **Skeleton screens:** For list content, not spinners

---

## Empty States
Every empty state:
1. Clear message (what belongs here)
2. Primary action (how to add the first item)
3. No apologetic tone

Example: *"No areas yet. Tap + to add the first room."*
