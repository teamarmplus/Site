# Free Site Check — Product Design and Data Roadmap

*Prepared: 2026-05-27. No code changes. Design document only.*

---

## 1. Free Site Check — Target Feature List

### The user flow

```
Address input
    ↓
Geocode + state detection
    ↓
Site Check (free, no login)
    ↓
Site Signal card
    ↓
CTA: "Get Land Value Pathway Review"
```

### What the Free Site Check shows (target state)

Every address in Australia ends in exactly one of these results. No empty states.

| Field | NSW | QLD (now) | TAS/ACT | VIC (post-PostGIS) | SA/WA/NT |
|---|---|---|---|---|---|
| Address confirmed | ✓ | ✓ | ✓ | ✓ | ✓ |
| State + LGA/council | ✓ | ✓ LGA live | ✓ LGA live | ✓ | geocode only |
| Lot/plan reference | ✓ SIX Maps | ✓ QSpatial | ✓ theLIST | ✓ Vicmap | — |
| Land area (approx) | ✓ SIX Maps | ✓ QSpatial | ✓ theLIST | ✓ Vicmap | — |
| Zone / land use | ✓ deep | ✗ pending councils | ✓ TPS zone | ✓ Vicmap | — |
| Min lot size | ✓ NSW EPI | — | — | partial | — |
| Heritage | ✓ NSW EPI | — | — | partial | — |
| Flood indicator | ✓ NSW EPI | — | — | partial | — |
| Bushfire / BAL | ✓ NSW RFS | — | — | — | — |
| Map + parcel pin | target | target | target | target | target |
| Site Signal | ✓ NSW | stub | stub | stub | stub |
| Missing data list | ✓ | ✓ | ✓ | ✓ | ✓ |
| Prof. verification | ✓ always | ✓ always | ✓ always | ✓ always | ✓ always |
| CTA: Pathway Review | ✓ | ✓ | ✓ | ✓ | ✓ |

### Exact card order in result (target)

1. **Address confirmed** — matched address, geocode confidence, state
2. **LGA / Council** — source, confidence (geocode indicator vs verified cadastre)
3. **Land reference** — lot/plan, land area (m²), source + confidence
4. **Zone** — zone code, zone name, planning scheme, source, date
5. **Overlays / hazards** — heritage, flood, bushfire, acid sulfate (where available, labelled by state)
6. **Development controls** — min lot size, FSR, height (NSW only today; others as connected)
7. **Site Signal** — plain-language summary of signals found (see below)
8. **Missing data checklist** — what was not found, why, what to do about it
9. **Map preview** — parcel pin on Leaflet/OSM (no premium tile cost)
10. **Professional verification warning** — always shown, cannot be removed
11. **CTA: "Get Land Value Pathway Review"** — single prominent action

### What Free Site Check must never claim

- Exact land value or market value estimate
- Formal valuation
- Guaranteed subdivision, DA approval, or development potential
- Guaranteed or implied investment return
- "Strong buy", "good investment", or similar
- Flood/bushfire/slope severity without actual connected data
- Zone allows X without checking zone table

---

## 2. Site Signal — Design

The Site Signal is a plain-language interpretation card. It replaces the current "Executive Verdict" language.

### Signal structure

```
Site Signal
─────────────────────────────────────────────
What we found:
  ✓ Zone: confirmed [zone code] — [zone description]
  ✓ LGA: [council name]
  ✓ Land area: approximately [Xm²] (source: [])
  ⚠ Minimum lot size: [X]m² — parcel is [at/above/below] threshold
  ⚠ Heritage: indicator present — verify scope
  — Flood: not detected (NSW EPI at time of check)
  — Bushfire: not detected (RFS at time of check)

What this may mean:
  [plain language — 2-3 sentences, no overclaiming]

What is missing:
  □ Slope / drainage assessment — not in automated check
  □ Contamination / acid sulfate — indicator checked, no detail
  □ Title encumbrances — requires title search
  □ Easements / covenants — not checked
  □ [State-specific gaps]

Professional verification required.
This is not a planning certificate.
─────────────────────────────────────────────
```

### Signal tone rules

- State what was found, from which source, with what confidence
- State what is missing and why it matters
- Never say "approved", "allowed", "suitable for development"
- Say "indicator present — verify scope" not "flagged as heritage"
- Say "zone may allow medium density residential — confirm with council" not "zoned R3"
- For non-NSW with limited data: "Planning data not yet connected for [state]. Contact [council] or a licensed planner for zone and overlay information."

---

## 3. Land Value Pathway Review — CTA Design

### What it is

Not a valuation. Not a report. A structured Q&A that helps the person understand:

1. What may be possible with this land
2. What may affect or reduce value (risks/costs/constraints)
3. What professional or service step is needed next

### What it produces (AI-assisted, professional verification required)

```
Land Value Pathway Review
─────────────────────────────────────────────
Address: [address]
Generated: [date]
Not a valuation. Not a planning certificate. AI-assisted context only.
─────────────────────────────────────────────

WHAT MAY BE POSSIBLE
Based on [zone code] in [council], this site may allow:
- [residential use types from zone table]
- [subdivision potential at current zone MLS]
Note: Actual feasibility depends on site-specific assessment.

WHAT MAY AFFECT OR REDUCE VALUE
Signals found during free check:
- [heritage indicator: scope unknown — requires council confirmation]
- [flood indicator: category not assessed — requires flood study]
- [civil: road frontage [X]m — may affect subdivision yield]
Signals not checked (require professional assessment):
- Contamination / ASS
- Slope and drainage
- Title encumbrances and easements
- Neighbouring development

WHAT PROFESSIONAL STEP IS LIKELY NEEDED NEXT
Given what was found, the most useful next step may be:
[one of: planning consultant, surveyor, civil engineer, solicitor]
[why: specific signal or data gap found]

RELEVANT SERVICES
[Arm Plus Group and/or subcontractor for civil works / planning support]

─────────────────────────────────────────────
Professional verification required.
Not advice. Not a valuation. Not a planning certificate.
```

---

## 4. Independent Data/API Roadmap by Priority

### TIER 1 — Use now (no account / free / confirmed live)

| Source | State | Fields | Status | Action |
|---|---|---|---|---|
| NSW Planning Portal (mapprod3) | NSW | Zone, overlays x12, MLS, heritage, flood, bushfire | ✓ Live | Already integrated |
| NSW SIX Maps Cadastre (Layer 9) | NSW | Lot/plan, approx area, LGA | ✓ Live (needs buffer fix) | Fix buffer, add area field |
| TAS theLIST PlanningOnline L13 | TAS | TPS zone, LPS schedule | ✓ Live | Already integrated |
| TAS theLIST CadastreAndAdmin L4 | TAS | LGA name | ✓ Live | Already integrated |
| QLD QSpatial LPPF L0+1 | QLD | LGA, locality, lot/plan, area | ✓ Live | Already integrated |
| ACT ACTGOV_TP_LAND_USE_ZONE L1 | ACT | Territory Plan zone code | ✓ Live | Already integrated |
| ACT ACTGOV_FLOOD_EXTENT | ACT | Flood extent indicator | ✓ Live (not yet integrated) | Add to act.js |
| Nominatim/OSM geocode | All | Lat/lon, suburb, state (fallback) | ✓ Free | Add as geocode fallback |
| Overpass API | All | Nearby hospitals, schools, train stations | ✓ Live (already used) | Already integrated |

### TIER 2 — Use after account/registration (no cost / government)

| Source | State | Fields | Blocker | Founder action |
|---|---|---|---|---|
| SA Spatial Hub (PlanSA) | SA | Zone, policy area, overlays | Free account needed | Register at sailis.lssa.com.au |
| WA SLIP (Landgate) | WA | Cadastre, zone, LGA, parcel | Free account needed | Register at slip.landgate.wa.gov.au |
| NSW DCCEEW Flood folder | NSW | Flood study areas (adds to existing) | Confirm endpoint — folder found | Probe /arcgis/rest/services/Flood |
| NSW Valuer General (web) | NSW | Land value notices (reference only) | Scraping not appropriate | Research API or data download |
| VIC Vicmap Planning (GDB) | VIC | Zone, overlays full | PostGIS DB needed | Set SITEVERDICT_POSTGIS_URL |

### TIER 3 — Research needed (licence / technical / uncertain)

| Source | State | Fields | Risk | Next action |
|---|---|---|---|---|
| G-NAF / PSMA Address | All | Address geocode (free, official) | PSMA API requires account | Research data.gov.au G-NAF download vs PSMA API |
| NSW ePlanning DA API | NSW | DA lodgements, completions | API endpoint unclear | Test api.apps1.nsw.gov.au with correct params |
| NSW Valuer General LV | NSW | Unimproved land values | Terms unclear for derived display | Review terms at valuergeneral.nsw.gov.au |
| QLD council zone APIs | QLD | Planning zone by council | 77 councils — start with Brisbane | Research BCC planning REST |
| NT geospatial | NT | Any | No confirmed public API | Probe opendata.nt.gov.au |
| VIC SPEAR (DA context) | VIC | DA applications | Complex auth | Research after VIC PostGIS |

### TIER 4 — Professional review only (do not automate)

| Data type | Why professional only |
|---|---|
| Contamination / acid sulfate extent | Requires qualified environmental consultant |
| Slope / drainage assessment | Requires civil surveyor |
| Title encumbrances, easements, covenants | Requires licensed conveyancer / solicitor |
| Formal valuation | Requires registered valuer |
| Flood study category | Requires flood consultant |
| Subdivision feasibility | Requires surveyor + planner + engineer |
| DA pre-lodgement advice | Requires planner + council contact |

---

## 5. Map / Parcel Preview — Best Approach

### Recommended: Leaflet + OpenStreetMap base + ArcGIS parcel geometry

| Layer | Source | Cost | Notes |
|---|---|---|---|
| Base map | OpenStreetMap (Leaflet) | Free | Attribution required: © OpenStreetMap contributors |
| Parcel boundary | NSW SIX Maps (NSW) / theLIST (TAS) / QSpatial (QLD) etc | Free (govt) | Return geometry=true in ArcGIS query |
| Parcel pin | Geocode lat/lon | Free | Already have this |

**Why not Mapbox:** requires API key, monthly cost above free tier, overkill for a property pin.  
**Why not Google Maps API:** cost, ToS complexity, dependency on commercial provider.  
**Why not state aerial tiles:** licence complexity varies; base OSM is sufficient for a property pin with parcel outline.

### Implementation target

```javascript
// Leaflet map — parcel outline from state provider
const map = L.map('map-preview', { zoomControl: false });
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors',
  maxZoom: 19
}).addTo(map);

// Parcel geometry from ArcGIS (returnGeometry=true)
if (parcelGeom) {
  const poly = L.geoJSON(parcelGeom, { style: { color: '#4caf50', weight: 2 } }).addTo(map);
  map.fitBounds(poly.getBounds(), { padding: [20,20] });
} else {
  // Fallback: pin only
  L.marker([lat, lon]).addTo(map);
  map.setView([lat, lon], 17);
}
```

**CSS size target:** 300×200px card within result, loads after result card.  
**Performance rule:** map loads async, never blocks Site Check result render.

---

## 6. Data Safety: What Is Safe to Show Publicly

### Safe to display publicly (free result)

- Address match + confidence level
- State, LGA, suburb (from geocode or official cadastre)
- Lot/plan reference (from official cadastre, with source attribution)
- Approximate land area in m² (from official cadastre, labelled as indicative)
- Zone code + name (from official planning portal, with source + date)
- Min lot size (from official EPI, labelled as at time of check)
- Planning overlay indicators (heritage, flood, bushfire — presence/absence only, not detailed maps)
- Missing data checklist
- Site Signal plain-language interpretation
- Professional verification warning

### Show only in gated report (registration required)

- DA/permit context (nearby DAs in last 12 months)
- FSR and height controls
- Civil infrastructure cost indicators
- Comparable sales context (if/when connected)
- Land value pathway review with AI-assisted interpretation

### Never show publicly (professional review only)

- Formal valuations
- Detailed flood mapping (beyond indicator)
- Contamination or acid sulfate extent
- Title encumbrances / easements
- Subdivision feasibility assessment

---

## 7. Competitor Benchmark — Without Dependency

*Studied only to understand what users expect. No integration, no scraping, no API use.*

| Feature | What free tools generally offer | SiteVerdict differentiation |
|---|---|---|
| Zone | Yes (basic) | Deeper: source, date, MLS, overlays |
| Overlays | Some | More honest: states which are connected vs missing |
| Map | Yes | Parcel outline, not just a pin |
| "What can I build" | Rare | Site Signal + pathway language |
| Missing data | Rarely explicit | Always explicit — builds trust |
| Professional pathway | CTA only | Specific next step based on what was found |
| Non-NSW | Often NSW-only | National — honest about gaps |

**Key insight from benchmark study:** most free tools show data without explaining what it means or what is missing. SiteVerdict's moat is honesty + interpretation + clear next step — not raw data volume.

---

## 8. Recommended First 5 Implementation Tasks

In priority order, based on what's unblocked right now:

### Task 1 — NSW SIX Maps lot area and lot number (no account needed)

**What:** Add area (m²) and lot/plan fields from SIX Maps Layer 9 to NSW result  
**Why:** Currently the NSW result has no land area. This is the single most useful addition.  
**How:** Layer 9 query with `returnGeometry=true` for parcel outline + `outFields=areatotalm2,planlabel,lotidstring,lganame`  
**Files:** `public/netlify/functions/lib/providers/nsw.js` (or sv-check.js NSW block), `public/assets/sv-check.js` (display)  
**Test:** NSW address returns land area in m² and lot/plan reference

### Task 2 — Leaflet map preview (parcel pin + outline)

**What:** Add a small map card to Site Check result showing parcel pin and outline  
**Why:** Every competitor shows a map. The absence is noticed.  
**How:** Leaflet + OSM tiles (free) + parcel geometry from existing ArcGIS queries (returnGeometry=true). Load async after result renders.  
**Files:** `public/index.html` (Leaflet CSS/JS via CDN), `public/assets/sv-check.js` (map render)  
**Test:** NSW + TAS + QLD addresses show a map. Map never blocks result render.

### Task 3 — Site Signal card (replaces Executive Verdict)

**What:** Replace or rewrite the current result verdict section with clearer Signal language  
**Why:** Current wording is too opaque. Signal = what was found + what may be missing + what to do next.  
**How:** Rewrite the verdict HTML builder in sv-check.js with the Signal structure above  
**Files:** `public/assets/sv-check.js` (result renderer)  
**Test:** Signal shows fields found, fields missing, and a plain-language interpretation

### Task 4 — Missing data checklist (explicit)

**What:** Always show a checklist of what was not checked and why  
**Why:** Honesty builds trust. Users who understand gaps are more likely to seek professional help (= conversion).  
**How:** Static list based on state + connected fields. If flood = not_detected, show "Flood: not detected (NSW EPI, [date]) — does not confirm no flood risk."  
**Files:** `public/assets/sv-check.js`  
**Test:** Every result includes a missing-data section

### Task 5 — CTA redesign: single "Get Land Value Pathway Review" button

**What:** Replace the current dual CTA (Full Report gate / Register) with one clear action  
**Why:** Current gate is confusing. Single CTA reduces friction, increases pathway conversion.  
**How:** Change the result CTA button text + link target in sv-check.js  
**Files:** `public/assets/sv-check.js`, `public/full-report/index.html` (receive the user)  
**Test:** Click lands on a page that explains the Land Value Pathway Review, captures name + email

---

## 9. Files Likely to Change

| File | Change needed | Risk |
|---|---|---|
| `public/assets/sv-check.js` | Add lot area, map preview, Site Signal, missing data checklist, CTA | HIGH — main render file |
| `public/netlify/functions/lib/providers/nsw.js` | Add SIX Maps lot area query | LOW — additive |
| `public/index.html` | Add Leaflet CSS/JS CDN, map div | LOW — additive |
| `public/full-report/index.html` | Receive "Get Land Value Pathway Review" CTA | MEDIUM |
| `public/netlify/functions/sitecheck-test.js` | Add lot area test assertion | LOW |
| `tests/sitecheck.e2e.spec.js` | Add map renders + area field assertions | LOW |
| `data/state-source-registry.json` | Add SIX Maps lot area, ACT flood | LOW |

---

## 10. Tests Needed Before Each Release

| Test | What it proves |
|---|---|
| NSW address returns lot area in m² | SIX Maps layer 9 working |
| NSW address has parcel map rendered | Leaflet + geometry working |
| QLD address returns LGA | QSpatial LPPF live |
| TAS address returns zone code | theLIST Layer 13 + 50m buffer |
| ACT address returns zone code | ACTGOV_TP_LAND_USE_ZONE |
| Any address shows missing data checklist | Signal structure present |
| No NSW overlay text for non-NSW | State gate working (existing) |
| Site Check never hangs | 20s timeout + ftx() guards (existing) |
| CTA button present in result | Single pathway CTA visible |
| Map loads without blocking result | Async load verified |

---

## 11. Risk Checklist

### Legal / licensing

- [ ] OSM attribution: must show "© OpenStreetMap contributors" on map tile
- [ ] NSW Planning Portal (CC BY 4.0): attribution required in each result
- [ ] NSW SIX Maps (CC BY 4.0): attribution required, same source
- [ ] TAS theLIST (CC BY 3.0 AU): attribution required — "Tasmanian Planning Scheme from theLIST © State of Tasmania"
- [ ] QLD QSpatial (CC BY 4.0): attribution required — "© State of Queensland"
- [ ] ACT ACTGOV: CC BY 4.0 assumed — verify with data.act.gov.au before displaying in result

### Data accuracy

- [ ] Land area from ArcGIS is "cadastral area" — may differ from title area for rural lots
- [ ] Zone check is at time of API query — not a certified planning certificate
- [ ] Flood/heritage indicators are presence/absence only — not assessed level of impact
- [ ] Geocode confidence affects accuracy of all derived data — show geocode confidence always

### Overclaiming

- [ ] Never say "zone allows X" — say "zone code is Y — verify with council what is permitted"
- [ ] Never say "no heritage" — say "not detected in NSW EPI at time of check"
- [ ] Never say "suitable for development" — say "zone may allow medium density — professional assessment required"
- [ ] Land Value Pathway Review must not imply or suggest a financial return
- [ ] Map parcel outline is indicative — not a survey

### Cost / sustainability

- [ ] Nominatim rate limit: 1 req/second max — need rate limiter if volume increases
- [ ] Overpass-api.de: public instance — 8s timeout guard already in place
- [ ] All ArcGIS government endpoints: no documented rate limits — monitor for 429 responses
- [ ] OSM tile server: no key needed at low volume — consider tile caching if traffic grows

---

## 12. Founder Action List

### Required for current integration to work in production

| # | Service | URL | Action | Env var | Unlocks |
|---|---|---|---|---|---|
| 1 | SA Spatial Hub | https://sailis.lssa.com.au | Register free business account | `SA_SPATIAL_HUB_KEY` | SA P&D Code zones |
| 2 | WA SLIP (Landgate) | https://slip.landgate.wa.gov.au | Register free account | `WA_SLIP_API_KEY` | WA cadastre + zone |
| 3 | PostGIS DB | Supabase / Neon (free tier) | Create DB, run VIC import | `SITEVERDICT_POSTGIS_URL` | VIC Vicmap zones |

### Research before next integration

| # | Action | Why |
|---|---|---|
| 4 | Review NSW ePlanning API terms at api.apps1.nsw.gov.au/docs | DA context would significantly upgrade NSW result |
| 5 | Review NSW Valuer General terms at valuergeneral.nsw.gov.au | Land value reference (not display as valuation) |
| 6 | Confirm ACT CC BY 4.0 licence for ACTGOV datasets at data.act.gov.au | Required before zone data appears in result |
| 7 | Contact Land Tasmania re: overlay layer licence | TPS Code Overlay licence not confirmed — needed for TAS overlays |
| 8 | Research BCC (Brisbane City Council) planning REST API | First QLD council zone connection |

### No action needed — already confirmed

- NSW Planning Portal (mapprod3): CC BY 4.0, no key, live ✓
- NSW SIX Maps: CC BY 4.0, no key, live ✓
- TAS theLIST: CC BY 3.0 AU, no key, live ✓
- QLD QSpatial: CC BY 4.0, no key, live ✓
- Nominatim/OSM: ODbL, no key, free ✓
- Leaflet: BSD licence, free ✓
- OpenStreetMap tiles: ODbL, free (with attribution) ✓

---

*This is a planning document only. No production code has been changed.*  
*Next steps: founder reviews, approves scope, then AI implements Task 1 first.*
