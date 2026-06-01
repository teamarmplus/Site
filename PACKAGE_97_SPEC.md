# Package 97 — Build Spec (Site Check, NSW first)

Status: SPEC ONLY. No code until founder approves.
Goal: Make Site Check feel like a simple map app (Landchecker-level for NSW),
not a marketing page. NSW only. No scoring/backend/result-wording changes.
Baseline: Package 96 (sv-check.js hash 162b3225), now live.

---

## 1. Files to touch (and ONLY these)

- `public/index.html` — presentation: base map container, search placement, fewer words, optional fields moved below.
- `public/assets/sv-check.js` — MAP-DISPLAY LAYER ONLY:
  - safe early init of the base map,
  - reuse (not recreate) the map on check,
  - optional NSW fact strip near the map (reads fields already fetched).
  NOT touched in this file: `runCheck` scoring path, `calc*`, result/`buildVerdictSection` content, `_showNonNSWResult` wording, fake-address gate, geocode/national-site-check calls.
- `public/version.json` + build marker — version bump to package 97.
- `scripts/predeploy.js` + `tests/sitecheck.e2e.spec.js` — ADD guards/tests only (no loosening).

No other files. No new pages. No nav change. No TAS/VIC/WA.

---

## 2. Existing NSW data fields already available (no new sources)

From `_fetchParcelOutline` (NSW SIX Maps, CC BY 4.0, no key), outFields already requested:
- `lotidstring`  → Lot (e.g. "12")
- `planlabel`    → Plan (e.g. "DP1043277")
- `areatotalm2`  → Land size (m²) — authoritative parcel area
- `lganame`      → LGA / council
- polygon `rings` → boundary geometry (already drawn) → dimensions derivable

From geocode/check already in memory at render time:
- matched address, council/LGA, planning zone + zoneName, min lot size (mls),
  user-entered block/frontage (optional inputs).

=> The fact strip can show: Land size (areatotalm2), Lot/Plan (lotidstring/planlabel),
LGA (lganame), Planning zone (zoneName from existing check). Frontage ONLY if the
user entered it OR derivable from the boundary (see §6) — never invented.

IMPORTANT: areatotalm2 is the parcel area from SIX. Display as "~NNN m²" with the
disclaimer. Do NOT relabel or feed it into scoring.

---

## 3. How to initialise the empty base map safely

Problem (verified in code): `_renderMap` does `mapCard.innerHTML = ...` then
`L.map('sv-map', ...)` on every call. Leaflet throws "Map container is already
initialized" if `L.map` runs twice on the same element. So a base map cannot
naively share `#sv-map` with the post-check map.

Safe approach — single map instance, reused:
1. On page load (DOMContentLoaded, after Leaflet loads):
   - Ensure the `#map-card` + `#sv-map` markup exists up front in index.html
     (move the static map shell out of `_renderMap`’s innerHTML into index.html),
     OR have a tiny `_initBaseMap()` that builds the shell once and creates the map once.
   - Create ONE Leaflet map: `window._svMap = L.map('sv-map', {center:[-33.87,151.0], zoom:5...})`
     centred on NSW/Australia, with a soft overlay label "Enter your address to see your land."
   - Add the OSM tile layer once.
2. Refactor `_renderMap(lat,lon,state,addr)` to REUSE `window._svMap`:
   - If `window._svMap` exists: `setView([lat,lon],17)`, clear previous pin/parcel
     layers (keep tile layer), drop new pin, then call `_fetchParcelOutline`.
   - If it does not exist (fallback / Leaflet failed): keep today’s create-on-demand
     path EXACTLY as now (guarantees no regression if base map didn’t init).
   - Remove the per-call `L.map('sv-map')` creation when reusing.
3. Keep a layer group for pin+parcel so each check clears only those, not the base map.

This is the ONLY structural change and it is confined to map display.

---

## 4. How to avoid breaking current post-check map rendering

- Keep `_renderMap`’s signature and all callers unchanged (`runCheck` still calls it the same way).
- Keep `_fetchParcelOutline` (NSW) and `_fetchParcelOutlineQLD` UNCHANGED — they receive `map` and draw onto it exactly as now; they don’t care if the map was pre-created.
- Reuse-or-create guard: if `window._svMap` missing → fall back to today’s exact create path. So worst case = current behaviour.
- Preserve `mapCard.style.display` handling: base map visible from load; no "show on check" needed, but keep the property so fallback path still works.
- Map note (`#sv-map-note`) stays the element the parcel functions write into — keep the id.
- Disclaimer + © OpenStreetMap remain.

Result content path (`#result`, buildVerdictSection, CTA) is NOT touched — map sits above it as today.

---

## 5. Fact strip WITHOUT changing scoring/result wording

- New presentation element, e.g. `#sv-fact-strip`, placed inside the map card (under the map, above `#result`).
- Populated ONLY inside the NSW parcel callback from fields already fetched
  (lotidstring, planlabel, areatotalm2, lganame) + zoneName already in scope.
- It is a DISPLAY MIRROR of data the check already has — it does NOT compute,
  score, or alter anything. No new network calls.
- Labels (plain English): "Land size", "Lot/Plan", "Council (LGA)", "Planning zone",
  "Frontage" (only if user-entered or §6-derived; else omit, never guess).
- If a field is missing → omit that chip (do not show blank/À). Never fabricate.
- Wording/scoring in `#result` stays byte-identical (guarded by existing tests).

---

## 6. Dimension-label approach and risk

- Geometry already present (polygon rings); approx side lengths computable
  (shoelace/edge calc, proven earlier).
- Phase 1 (this package): OPTIONAL, low-key — show overall "~NNN m²" (from
  areatotalm2, authoritative) in the fact strip. Do NOT draw per-edge labels yet.
- Phase 2 (later, separate approval): draw approximate edge-length labels on the
  boundary (e.g. "~32 m"). RISK: edge lengths from cadastre are approximate and can
  mislead if shown like survey measurements. Must be clearly "~" prefixed and carry
  the disclaimer. Recommend deferring to its own package.
- Frontage: only show if (a) user entered it, or (b) derived from the street-facing
  edge AND clearly marked approximate. Phase 2. Default: omit.

Decision for Package 97: ship area + fact strip; NO per-edge labels yet.

---

## 7. Disclaimer placement

Single consistent line, shown wherever parcel/area/dimensions appear:
"Approximate boundary and dimensions only — not a survey. Confirm by title plan or licensed surveyor."
- In the map note (as now) and/or directly under the fact strip.
- Base-map empty state shows neutral "Enter your address to see your land." (no claims).

---

## 8. Test plan

Add to tests/sitecheck.e2e.spec.js (NSW-focused), keep all existing tests:
- T-A Base map present on load: `#sv-map` exists and a Leaflet tile layer is present BEFORE any search.
- T-B Empty state copy: overlay shows "Enter your address to see your land" pre-search.
- T-C NSW check still renders result: existing tests 3/4 must still pass (report card within 25s).
- T-D Map reused, not duplicated: after a check, exactly ONE `.leaflet-container`; no console error "already initialized".
- T-E Parcel still draws: NSW polygon present after check (≥1 leaflet-interactive path).
- T-F Fact strip shows known fields only: land size + lot/plan + LGA present for NSW test address; no blank chips.
- T-G Result wording + CTA byte-identical: capture #result HTML, compare to Package 96 baseline = identical; CTA count = 1.
- T-H Fake address still rejected cleanly (existing test).
- T-I Disclaimer present wherever area shown.
predeploy.js: add static guards — base map init present; `_renderMap` reuse guard present; no scoring/result functions modified (hash-style markers); no TAS/VIC/WA strings.

Full gate must show: 100/100 static, all browser passed, fake-address gate intact.

---

## 9. Rollback plan

- Package 97 is additive/refactor in 2 files; Package 96 zip is the known-good lock.
- If any gate fails or live issue appears: redeploy Package 96 (siteverdict-package-96-DEPLOY.zip) — unchanged, still valid.
- The reuse-or-create guard (§3.2) means even a partial base-map failure falls back to current behaviour rather than losing the map.
- Keep version markers distinct (97 vs 96) so /version.json instantly shows which is live.

---

## 10. Out of scope (must NOT change)
Scoring, calc*, backend/API (geocode, national-site-check, providers), result wording,
buildVerdictSection content, CTA, fake-address gate, _showNonNSWResult wording,
TAS/VIC/WA, paid Geoscape, nav/other pages. No exact-dimension claims.

---

## Smallest safe build order (when approved)
1. Move map shell to index.html + `_initBaseMap()` once on load (base map appears).  TEST.
2. Refactor `_renderMap` to reuse `window._svMap` with create fallback.  TEST (NSW result unchanged).
3. Fewer words above the action + optional fields below button (index.html).  TEST.
4. Add NSW fact strip (display mirror of fetched fields).  TEST (result byte-identical).
5. Full gate + screenshots (desktop + mobile) + version bump to 97.
(Per-edge dimension labels deferred to a later package.)
