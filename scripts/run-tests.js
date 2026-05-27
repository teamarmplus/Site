#!/usr/bin/env node
/**
 * SiteVerdict test runner
 *
 * 1. Starts local mock server on port 8889
 * 2. Runs Playwright against localhost:8889
 * 3. Kills server
 * 4. Exits with test result code
 *
 * Override target:  BASE_URL=https://siteverdict2.netlify.app node scripts/run-tests.js
 */

'use strict';

const { spawn, spawnSync } = require('child_process');
const path = require('path');

const ROOT    = path.resolve(__dirname, '..');
const PW_CLI  = path.join(ROOT, 'node_modules', '@playwright', 'test', 'cli.js');
const SERVER  = path.join(ROOT, 'scripts', 'local-server.js');
const SPEC    = path.join(ROOT, 'tests', 'sitecheck.e2e.spec.js');
const PORT    = 8889;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

const USE_LOCAL = BASE_URL.includes('localhost');

let serverProc = null;

function cleanup() {
  if (serverProc) {
    serverProc.kill('SIGTERM');
    serverProc = null;
  }
}
process.on('exit', cleanup);
process.on('SIGINT', () => { cleanup(); process.exit(130); });

async function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function startServer() {
  return new Promise((resolve, reject) => {
    serverProc = spawn('node', [SERVER, String(PORT)], {
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
    });
    let ready = false;
    serverProc.stdout.on('data', d => {
      const msg = d.toString();
      if (msg.includes('running at') && !ready) {
        ready = true;
        resolve();
      }
    });
    serverProc.stderr.on('data', d => {
      const msg = d.toString();
      if (!ready) { reject(new Error('Server error: ' + msg.trim())); }
    });
    serverProc.on('error', e => { if (!ready) reject(e); });
    setTimeout(() => { if (!ready) reject(new Error('Server startup timeout')); }, 8000);
  });
}

async function main() {
  console.log('\n=== SiteVerdict Playwright Test Runner ===\n');

  if (USE_LOCAL) {
    console.log(`Starting local mock server on port ${PORT}...`);
    try {
      await startServer();
      console.log(`✓ Server ready at http://localhost:${PORT}\n`);
    } catch(e) {
      console.error('✗ Server failed to start:', e.message);
      process.exit(1);
    }
    await wait(500);
  } else {
    console.log(`Using live site: ${BASE_URL}\n`);
  }

  console.log('Running Playwright tests...\n');

  const result = spawnSync(
    'node',
    [PW_CLI, 'test', SPEC, '--reporter=list'],
    {
      stdio: 'inherit',
      encoding: 'utf8',
      env: { ...process.env, BASE_URL, PLAYWRIGHT_BROWSERS_PATH: '/opt/pw-browsers' },
      timeout: 300000,
      cwd: ROOT,
    }
  );

  cleanup();

  const exitCode = result.status || 0;
  console.log(`\nTests exit code: ${exitCode}`);

  if (exitCode !== 0) {
    console.error('\n✗ Playwright tests FAILED — do not deploy.\n');
  } else {
    console.log('\n✓ Playwright tests PASSED.\n');
  }

  process.exit(exitCode);
}

main().catch(e => {
  console.error('Runner error:', e.message);
  cleanup();
  process.exit(1);
});
