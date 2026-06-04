# Parcel Precision Phase 2 — Test Report

## Ground-truth accuracy (320 stratified NSW addresses, 20 LGAs, measured in sandbox vs DCS)
verified=204 (64.8% of 315 resolved) · exact-on-verified=204/204=100% · needs_review=111 (35.2%) ·
geocode-fail=5 · CONFIDENT-WRONG=0. Phase 1 verified-rate was ~37%.

## Offline tests (all pass)
- node --check parcel.js, sv-check.js, nearby.js, geocode.js(unchanged) — OK
- release-check 106/0 · version.json valid · cache-bust 9 · geocode byte-identical · daleads intact
- safety grep CLEAN; "not a survey" x7, "needs review" x9
- unit: parcel logic 22/0, enriched line 14/0, phase2 helpers 16/0
- regression: render 25/0, banner 12/0, constraints 17/0, nearby 16/0, handler 8/0, nearby-render 14/0
TOTAL: 144 assertions, 0 failures.

## Confident-wrong found & fixed during development (then re-measured to 0)
1. "45 Beecroft Rd" geocode drifted onto "46 Beecroft Rd" (same street, diff number) -> added
   street+NUMBER gate (addressMatches). 2. Tried hasstratum flag -> it's 1 on normal lots too ->
   BACKED OUT, replaced with SP-planlabel strata detection. 3. Dubbo 6-lot block -> >4-lot cap.

## NOT proven
- Rendered desktop/mobile parcel line (no browser). 64.8% is this-sample-specific; confident-wrong=0
  is the held invariant.

## Verdict
PRECISION TARGET MET (measured): verified-rate 37%->64.8%, exact-on-verified 100%, confident-wrong 0.
