# Parcel Safety Fix — Test Report

## Commands
- node --check public/netlify/functions/geocode.js -> OK
- node --check public/assets/sv-check.js -> OK
- node scripts/predeploy.js (release-check) -> PASSED 106 / FAILED 0
- streetMatch unit tests -> 5 / 0
- full guard decision tests (the bug + variants) -> 4 / 0
- false-positive check on 6 real valid addresses -> 0 false positives

## 148 Canley Road result
BEFORE: matched "337 Canley Vale Rd", confidence Verified, quality exact -> wrong parcel shown confidently.
AFTER:  REJECT (found:false, addressQuality:street_mismatch) -> "Address not matched", no parcel, with a
        reason naming the closest match and a prompt to check the street name/number or request a Review.

## High-risk behaviour verified
- Different-street substitution -> REJECT (no parcel).
- Same street, different number -> ACCEPT downgraded to Needs review + numberWarning (never Verified).
- Correct address -> ACCEPT Verified/exact (unchanged).
- Abbreviations (Rd/Road, Dr/Drive, St/Street) -> NOT flagged (no false positives).
- Multi-word streets (Canley Vale Road) -> matched correctly when typed correctly.

## Validation note (honest)
The patched geocode function cannot be exercised live here (it is not deployed). Proof is via:
(a) reproducing the bug against the LIVE current function, and
(b) running the exact patched guard logic against the real Google response shapes captured live,
plus a false-positive sweep on 6 real valid addresses. A full live 1000/5000 re-run requires deploying
the patched function to a preview and is the recommended post-apply verification step.

## Safety grep
No unsafe wording added. No "parcel confirmed"/"Lot/Plan confirmed" on weak confidence. No secrets.

## Verdict
NEEDS PATCH BEFORE LAUNCH — fix built and tested. After applying, verify on a Netlify preview with
148 Canley Road + a batch of real addresses before going live.
