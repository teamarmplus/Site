# SiteVerdict GitHub Pipeline Setup

**Do these steps once. After that, AI handles the daily loop.**

---

## What this pipeline does

```
Founder direction
       ↓
GitHub scheduled AI agent        (daily-agent.yml — runs 5pm AEST daily)
       ↓
AI scans live site for problems  (scripts/daily-check.js)
       ↓
AI opens GitHub issues           (labelled: ai-daily-check, founder-decision)
       ↓
AI fixes code on branch          (Claude Code or manual — see below)
       ↓
AI runs release-check            (scripts/release-check.js)
       ↓
AI runs Playwright browser tests (tests/sitecheck.e2e.spec.js — 14 tests)
       ↓
AI creates PR only if green      (PR template enforces test proof)
       ↓
Netlify deploy preview           (auto-triggered by Netlify GitHub integration)
       ↓
Founder approves live deploy     (one click in Netlify or GitHub)
```

---

## Step 1 — Push this repo to GitHub

```bash
cd siteverdict
git init
git remote add origin https://github.com/teamarmplus/Site.git
git add -A
git commit -m "feat: CI pipeline + GitHub Actions"
git push -u origin main
```

---

## Step 2 — Connect Netlify to GitHub

In Netlify UI:
1. Site settings → Build & deploy → Continuous deployment
2. Connect to GitHub → select repo `teamarmplus/Site`
3. Set build command: *(leave blank — Netlify reads netlify.toml)*
4. Set publish directory: `public`
5. Enable **Deploy Previews** for pull requests

---

## Step 3 — Set GitHub repository variable

In GitHub → Settings → Variables → Actions → New repository variable:

| Name | Value |
|---|---|
| `SITEVERDICT_LIVE_URL` | `https://siteverdict2.netlify.app` |

*(Update this when the custom domain is live.)*

---

## Step 4 — Set GitHub repository secrets (Netlify env vars to mirror here)

In GitHub → Settings → Secrets → Actions → New repository secret:

| Secret name | Where to get it |
|---|---|
| `NETLIFY_AUTH_TOKEN` | Netlify UI → User settings → Personal access tokens |
| `NETLIFY_SITE_ID` | Netlify UI → Site settings → General → Site ID |

*(Optional — only needed if you want GitHub Actions to trigger Netlify deploys directly.)*

---

## Step 5 — Add issue labels to GitHub

Go to GitHub → Issues → Labels → Create new labels:

| Label | Colour | Description |
|---|---|---|
| `ai-daily-check` | `#0075ca` | Created by daily AI agent |
| `founder-decision` | `#e4e669` | Requires founder judgment |
| `site-check` | `#d93f0b` | Site Check failure detected |
| `ai-detected` | `#cfd3d7` | Found automatically by AI |

---

## Step 6 — Verify workflows are active

1. Go to GitHub → Actions
2. You should see:
   - **SiteVerdict Release Check** — runs on push/PR
   - **SiteVerdict Daily AI Agent** — runs 5pm AEST daily
3. Manually trigger **Daily AI Agent** once to confirm it works
4. Check that a `DAILY_LOG.md` commit appears

---

## Step 7 — Netlify env vars (required for Site Check to work)

In Netlify UI → Site settings → Environment variables:

| Env var | Value | Required for |
|---|---|---|
| `ANTHROPIC_API_KEY` | your key | AI interpretation |
| `GOOGLE_MAPS_API_KEY` | your key | Geocode (real addresses) |
| `DALEADS_API_KEY` | your key | DA timeline |
| `SA_SPATIAL_HUB_KEY` | get from sailis.lssa.com.au | SA planning zones |
| `WA_SLIP_API_KEY` | get from slip.landgate.wa.gov.au | WA cadastre/planning |

---

## Daily workflow (after setup)

**Founder daily routine — under 5 minutes:**

1. Check GitHub Issues → filter by `founder-decision`
2. Read: "What AI found / What needs deciding"
3. If it's an API registration → do it, paste key in Netlify, close issue
4. If it's a direction decision → comment your decision, AI proceeds
5. If it's an automated fix PR → review the release-check output → merge

**That's it.** AI handles everything else.

---

## What AI does automatically (no founder needed)

- Scans live site for broken addresses, hangs, NSW overlay leaks
- Detects stale package numbers
- Detects NSW-only wording that crept back in
- Runs 14+ browser tests before any merge
- Blocks bad code from reaching Netlify
- Creates structured issues with exact fix steps
- Updates DAILY_LOG.md every morning

---

## What only the founder decides

- Direction changes (new features, new states to prioritise)
- API/data registrations requiring payment or login
- Partnerships or commercial decisions
- Ethics or safety questions
- Major architecture changes

---

## Troubleshooting

**Release Check fails on GitHub but passes locally:**
- Check that `PLAYWRIGHT_BROWSERS_PATH` is set correctly in CI (handled by workflow)
- Check Node version (must be 22+)

**Daily agent doesn't open issues:**
- Confirm `issues: write` permission is set in workflow YAML
- Check workflow logs in GitHub → Actions → Daily AI Agent

**Netlify deploy preview not triggered:**
- Confirm Netlify GitHub integration is connected (Step 2)
- Check Netlify → Deploys → Deploy previews is enabled

---

*This document is maintained by the AI agent. Last updated: see git log.*
