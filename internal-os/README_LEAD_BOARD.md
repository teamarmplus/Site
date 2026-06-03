# SiteVerdict — Trusted Trader Lead Board (V1)

INTERNAL-FIRST business system. Not a public marketplace. Not HiPages. No public/ change. No deploy.
No client details sent. No trader contacted automatically. No lead selling.
Core: AI prepares · T approves · trader expresses interest · client consents · only then details shared.

## Why not HiPages
HiPages-style problems: too many bad leads, traders pay for junk, users get poor service, weak quality
control. SiteVerdict model: fewer but better opportunities · verified traders only · client details
protected · human approval · feedback loop · bad behaviour punished · quality traders rewarded.

## Workflow
PR enquiry → AI classifies need → AI creates a job lead card (client details HIDDEN) → T reviews →
T publishes internally to approved traders → traders express interest (no client data) →
T shortlists/selects → client consents → details released only after all gates pass →
feedback collected → trust score updates → bad traders suspended/banned.

## Files
- lead_board.js — job lead cards (client details hidden), statuses, consent gate
- lead_matcher.js — rank interested traders into a shortlist (never-shortlist guards)
- trader_portal_mock.js — read-only client-safe preview a trader would see (proves no PII)
- test_lead_board.js — 12+ tests incl. privacy + consent gate + safety
- sample-job-leads.csv, sample-trader-interests.csv — sample data (no client PII)
- sample-lead-board.md — generated board (T-facing)
- trader-agreement-rules.md, client-consent-rules.md — policy
- Reuses: trader_registry.js, trader_feedback.js, trader_matcher.js, sample-traders.csv, reviews.csv

## Run
    node lead_matcher.js --traders sample-traders.csv --reviews reviews.csv --leads sample-job-leads.csv --interests sample-trader-interests.csv --out sample-lead-board.md
    node trader_portal_mock.js --leads sample-job-leads.csv
    node test_lead_board.js     # expect all pass

## Lead statuses
DRAFT · NEEDS_T_REVIEW · APPROVED_FOR_TRADER_VIEW · TRADER_INTEREST_OPEN · TRADER_INTEREST_RECEIVED ·
T_REVIEWING_TRADERS · CLIENT_CONSENT_NEEDED · MATCH_APPROVED · DETAILS_RELEASED · IN_PROGRESS ·
COMPLETED · CLIENT_UNHAPPY · DISPUTED · CLOSED_WON · CLOSED_LOST · ARCHIVED.

## Consent gate (all required to release client details)
T approval · selected trader · client consent · trader agreement accepted · privacy warning acknowledged.
If any missing → "Client details must remain hidden."

## User protection
Slow trader → marked, offer next. No-show → complaint recorded, reliability drops, possible suspension.
Client unhappy → collect feedback, review, offer another suitable option if available, flag trader.
Lies / bad treatment → suspend or ban. (All status changes are T decisions; the system proposes.)

## Fair revenue model (T confirms; nothing locked in)
Client match is free · no charge for unsuitable leads · success-based trader contribution where
appropriate (only if a job is accepted/won, clear terms) · Professional Review remains a paid option ·
service-coordination fee possible later if SiteVerdict actively coordinates · commercial terms to be
confirmed by T. No guaranteed-job/result/price/quality claims.

## Always human-approved
Publishing a lead · shortlisting/selecting a trader · releasing client details (with consent) ·
trader status changes · the commercial model.

## Later (only when ready)
A public/portal version comes later, only after: traders verified · rules accepted · consent flow
proven · feedback loop proven · bad traders removable · T controls quality.
