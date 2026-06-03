# Queue Bridge + Decision Log — Test Report

## What was built
- approval_queue.js extended to emit output/queue.json (Approval Console schema) via toQueueRecord().
- approval_console.js reads the real queue.json (falls back to sample-queue.json only if absent).
- decision_log.js: validates + appends decision records to decisions.json.
- test_queue_bridge.js: proves the full offline loop.

## Commands run
- node --check approval_queue.js / approval_console.js / decision_log.js / test_queue_bridge.js → OK
- node intake_import.js --csv sample-netlify-form-export.csv --out ./output → 8 enquiries
- node approval_queue.js --input ./output/enquiries.json --out ./output --fixtures → queue.json + drafts
- node approval_console.js --queue ./output/queue.json --out ./output → approval-console.html
- node decision_log.js … → decisions.json appended
- node test_queue_bridge.js → 23 passed / 0 failed
- Regression: test_approval_console.js → 20/0 ; pr-prep/test_pr_prep.js → 39/0

## Loop test results (23/23)
intake creates enquiries.json (8) · queue.json created (8) · all console-schema fields present ·
contact email is an email (not a path) · email_file is the draft link · NEEDS_INFO/WAITING_APPROVAL/
QUOTE_READY|PREP_READY all derived · console generated FROM queue.json · console source is queue.json ·
all enquiry ids render · statuses render · banner "nothing sent automatically" · decision schema valid ·
decisions.json appends (2) · decision ids increment · invalid decision rejected · no email-send code ·
no invoice/payment send code · no hardcoded secret · every draft email requires human approval ·
client-facing outputs 0 unguarded unsafe phrases.

## Sample queue item
ENQ-002 Ben Buyer | ben@example.com | WAITING_APPROVAL (base REVIEW) | Medium | risk high |
flags: min_lot_not_confirmed, user_entered_only, quote_needs_price | pathway: Pre-purchase Professional Review.

## Sample decision record
{ "decision_id":"dec-001","enquiry_id":"ENQ-001-alice-resident","decision":"APPROVED_TO_SEND",
  "decided_by":"T","decision_note":"Approved draft after checking address","created_at":"…Z" }

## Limitations
- Console decision buttons remain visual; decisions are recorded via decision_log.js (CLI/programmatic)
  until a V3 backend wires button → log directly.
- Fixture mode used for deterministic offline tests; live mode calls real geocode + NSW layers.
- No DA context (DA Leads empty; blocked pending one raw API response).

## Verdict
READY INTERNAL LOOP V1. Public deploy needed: No. Zip ready: Yes.
