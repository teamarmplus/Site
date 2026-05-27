# SiteVerdict Operating Principles

## Core principle

**Adaptive usefulness is the key.**
SiteVerdict must not be a static website.
It must become an agentic AI property intelligence machine that improves every day.

---

## Founder principle

**I will not do repeatable work that AI can handle.**

Claude / AI must do the productive work:
- inspect
- test
- detect failure
- find painful user problems
- find missing data
- identify confusing wording
- propose fixes
- make safe patches
- retest
- summarise only what needs founder decision

The founder approves direction, ethics, partnerships, risk, and major product decisions.
The founder does not manually find problems the AI can detect.

---

## What SiteVerdict must adapt around

1. Site Check failures
2. Non-NSW state gaps
3. Data-source changes
4. Old or misleading wording
5. User confusion
6. New property pain points
7. Professional / service / finance pathway opportunities
8. Deployment and test failures
9. Real user enquiry patterns
10. Market and planning data signals

---

## Business mission

Find painful property problems affecting many people.
Solve them with honest, useful, trusted intelligence.
Help people buy, sell, invest, finance, or develop property with less waste and more clarity.

The more value SiteVerdict gives → the more trust it earns.
The more trust it earns → the more value comes back.

This is the ethical AI property machine: not hype, not manipulation, not fake urgency —
a useful machine that solves painful problems at scale.

---

## Every package must include

- Version proof (`/version.json` with `package_number`, `build_time`, `build_name`, file sizes and hashes)
- Deploy check (`/deploy-check.html` with render-level iframe tests via `/sitecheck-render-test.html`)
- Machine test (`/.netlify/functions/sitecheck-test` returning `allPassed`, `failedTests`, `packageNumber`)
- Automated browser tests (`npm run test:sitecheck` via Playwright)
- Timeout protection (`_timeoutId` 20s guard + `ftx()` 9s per NSW fetch + overpass 8s)
- No stuck "Checking…" state
- No misleading state data
- No NSW overlay wording for non-NSW addresses
- No hype or false certainty in any user-facing text

---

## Daily AI operating rule

Every productive session, the AI must answer:

1. **What changed?** (files, logic, wording)
2. **What broke?** (test failures, errors, hangs)
3. **What was fixed?** (root cause + patch applied)
4. **What user / property problem appeared?** (real pain found in data, enquiries, or system)
5. **What opportunity was found?** (new use case, pathway, data source, or service connection)
6. **What should be improved next?** (ranked list, honest about risk)
7. **What decision does the founder need to make?** (ethics, direction, risk, partnership, money)

---

## Safety rules (permanent — never override)

- Do not overclaim zoning, development potential, value, or approval likelihood
- Do not show NSW-specific overlay labels (NSW Planning Portal, NSW EPI Flood, NSW RFS, Section 10.7, LEP minimum lot) for non-NSW addresses
- Do not show "guaranteed", "approved", "certified", "bank approved", "strong buy", or "guaranteed profit"
- Do not expose API keys, database credentials, or private download links in any public file
- Professional verification required statement must appear in every Site Check result
- Every address must end in one of: full report · limited report · clear error. Never stuck.

---

## State coverage honesty (current)

| State | Status |
|---|---|
| NSW | ✓ Deep — zone, MLS, heritage, flood, bushfire, acid sulfate, riparian, FSR, height |
| ACT | ✓ Live — ACTmapi zones + cadastre (indicator only, no LGA) |
| TAS | ✓ Live — LIST TPS zones + cadastre (CC BY 3.0 AU); overlays pending licence |
| VIC | Stub — Vicmap Planning GDB received; PostGIS pending |
| QLD | Stub — QSCF cadastre received; PostGIS pending; 77 councils, no state zone layer |
| SA  | Stub — P&D Code GeoJSON; PostGIS pending |
| WA  | Not yet connected |
| NT  | Not yet connected |

---

*Last updated: see version.json `build_time`*
*Principle version: 1.0*
