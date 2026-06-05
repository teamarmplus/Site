# SiteVerdict — Planning Feeds P0 Fix

## What was broken (verified live) and is now fixed
1. HEIGHT: engine queried Principal_Planning_Layers/7 field HEIGHT_MAX -> 400 error -> "Not confirmed".
   FIXED: field -> MAX_B_H. Live at 148 Canley Vale: **9 m**. (Also dropped LAY_CLASS from the /7
   query — that field doesn't exist on layer 7 and was nulling the whole result.)
2. FSR: queried /4 field FSR_MAX -> 400 -> "Not confirmed".
   FIXED: field -> FSR. Live: **0.45**.
3. FLOOD (most serious): queried retired Planning/EPI_Flood_Planning_Area/0 -> 404 -> always read as
   "none detected" (a dead hazard check looking reassuring).
   FIXED: wired to Planning/Hazard/MapServer/1 (Flood Planning).

## The core safety fix: "couldn't check" is never "none" (3-state)
Every hazard (flood, bushfire, heritage) is now THREE states, not a boolean:
  - present -> show it ("mapped flood planning area — verify scope" / heritage "listed — <name>")
  - none    -> "none mapped in the NSW state layer — still verify" (NOT "none detected")
  - error   -> "couldn't be checked here — verify; do not rely"
Critically, "error" now covers BOTH network timeouts AND ArcGIS error bodies (404/400) — the first
version only caught timeouts, so a 404 still fell through to "none". Fixed: result.error => error state.
This 3-state is applied consistently in: the "what we found" lines, the constraints section, the
overlay summary, the overlay RISK SCORE, the parcel-confidence (hasOverlay) logic, and the JSON export.
A forced failure now renders "couldn't be checked", proven by unit test.

## Service-health self-test (Systemic Fix C)  — scripts/service-health.js
Pings every NSW layer/field dependency (zone, min-lot, heritage, FSR, height, flood, bushfire,
property, cadastre) against the Canley Vale known-good point and flags any 400/404/missing-field/
wrong-value. Run: `node scripts/service-health.js`.
IT IMMEDIATELY CAUGHT A SECOND DEAD SERVICE: bushfire (Bush_Fire_Prone_Land/MapServer -> 404). Because
of the 3-state fix, bushfire now FAILS SAFE ("couldn't be checked"), but the URL still needs the
correct current endpoint wired (see "not done").

## Honest caveat — the state flood layer is sparsely populated
Planning/Hazard/1 returned 0 flood features not only at Canley Vale but at Windsor and Lismore
(textbook floodplains). Many councils (e.g. Fairfield) map flood LOCALLY, not into the state EPI.
So the wiring is correct and the false "none detected" is gone, but for many genuinely flood-affected
properties this free state layer will honestly say "none mapped in state layer — still verify".
Landchecker's "Affected" for Canley Vale almost certainly comes from council data we don't have free.
This is truthful (never falsely reassuring) but it is NOT the same as knowing the flood status.

## NOT done (flagged, not silently skipped)
- Systemic Fix A (query the resolved PARCEL POLYGON, not the geocoded point): NOT done. It's a
  structural reorder — planning queries currently run before the parcel resolves. The dangerous part
  (a hazard falsely reading "none" from point drift) is already neutralised by the 3-state fix; the
  polygon query is a completeness improvement (controls on large/irregular lots) best done as its own
  tested change, not rushed into a P0 ship.
- Correct bushfire endpoint: the dead URL now fails safe ("couldn't be checked"); wiring the right
  current RFS/DCS bushfire-prone-land service is a follow-up (guessing a URL would be worse than the
  honest "couldn't be checked").
- ≥20-address external-truth validation table: NOT done (sandbox DCS latency; subject-site fields
  verified individually: R3 / 9 m / 0.45 / flood none-mapped-still-verify).
- DisplayAndNearby prompt (parcel single-sourcing, nearby, tile honesty): separate prompt, not started.

## Files changed
- public/assets/sv-check.js (field names, flood URL, 3-state hazards everywhere)
- public/index.html (cache-bust), public/version.json
- scripts/service-health.js (NEW)
- geocode.js, nearby.js, parcel.js UNCHANGED.

## Rollback
Revert sv-check.js + index.html + version.json; remove scripts/service-health.js.
