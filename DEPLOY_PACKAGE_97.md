# Deploy Guide — Package 97 (Site Check map-app baseline)

Verified ready: static 100/100, browser 16 passed, fake-address gate intact,
one Leaflet map, result byte-identical to Package 96, QLD preview safe.
sv-check.js hash: bfab2f70 · package_number: 97

These steps need YOUR GitHub + Netlify access (the sandbox cannot push).

## 1. Which file to use
siteverdict-package-97.zip  (from your downloads / outputs)

## 2. Where to copy/unzip
Into your local clone of the repo teamarmplus/Site, replacing the project files:
- Unzip so that public/, scripts/, tests/, package.json, _redirects, netlify.toml
  land at the repo root (same layout as the zip).
- Overwrite existing files when prompted.

  cd /path/to/Site
  unzip -o ~/Downloads/siteverdict-package-97.zip
  # confirm the key file updated:
  grep -c "outFields=*" public/assets/sv-check.js   # expect 1
  cat public/version.json | grep package_number      # expect "97"

## 3. Git commands
  git add .
  git status                       # sanity: see public/, version.json changed
  git commit -m "Deploy Package 97 Site Check map app baseline"
  git push origin main             # or your deploy branch

## 4. Commit message (exact)
Deploy Package 97 Site Check map app baseline

## 5. Netlify check
- Netlify auto-builds on push. Open Netlify dashboard -> Site -> Deploys.
- Watch the latest deploy go "Published" (green). If it fails, open the deploy log.
- Confirm it built the branch you pushed (main).

## 6. version.json check (the deploy-gap closer)
  curl -s https://siteverdict2.netlify.app/version.json
  # EXPECT: "package_number":"97","build_name":"sitecheck-release-check-97"
  # If it still shows 87 -> the build did not pick up new files; recheck commit + branch.

## 7. Live smoke test checklist (do in a browser on the live site)
[ ] Homepage loads with no errors
[ ] Base map appears on arrival (NSW-centred map visible before any search)
[ ] NSW: enter "148 Canley Vale Road, Canley Heights NSW 2166"
      -> map pans to the land, parcel boundary drawn
      -> fact strip shows Lot/Plan, Council, Planning zone (land size shows only if SIX returns it)
      -> plain-English result appears below the map, one gold "Find Out What My Land Can Do"
[ ] QLD: enter "1 Queen Street, Brisbane QLD 4000"
      -> map + parcel, note says planning "not fully connected yet" (no overclaim)
[ ] Mobile: scroll the result -> top bar does NOT cover map / fact strip / result header / stats / CTA
[ ] Disclaimer visible where parcel/area shown:
      "Approximate boundary and dimensions only — not a survey. Confirm by title plan or licensed surveyor."
[ ] /deploy-check.html loads and shows package 97 current

## After you deploy
Send me:  curl -s https://siteverdict2.netlify.app/version.json
Then I will verify live: package_number 97, homepage, base map on arrival,
NSW check + map/result/fact strip, QLD preview safe, mobile sticky header,
and /deploy-check.html.

## Rollback (if needed)
Re-deploy the previous known-good package (Package 96 zip) the same way, or in
Netlify use Deploys -> select the prior published deploy -> "Publish deploy".
