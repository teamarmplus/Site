# Map Confirmation Banner V1 — Test Report

## Commands
- node --check public/assets/sv-check.js -> OK
- node scripts/predeploy.js (release-check) -> PASSED 106 / FAILED 0
- banner unit tests (confidence variants + safety + escaping) -> 12 / 0

## Required address cases (mapped via real LIVE geocode confidence)
1. 148 Canley Road Canley Heights NSW 2166 -> REJECTED upstream (street_mismatch) -> "Address not
   matched", banner not reached, no wrong-parcel confidence. PASS
2. 148 Canley Vale Road Canley Heights NSW 2166 -> ACCEPTED (Verified) -> banner "Confirm the location"
   with matched address shown. PASS
3. 45 Oxford Street Epping NSW 2121 -> ACCEPTED (Verified) -> banner "Confirm the location". PASS
4. George Street Sydney NSW 2000 -> REJECTED upstream (route_only) -> safe "needs full address" message. PASS
5. invalid fake address -> REJECTED upstream (suburb_only) -> safe not-matched message. PASS

## Confidence-wording unit tests
- Verified/exact -> "Confirm the location" + matched address + "not a survey". PASS
- interpolated -> "Location needs review". PASS
- empty/unknown confidence -> "Location needs review". PASS
- Needs review (number mismatch) -> "Location needs review". PASS

## Safety grep (0 unsafe)
exact boundary / survey confirmed / parcel confirmed / guaranteed approval / can build / can subdivide /
add value / investment opportunity -> ALL CLEAN. Banner says "not a survey"; matched address escaped.

## Live/browser proof
Render logic is fully unit-tested; address->banner mapping uses real live geocode confidences.
The banner is render-only (no interaction), so behaviour is deterministic from the data. A quick
visual check on a Netlify preview is the recommended final confirmation.

## Verdict
MAP CONFIRMATION BANNER V1 READY. Render-only, tested, no flow change. Deploy is T's decision.
