# SiteVerdict — API & Data Layer Roadmap

*Internal document. Do not implement any new API calls from this list without explicit decision.*
*Purpose: plan, not build.*

Last updated: May 2026

---

## Current data sources (live in production)

| Source | Layer | Status |
|---|---|---|
| NSW Planning Portal (mapprod3.environment.nsw.gov.au) | Zone (Layer 11), Min lot (Layer 14), Heritage (8), Flood EPI (0), Bushfire, Acid sulfate, Contaminated, Riparian, Land reservation, Foreshore, FSR, Height | Live |
| NSW Cadastre (maps.six.nsw.gov.au) | Lot area, lotidstring, parcel geometry | Live |
| NSW ePlanning (planningportal.nsw.gov.au) | 34-council subdivision DA median timeline dataset | Live (hardcoded) |
| Nominatim (OpenStreetMap) | Address geocoding | Live |
| OpenStreetMap Overpass | Infrastructure proximity (train, bus, hospital, school) | Live |
| DA Leads (daleads.com.au) | Comparable approved residential DAs, hot list | Live (paid, server-side) |
| Anthropic Claude API | Site report interpretation, AI narrative | Live (paid, server-side) |

---

## Gap analysis — known model limitations

| Limitation | Impact on report | Priority |
|---|---|---|
| Riparian/watercourse corridor not queried directly | False positives for sites near Category 2 watercourses | High |
| No lot/DP matching for exact parcel centroid | Block size may reflect parent parcel, not DA site | High |
| No slope/terrain data | Earthworks cost and retaining risk not estimated | Medium |
| No detailed flood depth/frequency | EPI Flood layer is broad; detailed flood risk differs | Medium |
| No comparable sales data | No price context for lot value estimates | Medium |
| No construction cost index | Cost/lot estimates are very rough | Low |
| Lender report format not standardised | Lender-ready reports require manual formatting | Low |

---

## Recommended future data layers

### Priority: HIGH — should be added before institutional claims

**1. NSW Riparian Land and Watercourse Corridor Layer**
- Purpose: Detect Category 1 and 2 watercourse buffers (20m and 10m setbacks under LEP Clause 7.4)
- Source: NSW Planning Portal — Layer 7 (Riparian Land and Watercourses) — public
- Cost: Free (same ArcGIS endpoint as existing layers)
- Expected value: Eliminates the primary known false-positive case (DA-2022/1205 type)
- Risk: Layer availability may vary by council; may require testing per LGA
- Priority: **HIGH — implement next**

**2. NSW Cadastre lot-level parcel centroid (by lot/DP)**
- Purpose: Identify exact registered parcel centroid rather than geocoded address centroid
- Source: NSW Cadastre `lotidstring` query — already partially implemented
- Cost: Free
- Expected value: Eliminates large-parcel false detections; improves block size accuracy
- Risk: Requires lot/DP as input — user must provide or be prompted
- Priority: **HIGH — implement for full report pathway**

---

### Priority: MEDIUM — adds significant value, plan for 3–6 months

**3. NSW Flood Risk Layer (detailed)**
- Purpose: Beyond the broad EPI Flood Planning Area — get flood frequency, depth zone
- Source: NSW BOM flood risk data, or council-specific flood maps where available
- Cost: Free (government open data) — but availability inconsistent across councils
- Expected value: Reduces false-positive flood flags; adds flood depth context for lenders
- Risk: Data not uniform across all 34 councils; some councils publish, some do not
- Priority: MEDIUM

**4. Slope / terrain proxy**
- Purpose: Estimate earthworks cost and retaining risk from terrain gradient
- Source: SRTM DEM (open, ~30m resolution) via a public elevation API, or NSW DEM tiles
- Cost: Free or low-cost
- Expected value: Earthworks is frequently the hidden cost in subdivision — even a rough slope flag is valuable
- Risk: 30m resolution DEM does not detect lot-scale slope; useful only as flag, not precise estimate
- Priority: MEDIUM

**5. Construction cost index (NSW)**
- Purpose: Better cost/lot estimates for feasibility context
- Source: Rawlinsons (paid, quarterly), or ABS Construction Price Index (free, lagged)
- Cost: Rawlinsons ~$300/year; ABS free
- Expected value: Makes feasibility estimates more defensible for lender-ready reports
- Risk: Any cost estimate is indicative only — must be disclaimed clearly
- Priority: MEDIUM

---

### Priority: LATER — adds value after trust and volume are established

**6. NSW property sales comparable data**
- Purpose: Add lot value context to feasibility — what did nearby lots sell for after subdivision?
- Source: NSW Valuer General (limited free access), or paid provider (CoreLogic, PropTrack, REIV)
- Cost: Paid — likely $200–500/month depending on volume
- Expected value: Highest-value addition for developer and lender audience
- Risk: Licensing complexity; accuracy claims become harder to defend
- Priority: LATER — after core product is validated

**7. Lender report export (structured PDF)**
- Purpose: Generate a formatted lender-ready PDF directly from the site report
- Source: Internal — generate from existing report data
- Cost: Internal build cost only
- Expected value: Enables the finance/lender revenue stream
- Risk: Report format must be reviewed by a licensed professional before use with lenders
- Priority: LATER — needs compliance review first

**8. NSW Heritage Register (SHRO)**
- Purpose: Identify State Heritage Register items beyond local heritage overlay
- Source: NSW Heritage Office — public SHRO dataset
- Cost: Free
- Expected value: Identifies state-level heritage constraints not in local LEP
- Risk: Adds complexity; most sites checked are not state heritage items
- Priority: LATER

**9. Better geocoding (GNAF / G-NAF)**
- Purpose: More accurate address-to-parcel matching than Nominatim
- Source: PSMA G-NAF (Geocoded National Address File) — free via data.gov.au
- Cost: Free
- Expected value: Reduces the coordinate precision issue that causes E2 false returns
- Risk: Implementation complexity; requires self-hosted or API wrapper
- Priority: LATER — after volume justifies it

---

### Not recommended

| Source | Why not |
|---|---|
| Investment advice APIs | Crosses into financial advice — not compatible with SiteVerdict model |
| AI-generated price predictions | Unreliable and legally risky without licensed valuer |
| Social media / sentiment data | Not relevant to planning intelligence |
| Land banking databases | Contradicts platform principles |

---

## Implementation sequence recommendation

1. **Now:** Riparian layer (free, already uses same endpoint)
2. **Now:** Lot/DP centroid lookup improvement (already partially built)
3. **3 months:** Slope/terrain proxy flag (free, low risk)
4. **3–6 months:** Detailed flood layer (depends on council coverage)
5. **6–12 months:** Construction cost index (low cost)
6. **12+ months:** Comparable sales data (paid, compliance review needed)
7. **12+ months:** Lender report PDF export (needs compliance and professional review)

---

*Do not implement any new APIs without explicit founder decision and testing on the 20-row validation dataset first.*
