# SiteVerdict — Insight Layer (accurate -> useful)

## P0 — the insight layer (concrete, personalised, plain-English, never over-claiming)
The report now computes meaning from data already in hand, instead of listing raw controls. All lines
are indicative + "verify"; no yield counts, no fabricated min-lot, no approval/value claims.

### BEFORE (Canley Vale, generic)
  • Secondary dwelling / granny flat — may be worth reviewing (early signal only, subject to council...)
  • Dual occupancy — may be worth reviewing with a planner (subject to verification)
  • Subdivision — ... (generic)

### AFTER (148 Canley Vale Rd, R3, FSR 0.45, height 9 m, 650 m2, 16 m frontage, min-lot 400 confirmed)
  • Indicative gross floor area — at the mapped FSR (0.45) a ~650 m² lot allows roughly 290 m² of
    indicative gross floor area (a guide only, before site-specific controls; confirm with council)
  • Indicative storeys — the 9 m height limit typically allows about 2 storeys (indicative; design,
    setbacks and council controls apply)
  • Secondary dwelling (granny flat) — your lot (~650 m²) is above the ~450 m² typically referenced
    under the state Housing SEPP for a secondary dwelling — a common pathway worth reviewing, subject
    to SEPP criteria and council
  • Subdivision — your lot (~650 m²) is below twice the confirmed minimum lot size (400 m²), so a
    standard further subdivision is unlikely to be supported — a planner can confirm
  • Dual occupancy — often considered on larger residential lots with adequate frontage (~16 m
    frontage entered); a planner can assess against council controls
  + footer: "...not approval, not a guarantee, and not confirmation of what can be built or subdivided."

Math: GFA = FSR x land (0.45 x 650 = 292.5 -> ~290, rounded to 10). Storeys = floor(height / 3.1)
(9 / 3.1 -> 2). Granny: lot vs ~450 m2 Housing SEPP guide. Subdivision: lot vs 2x confirmed min-lot
(comparison only; NO lot count). Degrades gracefully: no FSR -> no GFA line; no numbers -> no insight.

## SAFETY (the needle, threaded)
Safety grep CLEAN. FORBIDDEN phrases absent (can build / can subdivide / lots possible / approved /
guaranteed / adds value / value-add / investment). yieldFunctionNeutralised + noFabricatedMinLot kept:
we compare to the mapped/typical minimum and hand judgement to a planner; we never compute a lot count
or invent a min-lot. Unit-tested (test_insight.js 12/12, incl. explicit forbidden-phrase assertions).

## P1 — parcel-polygon frontage/dimensions
buildResolved now derives approximate frontage/depth from the property polygon bounding box (metres),
labelled approximate (not a survey). Canley Vale -> ~19 m frontage / ~35 m depth (19x35~665 ~ the 661
area). The client uses these as fallback when the user enters no size/frontage, so the insight layer
works even with address-only input. User-entered values always win.

## P1 status (carried, not regressed)
- Address coverage (free registered DCS key for fuller G-NAF/suggest): NOT pursued this phase — noted
  as the coverage upgrade path (still free, no Google). The ~36% miss ceiling stands.
- Bushfire: still failing safe ("couldn't be checked") — RFS endpoint not verified; not guessed.
- Nearby: still needs the deploy environment; unchanged.
- Flood: honest state-layer wording + council handoff kept.

## NOT proven (needs T on a preview)
The insight lines rendered on the page (desktop + mobile); that they read well next to the controls;
suggest latency p50/p95; dropdown + pick; nearby. Logic is unit-tested; the screen is T's to eyeball.

## Files
- sv-check.js (insight layer in _pathwaysSection; parcel-derived size/frontage fallback)
- parcel.js (approxDimensions -> frontageApprox/depthApprox on resolved object)
- index.html (cache-bust), version.json. geocode.js, nearby.js, suggest.js unchanged.

## Rollback
Revert sv-check.js + parcel.js + index.html + version.json.
