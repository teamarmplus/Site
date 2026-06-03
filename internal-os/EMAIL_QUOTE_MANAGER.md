# SiteVerdict Internal OS — Email + Quote Draft Manager (V2)

Connects to the internal queue and prepares high-quality, ready-to-edit client drafts.
INTERNAL ONLY. No email sent. No invoice sent. No payment/Stripe/Xero/QuickBooks. No public change.
AI prepares · T approves · Nothing leaves the company without human approval.

## What it does
Reads queue.json (+ decisions.json) and, per enquiry, generates the RIGHT draft for the current
state: an email, a quote draft where suitable, and a follow-up where suitable — into one indexed folder.

## Run
    node email_quote_manager.js --queue output/queue.json --decisions output/decisions.json --out output/email-manager

Generates:
    output/email-manager/email-index.md      (triaged overview — start here)
    output/email-manager/emails/<id>.md       (one selected draft per enquiry)
    output/email-manager/quotes/<id>.md        (where appropriate)
    output/email-manager/followups/<id>.md     (where appropriate)

## Draft types (chosen automatically)
1. Acknowledgement — generic/notsure enquiries.
2. More information needed — BLOCKED / incomplete address.
3. Professional Review offer — develop/build/buy/sell.
4. External works / OC / civil pathway — oc/external.
5. Referral / professional pathway — when a specialist is the step.
6. Not suitable — polite, helpful decline.
7. Follow-up — gentle nudge / after a win.
8. Quote draft — internal only, never sent.

## How decisions steer drafts (reads decisions.json)
- NEEDS_MORE_INFO → more-info email
- APPROVED_TO_SEND → final response draft (email type by purpose)
- PREPARE_QUOTE → quote draft + matching email (OC/external → service-pathway)
- REVISION_REQUESTED → internal revision note (no client email)
- ARCHIVE / MARK_LOST → no active email
- MARK_WON → follow-up/next-steps draft
If no decision yet, the draft is derived from the queue status.

## Email quality standard
Subject · first-name greeting · property address · short warm acknowledgement · what we confirmed ·
what still needs checking · recommended next step · preliminary/not-advice line · human-approval note.
Warm and concise, ready to send after light editing — not robotic, not a wall of disclaimer.

## Quote quality standard
Quote ID · client · address · proposed service · scope · deliverables · assumptions · exclusions ·
price/GST/ABN/payment-terms/validity placeholders (all "T to confirm") · required client info ·
human approval checkboxes. No invoice, no payment link, no automatic sending.

## How T uses it
Open email-index.md → see who needs a reply, which draft is ready, which quote is ready, what needs
approval, what to follow up. Open the draft, edit lightly, send manually. Record the decision with
decision_log.js. AI prepares; T approves; business moves.

## Safety
No SMTP/Gmail send, no invoice/Stripe/Xero/QuickBooks/payment code, no secrets, no public files.
All client-facing drafts carry no-guarantee wording and a human-approval gate.
