# UX v5 — Test Report

## Proven (offline)
- node --check sv-check.js OK (identical to live address-first build) · geocode.js OK (identical, r3)
- version.json valid · CSS brace-balanced (sv-components 223/223, sv-layout 61/61)
- release-check -> PASSED 106 / FAILED 0
- safety grep CLEAN (exact boundary, parcel confirmed, can build/subdivide, guaranteed approval,
  value-add, adds value, investment opportunity, survey confirmed, no risk)
- safety elements intact: parcel-confidence line (2), "not a survey" (7), Pro Review CTA (3),
  "needs review" (7)
- section order verified: 1.Confirm location 2.Parcel needs review (both full-width top) ->
  report sections in 2 columns -> CTA full-width bottom

## Address/location cases (live geocode == this build's r3 geocode)
- 148 canley vale road, canley heights, 2166 -> RESOLVES exact (comma/lowercase safe)
- 148 Canley Road -> REJECTED street_mismatch (no parcel)
- 45 Oxford Street Epping -> RESOLVES exact
- 2 Honeysuckle Dr, Newcastle, 2300 -> RESOLVES exact
- George Street Sydney (no number) -> REJECTED route_only (fails safe)
- fake invalid -> REJECTED (fails safe)

## NOT proven (needs preview, no browser here)
- Rendered desktop two-column layout, larger text, bigger map, mobile single-column reflow.
- Autocomplete + pin: deferred, not built.

## Decision
DEFER AUTOCOMPLETE/PIN — CSS READY. Layout/readability improved CSS-only; safety intact.
