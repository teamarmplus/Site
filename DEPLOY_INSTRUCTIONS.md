# Deploy: Lock map-first national preview with QLD parcel check

This package is verified ready. Commit message to use:

    Lock map-first national preview with QLD parcel check

## What this deploy contains
- Map-first result (map of the land appears above the plain-English result)
- Leaflet 1.9.4 with correct, version-pinned Subresource Integrity (SRI)
- NSW map-first working (full planning)
- QLD preview: parcel/address + map only, clearly labelled "Planning controls for this state are not fully connected yet"
- Wording: "Australia-wide parcel check · planning depth varies by state"
- Disclaimer: "Approximate boundary and dimensions only — not a survey. Confirm by title plan or licensed surveyor."

## Verified before deploy
- Static checks: 100/100 PASSED
- Browser tests: 16 passed, 1 skipped (correct), 0 failed
- Fake-address gate: intact
- Result wording + CTA: unchanged
- No unapproved TAS/VIC/WA code present

## Steps (run from your authenticated machine — these need YOUR GitHub + Netlify access)

1. Unzip this package into your local clone of teamarmplus/Site, replacing the public/ etc files.

2. Commit and push to main (or a deploy branch):

       git add .
       git commit -m "Lock map-first national preview with QLD parcel check"
       git push origin main

3. Netlify auto-builds on push. Watch the deploy in the Netlify dashboard → Deploys.

## After deploy — confirm it is no longer package 87

    curl -s https://siteverdict2.netlify.app/version.json
    # Expect: "package_number":"96","build_name":"sitecheck-release-check-96"

Then in a browser on the live site:
- Test NSW: "148 Canley Vale Road, Canley Heights NSW 2166" → map of the land appears above the result.
- Test QLD: "1 Queen Street, Brisbane QLD 4000" → map + parcel note "Planning controls for this state are not fully connected yet."

If version.json still shows 87 after the deploy finishes, the build did not pick up the new files — re-check the commit landed and Netlify built the right branch.
