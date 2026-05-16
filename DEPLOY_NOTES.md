# SiteVerdict — Launch Checklist
## Phase 1 MVP — Pre-Launch Verification

---

## STEP 1: Netlify Setup

- [ ] Create account at netlify.com (or use existing account)
- [ ] Go to Sites → Add new site → Deploy manually
- [ ] Unzip siteverdict.zip
- [ ] Drag the ENTIRE UNZIPPED FOLDER into Netlify (not individual files)
- [ ] Confirm deploy shows all 15 files:
  - [ ] index.html
  - [ ] hot-list.html
  - [ ] services.html
  - [ ] register-trader.html
  - [ ] terms.html
  - [ ] netlify.toml
  - [ ] netlify/functions/cadastre.js
  - [ ] netlify/functions/daleads.js
  - [ ] netlify/functions/ai-interpret.js
  - [ ] assets/sv-tokens.css
  - [ ] assets/sv-base.css
  - [ ] assets/sv-components.css
  - [ ] assets/sv-layout.css
  - [ ] assets/sv-print.css
  - [ ] assets/sv-check.js

---

## STEP 2: Environment Variables

Go to: Netlify → Site → Site configuration → Environment variables

- [ ] Add: `DALEADS_API_KEY` = [set in Netlify UI — never in any file]
- [ ] Add: `ANTHROPIC_API_KEY` = [set in Netlify UI — never in any file]
- [ ] Add: `ANTHROPIC_MODEL` = `claude-sonnet-4-5` (optional — this is the default)
- [ ] Click Save on all variables
- [ ] **Redeploy** after setting or changing any environment variable

⚠️ Without DALEADS_API_KEY:
- Hot list will show "Could not load today's data"
- Comparables in site check will be empty
- Everything else still works

---

## STEP 3: Netlify Forms

Go to: Netlify → Site → Forms

- [ ] Confirm "siteverdict-registration" form appears after first test submission
- [ ] Test submit the registration form with real data
- [ ] Check form submissions appear in Netlify Forms dashboard
- [ ] Optionally: add email notification in Forms → Settings

---

## STEP 3B: AI Layer Testing

- [ ] Run a site check
- [ ] Confirm "Applying AI intelligence layer..." indicator appears
- [ ] Confirm AI verdict replaces rule-based verdict (shows "Claude Sonnet" badge)
- [ ] Confirm AI risks section updates
- [ ] Confirm AI next actions appear

**Test AI fallback (important):**
- [ ] Temporarily set `ANTHROPIC_API_KEY` to an invalid value in Netlify
- [ ] Run a site check
- [ ] Confirm: rule-based report displays correctly — NO broken state
- [ ] Confirm: no error messages shown to user
- [ ] Restore `ANTHROPIC_API_KEY` to correct value

**Test CORS:**
- [ ] Open browser DevTools → Network tab
- [ ] Run a site check
- [ ] Find the `ai-interpret` request
- [ ] Confirm response header `Access-Control-Allow-Origin` = `https://siteverdict.com.au`
- [ ] Confirm NOT `*`

---

## STEP 3C: Security Checks

- [ ] View page source (Ctrl+U) — confirm no API keys visible
- [ ] Open DevTools → Sources — confirm no API keys in any JS file
- [ ] Confirm `ANTHROPIC_API_KEY` only appears in Netlify UI
- [ ] Confirm `DALEADS_API_KEY` only appears in Netlify UI

---

## STEP 4: API Testing — Site Check

Test these addresses on the live URL:

**Test 1 — Standard R2 subdivision site:**
- Address: `6 Kleins Road Northmead NSW 2152`
- Block: `1000`
- Expected: R2 zone, 2 lots LEP, Parramatta 133d DA median, clean overlays

**Test 2 — Heritage site:**
- Address: `24 Captain Pipers Road Vaucluse NSW 2030`
- Block: `800`
- Expected: Heritage overlay warning

**Test 3 — Flood-affected area:**
- Address: `1 Parramatta Road Granville NSW 2142`
- Block: `500`
- Expected: Flood overlay warning

**Test 4 — Auto-detect block size:**
- Address: `6 Fenton Street Panania NSW 2213`
- Click "Auto-detect from address"
- Expected: Returns ~282m² from NSW Cadastre

**Test 5 — Address not found:**
- Address: `999 Fake Street Nowhere NSW 9999`
- Expected: "Address not found. Please check and try again."

For each test confirm:
- [ ] Executive Verdict section appears
- [ ] Development Scorecard appears with 8 scores
- [ ] Planning controls section correct
- [ ] Overlay analysis correct
- [ ] Highest & Best Use section appears
- [ ] Risk Register appears
- [ ] Council Behaviour section appears
- [ ] Financial Assumptions section is editable
- [ ] Professional Verification section appears

---

## STEP 5: Report Gate Testing

- [ ] Run first check → full result shows (1 free report used)
- [ ] Run second check → registration CTA appears at bottom
- [ ] Register → reports reset to 0 → full result shows again
- [ ] Confirm localStorage works: Open DevTools → Application → Local Storage → key `sv_reports_used`

---

## STEP 6: Registration Form Testing

- [ ] Trigger report gate → click "Register free"
- [ ] Fill form: name, email, phone, investor type
- [ ] Submit → success message appears ("Registered successfully")
- [ ] Check Netlify Forms dashboard → submission appears
- [ ] After success → close modal → result still visible

---

## STEP 7: Hot List Testing

Go to `/hot-list.html`

- [ ] Page loads without "Loading..." stuck state
- [ ] 5 properties visible (or error message if API issue)
- [ ] "Run site check" button pre-fills address in Site Check
- [ ] "Chat with a professional" button opens WhatsApp
- [ ] "Run site check" button pre-fills the property ADDRESS (not blank or index number)
- [ ] Test all 5 property cards — each "Run site check" should pre-fill that property's address in Site Check

If hot list shows error:
1. Check DALEADS_API_KEY is set in Netlify
2. Check Netlify → Functions → daleads → logs for errors

---

## STEP 8: Mobile Testing

Test on real mobile device (not just browser resize):

- [ ] Hero section: text readable, form usable
- [ ] Form: inputs work, keyboard doesn't cover form
- [ ] Result: Executive Verdict readable
- [ ] Scorecard: 1-column layout on mobile
- [ ] Planning controls: 2-column on mobile (not 3)
- [ ] Tables: horizontal scroll works
- [ ] Financial Assumptions: inputs usable on mobile
- [ ] Footer: print button visible

---

## STEP 9: Print / PDF Testing

- [ ] Run a site check for any address
- [ ] Click "Print report" in footer
- [ ] Or: Ctrl+P / Cmd+P
- [ ] Verify:
  - [ ] Navigation and form are hidden
  - [ ] Result is full-width
  - [ ] Background is white
  - [ ] Text is black and readable
  - [ ] Page breaks don't split cards awkwardly
  - [ ] Header and disclaimer appear in print
  - [ ] Page is A4 sized

---

## STEP 10: Domain Connection

Go to: Netlify → Site → Domain management

- [ ] Add custom domain: `siteverdict.com.au`
- [ ] In Cloudflare DNS: Add CNAME → `[your-netlify-url].netlify.app`
- [ ] Or: Update nameservers to Netlify
- [ ] Wait for SSL certificate (automatic, 5–30 min)
- [ ] Test: https://siteverdict.com.au loads correctly
- [ ] Test: https://www.siteverdict.com.au redirects to siteverdict.com.au

---

## STEP 11: Pre-Launch Checks

- [ ] No console errors on any page (F12 → Console)
- [ ] No API key visible in page source (Ctrl+U)
- [ ] "16+" appears consistently, not "12" or "16" in isolation
- [ ] All nav links work
- [ ] WhatsApp link opens correctly on mobile
- [ ] Terms page accessible
- [ ] Page loads in under 3 seconds on mobile (test with Google PageSpeed)

---

## REMAINING RISKS BEFORE PUBLIC LAUNCH

### High Priority
| Risk | Description | Mitigation |
|---|---|---|
| DALEADS_API_KEY not set | Hot list and comparables fail silently | Set in Netlify before announcing |
| Auto-detect block size | Works on deployed domain only, not locally | Test on live URL, not localhost |
| Netlify Forms not active | Registrations not captured | Test form submission before launch |
| Report gate bypass | localStorage can be cleared | Acceptable for MVP — Supabase in Phase 2 |

### Medium Priority
| Risk | Description | Mitigation |
|---|---|---|
| DA Leads API rate limit | Unknown rate limits on DA Leads API | Monitor usage after launch |
| NSW Planning Portal downtime | All APIs fail if NSW portal is down | Add graceful error messages |
| S7.11 estimates wrong | Contribution rates are estimates | Label clearly as estimates |
| Mobile keyboard overlap | Form inputs covered by keyboard on small phones | Test on real device |

### Low Priority
| Risk | Description | Mitigation |
|---|---|---|
| Slow council database | Only 34 councils — others show "No data" | Grow database in Phase 2 |
| Cadastre approximation | Block size may differ from real estate listing | Label as "approximate — confirm with surveyor" |
| Print layout imperfect | Some edge cases in print CSS | Minor, acceptable for MVP |

---

## WHAT IS NOT YET BUILT (Phase 2)

- [ ] Supabase user accounts (localStorage only in MVP)
- [ ] Stripe payment for $20 reports (gate shows CTA only)
- [ ] Dynamic full report page not yet built
- [ ] User dashboard (saved sites, watchlists)
- [x] Claude AI layer built — requires ANTHROPIC_API_KEY and fallback testing
- [ ] Email alerts for hot list
- [ ] National expansion (currently NSW only)

---

## SUPPORT

WhatsApp: wa.me/61402623628
ABN: 42 663 950 070
Platform: siteverdict.com.au
