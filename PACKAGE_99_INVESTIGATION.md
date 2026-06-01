# Package 99 Investigation — NSW land size / frontage / dimensions (NO BUILD YET)

Tested against live NSW SIX cadastre (layer 9 "Lot") with real parcels.

## 1. What current NSW data already gives us
- Polygon geometry (rings) for the parcel: YES, whenever a lot is found.
- Fields: lotidstring, lotnumber, planlabel, planlotarea, planlotareaunits, lotidstring.
- planlotarea (the area FIELD) is UNRELIABLE: populated 3/8 sampled parcels, null on the rest (incl the Canley Heights test address).
- NO road field, NO frontage field, NO roads layer in the SIX cadastre service.

## 2. What can be calculated safely
- AREA from polygon (shoelace): works for simple single-ring lots (Canley 223m2, Orange 523m2 looked right).
  - Use polygon area as PRIMARY (more consistent than the field), planlotarea field as cross-check.
  - Confidence HIGH only when: single ring, <=12 vertices, area 50–20,000 m2, and (if field present) computed within ~10% of field.
- EDGE LENGTHS for simple lots: yes, the 4–8 edges are meaningful (Canley 6.6 x 33.5; Orange 5.8/17/30.4/17.5/17.5/7.1).

## 3. What is risky
- MULTI-RING / strata / large parcels: area + edges become wrong or meaningless.
  - Parramatta: 8 rings, edges were 0.5–7m fragments (NOT real dimensions). Computed 495 vs field 1717 m2.
  - Penrith: 2 rings, computed 71,908 vs field 86,384 m2 (17% off) — equirectangular approximation degrades at size.
- Equirectangular metres approximation is fine for small suburban lots, NOT for large/rural or multi-part.
- FRONTAGE: no road data. Any "frontage" is a guess about which edge faces the street.

## 4. Confidence rules (proposed)
AREA:
- HIGH ("Detected from parcel"): single ring, <=12 verts, 50–20,000 m2; if planlotarea present, within 10%.
- LOW ("Estimated from map"): single ring but outside those bounds, or field/computed disagree >10%.
- NONE ("Land size not confirmed"): multi-ring, >20 verts, or no polygon.
FRONTAGE:
- We have NO road relationship. Safest heuristic = the SHORTEST of the two edges most likely street-facing is NOT reliable.
- Only even consider frontage when: single ring, 4–6 verts (quadrilateral-ish), area in normal block range.
- Even then label "Estimated from map" and prefer to OMIT rather than mislead.
- If multi-ring / complex / unsure -> "Frontage not confirmed".

## 5. Confidence rules for frontage (detail)
- Quadrilateral lot (4–5 verts incl closing): identify the two short opposite edges and two long opposite edges.
  Frontage candidate = a short edge (typical suburban block frontage < depth). BUT corner lots / battle-axe lots break this.
- Show frontage ONLY if: 4–5 verts, two clear short edges of similar length (within ~20%), each 6–40m. Else omit.
- ALWAYS "~Xm" + "Estimated from map" + disclaimer. Never "exact".

## 6. What should be shown when confidence is low
- Land size: "Land size not confirmed" (no number).
- Frontage: "Frontage not confirmed".
- Offer optional user entry AFTER the result, labelled "User entered".
- Never fabricate. Never imply survey accuracy.

## 7. Package 99 SMALLEST SAFE STEP (proposed, build only if approved)
Phase A (smallest, safe): AREA auto-detect only.
- Compute area from the NSW polygon; show "Land size ~NNN m2 — Detected from parcel" when confidence HIGH;
  "Estimated from map" when LOW; "Land size not confirmed" when NONE.
- Move the optional land-size/frontage inputs to AFTER the result (labelled "User entered"), per your UX.
- NO edge labels, NO frontage in Phase A.
- Map-display only; no scoring/result-wording/backend changes.

## What should WAIT
- Edge dimension labels on the map (Phase B): only after area confidence proven; only for simple lots; "~Xm" + disclaimer; cap to main 4–6 edges; skip multi-ring.
- Frontage detection (Phase C): high risk without road data; likely needs a roads layer (extra source) to be trustworthy. Recommend NOT shipping frontage detection until a road dataset is evaluated.
- A better area calc (proper projected CRS instead of equirectangular) if we later show area for large/rural parcels.

RECOMMENDATION: Approve Phase A only (area auto-detect + move inputs below result). Hold edge labels and frontage.
