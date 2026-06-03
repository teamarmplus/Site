# SiteVerdict Internal OS — Queue Bridge + Decision Log (Loop V1)

Connects the existing internal tools into ONE loop. No new public feature. No deploy. No send.
AI prepares · T approves · System records.

## The loop
```
Netlify Professional Review export (CSV)
  → node intake_import.js --csv export.csv --out ./output         → output/enquiries.json
  → node approval_queue.js --input ./output/enquiries.json --out ./output [--fixtures]
        → prep sheets + draft emails + quote drafts
        → output/queue-index.md (human-readable)
        → output/queue.json     (Approval Console schema)   ← THE BRIDGE
  → node approval_console.js --queue ./output/queue.json --out ./output
        → output/approval-console.html (open locally)
  → T decides in the console, then records it:
     node decision_log.js --enquiry ENQ-001 --decision APPROVED_TO_SEND --by T --note "…" --out ./output
        → output/decisions.json (append-only log)
```

## What changed in this version
- `approval_queue.js` now also writes **queue.json** in the Approval Console schema
  (status/baseStatus/confidence/risk/flags/pathway/excerpts/doc links), via `toQueueRecord()`.
- `approval_console.js` reads the **real queue.json** (falls back to sample-queue.json only if absent).
- New **decision_log.js** validates + appends decision records to **decisions.json**.

## queue.json record (Console schema)
enquiry_id · name · email (contact) · phone · address · purpose · status · baseStatus ·
confidence · created_at · action · pathway · risk · flags[] · prep · email_file · quote ·
summary · draft_excerpt · quote_excerpt.

Status derivation: BLOCKED→NEEDS_INFO · REVIEW→WAITING_APPROVAL · PASS+quote→QUOTE_READY · PASS→PREP_READY.
Risk: BLOCKED→urgent · REVIEW→high · PASS+quote→high · else normal.

## Decision record schema (decisions.json)
{ decision_id, enquiry_id, decision, decided_by, decision_note, created_at }
Allowed decisions: APPROVED_TO_SEND · REVISION_REQUESTED · NEEDS_MORE_INFO · PREPARE_QUOTE ·
ARCHIVE · MARK_WON · MARK_LOST. Invalid decisions are rejected.

## Human approval only (never automated)
Sending emails, issuing/sending quotes or invoices, connecting payment, and any
professional/legal/planning/financial statement. The tools record decisions; a human acts.

## Future V3
A small local service that persists decisions live from the console UI, writes status back to
queue.json, and surfaces follow-up reminders — still no public change, still human-approval-gated.
