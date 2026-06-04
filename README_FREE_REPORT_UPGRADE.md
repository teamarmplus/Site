# Free Site Check Report Upgrade V1

Adds two sections to the free NSW Site Check report, using data already fetched by the engine.
Safe, fast, confidence-labelled, preliminary. No new APIs. No deploy. NSW-focused.

## What changed
File: `public/assets/sv-check.js` (only this file).

Two new sections inside `buildVerdictSection`, placed between "What this means" and
"What still needs checking":

1. **Possible pathways to review** — signal-based, never a promise.
   - Residential + land size/frontage → "Secondary dwelling / granny flat — may be worth reviewing",
     "Dual occupancy — may be worth reviewing".
   - Subdivision feasibility shown ONLY when user land size ≥ 2× a *confirmed* minimum lot size,
     and never implies a lot count ("possible lot count depends on verified survey, frontage, access,
     services, easements, overlays and council controls").
   - Min-lot not confirmed → "subdivision cannot be assessed from this basic check".
   - E / MU / SP / RE / non-residential → "Professional planning review recommended"; no residential
     development assumptions.
   - OC / external works purpose → external works / drainage / driveway / compliance pathway.
   - Overlay present → adds an extra-assessment caution line.
   - Closes with: "not approval, not a guarantee, and not confirmation of what can be built or subdivided".

2. **Nearby context** — visible open-map signals (transport / health / retail), max 5 items,
   approximate distances. Uses the Overpass data the engine ALREADY fetches (previously built into
   `infraHtml` but never rendered). If no data → "Nearby context was not confirmed from available
   open-map data." If `infra` is null → section hidden. © OpenStreetMap contributors. "Verify before
   relying." Explicitly "not a valuation, school-catchment check, transport assessment, or professional advice."

## How it's wired
`buildVerdictSection` gained two trailing params `(infra, purpose)`. The single call site passes the
existing `infra` object and `window._svPurpose` if present (else undefined). No other code touched.
No change to geocoding, min-lot sanity logic, planning layers, or the Professional Review CTA.

## Safety
No new API. No fake data (sections hide or say "not confirmed" when data is absent). No school-catchment,
value, investment, approval, or lot-count claims. Release-check passes. © OpenStreetMap attribution included.

## Apply
Replace `public/assets/sv-check.js` with the file in this package. Commit. (No deploy performed here.)

## V1-clean wording fixes
- Softened a pre-existing "Why this matters" line: subdivision wording is now "may be worth reviewing,
  subject to survey, access, services, overlays and council controls" (no "is possible / how many lots").
- Softened the Next-useful-step line: "what may be worth reviewing or help reduce risk" (no "add value").
