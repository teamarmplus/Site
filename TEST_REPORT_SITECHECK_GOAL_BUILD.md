# Site Check Launch Build v3 — Test Report

## v3 cleanup (this turn)
Neutralised the unused calcYieldPotential function. It previously computed:
  var lots = Math.floor(block/(mls||450));  + a 1-10 yield score.
This violated no-fake-min-lot / no-lot-count / no-hidden-yield rules. It was DEAD CODE (defined,
never called). Replaced with a harmless stub that does no calculation, no lot math, no 450 fallback,
returns null. Confirmed still unused.

## Carried from v2
- DA wording: "positive early planning signal... does not rule out other DA-stage reports..." (no
  "best possible planning outcome" / "no additional reports required").
- AI packet min-lot: { value: mlsReal ? mls : null, verified: !!mlsReal } (null when unverified).

## Commands
- node --check public/assets/sv-check.js -> OK
- node --check public/netlify/functions/geocode.js -> OK
- node scripts/predeploy.js (release-check) -> PASSED 106 / FAILED 0
- render 25/0 · banner 12/0 · constraints 17/0 · address 12/0

## Safety grep (exact list)
yield potential -> CLEAN · mls||450 -> CLEAN · lots -> see note · can build · can subdivide ·
3 lots possible · 4 lots possible · adds value · value-add · guaranteed approval ·
investment opportunity · strong buy · exact boundary · survey confirmed -> ALL CLEAN (0 unguarded).
Note on "lots": the only remaining occurrences are the existing DA-comparables feature (displays lot
counts of PAST nearby DA projects from the daleads feed) and the main-flow calcLots — neither is the
property's own yield scoring, and they were out of scope for this cleanup (no feature changes requested).

## Report structure — all 8 sections, in order (unchanged from v2)
Confirm location -> What we found -> What this means -> Possible pathways -> Development constraints
-> Nearby context -> What still needs checking -> Professional Review.

## Address guard (12/12) + wider sample (50 live: 45 ACCEPT / 4 REVIEW / 1 timeout) — unchanged from v2.

## Status
OFFLINE-PROVEN, NOT LIVE-PROVEN. r3 geocode fix not yet live. Deploy to a Netlify PREVIEW and
re-test (comma case + bug pair + controls) before production.
