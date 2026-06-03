# SiteVerdict Internal OS — Cleanup Package

## Why this exists
The internal OS files were uploaded to the **repo root** instead of inside `internal-os/`.
This package delivers the CORRECT structure (everything under `internal-os/`) plus a guide for
deleting the misplaced root copies from GitHub. It does NOT touch `public/`, does NOT change the
live website, and does NOT deploy.

## Correct structure (what this package contains)
```
internal-os/
  intake_import.js          # Netlify CSV export -> enquiries.json
  pr_prep.js                # PR Prep engine (geocode + NSW layers, fixture mode)
  approval_queue.js         # enquiries -> prep sheets, draft emails, quotes, queue.json + queue-index.md
  approval_console.js       # builds approval-console.html from queue.json
  decision_log.js           # records T decisions -> decisions.json
  email_quote_manager.js    # decision-aware high-quality email + quote drafts
  approval-console.html      # generated dashboard (sample)
  draft_templates/           # 6 safe email templates
  fixtures/                  # 6 offline test fixtures
  output/                    # generated internal drafts/queue (sample)
    prep-sheets/ draft-emails/ quote-drafts/ email-manager/
    enquiries.json queue.json decisions.json queue-index.md
  enquiry-template.json
  sample-netlify-form-export.csv
  sample-enquiries.csv
  sample-queue.json
  sample-decisions.json
  README.md WORKFLOW.md QUEUE_BRIDGE.md APPROVAL_CONSOLE.md EMAIL_QUOTE_MANAGER.md
  TEST_REPORT*.md
  test_pr_prep.js? (lives in pr-prep/) — internal-os tests:
  test_approval_console.js test_queue_bridge.js test_email_quote_manager.js
  DELETE_ROOT_INTERNAL_FILES.md   # which ROOT files to delete from GitHub
  CLEANUP_README.md               # this file
```

## How to apply the cleanup
1. Read `DELETE_ROOT_INTERNAL_FILES.md` and remove the misplaced files/folders from the repo ROOT.
2. Ensure this `internal-os/` folder is committed as-is.
3. Confirm `public/` is untouched and the live site still serves `sitecheck-release-check-99C-r7`.

## Prove the tools still work after the move (from a fresh extraction)
```
cd internal-os
node test_queue_bridge.js          # expect 23/0
node test_approval_console.js      # expect 20/0
node test_email_quote_manager.js   # expect 29/0
```
Or run the full loop:
```
node intake_import.js --csv sample-netlify-form-export.csv --out ./output
node approval_queue.js --input ./output/enquiries.json --out ./output --fixtures
node approval_console.js --queue ./output/queue.json --out ./output
node email_quote_manager.js --queue output/queue.json --decisions output/decisions.json --out output/email-manager
```

## Rules respected
No `public/` change. No live website change. No deploy. No emails/invoices sent. No payment connected.
AI prepares · T approves · System records.
