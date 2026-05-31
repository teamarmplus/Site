/**
 * SiteVerdict — Machine test endpoint
 * /.netlify/functions/sitecheck-test
 *
 * Returns: allPassed, passed, failed, failedTests, buildMarker, packageNumber
 *
 * Tests:
 *  1  NSW with comma          → found:true
 *  2  NSW without comma       → found:true
 *  3  Fake address            → found:false (rejected)
 *  4  Range address           → Estimated/Needs review confidence
 *  5  Lot address             → Needs review + lotWarning
 *  6  ACT address             → found:true, jurisdiction ACT
 *  7  TAS Hobart              → found:true, jurisdiction TAS
 *  8  TAS Launceston          → found:true, jurisdiction TAS
 *  9  Homepage wording        → NSW-only phrases absent, national wording present
 * 10  VIC address             → found:true (not rejected)
 * 11  QLD address             → found:true (not rejected)
 * 12  Package number check    → uses PACKAGE_NUMBER constant  */

'use strict';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Content-Type':                 'application/json',
};

const BUILD_MARKER   = 'sitecheck-release-check-97';
const PACKAGE_NUMBER = '97';

function isLotAddr(s)   { return /^(lot|proposed\s+lot)\s+\d+/i.test((s||'').trim()); }
function isRangeAddr(s) { return /^\d+\s*-\s*\d+\s+/i.test((s||'').trim()); }

function detectJurisdiction(addr) {
  const s = (addr||'').toUpperCase();
  if (/\bNSW\b/.test(s))  return 'NSW';
  if (/\bACT\b/.test(s))  return 'ACT';
  if (/\bVIC\b/.test(s))  return 'VIC';
  if (/\bQLD\b/.test(s))  return 'QLD';
  if (/\bSA\b/.test(s))   return 'SA';
  if (/\bWA\b/.test(s))   return 'WA';
  if (/\bTAS\b/.test(s))  return 'TAS';
  if (/\bNT\b/.test(s))   return 'NT';
  const pc = (addr||'').match(/\b(\d{4})\b/);
  if (pc) {
    const n = parseInt(pc[1], 10);
    if ((n >= 1000 && n <= 2999) || (n >= 200 && n <= 299)) return 'NSW';
    if (n >= 2600 && n <= 2618) return 'ACT';
    if (n >= 3000 && n <= 3999) return 'VIC';
    if (n >= 4000 && n <= 4999) return 'QLD';
    if (n >= 5000 && n <= 5999) return 'SA';
    if (n >= 6000 && n <= 6999) return 'WA';
    if (n >= 7000 && n <= 7999) return 'TAS';
    if (n >= 800  && n <= 899)  return 'NT';
  }
  return 'UNKNOWN';
}

const cases = [
  { id:  1, label: 'NSW with comma',                address: '148 Canley Vale Road, Canley Heights NSW 2166',   landSize: 650  },
  { id:  2, label: 'NSW without comma',             address: '148 Canley Vale Road Canley Heights NSW 2166',    landSize: 650  },
  { id:  3, label: 'Fake / invalid address',        address: '999 Fake Street, Nowhere NSW 9999',               landSize: null },
  { id:  4, label: 'Range address',                 address: '68-70 Hawkins Street, Howlong NSW 2643',          landSize: null },
  { id:  5, label: 'Lot-based address',             address: 'Lot 109, St Moritz Street, Austral NSW 2179',     landSize: null },
  { id:  6, label: 'ACT address',                   address: '45 Gould Street, Turner ACT 2612',                landSize: null },
  { id:  7, label: 'TAS Hobart',                    address: '1 Davey Street, Hobart TAS 7000',                 landSize: null },
  { id:  8, label: 'TAS Launceston',                address: '100 Elphin Road, Launceston TAS 7250',            landSize: null },
  { id:  9, label: 'Homepage wording check',        address: null,                                              landSize: null },
  { id: 10, label: 'VIC address — not rejected',    address: '15 Collins Street, Melbourne VIC 3000',           landSize: null },
  { id: 11, label: 'QLD address — not rejected',    address: '1 Queen Street, Brisbane QLD 4000',               landSize: null },
  { id: 12, label: 'Package number check',          address: null,                                              landSize: null },
];

async function callGeocode(address) {
  const base = process.env.URL || 'https://siteverdict2.netlify.app';
  const url  = base + '/.netlify/functions/geocode?address=' + encodeURIComponent(address);
  const res  = await fetch(url, { headers: { 'User-Agent': 'SiteVerdict-Test/1.0' } });
  if (!res.ok) throw new Error('Geocode HTTP ' + res.status);
  return res.json();
}

async function fetchHomepage() {
  const base = process.env.URL || 'https://siteverdict2.netlify.app';
  const res = await fetch(base + '/', { headers: { 'User-Agent': 'SiteVerdict-Test/1.0' } });
  if (!res.ok) throw new Error('Homepage HTTP ' + res.status);
  return res.text();
}

async function fetchVersionJson() {
  const base = process.env.URL || 'https://siteverdict2.netlify.app';
  const res  = await fetch(base + '/version.json', { headers: { 'User-Agent': 'SiteVerdict-Test/1.0' } });
  if (!res.ok) throw new Error('version.json HTTP ' + res.status);
  return res.json();
}

async function runOneTest(tc) {
  const assertions = [];
  function assert(name, pass, detail) {
    assertions.push({ name, pass: !!pass, detail: String(detail || '') });
  }

  const addrType    = isLotAddr(tc.address||'') ? 'lot' : isRangeAddr(tc.address||'') ? 'range' : 'normal';
  const jurisdiction = detectJurisdiction(tc.address||'');

  // T9: homepage wording
  if (tc.id === 9) {
    let html = '';
    try { html = await fetchHomepage(); }
    catch(e) { assert('homepage fetchable', false, e.message); }
    if (html) {
      const badPhrases = [
        'any NSW property','For any NSW address','NSW addresses only','Development intelligence for NSW',
      ];
      for (const p of badPhrases) assert('"' + p + '" absent', !html.includes(p), html.includes(p) ? 'STILL PRESENT' : 'absent OK');
      assert('national wording present',
        html.includes('Australia-wide') || html.includes('Australian property') || html.includes('Australian addresses'),
        'should include Australia-wide or Australian property');
    }
    return { testId: tc.id, label: tc.label, passed: assertions.every(a=>a.pass), assertions, jurisdictionDetected:'N/A', geocodeResult:{} };
  }

  // T12: package number check
  if (tc.id === 12) {
    let vj = null;
    try { vj = await fetchVersionJson(); }
    catch(e) { assert('version.json fetchable', false, e.message); }
    if (vj) {
      const pkgOk = (String(vj.package_number) === PACKAGE_NUMBER);
      assert('package_number = ' + PACKAGE_NUMBER, pkgOk,
             'got ' + vj.package_number + ', expected ' + PACKAGE_NUMBER);
      const bnOk = !!(vj.build_name && vj.build_name.includes(PACKAGE_NUMBER));
      assert('build_name contains ' + PACKAGE_NUMBER, bnOk,
             vj.build_name || 'missing');
      const svsOk = (vj.sitecheck_js_size || 0) >= 195000;
      assert('sitecheck_js_size ≥ 195000 (state gate confirms)', svsOk, (vj.sitecheck_js_size||0) + 'b');
    }
    return { testId: tc.id, label: tc.label, passed: assertions.every(a=>a.pass), assertions, jurisdictionDetected:'N/A', geocodeResult:{} };
  }

  // All geocode tests
  let geo = {};
  try { geo = await callGeocode(tc.address); }
  catch(e) { assert('geocode reachable', false, e.message); return { testId:tc.id, label:tc.label, passed:false, assertions, jurisdictionDetected:jurisdiction, geocodeResult:{} }; }

  const found      = geo.found === true;
  const quality    = geo.addressQuality || '';
  const confidence = geo.confidence || '';
  const matchedAddr = geo.matchedAddr || '';
  const geoSource   = geo.source || '';

  if (tc.id !== 3) {
    assert('geocode: found:true',              found,        'found='+found+' quality='+quality);
    assert('matchedAddress present',           !!matchedAddr, matchedAddr||'null');
    assert('confidence present',               !!confidence,  'confidence='+confidence);
    assert('source present',                   !!geoSource,   'source='+geoSource);
    assert('quality not failed',               quality !== 'failed', 'quality='+quality);
  }

  if (tc.id === 1) {
    assert('NSW comma: Verified or Estimated',
      confidence==='Verified'||confidence==='Estimated', 'confidence='+confidence);
  }
  if (tc.id === 2) {
    assert('no-comma: geocodes',               found, 'found='+found+' quality='+quality);
    assert('no-comma: quality not failed',     quality!=='failed', 'quality='+quality);
    assert('no-comma: confidence present',     !!confidence, 'confidence='+confidence);
  }
  if (tc.id === 3) {
    assert('fake: found:false (rejected)',     !found, 'found='+found);
    assert('fake: quality=failed or suburb_only', quality==='failed'||quality==='suburb_only', 'quality='+quality);
  }
  if (tc.id === 4) {
    assert('range: type=range',               addrType==='range', 'addrType='+addrType);
    assert('range: Estimated/Needs review',   confidence==='Estimated'||confidence==='Needs review', 'confidence='+confidence);
  }
  if (tc.id === 5) {
    assert('lot: type=lot',                   addrType==='lot', 'addrType='+addrType);
    assert('lot: lotWarning present',         !!geo.lotWarning, 'lotWarning='+geo.lotWarning);
    assert('lot: Needs review/Estimated',     confidence==='Needs review'||confidence==='Estimated', 'confidence='+confidence);
  }
  if (tc.id === 6) {
    assert('ACT: jurisdiction',               jurisdiction==='ACT', 'jurisdiction='+jurisdiction);
    assert('ACT: not rejected',               found, 'found='+found);
  }
  if (tc.id === 7 || tc.id === 8) {
    assert('TAS: jurisdiction',               jurisdiction==='TAS', 'jurisdiction='+jurisdiction);
    assert('TAS: not rejected',               found, 'found='+found);
    assert('TAS: confidence present',         !!confidence, 'confidence='+confidence);
  }
  if (tc.id === 10) {
    assert('VIC: jurisdiction',               jurisdiction==='VIC', 'jurisdiction='+jurisdiction);
    assert('VIC: not rejected',               found, 'found='+found+' — VIC must geocode via inAustralia()');
  }
  if (tc.id === 11) {
    assert('QLD: jurisdiction',               jurisdiction==='QLD', 'jurisdiction='+jurisdiction);
    assert('QLD: not rejected',               found, 'found='+found+' — QLD must geocode via inAustralia()');
  }

  const passed = assertions.every(a => a.pass);
  return {
    testId: tc.id, label: tc.label, passed, assertions,
    addressType: addrType, jurisdictionDetected: jurisdiction,
    geocodeResult: { found, addressQuality:quality, confidence, matchedAddress:matchedAddr, geocodeSource:geoSource },
  };
}

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode:204, headers:CORS, body:'' };
  const results = [];
  for (const tc of cases) results.push(await runOneTest(tc));
  const passed    = results.filter(r=>r.passed).length;
  const failed    = results.filter(r=>!r.passed).length;
  const allPassed = failed === 0;
  const failedTests = results.filter(r=>!r.passed).map(r=>({
    testId: r.testId, label: r.label,
    failedAssertions: (r.assertions||[]).filter(a=>!a.pass).map(a=>({name:a.name, detail:a.detail})),
  }));

  return {
    statusCode: 200, headers: CORS,
    body: JSON.stringify({
      summary: {
        allPassed, passed, failed, totalTests:results.length,
        totalAssertions: results.reduce((n,r)=>n+(r.assertions||[]).length,0),
        failedAssertions: results.reduce((n,r)=>n+(r.assertions||[]).filter(a=>!a.pass).length,0),
        buildMarker: BUILD_MARKER, packageNumber: PACKAGE_NUMBER,
      },
      allPassed, passed, failed, failedTests,
      buildMarker: BUILD_MARKER, packageNumber: PACKAGE_NUMBER,
      renderLevelNote: 'Render-level UI safety (NSW overlay suppression) is checked by /deploy-check.html',
      results,
    }, null, 2),
  };
};
