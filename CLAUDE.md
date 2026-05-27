# SiteVerdict — CLAUDE.md

Project rules for AI autonomous operation. Read this before every task.

---

## Purpose

SiteVerdict is a national Australian property intelligence tool.

People use Site Check before they buy, sell, invest, develop, subdivide, finance, renovate, or engage any property professional.

SiteVerdict must be:
- Useful first — real data that helps real decisions
- Honest always — no hype, no false certainty, no overclaiming
- Adaptive — improve every day based on data and test results
- Professionally caveated — not a planning certificate, not legal/financial advice
- Never misleading — especially about state data availability

## Paid Agent Run Rule

Every paid Claude Agent run must complete one small, specific, testable task tied to a real current SiteVerdict problem.

A valid task must include:
- the exact problem
- why it matters
- allowed files
- acceptance test
- done condition
- rollback/blocker rule

The agent must not spend a run only analysing, rewriting strategy, or expanding the queue unless AGENT_QUEUE.md or RELEASE_STATUS.md is missing/broken.

Each run must end with exactly one of:
- SMALL FIX COMPLETE
- TESTED DOC/POLICY UPDATE COMPLETE
- BLOCKED BUT CONTINUED
- NOT READY

The agent must prefer real immediate problems:
1. release-check failure
2. deploy-check failure
3. Site Check hang
4. non-NSW wrong NSW wording
5. fake address not handled clearly
6. provider/state status unclear
7. protected public route exposure
8. package/version mismatch
9. user-facing wording that overclaims
10. missing professional verification warning

Each task should normally touch no more than 1–3 files.

Every code change must run the relevant test and update DAILY_LOG.md with:
- task picked
- files changed
- test run
- result
- blocker if any
- next task recommendation

---

## Hard rules — never violate

1. **No direct production push.** Always PR → release-check → founder approval.
2. **No zip without passing release-check.** `npm run package:ready` only runs after `release-check` passes.
3. **No raw spatial datasets in public/.** GDB, SHP, GPKG, GeoJSON never go in public/.
4. **No secrets or API keys in any file.** Use `process.env.X` references only. Never hardcode.
5. **No NSW overlay cards for non-NSW addresses.** State gate must prevent this.
6. **No "Checking..." forever.** Every address must end in a result or error card within 25s.
7. **No stale version markers.** All of these must match every release:
   - `public/version.json` package_number
   - `package.json` version
   - `sitecheck-test.js` PACKAGE_NUMBER
   - `predeploy.js` EXPECTED_PKG
   - `public/index.html` build marker comment
8. **No rebuild unless requested.** Smallest safe change that fixes the issue.
9. **Professional verification required** in every Site Check result.
10. **Protected routes must stay blocked:** `/tools`, `/data`, `/docs`, and their subdirs.

---
## How to Work With Claude

Claude must not treat broad requests as permission to make broad changes.

Every task must have:
- one clear goal
- exact scope
- do-not-change rules
- acceptance criteria
- required tests
- output contract
- blocker rule

Claude must prefer small, testable improvements over large changes.

Claude must not mark work ready unless the required tests pass.

Claude must update DAILY_LOG.md after each agent run.

Claude must never expose secrets, deploy production, create ready zips after failed tests, add raw data to public/, or make claims that SiteVerdict cannot verify.

If blocked by founder action, API access, licence terms, payment, or account registration, Claude must update FOUNDER_ACTIONS.md and move to the next safe task.

## National Site Check acceptance criteria

A Site Check is complete only when every Australian address ends in one of:
1. NSW deep report (zone, overlays, parcel data, DA timeline)
2. Connected state report (ACT/TAS with live provider data)
3. Limited state report (VIC/QLD/SA/WA/NT with honest status + missing-data warning)
4. Clear address-not-matched message
5. Clear timeout/error card (SITE_CHECK_TIMEOUT after 20s)

**Never:** empty result, stuck "Checking...", or NSW overlay data shown for non-NSW address.

### Forbidden non-NSW rendered text
- NSW Planning Portal
- NSW EPI Flood
- NSW RFS Bush Fire
- Section 10.7
- LEP minimum lot size
- NSW Planning Portal Layer
- NSW council overlay

---

## Package identity rule

Every package must have all these markers set to the SAME number:

```
public/version.json  → package_number: "N"
package.json         → version: "0.N.0"
sitecheck-test.js    → PACKAGE_NUMBER = 'N'
predeploy.js         → EXPECTED_PKG = 'N'
public/index.html    → <!-- SiteVerdict package N build_time ... -->
```

If any marker does not match → `release-check` must FAIL.

---

## Release workflow

```
AI makes change on branch
       ↓
npm run release-check    ← must pass (static + browser)
       ↓
npm run package:ready    ← only runs if release-check passed
       ↓
Creates: siteverdict-github-ready.zip + RELEASE_PROOF.md
       ↓
PR created (or founder deploys)
       ↓
Founder approves → Netlify deploy
```

If `release-check` fails:
```
npm run package:not-ready
       ↓
Creates: siteverdict-NOT-READY-diagnostics-N.zip (NO deploy)
         NOT_READY_REPORT.md
         TEST_FAILURES.md
         FOUNDER_ACTIONS.md (if founder action needed)
```

---

## AI autonomous limits

- Max 3 repair attempts per session before escalating to founder
- Never push directly to main
- Never deploy to production without founder approval
- Never invent data — only use official/public/verifiable sources
- If blocked on account/API key → document in FOUNDER_ACTIONS.md, continue other work

---

## State data honesty

| State | Current status | What to show |
|---|---|---|
| NSW | Deep live API | Zone, overlays, parcel, heritage, flood, bushfire, DA |
| ACT | Live ACTmapi | ACT zones + cadastre; indicator only; no NSW cards |
| TAS | Live theLIST | TPS zones + cadastre; CC BY 3.0 AU; no NSW cards |
| VIC | Vicmap GDB received | PostGIS pending; honest status; no fake zone |
| QLD | QSCF received | PostGIS pending; no state zone layer (77 councils); honest |
| SA | P&D Code GeoJSON | PostGIS pending; no fake zone |
| WA | SLIP pending account | Not yet connected; honest |
| NT | NTLIS limited | Not yet connected; honest |

---

## When to ask the founder

Only ask for:
- Account registrations that require personal/business login
- API keys that require payment or formal agreement
- Direction decisions (new features, new state priorities)
- Ethics or safety judgments
- Partnership or commercial decisions

Never ask for:
- Manual test runs
- Manual bug discovery
- Repetitive checking work
- Version number updates
- Wording fixes AI can make safely
