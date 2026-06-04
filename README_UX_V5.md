# SiteVerdict UX v5 — Layout & Readability (CSS/layout only)

CSS + index.html + version.json only. NO geocode change, NO report-logic change.
sv-check.js and geocode.js are byte-identical to the live address-first build.

## What changed
- Wider desktop result: .result-wrap max-width 680px -> 880px.
- Larger body text: .signal-heading .62->.72rem, .signal-body .78->.92rem, lists ->.9rem.
- Two-column desktop report (>=900px) via CSS multicolumn on .signal-card; single column mobile (<900px).
  - Location-trust banner + parcel-confidence line kept FULL-WIDTH at the top (column-span:all).
  - Professional Review CTA + verify line kept FULL-WIDTH at the bottom.
  - Sections never split across columns (break-inside:avoid).
- Bigger map preview (#sv-map 380px mobile / 440px desktop).
- index.html cache-busting version bumped so the new CSS loads; version.json updated.

## Deliberately deferred (not safe/testable today)
- Google Places Autocomplete: needs Places API billing/approval (a NEW paid API). Recommended as a
  separate post-launch task. NOT built.
- Draggable pin / click-to-rerun: browser-only interaction, cannot be tested in this environment.
  Recommended as a v6 preview-tested feature. NOT built.
  Minimum safe alternative already live: confirm-location banner ("You entered / We matched / Confidence"),
  "Location approximate — not a survey", "Parcel signal needs review".

## Files changed
- public/assets/sv-components.css  (fonts, two-column, map size)
- public/assets/sv-layout.css      (wider result-wrap)
- public/index.html                (cache version bump)
- public/version.json              (build_name + flags)
- (sv-base.css, sv-tokens.css, sv-print.css included unchanged for a complete asset set)
- sv-check.js, geocode.js included UNCHANGED (complete deploy set)

## NOT proven (needs Netlify preview — no browser here)
- The rendered two-column desktop layout, larger text, bigger map, and mobile single-column reflow.
  CSS is syntactically valid and the column-span targets are verified against the real section order,
  but actual rendering + responsive breakpoints must be eyeballed on a preview at desktop AND mobile widths.

## Rollback
Revert the 4 changed files (2 CSS + index.html + version.json). sv-check.js/geocode.js unchanged.
