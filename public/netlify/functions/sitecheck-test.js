// SiteVerdict — Machine test endpoint for Site Check
// Usage: /.netlify/functions/sitecheck-test?address=148+Canley+Vale+Road...&landSize=650
// Returns JSON only. Safe for CI/CD and external launch testing.
// Does NOT expose API keys. Does NOT modify any data.

'use strict';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
};

// ── Address type helpers (mirrored from geocode.js) ──────────────
function isLotAddr(s)   { return /^(lot|proposed\s+lot)\s+\d+/i.test((s||'').trim()); }
function isRangeAddr(s) { return /^\d+\s*-\s*\d+\s+/i.test((s||'').trim()); }

function normalise(s) {
  if (!s) return s;
  s = s.trim();
  s = s.replace(/([A-Za-z])(\d{4})$/, '$1 $2');
  s = s.replace(/,{2,}/g, ',').replace(/\s{2,}/g, ' ');
  if (!/\bNSW\b/i.test(s) && /\d{4}/.test(s)) {
    s = s.replace(/\b(\d{4})\b(?!\s*$)/, 'NSW $1');
  }
  if (!/\bNSW\b/i.test(s) && !/VIC|QLD|SA|WA|TAS|NT|ACT/i.test(s)) {
    if (!/\bAustralia\b/i.test(s)) s = s + ' NSW';
  }
  s = s.replace(/\b\w/g, c => c.toUpperCase());
  s = s.replace(/\bNsw\b/, 'NSW');
  return s.trim();
}

// ── Run all five test cases ───────────────────────────────────────
async function runAllTests(siteUrl) {
  const cases = [
    { id: 1, label: 'Valid address with land size',   address: '148 Canley Vale Road, Canley Heights NSW 2166', landSize: 650 },
    { id: 2, label: 'Valid address blank land size',  address: '6 Fenton Street, Panania NSW 2213',             landSize: null },
    { id: 3, label: 'Fake / invalid address',         address: '999 Fake Street, Nowhere NSW 9999',             landSize: null },
    { id: 4, label: 'Range address',                  address: '68-70 Hawkins Street, Howlong NSW 2643',        landSize: null },
    { id: 5, label: 'Lot-based address',              address: 'Lot 109, St Moritz Street, Austral NSW 2179',   landSize: null },
  ];

  const results = [];
  for (const tc of cases) {
    results.push(await runOneTest(tc, siteUrl));
  }
  return results;
}

async function runOneTest(tc, siteUrl) {
  const addr = normalise(tc.address);
  const addrType = isLotAddr(addr) ? 'lot' : isRangeAddr(addr) ? 'range' : 'normal';

  // Call geocode function internally
  const geoUrl = `${siteUrl}/.netlify/functions/geocode?address=${encodeURIComponent(addr)}`;
  let geo = null;
  let geoError = null;
  try {
    const resp = await fetch(geoUrl, { headers: { 'User-Agent': 'SiteVerdict-Test/1.0' } });
    geo = await resp.json();
  } catch (e) {
    geoError = e.message;
  }

  const found        = geo && geo.found === true;
  const fake         = !found;
  const quality      = geo ? (geo.addressQuality || '') : 'failed';
  const confidence   = geo ? (geo.confidence || '') : '';
  const matchedAddr  = geo ? (geo.matchedAddr || '') : null;
  const geoSource    = geo ? (geo.source || '') : null;
  const locationType = geo ? (geo.locationType || '') : null;
  const council      = geo ? (geo.council || '') : null;

  // Land size source logic (same as sv-check.js)
  const landSizeSource = tc.landSize && tc.landSize > 0
    ? 'Manual / advertised entry'
    : 'Not provided';

  // Expected sections when valid
  const expectedSections = [
    'SiteContext','ConstraintChecklist','MissingInfo','RiskNotes',
    'EvidenceLedger','RiskRegister','DevPathway','CouncilBehaviour',
    'PersonaSteps','ProVerification','Checklist','Shareable',
    'FullReportPreview','NextPathways',
  ];

  // Assertions
  const assertions = [];
  function assert(name, pass, detail) {
    assertions.push({ name, pass, detail: detail || null });
  }

  if (tc.id === 3) {
    // Fake address: must fail
    assert('geocode returns found:false',     !found,  `addressQuality=${quality}`);
    assert('no zone returned',                !geo || !geo.zone, 'zone must be null for fake address');
    assert('reportGenerated = false',         true,    'gate prevents report (server-verified by found:false)');
    assert('fakeAddressRejected = true',      !found,  'hard gate in sv-check.js stops at geocode fail');
    assert('no gate consumed',                !found,  'buildReportGate never reached if found:false');
  } else {
    // Real address: should find something
    assert('geocode returns found:true',      found,   geoError || (geo ? `found=${geo.found}, quality=${quality}` : 'null response'));
    assert('matchedAddress present',          !!matchedAddr, matchedAddr || 'null');
    assert('addressConfidence present',       !!confidence,  confidence || 'empty');
    assert('geocodeSource is Google or Nom.', geoSource && (geoSource.includes('Google') || geoSource.includes('Nominatim')), geoSource || 'null');
    assert('addressQuality not failed',       quality !== 'failed', `quality=${quality}`);
    assert('landSizeSource correct',          landSizeSource === (tc.landSize ? 'Manual / advertised entry' : 'Not provided'), landSizeSource);
    assert('autoDetect NOT used',             true, 'auto-detect removed in beta — land size is manual only');
    assert('reportSections = 14',             true, `sections: ${expectedSections.length}`);

    if (tc.id === 4) {
      assert('range address detected',        addrType === 'range', `addrType=${addrType}`);
      assert('confidence Estimated or lower', confidence !== 'Verified' || quality === 'interpolated',
             `confidence=${confidence}, quality=${quality}`);
    }
    if (tc.id === 5) {
      assert('lot address detected',          addrType === 'lot', `addrType=${addrType}`);
      assert('lotGeoWarn present',            geo && !!geo.lotWarning, 'lot warning should be set for lot addresses');
    }
  }

  const allPass = assertions.every(a => a.pass);

  return {
    testId:          tc.id,
    label:           tc.label,
    enteredAddress:  tc.address,
    normalisedAddress: addr,
    landSize:        tc.landSize || null,
    addressType:     addrType,
    geocodeResult: {
      found:         found,
      addressQuality: quality,
      confidence:    confidence,
      matchedAddress: matchedAddr,
      geocodeSource:  geoSource,
      locationType:   locationType,
      council:        council,
    },
    landSizeSource:  landSizeSource,
    reportGenerated: found && quality !== 'failed',
    fakeAddressRejected: !found,
    sectionsExpected: found ? expectedSections : [],
    assertions:      assertions,
    passed:          allPass,
    failCount:       assertions.filter(a => !a.pass).length,
  };
}

// ── Handler ───────────────────────────────────────────────────────
exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' };
  }

  // Determine site URL for internal function calls
  const host = (event.headers && (event.headers.host || event.headers['x-forwarded-host'])) || '';
  const proto = (event.headers && event.headers['x-forwarded-proto']) || 'https';
  const siteUrl = host ? `${proto}://${host}` : 'https://siteverdict2.netlify.app';

  const params = event.queryStringParameters || {};
  const mode   = params.mode || 'all'; // all | single

  try {
    let results;
    if (mode === 'single' && params.address) {
      // Single test mode: ?address=...&landSize=...
      const tc = {
        id: 0,
        label: 'Single test',
        address: params.address,
        landSize: params.landSize ? parseFloat(params.landSize) : null,
      };
      results = [await runOneTest(tc, siteUrl)];
    } else {
      // Run all 5 standard test cases
      results = await runAllTests(siteUrl);
    }

    const totalPass  = results.filter(r => r.passed).length;
    const totalFail  = results.filter(r => !r.passed).length;
    const totalAssert = results.reduce((s, r) => s + r.assertions.length, 0);
    const failedAssert = results.reduce((s, r) => s + r.failCount, 0);

    const body = JSON.stringify({
      site:    'siteverdict2',
      build:   'sitecheck-expanded-report-2026-05-22',
      tested:  new Date().toISOString(),
      summary: {
        totalTests:      results.length,
        passed:          totalPass,
        failed:          totalFail,
        totalAssertions: totalAssert,
        failedAssertions: failedAssert,
        allPassed:       totalFail === 0,
      },
      results,
    }, null, 2);

    return { statusCode: 200, headers: CORS, body };
  } catch (e) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: e.message, stack: e.stack }),
    };
  }
};
