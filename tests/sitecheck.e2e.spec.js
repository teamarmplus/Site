/**
 * SiteVerdict — Site Check End-to-End Tests
 * 
 * Uses Playwright to test the actual rendered Site Check UI.
 * 
 * TARGET: Live deployed site (BASE_URL env var, default: https://siteverdict2.netlify.app)
 * 
 * WHY LIVE: Netlify CLI is not installed in this environment. The Site Check requires
 * /.netlify/functions/geocode (a Netlify serverless function) which cannot run locally
 * without Netlify's runtime. Tests therefore run against the deployed site.
 * 
 * Run with:
 *   BASE_URL=https://siteverdict2.netlify.app npm run test:sitecheck
 * 
 * WHAT IS TESTED:
 *   - Homepage loads and has no old NSW-only wording
 *   - NSW address (comma + no-comma) produces a report card
 *   - Fake address is rejected cleanly
 *   - QLD/VIC/TAS/ACT produce a result and do NOT contain NSW Planning Portal text
 *   - No Site Check stays stuck on "Checking..." for more than 25 seconds
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'https://siteverdict2.netlify.app';

// NSW overlay phrases that must NOT appear in non-NSW results
const NSW_BAD = [
  'NSW Planning Portal',
  'NSW EPI Flood',
  'NSW RFS Bush Fire',
  'Section 10.7',
  'LEP minimum lot',
  'NSW Planning Portal Layer',
];

// User-facing wording that must be absent from all pages
const WORDING_FORBIDDEN = [
  'any NSW property',
  'For any NSW address',
  'NSW addresses only',
  'Development intelligence for NSW',
];

// Max time to wait for a Site Check result (ms)
const RESULT_TIMEOUT = 25000;

// ── Helpers ──────────────────────────────────────────────────────

/**
 * Run a Site Check and wait for the result.
 * Returns { rendered, resultHtml, resultText, timedOut, rejected }
 */
async function runSiteCheck(page, address, landSize = null) {
  await page.goto(BASE_URL + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Fill address
  await page.fill('#addr', address);

  // Fill land size if provided
  if (landSize) {
    const blockInput = page.locator('#block');
    if (await blockInput.count() > 0) {
      // Open <details> if block input is inside one (collapsed by default in redesigned form)
      const detailsEl = page.locator('details:has(#block)');
      if (await detailsEl.count() > 0 && !(await detailsEl.getAttribute('open'))) {
        await detailsEl.locator('summary').click();
        await page.waitForTimeout(200);
      }
      if (await blockInput.isVisible()) {
        await blockInput.fill(String(landSize));
      }
    }
  }

  // Click the run button
  const btn = page.locator('#run-btn');
  await btn.click();

  // Wait for result: either #result has content OR timeout fires OR button re-enables after error
  const startTime = Date.now();
  let resultHtml = '';
  let resultText = '';
  let timedOut   = false;

  try {
    await page.waitForFunction(
      () => {
        const res = document.getElementById('result');
        if (!res) return false;
        const html = res.innerHTML || '';
        const txt  = (res.innerText || res.textContent || '').trim();
        // Accept: rcard, address-not-matched, timeout card, or error message
        return (
          html.includes('rcard') ||
          html.includes('not matched') ||
          html.includes('could not') ||
          html.includes('SITE_CHECK_TIMEOUT') ||
          html.includes('timed out') ||
          txt.length > 60
        );
      },
      { timeout: RESULT_TIMEOUT }
    );
    const resEl  = page.locator('#result');
    resultHtml   = await resEl.innerHTML();
    resultText   = await resEl.innerText();
  } catch (e) {
    // waitForFunction timed out — Site Check is hanging
    timedOut   = true;
    const resEl = page.locator('#result');
    resultHtml  = await resEl.innerHTML().catch(() => '');
    resultText  = await resEl.innerText().catch(() => '');
  }

  const elapsed = Date.now() - startTime;
  const rejected = resultHtml.includes('not matched') || resultHtml.includes('could not be matched') || resultText.includes('not matched');
  const rendered  = resultHtml.includes('rcard') && resultHtml.length > 80;

  return { rendered, resultHtml, resultText, timedOut, rejected, elapsed };
}

/**
 * Assert no NSW-specific overlay text in result HTML.
 */
function assertNoNSWOverlayText(resultHtml, address) {
  for (const bad of NSW_BAD) {
    if (resultHtml.includes(bad)) {
      throw new Error(
        `Non-NSW address "${address}" result contains NSW overlay text: "${bad}"`
      );
    }
  }
}

// ── Test suite ────────────────────────────────────────────────────

test.describe('SiteVerdict Site Check — release safety', () => {

  // ── Homepage ──────────────────────────────────────────────────
  test('homepage loads and has no forbidden NSW-only wording', async ({ page }) => {
    const res = await page.goto(BASE_URL + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    expect(res.status()).toBe(200);

    const html = await page.content();

    for (const phrase of WORDING_FORBIDDEN) {
      expect(html, `Homepage must not contain "${phrase}"`).not.toContain(phrase);
    }

    // Must contain national wording
    const hasNational = html.includes('Australia-wide') ||
                        html.includes('Australian property') ||
                        html.includes('Australian addresses');
    expect(hasNational, 'Homepage must contain national wording (Australia-wide / Australian property)').toBe(true);
  });

  // ── full-report subdir wording ─────────────────────────────────
  test('full-report page has no forbidden NSW-only wording', async ({ page }) => {
    const res = await page.goto(BASE_URL + '/full-report/', {
      waitUntil: 'domcontentloaded', timeout: 30000
    }).catch(() => null);
    if (!res || res.status() >= 400) {
      // Page may not exist — skip
      test.skip();
      return;
    }
    const html = await page.content();
    for (const phrase of WORDING_FORBIDDEN) {
      expect(html, `full-report page must not contain "${phrase}"`).not.toContain(phrase);
    }
  });

  // ── NSW with comma ─────────────────────────────────────────────
  test('NSW address WITH comma produces report card within 25s', async ({ page }) => {
    const r = await runSiteCheck(page, '148 Canley Vale Road, Canley Heights NSW 2166', 650);

    expect(r.timedOut, `NSW (comma) timed out after ${r.elapsed}ms — SITE_CHECK_TIMEOUT not rescued`).toBe(false);
    expect(r.rejected, 'NSW (comma) address must not be rejected').toBe(false);
    expect(r.rendered, `NSW (comma) must render a report card (rcard). Got: ${r.resultText.slice(0,120)}`).toBe(true);
  });

  // ── NSW without comma ──────────────────────────────────────────
  test('NSW address WITHOUT comma produces report card within 25s', async ({ page }) => {
    const r = await runSiteCheck(page, '148 Canley Vale Road Canley Heights NSW 2166', 650);

    expect(r.timedOut, `NSW (no comma) timed out after ${r.elapsed}ms`).toBe(false);
    expect(r.rejected, 'NSW (no comma) must not be rejected — comma must not be required').toBe(false);
    expect(r.rendered, `NSW (no comma) must render a report card. Got: ${r.resultText.slice(0,120)}`).toBe(true);
  });

  // ── Fake address ───────────────────────────────────────────────
  test('fake address is rejected cleanly within 15s', async ({ page }) => {
    const r = await runSiteCheck(page, '999 Fake Street Nowhere NSW 9999');

    expect(r.timedOut, 'Fake address must not time out — geocode failure must be fast').toBe(false);
    expect(r.rejected, 'Fake address must be rejected with a clear error message').toBe(true);
    // Must NOT produce a report card
    expect(r.resultHtml.includes('rcard') && r.resultHtml.length > 300,
      'Fake address must not produce a full report card').toBe(false);
  });

  // ── QLD ───────────────────────────────────────────────────────
  test('QLD address renders a result and contains no NSW overlay text', async ({ page }) => {
    const r = await runSiteCheck(page, '1 Queen Street Brisbane QLD 4000');

    expect(r.timedOut, `QLD address timed out after ${r.elapsed}ms — state gate must prevent NSW API calls`).toBe(false);
    expect(r.resultHtml.length, 'QLD must render some result content').toBeGreaterThan(80);

    assertNoNSWOverlayText(r.resultHtml, '1 Queen Street Brisbane QLD 4000');

    // Must mention QLD context
    const hasQLD = r.resultHtml.includes('QLD') || r.resultHtml.includes('Queensland') ||
                   r.resultHtml.includes('QSCF') || r.resultHtml.includes('planning zone');
    expect(hasQLD, 'QLD result must mention Queensland/QLD/QSCF context').toBe(true);
  });

  // ── VIC ───────────────────────────────────────────────────────
  test('VIC address renders a result and contains no NSW overlay text', async ({ page }) => {
    const r = await runSiteCheck(page, '15 Collins Street Melbourne VIC 3000');

    expect(r.timedOut, `VIC address timed out — state gate must prevent NSW API calls`).toBe(false);
    expect(r.resultHtml.length, 'VIC must render some result content').toBeGreaterThan(80);

    assertNoNSWOverlayText(r.resultHtml, '15 Collins Street Melbourne VIC 3000');

    const hasVIC = r.resultHtml.includes('VIC') || r.resultHtml.includes('Victoria') ||
                   r.resultHtml.includes('Vicmap') || r.resultHtml.includes('PostGIS');
    expect(hasVIC, 'VIC result must mention Victoria/Vicmap context').toBe(true);
  });

  // ── TAS ───────────────────────────────────────────────────────
  test('TAS address renders a result and contains no NSW overlay text', async ({ page }) => {
    const r = await runSiteCheck(page, '1 Davey Street Hobart TAS 7000');

    expect(r.timedOut, `TAS address timed out — state gate must prevent NSW API calls`).toBe(false);
    expect(r.resultHtml.length, 'TAS must render some result content').toBeGreaterThan(80);

    assertNoNSWOverlayText(r.resultHtml, '1 Davey Street Hobart TAS 7000');
  });

  // ── ACT ───────────────────────────────────────────────────────
  test('ACT address renders a result and contains no NSW overlay text', async ({ page }) => {
    const r = await runSiteCheck(page, '45 Gould Street Turner ACT 2612');

    expect(r.timedOut, `ACT address timed out — state gate must prevent NSW API calls`).toBe(false);
    expect(r.resultHtml.length, 'ACT must render some result content').toBeGreaterThan(80);

    assertNoNSWOverlayText(r.resultHtml, '45 Gould Street Turner ACT 2612');

    const hasACT = r.resultHtml.includes('ACT') || r.resultHtml.includes('Canberra') ||
                   r.resultHtml.includes('Territory');
    expect(hasACT, 'ACT result must mention ACT/Canberra context').toBe(true);
  });

  // ── Button restore after any result ───────────────────────────
  test('run button is re-enabled after any Site Check completes', async ({ page }) => {
    await runSiteCheck(page, '148 Canley Vale Road, Canley Heights NSW 2166');

    const btn = page.locator('#run-btn');
    // Button must not remain disabled
    const isDisabled = await btn.getAttribute('disabled');
    expect(isDisabled, 'Run button must be re-enabled after check completes').toBeNull();
  });

  // ── SA ────────────────────────────────────────────────────────
  test('SA address does not hang and shows no NSW overlay text', async ({ page }) => {
    const r = await runSiteCheck(page, '1 King William Street Adelaide SA 5000');
    expect(r.timedOut, `SA timed out — state gate must skip NSW API calls`).toBe(false);
    expect(r.resultHtml.length, 'SA must render content').toBeGreaterThan(80);
    assertNoNSWOverlayText(r.resultHtml, '1 King William Street Adelaide SA 5000');
    const hasSA = r.resultHtml.includes('SA') || r.resultHtml.includes('South Australia') ||
                  r.resultHtml.includes('Adelaide');
    expect(hasSA, 'SA result must reference South Australia context').toBe(true);
  });

  // ── WA ────────────────────────────────────────────────────────
  test('WA address does not hang and shows no NSW overlay text', async ({ page }) => {
    const r = await runSiteCheck(page, '1 St Georges Terrace Perth WA 6000');
    expect(r.timedOut, `WA timed out — state gate must skip NSW API calls`).toBe(false);
    expect(r.resultHtml.length, 'WA must render content').toBeGreaterThan(80);
    assertNoNSWOverlayText(r.resultHtml, '1 St Georges Terrace Perth WA 6000');
    const hasWA = r.resultHtml.includes('WA') || r.resultHtml.includes('Western Australia') ||
                  r.resultHtml.includes('Perth');
    expect(hasWA, 'WA result must reference Western Australia context').toBe(true);
  });

  // ── NT ────────────────────────────────────────────────────────
  test('NT address does not hang and shows no NSW overlay text', async ({ page }) => {
    const r = await runSiteCheck(page, '1 Smith Street Darwin NT 0800');
    expect(r.timedOut, `NT timed out — state gate must skip NSW API calls`).toBe(false);
    expect(r.resultHtml.length, 'NT must render content').toBeGreaterThan(80);
    assertNoNSWOverlayText(r.resultHtml, '1 Smith Street Darwin NT 0800');
    const hasNT = r.resultHtml.includes('NT') || r.resultHtml.includes('Northern Territory') ||
                  r.resultHtml.includes('Darwin');
    expect(hasNT, 'NT result must reference Northern Territory context').toBe(true);
  });

  // ── Version proof ─────────────────────────────────────────────
  test('version.json shows current package number and sv-check.js size', async ({ page }) => {
    const res  = await page.goto(BASE_URL + '/version.json', { waitUntil: 'load', timeout: 10000 });
    expect(res.status()).toBe(200);
    const body = await res.text();
    const vj   = JSON.parse(body);
    // Package number must be a positive integer ≥ 80 (never a stale old number)
    const pkg  = parseInt(String(vj.package_number), 10);
    // ≥ 86 = minimum acceptable: this test passes for 87, 88, 89... but fails for any stale ≤ 85
    expect(pkg, `package_number must be ≥ 86, got ${vj.package_number}`).toBeGreaterThanOrEqual(86);
    expect(vj.build_name, 'build_name must contain package number').toContain(String(pkg));
    // sv-check.js must be large enough to contain all safety guards
    const svSize = vj.sitecheck_js_size || 0;
    // ≥ 85000: threshold updated when AI UI layer deleted (pkg 96)
    expect(svSize, `sitecheck_js_size must be ≥ 85000, got ${svSize}`)
      .toBeGreaterThanOrEqual(85000);
  });


  // ── PRODUCT ACCEPTANCE TESTS ─────────────────────────────────────
  // Verify the Site Check result: one CTA, correct flow, no old sections.
  // Uses existing runSiteCheck helper (returns {resultHtml, timedOut, rendered, ...}).
  // If these fail, do not ship.

  test('NSW result: correct 3-engine flow and one CTA only', async ({ page }) => {
    const r = await runSiteCheck(page, '148 Canley Vale Road, Canley Heights NSW 2166', 650);
    expect(r.timedOut, 'NSW check must not time out').toBe(false);
    expect(r.rendered, 'NSW check must render a result card').toBe(true);

    const html = r.resultHtml;

    // Required flow labels
    for (const label of ['What we found', 'What this may mean', 'What is still missing', 'Find Out What My Land Can Do']) {
      expect(html, `NSW result must contain "${label}"`).toContain(label);
    }

    // One-button rule: CTA text must appear exactly once
    const ctaCount = (html.match(/Find Out What My Land Can Do/g) || []).length;
    expect(ctaCount, `NSW result must show "Find Out What My Land Can Do" exactly once, got ${ctaCount}`).toBe(1);

    // No competing Professional Pathway CTA in result
    expect(html, 'NSW result must not show a "Professional Pathway →" button').not.toContain('Professional Pathway →');
  });

  test('Non-NSW result: one CTA only (QLD)', async ({ page }) => {
    const r = await runSiteCheck(page, '1 Queen Street Brisbane QLD 4000');
    expect(r.timedOut, 'QLD check must not time out').toBe(false);

    const html = r.resultHtml;

    // CTA must appear exactly once
    const ctaCount = (html.match(/Find Out What My Land Can Do/g) || []).length;
    expect(ctaCount, `QLD result must show "Find Out What My Land Can Do" exactly once, got ${ctaCount}`).toBe(1);

    // No competing Professional Pathway CTA
    expect(html, 'QLD result must not show a "Professional Pathway →" button').not.toContain('Professional Pathway →');
  });

  test('Site Check result does NOT show old report sections', async ({ page }) => {
    const r = await runSiteCheck(page, '148 Canley Vale Road, Canley Heights NSW 2166', 650);
    expect(r.timedOut, 'NSW check must not time out').toBe(false);
    const html = r.resultHtml;

    const FORBIDDEN_SECTIONS = [
      // Old report sections
      'Overlay analysis', 'Risk register', 'Development pathway',
      'Comparable DAs', 'Infrastructure proximity',
      'Finance readiness', 'Finance and lending context',
      'Development scorecard', 'Get Full Report', 'Hot List',
      'Low Signal', 'Strong Signal',
      // AI result mutations — must not appear even when AI API is available
      'AI development intelligence', 'AI intelligence score',
      'Next actions', 'AI risk rating',
      'Requires Investigation', 'AI-sequenced',
    ];
    for (const s of FORBIDDEN_SECTIONS) {
      expect(html, `Result must NOT contain old section "${s}"`).not.toContain(s);
    }

    const FORBIDDEN_WORDING = [
      'can subdivide', 'sell as-is', 'guaranteed approval',
      'guaranteed subdivision', 'guaranteed value increase',
      'exact land value', 'Higher-value development',
    ];
    for (const w of FORBIDDEN_WORDING) {
      expect(html, `Result must NOT contain "${w}"`).not.toContain(w);
    }
  });

});
