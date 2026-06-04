# v4a — Test Report

## DONE TEST
- Unconfirmed parcel shows "Parcel signal needs review — confirm by title plan or survey": PASS
- Canley Vale-style case (Needs review) does NOT look parcel-verified: PASS
- User-entered land size/frontage remain labelled user-entered: PASS (stated in the line + existing strip)
- Map still says approximate / not a survey: PASS (existing label retained; new line reinforces)
- No buildability/lot-count/value/approval promises: PASS (safety grep clean)

## Commands
- node --check public/assets/sv-check.js -> OK
- node --check public/netlify/functions/geocode.js -> OK (unchanged from v3)
- node scripts/predeploy.js (release-check) -> PASSED 106 / FAILED 0
- parcel-line unit tests -> 13/0
- regression: render 25/0, banner 12/0, constraints 17/0, address 12/0
- integration render (Canley Vale): parcel line + all 8 sections present & in order, CTA intact, no unsafe wording

## Parcel confidence states tested
null/unknown -> needs review · Needs review -> needs review · Estimated -> needs review ·
Verified -> "detected" but still "not a boundary or survey, confirm by title". No "parcel confirmed".

## Safety grep (CLEAN, 0 unguarded)
can build · can subdivide · 3/4 lots possible · guaranteed approval · approved potential ·
guaranteed value · adds value · value-add · investment opportunity · exact boundary ·
survey confirmed · parcel confirmed · school catchment confirmed · no risk.

## Scope
sv-check.js: +1 helper, +1 call site, +1 chip qualifier (26 lines added, 1 replaced). geocode.js: unchanged.

## Status
OFFLINE-PROVEN, render-only. Recommend a quick visual check on a Netlify preview before production.
