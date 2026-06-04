# Parcel Safety Fix — street-substitution guard

## The bug (reproduced live)
Input "148 Canley Road Canley Heights NSW 2166" returned, from the live geocoder:
  matchedAddr: "337 Canley Vale Rd, Canley Heights NSW 2166"  confidence: Verified  quality: exact  type: ROOFTOP
"Canley Road" does not exist in Canley Heights, so Google substituted a DIFFERENT street/number
(a commercial property, the El Cortez Hotel) and still reported ROOFTOP/exact. The engine trusted
that flag and would show a confident parcel/map for the WRONG property. "2 Canley Road" snapped to
the same wrong match. This is a trust-critical launch blocker.

## Root cause
geocode.js accepted Google's locationType (ROOFTOP -> Verified/exact) without checking that the
RETURNED street name/number matched what the user typed. Existing guards covered suburb-only,
route-only, approximate+partial, and postcode mismatch — but not a confident match on a different street.

## The fix (geocode.js)
Added a street-substitution guard after the postcode check:
- `streetMatch(input, googleHit)` compares the user's street number + street name against Google's
  structured address_components (street_number + route), with road-type abbreviation handling
  (Rd=Road, St=Street, ...) and EXACT core-street-name matching ("Canley" != "Canley Vale").
- If the street name differs -> return found:false, addressQuality:'street_mismatch', with a clear
  reason naming the closest match. The client shows "Address not matched" and NO parcel/map.
- If only the street NUMBER differs (street correct) -> downgrade confidence to "Needs review",
  drop quality from 'exact' to 'approximate', and attach a `numberWarning`. Never shown as Verified.

## Client (sv-check.js)
- found:false / street_mismatch already routes to the existing `_showAddrNotFound` path (no parcel shown).
- Added `numberWarning` passthrough so a number-mismatch can surface to the user.

## Proven behaviour
- "148 Canley Road" / "2 Canley Road" -> REJECT (no parcel). 
- "148 Canley Vale Road" (correct) -> ACCEPT Verified/exact.
- "148 -> 152 Canley Vale Rd" (number differs) -> ACCEPT but Needs review + warning.
- 6 real valid addresses (Epping, Parramatta, Newcastle, Wollongong, Tamworth, Manly) -> 0 false positives.

## Files changed
- public/netlify/functions/geocode.js  (the fix)
- public/assets/sv-check.js            (numberWarning passthrough only)

## Not changed
No report sections, no min-lot logic, no new features, no other functions. No deploy performed.
