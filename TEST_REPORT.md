# Min-lot honesty fix + retest + internal Hot List plan

## What changed (public/assets/sv-check.js only — no flow change, no new feature)
1. Min-lot default table reduced to **confident residential zones only**: R1, R2, R3, R4, R5, R6. Removed RU/E/C/MU/SP/UR/B defaults.
2. When the LEP min-lot layer (ArcGIS layer 14) returns a real, sane value → show it (confirmed). Unchanged.
3. When the LEP layer returns nothing AND the zone is not R1–R6 → min-lot is **null** → engine shows **"Minimum lot size: Not confirmed for this zone — Professional verification needed."** No fabricated 450/400.
4. Residential default (when LEP empty but zone is R1–R6) is relabelled: **"Typical minimum lot size for this zone (not confirmed for this lot): N m² — confirm with council."**
5. "What this means" now adds, when min-lot is not confirmed: *"Minimum lot size was not confirmed from the available layer for this zone. It should be checked against the LEP/council controls before decisions."*
6. `calcLots` guarded against null min-lot (internal only; not shown publicly).

No approval prediction added. Public flow (Site Check → Professional Review → Terms) unchanged.

## Before / after (same 15 real addresses, live geocode + live NSW layers)

| Address | Zone | BEFORE | AFTER |
|---|---|---|---|
| 16 Macquarie St Parramatta | MU1 | 400 (fake default) | Not confirmed for this zone |
| 100 George St Sydney | (none) | 450 (fake default) | Not confirmed for this zone |
| 1 Showground Rd Castle Hill | MU1 | 600 (LEP) | **600 m² (LEP) ✓** |
| 2 Honeysuckle Dr Newcastle | MU1 | 400 (fake) | Not confirmed for this zone |
| 1 Burelli St Wollongong | MU1 | 400 (fake) | Not confirmed for this zone |
| 10 Valentine Ave Parramatta | E2 | 450 (fake) | Not confirmed for this zone |
| 1 Anderson St Chatswood | E2 | 450 (fake) | Not confirmed for this zone |
| 45 Oxford St Epping | R4 | 550 (LEP) | **550 m² (LEP) ✓** |
| 1 Campbell St Blacktown | MU1 | 400 (fake) | Not confirmed for this zone |
| 2 Crown St Wollongong | RE1 | 450 (fake) | Not confirmed for this zone |
| 1 Church St Camden | R2 | 600 (LEP) | **600 m² (LEP) ✓** |
| 10 Bungan St Mona Vale | MU1 | 400 (fake) | Not confirmed for this zone |
| 1 Hunter St Newcastle | E2 | 450 (fake) | Not confirmed for this zone |
| 20 Bridge St Sydney | SP5 | 450 (fake) | Not confirmed for this zone |
| 1 Macquarie St Liverpool | E2 | 1000 (LEP) | **1000 m² (LEP) ✓** |

Confirmations:
- E2 / RE1 / SP5 / MU1 no longer show a fake min lot. ✓
- Residential zones with a real LEP min-lot still show correctly (Castle Hill 600, Epping 550, Camden 600). ✓
- Confirmed LEP values flow through for ANY zone (Liverpool E2 shows real 1000). ✓
- No fabricated numbers anywhere. ✓

## Next: real 20 approved-DA validation (prepared, not yet run)
Blocker: DA Leads proxy returns empty (`total_pool:0`) and I have no key here, so I cannot pull 20 real approved DAs yet. Two ways to unblock:
1. **DA Leads:** diagnose the empty result first (likely param/value mismatch — `decision_status=Approved` vs the API's real status value, or plan scope). One raw call with the key, or a hidden-key debug passthrough in daleads.js, will reveal the correct params; then pull 20 approved NSW DAs.
2. **Official records:** paste 20 approved NSW DA addresses (NSW Planning Portal / council trackers) with their consent zoning where shown.
Then: run each through the engine (geocode + NSW layers, now patched), score the 14 criteria, ground-truth zone/min-lot against the council/LEP record (NOT the engine's own layer), return PASS/REVIEW/FAIL.

## Internal Hot List plan (NOT built; internal only)
Do not build a public Hot List until data confidence improves AND DA Leads returns real data.

Internal-only design:
- Source: daily DA Leads pull (once working) + the engine's NSW signals.
- Two lanes:
  1. **Today's Site Potential** — recent activity / signals worth a closer look.
  2. **Approved DA / Delivery & Value Opportunities** — approved DAs that imply upcoming service needs.
- Each entry stores internally: suburb, council, zone (confidence-labelled), reason-for-ranking, development type, source link, DA number. Full address kept **internal only**.
- Dedupe by DA number + normalised address.

When/if a PUBLIC Hot List is later approved, it must follow these rules:
- Top 5 only.
- Suburb / council level only — **no exact public address in beta**.
- No owner / applicant / contact details.
- Confidence label required on every entry.
- Reason-for-ranking required (plain English).
- Professional Review CTA required.
- No strong-buy language; no guaranteed approval / profit / value.
- No paid-data fields shown publicly unless the DA Leads licence allows it.

Gate before any public Hot List: (a) min-lot/zone signals precise for current NSW zones, (b) DA Leads returning real, licence-clear records, (c) trust review passed.
