# CLAUDE.md — SiteVerdict Project Context

This file gives any new session the current, authoritative picture of SiteVerdict. Read it first. Where it conflicts with older notes, this file wins.

## What SiteVerdict is

A land/site intelligence platform that helps people understand their land and avoid wasting money. It gives useful data and plain-English meaning first, and earns trust before any paid help.

SiteVerdict is **not** publicly branded as Sydney Home Improve. Sydney Home Improve may support fulfilment behind the scenes only.

## Foundation

- Eightfold Path (see `AI_WORKING_STYLE.md`).
- Trust first. Give first. Site Check first.
- Simple, useful, helpful, truthful, low-harm.
- Goal: Site Check should be better than Landchecker for NSW first — better meaning honest confidence, clear meaning, and a safe next step, not just more data.
- The public flow must be simple enough for a normal homeowner (including an 80-year-old).

## Public model (two steps only)

**1. Site Check** — one app-like page:
- map / land view
- What we found
- What this means
- Advantages
- Disadvantages / missing checks
- To add more value
- one button: **Professional Review**

**2. Professional Review** — page/form:
- form (name, phone, email, address, purpose, notes)
- optional file upload (plan, title, survey, listing, photos, drawings, council documents)
- response wording: "We'll review your details and get back to you within 24–48 hours on business working days."

There is **no public Engine 2 / 3 / 4 flow.** Upload happens **only** on Professional Review, never on Site Check.

## Internal: Professional Analysis Engine

Internal only — not a public page. It reads Site Check data, form details, user purpose, notes, and uploaded files, then helps SiteVerdict decide: what the client is trying to do, what is missing, what professional/service is needed, whether SiteVerdict can help directly or should refer, and what quote/next action to send.

## Confidence labels (always used)

Detected / Estimated / Not confirmed / User entered — not independently verified / Professional verification needed.

## Required disclaimers

- "Preliminary information only. Professional verification required before decisions or spending money."
- For boundary/area/frontage/dimensions: "Approximate boundary and dimensions only — not a survey. Confirm by title plan or licensed surveyor."

## Essential safety rules

- Address-specific only; never a generic answer for all properties.
- Never invent data; no blank unlabelled fields.
- No approval, profit, development-rights, or certainty claims.
- No legal/planning/financial advice.
- No scary risk unless it is in the property data.
- No payment or pressure before basic understanding.
- No NSW-specific wording for non-NSW addresses; keep QLD preview safe.
- Auto parcel detection is a confidence-labelled preview, never verified truth.
- Stay correct with NSW and Australian law. Confirm public NSW data-source terms allow commercial use + caching before launch.

## Current build state

- **Package 99C (current focus)** — simplified Site Check + Professional Review path. Specced in `SITEVERDICT_99C_BUILD_SPEC.md`. Not built — awaiting approval and upload of the live Site Check package.
- **Package 99B** — NSW parcel accuracy + confidence (AddressPoint → containing lot → confidence). Specced in `SITEVERDICT_99B_BUILD_SPEC.md`. Complementary to 99C; likely ships together. Not built.
- **Package 100** — internal property data packet (single source of truth). Architecture accepted in `SITEVERDICT_ENGINE1_PACKET_SPEC.md`. Not started until the 99 series is finished, tested, and deployed.

## Verified technical note

Live NSW data check on 148 Canley Vale Road: a generic geocoder returns a road-centreline point that lands in zero lots; the authoritative NSW AddressPoint resolves to a point contained by exactly one lot (6/17/DP728). Title status does **not** disambiguate nearby lots — point-in-polygon containment does. Land area is uncertain (planlotarea null; geometry vs shape_Area disagree), so land area is always labelled Estimated, never Detected.

## Document index

- `AI_WORKING_STYLE.md` — how Claude works with T.
- `CLAUDE.md` — this file; current project context.
- `SITEVERDICT_99C_BUILD_SPEC.md` — current build spec.
- `SITEVERDICT_ROADMAP.md` — build order and what waits.
- `SITEVERDICT_99B_BUILD_SPEC.md` — parcel accuracy + confidence (related).
- `SITEVERDICT_ENGINE1_PACKET_SPEC.md` — Package 100 architecture (related).
