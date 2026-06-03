# DELETE these wrongly-uploaded INTERNAL files from the GitHub REPO ROOT

## Problem
Internal OS files were committed to the **repo root** instead of inside `internal-os/`.
This clutters the repo and risks confusion with the public site. The internal tools must live
ONLY under `internal-os/`. They are NOT part of the public website and must never be in `public/`.

## Safe to delete from the repo ROOT (these are the misplaced copies)
Delete each of the following IF it exists at the repo root (NOT inside internal-os/):

- `approval_queue.js`
- `intake_import.js`
- `pr_prep.js`
- `approval_console.js`
- `decision_log.js`
- `email_quote_manager.js`
- `pr_form_import.js`            (older PR-prep importer, if it was placed at root)
- `test_approval_console.js`
- `test_queue_bridge.js`
- `test_email_quote_manager.js`
- `test_pr_prep.js`
- `enquiry-template.json`
- `sample-queue.json`
- `sample-decisions.json`
- `sample-enquiries.csv`
- `sample-netlify-form-export.csv`
- `approval-console.html`
- `README.md`  ⚠ ONLY if a root README.md was overwritten by an internal one — otherwise KEEP the real repo root README. Verify before deleting.
- `WORKFLOW.md`, `QUEUE_BRIDGE.md`, `APPROVAL_CONSOLE.md`, `EMAIL_QUOTE_MANAGER.md`
- `TEST_REPORT.md`, `TEST_REPORT_APPROVAL_CONSOLE.md`, `TEST_REPORT_QUEUE_BRIDGE.md`, `TEST_REPORT_EMAIL_QUOTE_MANAGER.md`
- `DELETE_ROOT_INTERNAL_FILES.md` (this guide, once cleanup is done)

## Folders to delete from the repo ROOT (misplaced copies)
- `draft_templates/`   (root copy only)
- `fixtures/`          (root copy only — the PUBLIC site has no `fixtures/`; this is internal)
- `output/`            (root copy only — generated internal drafts; should live in internal-os/output/)

## DO NOT TOUCH
- `public/` and everything inside it (the live website).
- `scripts/`, `tests/`, `netlify.toml`, `playwright.config.js`, `package.json` (public build/release).
- The real repo-root `README.md` if it documents the whole repo (verify first).

## How to delete safely (suggested git commands — run locally, review before pushing)
```
# from the repo root, after confirming these are the misplaced ROOT copies:
git rm -r --cached approval_queue.js intake_import.js pr_prep.js approval_console.js \
  decision_log.js email_quote_manager.js pr_form_import.js \
  test_approval_console.js test_queue_bridge.js test_email_quote_manager.js test_pr_prep.js \
  enquiry-template.json sample-queue.json sample-decisions.json sample-enquiries.csv \
  sample-netlify-form-export.csv approval-console.html \
  WORKFLOW.md QUEUE_BRIDGE.md APPROVAL_CONSOLE.md EMAIL_QUOTE_MANAGER.md \
  TEST_REPORT_APPROVAL_CONSOLE.md TEST_REPORT_QUEUE_BRIDGE.md TEST_REPORT_EMAIL_QUOTE_MANAGER.md
git rm -r draft_templates fixtures output     # ROOT copies only
# then add the correct folder:
git add internal-os/
git commit -m "Move internal OS into internal-os/; remove misplaced root copies"
git push
```
⚠ Review `git status` before committing. Only remove ROOT copies — keep everything under `internal-os/`
and everything under `public/`.

## Verify after cleanup
- Repo root no longer contains the files/folders listed above.
- `internal-os/` contains the full tool set (see CLEANUP_README.md).
- `public/` is unchanged; the live site still serves version `sitecheck-release-check-99C-r7`.
