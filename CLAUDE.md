# CLAUDE.md — SiteVerdict Operating Rules

## Current live baseline

Package 97 is the current live baseline.

Package 97 means:

* Site Check is map-first.
* Base map appears on arrival.
* NSW Site Check works.
* Map appears above result.
* NSW parcel/fact strip appears where data is available.
* QLD preview is safe and does not overclaim planning.
* Result wording, scoring, CTA, and backend logic are unchanged from Package 96.

Protect Package 97 unless T explicitly approves a new package.

---

## Main priority

Focus on Site Check first.

Site Check is the product.

Do not spend time redesigning other pages unless T explicitly asks.

Other pages can stay basic for now.

---

## Product direction

SiteVerdict must become a simple, trusted land-checking app.

NSW first.

The goal is to become more useful than Landchecker by combining:

1. map-first land view
2. parcel boundary
3. land facts
4. planning controls
5. risk signals
6. plain-English explanation
7. honest professional next step

Landchecker shows land.

SiteVerdict must show land and explain what it means.

---

## User standard

Assume the user may be an 80-year-old homeowner.

The experience must be:

* easy to understand in 10 seconds
* map-first
* one clear address box
* one clear button
* no long explanation before action
* readable on mobile
* honest and calm
* not technical unless needed

If an older homeowner would feel confused, the design is not good enough.

---

## Package 98 direction

Package 98 should improve Site Check only.

Possible Package 98 goals:

1. Make the first screen even simpler.
2. Make the map larger and easier to understand.
3. Make the address search more obvious.
4. Make NSW parcel boundary clearer.
5. Make land facts easier to read.
6. Improve mobile usability.
7. Prepare safe approximate frontage/dimension investigation.

Package 98 must not start unless T approves.

---

## Hard rules

Do not change scoring unless T explicitly approves.

Do not change backend/API logic unless T explicitly approves.

Do not change result wording unless T explicitly approves.

Do not change the CTA unless T explicitly approves.

Do not add TAS, VIC, WA, SA, ACT, or NT unless T explicitly approves.

Do not redesign other pages unless T explicitly approves.

Do not claim exact dimensions.

Do not imply development approval.

Do not imply profit.

Do not imply certainty.

Do not remove disclaimers.

Do not commit secrets, API keys, private credentials, or raw spatial datasets.

Do not push to main unless T explicitly approves.

Do not deploy unless T explicitly approves.

---

## Required disclaimer

Use this whenever boundary, area, frontage, or dimensions are shown:

“Approximate boundary and dimensions only — not a survey. Confirm by title plan or licensed surveyor.”

---

## Claude Agent role

Claude Agent is a guard, tester, and reviewer first.

Claude Agent should not change code unless T clearly says the task is approved to build.

Claude Agent should not push to GitHub.

Claude Agent should not deploy.

Claude Agent should not create new features by itself.

Claude Agent should protect the live site and report clearly.

---

## Claude Max role

Claude Max is the builder.

Claude Max can build only after T approves the exact change.

Claude Max must test before presenting a package.

Claude Max must not show T weak work as final.

If something is still obviously weak, Claude Max should say so and propose the smallest safe improvement.

---

## Testing standard

Every serious package must check:

1. version.json package number
2. homepage loads
3. Site Check works
4. NSW map/result works
5. QLD preview remains safe
6. mobile layout is clean
7. fake-address gate works
8. no duplicate Leaflet map error
9. no console error blocks result
10. result wording and CTA remain unchanged unless approved
11. disclaimer remains visible
12. deploy-check page works

---

## Agent report format

Every Claude Agent report must use this format:

1. Live package:
2. What passed:
3. What failed:
4. NSW result:
5. QLD result:
6. Mobile result:
7. 80-year-old homeowner review:
8. Smallest safe next improvement:
9. Code changed? yes/no

If code changed without approval, that is a failure.

---

## Founder principle

Build slowly.

Be honest.

Be useful.

Help people avoid wasting money.

Trust is more important than hype.

Do not decorate SiteVerdict.

Make the engine visible, simple, trusted, and useful.
