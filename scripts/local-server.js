#!/usr/bin/env node
/**
 * SiteVerdict local test server
 *
 * Serves public/ as static files and provides mock Netlify functions.
 * Used for Playwright tests when the live site has a stale deployment.
 *
 * Usage:
 *   node scripts/local-server.js [port]
 *
 * Mock endpoints:
 *   /.netlify/functions/geocode    — returns realistic geocode responses
 *   /.netlify/functions/sitecheck-test — runs backend tests
 */

'use strict';

const http   = require('http');
const fs     = require('fs');
const path   = require('path');
const url    = require('url');

const PORT   = parseInt(process.argv[2] || '8888', 10);
const PUBLIC = path.resolve(__dirname, '..', 'public');

// MIME types
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
  '.svg':  'image/svg+xml',
  '.woff2':'font/woff2',
  '.woff': 'font/woff',
  '.ttf':  'font/ttf',
};

// ── Mock geocode responses ─────────────────────────────────────────
// Keyed by partial address match
const GEOCODE_MOCK = {
  'Canley Vale Road': {
    found: true, lat: -33.886, lon: 150.934,
    source: 'Mock (local test)', confidence: 'Verified',
    matchedAddr: '148 Canley Vale Road, Canley Heights NSW 2166, Australia',
    locationType: 'ROOFTOP', paidApiUsed: true,
    addressQuality: 'exact', postcode: '2166', council: 'Cumberland Council',
    lotWarning: null, isLotAddress: false,
  },
  'Fake Street': {
    found: false, addressQuality: 'failed',
    reason: 'Postcode in address does not match Google result — please verify address.',
    attempted: '999 Fake Street, Nowhere NSW 9999',
  },
  'Fake street': {
    found: false, addressQuality: 'failed',
    reason: 'Postcode in address does not match Google result.',
    attempted: '999 Fake Street Nowhere NSW 9999',
  },
  'Hawkins Street': {
    found: true, lat: -35.972, lon: 147.002,
    source: 'Mock (local test)', confidence: 'Estimated',
    matchedAddr: '68 Hawkins Street, Howlong NSW 2643, Australia',
    locationType: 'RANGE_INTERPOLATED', paidApiUsed: true,
    addressQuality: 'interpolated', postcode: '2643', council: 'Federation Council',
    lotWarning: null, isLotAddress: false,
  },
  'St Moritz': {
    found: true, lat: -33.990, lon: 150.847,
    source: 'Mock (local test)', confidence: 'Needs review',
    matchedAddr: 'Austral NSW 2179, Australia',
    locationType: 'APPROXIMATE', paidApiUsed: false,
    addressQuality: 'suburb_only', postcode: '2179', council: 'Liverpool City Council',
    lotWarning: 'Lot-based address detected. Verify lot/DP/title details.',
    isLotAddress: true,
  },
  'Gould Street': {
    found: true, lat: -35.273, lon: 149.119,
    source: 'Mock (local test)', confidence: 'Verified',
    matchedAddr: '45 Gould Street, Turner ACT 2612, Australia',
    locationType: 'ROOFTOP', paidApiUsed: true,
    addressQuality: 'interpolated', postcode: '2612', council: 'ACT Government',
    lotWarning: null, isLotAddress: false,
  },
  'Davey Street': {
    found: true, lat: -42.882, lon: 147.329,
    source: 'Mock (local test)', confidence: 'Verified',
    matchedAddr: '1 Davey Street, Hobart TAS 7000, Australia',
    locationType: 'ROOFTOP', paidApiUsed: true,
    addressQuality: 'exact', postcode: '7000', council: 'Hobart City Council',
    lotWarning: null, isLotAddress: false,
  },
  'Elphin Road': {
    found: true, lat: -41.435, lon: 147.144,
    source: 'Mock (local test)', confidence: 'Verified',
    matchedAddr: '100 Elphin Road, Launceston TAS 7250, Australia',
    locationType: 'ROOFTOP', paidApiUsed: true,
    addressQuality: 'exact', postcode: '7250', council: 'Launceston City Council',
    lotWarning: null, isLotAddress: false,
  },
  'Collins Street': {
    found: true, lat: -37.814, lon: 144.964,
    source: 'Mock (local test)', confidence: 'Verified',
    matchedAddr: '15 Collins Street, Melbourne VIC 3000, Australia',
    locationType: 'ROOFTOP', paidApiUsed: true,
    addressQuality: 'exact', postcode: '3000', council: 'Melbourne City Council',
    lotWarning: null, isLotAddress: false,
  },
  'Queen Street': {
    found: true, lat: -27.469, lon: 153.023,
    source: 'Mock (local test)', confidence: 'Verified',
    matchedAddr: '1 Queen Street, Brisbane City QLD 4000, Australia',
    locationType: 'ROOFTOP', paidApiUsed: true,
    addressQuality: 'exact', postcode: '4000', council: 'Brisbane City Council',
    lotWarning: null, isLotAddress: false,
  },
};

function mockGeocode(address) {
  for (const [key, response] of Object.entries(GEOCODE_MOCK)) {
    if (address.includes(key)) return response;
  }
  // Default: not found
  return {
    found: false, addressQuality: 'failed',
    reason: 'Address could not be confidently matched.',
    attempted: address,
  
  'King William Street': {
    found: true, lat: -34.929, lon: 138.600,
    source: 'Mock (local test)', confidence: 'Verified',
    matchedAddr: '1 King William Street, Adelaide SA 5000, Australia',
    locationType: 'ROOFTOP', paidApiUsed: true,
    addressQuality: 'exact', postcode: '5000', council: 'Adelaide City Council',
    lotWarning: null, isLotAddress: false,
  },
  'St Georges Terrace': {
    found: true, lat: -31.954, lon: 115.861,
    source: 'Mock (local test)', confidence: 'Verified',
    matchedAddr: '1 St Georges Terrace, Perth WA 6000, Australia',
    locationType: 'ROOFTOP', paidApiUsed: true,
    addressQuality: 'exact', postcode: '6000', council: 'City of Perth',
    lotWarning: null, isLotAddress: false,
  },
  'Smith Street': {
    found: true, lat: -12.462, lon: 130.842,
    source: 'Mock (local test)', confidence: 'Verified',
    matchedAddr: '1 Smith Street, Darwin NT 0800, Australia',
    locationType: 'ROOFTOP', paidApiUsed: true,
    addressQuality: 'exact', postcode: '0800', council: 'City of Darwin',
    lotWarning: null, isLotAddress: false,
  },
};
}

// ── Static file server ─────────────────────────────────────────────
function serveStatic(reqPath, res) {
  // Resolve path within public/
  let filePath = path.join(PUBLIC, reqPath);

  // Handle directory → index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  if (!fs.existsSync(filePath)) {
    // Try 404.html
    const f404 = path.join(PUBLIC, '404.html');
    if (fs.existsSync(f404)) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end(fs.readFileSync(f404));
    } else {
      res.writeHead(404); res.end('Not found');
    }
    return;
  }

  const ext  = path.extname(filePath).toLowerCase();
  const mime = MIME[ext] || 'application/octet-stream';
  res.writeHead(200, {
    'Content-Type': mime,
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(fs.readFileSync(filePath));
}

// ── Request handler ───────────────────────────────────────────────
const server = http.createServer((req, res) => {
  const parsed  = url.parse(req.url, true);
  const reqPath = decodeURIComponent(parsed.pathname || '/');

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204); res.end(); return;
  }

  // ── Mock: geocode function ──────────────────────────────────────
  if (reqPath === '/.netlify/functions/geocode') {
    const address = parsed.query.address || '';
    const result  = mockGeocode(address);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
    return;
  }

  // ── Mock: sitecheck-test function ──────────────────────────────
  // Run the actual sitecheck-test.js against this local server
  if (reqPath === '/.netlify/functions/sitecheck-test') {
    const stPath = path.join(PUBLIC, 'netlify', 'functions', 'sitecheck-test.js');
    try {
      const mod = require(stPath);
      mod.handler({ httpMethod: 'GET' }).then(r => {
        res.writeHead(r.statusCode, { 'Content-Type': 'application/json' });
        res.end(r.body);
      }).catch(e => {
        res.writeHead(500); res.end(JSON.stringify({ error: e.message }));
      });
    } catch(e) {
      res.writeHead(500); res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // ── Mock: other Netlify functions return empty JSON ─────────────
  if (reqPath.startsWith('/.netlify/functions/')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ features: [] }));
    return;
  }

  // ── Static files ────────────────────────────────────────────────
  serveStatic(reqPath, res);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`SiteVerdict local test server running at http://localhost:${PORT}`);
  console.log(`  Serving: ${PUBLIC}`);
  console.log(`  Mock geocode: enabled (${Object.keys(GEOCODE_MOCK).length} addresses)`);
  console.log(`  Note: NSW ArcGIS Planning API calls will return empty results (no real data)`);
  console.log(`        NSW Site Check will complete but overlays will show as 'not detected'`);
  console.log(`  Press Ctrl+C to stop`);
});

server.on('error', (e) => {
  console.error(`Server error: ${e.message}`);
  process.exit(1);
});
