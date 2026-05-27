#!/usr/bin/env node
/**
 * SiteVerdict release-check
 *
 * THE GATE before producing a release zip.
 *
 * Runs in order:
 *   1. npm install (ensure deps)
 *   2. Playwright browser availability check
 *   3. Static predeploy checks (syntax, wording, version, guards)
 *   4. Browser e2e tests via Playwright
 *
 * Exit 0  = ALL PASS → package is ready
 * Exit 1  = FAIL or browser unavailable → package is NOT READY
 *
 * The package is only "release-ready" if this script exits 0.
 * If browser tests cannot run, this script exits 1 and marks NOT READY.
 * It will NEVER print "ready" if browser tests did not run.
 */
'use strict';

const { spawnSync, execSync } = require('child_process');
const path  = require('path');
const fs    = require('fs');
const os    = require('os');

const ROOT = path.resolve(__dirname, '..');
const PW_CLI  = path.join(ROOT, 'node_modules', '@playwright', 'test', 'cli.js');
const SPEC    = path.join(ROOT, 'tests', 'sitecheck.e2e.spec.js');
const PW_BROWSERS = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';

// ── Helpers ───────────────────────────────────────────────────────
function banner(msg) { console.log('\n' + '='.repeat(52) + '\n' + msg + '\n' + '='.repeat(52)); }
function step(n, msg){ console.log(`\n[${n}] ${msg}`); }
function pass(msg)   { console.log(`  \u2713 ${msg}`); }
function fail(msg)   { console.error(`  \u2717 ${msg}`); }
function run(cmd, args, opts) {
  return spawnSync(cmd, args, { stdio: 'inherit', cwd: ROOT, timeout: 360000, ...opts });
}

let browserAvailable  = false;
let staticPassed      = false;
let browserPassed     = false;
let browserSkipReason = '';

// ── Step 1: npm install ───────────────────────────────────────────
banner('SiteVerdict release-check');
step(1, 'npm install');
const installResult = run('npm', ['install'], { stdio: 'pipe' });
if (installResult.status !== 0) {
  fail('npm install failed');
  console.error('  Stdout:', (installResult.stdout||'').toString().slice(0,200));
  process.exit(1);
}
pass('npm install OK');

// ── Step 2: Playwright browser availability ───────────────────────
step(2, 'Playwright browser availability check');

function testBrowserLaunch() {
  if (!fs.existsSync(PW_CLI)) {
    return { ok: false, reason: '@playwright/test not installed. Run: npm install' };
  }
  // Try to launch Chromium
  const r = spawnSync('node', ['-e', `
const {chromium} = require(${JSON.stringify(path.join(ROOT, 'node_modules', '@playwright', 'test'))});
(async()=>{
  try {
    const b = await chromium.launch({headless:true});
    const v = b.version();
    await b.close();
    process.stdout.write('OK:'+v);
    process.exit(0);
  } catch(e) {
    process.stdout.write('FAIL:'+e.message.slice(0,200));
    process.exit(1);
  }
})();
`], {
    timeout: 20000,
    encoding: 'utf8',
    env: { ...process.env, PLAYWRIGHT_BROWSERS_PATH: PW_BROWSERS },
    cwd: ROOT,
  });

  const out = (r.stdout || '').trim();
  if (out.startsWith('OK:')) return { ok: true, version: out.slice(3) };
  return {
    ok: false,
    reason: out.startsWith('FAIL:') ? out.slice(5) : (r.stderr || 'Unknown launch error').slice(0, 200),
  };
}

const launchTest = testBrowserLaunch();
if (launchTest.ok) {
  browserAvailable = true;
  pass(`Chromium available: v${launchTest.version}`);
} else {
  browserAvailable = false;
  browserSkipReason = launchTest.reason;
  fail(`Chromium NOT available: ${launchTest.reason}`);
  console.log('\n  Attempting to install Chromium...');
  const installChrome = spawnSync(
    'node', [PW_CLI, 'install', 'chromium'],
    {
      stdio: 'inherit', cwd: ROOT, timeout: 120000,
      env: { ...process.env, PLAYWRIGHT_BROWSERS_PATH: PW_BROWSERS },
    }
  );
  if (installChrome.status === 0) {
    const retest = testBrowserLaunch();
    if (retest.ok) {
      browserAvailable = true;
      browserSkipReason = '';
      pass(`Chromium installed and available: v${retest.version}`);
    } else {
      browserSkipReason = 'Install appeared to succeed but launch still failed: ' + retest.reason;
      fail(browserSkipReason);
    }
  } else {
    browserSkipReason = 'npm run install:browsers (playwright install chromium) failed — network may be blocked';
    fail(browserSkipReason);
  }
}

// ── Step 3: Static predeploy checks ──────────────────────────────
step(3, 'Static checks (predeploy.js)');
const staticResult = run('node', [path.join(ROOT, 'scripts', 'predeploy.js')]);
staticPassed = staticResult.status === 0;
if (staticPassed) pass('Static checks PASSED');
else fail('Static checks FAILED');

// ── Step 4: Browser e2e tests ────────────────────────────────────
step(4, 'Browser e2e tests (Playwright)');

if (!browserAvailable) {
  fail('SKIPPED — browser not available: ' + browserSkipReason);
  fail('Browser tests DID NOT RUN');
  browserPassed = false;
} else {
  // Start local server (needed for tests that require /.netlify/functions/geocode)
  const SERVER_PORT = 8889;
  const SERVER_SCRIPT = path.join(ROOT, 'scripts', 'local-server.js');
  let serverProc = null;
  let serverReady = false;

  if (fs.existsSync(SERVER_SCRIPT) && !process.env.BASE_URL) {
    console.log('  Starting local mock server on port ' + SERVER_PORT + '...');
    const { spawn } = require('child_process');
    serverProc = spawn('node', [SERVER_SCRIPT, String(SERVER_PORT)], {
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
      cwd: ROOT,
    });
    serverProc.stdout.on('data', d => {
      if (d.toString().includes('running at')) serverReady = true;
    });
    // Wait up to 8s for server ready signal (poll every 500ms)
    for (let i = 0; i < 16; i++) {
      spawnSync('node', ['-e', 'setTimeout(()=>{},500)'], { timeout: 600 });
      if (serverReady) break;
    }
    if (serverReady) {
      pass('Local mock server ready on port ' + SERVER_PORT);
    } else {
      // Server may have started but stdout event fired after our last poll
      // Attempt tests anyway — they will fail with ERR_CONNECTION_REFUSED if truly not running
      pass('Local mock server started on port ' + SERVER_PORT + ' (ready check pending)');
      serverReady = true;
    }
  } else {
    serverReady = true; // using BASE_URL override or server already running
    pass('Using BASE_URL: ' + (process.env.BASE_URL || 'http://localhost:' + SERVER_PORT));
  }

  if (serverReady) {
    const e2eResult = spawnSync(
      'node',
      [PW_CLI, 'test', SPEC, '--reporter=list'],
      {
        stdio: 'inherit',
        cwd: ROOT,
        timeout: 300000,
        env: {
          ...process.env,
          BASE_URL: process.env.BASE_URL || ('http://localhost:' + SERVER_PORT),
          PLAYWRIGHT_BROWSERS_PATH: PW_BROWSERS,
        },
      }
    );
    browserPassed = e2eResult.status === 0;
    if (browserPassed) pass('Browser e2e tests PASSED');
    else fail('Browser e2e tests FAILED');
  }

  // Always kill server
  if (serverProc) {
    serverProc.kill('SIGTERM');
    serverProc = null;
  }
}

// ── Final verdict ─────────────────────────────────────────────────
console.log('\n' + '='.repeat(52));
console.log('  RELEASE-CHECK SUMMARY');
console.log('='.repeat(52));
console.log(`  Static checks:  ${staticPassed  ? '\u2713 PASSED' : '\u2717 FAILED'}`);
console.log(`  Browser avail:  ${browserAvailable ? '\u2713 YES' : '\u2717 NO'}`);
console.log(`  Browser tests:  ${browserPassed ? '\u2713 PASSED' : (browserAvailable ? '\u2717 FAILED' : '\u2717 DID NOT RUN')}`);

const allPassed = staticPassed && browserAvailable && browserPassed;

if (allPassed) {
  console.log(`
\u2713 RELEASE-CHECK PASSED
  Package is ready for Netlify deployment.
  All static checks: PASS
  All browser tests: PASS
`);
  process.exit(0);
} else {
  const reasons = [];
  if (!staticPassed)    reasons.push('static checks failed');
  if (!browserAvailable) reasons.push('Chromium browser not available: ' + browserSkipReason);
  if (browserAvailable && !browserPassed) reasons.push('browser e2e tests failed');

  console.error(`
\u2717 PACKAGE NOT READY
  Reason(s): ${reasons.join('; ')}

  Do NOT deploy this package until release-check passes.
  Do NOT return a "ready" zip.
`);
  process.exit(1);
}
