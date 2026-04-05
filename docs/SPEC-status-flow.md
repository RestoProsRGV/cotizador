# Spec: Estimate Status Flow

## Problem
The `status` column exists on the `estimates` table but there is no UI to
change it. Field techs need to mark estimates approved after a client signs
off. The current "Approve Estimate" button in the Present view does nothing.

## Options considered
1. Status change only from Present to Client view — rejected because tech
   may want to mark approved without going through the full presentation.
2. Status change from Total screen (mobile) + Desktop overflow menu — chosen.
3. Dedicated status management screen — overkill for 3 states.

## Decision
- **Mobile Total screen**: status action row below "Present to Client"
- **Desktop DesktopEstimateDetail**: [···] overflow menu in header
- **Estimates list**: colored badge chip (gray/green/blue)
- **Total screen AppHeader**: small status dot badge

## Implementation plan
1. `AppHeader.tsx` — add optional `badge` prop (dot color + label text)
2. `Total.tsx` — fetch estimate status, action buttons, confirmation BottomSheet, toast
3. `EstimatesList.tsx` — update status badge from text-color to bg-chip
4. `DesktopEstimateDetail.tsx` — overflow menu, confirmation modal, delete

## Business rules
- Draft → Approved: any authenticated user (field techs)
- Approved → Invoiced: any authenticated user (owner-only restriction deferred)
- No backwards transitions allowed
- Cannot delete Approved or Invoiced estimates
- Invoiced is final — no further actions

## Edge cases
- Network failure: show error, revert optimistic UI
- Double-tap: disable button during mutation
- Status badge on all estimate tabs (Setup, Areas, General): deferred —
  only shown on Total screen header for now (that's where the action lives)
