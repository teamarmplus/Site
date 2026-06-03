# SiteVerdict Internal OS V1 — Test Report

## Architecture
Option A (local file workflow). intake_import.js → enquiries.json → approval_queue.js → prep
sheets + draft emails + quote drafts + queue-index.md. Engine = PR Prep V2 (reused; 39/39 tests).

## Commands run
- node --check intake_import.js / approval_queue.js / pr_prep.js → OK
- node intake_import.js --csv sample-netlify-form-export.csv --out ./output → 8 enquiries
- node approval_queue.js --input ./output/enquiries.json --out ./output --fixtures → queue built

## 8 enquiry test summary (fixture mode)
1. develop, good address (Epping R4)        → PASS/High    → email: PR-offer; quote: Professional Review
2. buy (Parramatta E2)                       → REVIEW/Medium→ email: PR-offer; quote: pre-purchase review
3. sell (Wollongong)                         → BLOCKED/Low  → email: request-more-info; NO quote (correct)
4. OC/external (Newcastle)                   → PASS/Medium  → email: service-pathway; quote: OC external works
5. address not matched (GEORGE STREET)       → BLOCKED/Low  → email: request-more-info; NO quote
6. no-zone develop (100 George St Sydney)    → REVIEW/Low   → email: PR-offer; quote: Professional Review
7. heritage/flood/bushfire (Springwood)      → REVIEW/High  → email: PR-offer; quote: planning/certifier
8. incomplete client details (no address)    → BLOCKED/Low  → email: request-more-info; NO quote

Per case: importer created the enquiry, prep sheet generated, queue includes it, draft email
generated, quote draft generated only when appropriate (5 of 8), status correct, human approval required.

## Safety grep (context-aware; ignores safe negations)
Banned (incl. "automatically sent", "invoice sent"): 0 unguarded hits across 23 output files.
- No email-sending code (sendMail/nodemailer/smtp/.send): 0
- No hardcoded API keys: 0
- All 8 draft emails + 5 quote drafts marked NEEDS HUMAN APPROVAL.
- No real email sent, no invoice issued, no phone/key exposed in code.

## Verdict
READY INTERNAL OS V1. Public deploy needed: No. Zip ready: Yes.

## Limitations
- Manual export step (Option A by design).
- Quote prices/GST/ABN are placeholders ("T to confirm").
- No DA context (DA Leads empty; blocked pending one raw API response).
- Dashboard is the queue-index summary; richer metrics can be added as volume grows.
- Pathways/quotes are heuristic; T confirms before any client contact.
