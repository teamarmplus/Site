# SiteVerdict Internal Operating System — V1

INTERNAL ONLY. Not a public feature. Changes NO public website file. No deploy.
No real emails sent. No real invoices issued. AI prepares · T approves · System records.

## What it does
Turns Professional Review enquiries into a review-ready internal queue: prep sheet + draft email
+ (when suitable) a quote draft per enquiry, triaged for T to approve/edit/reject. Reuses the
proven PR Prep V2 engine (live SV geocode + NSW planning layers; same min-lot honesty rule).

## Architecture (chosen): Option A — local file workflow
CSV/JSON in → markdown prep sheets + drafts + queue-index.md out. Simplest, safest, fastest:
no new infrastructure, no webhook, no public-site change, works today. (Google Sheets/Netlify
webhook/Airtable are later options if volume justifies; all backend-only, none change public UI.)

## Run it (two commands)
    # 1) export Professional Review submissions from Netlify Forms as CSV, then:
    node intake_import.js --csv sample-netlify-form-export.csv --out ./output
    # 2) build the approval queue:
    node approval_queue.js --input ./output/enquiries.json --out ./output
    #    add --fixtures to run fully offline (demo/testing)

Then open **output/queue-index.md** — that's T's console.

## Files
- intake_import.js — Netlify CSV → output/enquiries.json (internal records)
- approval_queue.js — per enquiry: prep sheet + draft email + quote draft (if suitable) + queue-index.md
- pr_prep.js — PR Prep V2 engine (reused; fixture mode kept)
- draft_templates/ — 6 safe email templates (no-guarantee wording, [INTERNAL: human approval required])
- fixtures/ — offline signals for testing
- output/ — generated prep-sheets/, draft-emails/, quote-drafts/, queue-index.md
- enquiry-template.json, sample-netlify-form-export.csv, sample-enquiries.csv
- WORKFLOW.md (full machine + modules), TEST_REPORT.md

## What ALWAYS requires human approval
- Sending any email (tool only drafts; marked NEEDS HUMAN APPROVAL).
- Issuing any quote/invoice (price/GST/ABN = "T to confirm"; never sent).
- Any professional/legal/planning/financial statement (left to licensed professionals).
- Confirming address/parcel and that a pathway fits the client.

## What it never does
Send emails · issue invoices · expose API keys · promise approval/value/profit/loan/outcome ·
change the public site · build a Hot List.

## How it helps T
Open queue-index.md → see who enquired, what property, what they want, what we know, what we don't,
the likely pathway, the ready draft, and whether a quote/referral suits → approve / edit / reject.
AI prepares. T approves. The business moves.

---

## Complete package — run the whole loop from a fresh folder
This folder is self-contained. From a fresh extraction:

    cd internal-os
    node test_queue_bridge.js        # full loop test (expect 23/0)
    node test_approval_console.js    # console test (expect 20/0)

    # or run the loop manually:
    node intake_import.js --csv sample-netlify-form-export.csv --out ./output
    node approval_queue.js --input ./output/enquiries.json --out ./output --fixtures
    node approval_console.js --queue ./output/queue.json --out ./output
    node decision_log.js --enquiry ENQ-001-alice-resident --decision APPROVED_TO_SEND --by T --note "ok" --out ./output

Required files (all included): intake_import.js, pr_prep.js, approval_queue.js, approval_console.js,
decision_log.js, test_queue_bridge.js, test_approval_console.js, sample-netlify-form-export.csv,
sample-enquiries.csv, sample-queue.json, sample-decisions.json, enquiry-template.json,
draft_templates/ (6), fixtures/ (6). No public website files. No secrets. No email/invoice sending.
