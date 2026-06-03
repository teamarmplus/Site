# Professional Review — Form-to-Prep Workflow (V3)

The paid-work machine: a Professional Review enquiry becomes a review-ready internal prep sheet
with one command. No public UI change, no deploy.

## End-to-end flow
1. A user submits the public Professional Review form (Netlify Forms: "siteverdict-professional-review").
2. T exports submissions from Netlify  →  CSV.
3. T runs: `node pr_form_import.js --in <export>.csv --out ./pr-prep-output`
4. The importer maps each row → runs the PR Prep engine (live SV geocode + NSW layers) → writes
   one prep sheet per enquiry + an internal queue `index.md` (triaged BLOCKED → REVIEW → PASS).
5. A human opens the queue, reviews each prep sheet, edits the draft response, and sends it.
6. (Later) approved responses + outcomes feed the learning loop.

## How to export from Netlify Forms
Netlify dashboard → your site → Forms → "siteverdict-professional-review" → Export/Download CSV.
Columns exported match the form field names: name, email, phone, property_address, purpose, notes
(plus a "Submitted At" metadata column). The importer tolerates the metadata column and minor
header variations.

## Purpose mapping (form value → engine purpose)
not_sure→notsure · buy→buy · sell→sell · build→build · develop→develop ·
oc_handover→oc · external_works→external

## Why Option A (CSV export → converter → batch)
Chosen for V3 because it is the simplest reliable path: no new infrastructure, no webhook to
deploy, no public-site change, works today, and matches the goal — T exports, runs one command,
gets a queue. A webhook function (Option B) can come later if real volume justifies automation;
it would be a backend-only addition and still must not change public UI.

## Statuses in the queue
- BLOCKED: address not matched / core data unavailable — reply asking for a complete NSW address first.
- REVIEW: usable but needs human attention (not-confirmed min-lot, overlays, develop intent with missing controls, low/approximate confidence).
- PASS: enough verified/detected data to approve a useful draft.

## What a human MUST do
- Work the queue top-down (BLOCKED first). Re-read every "Not confirmed" item.
- Confirm address/parcel, confirm the pathway fits the client's goal/budget.
- Remove anything implying a promised result/value/profit/loan/financial recommendation.
- Approve and send — NEVER auto-send. Section I (revenue pathway) is internal only.

## Offline / testing
Add `--fixtures` to map known sample addresses to saved fixtures so the workflow runs with no
internet (used by the test suite and for demos).
