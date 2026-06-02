// tests/sitecheck.e2e.spec.js — SiteVerdict Release Check (Package 99C-r7)
// Replaces outdated Package 99 expectations. Product UI unchanged.
// Run against the built public/ dir served at BASE_URL (default http://localhost:8099).
//
// Network note: State A runs the live data engine. To keep the release-check
// deterministic and offline, government API calls are stubbed via route
// interception (geocode + NSW ArcGIS). This tests the r7 OUTPUT/UI contract,
// not the live data sources (which are unchanged in r7).

const { test, expect } = require('@playwright/test');

const BASE = process.env.BASE_URL || 'http://localhost:8099';
const NSW_ADDR = '12 Example Street, Parramatta NSW 2150';
const QLD_ADDR = '100 Queen Street, Brisbane QLD 4000';

function arcgis(url) {
  if (/\/11\/query/.test(url)) return { features: [{ attributes: { SYM_CODE: 'R3', LAY_CLASS: 'Medium Density Residential', LGA_NAME: 'City of Parramatta' } }] };
  if (/\/14\/query/.test(url)) return { features: [{ attributes: { LOT_SIZE: 300 } }] };
  return { features: [] };
}

async function stubNSW(page) {
  await page.route('**/*', route => {
    const u = route.request().url();
    if (u.includes('/.netlify/functions/geocode'))
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ found: true, lat: -33.8150, lon: 151.0, matchedAddr: NSW_ADDR, source: 'test', confidence: 'high', addrConfidence: 'high', council: 'City of Parramatta', postcode: '2150', addressQuality: 'rooftop' }) });
    if (u.includes('mapprod3.environment.nsw.gov.au'))
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(arcgis(u)) });
    if (u.includes('overpass-api.de')) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ elements: [] }) });
    if (u.includes('/.netlify/functions/daleads')) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ comps: [] }) });
    if (u.includes('arcgis') && u.includes('Cadastre')) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ features: [] }) });
    return route.continue();
  });
}

async function stubQLD(page) {
  await page.route('**/*', route => {
    const u = route.request().url();
    if (u.includes('/.netlify/functions/geocode'))
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ found: true, lat: -27.47, lon: 153.024, matchedAddr: QLD_ADDR, source: 'test', confidence: 'high', council: 'Brisbane', postcode: '4000', addressQuality: 'rooftop' }) });
    if (u.includes('mapprod3.environment.nsw.gov.au')) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ features: [] }) });
    if (u.includes('overpass-api.de')) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ elements: [] }) });
    if (u.includes('/.netlify/functions/daleads')) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ comps: [] }) });
    return route.continue();
  });
}

async function runStateA(page) {
  await page.fill('#addr', NSW_ADDR);
  await page.fill('#block', '695');
  await page.fill('#front', '15');
  await page.click('#run-btn');
  await page.waitForFunction(() => {
    const r = document.getElementById('result');
    return r && /What we found/.test(r.innerHTML);
  }, { timeout: 15000 });
  return page.evaluate(() => document.getElementById('result').innerHTML);
}

test.describe('SiteVerdict Release Check — 99C-r7', () => {

  test('homepage: NSW-first wording, no Australia-wide claim, Site Check inputs', async ({ page }) => {
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    const html = await page.content();

    // NSW-first wording present
    expect(html).toMatch(/Free NSW Site Check|NSW-first Site Check/);
    // No Australia-wide positioning
    expect(html).not.toMatch(/Australia-wide parcel check/);
    expect(html).not.toMatch(/any Australian property/);
    // Site Check inputs
    await expect(page.locator('#addr')).toHaveCount(1);
    await expect(page.locator('#block')).toHaveCount(1);
    await expect(page.locator('#front')).toHaveCount(1);
    // Check My Land action present
    expect(html).toMatch(/Check My Land/);
    // No upload on Site Check
    await expect(page.locator('input[type=file]')).toHaveCount(0);
    // No old CTA / gate / scorecard wording anywhere on the homepage
    expect(html).not.toMatch(/Find Out What My Land Can Do/);
    expect(html).not.toMatch(/free report unlocked/i);
    expect(html).not.toMatch(/Register to continue/i);
    expect(html).not.toMatch(/Executive Verdict/);
    expect(html).not.toMatch(/Institutional Scorecard/);
    expect(html).not.toMatch(/approval confidence/i);
  });

  test('version.json is sitecheck-release-check-99C-r7', async ({ page }) => {
    const res = await page.request.get(BASE + '/version.json');
    expect(res.ok()).toBeTruthy();
    const v = await res.json();
    expect(v.build_name).toBe('sitecheck-release-check-99C-r7');
  });

  test('NSW result: four sections, one Professional Review CTA, no old CTA/scorecard', async ({ page }) => {
    await stubNSW(page);
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    const result = await runStateA(page);

    // Four required result sections (in order)
    for (const h of ['What we found', 'What this means', 'What still needs checking', 'Next useful step']) {
      expect(result).toContain(h);
    }
    // No old result headings
    expect(result).not.toMatch(/signal-heading">Advantages/);
    expect(result).not.toMatch(/Disadvantages/);
    // User-entered labels present
    expect(result).toMatch(/User entered/);
    expect(result).toMatch(/not independently verified/);
    // Exactly one main Professional Review CTA in the result
    const ctaCount = await page.locator('#result a:has-text("Professional Review")').count();
    expect(ctaCount).toBe(1);
    // No old CTA / gate / score in the result
    expect(result).not.toMatch(/Find Out What My Land Can Do/);
    expect(result).not.toMatch(/free report unlocked/i);
    expect(result).not.toMatch(/Executive Verdict/);
    expect(result).not.toMatch(/Institutional Scorecard/);
    expect(result).not.toMatch(/approval confidence/i);
    expect(result).not.toMatch(/\/\s*100\b/); // no /100 score
  });

  test('reduced state: missing land size/frontage shows Not confirmed + Professional Review only', async ({ page }) => {
    await stubNSW(page);
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.fill('#addr', NSW_ADDR);
    await page.click('#run-btn');
    await page.waitForTimeout(600);
    const result = await page.evaluate(() => document.getElementById('result').innerHTML);
    expect(result).toMatch(/Land size: Not confirmed/);
    expect(result).toMatch(/Frontage: Not confirmed/);
    expect(result).toMatch(/Professional verification needed/);
    expect(result).toMatch(/Professional Review/);
    // No confident facts / score in reduced state
    expect(result).not.toMatch(/\/\s*100\b/);
  });

  test('non-NSW (QLD): Professional Review CTA, no NSW full-check claim, no old CTA', async ({ page }) => {
    await stubQLD(page);
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.fill('#addr', QLD_ADDR);
    await page.fill('#block', '500');
    await page.fill('#front', '15');
    await page.click('#run-btn');
    await page.waitForTimeout(2500);
    const result = await page.evaluate(() => document.getElementById('result').innerHTML);
    expect(result).toContain('/professional-review.html');
    expect(result).not.toMatch(/Find Out What My Land Can Do/);
    expect(result).not.toMatch(/full-report/);
    // Honest non-NSW: no claim that NSW-grade planning data is confirmed here
    expect(result).not.toMatch(/Minimum lot size \(confirmed LEP\)/);
  });

  test('Professional Review page: fields, optional upload, 24–48 wording, thanks action', async ({ page }) => {
    await page.goto(BASE + '/professional-review.html', { waitUntil: 'networkidle' });
    await expect(page.locator('input[name=name]')).toHaveCount(1);
    await expect(page.locator('input[name=email]')).toHaveCount(1);
    await expect(page.locator('input[name=property_address]')).toHaveCount(1);
    await expect(page.locator('select[name=purpose]')).toHaveCount(1);
    await expect(page.locator('textarea[name=notes]')).toHaveCount(1);
    await expect(page.locator('input[type=file]')).toHaveCount(1); // optional upload, PR only
    const html = await page.content();
    expect(html).toMatch(/24.?48 hours on business working days/);
    expect(await page.locator('form').getAttribute('action')).toBe('/professional-review-thanks.html');
  });

  test('Professional Review thank-you page exists with confirmation + wording', async ({ page }) => {
    const res = await page.request.get(BASE + '/professional-review-thanks.html');
    expect(res.ok()).toBeTruthy();
    await page.goto(BASE + '/professional-review-thanks.html', { waitUntil: 'networkidle' });
    const html = await page.content();
    expect(html).toMatch(/Thank you\. We received your request\./);
    expect(html).toMatch(/24.?48 hours on business working days/);
  });
});
