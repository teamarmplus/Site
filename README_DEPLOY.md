# SiteVerdict 99C-r7 — Consolidated Deploy Package

One package that lands all proven fixes into the repo. Zip root matches the GitHub repo structure exactly.

## What changed (product)
- public/index.html — "Free NSW Site Check" / "Check your land" / subheading "Enter a NSW address. Add your land size and frontage, then see a plain-English Site Check." / trust line "NSW Site Check". Removed NSW-first / Other states / Australia-wide. Larger, cleaner hero.
- public/assets/sv-check.js — (1) map opens on Sydney/NSW (zoom 8, center [-33.87,151.05]); (2) MIN-LOT TRUST FIX: defaults only for residential R1–R6; E/MU/SP/RE/C/RU/unknown zones with no confirmed LEP value show "Minimum lot size: Not confirmed for this zone — Professional verification needed" (no fake 400/450); confirmed LEP values still show for any zone; "What this means" explains when min-lot is not confirmed; (3) removed personal WhatsApp number from the address-not-found card and chatPro() → Professional Review.
- public/assets/sv-layout.css, sv-components.css — hero text larger/cleaner.
- public/terms.html — NSW-only simplified terms; no phone/WhatsApp; static (non-sticky) nav; nav Site Check / Professional Review / Terms.
- public/professional-review.html — nav label fixed to "Site Check" (form logic unchanged).
- public/version.json — build_name sitecheck-release-check-99C-r7; release_note/flags cleaned of "NSW-first".

## What changed (CI / release-check)
- scripts/predeploy.js — EXPECTED_PKG 99→99C; REQUIRED_LABELS → r7 four sections; sv-check.js size fallback; package-number regex accepts alphanumeric; r7 forbidden-wording guards.
- public/netlify/functions/sitecheck-test.js — PACKAGE_NUMBER '99C'.
- public/deploy-check.html — package match '99C'.
- index.html build comment — package 99C / r7.
- CLAUDE.md — Market pain first principle + Hard rules / Package identity rule.

## Tests run (all PASS)
- JS syntax: sv-check.js, predeploy.js, e2e spec, playwright.config — OK.
- npm run release-check static gate (predeploy.js) vs this package: PASSED 106 / FAILED 0 / exit 0.
- e2e spec (tests/sitecheck.e2e.spec.js) vs this package via local-server: 28/28 PASS.
- 15-address live validation (geocode + live NSW layers): 11 non-residential → Not confirmed; 4 residential/real-LEP → correct (Castle Hill 600, Epping 550, Camden 600, Liverpool 1000).
- Grep proof (user-facing files): NSW-first, Other states, other state, Australia-wide, Find Out What My Land Can Do, Professional Pathway, free report unlocked, Register to continue, Executive Verdict, Institutional Scorecard, 0402, wa.me, 61402623628 — all 0.

## GitHub upload
Unzip; the root contains public/, scripts/, tests/, CLAUDE.md, README_DEPLOY.md, TEST_REPORT.md.
Copy these into the repo root so they overwrite the matching files (public/* , scripts/predeploy.js, public/netlify/functions/sitecheck-test.js, public/deploy-check.html, CLAUDE.md, tests/*). Commit all in ONE commit, e.g.:
  "99C-r7: NSW-only homepage + map + min-lot honesty fix + clean Terms + release-check 99C"
Push to main. GitHub Actions runs npm run release-check → should pass. Netlify rebuilds and publishes public/.

## Verify after deploy
- https://siteverdict2.netlify.app/version.json → sitecheck-release-check-99C-r7
- homepage map opens on Sydney/NSW; trust line "NSW Site Check"
- a non-residential address (e.g. an E2/SP site) shows "Minimum lot size: Not confirmed for this zone"
