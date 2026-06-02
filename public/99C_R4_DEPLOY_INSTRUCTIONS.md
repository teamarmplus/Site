# Package 99C-r4 — Deploy Instructions

**Status:** Approved for private gate / deploy review. No new features.
**Source:** `siteverdict-99C-r4-build.zip` → `package99c/`

---

## CRITICAL: deploy the CONTENTS of package99c/ as the site root

Publish the **files inside** `package99c/`, not the `package99c/` wrapper folder.

Correct site-root layout after deploy:
```
/index.html
/professional-review.html
/professional-review-thanks.html
/version.json
/assets/sv-check.js
/assets/sv-tokens.css
/assets/sv-base.css
/assets/sv-components.css
/assets/sv-layout.css
/assets/sv-print.css
```
Wrong (do NOT do this): `/package99c/index.html` — this breaks `/assets/...` paths and the homepage.

---

## Pre-deploy confirmations — ALL PASS (verified against package files)

| # | Check | Result |
|---|---|---|
| 1 | version.json reads `sitecheck-release-check-99C-r4` | PASS |
| 2 | JS syntax (`node --check assets/sv-check.js`) | PASS |
| 3 | No "Find Out What My Land Can Do" / no "free report unlocked" / no full-report CTA | PASS |
| 4 | Professional Review form exists (`name="siteverdict-professional-review"`) | PASS |
| 5 | `professional-review-thanks.html` exists | PASS |
| 6 | Sticky header removed — nav is `position:static` | PASS |
| 7 | QLD/non-NSW preview CTA = Professional Review | PASS |
| 8 | Site Check has address + land size + frontage inputs | PASS |
| 9 | Professional Review has optional file upload | PASS |
| 10 | "within 24–48 hours on business working days" present (form + thanks) | PASS |

---

## Deploy steps (Netlify)

### Option A — Git-based deploy (preferred if the repo drives Netlify)
1. **Diff first.** This build was made from the *live deployed* source. If your GitHub repo is ahead of live, diff each changed file before committing rather than overwriting. Changed files: `index.html`, `assets/sv-check.js`, `assets/sv-layout.css`, `version.json`; new files: `professional-review.html`, `professional-review-thanks.html`.
2. Apply the changes to the repo so the repo root mirrors the site-root layout above.
3. **Run the private gate** (`deploy-check`, `sitecheck-test`, static gate 100/100, browser tests) — required by process; I could not run these.
4. Commit and push to the production branch; let Netlify build/deploy.

### Option B — Direct drag-and-drop deploy
1. Unzip `siteverdict-99C-r4-build.zip`.
2. Open the `package99c/` folder and select **its contents** (index.html, the two PR pages, version.json, assets/ — not the folder itself).
3. Drag those contents into the Netlify deploy drop zone for the siteverdict2 site.
4. Confirm the deployed file tree shows `/index.html` and `/assets/...` at root.

### Netlify Forms note
The Professional Review form uses Netlify Forms with file upload:
- Form name: `siteverdict-professional-review`, `method="POST"`, `data-netlify="true"`, `enctype="multipart/form-data"`, hidden `form-name`, honeypot `bot-field`.
- Success path: `action="/professional-review-thanks.html"` (included).
- Netlify detects forms from the deployed HTML. On a **drag-and-drop** deploy this works directly. If the site is built by a JS framework/bundler, ensure the static form markup is present in the published HTML (it is, in `professional-review.html`). After first deploy, confirm the form appears under **Netlify → Forms**.

---

## Post-deploy verification (run on the live URL)

| # | Check | How |
|---|---|---|
| 1 | Homepage loads | open `/` — hero + address/land size/frontage inputs render |
| 2 | Site Check works | enter a real NSW address + land size + frontage → State A result with the 7-part story |
| 3 | Missing land size/frontage → reduced state | enter address only, leave land size/frontage blank, click → "Land size: Not confirmed / Frontage: Not confirmed / Professional verification needed" + Professional Review button |
| 4 | Professional Review page opens | click the Professional Review button → `/professional-review.html` loads with all fields + optional upload |
| 5 | Form success path | submit the form → lands on `/professional-review-thanks.html` ("Thank you. We received your request." + 24–48 business-hours wording) |
| 6 | version.json shows 99C-r4 | open `/version.json` → `sitecheck-release-check-99C-r4` |
| 7 | Mobile layout clean | open `/` on a phone (or device emulation) → static header at top, nothing covered, inputs/map/result/button clear |
| 8 | Netlify Forms detects the form | Netlify dashboard → Forms → `siteverdict-professional-review` listed; send a test submission and confirm it arrives |

Extra spot-checks: a non-NSW address (e.g. a QLD one) shows the "planning zone data not yet connected" preview with a **Professional Review** CTA (no NSW overclaim); the header does not cover content on any page.

---

## Rollback (if anything fails post-deploy)
- Front-end only — no backend/API/data migration. Rollback is immediate.
- Netlify → Deploys → previous deploy → **Publish deploy** (restores Package 99A).
- Git: revert the 99C-r4 commit (or redeploy the prior commit).
- The two new PR pages are additive; on rollback they become unlinked (or delete them) and cannot break the restored Site Check.
- Verify rollback: `/version.json` reads the prior 99A build name again and Site Check renders the previous result.

---

## Honest boundary
I verified the 10 pre-deploy items directly against the package files (results above). I could **not** run your private `deploy-check`/`sitecheck-test`, and the live government APIs were not re-tested because the data engine is unchanged. Run the private gate before publishing, and do the post-deploy verification on the live URL.
