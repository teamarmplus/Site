# SiteVerdict National Data Roadmap

*Last updated: 2026-05-27 based on live API probes*

---

## Current coverage by state

| State | Status | Fields available | Fields missing | Next action |
|---|---|---|---|---|
| NSW | ✅ Deep | Zone, overlays, heritage, flood, bushfire, FSR, height, MLS, SEPP | DA live | None — fully connected |
| TAS | ✅ Live API | Zone (TPS), LPS ref, LGA | Overlays (licence pending) | 50m buffer fix deployed (pkg 88) |
| QLD | 🔶 Partial | LGA, locality, lot/plan (live API) | Zone, overlays, flood, heritage | Council-by-council zone integration |
| ACT | 🔶 Partial | Address context (geocode) | Zone, overlays, heritage, flood | Research ACTmapi zone layer IDs |
| VIC | 🔶 Download received | Zone, overlays (GDB) | PostGIS not yet loaded | Set SITEVERDICT_POSTGIS_URL env var |
| SA | 🔴 Blocked | — | All | Founder must register SA Spatial Hub |
| WA | 🔴 Blocked | — | All | Founder must register WA SLIP |
| NT | 🔴 Research | — | All | No public point-query API confirmed |

---

## Integration queue

### Priority 1 — VIC (Vicmap Planning GDB already received)

**Blocker:** PostGIS not yet set up.  
**Effort:** Medium — import script + Netlify function.  
**Unlocks:** Full zone + overlay data for all Victorian addresses.

Steps:
1. Set `SITEVERDICT_POSTGIS_URL` in Netlify env vars (founder registers DB — see FOUNDER_ACTIONS.md)
2. Run `scripts/import-vicmap-planning.sh` to load GDB into PostGIS
3. `vic.js` activates automatically when env var is set

### Priority 2 — TAS (already live — buffer fix)

**Blocker:** None remaining.  
**Status:** 50m buffer fix deployed in package 88. Zone and LGA live.  
**Known gap:** TPS Code Overlay (layer 14) — licence confirmation pending with Land Tasmania.

### Priority 3 — QLD (live cadastre API now connected)

**What's live now (package 88):**
- LGA name from QSpatial LPPF
- Locality from address layer
- Lot/plan from parcel layer
- Uses 200m buffer for reliable intersect

**Still missing:** Planning zones (77 individual council APIs — no state-wide layer).  
**Options:**
- a) Integrate Brisbane City Council zone API as first council (high population)
- b) Research if QLD DNRME has a state-collated layer
- c) Manual GDB import from each council scheme

### Priority 4 — ACT

**Live service found:** `services1.arcgis.com/E5n4f1VY84i0xSjy` (ACT ArcGIS Online).  
**Gap:** Zone layer IDs not yet identified. `data.actmapi.act.gov.au` fails from this environment.  
**Next action:** Browse ACT ArcGIS Online catalog to find the planning zone layer.

### Priority 5 — SA

**Blocker:** SA Spatial Hub API key (free registration at sailis.lssa.com.au).  
**After registration:** SA P&D Code zones + overlays available via ArcGIS REST.

### Priority 6 — WA

**Blocker:** Landgate SLIP account (free at slip.landgate.wa.gov.au).  
**After registration:** Cadastre + planning zones via SLIP API.

### Priority 7 — NT

**Status:** No confirmed public point-query API. Web portal only.  
**Next action:** Check `opendata.nt.gov.au` and `dlpe.nt.gov.au` for any ArcGIS services.

---

## Live API sources confirmed by probe (2026-05-27)

| Endpoint | HTTP | Format | Notes |
|---|---|---|---|
| NSW mapprod3 EPI Primary Planning Layers | 200 ✓ | ArcGIS JSON | 12 layers, no key |
| NSW SIX Maps Cadastre | 200 ✓ | ArcGIS JSON | No key |
| TAS theLIST PlanningOnline | 200 ✓ | ArcGIS JSON | CC BY 3.0 AU, no key |
| TAS theLIST CadastreAndAdministrative | 200 ✓ | ArcGIS JSON | Same service |
| QLD QSpatial LPPF | 200 ✓ | ArcGIS JSON | No key, 200m buffer needed |
| QLD QSpatial StatePlanning | 200 ✓ | ArcGIS JSON | No key |
| SA DPTI GeoHub | 200 ✓ | ArcGIS JSON | Transport only — not planning zones |
| WA DataWA catalogue | 200 ✓ | CKAN JSON | Download only, no point query |
| VIC DataVic WFS | 200 ✓ | WFS XML | Admin/address only — no planning zones |

---

## Data quality notes

**QLD planning zones:** Queensland has 77 separate local planning schemes. There is no single state-wide planning zone API (confirmed 2026-05-27). Each council maintains its own scheme. Options:
1. Start with Brisbane City Council (highest population impact)
2. QGIS/GeoServer approach: aggregate council shapefiles
3. Wait for a future QLD state collation

**VIC planning data:** Vicmap Planning GDB received via DataVic (CC BY 4.0). DataVic WFS only serves administrative boundaries — the planning zones are download-only. PostGIS import is the only path for live queries.

**ACT:** Small jurisdiction but good coverage possible once zone layer is identified in ACT ArcGIS Online.

---

*See `data/state-source-registry.json` for full technical details.*
*See `FOUNDER_ACTIONS.md` for steps requiring founder login/registration.*
