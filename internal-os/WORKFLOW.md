# SiteVerdict Internal OS — Workflow (V1)

Core rule: **AI prepares · T approves · System records.**
AI never sends final emails, never issues invoices, never gives professional/legal/planning/
financial advice, and never promises outcomes. A human approves every external action.

## Full business machine — first visit to paid work
```
1.  User runs public Site Check (Site Check → Professional Review)
2.  User submits Professional Review form (Netlify Forms)
3.  T exports submissions → CSV
        │
        ▼  node intake_import.js --csv export.csv --out ./output
4.  AI creates internal enquiry records (output/enquiries.json)
        │
        ▼  node approval_queue.js --input ./output/enquiries.json --out ./output
5.  AI classifies enquiry (purpose) + sets status PASS / REVIEW / BLOCKED
6.  AI identifies missing data (tailored checklist)
7.  AI suggests professional/service pathway
8.  AI drafts client response (template chosen by status/purpose)
9.  AI prepares a quote DRAFT when a paid pathway suits (none if BLOCKED/triage)
        │
        ▼  T opens output/queue-index.md
10. T reviews each prep sheet → approve / edit / reject
11. T approves the draft email (and quote, if any) — confirms price/scope
12. T sends the approved response/quote (manually — tool never sends)
13. T schedules follow-up (24h missing info · 48h after draft · 7d after quote · 14d no-response)
14. Outcome logged (New → Prep Ready → Waiting Approval → Sent → Quoted → Won / Lost / Archived)
15. Learning loop: data gaps, address issues, common goals/pathways/councils feed improvements
```

## V1 modules (this build)
- Enquiry Inbox → enquiries.json + queue-index.md (status, priority by triage, client, address, purpose, date, next action)
- PR Prep Engine → pr_prep.js (V2, reused) — verified/user-entered/not-confirmed facts, missing checks, risks, pathway, draft, approval checklist
- Approval Console → queue-index.md approve/edit/reject boxes per enquiry
- Client Response Drafts → draft_templates/ (6) chosen automatically by status+purpose
- Quote/Invoice Prep → quote drafts (price/GST/ABN = "T to confirm"); never sent
- Service/Professional Triage → pathway + internal revenue pathway in each prep sheet
- Follow-Up System → timings above (manual approval before any external message)
- Dashboard → queue-index summary (counts by status; extend with metrics as volume grows)
- Validation/Learning Log → enquiries.json + outputs are the raw log for the learning loop

## Statuses
PASS = enough verified/detected data to approve a useful draft.
REVIEW = usable but needs human attention (not-confirmed min-lot, overlays, develop intent with missing controls, low confidence).
BLOCKED = address not matched / core data missing → ask for a complete NSW address first (no quote).
