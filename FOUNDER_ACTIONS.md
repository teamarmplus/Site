# FOUNDER ACTIONS REQUIRED

Actions that require T's personal/business login, registration, or payment decision.
AI cannot complete these — they require your identity or a business decision.

**Updated: 2026-05-27 based on live API probes**

---

## Action 1 — SA Planning Zones (HIGHEST VALUE — new market)

**Priority:** High  
**Time:** ~10 minutes  
**Cost:** Free  
**What it unlocks:** Real SA P&D Code planning zones, policy areas, and overlays for any SA address

### Steps

1. Go to: https://sailis.lssa.com.au
2. Click "Register" → Create business account (ABN: 42 663 950 070)
3. Request access to: **SA Spatial Hub** or P&D Code GeoJSON API
4. Get API key
5. Netlify UI → Site settings → Environment variables → Add:
   - **Key:** `SA_SPATIAL_HUB_KEY`
   - **Value:** your API key
6. GitHub → Settings → Secrets → Actions → New secret:
   - **Name:** `SA_SPATIAL_HUB_KEY`

**After this:** SA Site Check will return zone, policy area, overlays from PlanSA.

---

## Action 2 — WA Cadastre and Planning

**Priority:** Medium  
**Time:** ~15 minutes  
**Cost:** Free  
**What it unlocks:** WA cadastre (lot/plan/area), LGA, and planning zones for WA addresses

### Steps

1. Go to: https://slip.landgate.wa.gov.au/Pages/default.aspx
2. Click "Register" → Create free account
3. Request access to: **Cadastre** and **Planning** layers
4. Get API key / subscription token
5. Netlify UI → Environment variables → Add:
   - **Key:** `WA_SLIP_API_KEY`
   - **Value:** your token
6. GitHub → Secrets → Add:
   - **Name:** `WA_SLIP_API_KEY`

**After this:** WA Site Check will return parcel data and planning context.

---

## Action 3 — PostGIS database for VIC (and future QLD/SA) (DIRECTOR DECISION)

**Priority:** High (VIC is second-largest state market)  
**Time:** ~30 minutes  
**Cost:** ~$7-25/month (Supabase free tier available)  
**What it unlocks:** Full Vicmap Planning zones + overlays for all Victorian addresses. Same DB can later hold QLD council schemes and SA P&D Code.

**Options:**

| Option | Cost | Setup |
|---|---|---|
| Supabase free tier (PostgreSQL + PostGIS) | Free to start | https://supabase.com |
| Neon serverless PostgreSQL | Free tier | https://neon.tech |
| Railway PostgreSQL | $5/month | https://railway.app |
| Self-hosted on VPS | $5-10/month | Your choice |

### Steps

1. Create a PostgreSQL + PostGIS database (any above option)
2. Get the connection string: `postgresql://user:pass@host:5432/dbname`
3. Netlify UI → Environment variables → Add:
   - **Key:** `SITEVERDICT_POSTGIS_URL`
   - **Value:** your connection string
4. GitHub → Secrets → Add:
   - **Name:** `SITEVERDICT_POSTGIS_URL`
5. Tell AI: "PostGIS is set up at [host]. Load the VIC data."
   → AI will run `scripts/import-vicmap-planning.sh` to load the GDB

**After this:** VIC Site Check returns real zone + overlay data. QLD and SA can be added to same DB later.

---

## No action needed for these states

| State | Why no action needed |
|---|---|
| NSW | Fully connected — no key required |
| TAS | Fully connected — public API, no key required |
| QLD | Partially connected — LGA/locality/lot live as of pkg 88 |
| ACT | Research ongoing — no account needed for ACT ArcGIS Online |

---

## After you complete actions

1. Deploy the latest package to Netlify (or push to GitHub → PR → auto-deploy)
2. Open `/deploy-check.html` on the live site
3. New state data will appear automatically when env vars are set

---

*This file is maintained by AI. Last updated by agent run: 2026-05-27*
