# SiteVerdict

**AI development intelligence for any NSW property.**

Zone controls, heritage, flood, DA approval timelines and development feasibility — from 16+ live government, open-source and paid planning sources. Free site check. Instant report.

---

## What SiteVerdict does

Enter any NSW address. SiteVerdict queries 16+ data sources in real time:

- NSW Planning Portal (zone, min lot, FSR, height, heritage, overlays)
- NSW EPI Flood Planning Area
- NSW RFS Bushfire Prone Land
- NSW BCT Biodiversity Offset Polygons
- NSW Spatial Cadastre (block size auto-detect)
- NSW ePlanning API (DA timelines — 34 councils, 319 real DAs)
- OpenStreetMap Overpass (SEPP 2024 station proximity)
- DA Leads API (comparable approved DAs)
- Claude Sonnet (AI intelligence layer — optional)

Returns an institutional-quality report with: executive verdict, development scorecard, overlay analysis, highest & best use, risk register, council behaviour, financial assumptions and next actions.

---

## Deploy to Netlify (GitHub method)

### 1. Push this repo to GitHub

```bash
git init
git add .
git commit -m "Initial SiteVerdict deploy"
git remote add origin https://github.com/YOUR_USERNAME/siteverdict.git
git push -u origin main
```

### 2. Connect to Netlify

1. Go to [app.netlify.com](https://app.netlify.com)
2. **Add new site → Import an existing project → GitHub**
3. Select your `siteverdict` repository
4. Build settings:
   - **Build command:** *(leave empty — no build step)*
   - **Publish directory:** `.` *(repo root)*
5. Click **Deploy site**

### 3. Set environment variables

Go to: **Netlify → Site → Site configuration → Environment variables**

| Variable | Value | Required |
|---|---|---|
| `DALEADS_API_KEY` | Your DA Leads API key | For hot list + comparables |
| `ANTHROPIC_API_KEY` | Your Anthropic API key | For AI intelligence layer |
| `ANTHROPIC_MODEL` | `claude-sonnet-4-5` | Optional — this is the default |

**Click Save, then trigger a redeploy.**

> ⚠️ Never put API keys in any file. Set them only in Netlify UI. This repo contains no API keys.

### 4. Redeploy after setting variables

Netlify → Deploys → **Trigger deploy → Deploy site**

---

## Testing after deploy

### Step 1 — Confirm root files load

Visit these URLs after deploy:

```
https://YOUR-SITE.netlify.app/DEPLOY_TEST.txt
→ Should return: SiteVerdict deploy root OK

https://YOUR-SITE.netlify.app/assets/sv-check.js
→ Should return: the JS file (not 404)
```

If either returns 404, the repo root is not being served correctly.

### Step 2 — Test rule-based report (no API credits needed)

Test without `ANTHROPIC_API_KEY` first:

1. Open the deployed URL
2. Enter address: `6 Kleins Road Northmead NSW 2152`
3. Enter block size: `1000`
4. Click **Run intelligence check**
5. Confirm: full report renders (planning controls, overlays, scorecard, risk register)
6. Confirm: no "Something went wrong" message

### Step 3 — Test auto-detect block size

1. Enter address: `6 Fenton Street Panania NSW 2213`
2. Click **Auto-detect from address**
3. Expected: approximately `282m²` auto-filled
4. If auto-detect fails: enter block size manually — report still works

### Step 4 — Test AI intelligence layer (uses Anthropic credits)

Only after confirming rule-based report works:

1. Set `ANTHROPIC_API_KEY` in Netlify environment variables
2. Redeploy
3. Run one site check
4. Confirm: "Applying AI intelligence layer..." indicator appears
5. Confirm: verdict section shows **Claude Sonnet** badge

> Save credits: test rule-based first. Run AI test exactly once.

### Step 5 — Test hot list

1. Navigate to `/hot-list.html`
2. Confirm: property cards load (requires `DALEADS_API_KEY`)
3. Click **Run site check** on any card
4. Confirm: address pre-fills correctly on the site check page

---

## File structure

```
siteverdict/
├── index.html                    ← Site Check (main tool)
├── hot-list.html                 ← Live property hot list
├── services.html                 ← Professional services
├── register-trader.html          ← Internal use only
├── terms.html                    ← Legal
├── netlify.toml                  ← Netlify build config
├── DEPLOY_NOTES.md               ← Deployment checklist
├── DEPLOY_TEST.txt               ← Root file test
├── README.md                     ← This file
├── .gitignore
├── assets/
│   ├── sv-tokens.css             ← Design tokens
│   ├── sv-base.css               ← Base styles
│   ├── sv-components.css         ← UI components
│   ├── sv-layout.css             ← Layout
│   ├── sv-print.css              ← Print / PDF export
│   └── sv-check.js               ← All site check logic + AI integration
└── netlify/
    └── functions/
        ├── cadastre.js           ← NSW Cadastre CORS proxy
        ├── daleads.js            ← DA Leads API proxy (key server-side)
        └── ai-interpret.js       ← Claude AI interpretation (key server-side)
```

---

## What works without environment variables

| Feature | No `DALEADS_API_KEY` | No `ANTHROPIC_API_KEY` |
|---|---|---|
| Site check (zone, overlays, planning controls) | ✓ Works | ✓ Works |
| Development scorecard | ✓ Works | ✓ Works |
| Risk register, HBU, council analysis | ✓ Works | ✓ Works |
| Financial assumptions model | ✓ Works | ✓ Works |
| Auto-detect block size (NSW Cadastre) | ✓ Works | ✓ Works |
| Hot list properties | ✗ Empty | ✓ Works |
| Comparable DAs in site check | ✗ Empty | ✓ Works |
| AI intelligence layer | ✓ Falls back silently | ✗ Rule-based only |

---

## Security

- No API keys are stored in this repository
- All keys are loaded via `process.env` inside Netlify Functions only
- CORS on the AI endpoint is restricted to `siteverdict.com.au` and Netlify preview URLs
- All Claude-generated text is escaped before `innerHTML`

---

## Netlify functions

The three Netlify functions act as server-side proxies. They:

- Keep API keys out of client-side code
- Handle CORS for NSW government APIs that block browser requests
- Provide buffer/retry logic for the NSW Cadastre

`cadastre.js` — queries `maps.six.nsw.gov.au` for lot boundaries and area. Tries buffer 0m, 5m, 15m automatically.

`daleads.js` — queries DA Leads API for comparable approved DAs and the hot list.

`ai-interpret.js` — sends structured planning data to Claude Sonnet and returns JSON. Falls back silently if unavailable.

---

## Licence

Private. Not open source. All rights reserved — Arm Plus Group · ABN 42 663 950 070


## Public safety

The `_redirects` file blocks public access to `/tools/*` and `/data/*` on Netlify. Keep real validation datasets local and do not commit private input files or backtest outputs.
