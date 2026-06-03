# SiteVerdict — Internal Professional Review Prep Engine (v2)

INTERNAL OPERATING TOOL. Not a public feature. Changes NO public website file. No deploy.
Professional Review is how SiteVerdict turns free Site Check users into paid/helpful work —
this engine prepares each enquiry so T can respond faster, more professionally, with less effort.

## What it does
Enquiry -> Site Check data -> verified/detected facts -> user-entered facts -> not-confirmed facts
-> missing checks -> risk notes -> professional/service pathway -> revenue/action pathway (internal)
-> draft response -> human approval -> client response.

It reuses the SAME live data the public Site Check uses (SV geocode + NSW ePlanning layers) and the
SAME min-lot honesty rule (no fake defaults for non-residential zones). Never invents data; never
guarantees outcomes.

## Two modes
- LIVE mode (default): calls live SV geocode + NSW planning layers.
- FIXTURE mode (offline): uses saved JSON in fixtures/ so tests pass with no internet.

## Run one enquiry (live)
    node pr_prep.js --address "45 Oxford Street Epping NSW 2121" --purpose develop --block 580 --front 15 --out ./pr-prep-output

## Run from JSON
    node pr_prep.js --file enquiry-template.json --out ./pr-prep-output

## Run a batch (CSV)
    node pr_prep.js --batch sample-enquiries.csv --out ./pr-prep-output
CSV columns: name,email,phone,address,purpose,block,front,notes
Batch writes index.md (client, address, purpose, status, confidence, next action, file).

## Run a fixture (offline)
    node pr_prep.js --fixture fixtures/residential-r4-epping.json --out ./pr-prep-output

## Run tests (offline, fixture mode)
    node test_pr_prep.js
33 assertions across 8 scenarios. Must be 33/0 before trusting a change.

## Statuses
- PASS    — enough verified/detected data to prepare a useful draft.
- REVIEW  — usable but needs human attention first (not-confirmed min-lot, overlays detected,
            develop intent with missing control, or low/approximate confidence).
- BLOCKED — address not matched or core data unavailable; ask the client for a better address first.
(Address-not-matched is BLOCKED, never a normal REVIEW.)

## Purpose intelligence
buy (planner/conveyancer/surveyor before exchange; no buy recommendation) · sell (data summary;
no valuation/price claim) · build (planner/certifier/builder/surveyor) · develop (planner first,
surveyor second; no potential certainty unless verified) · oc (certifier + external works/drainage/
driveway/landscaping/retaining/access) · external (civil/external works/stormwater/driveway/retaining)
· notsure (first-step triage).

## How to read a prep sheet
Section A (exec summary for T) gives status, confidence, recommended action at a glance.
B = goal, C = verified/detected, D = user-entered, E = not confirmed, F = missing checks,
G = risks, H = professional pathway, I = revenue pathway (INTERNAL), J = draft response, K = approval checklist.

## What a human MUST verify before sending
- Confirm address/parcel. Re-read every "Not confirmed" item. Remove any unsupported claim.
- Confirm pathway fits the client's goal and budget. Decide paid review / quote / referral.
- NEVER auto-send. A human approves and sends.

## Internal only
Section I (Revenue/action pathway) is internal — do not paste to the client unless rewritten professionally.

## What can be copied to the client
Section J (Draft response), after human approval and edits.

## How this supports paid Professional Review
It turns each free enquiry into a ready-to-action, honest, professional response with a clear next
step — reducing founder workload and surfacing when work can become a paid review, quote, or referral.

---

## V3 — Form import (the paid-work machine)
Turn Netlify Professional Review submissions into a review-ready queue:

    # export submissions from Netlify Forms as CSV, then:
    node pr_form_import.js --in sample-netlify-form-export.csv --out ./pr-prep-output

Produces one prep sheet per enquiry + index.md (triaged BLOCKED → REVIEW → PASS).
See FORM_WORKFLOW.md for the full operator flow. Add --fixtures for offline runs.
