#!/usr/bin/env node
/**
 * SiteVerdict — run ALL tests in order.
 * 1. predeploy (syntax + wording + guards)
 * 2. Playwright e2e against local mock server
 *
 * Exit 0 only if both pass.
 */

'use strict';

const { spawnSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function run(label, script, args = []) {
  console.log(`\n${'='.repeat(52)}`);
  console.log(`RUNNING: ${label}`);
  console.log('='.repeat(52) + '\n');
  const r = spawnSync('node', [script, ...args], {
    stdio: 'inherit', cwd: ROOT, timeout: 360000,
    env: { ...process.env, PLAYWRIGHT_BROWSERS_PATH: '/opt/pw-browsers' },
  });
  return r.status || 0;
}

const predeployExit  = run('predeploy (syntax + wording + guards)',
  path.join(ROOT, 'scripts', 'predeploy.js'));

const playwrightExit = run('Playwright e2e (local mock server)',
  path.join(ROOT, 'scripts', 'run-tests.js'));

console.log('\n' + '='.repeat(52));
console.log('SUMMARY');
console.log('='.repeat(52));
console.log(`  predeploy:  ${predeployExit === 0 ? '✓ PASSED' : '✗ FAILED (exit ' + predeployExit + ')'}`);
console.log(`  playwright: ${playwrightExit === 0 ? '✓ PASSED' : '✗ FAILED (exit ' + playwrightExit + ')'}`);

const allPassed = predeployExit === 0 && playwrightExit === 0;
console.log(`\n${allPassed ? '✓ ALL TESTS PASSED — safe to deploy' : '✗ TESTS FAILED — do not deploy'}\n`);
process.exit(allPassed ? 0 : 1);
