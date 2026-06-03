# Netlify Deploy Gate — skip deploys on internal-only commits

## What this does
Adds an `ignore` command to `netlify.toml [build]`. Netlify runs it BEFORE building:
- **exit 0 → build is CANCELLED** (no production deploy)
- **exit non-zero → build PROCEEDS** (normal deploy)

So commits that only touch internal tooling/docs do NOT deploy the live site.

## Deploys ONLY when these change
`public/` · `netlify/functions/` · `public/netlify/functions/` · `package.json` ·
`package-lock.json` · `netlify.toml` · `scripts/predeploy.js` · `scripts/` ·
`playwright.config.js` · `tests/`

## Does NOT deploy when only these change
`internal-os/` · `pr-prep/` · any `*.md` docs/reports · sample data · anything else outside the trigger list.
A MIXED commit (internal + any public/build file) still deploys — any trigger match wins.

## Safety defaults (never accidentally skip a real deploy)
- No cached commit ref (first build / shallow clone) → PROCEED.
- No detectable file changes → PROCEED.

## How it's wired
The rule is embedded directly in `netlify.toml` as `build.ignore` (no extra file needed).
A standalone copy is also provided at `scripts/netlify-ignore.sh` if you prefer:
`ignore = "bash scripts/netlify-ignore.sh"`.

## Proof (tested against real git commits)
internal-os change → SKIP · pr-prep+markdown → SKIP · public/ change → PROCEED ·
function change → PROCEED · MIXED → PROCEED · netlify.toml → PROCEED · scripts/predeploy.js → PROCEED ·
no-cached-ref → PROCEED · no-changes → PROCEED. The exact command embedded in netlify.toml was
extracted and re-run against real commits with the same results.

## To apply
Replace your repo-root `netlify.toml` with the one in this package (only the `[build]` block gained
the `ignore` command; everything else is unchanged). Commit + push. The next internal-only commit
will show "skip:internal-only" in Netlify's deploy log and cancel the build.
