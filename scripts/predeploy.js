#!/usr/bin/env node
/**
 * SiteVerdict pre-deploy static checks.
 *
 * Runs WITHOUT browser. Checks syntax, wording, version, guards, structure.
 *
 * Modes:
 *   node scripts/predeploy.js              → all static sections
 *   node scripts/predeploy.js --syntax-only
 *   node scripts/predeploy.js --wording-only
 *   node scripts/predeploy.js --version-only
 *
 * IMPORTANT: This script does NOT run browser tests.
 * Browser tests run via: npm run test:e2e
 * Full release proof:     npm run release-check
 */
'use strict';

const { spawnSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

const ROOT   = path.resolve(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');

const args       = process.argv.slice(2);
const ONLY_SYN   = args.includes('--syntax-only');
const ONLY_WORD  = args.includes('--wording-only');
const ONLY_VER   = args.includes('--version-only');
const ALL        = !ONLY_SYN && !ONLY_WORD && !ONLY_VER;

// ── Expected package number — update this each release ────────────
const EXPECTED_PKG = '87';

let passed = 0, failed = 0;
const failures = [];

function ok(label)           { passed++; console.log(`  \u2713  ${label}`); }
function fail(label, detail) {
  failed++;
  failures.push({ label, detail: detail || '' });
  console.error(`  \u2717  ${label}${detail ? '  [' + detail + ']' : ''}`);
}
function section(t) { console.log(`\n=== ${t} ===`); }

// ── 1. JS Syntax ──────────────────────────────────────────────────
if (ALL || ONLY_SYN) {
  section('JS SYNTAX');
  const JS_FILES = [
    'public/assets/sv-check.js',
    'public/netlify/functions/geocode.js',
    'public/netlify/functions/sitecheck-test.js',
    'public/netlify/functions/national-site-check.js',
    'public/netlify/functions/cadastre.js',
    'public/netlify/functions/ai-interpret.js',
    'public/netlify/functions/daleads.js',
    'public/netlify/functions/lib/providers/nsw.js',
    'public/netlify/functions/lib/providers/act.js',
    'public/netlify/functions/lib/providers/tas.js',
    'public/netlify/functions/lib/providers/vic.js',
    'public/netlify/functions/lib/providers/qld.js',
    'public/netlify/functions/lib/providers/sa.js',
    'public/netlify/functions/lib/providers/index.js',
    'public/netlify/functions/lib/providers/fallback.js',
    'public/netlify/functions/lib/data-source-registry.js',
    'tests/sitecheck.e2e.spec.js',
    'playwright.config.js',
    'scripts/predeploy.js',
    'scripts/release-check.js',
    'scripts/local-server.js',
    'scripts/run-tests.js',
    'scripts/ci-report.js',
    'scripts/package-ready.js',
    'scripts/package-not-ready.js',
  ];
  for (const relPath of JS_FILES) {
    const abs = path.join(ROOT, relPath);
    if (!fs.existsSync(abs)) { fail(relPath, 'FILE NOT FOUND'); continue; }
    const r = spawnSync('node', ['--check', abs], { encoding: 'utf8' });
    if (r.status === 0) ok(relPath);
    else fail(relPath, (r.stderr || '').trim().split('\n')[0]);
  }
}

// ── 2. NSW-only wording scan ──────────────────────────────────────
if (ALL || ONLY_WORD) {
  section('NSW-ONLY WORDING SCAN (user-facing public HTML)');
  const FORBIDDEN = [
    'any NSW property', 'For any NSW address',
    'NSW addresses only', 'Development intelligence for NSW',
  ];
  const SKIP = new Set(['deploy-check.html']);

  function walkHtml(dir) {
    for (const fname of fs.readdirSync(dir)) {
      const full = path.join(dir, fname);
      if (fs.statSync(full).isDirectory()) walkHtml(full);
      else if (fname.endsWith('.html') && !SKIP.has(fname)) {
        const rel = path.relative(PUBLIC, full);
        if (rel.startsWith('netlify' + path.sep)) return;
        const c    = fs.readFileSync(full, 'utf8');
        const hits = FORBIDDEN.filter(p => c.includes(p));
        if (hits.length) fail(rel, hits.join(', '));
        else ok(rel);
      }
    }
  }
  walkHtml(PUBLIC);
}

// ── 3. version.json ───────────────────────────────────────────────
if (ALL || ONLY_VER) {
  section('VERSION.JSON');
  const vjPath = path.join(PUBLIC, 'version.json');
  try {
    const vj  = JSON.parse(fs.readFileSync(vjPath, 'utf8'));
    const pkg = String(vj.package_number || '');
    if (pkg === EXPECTED_PKG)
      ok(`package_number = ${pkg}`);
    else
      fail(`package_number must be ${EXPECTED_PKG}`, `got "${pkg}" — update version.json`);

    const svs = vj.sitecheck_js_size || 0;
    if (svs >= 200000) ok(`sitecheck_js_size = ${svs}b (\u2265 200000)`);
    else fail('sitecheck_js_size too small', `${svs}b`);

    if (vj.build_name && String(vj.build_name).includes(EXPECTED_PKG))
      ok(`build_name = ${vj.build_name}`);
    else
      fail('build_name mismatch', `got "${vj.build_name}", expected to contain ${EXPECTED_PKG}`);

    // index.html build marker
    const idxContent = fs.readFileSync(path.join(PUBLIC, 'index.html'), 'utf8');
    if (idxContent.includes(`SiteVerdict package ${EXPECTED_PKG}`))
      ok('index.html build marker correct');
    else
      fail('index.html build marker wrong/missing', `expected "SiteVerdict package ${EXPECTED_PKG}"`);

    // sitecheck-test.js package number
    const stContent = fs.readFileSync(
      path.join(PUBLIC, 'netlify', 'functions', 'sitecheck-test.js'), 'utf8'
    );
    if (stContent.includes(`PACKAGE_NUMBER = '${EXPECTED_PKG}'`))
      ok(`sitecheck-test.js expects package ${EXPECTED_PKG}`);
    else
      fail('sitecheck-test.js has wrong package number', `expected PACKAGE_NUMBER = '${EXPECTED_PKG}'`);

  } catch(e) { fail('version.json', e.message); }
}

// ── 4. sv-check.js safety guards ─────────────────────────────────
if (ALL) {
  section('SV-CHECK.JS SAFETY GUARDS');
  const svContent = fs.readFileSync(path.join(PUBLIC, 'assets', 'sv-check.js'), 'utf8');
  const GUARDS = [
    ['20s runCheck timeout guard (_timeoutId)',    '_timeoutId'],
    ['SITE_CHECK_TIMEOUT error card',              'SITE_CHECK_TIMEOUT'],
    ['clearTimeout in finally',                    'clearTimeout(_timeoutId)'],
    ['ftx() 9s AbortController wrapper',           'function ftx('],
    ['NSW fetches use ftx()',                       'ftx(y+'],
    ['_detState state gate before NSW API',         '_detState'],
    ['_showNonNSWResult function defined',          'function _showNonNSWResult('],
    ["non-NSW skips NSW API (_detState!=='NSW')",   "_detState!=='NSW'"],
    ['NSW mapprod3 URL preserved',                  'mapprod3.environment.nsw.gov.au'],
    ['fake address gate intact',                    '_geo.found===false'],
    ['ACT state message in non-NSW fn',             'ACT Territory Plan data'],
    ['TAS state message in non-NSW fn',             'Tasmania LIST data'],
    ['VIC state message in non-NSW fn',             'Vicmap Planning'],
    ['QLD state message in non-NSW fn',             'QSCF'],
    ['_isNSWAddr local in _renderResultInner',      'var _isNSWAddr='],
    ['_addrForState local in _renderResultInner',   'var _addrForState='],
  ];
  for (const [label, needle] of GUARDS) {
    if (svContent.includes(needle)) ok(label);
    else fail(label, `"${needle}" not found in sv-check.js`);
  }
}

// ── 5. sitecheck-test.js structure ────────────────────────────────
if (ALL) {
  section('SITECHECK-TEST.JS STRUCTURE');
  const stContent = fs.readFileSync(
    path.join(PUBLIC, 'netlify', 'functions', 'sitecheck-test.js'), 'utf8'
  );
  const ST_CHECKS = [
    ['allPassed in response',       'allPassed'],
    ['failedTests in response',     'failedTests'],
    ['buildMarker in response',     'buildMarker'],
    ['packageNumber in response',   'packageNumber'],
    [`PACKAGE_NUMBER = '${EXPECTED_PKG}'`, `PACKAGE_NUMBER = '${EXPECTED_PKG}'`],
    ['T3 fake address test',        '999 Fake Street'],
    ['TAS addresses tested',        'Hobart TAS'],
    ['homepage wording check',      'Homepage wording'],
    ['frontend render safety note', 'deploy-check'],
  ];
  for (const [label, needle] of ST_CHECKS) {
    if (stContent.includes(needle)) ok(label);
    else fail(label, `"${needle}" not in sitecheck-test.js`);
  }
}

// ── 6. deploy-check infrastructure ───────────────────────────────
if (ALL) {
  section('DEPLOY-CHECK INFRASTRUCTURE');
  const rtPath = path.join(PUBLIC, 'sitecheck-render-test.html');
  if (fs.existsSync(rtPath)) {
    const rt = fs.readFileSync(rtPath, 'utf8');
    if (rt.includes('render-test-ready') && rt.includes('sv-check.js'))
      ok('sitecheck-render-test.html exists + loads sv-check.js');
    else fail('sitecheck-render-test.html incomplete');
  } else fail('sitecheck-render-test.html missing');

  const ntContent = fs.readFileSync(path.join(ROOT, 'netlify.toml'), 'utf8');
  if (ntContent.includes('SAMEORIGIN') && ntContent.includes('sitecheck-render-test'))
    ok('netlify.toml: SAMEORIGIN exception for /sitecheck-render-test.html');
  else fail('netlify.toml: missing SAMEORIGIN exception');

  // CLAUDE.md
  if (fs.existsSync(path.join(ROOT, 'CLAUDE.md'))) {
    const c = fs.readFileSync(path.join(ROOT, 'CLAUDE.md'), 'utf8');
    if (c.includes('Hard rules') && c.toLowerCase().includes('package identity rule'))
      ok('CLAUDE.md present and complete');
    else fail('CLAUDE.md incomplete');
  } else fail('CLAUDE.md missing');

    if (fs.existsSync(path.join(ROOT, 'PRINCIPLES.md'))) {
    const p = fs.readFileSync(path.join(ROOT, 'PRINCIPLES.md'), 'utf8');
    if (p.includes('Adaptive usefulness') && p.includes('Daily AI operating rule'))
      ok('PRINCIPLES.md present and complete');
    else fail('PRINCIPLES.md incomplete');
  } else fail('PRINCIPLES.md missing');
}

// ── 7. protected routes ───────────────────────────────────────────
if (ALL) {
  section('PROTECTED ROUTES (_redirects)');
  const redirPath = path.join(PUBLIC, '_redirects');
  if (fs.existsSync(redirPath)) {
    const redir = fs.readFileSync(redirPath, 'utf8');
    for (const route of ['/tools','/tools/*','/data','/data/*','/docs','/docs/*']) {
      if (redir.includes(route)) ok(`${route} → force-404`);
      else fail(`${route} not protected in _redirects`);
    }
  } else fail('_redirects missing');
}

// ── 8. no raw datasets ────────────────────────────────────────────
if (ALL) {
  section('NO RAW DATASETS IN public/');
  const RAW_EXT = ['.gdb', '.shp', '.gpkg', '.pbf'];
  let rawFound = [];
  function walkRaw(dir) {
    for (const f of fs.readdirSync(dir)) {
      const full = path.join(dir, f);
      if (fs.statSync(full).isDirectory()) walkRaw(full);
      else if (RAW_EXT.some(e => f.endsWith(e))) rawFound.push(path.relative(PUBLIC, full));
    }
  }
  walkRaw(PUBLIC);
  if (rawFound.length === 0) ok('No raw spatial datasets in public/');
  else fail('Raw datasets found', rawFound.join(', '));
}

// ── Result ────────────────────────────────────────────────────────
console.log('\n' + '='.repeat(52));
console.log(`  PASSED: ${passed}   FAILED: ${failed}`);

if (failures.length) {
  console.error('\nFAILURES:');
  for (const { label, detail } of failures)
    console.error(`  \u2717 ${label}${detail ? ' — ' + detail : ''}`);
  console.error('\n\u2717 predeploy FAILED (static checks) — fix before running release-check\n');
  process.exit(1);
} else {
  console.log(`
\u2713 predeploy static checks PASSED.

\u26a0  IMPORTANT: Static checks alone are NOT sufficient for release.
   Browser tests must also pass.

   Run full release verification:
     npm run release-check

   Run browser tests only:
     npm run test:e2e
`);
  process.exit(0);
}
