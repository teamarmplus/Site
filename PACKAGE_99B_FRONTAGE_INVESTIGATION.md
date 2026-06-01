# Package 99B Investigation — NSW frontage detection (NO BUILD)

Tested live against NSW SIX cadastre + NSW Transport theme. Frontage is feasible but RISKY; needs careful disambiguation.

## 1. Possible data sources
- NSW Cadastre (SIX) layer 9 "Lot": parcel polygon. NO road/frontage field.
- NSW Transport Theme (portal.spatial.nsw.gov.au): RoadSegment (layer 5) + RoadNameExtent (layer 6) = public road CENTRELINE polylines WITH road names. No key. THIS is the missing road data.
- NSW_Query AddressPoint (SIX layer 0): geocoded address points; carries full 'address' string (street name) -> use to disambiguate which road is the frontage road.
- Paid options (more reliable): Geoscape (parcel + frontage/dimension attributes), title/DP plan data (LRS), commercial property APIs.

## 2. Test endpoint examples (all responded, no key)
- Roads near a point (80m):
  https://portal.spatial.nsw.gov.au/server/rest/services/NSW_Transport_Theme/MapServer/5/query?geometry={x},{y}&geometryType=esriGeometryPoint&inSR=102100&distance=80&units=esriSRUnit_Meter&spatialRel=esriSpatialRelIntersects&outFields=roadnamebase&returnGeometry=true&outSR=4326&f=json
- Parcel polygon (SIX layer 9) as before.
- Road name fields: roadnamebase, roadnametype, roadnamesuffix.

## 3. Can road geometry be fetched? YES
Canley Heights test: 7 road segments within 80m, names BURDETT, KIORA, TORRENS, each with centreline geometry. Confirmed fetchable and matchable to parcel edges.

## 4. Proposed frontage algorithm (geometry + street-name match)
1. Get parcel polygon (4326). Compute edges + midpoints in local metres.
2. Get geocoded street name (from address / AddressPoint) -> the FRONTAGE ROAD name.
3. Fetch RoadSegment within ~80m; keep only segments whose roadnamebase matches the geocoded street.
4. For each parcel edge, distance from midpoint to the matched-road centreline.
5. Frontage edge = the edge closest to AND most parallel to the matched road centreline.
6. Frontage length = that edge length (~Xm). Depth = the adjacent perpendicular edge (optional).

## 5. Confidence rules
HIGH ("Detected from parcel"): single-ring lot, 4–6 verts; geocoded street name matched a nearby RoadSegment; ONE clear edge both nearest and ~parallel (angle < 20deg) to that road; frontage 6–60m. -> show "~Xm".
LOW ("Estimated from map"): geometry plausible but no street-name match, OR two edges similarly near/parallel (corner lot ambiguity). -> prefer OMIT or show only with "Estimated from map".
NONE ("Frontage not confirmed"): multi-ring/strata, >6 verts irregular, no road within 80m, or nearest-road != geocoded street (ambiguous). 

## 6. Risk (honest)
- Naive "nearest road = frontage" FAILS. Canley test: nearest match returned TORRENS at 7.5m, but the lot actually fronts BURDETT (seen on map). Centreline is 24–38m from edges (centreline != kerb), and corner lots have multiple near roads.
- MUST disambiguate with the geocoded street name; without it, frontage is a guess.
- Centreline-to-edge distance is not a clean signal (road reserve width varies). Parallelism + name-match are needed.
- Battle-axe / corner / panhandle / strata lots break the heuristic.
- Two extra network calls (roads + possibly AddressPoint) per check -> latency; must be display-only, async, fail-safe.

## 7. Smallest safe Package 99B step (build only if approved)
NOT frontage display yet. Phase B1 = PROVE matching offline behind a flag:
- Add a road-fetch + street-name match that logs (does not display) the chosen frontage edge for NSW.
- Validate on 20–30 known addresses (compare to title plans / Landchecker) before any UI.
- Only after match accuracy is high, Phase B2 shows "~Xm Detected from parcel" for HIGH confidence; everything else "Frontage not confirmed".
- Disclaimer always: "Approximate boundary and dimensions only — not a survey. Confirm by title plan or licensed surveyor."

RECOMMENDATION: Do NOT show frontage yet. Approve only a validation phase (match + log, no UI). Frontage UI waits until name-match accuracy is proven on a real sample.
