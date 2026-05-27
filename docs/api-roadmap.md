# SiteVerdict — API & Data Layer Roadmap (Internal)

*Do not include in public deploy. Block via _redirects and publish="public".*
*Updated: May 2026*

---

## Current sources (live)

| Source | Layers | Status |
|---|---|---|
| NSW Planning Portal | Zone, min lot, heritage, flood EPI, bushfire, acid sulfate, contaminated, riparian*, land reservation, foreshore, FSR, height | Live |
| NSW Cadastre (SIX Maps) | Lot area, lotidstring, parcel geometry | Live |
| NSW ePlanning (hardcoded) | 34-council DA median timeline | Live |
| Nominatim / OpenStreetMap | Address geocoding, infrastructure proximity | Live |
| DA Leads | Comparable approved DAs, hot list | Live (paid) |
| Anthropic Claude API | Report interpretation | Live (paid) |

*Riparian layer is queried but not reliably detecting watercourse buffers (Row 15 model-gap confirmed).

---

## Recommended future layers

### HIGH PRIORITY — add before institutional accuracy claims

**1. NSW Riparian / Watercourse Corridor (Layer 7)**
- Purpose: Detect Category 1/2 watercourse setbacks (20m/10m under LEP Clause 7.4)
- Source: NSW Planning Portal — Layer 7 (same ArcGIS endpoint)
- Cost: Free
- Value: Eliminates confirmed false-positive class (DA-2022/1205, Fairy Meadow)
- Risk: Availability varies by council; needs testing per LGA
- Priority: **HIGH — implement next**

**2. Lot/DP Parcel Centroid Improvement**
- Purpose: Exact registered parcel centroid vs geocoded address centroid
- Source: NSW Cadastre lotidstring lookup — partially built
- Cost: Free
- Value: Reduces large-parcel false detections; improves block size accuracy
- Risk: Requires lot/DP as input
- Priority: **HIGH**

---

### MEDIUM PRIORITY — 3–6 months

**3. Slope / Terrain Proxy (SRTM DEM)**
- Purpose: Flag earthworks risk from terrain gradient
- Source: SRTM DEM (free, ~30m resolution) via public elevation API
- Cost: Free
- Value: Useful flag even at 30m resolution; common hidden cost in subdivision
- Risk: Not precise at lot scale; must be labelled "indicative only"
- Priority: MEDIUM

**4. Detailed Flood Depth / Frequency (council-specific)**
- Purpose: Beyond broad EPI Flood Planning Area — get flood category
- Source: Council flood maps (inconsistent, some open / some GIS only)
- Cost: Free where available; manual lookup otherwise
- Value: Reduces false-positive flood flags; useful for lender-ready reports
- Risk: Not uniform across all 34 councils
- Priority: MEDIUM

**5. Construction Cost Index**
- Purpose: More defensible cost/lot estimates for feasibility context
- Source: ABS Construction Price Index (free, lagged) or Rawlinsons (paid ~$300/yr)
- Cost: Low
- Value: Makes feasibility estimates more defensible
- Risk: Any cost estimate must be heavily disclaimed
- Priority: MEDIUM

---

### LATER — after volume and compliance are established

**6. Comparable Sales Data**
- Purpose: Lot value context after subdivision
- Source: NSW Valuer General (limited free), CoreLogic/PropTrack (paid ~$200-500/mo)
- Cost: Paid
- Value: Highest-value addition for developer/lender audience
- Risk: Licensing complexity; accuracy claims harder to defend
- Priority: LATER

**7. Lender Report PDF Export**
- Purpose: Formatted lender-ready PDF from report data
- Source: Internal build
- Cost: Internal
- Value: Enables finance/lender revenue stream
- Risk: Must be reviewed by licensed professional before use with lenders
- Priority: LATER — needs compliance review

**8. NSW State Heritage Register (SHRO)**
- Purpose: State-level heritage constraints beyond local LEP
- Source: NSW Heritage Office — public SHRO dataset
- Cost: Free
- Value: Adds state heritage detection
- Priority: LATER

---

## Never recommended

| Source | Reason |
|---|---|
| Investment advice APIs | Contradicts platform principles |
| AI-generated price predictions | Unreliable; legally risky without licensed valuer |
| Land banking databases | Contradicts platform principles |
