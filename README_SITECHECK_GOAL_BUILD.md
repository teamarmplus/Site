# SiteVerdict Site Check — Launch-Quality Combined Build (v-goal)

Single consolidated build. Combines the latest proven report layer + r3 geocode trust fix,
and ADDS the one missing section: "Development constraints to check".
Supersedes all earlier partial zips (report-upgrade, banner, parcel-fix r2/r3, combined-v1).

## Files
- public/assets/sv-check.js (1951 lines)
  - Confirm-location banner (matched address + confidence + "not a survey")
  - What we found / What this means
  - Possible pathways to review (signal-based; subdivision feasibility only when land >= 2x a
    CONFIRMED min-lot; never a lot count; non-residential -> professional review)
  - Development constraints to check (NEW): zoning/min-lot/heritage/flood/bushfire detected-status,
    plus boundaries, survey/frontage, DCP, biodiversity, trees, slope, easements, drainage, access,
    services -> "not checked in this basic report", "verify before relying"
  - Nearby context (transport/health/retail from already-fetched Overpass; hides if absent)
  - What still needs checking / Professional Review CTA
- public/netlify/functions/geocode.js (454 lines)
  - r3 comma-aware street-substitution guard (multi-word streets; comma/lowercase/abbrev safe;
    148 Canley Road -> reject; 148 Canley Vale Road incl. comma -> accept)

## Status
OFFLINE-PROVEN, NOT LIVE-PROVEN. The geocode r3 fix is not yet on the live site (live still
false-rejects the comma case). Deploy to a Netlify PREVIEW and re-test before production.

## v2 changes
- Softened the DA "Why this matters" wording (no "best possible planning outcome" / "no additional
  reports required" claim).
- AI packet min-lot fallback returns null when unverified (no fabricated 450). No fake min-lot.

## v3 changes
- Neutralised the unused calcYieldPotential function (was computing lots via block/(mls||450) + a
  yield score). Now a harmless stub: no lot math, no 450 fallback, no scoring, returns null.
  It was dead code (never called) and remains unused. No feature/report changes.
