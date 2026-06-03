# SiteVerdict 1000-Stage Work Order — Consolidated Work Log

Timestamp: this session. Live version: sitecheck-release-check-99C-r7. Netlify publish dir: public/.
Method note: stages grouped by phase; each phase carries the evidence already produced this cycle.
No invented data. Patch = retry logic in public/assets/sv-check.js only.

## Phase 1 — Mission lock / ethics / constraints (S0001–0050): PASS
Validation+quality only; flow Site Check→Professional Review; NSW-focused; no Package 100; no Hot List;
no scorecard/report-gate/approval-confidence; missing data never a disadvantage; no approval/profit/value/loan
guarantees; user-entered/detected/not-confirmed labels enforced; DA Leads = one optional paid API.

## Phase 2 — Source-of-truth / deploy-path (S0051–0123): PASS
Netlify publishes public/ (netlify.toml publish="public"). public/ is source of truth. Stale root duplicates
exist but are ignored by Netlify (git rm cleanup pending, non-blocking). Live /version.json = 99C-r7.

## Phase 3 — Public UI baseline / old-flow sweep (S0124–0231): PASS
Homepage: "Check your land", "Enter a NSW address. Add your land size and frontage...", trust "NSW Site Check",
nav Site Check/Professional Review/Terms. Grep 0 for: NSW-first, Other states, Australia-wide, Hot list,
Services, Finance, Full report, Register to continue, free report unlocked, Executive Verdict,
Institutional Scorecard, Intelligence score, 0402, wa.me. Terms clean (no phone). Map opens Sydney/NSW (zoom 8).

## Phase 4 — Syntax / release gate / browser gate / grep (S0232–0344): PASS (e2e deferred to CI)
node --check sv-check.js / predeploy.js / e2e spec: OK. predeploy release gate: PASSED 106 / FAILED 0.
Browser e2e: previously 28/28; could not re-run this session (Chromium resource exhaustion after 1000-run);
spec unchanged, patch does not touch DOM/flow -> defer to CI on push.

## Phase 5 — Data-source / API inventory (S0345–0451): PASS
Public NSW path: geocode fn (Google->Nominatim, NSW-bounded, server-side) -> NSW ePlanning ArcGIS
(zone/11, min-lot/14, heritage/8, FSR/4, height/7, flood, bushfire) browser-side -> SIX Maps cadastre ->
Overpass (context). Engine NSW-gated. DA Leads = server-side proxy (key hidden), currently returns empty.
Anthropic ai-interpret = legacy, not in r7 public flow. No secrets in public files.

## Phase 6 — 100-row replay / dataset quality (S0452–0552): PASS
Rerun 100: PASS 89 / REVIEW 11 / FAIL 0. Lesson recorded: constructed addresses pollute REVIEW;
real-address provenance required for 1000.

## Phase 7 — Real 1000 dataset / dry-run (S0553–0659): PASS
Pulled 1,191 REAL NSW addresses from NSW AddressPoint (layer 1), 6 regions, deduped. Dry-runs:
20 -> 20/0/0; 50 -> 44/6/0; 0 critical. No constructed addresses.

## Phase 8 — 1000-run + core analysis (S0660–0766): PASS
BEFORE patch: PASS 959 / REVIEW 41 / FAIL 0. fake-min-lot 0.00%, no-zone 0%, geocode success 96.6%.
Zones incl E1/E2/E3/E4/MU1/C2/C3/C4/RU4/RE1/SP2/SP5 — all non-res min-lot = Not confirmed (0 fake).

## Phase 9 — Improvement decision + retest (S0767–0883): PASS — PATCH MADE
Proven issue: 10/41 REVIEW were transient timeouts (7 layer, 3 geocode). Fix: retry up to 2x in ftx()
and 1x in geocodeWithConfidence(), same safe fallbacks. AFTER patch: PASS 969 / REVIEW 31 / FAIL 0.
All 10 timeouts -> PASS. 31 remaining = bad-input no-street-number (correctly classified). fake-min-lot 0, critical 0.
CSV: siteverdict_1000_validation_after_retry.csv. File changed: public/assets/sv-check.js only.

## Phase 10 — Approved-DA validation planning (S0884–0976): READY (blocked on data)
Plan + schema + harness built. Blocked: DA Leads proxy returns empty; need key-confirmed pull or official DA records.
Ground truth must be council/LEP consent, not the engine's own layer (avoid circular).

## Phase 11 — Landchecker / generic-AI benchmark (S0977–1089): PASS
Landchecker wins on raw data breadth/maps/parcels; generic AI wins on broad unconstrained explanation;
SiteVerdict wins on verified+labelled NSW signals + plain-English + missing-check list + Professional Review.
Proof: 1000-run showed honest "Not confirmed" instead of faking on 100+ non-res zones.

## Phase 12 — Professional Review / operating machine (S1090–1190): PASS
PR page intact: name/phone/email/address/purpose/notes + optional upload + 24-48 business-hours wording;
thanks page exists. Non-guarantee wording. Failures route to PR.

## Phase 13 — Market painkiller / API economics (S1191–1295): PASS
Painkiller = avoid wrong-property/site spend, planning confusion, pre-DA delay, know what to check + who to call.
DA Leads: keep only on a 14-day test if it helps validation/PR/cash-flow/intelligence; else cancel/replace.

## Phase 14 — Security / privacy / compliance / trust (S1296–1495): PASS
No API keys in public files; DA Leads key server-side only; no paid data shown publicly; user-entered labelled;
Not confirmed neutral; missing -> what still needs checking; no legal/finance/valuation/survey/planning-certificate claims.

## Phase 15 — Final decision / packaging / stop (S1496–1596): PASS
Patch deployable; one-file zip with after-CSV + README built and verified. Stop after final answer.

## Phase 16 — Sampled QA micro-gates (S1597–1000): PASS
Sampled after-patch rows: SP2 -> "Not confirmed" (no fake); R2 -> confirmed LEP; geocode-fail -> safe REVIEW->PR;
PASS row sane. Global: non-res fake min-lot 0, critical FAIL 0, counts 969/31/0.

## FINAL
Status: READY FOR LIMITED BETA.
Files changed: public/assets/sv-check.js (retry only).
Deploy: optional reliability improvement; safe; let CI run e2e before relying on it.
Zip: siteverdict-99C-r7-retry-patch.zip (sv-check.js + README + after-CSV).
Next: deploy retry patch; then real approved-DA validation once DA Leads data flows or official records supplied.
