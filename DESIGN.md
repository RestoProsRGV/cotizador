# Cotizador Design System

## Product Context
Mobile-first field tool for restoration technicians. Used during on-site inspections, in bad lighting, with dirty hands, possibly outdoors. Speed and clarity over visual complexity.

## Users
- **Primary:** Restoration techs on phone/tablet in the field (4 users at RestoPros)
- **Secondary:** Homeowner viewing the estimate (makes a buying decision from this screen)

## Design Principles
1. **Field-first:** Large tap targets (min 48px), high contrast, works in sunlight
2. **One thing at a time:** Each screen has one job. Don't split attention.
3. **Speed of entry:** Minimize typing. Use selects, toggles, pre-checked suggestions, room presets.
4. **Professional trust:** Client-facing output must look like a real company sent it, not a web form.
5. **Calm utility:** App UI rules. Dense but readable, minimal chrome, utility language.

## Typography
- **Font:** Inter (variable). Field-proven readability on all screen sizes.
- **Scale:** 14/16/20/28px. Body 16px, labels 14px, section headers 20px, page titles 28px.
- **Weight:** Regular 400 for body, Medium 500 for labels, Semibold 600 for headers.
- **Line height:** 1.5 for body, 1.3 for headers.

## Color System (Theme-Ready)

All colors are CSS variables. The RestoPros theme is the default. To rebrand for SaaS,
swap the theme file. Components never use hardcoded colors.

### RestoPros Theme (default)
```css
:root {
  --color-primary: #0f3167;       /* RestoPros navy, buttons, links, active states */
  --color-primary-hover: #0a2450;
  --color-primary-light: #83bde8; /* Light blue accent, selected states, badges */
  --color-primary-bg: #e8f0fa;    /* Very light blue for highlighted sections */
  --color-bg: #ffffff;
  --color-bg-secondary: #f0f0f0;  /* Section backgrounds, cards */
  --color-border: #d1d5db;
  --color-text: #111827;
  --color-text-secondary: #6b7280;
  --color-success: #059669;
  --color-warning: #d97706;
  --color-error: #dc2626;
  --color-error-bg: #fef2f2;
  --color-logo-bg: #0f3167;       /* Logo container background */
  --color-logo-text: #ffffff;     /* Logo text color */
  --font-family: 'Inter', system-ui, sans-serif;
}
```

### Theme Architecture
- All design tokens in a single theme file (e.g., `src/styles/theme-restopros.css`)
- Components reference only CSS variables, never raw hex values
- Company logo stored in Supabase Storage per tenant
- To rebrand for SaaS: create `theme-cotizador.css` with neutral palette, swap import
- Font family is also a theme token (some companies may want different fonts)

### Color Rules
- No dark mode for v1 (field use in daylight is the primary context)
- High contrast ratios. All text/bg combinations must pass WCAG AA (4.5:1 for body, 3:1 for large text)
- The navy primary (#0f3167) provides excellent contrast on white
- Light blue accent (#83bde8) used only for non-text elements (badges, selected borders)

## Spacing
- Base unit: 4px
- Scale: 4, 8, 12, 16, 24, 32, 48px
- Form fields: 48px height minimum (tap target)
- Buttons: 48px height, 16px horizontal padding
- Section spacing: 24px between sections, 12px between related elements

## Components

### Buttons
- Primary: filled `--color-primary`, white text, 48px height, 8px radius
- Secondary: bordered, `--color-primary` text, 48px height
- Destructive: filled `--color-error`, white text

### Form Inputs
- 48px height (field-friendly tap targets)
- 12px padding
- `--color-border` border, 8px radius
- Focus: 2px `--color-primary` ring
- Error: `--color-error` border, error message below in `--color-error`

### Cards
- `--color-bg` background, `--color-border` border, 8px radius
- 16px padding
- No shadows. Clean borders only. (App UI rule: minimal chrome)

### Line Item Row (estimate builder)
- Full-width, 56px minimum height
- Checkbox left, item name center, quantity + price right
- Pre-checked suggestions styled differently (lighter bg, dashed border)
- Swipe to remove (mobile)

### Client Estimate View (present-to-client)
- Full screen, no navigation chrome
- Company logo top center
- Date and tech name below logo
- "Scope of Work" header, plain English summary
- Itemized lines: description, quantity, unit, price
- Photos between scope summary and line items (if attached)
- Total in large type at bottom
- "This estimate is valid for 14 days" footer
- Approve button (or "tap to discuss")

## Responsive
- **Mobile (375px):** Single column. Full-width inputs. Stacked layout.
- **Tablet (768px):** Two-column where useful (e.g., photos left, items right in client view).
- **Desktop (1024px+):** Sidebar nav, main content area. Admin/analytics screens benefit from wider layout.

Mobile is the primary design target. Desktop is a bonus.

## Accessibility
- All interactive elements: min 48px tap target
- Keyboard navigable: tab order follows visual order
- ARIA labels on icon-only buttons
- Focus indicators visible (2px primary ring)
- Color is not the only indicator of state (use icons + text)
- Form errors announced to screen readers

## Empty States
Every empty state has:
1. A clear message (what this area is for)
2. A primary action (how to add the first item)
3. No sadness/apologetic tone. Just helpful.

Example: "No estimates yet. Tap + to create your first one."

## Error States
- Inline validation: show error below the field, not in a modal
- Network errors: banner at top, "No connection. Draft saved locally."
- API errors: specific message, not "Something went wrong"

## Loading States
- Skeleton screens for lists (not spinners)
- Button loading: disabled + spinner icon inline
- Page transitions: instant (SPA), no full-page loaders
