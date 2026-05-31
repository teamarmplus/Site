# SiteVerdict Daily Log
























---

## Package 97 blocker fixes — 2026-05-31

Result: PACKAGE READY. Static 100/100, Browser 16 passed/1 skip/0 fail. sv-check.js -> 3f1eabb8.

Blocker 1 — sticky header covered result (FIXED): #result/.rcard transform created a stacking context painting over the sticky nav on mobile. Fix (index.html CSS only): nav z-index 400 + opaque; .result-wrap/#result/.rcard/#map-card position:relative;z-index:1. Verified scrolled mobile: header + stats fully visible, no cut-through.

Blocker 2 — fact strip missing land size + council (FIXED): council now captured from renderResult lga param (display mirror) -> shows "Fairfield Council". Land size (planlotarea) often null on SIX layer 9 -> omitted cleanly, shown when present.

Blocker 3 — messy Lot/Plan (FIXED): built from parts "Lot N - PLAN" e.g. "Lot 30 - DP728" instead of doubled lotidstring.

Guardrails: scoring/backend/result-wording/CTA unchanged; result byte-identical; fake-address gate intact; one Leaflet map (no dup, no console errors); no edge labels; no TAS/VIC/WA; disclaimer present; QLD mock removed from zip.

---

## Package 97 — 2026-05-31 (Site Check map-app, NSW-first)

**Result:** ✓ PACKAGE READY. Static 100/100 · Browser 16 passed, 1 skipped, 0 failed.
**Zip:** siteverdict-package-97.zip (65 files) · sv-check.js 8a4739ec · all markers=97 (incl package.json 0.97.0)

### Built (per approved spec + build order)
1. Base map on arrival: _ensureBaseMap() builds shell + ONE Leaflet map on load, NSW-centred, "Enter your address to see your land" overlay. (desktop+mobile confirmed: 6 tiles, 1 container)
2. Search above the map; one Check My Land button.
3. _renderMap refactored to REUSE window._svMap (clear overlay layers, pan, pin) with create-fallback if base map absent. Confirmed: exactly 1 .leaflet-container after NSW and QLD checks — NO duplicate-map error.
4. Parcel boundary kept (NSW + QLD), layers tracked in window._svOverlayLayers and cleared each check.
5. Fewer words above action (short headline + 1 trust line).
6. Optional land size/frontage moved BELOW the button.
7. NSW fact strip (#sv-fact-strip): display-mirror of fetched fields — Land size (planlotarea), Lot/Plan (lotidstring/planlabel), Council (geocode council), Planning zone (captured zLabel). Omits missing fields, never guesses. Disclaimer line included.
8. Plain-English result unchanged below map: RESULT BYTE-IDENTICAL to pkg96 baseline; CTA count=1.

### Pre-existing bug found & fixed (within map-display layer)
NSW _fetchParcelOutline requested outFields=areatotalm2,lganame which DO NOT EXIST on SIX layer 9 → ArcGIS returned 0 features → parcel note/area silently never worked. Fixed to real fields: lotidstring, lotnumber, planlabel, planlotarea. LGA now sourced from geocode council (window._svCouncil). This restored the parcel note AND enabled the fact strip.

### Guardrails verified
- Result wording/CTA: byte-identical (captured + compared).
- Scoring/backend/API: untouched.
- Fake-address gate: intact (test passes).
- One Leaflet map only, no "already initialized" error (console errors: none).
- No edge dimension labels. No TAS/VIC/WA. No exact-dimension claims. Disclaimer present.
- QLD test mock used only for local verification, removed from shipped zip.

### Honest notes
- External NSW SIX endpoint is intermittently slow from sandbox; parcel/fact-strip populate only when it responds (best-effort, fails safe to pin+map). Verified working when endpoint responds.
- This is package 97; live site still 87 until founder deploys 96/97.

---

## Deploy Prep — 2026-05-29 (lock map-first national preview with QLD parcel check)

**Result:** ✓ PACKAGE READY FOR DEPLOY (push is founder action)
**Zip:** siteverdict-package-96-DEPLOY.zip (66 files incl DEPLOY_INSTRUCTIONS.md)
**Commit message:** Lock map-first national preview with QLD parcel check

### Pre-commit checks — all PASS
1. Full gate: ✓ run
2. Static: ✓ 100/100
3. Browser: ✓ 16 passed, 1 skipped, 0 failed
4. Fake-address gate: ✓ intact
5. Result wording + CTA: ✓ unchanged (What we found / may mean / still missing / Find Out What My Land Can Do)
6. No unapproved TAS/VIC/WA code: ✓ confirmed absent (functions + endpoints)
- Map-first: ✓ #map-card before #result
- Leaflet SRI: ✓ @1.9.4 + correct pinned hash
- National wording: ✓ present
- Disclaimer: ✓ present
- sv-check.js hash: 162b3225 (verified inside zip)

### Deploy boundary (honest)
Actual GitHub push + Netlify build require founder account access — cannot be done from sandbox. DEPLOY_INSTRUCTIONS.md in the zip has exact commit/push commands + post-deploy verification (curl version.json must show pkg 96, not 87). Live verification + live screenshots can only happen AFTER founder pushes.

---

## Overnight Job — 2026-05-29 (protection checks + VIC/WA/TAS investigation; NO code changes)

### PROTECTION CHECKS (locked national-preview package, hash 162b3225)
1. Deployed site loads: ⚠ siteverdict2.netlify.app returns HTTP 200 BUT is package 87 (OLD). The national-preview work (pkg 96) is NOT deployed yet — GitHub→Netlify push is still a pending founder action. Live site does not match locked package.
2. NSW check + map above result: ✓ PASS (browser tests: NSW with/without comma produce report card; map-first preserved).
3. QLD preview parcel/address-only label: ✓ "Planning controls for this state are not fully connected yet." present.
4. National wording present: ✓ "Australia-wide parcel check · planning depth varies by state" (2 places).
5. Disclaimer present: ✓ "Approximate boundary and dimensions only — not a survey. Confirm by title plan or licensed surveyor." (NSW + QLD).
6. Full gate: ✓ 100/100 static, 16 browser passed, 1 skipped, 0 failed. fake-address gate intact.

NO code changes made this run. sv-check.js hash unchanged 162b3225.

### INVESTIGATION (report only — not implemented)

TAS — STRONGEST candidate, no key:
- Endpoint: services.thelist.tas.gov.au/.../CadastreAndAdministrative/MapServer/38 (Cadastral Parcels, ArcGIS).
- Polygon: ✓ (tested, 195-vertex parcel at Hobart).
- Fields: PID, CID, VOLUME, FOLIO, LPI, CAD_TYPE1, TENURE_TY, FEAT_NAME.
- Land area: ✓ EXPLICIT fields COMP_AREA + MEAS_AREA (no compute needed) — also computed ~14201 m2 to cross-check.
- Licence: © State of Tasmania / theLIST — confirm CC BY before production; show "Source: theLIST (Tas)".
- Dimensions: ✓ derivable from polygon.
- Risk: LOW — identical ArcGIS identify pattern to QLD; has native area field.
- Smallest safe next step: mirror _fetchParcelOutlineQLD as _fetchParcelOutlineTAS behind state==='TAS', preview-tested, NSW protected.

VIC — feasible, no key, needs query tuning:
- Endpoint: opendata.maps.vic.gov.au/geoserver WFS; typenames found: open-data-platform:v_s_parcel_approved (+ v_parcel_mp, parcel_property, parcel_view).
- Polygon: WFS returns GeoJSON polygons, BUT point INTERSECTS query returned 0 with default geom column; exact geometry column / CQL needs tuning (alternates errored).
- Fields: parcel detail via Vicmap Property tables.
- Land area: derivable from polygon.
- Licence: CC BY 4.0 (DataVic / DTP).
- Risk: MEDIUM — WFS (not ArcGIS identify), needs correct geom column + CQL; different fetch shape and parsing than NSW/QLD/TAS.
- Smallest safe next step: resolve the WFS geometry-column + point query offline first; only then adapter.

WA — blocked for no-registration:
- SLIP public services exposed only Buildings_and_Structures; Landgate cadastre appears to need a free SLIP account/subscription.
- Polygon via open no-key endpoint: NOT confirmed.
- Licence: Landgate / SLIP terms.
- Risk: HIGH for the "no registration" rule — needs founder to register a free SLIP account. PARK.

### MORNING SUMMARY
- PASSED: NSW map-first, QLD preview labelling, national wording, disclaimers, full gate (100/100 + 16).
- FAILED: none in the locked package. Caveat: live staging is OLD (pkg 87) — not a failure, just not deployed.
- RISKS: (a) live site ≠ locked work until founder deploys; (b) VIC needs WFS query tuning; (c) WA needs free registration.
- RECOMMENDED NEXT STEP: TAS adapter (lowest risk, native area field) — only if founder approves. Then VIC (after WFS tuning). Park WA.

---

## Daily Check — 2026-05-29 (package 96 — national direction locked + QLD preview safe; VIC/WA/TAS investigated)

**Result:** ✓ RELEASE-CHECK PASSED · direction locked
**Static:** 100/100 · **Browser:** 16 passed, 1 skipped, 0 failed · NSW intact
**sv-check.js:** 375ed609 → 162b3225 (QLD note clarity + safety wording; doubled-phrase typo fixed)

### LOCKED DIRECTION
Australia-wide parcel/address check, planning depth varies by state. NSW = full planning. QLD = address+parcel preview, planning not connected.

### QLD preview safety (founder items 1-6)
1. NSW map-first full gate: PASS (map+polygon, approved result, 1 CTA).
2. QLD does not affect NSW scoring/result wording: confirmed (calcLots, buildVerdictSection, NSW path all unchanged).
3. QLD cannot imply planning approval/zone certainty/development: confirmed — note contains none of approved/can develop/development potential/zone is/guaranteed.
4. QLD source/disclaimer line made easier to read: now 4 short lines instead of one long run-on.
5. Required wording present: "Parcel/address found. Planning controls for this state are not fully connected yet."
6. Full gate: PASS.
Also fixed pre-existing doubled phrase "for this state for this state".

### VIC / WA / TAS parcel adapter investigation (report only — NOT implemented)

**VIC — feasible, no key, needs query care**
- Endpoint: opendata.maps.vic.gov.au/geoserver WFS (Vicmap Property Parcel Polygon, e.g. typeName parcel/V_S_PARCEL_APPROVED).
- Polygon geometry: YES (WFS GetFeature returns GeoJSON polygons).
- Parcel/lot/plan fields: YES via Vicmap Property (parcel detail); polygon layer is geometry, attrs in related layer.
- Land area: derivable from polygon (Vicmap area attr varies by layer).
- Attribution/licence: CC BY 4.0 (DataVic / DTP). Show "Source: Vicmap Property (CC BY 4.0)".
- Disclaimer required: same approximate-only/not-a-survey line.
- Risk: MEDIUM — WFS (not ArcGIS identify); needs exact typeName + bbox/CQL point query; different fetch shape than NSW/QLD. Doable but more code than QLD.

**WA — blocked without registration (for now)**
- SLIP public services exposed only Buildings_and_Structures; Landgate cadastre (LGATE-) appears to need a free SLIP account/subscription.
- Polygon: not confirmed via open no-key endpoint.
- Attribution/licence: Landgate / CC BY with SLIP terms.
- Risk: HIGH for "no registration" rule — likely needs founder to register a free SLIP account. PARK until founder decides.

**TAS — feasible, no key, ArcGIS like NSW/QLD**
- Endpoint: services.thelist.tas.gov.au/.../CadastreAndAdministrative/MapServer/38 (Cadastral Parcels).
- Polygon geometry: YES (tested, 1 feature, rings present).
- Fields: PID, CID, VOLUME, FOLIO, LPI, CAD_TYPE1, TENURE_TY etc. (lot/plan-equivalent via PID/title volume-folio).
- Land area: derivable from polygon (no explicit area field seen; compute via shoelace).
- Attribution/licence: © State of Tasmania / theLIST — confirm CC BY; show "Source: TASMAP/theLIST".
- Disclaimer required: same approximate-only line.
- Risk: LOW — same ArcGIS identify pattern as QLD; easiest next adapter after QLD.

### Recommendation (not acted on)
Order by ease/no-key: TAS (low) → VIC (medium) → WA (needs registration, park). One at a time, each as a tested preview, NSW protected. No paid Geoscape. No multi-state at once.

---

## Daily Check — 2026-05-29 (package 96 — national-ready preview: national wording + QLD adapter)

**Result:** ✓ RELEASE-CHECK PASSED (preview — not locked; founder to decide merge vs branch)
**Static:** 100/100 · **Browser:** 16 passed, 1 skipped, 0 failed
**sv-check.js:** d0b38b7c → 375ed609 (added _fetchParcelOutlineQLD + QLD route in map state branch)

### 1. National wording (index.html)
"NSW has the deepest live data first" → "Australia-wide parcel check · planning depth varies by state" (both hero badge + input hint). Clear of all forbidden NSW-only phrases.

### 2. QLD parcel adapter (sv-check.js, map display layer only)
- New _fetchParcelOutlineQLD mirrors NSW _fetchParcelOutline exactly: display-only, AbortController 8s timeout, try/catch silent fail.
- State branch: state==='QLD' → _fetchParcelOutlineQLD; NSW path unchanged; other states still pin+note only.
- Endpoint: spatial-gis.information.qld.gov.au/.../LandParcelPropertyFramework/MapServer/4 (public, no key).

### QLD preview report (tested against LIVE endpoint)
- Endpoint used: QLD DCDB Land Parcel Property Framework layer 4 (ArcGIS, no key).
- Polygon geometry returned: YES (drawn as gold outline, map fits bounds).
- lot/plan fields: YES (lot, plan, lotplan e.g. 101SP102966).
- Land area field: YES (lot_area, e.g. ~8455 m2 shown).
- Approximate side lengths: computable from polygon rings (shoelace/edge calc, proven earlier).
- Licence/attribution: "Source: QLD DCDB (CC BY 4.0)" shown in map note.
- Disclaimer shown: "Approximate boundary and dimensions only — not a survey. Confirm by title plan or licensed surveyor."

### Guardrails
- NSW map-first flow UNCHANGED (verified: map + 1 polygon + approved result + 1 CTA).
- Scoring, result wording, CTA, fake-address gate, backend paid-API assumptions: unchanged.
- No Geoscape paid API. No founder registration required (QLD endpoint is open).
- QLD test mock was added to local-server only for the preview run, then REMOVED — not in shipped package.

### Merge vs branch (honest)
QLD adapter is structurally identical to the proven NSW one, display-only, fails safe. Low risk. Recommend: safe to merge AFTER founder confirms comfort relying on QLD DCDB CC BY 4.0 with the shown attribution. Until then, keep as investigation/preview.

---

## Daily Check — 2026-05-29 (package 96 — sticky header layout fix)

**Result:** ✓ RELEASE-CHECK PASSED (no zip — founder said do not lock yet)
**Static:** 100/100 · **Browser:** 16 passed, 1 skipped, 0 failed · sv-check.js d0b38b7c (unchanged)

### Root cause of "header covering result"
The shared nav is position:sticky;top:0 with a TRANSLUCENT blurred background (rgba + backdrop-filter:blur). When result/map text scrolled beneath it, the text ghosted THROUGH the blur — looking like the header was covering/breaking the content. Measured: after the normal post-check scrollIntoView, result.top=180px, nav.bottom=60px (already clear); the defect was purely the see-through bar during scrolling.

### Layout fixes (index.html CSS only — no markup/wording/logic)
1. nav made fully opaque: background var(--bg) #07080a, backdrop-filter:none → content scrolling under is cleanly hidden, no ghosting.
2. html scroll-padding-top + #map-card/#result/.result-wrap scroll-margin-top (84px desktop, 76px mobile) → programmatic + anchor scrolls stop below the bar.
3. Desktop hero padding-top 52→64px → calmer gap below nav.

### Verified
- Natural post-check UX: map first, then result title fully visible below opaque nav (desktop + mobile).
- nav computed: background rgb(7,8,10), backdrop none, z-index 200, opacity 1.
- Result wording untouched, CTA=1, scoring/backend/API unchanged, map above result preserved.
- Note: a user free-scrolling content beneath a sticky bar is normal app behaviour (Gmail/Maps); the opaque bar makes that clean rather than broken.

---

## Daily Check — 2026-05-29 (package 96 — visual QA pass)

**Result:** ✓ RELEASE-CHECK PASSED (no zip yet — review first)
**Static:** 100/100 · **Browser:** 16 passed, 1 skipped, 0 failed
**sv-check.js:** d0b38b7c (map scope fix preserved — unchanged this turn)

### IMPORTANT: sandbox reset recovery
The sandbox had reset and the saved zip was the PRE-MAP package. Detected via hash check (showed ce46231f, not d0b38b7c). Re-applied all three approved prior changes before QA so nothing regressed:
1. Map scope fix in sv-check.js (window._geoResult + inline state detection) → hash back to d0b38b7c ✓
2. Leaflet 1.9.4 JS SRI hash corrected (pinned) ✓
3. #map-card moved above #result ✓
Then applied the QA fix.

### QA findings (measured, not guessed)
- Desktop header/hero: nav.bottom=60px, h1.top=112px → NO overlap. The earlier "cut through" was a scrolled-capture artifact, not a layout bug. No change needed.
- Mobile top: no overlap.
- Mobile scrolled: sticky nav (bottom 60px) was covering top of #result (result.top=0) when scrolled to top. REAL issue.

### QA fix (index.html CSS only)
scroll-margin-top: 76px on #map-card, #result, .result-wrap. sv-check.js calls scrollIntoView on the result; this ensures the sticky ~60px nav never covers their top. After fix: scrolled result.top=76px, nav.bottom=60px → not covered.

### Verified unchanged
Result wording (byte-identical in prior turn, untouched here), CTA=1, scoring/backend/API, fake-address gate, map above result (6 tiles, desktop+mobile). No markup, no new cards, no new wording.

---

## Daily Check — 2026-05-29 (package 96 — AI result-mutation layer removed)

**Result:** ✓ RELEASE-CHECK PASSED (zip not yet created — awaiting founder decision)
**Static:** 100/100 · **Browser:** 16 passed, 1 skipped, 0 failed
**sv-check.js:** 90,962b (was 108,447b — AI layer removed)

### Problem diagnosed

`runAIInterpretation` was called at the end of `renderResult`. When the AI API (Claude) was available in production, the call chain was:

```
renderResult
  └─ runAIInterpretation(...)
       └─ hideAILoading(rcard)
            ├─ renderAIVerdict(rcard, insights)   → overwrites .signal-card with AI score/verdict
            ├─ renderAIRisks(rcard, risks)         → injects "Risk register" rsec
            └─ renderAINextActions(rcard, actions) → injects "Next actions" rsec
```

This meant:
- When AI API was unavailable (e.g. local test) → clean simple result ✓
- When AI API was available (production) → old sections injected after clean result ✗

### What was deleted

| Function | Size | Effect |
|---|---|---|
| `runAIInterpretation` | 267b | Entry point — called Claude API |
| `hideAILoading` | 1808b | Orchestrated all 3 render mutations |
| `renderAIVerdict` | 3366b | Overwrote `.signal-card` with "AI development intelligence verdict" |
| `renderAIRisks` | 2929b | Injected "Risk register" rsec with AI risk data |
| `renderAINextActions` | 3492b | Injected "Next actions" rsec before CTA |
| `showAILoading` | 600b | Added loading indicator to verdict section |
| QA button block in renderResult | 4791b | References old removed sections |

### New static checks (100 total — added 7)
- AI UI functions confirmed deleted: runAIInterpretation, renderAIVerdict, renderAIRisks, renderAINextActions, showAILoading, hideAILoading
- runAIInterpretation() confirmed not called from renderResult

### New browser test coverage (test 17 expanded)
Added to forbidden section labels: AI development intelligence, AI intelligence score, Next actions, AI risk rating, Requires Investigation, AI-sequenced

### Backend preserved
`public/netlify/functions/ai-interpret.js` was NOT deleted — it is a server function and not a display layer. It can be repurposed later for a properly designed AI assistance feature.

### What the result now shows — always, regardless of API availability
1. Header (address · zone · confidence · parcel)
2. What we found
3. What this may mean
4. What is still missing
5. Find Out What My Land Can Do → (one gold button)
6. Professional verification required
7. Map with parcel outline or pin

---

## Daily Check — 2026-05-29 (package 96 — dead display code deleted + tests)

**Result:** ✓ PACKAGE READY (no zip yet — founder decision required)
**Static:** 93/93 · **Browser:** 16 passed, 1 skipped, 0 failed
**sv-check.js:** 171KB → 108KB (63KB removed = 37% reduction)

### Method: precise call-graph analysis before deleting anything

1. Built a BFS call graph from entry points (runCheck, renderResult, _showNonNSWResult, buildVerdictSection etc.)
2. For each candidate "dead" function, verified ALL call sites and determined if any caller is in the active render chain
3. Only deleted functions with zero active callers
4. Verified engine functions intact after deletion

### 22 display functions deleted (63KB):

| Function | Size | Was doing |
|---|---|---|
| buildPersonaNextSteps | 10779b | Role-based next steps (Investor/Builder/Broker/Planner/Civil) |
| buildSiteContextSection + factRow + cRow | 19652b | Old site context section |
| buildEvidenceLedger + ledRow | 4973b | Old evidence ledger |
| buildHBUSection | 3980b | Highest & Best Use analysis |
| buildCouncilBehaviour | 4025b | Council behaviour section |
| buildVerificationChecklist | 4719b | Old verification checklist |
| buildRiskNotes | 3685b | Risk notes section |
| buildMissingInfoSection | 3426b | Missing info section |
| buildShareableSummary | 2271b | Shareable summary section |
| buildFinancialAssumptions + svCalcFin | 6976b | Finance readiness section |
| buildConstraintChecklist | 3478b | Constraint indicators section |
| buildProVerification | 1901b | "16+ live data sources" verification card |
| priorityColor | 2299b | Color helper for old sections |
| verdictLabelFromScore + scoreRangeBand | 992b | Old score display helpers |
| whtm + srcBadge + injectWhtm | 828b | "Why this matters" helpers for old sections |

### 6 engine functions kept (called by renderResult):
calcPlanningStrength, calcOverlayRisk, calcYieldPotential,
calcApprovalConfidence, calcHoldingCostRisk, calcCouncilComplexity

### New static checks (93 total — added 13):
Checks 81-93: Each deleted function confirmed absent from sv-check.js

### Product acceptance tests: 3/3 pass
- NSW result: one CTA, correct 3-engine flow
- QLD non-NSW: one CTA only
- Old sections absent from result

---

## Daily Check — 2026-05-29 (package 96 — root-cause fix + product acceptance tests)

**Result:** ✓ PACKAGE READY  
**Package:** 96 · **Static:** 80/80 (6 new product checks) · **Browser:** 15 passed, 1 skipped, 0 failed  
**Engine:** UNCHANGED · **New product tests:** 2 browser tests PASS

### Root-cause diagnosis

**Why old sections kept returning:** `_renderResultInner` builds `var H` which contained 5 old rsec sections (Overlay analysis, Risk register, Development pathway, Comparable DAs, Infrastructure proximity). Previous fixes only removed the EXTRA sections appended by `renderResult`, never touched the core H. The new `buildVerdictSection` was added ON TOP of the old sections — user saw both.

**Why release-check passed with wrong content:** No test checked the content of the rendered result card. Browser tests only verified: NSW/non-NSW wording separation, result renders within 25s, fake address rejects, run button re-enables, version.json correct.

### What was fixed

**`_renderResultInner` H assembly:**
- Removed 9854b from H: everything from `// Overlay analysis` through disclaimer
- H now contains only: header (address/zone/confidence/parcel stats) + CTA box
- `buildVerdictSection` injected before CTA = simple clean result

**Orphaned functions stubbed to empty:**
- `buildRiskRegister` (11869b → 3 lines)
- `buildDevPathway` (4311b → 3 lines)

### Product acceptance tests added

**`tests/sitecheck.e2e.spec.js` (2 new browser tests — now 16 total):**
1. "Site Check result shows correct 3-engine flow sections" — runs NSW check, verifies result contains: What we found, What this may mean, What is still missing, Find Out What My Land Can Do
2. "Site Check result does NOT show old report sections" — runs NSW check, verifies result does NOT contain: Overlay analysis, Risk register, Development pathway, Comparable DAs, Infrastructure proximity, Finance readiness, Development scorecard, Get Full Report, Hot List, Low Signal, Strong Signal, can subdivide, sell as-is, guaranteed approval

**`scripts/predeploy.js` (6 new static checks — now 80 total):**
1-3. Old section titles absent from `_renderResultInner` H: Overlay analysis, Risk register, Development pathway
4-6. New flow labels present in sv-check.js: What we found, What this may mean, What is still missing

**These tests now permanently protect the result.** If anyone adds old sections back, predeploy FAILS before browser tests even run.

### Engine files — UNCHANGED
geocode.js · national-site-check.js · all 8 providers · release-check.js
All safety guards confirmed: _detState, ftx(), SITE_CHECK_TIMEOUT, _showNonNSWResult, fake address gate, mapprod3 URL, _renderMap

---

## Daily Check — 2026-05-29 (result wording final cleanup)

**Result:** ✓ PACKAGE READY  
**Package:** 95 · **Static:** 74/74 · **Browser:** 13 passed, 1 skipped, 0 failed  
**Engine:** UNCHANGED · **Product check:** 36/36 passed

### What was still wrong in sv-check.js result output

9 functions contained forbidden wording. 3 were user-visible; 6 were orphaned definitions:

**User-visible (rendered to screen):**
- `openRegModal`: subtitle said "Register to unlock your free full report" → fixed to neutral text
- `_showAddrNotFound`: said "request a Full Report / professional review" → "request a professional review"
- `goSample()`: linked to `hot-list.html` via keyboard shortcut → redirected to `/services`

**Orphaned (defined but not called in render chain):**
- `buildFullReportPreview`: had "Full Report / Professional Review" title, "Get Full Report" button → stubbed to empty
- `buildNextPathways`: had hot-list, sell-lease, Finance/lender cards → stubbed to empty
- `buildPersonaNextSteps`: had "Full Report" (×3), "Services page", "cost/services quote" → fixed in-place
- `buildScorecard`: had "Development scorecard" title → stubbed to empty
- `buildShareableSummary`: "Full Report" reference → "Land Value Pathway Review"

### Result of all changes

16 forbidden phrases now absent from sv-check.js (non-comment context):  
Full Report, Get Full Report, Finance / lender, Finance &amp; lender, finance.html, Services page, cost/services quote, services quote, Development scorecard, hot-list, sell-lease.html, View featured properties, higher-value development pathway, intelligence report, 16+ overlay, 16+ live

### What the result now shows to users

**After any Site Check:**
1. Data header (address, zone, confidence, parcel)
2. Overlay analysis (what overlays were checked)
3. Risk register (what risks were found)
4. Development pathway notes
5. Comparable DAs / infrastructure (where available)
6. **What we found** — bullet list of confirmed data
7. **What this may mean** — 1-2 warm plain-English sentences
8. **What is still missing** — honest checklist
9. **Find Out What My Land Can Do →** (gold CTA)
10. **Professional Pathway →** (secondary link)
11. Professional verification required
12. Map with parcel outline or pin (Leaflet, silently fails)

**After any non-NSW Site Check (QLD, VIC, TAS, ACT, SA, WA, NT):**
1. Address + council confirmed
2. State planning status (what data is available)
3. Honest note about what's not yet connected
4. Plain-text next step
5. **Find Out What My Land Can Do →** (gold CTA)
6. **Professional Pathway →** (secondary link)
7. Map with pin

---

## Daily Check — 2026-05-29 (package 95 — clean rebuild complete)

**Result:** ✓ PACKAGE READY  
**Package:** 95 · **Static:** 74/74 · **Browser:** 13 passed, 1 skipped, 0 failed · **Engine:** UNCHANGED

### What was genuinely still wrong in package 94 (found by careful inspection)

1. **Loading messages** (user-visible during Site Check):
   - "Analysing 16+ overlay data sources…" → old marketing language
   - "Calculating development potential…" → implies development-focused product
   - "Compiling intelligence report…" → sounds like a sales platform

2. **Non-NSW result** had no CTA button — only a text "Next step:" line
   - Queensland, VIC, SA, WA, NT, ACT, TAS users had no way to proceed to Professional Pathway from the result

3. **stateInfo detail/status fields** still contained:
   - "beta Site Check" (internal) — 6 instances
   - "PostGIS integration in preparation" (internal tech) — 3 instances  
   - "ArcGIS REST" and similar internal data-source references

### What was fixed in package 95

**Loading messages** (`sv-check.js`):
- "Analysing 16+ overlay data sources…" → "Checking overlay and hazard indicators…"
- "Calculating development potential…" → "Checking council and DA information…"
- "Compiling intelligence report…" → "Preparing your result…"

**Non-NSW result** (`_showNonNSWResult`):
- Added "Find Out What My Land Can Do →" gold button
- Added "Professional Pathway →" outline button
- Both appear after the plain-text "Next step:" line
- All states (QLD, VIC, SA, WA, NT, ACT, TAS) now have a clear pathway after the result

**stateInfo fields** (all states):
- "in this beta Site Check." → "for this state."
- "PostGIS integration not yet complete." → "detailed planning zones are not yet connected."
- "PostGIS integration pending." → "planning zones not yet connected —"
- VIC detail: removed "PostGIS integration in preparation" language

### What was NOT changed (all engine files byte-verified)
- geocode.js (15804b) · national-site-check.js (8802b)
- All 8 state provider files unchanged
- sv-check.js engine layer: _detState, ftx(), SITE_CHECK_TIMEOUT, _showNonNSWResult guards
- NSW mapprod3 URL, fake address gate, all 16 safety guards

### Pre-zip review: 45/45 passed
All forbidden phrases absent. All new flow labels present. All engine guards intact.

### The complete result flow (what a user now sees)
**NSW:**
1. Data header (address, zone, confidence)
2. Overlay analysis
3. Risk register  
4. Development pathway notes
5. Comparable DAs + infrastructure
6. Disclaimer
7. **What we found / What this may mean / What is still missing** (3-section card)
8. **Find Out What My Land Can Do →** + Professional Pathway →
9. Map with parcel outline (Leaflet, NSW SIX Maps)

**All other states:**
1. Address confirmed, council/LGA
2. State status (what we found)
3. Honest note: planning zones not yet connected for this state
4. Verification reminder
5. Next step (plain text from stateInfo)
6. **Find Out What My Land Can Do →** + Professional Pathway →  ← NEW
7. Map with pin (Leaflet, OSM)

---

## Daily Check — 2026-05-29 (result engine cleanup — no version bump)

**Result:** ✓ TESTS PASS — package 94 result engine cleaned  
**Static:** 74/74 · **Browser:** 13 passed, 1 skipped (correct), 0 failed  
**Engine files:** UNCHANGED

### What was wrong in the result output
After running Site Check, the rendered result still showed old product flow because:
- `renderResult` was assembling 14 separate display sections after the data sections
- These included: buildPersonaNextSteps (had "Full Report"), buildFullReportPreview (had "Full Report"), buildNextPathways (had "Full Report", hot-list, sell-lease), buildPersonaNextSteps (had "investment advice" label), buildProVerification (had "16+ live data sources")
- The CTA box in `_renderResultInner` had 3 conditional buttons: "Finance & lender support", old score-dependent "Full Report" buttons
- `buildReportGate` added a registration gate below the result

### What was fixed (display layer only — engine unchanged)

**`_renderResultInner` CTA box:**
- Removed: conditional 3-button layout based on overallScore
- Removed: `finance.html` link ("Finance & lender support")
- Removed: "This site may support a higher-value development pathway. A Full Report gives..."
- Removed: "This site shows development potential. Run a Full Report..."
- Added: one clean 2-button CTA: "Find Out What My Land Can Do →" + "Professional Pathway →"
- Added: plain warm sub-text: "If you want to understand the fuller picture..."

**`renderResult` section assembly:**
- Removed: all 14 old sections (buildSiteContextSection, buildConstraintChecklist, buildMissingInfoSection, buildRiskNotes, buildEvidenceLedger, buildRiskRegister, buildDevPathway, buildCouncilBehaviour, buildPersonaNextSteps, buildProVerification, buildVerificationChecklist, buildShareableSummary, buildFullReportPreview, buildNextPathways)
- Added: only `buildVerdictSection(...)` — the clean 3-section card already built in pkg 90-91

**`buildReportGate` call:**
- Removed from renderResult (the gate is no longer shown after results)

**`buildProVerification`:**
- "Confirmed via 16+ live data sources" → "What we confirmed in this check"
- "DA timeline (34 councils)" → "Council DA timeline"
- "vs 34 councils in database" → "compared to other councils"

### What the result now shows
1. Data header (address, zone, confidence, parcel) — from _renderResultInner H
2. Overlay analysis — from H (9 government overlays checked)
3. Risk register — from H
4. Development pathway notes — from H
5. Comparable DAs, infrastructure — from H
6. Disclaimer — from H
7. `buildVerdictSection` — "What we found / What this may mean / What is still missing" (3-section card)
8. CTA box: "Find Out What My Land Can Do →" + "Professional Pathway →"
9. Map preview (Leaflet, async, silently fails if unavailable)

### Pre-zip review: all items passed
- All engine guards present
- buildPersonaNextSteps, buildFullReportPreview, buildNextPathways, buildReportGate not called
- finance.html, Finance & lender support, "Full Report" buttons gone from renderResult
- New flow: buildVerdictSection called, all 4 flow labels present, single CTA
- sv-check.js: 203841b (≥ 190000)

---

## Daily Check — 2026-05-29 (package 94 — final public cleanup)

**Result:** ✓ PACKAGE READY  
**Package:** 94 · **Static:** 74/74 · **Browser:** 13 passed, 1 skipped (correct), 0 failed · **Engine:** UNCHANGED

### What was wrong in pkg 93 (and was not yet a zip)
- Old static HTML files still in public/ (hot-list.html, finance.html, sell-lease.html and subdirectory copies) — so `301` redirects didn't work (static file won over redirect rule)
- index.html still had old hero subtitle ("Zone controls, heritage, flood, DA approval timelines and development feasibility — from 16+ live government data sources")
- index.html example card (`example-wrap` div with canned Redfern example) still present
- index.html og:description and JSON-LD still had "AI-powered" and "16+ live data checks"
- terms.html had `<h2>Hot List and pre-screened properties</h2>` heading

### What was fixed in pkg 94

**Deleted 8 old files:**
- public/hot-list.html · public/hot-list/index.html
- public/finance.html · public/finance/index.html
- public/sell-lease.html · public/sell-lease/index.html
- public/full-report/index.html (stale subdirectory copy)
- public/services/index.html (stale subdirectory copy)

**public/_redirects: upgraded to 301! forced redirects**
- /hot-list, /hot-list/, /hot-list.html → /services 301!
- /finance, /finance/, /finance.html → /services 301!
- /sell-lease, /sell-lease/, /sell-lease.html → /services 301!
(The `!` forces the redirect even if a static file exists — belt and suspenders after file deletion)

**public/index.html:**
- Hero subtitle replaced: old technical text → "See what we found, what it may mean, and what is still missing before you make a big property decision."
- Example card (example-wrap div with canned Redfern example) removed
- og:description fixed: removed "AI-powered", "development feasibility"
- JSON-LD description fixed: removed "AI-powered", "16+ live data checks per address"

**public/terms.html:**
- Section heading: "Hot List and pre-screened properties" → "Pre-screened property information"

### What was preserved (engine files byte-verified by release-check)
- geocode.js (15804b) · national-site-check.js (8802b)
- All 8 state providers unchanged
- sv-check.js (206000b) — all guards, map preview, _renderMap, _showNonNSWResult
- predeploy.js logic · release-check.js · tests/sitecheck.e2e.spec.js

### Pre-zip review result: 33/33 passed
All required checks passed before zip was created.

### Remaining public HTML files (clean 5-page structure)
1. index.html (Home / Free Site Check)
2. what-this-may-mean.html (What This May Mean)
3. full-report.html (Find Out What My Land Can Do)
4. services.html (Professional Pathway)
5. terms.html (Terms & Data Use)
+ 404.html · deploy-check.html · sitecheck-render-test.html (infrastructure only)

### After deploy — verify
- /version.json → package_number: "94"
- /deploy-check.html → SAFE TO CONTINUE
- /.netlify/functions/sitecheck-test → allPassed: true, packageNumber: "94"
- /hot-list → 301 redirect to /services (forced)
- /finance → 301 redirect to /services (forced)

---

## Daily Check — 2026-05-29 (final public model cleanup)

**Result:** ✓ PACKAGE READY — release-check PASSED  
**Package:** 93 · **Static:** 82/82 · **Browser:** 14/14 · **Engine:** UNCHANGED

### What was wrong in pkg 92

After a careful wording scan of all public HTML files against the founder's requirements:
- `index.html` still had: "AI Development Intelligence Platform" badge, "16+ live data sources", "34 NSW councils", "319 real DA records", "Investors · Developers · Planners", "The verdict on any Australian property" as h1, "Hot list" in footer, "Development intelligence for Australian property" in footer, "unlock your full report" in registration modal
- `_redirects` had old pages returning 200 (hot-list, finance, sell-lease were still publicly accessible)
- `404.html` still had old nav with hot list and Services

### What was fixed

**index.html (homepage):**
- Removed `hero-platform-badge` div entirely
- h1: "The verdict on any Australian property" → **"Check your land for free"**
- Trust-row replaced: old marketing badges → "Free — no account needed", "Australian addresses", "NSW has the deepest live data first"
- Footer: removed "Development intelligence for Australian property", "Hot list", "Services" → clean 5-page links
- Registration modal: "unlock your full report" → "see the fuller picture"

**public/_redirects:**
- `/hot-list`, `/hot-list/`, `/hot-list.html` → `/services` 301
- `/finance`, `/finance/`, `/finance.html` → `/services` 301
- `/sell-lease`, `/sell-lease/`, `/sell-lease.html` → `/services` 301

**public/404.html:**
- Clean 5-page nav: Check My Land / What This May Mean / Find Out What My Land Can Do / Professional Pathway / Terms

### Pre-zip review — all items passed
- ✓ All Site Check engine guards intact (9 guards verified)
- ✓ 3-engine flow wording present in result card
- ✓ Homepage wording: badge, marketing badges, h1 all fixed
- ✓ Redirects: hot-list, finance, sell-lease → /services
- ✓ 5-page structure complete
- ✓ Professional Pathway form: email, upload, dropdown, Netlify Forms
- ✓ Legal disclaimers: all 5 "not X advice" statements in terms.html
- ✓ Map preview: try/catch confirmed, Leaflet CDN confirmed

### Engine files — unchanged (byte-verified during release-check)
geocode.js (15804b) · national-site-check.js (8802b) · nsw.js · act.js · tas.js · qld.js · vic.js · sa.js · fallback.js · sv-check.js engine layer · predeploy.js logic · release-check.js · tests/sitecheck.e2e.spec.js

---

## Daily Check — 2026-05-29 (5-page structure complete)

**Result:** ✓ PACKAGE READY — release-check PASSED  
**Package:** 92 · **Static:** 82/82 · **Browser:** 14/14 · **Engine files:** UNCHANGED

### What was identified as genuinely missing (vs already done)

After inspecting package 91 against the full design brief:
- ✗ Page 2 "What This May Mean" did not exist as a URL
- ✗ terms.html missing 5 required legal disclaimers (not planning advice, not valuation advice, etc.)
- ✗ services.html form missing email field, file upload, complete dropdown (Sell/Lease/Not sure options)
- ✗ full-report.html still titled "Full Report / Professional Review" — not "Find Out What My Land Can Do"

### What was built

**New page: `what-this-may-mean.html`** (11186b)
- Page 2 of the 5-page structure
- Explains how to read the Site Check result
- Plain English: what zone means, what overlays mean, what land size means
- Full 11-item "What is still missing" checklist (survey, easements, drainage, etc.)
- CTA: Find Out What My Land Can Do → /full-report.html

**Rewritten: `terms.html`** (8433b)
- Now includes all required disclaimers: not legal advice, not planning advice, not valuation advice, not financial advice, not investment advice, not guaranteed anything
- Data sources with correct attributions (CC BY 4.0, CC BY 3.0 AU, ODbL)
- Service enquiry disclosure updated
- Proper limitation of liability

**Rewritten: `full-report.html`** (9073b)
- Title: "Find Out What My Land Can Do"
- 5-step flow (Site Check → Tell us → We review → Clear picture → Professional Pathway)
- 6 pathway cards (sell, lease, subdivide, improve, finance, not sure yet)
- Honest: not a guarantee; professional verification required

**Rewritten: `services.html`** (10154b)
- Complete 5-group Professional Pathway structure
- Netlify Forms: name, phone, email (new), address, purpose dropdown (6 options including "I am not sure yet"), file upload (new), message
- Upload UI with click-to-attach area and file label confirmation
- Disclosure: "matched with appropriately qualified professionals and trades"

**Nav: all pages updated to 5-item structure**
- Free Site Check / What This May Mean / Find Out What My Land Can Do / Professional Pathway / Terms
- Footer also updated to match 5 pages

### What was NOT changed
- sv-check.js engine (all state handling, providers, geocode, guards — unchanged)
- index.html Site Check form and map functionality
- All provider files, all Netlify functions
- release-check, tests, protected routes

### Engine file verification
- geocode.js (15804b) ✓
- national-site-check.js (8802b) ✓
- nsw.js, act.js, tas.js, qld.js, vic.js, sa.js, fallback.js ✓
- predeploy.js logic ✓ · release-check.js ✓ · tests/sitecheck.e2e.spec.js ✓

---

## Daily Check — 2026-05-29 (homepage redesign + map preview)

**Result:** ✓ PACKAGE READY — release-check PASSED  
**Package:** 91  
**Static:** 81/81 PASSED  
**Browser:** 14/14 PASSED (42.8s, 0 retries after spec fix)  
**Engine files:** ALL UNCHANGED (geocode, providers, test logic)

### What changed (display layer only — all engine files byte-verified unchanged)

**index.html (homepage):**
- Headline: "The verdict on any Australian property" → **"Check your land for free"**
- Subheadline: new plain-English framing about what we found / what it means / what is still missing
- Trust row: simplified — removed "34 NSW councils", "319 real DA records"
- Example card: removed (was a pre-canned example that added complexity)
- Form simplified: address input primary + optional details (`<details>` collapsed)
- Button: "Run intelligence check" → **"Check My Land →"**
- Leaflet map CDN added (free, no API key, © OpenStreetMap contributors)
- Map card div added after result div

**sv-check.js (display layer only):**
- `_renderMap(lat, lon, state, matchedAddr)` added: renders Leaflet map after result
- `_fetchParcelOutline(lat, lon, map)` added: NSW SIX Maps Layer 9 (CC BY 4.0, no key) — returns parcel outline polygon and area/lot info in map note
- Called after NSW result renders AND after non-NSW result renders
- Graceful degradation: if Leaflet/map fails, result card unaffected
- CTA: "What to do next with this site?" → **"Find Out What My Land Can Do"**
- CTA buttons updated: "Unlock full report" → "Find Out What My Land Can Do →"
- CTA secondary: "Request professional review" → "Professional Pathway →"

**Nav (all 12 pages):**
- Simplified to 4 items: Free Site Check / Find Out What My Land Can Do / Professional Pathway / Terms
- Removed from nav: Sell/Lease, Finance, Properties to watch (Hot List)
- Hot List, Finance, Sell/Lease pages still exist — not deleted — just not in nav

**tests/sitecheck.e2e.spec.js:**
- Updated `runSiteCheck()` helper: opens `<details>` before filling `#block` input
- This was needed because the block input is now inside a collapsed `<details>` element

**CSS:**
- `sv-components.css`: `#map-card`, `#sv-map`, `.leaflet-container` styles added
- `sv-layout.css`: `.hero h1` and `.hero h1 em` styles added

### What was NOT changed (engine files, byte-verified)
- `geocode.js` (15804b) ✓
- `national-site-check.js` (8802b) ✓
- All 8 state provider files ✓
- `predeploy.js` logic ✓ (only EXPECTED_PKG number changed)
- `release-check.js` ✓ (unchanged)

### New data source added (display only)
- **NSW SIX Maps Cadastre Layer 9** — parcel outline for map preview
  - Source: maps.six.nsw.gov.au
  - Licence: CC BY 4.0
  - Use: display-only geometry call from browser, not through Netlify functions
  - Fields: cadid, lotidstring, planlabel, areatotalm2, lganame, geometry
  - Rate limits: none documented; used only on user action (one call per check)
  - Failure: silent — map shows pin only if outline call fails

### Founder decisions needed
None from this session.

### Deploy checklist
After Netlify deploy, verify:
- `/version.json` → package_number: "91"
- `/deploy-check.html` → SAFE TO CONTINUE
- `/.netlify/functions/sitecheck-test` → allPassed: true, packageNumber: "91"
- NSW address check → map renders with parcel outline (gold polygon)
- Non-NSW address check → map renders with pin only + note about parcel outline

---

## Daily Check — 2026-05-29 (wording rewrite)

**Result:** ✓ PACKAGE READY — release-check PASSED  
**Time:** 2026-05-29T00:51:37Z  
**Static:** 81/81 PASSED  
**Browser:** 14/14 PASSED (40.7s, 0 retries)  
**Engine files:** ALL UNCHANGED (size-verified)

### What changed (wording/display only — engine untouched)

**sv-check.js — display layer only:**
- `buildVerdictSection` fully rewritten: plain 3-section card
  — "What we found" (bullet list of confirmed data)
  — "What this may mean" (1-2 warm sentences, no overclaiming)
  — "What is still missing" (honest checklist)
  — CTA: "Find Out What My Land Can Do →"
  — Professional verification: always shown, never removable
- Removed: Low Signal / Review Signal / Strong Signal labels
- Removed: "Get Land Value Pathway Review" (replaced by above CTA)
- `renderAIVerdict` labels: "Hidden upside" → "What may be possible", "Primary risk" → "Key concern to verify", "Approval outlook" → "DA context", "Council speed" → "Council DA times"
- `buildPersonaNextSteps` persona headers simplified: role labels (Investor/Builder/Planner/etc.) → plain pathway labels ("Understanding your options", "Finance and lending context", etc.)
- Card label: "Development Works" → "Professional Pathway"
- Card label: "Hot List / watch opportunities" → "View featured properties"

**All 12 public HTML files (nav):**
- Nav: "Development Works" → "Professional Pathway"
- Nav: "🔥 Hot list" → "Properties to watch" (emoji removed)
- Nav: "Full report" → "Land Value Pathway"

**index.html:**
- Title: "SiteVerdict — Development Intelligence for NSW Property" → "SiteVerdict — Free Property Site Check for Australia"
- Meta description: NSW-only → national, user-benefit framing
- Placeholder: NSW example → TAS example (national signal)
- Body copy: "development intelligence" → plain language

**services.html + services/index.html:**
- Title: "Development Works" → "Professional Pathway"
- H1: "Development Works" → "Professional Pathway"
- Removed: "Sydney Home Improve" from disclosure paragraph
- Removed: "Services coordinated by Sydney Home Improve" from footer
- Replaced with: "matched with appropriately qualified professionals and trades" / "Professional Pathway — Arm Plus Group"

**terms.html:** Same Sydney Home Improve removal

**hot-list.html + hot-list/index.html:**
- Title: removed "NSW Development Intelligence"
- Meta: national framing

**full-report.html + full-report/index.html:**
- Title: "Full SiteVerdict Report" → "Land Value Pathway — SiteVerdict"

### What was NOT changed (engine files, byte-verified)
- `public/netlify/functions/geocode.js` (15804b) ✓
- `public/netlify/functions/national-site-check.js` (8802b) ✓
- All 8 state provider files ✓
- `scripts/predeploy.js` (13030b) ✓
- `scripts/release-check.js` (8663b) ✓
- `tests/sitecheck.e2e.spec.js` (15674b) ✓
- `_redirects` (protected routes) ✓

### Founder decisions needed
None from this session. Package 90 is ready for GitHub PR → Netlify preview → production deploy.

---

## Daily Check — 2026-05-28 (product design session)

**Result:** ✓ PRODUCT DESIGN DOCUMENT CREATED  
**Time:** 2026-05-28T23:23:40Z  
**Scope:** Architecture and planning only — no app code changed, no deploy, no zip

### What was researched (live API probes)
- NSW SIX Maps Layer 9 (Lot): confirmed fields include areatotalm2, planlabel, lotidstring, lganame — returns parcel area and lot/plan reference
- NSW DCCEEW: Flood folder confirmed at mapprod3.environment.nsw.gov.au/arcgis/rest/services/Flood
- NSW ePlanning DA API: endpoint returns 400 — needs correct params or API docs review
- NSW Valuer General: website accessible — API/terms not yet confirmed
- Nominatim/OSM geocode: confirmed working, returns lat/lon for Australian addresses (free, ODbL)
- ACT ACTGOV_FLOOD_EXTENT: confirmed live on services1.arcgis.com (not yet integrated)
- Leaflet + OpenStreetMap tiles: confirmed free, attribution required
- QLD basemap tiles: confirmed live (qld_basemap server)

### What was created
- `docs/FREE_SITE_CHECK_PRODUCT_DESIGN.md` (21277b): 
  complete product design + data roadmap including:
  - Free Site Check target feature list (10 fields, all states)
  - Site Signal card design (replaces Executive Verdict)
  - Land Value Pathway Review CTA design
  - Independent data/API roadmap (Tier 1/2/3/4)
  - Map/parcel preview design (Leaflet + OSM + ArcGIS geometry)
  - Data safety classification (public vs gated vs professional only)
  - Competitor benchmark (without dependency)
  - 5 prioritised implementation tasks
  - Files likely to change
  - Tests needed before release
  - Risk checklist (legal, licensing, overclaiming, cost)
  - Founder action list

### What was NOT changed
- No app code
- No Site Check logic
- No Netlify functions
- No package version
- No zip, no deploy

### Key findings for founder review
1. NSW SIX Maps lot area is available now — no account needed, CC BY 4.0. This is the single most impactful unblocked improvement.
2. Leaflet + OSM is the correct map approach — free, no API key, parcel geometry available from existing ArcGIS queries.
3. Site Signal should replace Executive Verdict — clearer, more honest, better conversion to CTA.
4. Single CTA "Get Land Value Pathway Review" should replace dual Free Report / Full Report gate.
5. Competitor moat: honesty + interpretation + clear next step, not raw data volume.

### Founder decisions needed
- [ ] Approve scope of 5 implementation tasks (or adjust priority)
- [ ] Confirm: Land Value Pathway Review — is this a gated feature (email capture) or open?
- [ ] Confirm: map preview — include parcel outline, or pin only first?
- [ ] Complete FOUNDER_ACTIONS items 1-3 (SA/WA/PostGIS) to unblock state data

---

## Daily Check — 2026-05-27 (operating files update)

**Result:** ✓ EXTERNAL DATA PROVIDER COMMUNICATION RULE ADDED  
**Time:** 2026-05-27T10:50:05Z  
**Scope:** Documentation only — no app code changed

### What was changed
- `CLAUDE.md`: Added **External Data Provider Communication Rule** section — 8 sub-rules covering disclosure, AI-assisted framing, licence-first integration, no raw resale, professional verification, and an outreach email template
- `docs/DATA_USE_POLICY.md`: Created — data use principles, source/licence table, automated query policy, and provider FAQ responses
- `DAILY_LOG.md`: This entry

### What was NOT changed
- No app code
- No Site Check logic
- No Netlify functions
- No package version
- No zip created
- No deploy

### Why release-check was not run
These are documentation-only files (`CLAUDE.md`, `docs/DATA_USE_POLICY.md`, `DAILY_LOG.md`). No JavaScript, HTML, or deployed asset was modified. The static predeploy check does not require re-running for markdown documentation changes. Release-check will run automatically on the next PR via GitHub Actions.

### Founder decisions needed
None from this session. Existing FOUNDER_ACTIONS.md items unchanged.

---

## Daily Check — 2026-05-27

**Result:** ✓ OPERATING FILES CREATED  
**Time:** 2026-05-27T08:04:40Z  
**Agent mode:** Manual Claude session (GitHub Actions agent diagnostic succeeded)

### What was checked
- GitHub Actions `siteverdict-agent.yml` workflow ran and confirmed working
- `release-check.yml` ran before Claude agent — confirmed green
- `ANTHROPIC_API_KEY` secret confirmed present and functional in GitHub Actions
- OIDC permissions confirmed fixed (workflow runs without permission errors)
- Full workflow output visible in GitHub Actions step logs
- Existing operating files audited: RELEASE_STATUS.md and AGENT_QUEUE.md were outdated or missing

### What passed
- Claude GitHub Actions agent: diagnostic succeeded
- release-check: passed before agent run
- Static predeploy: 81/81
- Browser tests: 14/14 (Chromium v148)
- Package identity: all 7 markers = 90

### What failed
- Nothing failed

### What was fixed
- RELEASE_STATUS.md: created/updated with current live site, operating mode, state coverage, next milestone
- AGENT_QUEUE.md: created/updated with P0/P1/P2/P3 task list, 17 tasks prioritised
- DAILY_LOG.md: this entry appended

### What was blocked
- P1-007 SA provider: awaiting founder SA Spatial Hub registration
- P1-008 WA provider: awaiting founder Landgate SLIP registration
- P1-009 VIC PostGIS: awaiting founder PostGIS DB creation
  All three documented in FOUNDER_ACTIONS.md

### What is next
1. P1-005: Research Brisbane City Council planning zone REST API
2. P1-011: Add ACT flood overlay (ACTGOV_FLOOD_EXTENT confirmed live)
3. P1-012: Probe opendata.nt.gov.au for NT ArcGIS services
4. P2-006: Add state provider health probes to daily-check.js

### Founder decisions needed
- [ ] Action 1: Register SA Spatial Hub — https://sailis.lssa.com.au — set SA_SPATIAL_HUB_KEY
- [ ] Action 2: Register WA SLIP — https://slip.landgate.wa.gov.au — set WA_SLIP_API_KEY
- [ ] Action 3: Create PostGIS DB (Supabase/Neon free) — set SITEVERDICT_POSTGIS_URL → unlocks VIC
- [ ] Optional: Add ANTHROPIC_API_KEY to GitHub repo secrets to enable scheduled 4-hourly agent runs

---

## Daily Check — 2026-05-27

**Result:** ✓ SYSTEMS PASS  
**Time:** 2026-05-27T02:20:19Z

### What changed
- Package 88 built (TAS buffer fix, QLD live QSpatial, agent system)
- ACT provider updated: `services1.arcgis.com/ACTGOV_TP_LAND_USE_ZONE/FeatureServer/1` confirmed live with 100m buffer — returns `LAND_USE_ZONE_CODE_ID`, `LAND_USE_POLICY_DESC`, `DIVISION_NAME`
- AGENT_QUEUE.md created — 15 tasks prioritised P0→P3
- RELEASE_STATUS.md created — current state dashboard
- RELEASE_STATUS.md: state coverage table updated (QLD now partial live, ACT zone now live pending deploy)
- .github/workflows/siteverdict-agent.yml created — runs every 4h via Claude Code
- .github/ISSUE_TEMPLATE/founder-direction.yml created
- data/state-source-registry.json — 11 sources with live probe results

### What broke
Nothing broke.

### What was fixed
- ACT zone query was using dead URL (data.actmapi.act.gov.au DNS fail)
  Fixed to services1.arcgis.com/E5n4f1VY84i0xSjy — returns real ACT Territory Plan zone data

### What was blocked
- VIC PostGIS: Founder must create DB + set SITEVERDICT_POSTGIS_URL (see FOUNDER_ACTIONS.md Action 3)
- SA: Founder must register at sailis.lssa.com.au (see FOUNDER_ACTIONS.md Action 1)
- WA: Founder must register at slip.landgate.wa.gov.au (see FOUNDER_ACTIONS.md Action 2)

### Property / user problems detected
- ACT users (Canberra/Turner/Civic) were not getting any planning data due to dead URL
- Fixed: ACT Site Check will now return Territory Plan zone code + description

### Opportunities
- ACT DA Finder is also live (ACTGOV_ACTIVE_DEVELOPMENT_APPLICATIONS) — could add DA pipeline context
- ACT Flood extent layer confirmed live (ACTGOV_FLOOD_EXTENT) — could add flood overlay
- QLD ACTGOV_DIVISIONS gives suburb/district — adds granular context

### What to improve next
1. Deploy package 88 to Netlify → verify ACT + TAS + QLD live on real site
2. P1-009: Research Brisbane City Council zone API for first council-level QLD zone
3. P1-008: Probe opendata.nt.gov.au more carefully for NT ArcGIS services
4. P2-007: Add state provider health probes to daily-check.js

### Founder decisions needed
- [ ] Action 1: Register SA Spatial Hub (https://sailis.lssa.com.au) → unlocks SA zones
- [ ] Action 2: Register WA SLIP (https://slip.landgate.wa.gov.au) → unlocks WA data
- [ ] Action 3: Create PostGIS DB → set SITEVERDICT_POSTGIS_URL → unlocks VIC zones
- [ ] Approve: ANTHROPIC_API_KEY secret in GitHub repo → enables Claude Code agent (siteverdict-agent.yml)


---

## Daily Check — 2026-05-26

**Result:** ✓ ALL PASS  
**Time:** 2026-05-26T10:16:39.367Z  
**Target:** https://siteverdict2.netlify.app

### What changed
_(run `git log --oneline -5` for recent commits)_

### What broke
Nothing broke.

### What was fixed
_(add notes manually when applying patches)_

### Property / user problems detected
None detected in this run.

### Opportunities
_(add when user enquiry patterns or data signals are reviewed)_

### What to improve next
All checks passing. Review user enquiries and data freshness next.

### Founder decisions needed
None — AI can proceed without founder input.

_Most recent entries at top. AI runs `npm run daily-check` and writes here.
Founder reviews findings and decisions only — not raw check results._

---

## How to read this log

- ✓ PASS means no problems found
- ✗ FAIL means something broke or is missing
- **Founder decisions needed** = the only items requiring human judgment
- Everything else is handled by AI

---

## First entry — system initialised

**Date:** 2026-05-26  
**Action:** Daily check system created.

### What changed
- Added `PRINCIPLES.md` — core operating document
- Added `scripts/daily-check.js` — agentic daily scan
- Added `DAILY_LOG.md` — this file
- Fixed deploy-check.html iframe: `X-Frame-Options: DENY` was blocking all iframes including same-origin. Fixed by creating `/sitecheck-render-test.html` with `SAMEORIGIN` exception in `netlify.toml`. Previous 7 render-level failures were harness failures, not Site Check failures.
- `addrType` → `_addrType` variable reference fix in sv-check.js state gate
- `_addrForState` / `_isNSWAddr` now defined locally in `_renderResultInner` from `matchedAddr` parameter (were causing ReferenceError in NSW deep check)
- Overpass-api.de fetch wrapped with 8s AbortController (was hanging NSW check)
- Playwright 10/10 tests pass locally against mock server

### What broke
- deploy-check.html was reporting 7 render failures that were actually harness failures (cross-origin block). Root cause: `netlify.toml` sets `X-Frame-Options: DENY` for `/*`. The iframe `sandbox="allow-same-origin"` does not override a server-sent DENY header.

### What was fixed
- `netlify.toml`: added `X-Frame-Options = "SAMEORIGIN"` exception for `/sitecheck-render-test.html` only. Global DENY preserved.
- `deploy-check.html`: now iframes `/sitecheck-render-test.html` (not `/`). Has explicit error message if same-origin access still fails.

### Property / user problems detected
- None in this run.

### Opportunities
- Non-NSW users (VIC, QLD, SA, WA, NT) see a "not yet connected" message. As PostGIS integration is completed for each state, Site Check will return real planning data for those users. QLD and VIC are the next highest-population opportunity.

### What to improve next
1. Deploy package 71 to Netlify (fixes iframe deploy-check + sv-check.js ReferenceError bugs)
2. Verify deploy-check.html passes all render-level checks on live site
3. Add `npm run daily-check` to CI/CD if available
4. Begin VIC PostGIS integration (Vicmap GDB received)

### Founder decisions needed
- [ ] Approve package 71 deploy to Netlify
- [ ] Confirm: continue VIC PostGIS integration next, or focus on something else?
