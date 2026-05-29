#!/usr/bin/env node
/**
 * SiteVerdict Daily AI Check
 *
 * Agentic scan that detects problems without human involvement.
 * Run manually or schedule daily.
 *
 * Usage:
 *   node scripts/daily-check.js
 *   BASE_URL=https://siteverdict2.netlify.app node scripts/daily-check.js
 *
 * Checks:
 *   1.  Live version matches expected package number
 *   2.  sitecheck-test passes (allPassed=true)
 *   3.  NSW-only wording absent from live public pages
 *   4.  Geocode works for NSW, QLD, TAS, ACT, VIC (all states represented)
 *   5.  sv-check.js safety guards still in deployed file
 *   6.  Fake address rejects
 *   7.  deploy-check render-test page is accessible (SAMEORIGIN)
 *   8.  No raw dataset files in public/ (VIC/QLD GDB)
 *   9.  PRINCIPLES.md exists and contains core principle
 *  10.  version.json has all required provenance fields
 *
 * Outputs a structured report:
 *   - what changed (if any)
 *   - what broke
 *   - what needs founder decision
 *   Writes to DAILY_LOG.md
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT     = path.resolve(__dirname, '..');
const PUBLIC   = path.join(ROOT, 'public');
const BASE_URL = process.env.BASE_URL || 'https://siteverdict2.netlify.app';
const LOG_FILE = path.join(ROOT, 'DAILY_LOG.md');

const today = new Date().toISOString().slice(0, 10);

let passed = 0, failed = 0;
const results   = [];
const decisions = [];
const findings  = [];

function ok(label, detail)   { passed++; results.push({ pass: true,  label, detail: detail||'' }); }
function fail(label, detail) { failed++; results.push({ pass: false, label, detail: detail||'' }); }
function finding(msg)        { findings.push(msg); }
function decision(msg)       { decisions.push(msg); }

// ── Local checks (no network) ─────────────────────────────────────

function checkLocalFiles() {
  console.log('\n=== LOCAL FILE CHECKS ===');

  // version.json
  const vjPath = path.join(PUBLIC, 'version.json');
  try {
    const vj = JSON.parse(fs.readFileSync(vjPath, 'utf8'));
    const required = ['package_number','build_name','build_time','sitecheck_js_size',
                      'geocode_js_size','sitecheck_js_hash'];
    const missing  = required.filter(k => !vj[k]);
    if (missing.length === 0) {
      ok('version.json has all provenance fields', `pkg=${vj.package_number} svs=${vj.sitecheck_js_size}b`);
    } else {
      fail('version.json missing fields', missing.join(', '));
      decision('Update version.json to include: ' + missing.join(', '));
    }
    // Check sv-check.js size vs version.json claim
    const actualSvSize = fs.existsSync(path.join(PUBLIC, 'assets', 'sv-check.js'))
      ? fs.statSync(path.join(PUBLIC, 'assets', 'sv-check.js')).size : 0;
    if (Math.abs(actualSvSize - (vj.sitecheck_js_size || 0)) > 100) {
      fail('version.json sitecheck_js_size mismatch',
        `claimed ${vj.sitecheck_js_size} actual ${actualSvSize} — rebuild version.json`);
    } else {
      ok('sitecheck_js_size matches actual file', `${actualSvSize}b`);
    }
  } catch(e) { fail('version.json parse', e.message); }

  // NSW-only wording in public HTML
  const FORBIDDEN = ['any NSW property','For any NSW address','NSW addresses only',
                     'Development intelligence for NSW'];
  const SKIP = new Set(['deploy-check.html']);
  let wordingClean = true;

  function walkHtml(dir) {
    for (const fname of fs.readdirSync(dir)) {
      const full = path.join(dir, fname);
      if (fs.statSync(full).isDirectory()) walkHtml(full);
      else if (fname.endsWith('.html') && !SKIP.has(fname)) {
        const rel = path.relative(PUBLIC, full);
        if (rel.startsWith('netlify' + path.sep)) continue;
        const c = fs.readFileSync(full, 'utf8');
        const hits = FORBIDDEN.filter(p => c.includes(p));
        if (hits.length) {
          fail(`NSW wording in ${rel}`, hits.join(', '));
          wordingClean = false;
          finding(`"${hits[0]}" found in public/${rel} — misleads non-NSW users`);
        }
      }
    }
  }
  walkHtml(PUBLIC);
  if (wordingClean) ok('All public HTML wording clean', 'No NSW-only phrases');

  // sv-check.js safety guards
  const svContent = fs.readFileSync(path.join(PUBLIC, 'assets', 'sv-check.js'), 'utf8');
  const guards = [
    ['_timeoutId (20s runCheck guard)',        '_timeoutId'],
    ['SITE_CHECK_TIMEOUT card',               'SITE_CHECK_TIMEOUT'],
    ['ftx() 9s AbortController (NSW fetches)', 'function ftx('],
    ['_detState non-NSW gate',                '_detState'],
    ['_showNonNSWResult function',            'function _showNonNSWResult('],
    ['overpass 8s timeout',                   'overpass-api.de'],
  ];
  let guardsFail = [];
  for (const [label, needle] of guards) {
    if (!svContent.includes(needle)) guardsFail.push(label);
  }
  if (guardsFail.length === 0) {
    ok('sv-check.js: all safety guards present', `${svContent.length}b`);
  } else {
    fail('sv-check.js: missing guards', guardsFail.join(', '));
    decision('Re-apply safety guards to sv-check.js: ' + guardsFail.join(', '));
  }

  // No raw dataset files in public/
  const BANNED_EXTENSIONS = ['.gdb', '.shp', '.gpkg'];
  let rawFound = [];
  function walkRaw(dir) {
    for (const fname of fs.readdirSync(dir)) {
      const full = path.join(dir, fname);
      if (fs.statSync(full).isDirectory()) walkRaw(full);
      else if (BANNED_EXTENSIONS.some(ext => fname.endsWith(ext))) rawFound.push(full);
    }
  }
  walkRaw(PUBLIC);
  if (rawFound.length === 0) ok('No raw spatial datasets in public/', 'GDB/SHP/GPKG absent');
  else { fail('Raw datasets found in public/', rawFound.join(', ')); decision('Remove raw datasets from public/: ' + rawFound.join(', ')); }

  // PRINCIPLES.md
  const prinPath = path.join(ROOT, 'PRINCIPLES.md');
  if (fs.existsSync(prinPath)) {
    const prin = fs.readFileSync(prinPath, 'utf8');
    if (prin.includes('Adaptive usefulness') && prin.includes('Daily AI operating rule')) {
      ok('PRINCIPLES.md exists and complete');
    } else {
      fail('PRINCIPLES.md incomplete', 'Missing core principle or daily rule');
    }
  } else {
    fail('PRINCIPLES.md missing');
    decision('Create PRINCIPLES.md — core operating document');
  }

  // netlify.toml SAMEORIGIN exception
  const ntContent = fs.readFileSync(path.join(ROOT, 'netlify.toml'), 'utf8');
  if (ntContent.includes('SAMEORIGIN') && ntContent.includes('sitecheck-render-test')) {
    ok('netlify.toml: SAMEORIGIN exception for render-test page');
  } else {
    fail('netlify.toml: missing SAMEORIGIN for /sitecheck-render-test.html',
      'deploy-check iframe tests will fail with cross-origin error');
    decision('Add X-Frame-Options = "SAMEORIGIN" exception in netlify.toml for /sitecheck-render-test.html');
  }

  // Playwright tests exist
  const specPath = path.join(ROOT, 'tests', 'sitecheck.e2e.spec.js');
  if (fs.existsSync(specPath)) {
    const spec = fs.readFileSync(specPath, 'utf8');
    const tcount = (spec.match(/^\s*test\(/gm) || []).length;
    ok(`Playwright spec exists (${tcount} tests)`);
  } else {
    fail('Playwright spec missing', 'tests/sitecheck.e2e.spec.js not found');
    decision('Create Playwright spec — CI safety requires browser tests');
  }
}

// ── Live network checks ──────────────────────────────────────────

async function checkLive() {
  console.log(`\n=== LIVE CHECKS (${BASE_URL}) ===`);

  if (typeof fetch === 'undefined') {
    console.log('  fetch not available in this Node version — skipping live checks');
    finding('Node version lacks fetch — live checks skipped. Run on Node 18+.');
    return;
  }

  const cache = { cache: 'no-store', headers: { 'User-Agent': 'SiteVerdict-DailyCheck/1.0' } };

  // version.json
  try {
    const vj = await (await fetch(`${BASE_URL}/version.json?_=${Date.now()}`, cache)).json();
    const pkg = parseInt(vj.package_number || '0', 10);
    if (pkg >= 86) {  // minimum acceptable deployed package (update when older packages are retired)
      ok(`Live package_number = ${pkg}`, vj.build_name || '');
    } else {
      fail(`Live package_number = ${pkg} (expected ≥ 86)`, 'Deploy may be stale');
      finding(`Live site shows package ${pkg} — latest local build is 87. Deploy new package.`);
      decision('Deploy latest package to Netlify — live site is behind local build.');
    }
    const svs = vj.sitecheck_js_size || 0;
    if (svs >= 200000) ok(`Live sv-check.js size = ${svs}b`);
    else { fail(`Live sv-check.js too small (${svs}b)`, 'Timeout + state gate guards may be missing'); finding(`Live sv-check.js is ${svs}b — expected ≥200000b. Deploy with safety guards.`); }
  } catch(e) { fail('Live version.json', e.message); }

  // sitecheck-test
  try {
    const st = await (await fetch(`${BASE_URL}/.netlify/functions/sitecheck-test?_=${Date.now()}`, cache)).json();
    const s  = st.summary || st;
    if (s.allPassed) {
      ok(`sitecheck-test allPassed=true (${s.passed}/${s.totalTests||s.passed})`, s.buildMarker || '');
    } else {
      fail(`sitecheck-test failed (${s.failed} failing)`,
        (st.failedTests || []).map(t => 'T' + t.testId + ':' + t.label).join(', '));
      finding(`sitecheck-test: ${s.failed} test(s) failing on live site.`);
      decision('Fix failing sitecheck-test cases before next deploy.');
    }
  } catch(e) { fail('sitecheck-test', e.message); }

  // Geocode spot-check — one address per non-NSW state
  const geoTests = [
    ['NSW',  '148 Canley Vale Road, Canley Heights NSW 2166'],
    ['QLD',  '1 Queen Street Brisbane QLD 4000'],
    ['TAS',  '1 Davey Street Hobart TAS 7000'],
    ['VIC',  '15 Collins Street Melbourne VIC 3000'],
    ['ACT',  '45 Gould Street Turner ACT 2612'],
    ['FAKE', '999 Fake Street Nowhere NSW 9999'],
  ];
  for (const [state, addr] of geoTests) {
    try {
      const g = await (await fetch(
        `${BASE_URL}/.netlify/functions/geocode?address=${encodeURIComponent(addr)}`, cache
      )).json();
      if (state === 'FAKE') {
        if (!g.found) ok(`Fake address rejected`, `quality=${g.addressQuality}`);
        else { fail(`Fake address NOT rejected`, `found=true quality=${g.addressQuality}`); finding('Fake address geocodes — fake address gate may be broken.'); }
      } else {
        if (g.found) ok(`Geocode ${state} → found:true`, `conf=${g.confidence} src=${g.source||'?'}`);
        else {
          fail(`Geocode ${state} → found:false`, `quality=${g.addressQuality} reason=${g.reason||'?'}`);
          finding(`${state} addresses returning found:false — users in ${state} cannot use Site Check.`);
          if (state !== 'NSW') decision(`Fix geocode for ${state} addresses — inAustralia() gate may be broken.`);
        }
      }
    } catch(e) { fail(`Geocode ${state}`, e.message); }
  }

  // Wording spot-check on live pages
  const wordingPages = [
    ['/', 'Homepage'],
    ['/full-report/', 'full-report'],
  ];
  const BAD_PHRASES = ['any NSW property', 'NSW addresses only', 'Development intelligence for NSW'];
  for (const [url, label] of wordingPages) {
    try {
      const html = await (await fetch(`${BASE_URL}${url}?_=${Date.now()}`, cache)).text();
      const hits = BAD_PHRASES.filter(p => html.includes(p));
      if (hits.length === 0) ok(`${label}: no NSW-only wording`);
      else {
        fail(`${label}: NSW-only wording found`, hits.join(', '));
        finding(`"${hits[0]}" found in live ${label} — misleads non-NSW users.`);
      }
    } catch(e) { fail(`${label} fetch`, e.message); }
  }
}

// ── Report generation ─────────────────────────────────────────────

function writeReport() {
  const allPassed = failed === 0;
  const ts = new Date().toISOString();

  const lines = [
    `\n---\n`,
    `## Daily Check — ${today}`,
    ``,
    `**Result:** ${allPassed ? '✓ ALL PASS' : `✗ ${failed} FAILING`}  `,
    `**Time:** ${ts}  `,
    `**Target:** ${BASE_URL}`,
    ``,
    `### What changed`,
    `_(run \`git log --oneline -5\` for recent commits)_`,
    ``,
    `### What broke`,
  ];

  const failures = results.filter(r => !r.pass);
  if (failures.length === 0) {
    lines.push('Nothing broke.');
  } else {
    for (const f of failures) lines.push(`- ✗ **${f.label}** — ${f.detail}`);
  }

  lines.push('', '### What was fixed');
  lines.push('_(add notes manually when applying patches)_');

  lines.push('', '### Property / user problems detected');
  if (findings.length === 0) lines.push('None detected in this run.');
  else for (const f of findings) lines.push(`- ${f}`);

  lines.push('', '### Opportunities');
  lines.push('_(add when user enquiry patterns or data signals are reviewed)_');

  lines.push('', '### What to improve next');
  const passing = results.filter(r => r.pass);
  if (failures.length > 0) {
    for (const f of failures) lines.push(`1. Fix: ${f.label}`);
  } else {
    lines.push('All checks passing. Review user enquiries and data freshness next.');
  }

  lines.push('', '### Founder decisions needed');
  if (decisions.length === 0) {
    lines.push('None — AI can proceed without founder input.');
  } else {
    for (const d of decisions) lines.push(`- [ ] ${d}`);
  }

  lines.push('');

  // Prepend to log (most recent first)
  const existing = fs.existsSync(LOG_FILE) ? fs.readFileSync(LOG_FILE, 'utf8') : '# SiteVerdict Daily Log\n';
  const header = existing.startsWith('# SiteVerdict') ? existing.slice(0, existing.indexOf('\n') + 1) : '';
  const rest   = existing.slice(header.length);
  fs.writeFileSync(LOG_FILE, header + lines.join('\n') + rest);

  console.log(`\n${'='.repeat(52)}`);
  console.log(`  PASSED: ${passed}   FAILED: ${failed}`);
  console.log(allPassed ? '\n✓ Daily check PASSED\n' : `\n✗ Daily check FAILED — ${failed} issue(s)\n`);
  if (findings.length) { console.log('Findings:'); findings.forEach(f => console.log('  • ' + f)); }
  if (decisions.length) { console.log('\nFounder decisions needed:'); decisions.forEach(d => console.log('  □ ' + d)); }
  console.log(`\nLog written → DAILY_LOG.md`);
}

// ── Main ──────────────────────────────────────────────────────────

async function main() {
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║  SiteVerdict Daily AI Check                  ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log(`  Date:   ${today}`);
  console.log(`  Target: ${BASE_URL}\n`);

  checkLocalFiles();
  await checkLive();
  writeReport();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => { console.error('Daily check error:', e.message); process.exit(1); });
