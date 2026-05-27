#!/usr/bin/env node
/**
 * SiteVerdict CI Report
 *
 * Reads test results and version.json, outputs a structured JSON
 * report for GitHub Actions annotations and summaries.
 *
 * Usage:
 *   node scripts/ci-report.js [--playwright-results test-results/results.json]
 *
 * Outputs to stdout (JSON) and sets GitHub Actions outputs if in CI.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function setOutput(name, value) {
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT,
      `${name}=${String(value).replace(/\n/g, '%0A')}\n`);
  }
}

function setFailed(msg) {
  if (process.env.GITHUB_ACTIONS) {
    console.error(`::error::${msg}`);
  } else {
    console.error(`FAILED: ${msg}`);
  }
}

// ── Read version.json ─────────────────────────────────────────────
const vj = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'public', 'version.json'), 'utf8')
);

// ── Read Playwright results if available ──────────────────────────
const resultsArg = process.argv.indexOf('--playwright-results');
const resultsPath = resultsArg !== -1
  ? process.argv[resultsArg + 1]
  : path.join(ROOT, 'test-results', 'results.json');

let playwrightResults = null;
let pwPassed = 0, pwFailed = 0, pwTotal = 0;

if (fs.existsSync(resultsPath)) {
  try {
    const raw = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    // Playwright JSON reporter format
    const suites = raw.suites || [];
    function countTests(suite) {
      for (const spec of (suite.specs || [])) {
        for (const test of (spec.tests || [])) {
          pwTotal++;
          const ok = test.results && test.results.some(r => r.status === 'passed');
          if (ok) pwPassed++; else pwFailed++;
        }
      }
      for (const child of (suite.suites || [])) countTests(child);
    }
    suites.forEach(countTests);
    playwrightResults = { passed: pwPassed, failed: pwFailed, total: pwTotal };
  } catch(e) {
    console.error('Could not parse Playwright results:', e.message);
  }
}

// ── Build report ──────────────────────────────────────────────────
const report = {
  package_number: vj.package_number,
  build_name:     vj.build_name,
  build_time:     vj.build_time,
  sitecheck_js_size: vj.sitecheck_js_size,
  sitecheck_js_hash: vj.sitecheck_js_hash,
  playwright: playwrightResults,
  timestamp:  new Date().toISOString(),
};

// ── Output ────────────────────────────────────────────────────────
console.log(JSON.stringify(report, null, 2));

// Set GitHub Actions outputs
setOutput('package_number', report.package_number);
setOutput('build_name', report.build_name);
setOutput('pw_passed', pwPassed);
setOutput('pw_failed', pwFailed);
setOutput('pw_total',  pwTotal);
setOutput('ready', pwFailed === 0 && pwTotal > 0 ? 'true' : 'false');

if (pwFailed > 0) {
  setFailed(`${pwFailed}/${pwTotal} Playwright tests failed`);
  process.exit(1);
}

if (pwTotal === 0 && playwrightResults !== null) {
  setFailed('No Playwright tests found in results');
  process.exit(1);
}

process.exit(0);
