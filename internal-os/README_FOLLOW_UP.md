# SiteVerdict Internal OS — Follow-Up + Revenue Control (V1)

The machine that controls the machine. One board that tells T exactly what needs attention today.
INTERNAL ONLY. No automatic emails. No automatic invoices. No automatic trader contact. No deploy.
No public/ change. AI prepares · system organises · T approves · business moves.

## Why this is the next highest-value machine
The business loses money silently when an enquiry, draft reply, quote, trader match, or client
follow-up is forgotten. This board catches every one of those before it goes cold — it ties together
the PR queue, email/quote drafts, and trader lead board into a single "what to do today" view.

## What it tracks
Who needs a reply · who needs more info · who got a draft · who needs a quote follow-up ·
who needs a trader-match follow-up · who waits for T approval · who waits for the client ·
who is won/lost · who to contact again.

## Run
    node follow_up_manager.js --in sample-followups.csv --out follow-up-board.md [--today 2026-06-03]
    node test_follow_up_manager.js     # expect all pass
(In production, feed it a CSV exported/derived from queue.json, decisions.json, the email-manager,
and the trader lead board. Sample data is used here.)

## Statuses
NEW · WAITING_T_APPROVAL · NEEDS_MORE_INFO · RESPONSE_READY · QUOTE_READY · QUOTE_SENT_MANUALLY ·
FOLLOW_UP_DUE · WAITING_CLIENT · TRADER_MATCH_PENDING · CLIENT_CONSENT_NEEDED · JOB_IN_PROGRESS ·
WON · LOST · ARCHIVED. (WON/LOST/ARCHIVED are not "active" and never appear in needs-attention.)

## Timing rules (due date from last touch, else created)
same day: NEEDS_MORE_INFO (blocked/missing details) · 24h: NEW not reviewed ·
48h: response/quote ready not approved · 3 days: quote not followed up ·
7 days: client silent / follow-up due · 14 days: stale → escalates · 30 days: archive/nurture.
Overdue active items escalate in priority (normal→high at 7d, →urgent at 14d).

## Priority
urgent · high · normal · low. The board sorts active items urgent-first, then by overdue, then due date.

## Each item shows
client · suburb · purpose · status · recommended next action (human-approved) · due date · overdue ·
priority · reason · related prep/email/quote/trader-match · revenue placeholder.

## Dashboard
open enquiries · waiting T approval · quote ready · follow-up due · trader match/consent pending ·
won · lost · delayed (overdue active) · revenue opportunities (placeholders) · common service need.

## Revenue control (placeholders only)
Tracks possible review fee / service quote / trader referral and a rev_status
(draft / approved / sent manually / won / lost). No real invoices. No promises. T confirms all amounts.

## Always human-approved
Every next action — sending a reply, a quote, requesting consent, contacting a trader — is a human
step. This tool only reminds and links the right draft. Nothing is sent automatically.

## Limitations
- V1 reads a CSV; wiring it to read queue.json/decisions.json/email-manager/lead-board directly is
  a small next step.
- "today" can be fixed via --today for deterministic runs/tests.
- Revenue figures are placeholders; T confirms.
