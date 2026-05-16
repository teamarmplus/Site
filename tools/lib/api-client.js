/**
 * SiteVerdict — Batch API Client
 *
 * Rate-limited, cached calls to the same data sources used by the website.
 * No paid APIs are called unless --no-paid-api flag is NOT set.
 * All results cached by coordinate hash to avoid repeated calls.
 */

'use strict';

const https  = require('https');
const http   = require('http');
const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');

const CACHE_DIR = path.join(__dirname, '../../data/cache');
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

// ── CACHE ─────────────────────────────────────────────────────────

function cacheKey(prefix, value) {
  return crypto.createHash('md5').update(prefix + value).digest('hex');
}

function cacheRead(key) {
  const file = path.join(CACHE_DIR, key + '.json');
  if (!fs.existsSync(file)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    return data;
  } catch {
    return null;
  }
}

function cacheWrite(key, data) {
  const file = path.join(CACHE_DIR, key + '.json');
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ── HTTP HELPER ───────────────────────────────────────────────────

function fetchJson(url, headers = {}, timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const opts = new URL(url);
    const req = lib.request({
      hostname: opts.hostname,
      path:     opts.pathname + opts.search,
      method:   'GET',
      headers: {
        'User-Agent': 'SiteVerdict-Backtest/1.0 (research; contact siteverdict.com.au)',
        'Accept':     'application/json',
        ...headers,
      },
    }, (res) => {
      let raw = '';
      res.on('data', c => { raw += c; });
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); }
        catch { reject(new Error(`JSON parse failed for ${url}: ${raw.slice(0,100)}`)); }
      });
    });
    req.on('error', reject);
    req.setTimeout(timeoutMs, () => { req.destroy(new Error(`Timeout: ${url}`)); });
    req.end();
  });
}

// ── DELAY ────────────────────────────────────────────────────────

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ── GEOCODE ───────────────────────────────────────────────────────

async function geocodeAddress(address, delayMs = 1200) {
  const key = cacheKey('geo', address);
  const cached = cacheRead(key);
  if (cached) return cached;

  await delay(delayMs); // Nominatim 1 req/sec limit

  // Attempt 1: with Australia
  let result = null;
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address + ' Australia')}&format=json&limit=1&accept-language=en`;
    const data = await fetchJson(url);
    if (data && data.length) result = data[0];
  } catch (e) {
    console.warn(`  [geo] attempt 1 failed: ${e.message}`);
  }

  // Attempt 2: countrycodes fallback
  if (!result) {
    await delay(1200);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=au`;
      const data = await fetchJson(url);
      if (data && data.length) result = data[0];
    } catch (e) {
      console.warn(`  [geo] attempt 2 failed: ${e.message}`);
    }
  }

  if (!result) return null;

  const geo = {
    lat: parseFloat(result.lat),
    lon: parseFloat(result.lon),
    displayName: result.display_name,
  };
  cacheWrite(key, geo);
  return geo;
}

// ── WEB MERCATOR ─────────────────────────────────────────────────

function toMercator(lat, lon) {
  const x = lon * 20037508.34 / 180;
  const y = Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180) * 20037508.34 / 180;
  return { x, y };
}

// ── NSW PLANNING PORTAL LAYERS ────────────────────────────────────

const PLANNING_BASE = 'https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/Planning/Principal_Planning_Layers/MapServer';

async function queryLayer(layerId, geomJson, fields, coordHash, delayMs = 800) {
  const key = cacheKey(`layer${layerId}`, coordHash);
  const cached = cacheRead(key);
  if (cached !== null) return cached;

  await delay(delayMs);

  const g = encodeURIComponent(geomJson);
  const url = `${PLANNING_BASE}/${layerId}/query?geometry=${g}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&outFields=${fields}&returnGeometry=false&inSR=102100&f=json`;

  try {
    const data = await fetchJson(url);
    const features = data.features || [];
    cacheWrite(key, features);
    return features;
  } catch (e) {
    console.warn(`  [layer${layerId}] ${e.message}`);
    return [];
  }
}

async function queryEpiFlood(geomJson, coordHash, delayMs = 800) {
  const key = cacheKey('flood', coordHash);
  const cached = cacheRead(key);
  if (cached !== null) return cached;
  await delay(delayMs);
  const g = encodeURIComponent(geomJson);
  const url = `https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/Planning/EPI_Flood_Planning_Area/MapServer/0/query?geometry=${g}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&outFields=*&returnGeometry=false&inSR=102100&f=json`;
  try {
    const data = await fetchJson(url);
    const features = data.features || [];
    cacheWrite(key, features);
    return features;
  } catch (e) {
    console.warn(`  [flood] ${e.message}`);
    return [];
  }
}

async function queryBushfire(geomJson, coordHash, delayMs = 800) {
  const key = cacheKey('bushfire', coordHash);
  const cached = cacheRead(key);
  if (cached !== null) return cached;
  await delay(delayMs);
  const g = encodeURIComponent(geomJson);
  const url = `https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/Planning/Bush_Fire_Prone_Land/MapServer/0/query?geometry=${g}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&outFields=*&returnGeometry=false&inSR=102100&f=json`;
  try {
    const data = await fetchJson(url);
    const features = data.features || [];
    cacheWrite(key, features);
    return features;
  } catch (e) {
    console.warn(`  [bushfire] ${e.message}`);
    return [];
  }
}

// ── NSW CADASTRE (block size) ─────────────────────────────────────

async function queryCadastre(mx, my, coordHash, delayMs = 800) {
  const key = cacheKey('cadastre', coordHash);
  const cached = cacheRead(key);
  if (cached !== null) return cached;
  await delay(delayMs);

  const BASE = 'https://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_Cadastre/MapServer/9/query';
  let result = null;

  for (const dist of [0, 5, 15, 25]) {
    const distParam = dist > 0 ? `&distance=${dist}&units=esriSRUnit_Meter` : '';
    const url = `${BASE}?geometry=${mx},${my}&geometryType=esriGeometryPoint&inSR=102100&spatialRel=esriSpatialRelIntersects${distParam}&outFields=lotidstring,planlotarea,planlotareaunits,shape_Area&returnGeometry=false&f=json`;
    try {
      const data = await fetchJson(url);
      const features = data.features || [];
      if (features.length) { result = features; break; }
    } catch (e) {
      console.warn(`  [cadastre dist=${dist}] ${e.message}`);
    }
    if (dist > 0) await delay(400);
  }

  const out = result || [];
  cacheWrite(key, out);
  return out;
}

// ── FULL PROPERTY FETCH ───────────────────────────────────────────

/**
 * Fetch all planning data for a geocoded property.
 * Mirrors the parallel fetch in runCheck() but with rate limiting and caching.
 *
 * @param {number} lat
 * @param {number} lon
 * @param {object} opts  { usePaidApi: bool }
 * @returns {object}  Raw API results
 */
async function fetchPlanningData(lat, lon, opts = {}) {
  const { mx, y: my } = (() => {
    const m = toMercator(lat, lon);
    return { mx: m.x, y: m.y };
  })();
  const mm = toMercator(lat, lon);
  const coordHash = `${lat.toFixed(5)},${lon.toFixed(5)}`;

  const geomJson = JSON.stringify({ x: mm.x, y: mm.y, spatialReference: { wkid: 102100 } });

  // All layers in sequence (no parallel — rate limit compliance)
  const zone     = await queryLayer(11, geomJson, 'LAY_CLASS,SYM_CODE,LGA_NAME', coordHash);
  const mlsLayer = await queryLayer(14, geomJson, 'LOT_SIZE', coordHash);
  const heritage = await queryLayer(8,  geomJson, 'H_NAME,H_ID,LEGIS_REF_CLAUSE', coordHash);
  const fsrLayer = await queryLayer(4,  geomJson, 'FSR_MAX,LAY_CLASS', coordHash);
  const htLayer  = await queryLayer(7,  geomJson, 'HEIGHT_MAX,LAY_CLASS', coordHash);
  const landRes  = await queryLayer(16, geomJson, 'RESERVE_TYPE,LAY_CLASS', coordHash);
  const fshore   = await queryLayer(18, geomJson, 'LAY_CLASS', coordHash);
  const acid     = await queryLayer(15, geomJson, 'LAY_CLASS,ACID_CLASS', coordHash);
  const contam   = await queryLayer(17, geomJson, 'LAY_CLASS', coordHash);
  const riparian = await queryLayer(13, geomJson, 'LAY_CLASS', coordHash);
  const flood    = await queryEpiFlood(geomJson, coordHash);
  const bushfire = await queryBushfire(geomJson, coordHash);

  // Cadastre (block size)
  const cadFeats = await queryCadastre(mm.x, mm.y, coordHash);

  return {
    zone, mlsLayer, heritage, fsrLayer, htLayer,
    landRes, fshore, acid, contam, riparian,
    flood, bushfire, cadFeats,
  };
}

// ── PARSE RAW API DATA → structured planning object ───────────────

function parsePlanningData(raw, lga_override) {
  const ZONE_MLS_DEF = {
    R1:450,R2:450,R3:400,R4:350,R5:2000,R6:450,
    RU1:4000,RU2:4000,RU3:4000,RU4:2000,RU5:2000,RU6:4000,
    E3:2000,E4:500,C4:400,UR:500,MU1:400,MU2:400,SP1:2000,SP2:4000,
  };

  let zone = '', zoneName = '', lga = lga_override || '';
  if (raw.zone && raw.zone.length) {
    const a = raw.zone[0].attributes || {};
    zone = a.SYM_CODE || '';
    zoneName = a.LAY_CLASS || '';
    if (!lga) lga = a.LGA_NAME || '';
  }

  let mls = ZONE_MLS_DEF[zone] || 450;
  let mlsReal = false;
  if (raw.mlsLayer && raw.mlsLayer.length) {
    const ls = raw.mlsLayer[0].attributes.LOT_SIZE;
    const minCheck = ({R1:50,R2:50,R3:50,R4:50,R5:100,RU1:500}[zone] || 50);
    if (ls && ls >= minCheck) { mls = ls; mlsReal = true; }
  }

  const zoneAllows = ['R1','R2','R3','R4','R5','R6','RU1','RU2','RU3','RU4','RU5','RU6',
                      'E4','E3','C4','UR','MU1','MU2','B4','SP1','SP2'].includes(zone);

  const heritage = (raw.heritage && raw.heritage.length)
    ? { name: raw.heritage[0].attributes.H_NAME || 'Heritage item' } : null;
  const flood    = (raw.flood && raw.flood.length) > 0;
  const bushfire = (raw.bushfire && raw.bushfire.length) > 0;

  const fsr = (raw.fsrLayer && raw.fsrLayer.length)
    ? raw.fsrLayer[0].attributes.FSR_MAX || null : null;
  const height = (raw.htLayer && raw.htLayer.length)
    ? raw.htLayer[0].attributes.HEIGHT_MAX || null : null;

  const landRes = (raw.landRes && raw.landRes.length)
    ? raw.landRes[0].attributes.RESERVE_TYPE || 'Yes' : null;
  const foreshore   = (raw.fshore && raw.fshore.length) > 0;
  const acid        = (raw.acid && raw.acid.length)
    ? raw.acid[0].attributes.ACID_CLASS || 'Yes' : null;
  const contaminated = (raw.contam && raw.contam.length) > 0;
  const riparian    = (raw.riparian && raw.riparian.length) > 0;

  // Parse block size from cadastre
  let block = 0;
  if (raw.cadFeats && raw.cadFeats.length) {
    const plaPool = raw.cadFeats.map(f => {
      const a = f.attributes || {};
      let area = parseFloat(a.planlotarea) || parseFloat(a.PLANLOTAREA) || 0;
      const units = (a.planlotareaunits || '').toUpperCase();
      if ((units === 'H' || units === 'HA') && area > 0) area *= 10000;
      if (!area) area = parseFloat(a.shape_Area) || parseFloat(a.Shape_Area) || 0;
      return area;
    }).filter(a => a >= 50 && a <= 100000);

    // Prefer planlotarea-based values; pick smallest plausible residential lot
    const residential = plaPool.filter(a => a >= 100 && a <= 2000);
    if (residential.length) {
      residential.sort((a, b) => a - b);
      block = Math.round(residential[0]);
    } else if (plaPool.length) {
      plaPool.sort((a, b) => a - b);
      block = Math.round(plaPool[0]);
    }
  }

  return { zone, zoneName, lga, mls, mlsReal, block, zoneAllows,
           heritage, flood, bushfire, fsr, height,
           landRes, foreshore, acid, contaminated, riparian };
}

module.exports = { geocodeAddress, fetchPlanningData, parsePlanningData, delay };
