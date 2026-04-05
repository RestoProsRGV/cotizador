# Spec: Customer Signature

## Problem
The "Approve Estimate" button in the Present to Client view does nothing.
Field techs hand the phone to the client, who should be able to sign
directly on the screen. The signature should be saved and included in PDFs.

## Options considered
1. Typed name confirmation — rejected: not legally binding enough for
   out-of-pocket jobs.
2. Finger-draw canvas (react-signature-canvas) — chosen: industry standard
   for field signatures, works on phone screens.
3. DocuSign / external signing — rejected: requires email/app install,
   not practical on-site.

## Decision
- Signature pad at bottom of Present to Client view (`/estimates/:id/present`)
- Signature saved as base64 data URL to `customer_signature_url` column
- Also updates `status → approved` and sets `approved_at`
- If already signed: show read-only signature image, "Approved on [date]"
- PDF includes signature section when `customer_signature_url` is set

## Implementation plan
1. Migration: add `customer_signature_url text` + `approved_at timestamptz`
   to `estimates` table (manual execution in Supabase SQL Editor)
2. Install `react-signature-canvas` + `@types/react-signature-canvas`
3. `Present.tsx` — signature pad section at bottom
4. `EstimatePDF.tsx` — signature section when URL exists

## Migration SQL (run manually in Supabase SQL Editor)
```sql
alter table estimates
  add column if not exists customer_signature_url text,
  add column if not exists approved_at timestamptz;
```

## Edge cases
- Canvas too small for signature: full-width, 200px tall on mobile
- User clears and re-signs before accepting: clear resets canvas
- Already approved with no signature (via Total screen): show "Approved"
  status but no signature image (graceful fallback)
- base64 storage: adequate for signatures (~5-20KB), no file storage needed

## Library
`react-signature-canvas` — finger-drawable canvas, ref-based API:
- `sigPad.isEmpty()` — check if blank
- `sigPad.clear()` — reset
- `sigPad.toDataURL("image/png")` — export base64
