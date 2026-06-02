# SiteVerdict Release Check — Package 99C-r7

Replaces the outdated Package 99 release-check expectations. **Product UI unchanged.**

## Files
- `tests/sitecheck.e2e.spec.js` — Playwright spec asserting the r7 contract.
- `playwright.config.js` — serves `public/` on :8099 and runs the spec.

## What it asserts (r7 expectations)
- Homepage: NSW-first wording ("Free NSW Site Check" / "NSW-first Site Check"); NO "Australia-wide parcel check" / "any Australian property"; address + land size + frontage inputs; "Check My Land"; no upload on Site Check; no "Find Out What My Land Can Do"; no "free report unlocked" / "Register to continue"; no "Executive Verdict" / "Institutional Scorecard" / "approval confidence".
- `version.json` build_name = `sitecheck-release-check-99C-r7`.
- NSW result: sections What we found / What this means / What still needs checking / Next useful step; no Advantages/Disadvantages; user-entered labels; exactly one Professional Review CTA; no old CTA/score.
- Reduced state (missing land size/frontage): Not confirmed x2 + Professional verification needed + Professional Review.
- Non-NSW (QLD): Professional Review CTA; no old CTA; no NSW confirmed-LEP claim.
- Professional Review page: name/email/address/purpose/notes + optional upload; 24–48 business-hours wording; action -> thanks page.
- Thank-you page exists with confirmation + wording.

## CI note (the actual fix)
The old check failed on outdated Package 99 assertions (old CTA "Find Out What My Land Can Do", "Professional Pathway", forbidden NSW-only wording, old version string, old 3-engine flow). These are replaced above. No product code changed.

## Running
```
npm ci
npx playwright install --with-deps chromium
npx playwright test
```
The config's webServer serves `public/`. In CI, ensure the workflow runs from the repo root and `public/` contains the built site.

## Network determinism
State A exercises the live data engine; the spec stubs geocode + NSW ArcGIS via route interception so the check is deterministic offline. This validates the r7 UI/output contract, not the live data sources (unchanged in r7).
