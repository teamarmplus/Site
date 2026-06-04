# Map / Address Confirmation Banner V1 (render-only)

A small, render-only trust banner at the top of the Site Check result card. It shows the matched
address + confidence and reminds the user to check the map. It does NOT change the flow, add a
draggable pin, add manual lat/lng, or re-run the check from a clicked map.

## What it adds
A banner as the first element inside the result card (`buildVerdictSection`), built by a new helper
`_confirmLocationBanner(matchedAddr, geoConf, inputAddr)`.

Strong-confidence wording (exact / Verified):
  Confirm the location
  We matched: [matched address]
  Confidence: [confidence]
  Please check the map before relying on this result. This map is approximate and not a survey.
  If this is not your property, edit the address and check again.

Weak-confidence wording (interpolated / approximate / estimated / needs review / unknown):
  Location needs review
  We matched: [matched address]
  Confidence: [confidence]
  The address was not matched confidently enough to confirm the exact property. Please enter a full
  street number, street name, suburb and postcode, or request a Professional Review.
  This map is approximate and not a survey.

## Behaviour with the existing flow
- Wrong-street / route-only / suburb-only / invalid addresses are REJECTED upstream (existing guard)
  and never reach the banner — the user sees "Address not matched", no parcel, no wrong-location banner.
- Accepted addresses show the banner with the matched address and confidence.

## Files changed
- public/assets/sv-check.js only (one new helper + one insertion line). No flow change, no pin,
  no manual coordinates, no re-run.

## Safety
Does not claim parcel / boundary / frontage confirmed; no "exact boundary"; no "survey confirmed".
Matched address is HTML-escaped. Professional Review CTA remains in the card unchanged.
