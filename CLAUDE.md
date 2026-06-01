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

## External Data Provider Communication Rule

When SiteVerdict contacts a council, state agency, data owner, or API provider — by email, web form, or any written channel — every message must follow these rules.

### What to disclose (truthful, minimal)

- We are building a free public property information tool for Australia
- We display official and open data to help people understand property context before decisions
- We attribute every data source correctly per the applicable licence
- We are a small Australian business (ABN: 42 663 950 070)
- We are requesting access to / confirming licence terms for a specific named dataset

### What not to disclose unprompted

- Internal revenue model or pricing strategy
- Names of other data providers or API keys we hold
- Technical architecture details (PostGIS, Netlify, provider file structure)
- Future product roadmap beyond the immediate request
- That the system uses AI to assist with report drafting

### AI-assisted, not AI-final

If asked about how data is used in reports: *"Our system uses AI to assist with drafting property context summaries. All results carry a professional verification disclaimer and are not presented as planning certificates."*

Never say: "AI generates the reports" or "fully automated" — these overstate and misrepresent.

### Licence-first rule

Before integrating any new data source, confirm in writing (email or documented web page):

1. Licence name and version (e.g. CC BY 4.0, OGL, custom)
2. Whether commercial use is permitted
3. Whether automated point queries are permitted
4. Required attribution text
5. Any rate limits or fair-use obligations

Do not integrate data until at least items 1, 2, and 3 are confirmed. Document the answer in `data/state-source-registry.json` before the provider file is written.

### No raw data resale

SiteVerdict does not sell, redistribute, or sublicence raw datasets. We display derived property-context summaries with attribution. This must be stated if a data owner asks about our distribution model.

### Professional verification always required

Every result shown to end users must carry: *"Not a planning certificate. Professional verification required before any property, finance, or development decision."*

This applies regardless of data quality or source authority.

### Template for outreach emails

Use this structure when writing to a data provider:

> Subject: Data licence clarification — SiteVerdict (ABN 42 663 950 070)
>
> We are building SiteVerdict, a free public property information tool for Australia. We display official open data to help people understand property context before purchase, development, or finance decisions. Every source is attributed per its licence terms.
>
> We would like to confirm the licence terms for: [dataset name and URL]
>
> Specifically:
> 1. Is commercial use permitted?
> 2. Are automated point queries permitted?
> 3. What attribution text is required?
>
> We do not redistribute raw data. Results carry a professional verification disclaimer.
>
> Thank you — [Founder name], SiteVerdict

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
