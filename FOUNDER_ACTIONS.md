# FOUNDER ACTIONS REQUIRED

Actions that require T's personal/business login, registration, or payment decision.
AI cannot complete these — they require your identity.

**Current status: 2 actions pending**

---

## Action 1 — SA Planning Zones (South Australia)

**Priority:** Medium  
**What it unlocks:** Real SA planning zone (P&D Code) for any SA address in Site Check  
**Cost:** Free (government service)  
**Time needed:** ~10 minutes

### What to do

1. Go to: https://sailis.lssa.com.au
2. Click "Register" or "Create account"
3. Register as a business account (ABN: 42 663 950 070)
4. Request access to: **SA Spatial Hub API** (or equivalent P&D Code layer)
5. Copy the API key you receive
6. In Netlify UI → Site settings → Environment variables → Add:
   - **Key:** `SA_SPATIAL_HUB_KEY`
   - **Value:** (paste your key)
7. Add the same key to GitHub repo → Settings → Secrets → Actions → New secret:
   - **Name:** `SA_SPATIAL_HUB_KEY`
   - **Value:** (paste your key)

### What SiteVerdict does after this

- SA provider (`providers/sa.js`) activates automatically when key is present
- SA Site Check returns: planning zone, overlay, parcel area, LGA
- Source shown as: "SA Planning and Design Code (SA Spatial Hub)"

---

## Action 2 — WA Cadastre and Planning (Western Australia)

**Priority:** Medium  
**What it unlocks:** WA cadastre parcel data and planning zone context  
**Cost:** Free (government service)  
**Time needed:** ~15 minutes

### What to do

1. Go to: https://slip.landgate.wa.gov.au/Pages/default.aspx
2. Click "Register"
3. Create a free account
4. Navigate to "SLIP" (Shared Location Information Platform)
5. Request access to: **Cadastre** and **Planning** layers
6. Copy the API key or subscription token you receive
7. In Netlify UI → Site settings → Environment variables → Add:
   - **Key:** `WA_SLIP_API_KEY`
   - **Value:** (paste your key)
8. Add to GitHub repo → Settings → Secrets:
   - **Name:** `WA_SLIP_API_KEY`
   - **Value:** (paste your key)

### What SiteVerdict does after this

- WA fallback (`providers/fallback.js`) upgrades to real WA data
- WA Site Check returns: parcel area, lot number, LGA, council
- Source shown as: "WA SLIP (Landgate)"

---

## No action needed for these states

| State | Why no action needed |
|---|---|
| NSW | Live ArcGIS REST — no key required |
| ACT | Live ACTmapi — no key required |
| TAS | Live theLIST — no key required |
| VIC | Vicmap GDB received — PostGIS integration in progress (AI handles) |
| QLD | QSpatial live API — no key required |
| NT | NTLIS — limited public access; AI will research further |

---

## How to confirm actions are done

After setting env vars in Netlify:
1. Redeploy the site (or push any commit)
2. Open `/deploy-check.html`
3. SA and WA geocode checks should show `found: true` with real source data

---

*This file is maintained by the AI agent. Last updated: see git log.*
