# Trusted Trader Lead Board V1 — Test Report

## What was built
Internal lead board: job lead cards with client details HIDDEN, lead statuses, a client-consent gate,
an interest matcher/shortlist with never-shortlist guards, and a read-only trader portal mock that
proves no client PII reaches a trader. Reuses the trader registry/feedback/matcher. Sample data only.

## Commands run
- node --check lead_board.js / lead_matcher.js / trader_portal_mock.js / test_lead_board.js → OK
- node lead_matcher.js --traders sample-traders.csv --reviews reviews.csv --leads sample-job-leads.csv --interests sample-trader-interests.csv --out sample-lead-board.md
- node trader_portal_mock.js --leads sample-job-leads.csv
- node test_lead_board.js → 18 passed / 0 failed

## 12 test cases (+ guards)
1 drainage lead card hides client details ✓
2 driveway lead card hides client details ✓
3 trader interest/preview reveals NO client details ✓
4 approved trader can be shortlisted ✓
5 banned trader cannot be shortlisted ✓
6 suspended trader cannot be shortlisted ✓
7 wrong-category trader cannot be shortlisted ✓
8 outside-area trader cannot be shortlisted ✓
9 details cannot be released without T approval ✓
10 details cannot be released without client consent ✓
11 client-unhappy feedback flags trader ✓
12 no suitable trader → "No suitable verified trader yet" ✓
Bonus: high-risk excavation with banned-only interest → empty shortlist ✓; all-gates → release allowed ✓;
rendered board keeps client details hidden (no @email / no phone) ✓.

## Safety grep (context-aware)
Banned: guaranteed best trader / cheapest / quality / result, no risk, client details sent automatically,
lead sold automatically, payment guaranteed, job guaranteed → 0 unguarded hits.
No email/SMS/auto-contact code. No payment/lead-sale code. Sample data only (no client PII).

## Sample lead board summary
6 leads rendered. Each card shows a trader-safe preview (suburb/council, scope, urgency, photos flag,
risk), "Client details: hidden until approved", a ranked shortlist of interested traders (no client data),
and the consent gate status with the next action. Dubbo lead → "No suitable verified trader yet".

## Revenue model recommendation
Client match free · no charge for unsuitable leads · success-based trader contribution where appropriate
(only if job accepted/won, clear terms) · Professional Review paid option · possible later service-
coordination fee if SiteVerdict actively coordinates · commercial terms to be confirmed by T.
No guaranteed job/result/price/quality.

## Client protection rules
Details never shared automatically; client chooses introduction; no outcome guarantee; trader independent;
feedback drives quality control; unhappy client → review + alternative if available.

## Trader protection / fairness rules
Conduct rules accepted before matching; fair quoting; show up; clear communication; feedback affects
ranking; bad behaviour → suspend/ban; removable from network. No junk-lead charging.

## Human approval points
Publishing a lead · shortlisting/selecting a trader · releasing client details (with consent) ·
trader status changes · the commercial model. System proposes; T decides.

## Limitations
- Trader portal is a read-only mock (no real login/portal in V1).
- Interest records are sample CSV; a live capture form is later work.
- Licence/insurance must be re-verified at match time.
- No DA context. Heuristic suitability; T confirms.

## Verdict
READY INTERNAL LEAD BOARD V1. Public deploy needed: No. Zip ready: Yes.
