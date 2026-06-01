# SITEVERDICT_ROADMAP.md

**Version:** clean direction
**Status:** Working roadmap. Build order: Site Check trust first.

---

## Public flow (two steps)

1. **Site Check** — map / land view, What we found, What this means, Advantages, Disadvantages / missing checks, To add more value, one button: Professional Review.
2. **Professional Review** — form, optional file upload, 24–48 business-hours response wording.

The **Professional Analysis Engine is internal only.** No public Engine 2/3/4 flow. Upload only on Professional Review.

---

## Guiding sequence

1. **Site Check trust first** — correct, simple, truthful; remove false confidence from uncertain parcels.
2. Then the internal data foundation (Package 100 packet).
3. Then the internal Professional Analysis Engine.

Nothing later is built until the layer below it is trusted.

---

## Site Check input model

User enters address + land size + frontage. User values are the trust basis, labelled "User entered — not independently verified." Detected planning/parcel data is shown alongside with confidence labels; auto parcel is a confidence-labelled preview, never verified.

If land size or frontage is missing → reduced state (Not confirmed / Professional verification needed / Professional Review button), not a full result.

The explanation (meaning / advantages / disadvantages) sits on the one Site Check page, rules-selected and AI-phrased only, never invented.

---

## Packages

**Package 99C (current focus)** — simplified Site Check + Professional Review path. Two states (full / reduced). No false parcel certainty. Optional upload only on Professional Review. Spec: `SITEVERDICT_99C_BUILD_SPEC.md`. Status: not built — awaiting approval + live package upload.

**Package 99B** — NSW parcel accuracy + confidence: AddressPoint → point-in-polygon containment → confidence scoring → confidence-gated UI. Spec: `SITEVERDICT_99B_BUILD_SPEC.md`. Complementary to 99C; likely ships together. Status: not built.

**Package 100** — internal property data packet (single source of truth): packet schema; Field object (value/label/source/as_at/confidence/notes); validator; result_status (report/limited_report/error); non-NSW safety rule; per-address/session cache; packet built from existing Site Check data. Spec: `SITEVERDICT_ENGINE1_PACKET_SPEC.md`. Status: accepted; not started until the 99 series is finished, tested, and deployed.

**Internal Professional Analysis Engine (after Package 100)** — not public. Consumes Site Check data + Professional Review form + uploads to decide what the client needs, whether SiteVerdict can help or should refer, and what quote/next action to send.

---

## What waits

- Detected dimensions / edge labels — only at high confidence + simple single-ring geometry, "~" format + survey disclaimer, separately approved.
- Detected frontage — deferred; user-entered only until road/address matching is trusted.
- Schools/shops/transport advantages — only when a reliable source is wired.
- Other states (QLD beyond safe preview; VIC/TAS/WA).
- Plan Readiness — shelved (strategy only).

---

## Standing guardrails

Address-specific only; no fabricated/unlabelled data; no approval/profit/certainty claims; no legal/planning/financial advice; no NSW wording for non-NSW; required disclaimers retained; keep Site Check working; no scoring/backend/result-wording/CTA rewrite without explicit approval; confirm NSW data-source licensing permits commercial use + caching before launch; stay correct with NSW and Australian law.
