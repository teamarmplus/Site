# SiteVerdict — Parcel Precision Phase 2 (verified-rate raised, measured)

## What changed (verified-rate logic, all in parcel.js)
Phase 1 was correct but over-conservative (verified ~37%). Phase 2 adds SAFE relaxations:
- Buffer fallback for geocode drift: if the point is just off the property, use a 12 m buffered
  candidate — ONLY if its address matches the input on STREET *and* NUMBER (addressMatches()).
- Strata detection: SP-prefixed plan labels are strata, not land parcels -> needs_review.
- Multiple candidate properties: pick the unique street+number match; else needs_review.
- >4-lot block cap: a polygon spanning many lots is a parent/block, never asserted.
Single-property-at-point now also requires street+number match before it can verify (this closed a
confident-wrong where a coarse geocode for "45 Beecroft Rd" landed on next-door "46 Beecroft Rd").

## Ground-truth measurement (320 stratified real NSW addresses, 20 LGAs, metro+regional+rural)
Run IN sandbox via rate-limited curl against NSW DCS (Property + Cadastre). Ground truth = the lots
whose polygon contains the geocoded point (independent point-in-lot cross-check).
  resolved (geocoded ok):   315  (5 geocode failures excluded)
  verified:                 204  (64.8% of resolved)   [Phase 1: ~37%]
  needs_review (fail-safe):  111  (35.2%)
  exact-match ON verified:  204/204 = 100.0%
  CONFIDENT-WRONG:          0
Every confident-wrong found during development was traced and fixed or backed out (street+number
gate; SP-strata gate; >4-lot cap). The remaining 35% fail safe by design (drift, strata, blocks,
multi-frontage) rather than guess.

## 148 Canley Vale (defining case): verified, Lot 5 & 6 Sec 17 DP728, ~661 m2. Unchanged from P1.

## Files changed
- public/netlify/functions/parcel.js  (verified-rate logic; pure helpers exported for tests)
- public/assets/sv-check.js           (passes matched address to resolver for street+number gate)
- public/index.html (cache-bust), public/version.json (build_name + flags)
- geocode.js, nearby.js UNCHANGED. daleads intact.

## NOT proven here
- The rendered parcel line on desktop/mobile (no browser) — strings + state logic unit-tested.
- 64.8% is the measured verified rate on THIS 320-set; a different sample will vary. The inviolable
  number — confident-wrong = 0 — held across all 315 resolved.

## Rollback
Revert parcel.js + sv-check.js + index.html + version.json. (geocode/nearby untouched.)
