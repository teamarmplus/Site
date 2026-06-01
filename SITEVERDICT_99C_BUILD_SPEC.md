# SITEVERDICT_99C_BUILD_SPEC.md

**Version:** clean direction (do not build until approved + live package uploaded)
**Scope:** Site Check page + Professional Review page only.
**Goal:** One clean, app-like Site Check that tells a story — data, meaning, advantage, risk, then help — strong enough to earn trust, ending in a single Professional Review action. No false parcel certainty.

---

## 1. Public flow (two steps only)

1. **Site Check** — the result page (section 2).
2. **Professional Review** — form + optional upload + 24–48 business-hours wording (section 7).

The **Professional Analysis Engine is internal** and out of scope for 99C. There is no public Engine 2/3/4 flow. Upload happens only on Professional Review.

---

## 2. Site Check page structure (in order)

1. **Map / land view** — show the land clearly first.
2. **What we found** — safe facts, each confidence-labelled (section 4).
3. **What this means** — plain-English explanation (section 5).
4. **Advantages** — property-specific, only if supported by data (section 6).
5. **Disadvantages / missing checks** — property-specific (section 6).
6. **To add more value** — one line: "Based on this check, the next useful step is a professional review."
7. **One button:** **Professional Review** → form (section 7).

App feel, not a long report. Short sections. No padding.

---

## 3. Build scope — two entry states

**Inputs (Site Check entry):** property address, land size (m²), frontage (m).

**State A — full result (land size AND frontage provided):**
- User land size + frontage shown, labelled "User entered — not independently verified."
- Detected planning/parcel data shown with confidence labels.
- Auto parcel shown **only as a confidence-labelled preview**, never verified truth. Medium/low confidence → "best match — please confirm" / "Parcel match not confirmed."
- Render sections 1–7.

**State B — reduced result (land size OR frontage missing):**
- Do **not** show a full result. Show only: Land size: **Not confirmed**; Frontage: **Not confirmed**; **Professional verification needed**; **Professional Review** button.
- Do not show confident parcel, land size, frontage, or dimensions. A map may centre on the address with no asserted boundary.

**Live-safety purpose:** remove false confidence from uncertain parcel results now. Anywhere the live product currently shows a confident unverified parcel/size/dimension, replace with the confidence-labelled preview (State A) or the reduced state (State B).

**Constraints:**
- No upload on Site Check (upload is Professional Review only).
- No scoring/backend/result-wording/CTA rewrite beyond the minimum for this layout + safety wording.
- No detected frontage; no edge dimension labels (deferred).
- No schools/shops/transport advantage unless a reliable source already exists and is wired (none today).
- No other states; keep QLD preview safe; no NSW wording for non-NSW.
- No public Engine 2/3/4; no Package 100 work.

---

## 4. "What we found" (State A) — safe data only

Show only what is safely available; label everything; show "Not confirmed" rather than guess.

| Fact | Typical label |
|---|---|
| Land size (m²) | User entered — not independently verified |
| Frontage (m) | User entered — not independently verified |
| Parcel / location confidence | Detected / Estimated / Not confirmed (from 99B) |
| Zone | Detected / Not confirmed |
| Council / LGA | Detected |
| Minimum lot size | Detected / Not confirmed |
| Height limit | Detected / Not confirmed |
| FSR | Detected / Not confirmed |
| Heritage | Detected: none / Detected: listed / Not confirmed |
| Flood / bushfire / constraint | Detected / Not confirmed (only if in data) |

Planning facts come from the existing Site Check planning source (unchanged). Missing fields = "Not confirmed."

---

## 5. "What this means" (State A) — plain English

Readable by an older homeowner. Short sentences, no jargon without explanation. Rules select which points apply; AI only phrases them, never adds facts. Cover only what applies: what the zone means; why land size matters (vs minimum lot size if both known); why frontage matters; what minimum lot size may affect; what any detected heritage/flood/constraint may mean; what is missing before decisions. Always carry the general disclaimer.

---

## 6. Advantages / disadvantages (State A) — rules-driven, data-gated

A line appears only if data supports it. No fabrication, no filler.

**Advantages (if supported):** useful zoning; good land size (user value above minimum lot size, labelled user-entered); good frontage (user value reasonable, labelled user-entered); clean planning data / no obvious detected constraint.
**Excluded in 99C:** schools/shops/transport proximity (no source wired).

**Disadvantages / missing checks (if supported):** parcel match not confirmed; land size/frontage user-entered only (always true — state it); heritage/flood/bushfire not confirmed; narrow frontage (if user value small); drainage/stormwater review (only if a flag exists); slope/earthworks review (only if a flag exists); survey/title/DP/easement check needed; planner/certifier/surveyor may be needed.

Never show a scary disadvantage that is not in the data. "Not confirmed" is a missing-check, not a risk claim.

---

## 7. Professional Review form

Reached from the button in both State A and State B.

Fields: name; phone; email; property address; purpose (buy / sell / build / develop / OC handover / external works / not sure); notes; optional file upload (plan, title, survey, listing, photos, drawings, council documents).

Confirmation: "We'll review your details and get back to you within 24–48 hours on business working days."

Tone: natural, helpful, not pushy. No urgency tactics. No payment before understanding.

---

## 8. Test plan

1. Static gate 100/100.
2. Browser tests pass.
3. Fake-address gate intact (nonsense → clean error, no silent result).
4. One Leaflet map only; no duplicate-map error.
5. State A: sections render in order 1–7.
6. State B: reduced state only; no confident parcel/size/frontage/dimensions.
7. User land size/frontage labelled "User entered — not independently verified" (State A).
8. Auto parcel only ever a confidence-labelled preview; medium/low shows best-match / not-confirmed; never a confident wrong lot; live false-confidence cases removed.
9. "What we found" shows "Not confirmed" for unavailable facts.
10. Advantages/disadvantages data-gated; no schools/shops/transport line.
11. Professional Review form (from both states) has all fields + 24–48 business-hours wording + optional upload.
12. QLD preview safe; no NSW wording for non-NSW.
13. Mobile sticky header does not cover map, facts, result, or button.
14. Disclaimers present (general + boundary/area).
15. No upload on Site Check; no detected frontage; no edge dimensions; no public Engine 2/3/4; no Package 100.

---

## 9. Screenshots before "ready"

Desktop arrival; mobile arrival; desktop State A (high confidence); mobile State A; a medium/low confidence example (148 Canley Vale Road); State B reduced state; Professional Review form.

---

## 10. Approval gate

Do not build until T approves this spec **and** the live Site Check package is uploaded. On both, implement sections 1–7, run section 8, and return section 9 screenshots.
