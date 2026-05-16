# SiteVerdict — Coordinate Verification Priority List

Generated: 2026-05-16

This file tracks which rows in `data/backtest-input-20-coordinate-review.csv` need
manual coordinate verification, in priority order.

Complete verification using:
1. **NSW Planning Portal Spatial Viewer** — `planningportal.nsw.gov.au/spatialviewer`
   Search by address → click parcel → copy centroid lat/lng + note Lot/DP shown in panel.
2. **NSW SIX Maps** — `maps.six.nsw.gov.au`
   Search by address → click lot boundary → note Lot, DP/SP number.
3. **NSW ePlanning DA record** — `planningportal.nsw.gov.au/eplanning`
   Search by DA number → view application → check mapped location.

Fill results into `verified_lat`, `verified_lng`, `lot`, `dp`, `parcel_id`,
`coordinate_verified_by`, `coordinate_verified_date` columns.

---

## A. Replace invalid rows (highest priority — these are bad sample data)

These two addresses could not be verified as real residential subdivision sites.
They must be **replaced entirely** — do not attempt to fix their coordinates.
Use NSW ePlanning or council DA registers to find real replacement DAs.

---

### Row 15 — 4 Crown Street, Wollongong 2500
**Status:** `INVALID_SAMPLE_REPLACE`
**Issue:** Every point within 110m returns E2 (Environmental) or SP2 (Special Purpose).
No residential zone exists at or near this address. Crown Street does not appear
to exist in any residential suburb of Wollongong LGA.
**Why it matters:** This is one of two refused DAs in the sample. A refused DA with
a correct zone is critical for testing false-positive suppression. Without a valid
refused DA example, the model's ability to score refusals cannot be tested.
**Action:** Replace with a real Wollongong LGA refused residential subdivision DA.
**Requirements:**
- Zone must be R1, R2, or R3 (confirmed via Planning Portal)
- DA outcome must be Refused or Withdrawn
- Development type must be subdivision, dual occupancy, or similar residential
- Verified lat/lng from NSW Planning Portal or SIX Maps
**Source:** Wollongong City Council — DA Register:
`https://datracker.wollongong.nsw.gov.au`
Or NSW ePlanning: `https://www.planningportal.nsw.gov.au/eplanning`
**Do not reuse Crown Street Wollongong 2500.**

---

### Row 20 — 31 Sunnyside Avenue, Shellharbour 2529
**Status:** `INVALID_SAMPLE_REPLACE`
**Issue:** Nominatim returned no result for Sunnyside Avenue in Shellharbour 2529
across 8 Shellharbour LGA suburbs. Blank zone at all 9 coordinate attempts.
The street name does not appear to exist.
**Why it matters:** The Shellharbour fast-approval council (71-day median) is well
represented in our scoring data. A valid Shellharbour approved DA would test
whether the tool correctly rewards fast councils. Currently Shellharbour has only
row 6 (approximate coordinate, model_valid = NO).
**Action:** Replace with a real Shellharbour LGA approved residential subdivision DA.
**Requirements:**
- Zone must be R1 or R2 (confirmed via Planning Portal)
- DA outcome must be Approved
- Verified lat/lng + lot/DP from SIX Maps
**Source:** Shellharbour City Council — DA search:
`https://www.shellharbour.nsw.gov.au/services/development-applications/search-da`
Or NSW ePlanning: `https://www.planningportal.nsw.gov.au/eplanning`
**Do not reuse Sunnyside Avenue Shellharbour 2529.**

---

## B. Verify high-impact coordinate rows (medium priority — affect model accuracy)

These rows scored but returned suspicious zones or large parcel warnings.
The scoring logic may be correct but the zone used was wrong.
Fixing these would raise `model_valid_rows` from 10 toward 18.

---

### Row 5 — 17 Macquarie Street, Parramatta 2150
**Issue:** Zone returned E2. All 8 offset retries also returned E2.
Block size 5,309m² flagged `large_parent_parcel_possible`.
Macquarie Street Parramatta is a high-density corridor — E2 is almost certainly wrong.
The coordinate may be landing on a heritage-listed building footprint or special purpose
lot rather than the residential parcel.
**What to verify:** Confirm the correct zone and residential lot for this address.
Expected zone: R4, MU1, or R3.
**Source:** NSW Planning Portal Spatial Viewer — search "17 Macquarie Street Parramatta".
Click the specific parcel. Expected: R4 High Density or mixed-use zone.
**Fields to fill:** `verified_lat`, `verified_lng`, `lot`, `dp`, `coordinate_verified_by=planning-portal-manual`

---

### Row 9 — 5 Pacific Highway, Coffs Harbour 2450
**Issue:** Zone returned E2. All 8 offset retries also returned E2.
Block size 18,627m² flagged `large_parent_parcel_possible`.
Pacific Highway addresses in Coffs Harbour vary widely — some are in highway
service zones, some are residential. The coordinate may be landing on the highway
reservation or an adjoining rural lot.
**What to verify:** Whether this DA address is in a residential zone at all.
If the actual DA site is not residential, this row should be replaced.
**Source:** NSW Planning Portal Spatial Viewer — search "5 Pacific Highway Coffs Harbour".
Look for the zoning layer — expected: R2 or R3 if residential.
**Fields to fill:** `verified_lat`, `verified_lng`, `lot`, `dp`, `coordinate_verified_by=planning-portal-manual`

---

### Row 11 — 11 Kookaburra Drive, Wollongong 2500
**Issue:** Zone returned E2. All 8 offset retries also returned E2.
Block size 18,889m² flagged `large_parent_parcel_possible`.
Kookaburra Drive is a residential street name — E2 strongly suggests the coordinate
has landed on an adjacent bushland or escarpment parcel.
**What to verify:** Correct parcel centroid for 11 Kookaburra Drive.
Expected zone: R2 or R3.
**Source:** NSW Planning Portal Spatial Viewer or SIX Maps.
**Fields to fill:** `verified_lat`, `verified_lng`, `lot`, `dp`, `coordinate_verified_by=planning-portal-manual`

---

### Row 12 — 3 Church Street, Maitland 2320
**Issue:** Zone returned MU1 (Mixed Use) with heritage overlay. `model_valid = YES`
because coordinate_quality = good. However, block size 18,933m² is flagged
`LARGE_PARCEL` in console — unusual for a 3-lot subdivision DA.
MU1 is a plausible zone for inner-Maitland streets, but the large block suggests
the cadastre may be returning a parent lot rather than the actual DA parcel.
**Why it matters:** This row is currently model_valid = YES but may be using an
inflated block size. Score 78 may be too high if the real lot is smaller.
**What to verify:** Confirm the actual lot size for 3 Church Street Maitland.
SIX Maps should show the cadastral boundary clearly.
**Source:** NSW SIX Maps — search "3 Church Street Maitland".
**Fields to fill:** `lot`, `dp`, `parcel_id`, `coordinate_verified_by=six-maps-manual`
Note: if lot/DP confirms the block is genuinely large, no change needed.

---

### Row 13 — 18 Regent Street, Cessnock 2325
**Issue:** Zone returned RE1 (Public Recreation). All 8 offset retries returned RE1.
Block size 7,907m² flagged `large_parent_parcel_possible`.
Regent Street is a residential street — RE1 indicates the coordinate is landing on
a park, sports ground or public reserve.
**What to verify:** Correct parcel centroid away from the adjoining reserve.
Expected zone: R2.
**Source:** NSW Planning Portal Spatial Viewer — search "18 Regent Street Cessnock".
**Fields to fill:** `verified_lat`, `verified_lng`, `lot`, `dp`, `coordinate_verified_by=planning-portal-manual`

---

### Row 14 — 7 Boundary Road, Sutherland 2232
**Issue:** Zone returned E2. All 8 offset retries returned E2.
Block size 454m² is plausible for a small lot (not a large parcel warning).
Boundary Road Sutherland runs along the edge of the Royal National Park —
the coordinate is landing inside or on the E2 boundary.
**What to verify:** Whether this address has a residential component.
If the block genuinely borders E2, that's an overlay constraint the model should capture.
Expected zone: R2 if the lot is residential.
**Source:** NSW Planning Portal Spatial Viewer.
**Fields to fill:** `verified_lat`, `verified_lng`, `lot`, `dp`, `coordinate_verified_by=planning-portal-manual`

---

### Row 16 — 19 Station Street, Penrith 2750
**Issue:** Zone returned E2. All 8 offset retries returned E2.
Block size 86,384m² — extremely large, almost certainly a parent parcel or floodplain reserve.
Station Street Penrith is near the Nepean River.
**What to verify:** Whether this address is a real residential subdivision site.
If block is genuinely on a floodplain, the E2 zone and large block may be correct —
and the DA refusal should be expected.
**Source:** NSW Planning Portal Spatial Viewer — search "19 Station Street Penrith".
**Fields to fill:** `verified_lat`, `verified_lng`, `lot`, `dp`, `coordinate_verified_by=planning-portal-manual`

---

### Row 19 — 25 Corrimal Street, Wollongong 2500
**Issue:** Zone returned E2. All 8 offset retries returned E2.
Block size 12,006m² flagged `large_parent_parcel_possible`.
This is the fourth Wollongong 2500 row with the same E2 pattern.
All four Wollongong rows (11, 15, 19, and the now-replaced 15) land in E2 —
suggesting the sample coordinates for Wollongong 2500 are systematically wrong.
**What to verify:** Real residential parcel centroid for Corrimal Street.
Corrimal is a known residential suburb — expected zone R2.
**Source:** NSW Planning Portal Spatial Viewer — search "25 Corrimal Street Wollongong".
**Fields to fill:** `verified_lat`, `verified_lng`, `lot`, `dp`, `coordinate_verified_by=planning-portal-manual`

---

## C. Already acceptable rows (model_valid = YES, no action required)

These rows scored with plausible zones and reliable coordinate sources.
No further verification needed unless lot/DP confirmation is wanted for
institutional-grade validation.

| Row | Address | Zone | Score | Coord quality | Notes |
|---|---|---|---|---|---|
| 1 | 40 Hoskins Ave, Bankstown | R4 | 71 | verified (API offset scan) | ✓ Lot 200/DP1111773 confirmed |
| 2 | 6 Fenton St, Panania | R2 | 69 | good | ✓ Known correct from website testing |
| 3 | 39-45 Wattle Rd, Casula | R2 | 66 | good | ✓ Plausible zone |
| 4 | 12 Smith St, Penrith | R2 | 61 | good | ✓ Refused DA — correct zone |
| 7 | 14 Burke St, Maitland | MU1 | 68 | needs_review (RE1→MU1 fallback) | Confirm MU1 via Planning Portal if used institutionally |
| 8 | 8 Hillside Dr, Camden | R2 | 76 | needs_review (E1→R2 fallback) | Confirm R2 via Planning Portal if used institutionally |
| 10 | 23 Pacific St, Newcastle | MU1 | 57 | good | ✓ Plausible zone for Newcastle |
| 17 | 6 John St, Camden | MU1 | 62 | good | ✓ Plausible zone |
| 18 | 9 Hunter St, Newcastle | MU1 | 69 | good | ✓ Plausible zone |

**Note on rows 7 and 8:** These used fallback zone recovery (offset retry). The recovered
zones (MU1 and R2 respectively) are plausible, but the coordinates are still approximate.
For institutional reporting, these should be confirmed via Planning Portal or SIX Maps
and marked `coordinate_verified_by=planning-portal-manual`.

---

## How to fill verified coordinates

After confirming in NSW Planning Portal or SIX Maps, update
`data/backtest-input-20-coordinate-review.csv`:

```csv
verified_lat=-33.81234
verified_lng=151.00123
lot=12
dp=DP12345
parcel_id=12/DP12345
coordinate_verified_by=planning-portal-manual
coordinate_verified_date=2026-05-16
```

Then rerun:
```bash
rm -f data/backtest-results.csv
node tools/backtest-siteverdict.js \
  --input data/backtest-input-20-coordinate-review.csv \
  --limit 20 \
  --no-paid-api
```

Target: raise `model_valid_rows` from 10 to 16+ before drawing conclusions
about scoring accuracy. Current `broad_outcome_alignment_model_valid_strict = 80%`
is based on only 10 rows — not statistically significant.
