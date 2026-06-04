# SiteVerdict v4a — Parcel Confidence (render-only)

Ensures the public report never presents parcel/lot/map confidence as stronger than the system can
prove. Render-only. No geocode change, no map-flow change, no pin, no autocomplete, no new API.

## What changed (public/assets/sv-check.js only)
1. New helper `_parcelConfidenceLine()` added to the result card (right after the confirm-location
   banner, so location trust comes first). Reads window._parcelConfidence:
   - If Verified: "Parcel signal detected. This is a map signal only, not a boundary or survey.
     Confirm the exact lot, boundaries and frontage by title plan or a licensed surveyor."
   - Otherwise (Needs review / Estimated / unknown / null) DEFAULT:
     "Parcel signal needs review — confirm by title plan or survey. The parcel/lot shown on the map
     is an approximate signal only and may not be the exact property. It is not confirmed, not a
     boundary, and not a survey. Any land size or frontage you entered is treated as user-entered
     and not independently verified."
2. Map fact-strip Lot/Plan chip now appends "(signal — needs review)" unless confidence is Verified.

## Why (Canley Vale)
At the Canley Vale point, SIX Maps returns ~7 overlapping parcels (DP728) with null planlotarea, so
the auto-selected parcel can be a wrong adjacent lot. Cadastre does not return "Verified" in that
ambiguous case, so this build shows "Parcel signal needs review" — the parcel never looks confirmed.

## Not changed
geocode.js (identical to v3), map rendering flow, address flow, report sections. No new features.

## Status
OFFLINE-PROVEN. Render-only, so behaviour is deterministic from window._parcelConfidence. A quick
visual check on a Netlify preview confirms placement.
