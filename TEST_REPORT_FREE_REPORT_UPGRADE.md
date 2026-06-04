# Free Report Upgrade V1 (clean) — Test Report

## Wording fixes applied (pre-existing phrases softened)
1. "whether subdivision is possible and how many lots you can create"
   → "whether subdivision may be worth reviewing, subject to survey, access, services, overlays and council controls"
2. "what may add value or reduce risk"
   → "what may be worth reviewing or help reduce risk"

## Commands
- node --check public/assets/sv-check.js → OK
- node scripts/predeploy.js (release-check) → PASSED 106 / FAILED 0
- render unit tests (pathways + nearby) → 25 / 0
- 20-address pathway/nearby safety table → 20 / 0 PASS

## Safety grep — exact banned phrases (0 unguarded each)
can build · can subdivide · subdivision is possible · how many lots you can create · add value ·
value-add · approved potential · guaranteed approval · investment opportunity · strong buy → ALL CLEAN.
Broader sweep (development potential guaranteed, N lots possible, guaranteed value/profit, high growth,
best suburb, school catchment, official catchment, guaranteed access) → 0 hits.
No secrets. No internal-tool references. No new API.

## What the upgrade adds (unchanged from V1)
Two sections in buildVerdictSection between "What this means" and "What still needs checking":
1. Possible pathways to review — signal-based; subdivision feasibility only when land size >= 2x a
   CONFIRMED min-lot, never a lot count; E/MU/SP/RE/non-residential -> professional review only;
   OC/external -> external-works pathway; closes "not approval, not a guarantee".
2. Nearby context — visible transport/health/retail from already-fetched Overpass data; hides or says
   "not confirmed" when absent; OpenStreetMap attribution; "Verify before relying"; "not a valuation,
   school-catchment check, transport assessment, or professional advice".

## Before/after score: ~8.0 -> ~8.7 (trust/safety held at 9; wording now stricter)

## Verdict
REPORT UPGRADE READY (clean). Patch small, safe, tested; unsafe wording removed. Deploy is T's decision.
