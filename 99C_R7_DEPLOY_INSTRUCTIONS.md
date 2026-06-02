# Package 99C-r7 — Deploy Instructions

**Status:** Patched per the r7 correction. No new features.
**Source:** `siteverdict-99C-r7-build.zip` → deploy files are inside `public/`.

---

## CRITICAL deploy-placement fix (why the live site stayed old)

The live site likely stayed on the old version because files were published to the **repo root** while Netlify's **publish directory is `public/`** — so Netlify served the old `public/` contents, not the root.

For r7, the deploy files are placed inside `public/`:
```
public/index.html
public/professional-review.html
public/professional-review-thanks.html
public/version.json
public/assets/sv-check.js
public/assets/sv-tokens.css
public/assets/sv-base.css
public/assets/sv-components.css
public/assets/sv-layout.css
public/assets/sv-print.css
```

**Action:** confirm the Netlify site's **Publish directory** (Site settings → Build & deploy) and put these files there.
- If publish dir = `public/` → commit the files into `public/` (as bundled). Site root will serve `public/index.html`.
- If publish dir = repo root → place the *contents* of `public/` at root instead.
- After deploy, open `/version.json` on the live URL and confirm it reads `sitecheck-release-check-99C-r7`. If it still shows an older build, the files went to the wrong directory.

---

## Pre-deploy confirmations (r7) — verified against package files

| # | Check | Result |
|---|---|---|
| 1 | No "Australia-wide parcel check" wording | PASS |
| 2 | NSW-first wording present ("NSW-first land check. Other states can request Professional Review.") | PASS |
| 3 | No public "Advantages" / "Disadvantages" headings | PASS |
| 4 | Headings are: What we found · What this means · What still needs checking · Next useful step | PASS |
| 5 | Professional Review is the only main CTA | PASS |
| 6 | Professional Review form works (form + action → thanks) | PASS |
| 7 | "within 24–48 hours on business working days" present | PASS |
| 8 | version.json reads `sitecheck-release-check-99C-r7` | PASS |
| 9 | `public/` contains the deploy files | PASS |
| 10 | Screenshots show the updated wording | PASS (see /shots) |

Also carried from r4 (still true): static header (no sticky), Site Check has address+land size+frontage, optional upload only on Professional Review, QLD/non-NSW CTA = Professional Review, no full-report CTA, JS syntax PASS, 21/21 e2e checks PASS.

---

## Deploy steps (Netlify)
1. **Diff first** if your repo is ahead of the live source (this build was made from the live deployed files). Changed in r7: `index.html` (NSW-first tagline), `assets/sv-check.js` (new sections), `version.json`. Unchanged from r4: the two PR pages, `assets/sv-layout.css`, other CSS.
2. Place the `public/` files in the Netlify publish directory (see CRITICAL section).
3. **Run the private gate** (`deploy-check`, `sitecheck-test`, static gate 100/100, browser tests) — required; I cannot run these.
4. Commit/push (Git deploy) or drag the publish-dir contents into Netlify (manual deploy).
5. Confirm Netlify → Forms lists `siteverdict-professional-review` after deploy.

---

## Post-deploy verification (on the live URL)
1. Homepage loads; tagline reads "NSW-first land check…"; no "Australia-wide" text.
2. Site Check works: NSW address + land size + frontage → result with What we found / What this means / What still needs checking / Next useful step.
3. Missing land size/frontage → reduced state (Not confirmed / Professional verification needed + Professional Review button).
4. Professional Review page opens with all fields + optional upload.
5. Form success path → `/professional-review-thanks.html` ("Thank you. We received your request." + 24–48 business-hours wording).
6. `/version.json` → `sitecheck-release-check-99C-r7`.
7. Mobile layout clean; static header covers nothing.
8. Netlify Forms detects the form; send a test submission and confirm receipt.
9. Confirm there is no "Advantages"/"Disadvantages" heading anywhere in the public result.

---

## Rollback
Front-end only. Netlify → Deploys → previous deploy → Publish (restores prior build). Verify `/version.json` reverts. The two PR pages are additive and cannot break a restored Site Check.

## Honest boundary
I verified the r7 items against the package files. I could not run your private gate, and the live government APIs were not re-tested (data engine unchanged). Run the private gate before publishing, then do the live post-deploy verification.
