# Package 99 Roadmap — NSW Site Check toward "better than Landchecker" (NO BUILD)

Live baseline: Package 98. All endpoints below tested live, no key required.

## 1. What NSW data SiteVerdict already uses
- SIX Cadastre layer 9 "Lot": parcel polygon + lotidstring/lotnumber/planlabel/planlotarea.
- ePlanning EPI_Primary_Planning_Layers: zoning, min lot size, FSR, height, heritage (the result's planning facts).
- Geocode (address -> lat/lon) + map (Leaflet + OSM tiles).

## 2. Best extra FREE NSW data sources (rated)

| Source | Endpoint (host/service) | Key? | Useful layers/fields | Geom | Point query | Rating |
|---|---|---|---|---|---|---|
| SIX Cadastre Lot | maps.six.../public/NSW_Cadastre/9 | No | polygon, lotidstring, planlabel, planlotarea | poly | yes | A (in use) |
| ePlanning Primary | mapprod3.../Planning/EPI_Primary_Planning_Layers | No | 0 Heritage,1 FSR,2 Zoning,3 Land Reservation,4 Lot Size,5 Height | poly | yes | A (in use) |
| NSW Transport Theme | portal.spatial.../NSW_Transport_Theme/5 RoadSegment, 6 RoadNameExtent | No | roadnamebase/type, centreline | line | yes (distance) | B (frontage, needs validation) |
| NSW_Query AddressPoint | maps.six.../public/NSW_Query/0 | No | address (street name) | point | yes | B (frontage disambiguation) |
| Planning Hazard | mapprod3.../Planning/Hazard | No | 1 Flood Planning, 2 Landslide Risk | poly | yes | B (test coverage varies) |
| SEPP Resilience & Hazards | mapprod3.../Planning/SEPP_Resilience_and_Hazards_2021 | No | Coastal Wetlands/Vulnerability/Environment, Acid-sulfate-related | poly | yes | B |
| SEPP Biodiversity & Conservation | mapprod3.../Planning/SEPP_Biodiversity_and_Conservation_2021 | No | biodiversity/conservation areas | poly | yes | B |
| Development Control | mapprod3.../Planning/Development_Control | No | DCP-related | poly | yes | B |
| DA Tracking / Application Tracking | mapprod3.../Planning/DA_Tracking | No | nearby DAs | mixed | yes | C (noisy; useful later) |
| Bushfire Prone (RFS) | RFS/portal (exact path TBC) | likely No | bushfire category | poly | yes | C (endpoint not yet confirmed) |
| Biodiversity Values (SEED) | environment SEED (exact path TBC) | likely No | BV map | poly | yes | C (path not yet confirmed) |
| Imagery / aerial tiles | maps.six.../public/NSW_Imagery | No | aerial basemap | raster | tiles | B (nicer map; licence/attribution check) |

Licence/attribution: SIX/Spatial NSW + DPE layers are NSW Gov data, generally CC BY 4.0 — must show per-source attribution; confirm terms before production. Disclaimer required wherever boundary/area/dimensions shown.

## 3. What Landchecker likely has that we still lack
- Frontage + dimension labels (we have the raw data but not validated display).
- Aerial/satellite basemap (we use OSM grey; NSW_Imagery exists, licence check needed).
- Orientation (derivable from polygon geometry; not yet shown).
- Title/DP-plan-accurate dimensions (paid LRS/Geoscape) — survey-grade, we will stay "approximate".
- Slick paid property datasets (sales history etc.) — out of scope for Site Check.

## 4. What can be built NOW safely (low risk, no new UI claims)
- Phase A: Land size auto-detect from polygon (area), with confidence labels. Move optional inputs below result.
- Aerial basemap option (if NSW_Imagery licence confirmed) — bigger visual win, display-only.
- Additional planning facts already in EPI service are mostly shown; no change to result wording.

## 5. What needs validation FIRST (build behind a flag, log, no UI)
- Frontage (Transport RoadSegment + street-name match) — proven fetchable but naive nearest-road is WRONG (Canley nearest=TORRENS but real frontage=BURDETT). Validate match accuracy on a sample before any UI.
- Edge dimension labels — safe only for simple single-ring lots; validate which lots qualify.
- Hazard/SEPP layers — confirm point-query reliability + coverage before surfacing as facts.

## 6. Confidence rules
LAND SIZE:
- Detected from parcel: single ring, <=12 verts, area 50–20,000 m2; if planlotarea present, computed within ~10%.
- Estimated from map: single ring but outside bounds, or field/computed disagree >10%.
- Land size not confirmed: multi-ring, >20 verts, or no polygon.
FRONTAGE:
- Detected from parcel: single ring 4–6 verts; geocoded street matched a nearby RoadSegment; ONE edge nearest AND parallel (<20deg) to that road; 6–60 m.
- Estimated from map: plausible but no name match / corner-lot ambiguity -> prefer omit.
- Frontage not confirmed: multi-ring, no road within 80m, or nearest road != geocoded street.
DIMENSIONS:
- Show only for single-ring simple lots (4–8 edges), label "~Xm".
- Cap to main 4–6 edges; skip edges < 1.5 m (fragments).
- Multi-ring/strata/>12 verts: skip entirely.

## 7. Test address set needed (NSW, varied)
- Standard suburban rectangle (e.g. Orange block).
- Narrow deep lot (Canley Heights test).
- Corner lot (two street frontages) — frontage ambiguity case.
- Battle-axe / panhandle lot.
- Strata / multi-ring (Parramatta) — must show "not confirmed".
- Large/rural lot (Penrith) — area approximation stress.
- Lot with planlotarea populated AND one with it null — area fallback.
~12–20 addresses, compared against title plan / Landchecker for ground truth.

## 8. Recommended Package 99 build order
- 99A (now, safe): Land size auto-detect + confidence labels + move optional inputs below result. Map-display only.
- 99-img (optional, after licence check): aerial basemap toggle.
- 99B-validate (no UI): frontage match + dimension qualification, logged on the test set.
- 99B-ship (only if validation passes): frontage "~Xm Detected from parcel" for HIGH; else "Frontage not confirmed".
- 99C (later): dimension edge labels for simple lots; orientation.
- 99D (later): surface hazard/SEPP facts (flood, bushfire, biodiversity) once point-query reliability confirmed — as plain-English "may apply, confirm with council", never certainty.

## 9. What should WAIT
- Frontage UI, edge labels, hazard facts: until validated on the test set.
- Aerial basemap: until NSW_Imagery licence/attribution confirmed.
- Anything implying approval, development potential, or profit: never.

## 10. Paid/commercial data later?
- Only if free data proves insufficient for: survey-grade dimensions/frontage (LRS title/DP plans), or national one-call parcel+attributes (Geoscape).
- For Site Check's purpose (help a homeowner understand their land + risks honestly), the FREE NSW stack above is sufficient for A/B-grade features. Paid is a later optimisation, not a dependency.

RECOMMENDATION: Build 99A (land size + inputs-below) now. Validate frontage/dimensions/hazards behind a flag next. Confirm NSW_Imagery licence for the aerial win. No frontage/edge-label UI until validated.
