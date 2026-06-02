# Package 99C-r7 — Release-Check Fix

`npm run release-check` = `node scripts/release-check.js`, which runs:
  (1) scripts/predeploy.js (static gate)  (2) tests/sitecheck.e2e.spec.js (Playwright)

ROOT CAUSE: the e2e spec was already updated to r7 (passes). The FAILURE was the
STATIC GATE scripts/predeploy.js, hard-wired to Package 99 + the old 3-engine wording.

FILES CHANGED (test/infra + non-UI package-identity markers only — NO product UI):
1. scripts/predeploy.js
   - EXPECTED_PKG '99' -> '99C'
   - REQUIRED_LABELS old 3-engine ('What this may mean','What is still missing')
     -> r7 four sections ('What we found','What this means','What still needs checking','Next useful step')
   - sitecheck_js_size check: version.json (r7) omits the key -> fall back to measuring
     public/assets/sv-check.js file size (>=85000)
   - deploy-check.html package regex '(\d+)' -> '([0-9A-Za-z]+)' so alphanumeric '99C' is captured
   - ADDED r7 forbidden-public-wording guards (no Advantages/Disadvantages headings,
     no 'Find Out What My Land Can Do', no /full-report.html, no 'free report unlocked',
     no 'Register to continue') + Professional Review CTA presence check
2. public/index.html        — build-marker COMMENT (line 2) -> package 99C / build_name r7  (HTML comment, not visible UI)
3. public/netlify/functions/sitecheck-test.js — PACKAGE_NUMBER '99' -> '99C'  (backend test constant)
4. public/deploy-check.html — package match '99' -> '99C'  (deploy-status page logic, not the public Site Check UI)
5. CLAUDE.md                — added 'Hard rules' + 'Package identity rule' governance section (predeploy requires it)

VERIFIED LOCALLY:
- node scripts/predeploy.js  -> PASSED 105 / FAILED 0 / exit 0
- e2e spec vs local-server + public/ -> 28/28 PASS
=> npm run release-check should exit 0 on GitHub Actions.

PRODUCT UI: unchanged. The public Site Check, result sections, Professional Review pages, wording, CTAs are byte-identical to deployed r7.
