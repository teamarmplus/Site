# Parcel Precision Phase 4 — Test Report

## Task 2 ground-truth (320 stratified, near+suburb-guard, address->propid truth)
verified 215/316 = 68.0% (Phase 3: 64.0%); exact-on-verified 215/215 = 100%; CONFIDENT-WRONG 0.

## Task 1 per-class (sub-sample n=141)
single-lot 96/97=99% · strata 0/27=0%(correct) · unresolved 0/6 · geocode-failed 0/11.
=> 68% headline is a test-mix artifact; normal residential ~99%.

## Offline gate (all pass)
node --check parcel/sv-check/nearby/geocode OK; geocode & nearby byte-identical; release-check 106/0;
version.json valid; cache-bust 9; safety grep CLEAN; "not a survey" x7, "needs review" x10.
unit: parcel logic 22/0, enriched line 14/0, phase2 16/0, phase4 suburb-guard 7/0,
regression render 25/0 banner 12/0 constraints 17/0 nearby 16/0 handler 8/0 nearby-render 14/0.
TOTAL: 151 assertions, 0 failures.

## Safety behaviour proven
suburb guard rejects Newcastle->Stockton relocation; strata->needs_review; wrong-street->no match.

## Verdict
SAFE GAIN — KEPT (verified 64->68%, exact 100%, confident-wrong 0). Task 1: 64-68% is test-mix, not
a real user problem (single-lot ~99%). Task 3: free DCS autocomplete feasible-but-brittle; don't fund
paid Google.
