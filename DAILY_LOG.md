# SiteVerdict Daily Log

---

## Daily Check — 2026-05-26

**Result:** ✓ ALL PASS  
**Time:** 2026-05-26T10:16:39.367Z  
**Target:** https://siteverdict2.netlify.app

### What changed
_(run `git log --oneline -5` for recent commits)_

### What broke
Nothing broke.

### What was fixed
_(add notes manually when applying patches)_

### Property / user problems detected
None detected in this run.

### Opportunities
_(add when user enquiry patterns or data signals are reviewed)_

### What to improve next
All checks passing. Review user enquiries and data freshness next.

### Founder decisions needed
None — AI can proceed without founder input.

_Most recent entries at top. AI runs `npm run daily-check` and writes here.
Founder reviews findings and decisions only — not raw check results._

---

## How to read this log

- ✓ PASS means no problems found
- ✗ FAIL means something broke or is missing
- **Founder decisions needed** = the only items requiring human judgment
- Everything else is handled by AI

---

## First entry — system initialised

**Date:** 2026-05-26  
**Action:** Daily check system created.

### What changed
- Added `PRINCIPLES.md` — core operating document
- Added `scripts/daily-check.js` — agentic daily scan
- Added `DAILY_LOG.md` — this file
- Fixed deploy-check.html iframe: `X-Frame-Options: DENY` was blocking all iframes including same-origin. Fixed by creating `/sitecheck-render-test.html` with `SAMEORIGIN` exception in `netlify.toml`. Previous 7 render-level failures were harness failures, not Site Check failures.
- `addrType` → `_addrType` variable reference fix in sv-check.js state gate
- `_addrForState` / `_isNSWAddr` now defined locally in `_renderResultInner` from `matchedAddr` parameter (were causing ReferenceError in NSW deep check)
- Overpass-api.de fetch wrapped with 8s AbortController (was hanging NSW check)
- Playwright 10/10 tests pass locally against mock server

### What broke
- deploy-check.html was reporting 7 render failures that were actually harness failures (cross-origin block). Root cause: `netlify.toml` sets `X-Frame-Options: DENY` for `/*`. The iframe `sandbox="allow-same-origin"` does not override a server-sent DENY header.

### What was fixed
- `netlify.toml`: added `X-Frame-Options = "SAMEORIGIN"` exception for `/sitecheck-render-test.html` only. Global DENY preserved.
- `deploy-check.html`: now iframes `/sitecheck-render-test.html` (not `/`). Has explicit error message if same-origin access still fails.

### Property / user problems detected
- None in this run.

### Opportunities
- Non-NSW users (VIC, QLD, SA, WA, NT) see a "not yet connected" message. As PostGIS integration is completed for each state, Site Check will return real planning data for those users. QLD and VIC are the next highest-population opportunity.

### What to improve next
1. Deploy package 71 to Netlify (fixes iframe deploy-check + sv-check.js ReferenceError bugs)
2. Verify deploy-check.html passes all render-level checks on live site
3. Add `npm run daily-check` to CI/CD if available
4. Begin VIC PostGIS integration (Vicmap GDB received)

### Founder decisions needed
- [ ] Approve package 71 deploy to Netlify
- [ ] Confirm: continue VIC PostGIS integration next, or focus on something else?
