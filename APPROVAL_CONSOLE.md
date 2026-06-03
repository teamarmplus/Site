# SiteVerdict Internal OS — Approval Console (V2)

The control room. T opens one HTML file and sees the whole business queue, with AI's prepared
work attached, and decides: approve / edit / reject / quote / follow-up / archive.
INTERNAL ONLY. No server. No email sent. No invoice sent. No payment connected. No public change.
AI prepares · T approves · System records.

## What it is
A static internal HTML dashboard generated from queue data. Open it locally in a browser —
no server needed for V2.

## How to generate
    node approval_console.js --out ./output
    # uses output/enquiries.json if present, else falls back to sample-queue.json
    # or explicitly:
    node approval_console.js --queue sample-queue.json --out .
Then open approval-console.html in a browser.

## What T sees
- Summary cards: new/prep-ready, waiting approval, needs info, quote ready, follow-up due, won,
  lost, opportunities, common purpose, common pathway.
- A triaged table (urgent → high → normal → low) with: ID, client, contact, address, date,
  purpose, status, confidence, revenue/service pathway, recommended action, safety warnings,
  links to prep sheet / draft email / quote draft, and visual decision buttons.
- Per-enquiry preview: AI summary, draft response excerpt, quote draft excerpt, human checklist.

## Statuses
NEW · PREP_READY · NEEDS_INFO · WAITING_APPROVAL · APPROVED_TO_SEND · REVISION_REQUESTED ·
QUOTE_READY · QUOTED · FOLLOW_UP_DUE · WON · LOST · ARCHIVED.

## Priority logic
1 urgent = BLOCKED / address not matched · 2 high = REVIEW or quote-ready · 3 normal = PASS ·
4 low = won/lost/archived.

## Decisions (how they're recorded)
V2 buttons are visual. Decisions are recorded in sample-decisions.json (schema below) and will be
persisted by a future V3 backend.
Schema: { decision_id, enquiry_id, decision, decided_by, decision_note, created_at }
Allowed: APPROVED_TO_SEND · REVISION_REQUESTED · NEEDS_MORE_INFO · PREPARE_QUOTE · ARCHIVE ·
MARK_WON · MARK_LOST.

## Human approval only (never automated in V2)
- Sending any email (console only shows drafts).
- Issuing/sending any quote or invoice (price/GST/ABN = "T to confirm").
- Connecting payment (not connected).
- Any professional/legal/planning/financial statement.

## Safety warnings surfaced
Address not matched · min-lot not confirmed · zone not confirmed · heritage/flood/bushfire
detected · land size/frontage user-entered only · quote needs T price approval · response not
sent automatically · invoice not sent automatically.

## Future V3 backend path
A small local service (or Netlify function + auth) that: persists decisions to a real store,
writes status back to the queue, triggers follow-up reminders, and (only when T explicitly
approves) integrates approved send/invoice. Still no public UI change; still human-approval-gated.
