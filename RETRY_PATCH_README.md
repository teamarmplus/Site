# 99C-r7 retry patch — public/assets/sv-check.js ONLY

## Proven issue (1000-run)
41 REVIEW rows: 7 layer-timeout, 3 geocode-timeout (transient), 31 geocode-not-found
(all bad-input: addresses with no street number — test-data artifact, not engine).

## Fix (sv-check.js only — no flow/UI/wording change)
- ftx() planning-layer fetch: retry up to 2x (400ms backoff) on timeout, then SAME safe
  empty fallback {features:[]} -> still "Not confirmed" if all retries fail. Never invents data.
- geocodeWithConfidence(): server geocode retries once on network failure before the
  existing browser fallback. found:false / validation logic unchanged.

## After-patch 1000 proof (siteverdict_1000_validation_after_retry.csv)
- BEFORE: PASS 959 / REVIEW 41 / FAIL 0
- AFTER : PASS 969 / REVIEW 31 / FAIL 0
- 7 layer-timeout  -> all 7 PASS
- 3 geocode-timeout -> all 3 PASS
- 31 geocode-not-found -> all 31 still REVIEW; 31/31 have no street number (correct bad-input)
- fake min-lot defaults: 0
- critical FAIL: 0

## Tests
- node --check public/assets/sv-check.js: OK
- predeploy release gate: PASSED 106 / FAILED 0
- Browser/e2e: could not run here (Chromium resource exhaustion after 1000-run); spec unchanged,
  patch does not touch DOM/flow. Re-run e2e in CI to confirm before relying on it.

## Deploy
Replace public/assets/sv-check.js in repo, commit, push. Netlify republishes. No other file changes.
