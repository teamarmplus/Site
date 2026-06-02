# Package 99C — Final Deploy & Proof Bundle

**Status:** Approved for private gate + deploy review. No new features. Not Package 100.
**Built from:** the live deployed source at siteverdict2.netlify.app (uploads were not reaching the workspace). Diff against your repo before applying if the repo is ahead of live.

## Patch r4 (sticky-header layout blocker — this revision)
**Fix:** removed sticky/fixed nav behaviour. `sv-layout.css` `nav` is now `position:static` (was `position:sticky;top:0`), so the header is a normal bar at the top of Site Check, Professional Review, and the thank-you page (shared stylesheet → all three covered at once). The homepage's sticky-compensation styles (large `scroll-padding-top`/`scroll-margin-top`, z-index/opacity workarounds) were simplified to static-nav-appropriate spacing. No markup, wording, or flow change.

**Verified after r4:** JS syntax PASS; 19/19 e2e checks PASS; no sticky/fixed nav anywhere in CSS or HTML. Screenshots re-captured — in desktop State A, State B, and mobile State A the header sits at the top and covers no content (address input, land size/frontage, map, stats row, What we found, result card, Professional Review button all clear).


1. **Thank-you page** — added `professional-review-thanks.html` (the form `action` target). Same SiteVerdict style; message "Thank you. We received your request." + 24–48 business-hours wording; "Back to Site Check" button + "Send another Professional Review request" link. The Professional Review form now has a valid success path.
2. **State A proof corrected** — the earlier State A screenshot was misleading (the card was injected after a State B run, so fields looked empty and the missing-message lingered). Replaced the test with a **real end-to-end browser flow** (type address + land size + frontage → click → render, with government APIs network-stubbed for the output layer only). Verified: missing-message hidden after submit, fields retain 695/15, State A renders with the entered values.
3. **Scorecard residue removed** — the real-flow screenshot exposed a leftover result header KPI strip ("OVERALL / Limited facts" block + a "DA median" estimate from the internal CD{} dataset). Removed the OVERALL block and the DA-median KPI; stats row is now Zone / Min lot / Land size (entered) / Frontage (entered). The top confidence row (Address/Zone/Parcel labels) is kept — it is honest confidence labelling, not a score.

Re-verified after r3: JS syntax PASS; 19/19 end-to-end checks PASS (State A real flow, State B, Professional Review, thank-you page, QLD preview CTA = Professional Review, no old "Find Out…", no "free report unlocked").


Fixed four founder-identified blockers, nothing else:
1. **Main nav + footer nav** — removed "What This May Mean", "Find Out What My Land Can Do", "Professional Pathway"; now: Site Check · Professional Review · Terms.
2. **Non-NSW / QLD-preview result CTA** — changed from "Find Out What My Land Can Do" (`/full-report.html`) to "Professional Review" (`/professional-review.html`).
3. **Registration / free-report modal** — removed from index.html entirely ("Registered successfully", "Your free report is unlocked", "Register free" wording all gone); modal functions in sv-check.js neutralised to no-ops; unused gate constant removed.
4. **Top comment of sv-check.js** — now reads "Public Site Check story + Professional Review flow" (no longer claims Executive Verdict / Scorecard / Report gate). Also fixed a stray "Professional Pathway" status string → "Professional Review".

Re-verified after patch: JS syntax PASS; 26/26 render tests PASS; 10/10 blocker checks PASS (no "Find Out…", no "free report unlocked", non-NSW CTA = Professional Review). Screenshots re-captured from the cleaned build.



---

## 4. Exact files changed

| File | Change | Delta |
|---|---|---|
| `index.html` | EDITED — entry takes address+land size+frontage; helper text; below-result card removed; missing-fields message; nav/footer simplified; registration modal removed; **sticky-compensation styles simplified for static nav** | +20 / -110 lines |
| `assets/sv-check.js` | EDITED — 7-part story, State A/B, confidence labels, public scoring retired, gate neutralised; non-NSW CTA → Professional Review; modal fns no-op; top comment corrected; OVERALL block + DA-median KPI removed | +144 / -135 lines |
| `assets/sv-layout.css` | EDITED — **nav `position:sticky` → `position:static`** (no sticky header) | 1 rule |
| `professional-review.html` | NEW — form + optional upload + 24–48 business-hours wording | new file |
| `professional-review-thanks.html` | NEW — form success page | new file |
| `version.json` | EDITED — bumped to 99C-r4 | — |
| `assets/sv-tokens.css`, `sv-base.css`, `sv-components.css`, `sv-print.css` | UNCHANGED | — |

Integrity (SHA-256) of changed files:
- index.html `e07299dd`
- assets/sv-check.js `8b706212`
- assets/sv-layout.css `2b38f6f6`
- professional-review.html `4fb0e39a`
- professional-review-thanks.html `9c8a12be`
- version.json `8aeccb95`

The government-data engine, geocoding and parcel-outline fetch were **not** changed — regression surface is the output layer + the new page only.

---

## 5. Public UI retired (confirmed)

- **Executive Verdict** — not shown publicly. ✔
- **Institutional Scorecard** (`buildScorecard`) — not shown publicly. ✔
- **Approval-confidence score** (`calcApprovalConfidence`) — not computed or shown in public output; no `/100` or approval-confidence number anywhere in the public render. ✔
- **Report gate / free-report gate** (`gateUsed`/`gateIncrement`/`gateIsFree`) — neutralised to no-ops; the basic Site Check result is not gated. ✔

## 6. Old scoring logic — internal only (confirmed)

`calcApprovalConfidence`, `calcPlanningStrength`, `calcOverlayRisk`, `calcYieldPotential`, `calcHoldingCostRisk`, `calcCouncilComplexity`, `buildScorecard`, and the `CD{}` DA-timeline dataset remain **defined** in `sv-check.js` but are **not called by the public render path**. They are preserved for the future internal Professional Analysis Engine only. The "Opportunity Intelligence" note remains an internal comment. ✔

## 7. Professional Review includes (confirmed)

name ✔ · phone ✔ · email ✔ · property address ✔ · purpose (buy/sell/build/develop/OC handover/external works/not sure) ✔ · notes ✔ · optional upload (plan/title/survey/listing/photos/drawings/council docs) ✔ · wording "We'll review your details and get back to you within 24–48 hours on business working days." ✔

## 8. Site Check includes (confirmed)

address input ✔ · land size input ✔ · frontage input ✔ · user-entered values labelled "User entered — not independently verified" ✔ · map / land view ✔ · What we found ✔ · What this means ✔ · Advantages ✔ · Disadvantages / missing checks ✔ · To add more value ✔ · one Professional Review button ✔ · uncertain parcel shown as "Parcel match not confirmed" + "Professional verification needed" on low confidence ✔ · no upload on Site Check ✔

---

## Tests (headless Chromium, 26 checks — all PASS)
Entry fields present; no upload on Site Check; State B reduced state (Not confirmed ×2 + Professional verification needed + Professional Review button + no score); State A 7 sections + user-entered label + disclaimer + no approval-confidence + no /100 score; low parcel → "Parcel match not confirmed"; Professional Review full form + optional upload + 24–48 business-hours wording + address prefill. `node --check` on sv-check.js: PASS.

**Test boundary (honest):** the private `deploy-check`/`sitecheck-test` were not available to run — Claude Max must run the full private gate before deploy. Live government APIs were not retested because the data engine is unchanged; State A facts were rendered with representative data to verify the output layer only.

## 3. Screenshots (in /shots)
1. `01_desktop_arrival.png` — desktop arrival
2. `02_mobile_arrival.png` — mobile arrival
3. `03_desktop_state_a_high.png` — Site Check with land size/frontage entered (State A)
4. `04_mobile_state_a.png` — mobile State A
5. `05_state_b_reduced.png` — reduced state when land size/frontage missing
6. `06_state_a_low_parcel.png` — State A with low parcel confidence ("Parcel match not confirmed")
7. `07_professional_review.png` — Professional Review form
8. `08_mobile_professional_review.png` — mobile Professional Review

---

## 9. Risk before deploy
1. **Run the private gate** (static 100/100 + browser tests) — required by your process before deploy.
2. **Netlify Forms:** confirm the new `siteverdict-professional-review` form (file upload, `enctype=multipart/form-data`) is detected on deploy. The success path `professional-review-thanks.html` is now included. ✔
3. **NSW data-source licensing:** confirm AddressPoint/Cadastre/Planning endpoints permit commercial use + caching before launch (your check).
4. **Nav consistency:** other pages still link old route names ("Find Out What My Land Can Do"); left untouched to stay in 99C scope — align separately if desired.
5. **Repo vs live:** this build edits the *deployed* files; if your GitHub repo is ahead, diff before applying rather than overwrite.

## 10. Rollback plan
1. The change is **front-end only** (index.html, sv-check.js, new page, version.json). No backend/API/data migration — rollback is immediate.
2. Netlify keeps the previous deploy; **one-click "Rollback to previous deploy"** restores Package 99A instantly.
3. Git equivalent: revert the 99C commit (or redeploy the prior commit) — restores prior index.html + sv-check.js + version.json.
4. The new `professional-review.html` is additive; on rollback it simply becomes an unlinked page (or delete it) — it cannot break the restored Site Check.
5. Verify rollback by checking `/version.json` reads `99A` (`sitecheck-release-check-99`) again and the Site Check renders the prior result.
