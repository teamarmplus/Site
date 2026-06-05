# SiteVerdict — Parcel Precision Phase 4 (measure + safe gain + autocomplete scope)

## Task 1 — verified rate by address class (the real story)
Sub-sample n=141 (live, vs DCS):
  single-lot residential : 96/97  = 99%   <- the normal homeowner case
  strata (SP)            : 0/27   = 0%    <- correctly needs_review (a unit is not a land parcel)
  unresolved             : 0/6    = 0%    <- fail-safe
  geocode-failed         : 0/11   = 0%    <- fail-safe
VERDICT: the ~64-68% headline is a TEST-MIX ARTIFACT. The GT set is ~19% strata (metro-heavy).
For a normal user checking a normal house, the verified rate is ~99%. The misses sit exactly where
they SHOULD fail safe. 64-68% is not a normal-user problem.

## Task 2 — near-tolerance + suburb guard (SAFE GAIN — KEPT)
Change: verify when (a) DCS address match is unique on number+street+suburb, AND (b) geocode point
is inside OR within 30m of the matched property, AND (c) the USER-TYPED suburb equals the matched
property's suburb (the guard that kills the Newcastle->Stockton relocation class).
Measured on the full 320 set (address->propid ground truth):
  Phase 3 (strict): verified 64.0%, exact-on-verified 100%, confident-wrong 0
  Phase 4 (kept):   verified 68.0%, exact-on-verified 100%, confident-wrong 0   (+4 pts, +13 properties)
The suburb guard compares the user's TYPED suburb against the matched property (not the geocoded
suburb), so a geocode that relocates suburb is rejected. Confirmed: the King St Newcastle->Stockton
case now correctly -> needs_review.

## Task 3 — free NSW autocomplete feasibility
- Proper type-ahead endpoint (NSW GeocodeServer) REQUIRES A TOKEN -> not free without registration.
- NSW_Property MapServer prefix-LIKE on `address` works with NO token BUT is:
  - format-sensitive: the partial must match DCS's expanded "NUMBER STREET TYPE SUBURB" exactly
    ("45 OXFORD ST EP" -> 0; "45 OXFORD STREET EP" needed) -> client must expand abbreviations live;
  - rate-limited under load (observed throttling during measurement) -> needs debounce(>=400ms),
    min 6+ chars, aggressive cache, and graceful failure.
- Payoff IF built: user picks an exact DCS address -> propid directly -> parcel resolves with NO
  geocode step and NO drift -> would lift the single-lot path and remove the geocode-failed class.
RECOMMENDATION: a free DCS-backed autocomplete is FEASIBLE but brittle (format-sensitive + fair-use).
Given single-lot is already ~99% verified, autocomplete is a polish/coverage lever, not a fix for a
broken rate. Recommend: do NOT fund paid Google Places. If autocomplete is wanted, prototype the FREE
DCS prefix approach (with a registered free DCS key if obtainable for higher limits) as its own phase.

## Files changed (Task 2 kept)
- public/netlify/functions/parcel.js  (near-tolerance + suburbOf guard)
- public/assets/sv-check.js           (passes &uaddr=raw user input for the suburb guard)
- public/index.html (cache-bust), public/version.json
- geocode.js, nearby.js UNCHANGED (byte-identical). daleads intact.

## NOT proven here
- Rendered parcel line (no browser). Task 1 is an n=141 sub-sample (DCS latency capped the live run);
  the 99% single-lot figure is from that sample, directionally strong but not the full 320.

## Rollback
Revert parcel.js + sv-check.js + index.html + version.json.
