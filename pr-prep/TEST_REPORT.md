# PR-Prep V3 — Test Report

## Scope
V3 connects Professional Review form submissions to the PR Prep V2 engine via CSV export.
Chosen path: Option A (Netlify CSV export → converter → batch). No public UI change. No deploy.

## Form contract (verified live)
Form: siteverdict-professional-review (Netlify Forms, multipart, honeypot bot-field).
Fields: name, email, phone, property_address, purpose, notes, upload.
Purpose values: not_sure, buy, sell, build, develop, oc_handover, external_works.
Importer maps these to engine purposes (oc_handover→oc, external_works→external, not_sure→notsure).

## Tests run
- node --check pr_prep.js / pr_form_import.js / test_pr_prep.js: OK
- node test_pr_prep.js  → 39 passed / 0 failed (33 engine + 6 importer)
- Importer fixture-mode run of 5-row Netlify export: queue generated
- Importer live-mode spot check (45 Oxford St Epping): PASS/High, confirmed LEP 550, mode:live

## 5 test-case results (from sample Netlify export)
A. develop, good address (Epping R4)      → PASS/High   — confirmed LEP 550; planner+surveyor; draft+checklist present
B. buy, good address (Parramatta E2)       → REVIEW/Med  — min-lot Not confirmed (no fake default); planner+conveyancer
C. OC/external (Newcastle MU1)             → PASS/Med    — certifier + drainage/driveway/retaining prioritised
D. incomplete address (GEORGE STREET)      → BLOCKED/Low — asks for complete NSW address; no invented facts
E. heritage/flood/bushfire (Springwood R2) → REVIEW/High — heritage+flood+BAL pathways; overlays risk notes

Every sheet includes: status, verified/detected facts, user-entered (labelled), not-confirmed,
tailored missing-checks, risk notes, professional pathway, internal revenue pathway, draft client
response (no-guarantee wording), and the human-approval checklist.

## Safety grep (context-aware; ignores safe negations)
Banned: guaranteed approval/value/profit, strong buy, certain subdivision, approved potential,
loan approval, investment advice, will be approved, guaranteed outcome.
→ 0 unguarded hits across all generated sheets.

## Queue / index
sample-output/index.md triages enquiries BLOCKED → REVIEW → PASS with contact, purpose, submitted
time, next action, and prep-sheet filename — so T works the most urgent enquiries first.

## Limitations
- Manual export step (Option A): T exports the CSV and runs one command. Webhook automation (Option B)
  is a future option if volume justifies it; it would be backend-only and still not change public UI.
- The form does not collect land size/frontage (those come from the public Site Check); prep sheets
  note them as not provided unless added to the enquiry row.
- No DA context (DA Leads empty; blocked pending one raw API response).
- Pathway/revenue suggestions are heuristic; a human confirms before any client contact.

## Verdict
READY INTERNAL V3. Public deploy needed: No. Zip ready: Yes.
