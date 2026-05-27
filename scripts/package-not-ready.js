#!/usr/bin/env node
/**
 * SiteVerdict package:not-ready
 *
 * Creates a DIAGNOSTIC bundle when tests fail.
 * This bundle is for debugging only — it must NEVER be deployed.
 *
 * Output: siteverdict-NOT-READY-diagnostics-N.zip
 * Contains ONLY: NOT_READY_REPORT.md, TEST_FAILURES.md, FOUNDER_ACTIONS.md, logs
 * Does NOT contain: deployable public/ files, production code
 *
 * Run: node scripts/package-not-ready.js
 * Or:  npm run package:not-ready
 */

'use strict';

const { spawnSync } = require('child_process');
const fs            = require('fs');
const path          = require('path');
const { execSync }  = require('child_process');

const ROOT = path.resolve(__dirname, '..');

function banner(msg) {
  console.log('\n' + '='.repeat(56) + '\n' + msg + '\n' + '='.repeat(56));
}

const vj = JSON.parse(fs.readFileSync(path.join(ROOT, 'public', 'version.json'), 'utf8'));
const pkg = String(vj.package_number);

banner('SiteVerdict package:not-ready — DIAGNOSTIC ONLY');
console.log('This creates a diagnostic bundle for debugging. NOT for deploy.\n');

// ── Collect diagnostic info ────────────────────────────────────────

const ts = new Date().toISOString();
const diagnostics = {
  timestamp: ts,
  package: pkg,
  build_name: vj.build_name,
};

// Run predeploy to get static check results
console.log('Running predeploy static checks...');
const pdResult = spawnSync('node', [path.join(ROOT, 'scripts', 'predeploy.js')], {
  encoding: 'utf8', cwd: ROOT, timeout: 60000,
});
diagnostics.static_result = {
  exit_code: pdResult.status,
  stdout: pdResult.stdout || '',
  stderr: pdResult.stderr || '',
};

// Check browser availability
console.log('Checking browser...');
const PW_CLI = path.join(ROOT, 'node_modules', '@playwright', 'test', 'cli.js');
const PW_BROWSERS = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';

let browserAvailable = false;
if (fs.existsSync(PW_CLI)) {
  const br = spawnSync('node', ['-e', `
const {chromium} = require(${JSON.stringify(path.join(ROOT, 'node_modules', '@playwright', 'test'))});
(async()=>{
  try { const b=await chromium.launch({headless:true}); await b.close(); console.log('OK'); process.exit(0); }
  catch(e) { console.log('FAIL:'+e.message.slice(0,80)); process.exit(1); }
})();
`], { encoding: 'utf8', timeout: 15000, env: {...process.env, PLAYWRIGHT_BROWSERS_PATH: PW_BROWSERS}, cwd: ROOT });
  browserAvailable = (br.stdout||'').trim().startsWith('OK');
  diagnostics.browser = { available: browserAvailable, output: (br.stdout||'').trim() };
}

// ── Write NOT_READY_REPORT.md ──────────────────────────────────────

const staticPassed = diagnostics.static_result.exit_code === 0;
const blocker = !staticPassed
  ? 'Static checks (predeploy) failed'
  : !browserAvailable
    ? 'Browser (Chromium) not available for Playwright tests'
    : 'Browser tests failed or were not run';

const notReadyReport = [
  '# NOT READY REPORT',
  '',
  `**Package:** ${pkg}`,
  `**Build:** ${vj.build_name}`,
  `**Timestamp:** ${ts}`,
  '',
  '## Exact blocker',
  '',
  blocker,
  '',
  '## Static checks',
  '',
  `Exit code: ${diagnostics.static_result.exit_code} (${staticPassed ? 'PASS' : 'FAIL'})`,
  '',
  '```',
  diagnostics.static_result.stdout.slice(-3000),
  '```',
  '',
  '## Browser availability',
  '',
  `Chromium available: ${browserAvailable ? 'YES' : 'NO'}`,
  browserAvailable ? '' : 'Install with: npm run install:browsers',
  '',
  '## Browser tests',
  '',
  'Status: NOT RUN (blocked by issues above)',
  '',
  '## What to do next',
  '',
  staticPassed
    ? '1. Fix browser availability: npm run install:browsers\n2. Rerun: npm run package:ready'
    : '1. Fix static check failures (see output above)\n2. Rerun: npm run package:ready',
  '',
  '---',
  '**No zip was created. This is a diagnostic report only. Do not deploy.**',
].join('\n');

fs.writeFileSync(path.join(ROOT, 'NOT_READY_REPORT.md'), notReadyReport);

// ── Write TEST_FAILURES.md ─────────────────────────────────────────

const failures = [
  '# TEST FAILURES',
  '',
  `**Package:** ${pkg}  **Timestamp:** ${ts}`,
  '',
  '## Failed components',
  '',
  `| Component | Status |`,
  `|---|---|`,
  `| Static checks (predeploy) | ${staticPassed ? '✓ PASS' : '✗ FAIL'} |`,
  `| Browser available | ${browserAvailable ? '✓ YES' : '✗ NO'} |`,
  `| Browser tests | ✗ NOT RUN |`,
  '',
  '## Static check output',
  '',
  '```',
  (diagnostics.static_result.stdout || '').slice(-2000),
  '```',
  '',
  '---',
  '*This file is auto-generated. Fix failures, then run: npm run package:ready*',
].join('\n');

fs.writeFileSync(path.join(ROOT, 'TEST_FAILURES.md'), failures);

// ── Create diagnostic zip ──────────────────────────────────────────

const diagZip = path.join(ROOT, `siteverdict-NOT-READY-diagnostics-${pkg}.zip`);
if (fs.existsSync(diagZip)) fs.unlinkSync(diagZip);

try {
  const files = ['NOT_READY_REPORT.md', 'TEST_FAILURES.md', 'public/version.json', 'package.json'];
  if (fs.existsSync(path.join(ROOT, 'FOUNDER_ACTIONS.md'))) files.push('FOUNDER_ACTIONS.md');
  execSync(`zip -j ${diagZip} ${files.join(' ')} 2>/dev/null`, { cwd: ROOT, timeout: 10000 });
} catch(e) {
  console.error('Warning: diagnostic zip creation failed:', e.message.slice(0,80));
}

banner('NOT READY — diagnostic files written');
console.log(`
  Package:             ${pkg}
  Blocker:             ${blocker}
  NOT_READY_REPORT.md: written
  TEST_FAILURES.md:    written
  Diagnostic zip:      siteverdict-NOT-READY-diagnostics-${pkg}.zip

  NO GitHub-ready zip was created.
  Fix the issues above, then run: npm run package:ready
`);

process.exit(1);
