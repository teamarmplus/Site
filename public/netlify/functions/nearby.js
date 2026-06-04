// SiteVerdict — server-side nearby-context function
// Moves Overpass off the user's browser to one controlled server egress (same pattern as geocode.js).
// Categories: transport (rail station/halt, 5km) · health (hospital, 5km) · shops (supermarket, 2km) ·
//             parks/open space (leisure=park, 2km).
// Returns an explicit STATE so the UI never blurs "no data" with "service down":
//   state: 'found'       -> items present
//   state: 'none'        -> query succeeded but nothing nearby
//   state: 'unavailable' -> every Overpass endpoint failed (retry + mirror exhausted)
//   state: 'not_checked' -> (set by caller if lookup not run; never returned here)
// Never fabricates items. Caches by rounded lat/lng to avoid re-hitting Overpass.

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
];

// Simple in-memory cache (per warm function instance). Keyed by rounded coords (~110m grid).
const _cache = new Map();
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour
const CACHE_MAX = 500;

function cacheKey(lat, lon) {
  return lat.toFixed(3) + ',' + lon.toFixed(3); // ~110m rounding
}

function cacheGet(k) {
  const e = _cache.get(k);
  if (!e) return null;
  if (Date.now() - e.t > CACHE_TTL_MS) { _cache.delete(k); return null; }
  return e.v;
}

function cacheSet(k, v) {
  if (_cache.size >= CACHE_MAX) {
    // drop oldest
    const first = _cache.keys().next().value;
    if (first !== undefined) _cache.delete(first);
  }
  _cache.set(k, { v: v, t: Date.now() });
}

// metres-ish distance (equirectangular) in km, rounded to 0.1
function distKm(lat1, lon1, lat2, lon2) {
  const dLat = (lat2 - lat1) * 111;
  const dLon = (lon2 - lon1) * 111 * Math.cos(lat1 * Math.PI / 180);
  return Math.round(Math.sqrt(dLat * dLat + dLon * dLon) * 10) / 10;
}

function buildQuery(lat, lon) {
  // Match the live client radii: transport 5km, health 5km, shops 2km, parks 2km.
  return '[out:json][timeout:20];('
    + 'node["railway"~"station|halt"](around:5000,' + lat + ',' + lon + ');'
    + 'node["amenity"~"hospital"](around:5000,' + lat + ',' + lon + ');'
    + 'node["shop"~"supermarket"](around:2000,' + lat + ',' + lon + ');'
    + 'node["leisure"="park"](around:2000,' + lat + ',' + lon + ');'
    + 'way["leisure"="park"](around:2000,' + lat + ',' + lon + ');'
    + ');out center 60;';
}

function categoryOf(tags) {
  if (!tags) return null;
  if (tags.railway === 'station' || tags.railway === 'halt') return 'transport';
  if (tags.amenity === 'hospital') return 'health';
  if (tags.shop === 'supermarket') return 'shops';
  if (tags.leisure === 'park') return 'parks';
  return null;
}

// Parse a raw Overpass JSON payload into categorised, distance-sorted lists (max 3 each).
function parseOverpass(payload, lat, lon) {
  const out = { transport: [], health: [], shops: [], parks: [] };
  const els = (payload && payload.elements) || [];
  for (const el of els) {
    const tags = el.tags || {};
    const name = tags.name;
    if (!name) continue;
    const cat = categoryOf(tags);
    if (!cat) continue;
    const elat = (el.lat != null) ? el.lat : (el.center && el.center.lat);
    const elon = (el.lon != null) ? el.lon : (el.center && el.center.lon);
    if (elat == null || elon == null) continue;
    out[cat].push({ name: String(name).slice(0, 60), dist: distKm(lat, lon, elat, elon) });
  }
  for (const k of Object.keys(out)) {
    out[k].sort((a, b) => a.dist - b.dist);
    out[k] = out[k].slice(0, 3);
  }
  return out;
}

function totalItems(cats) {
  return cats.transport.length + cats.health.length + cats.shops.length + cats.parks.length;
}

// Try each endpoint in turn with a short timeout. Returns {ok:true,payload} or {ok:false}.
async function fetchOverpass(query) {
  for (const url of OVERPASS_ENDPOINTS) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'data=' + encodeURIComponent(query),
        signal: ctrl.signal
      });
      clearTimeout(timer);
      if (!res.ok) continue;
      const text = await res.text();
      let payload;
      try { payload = JSON.parse(text); } catch (e) { continue; } // non-JSON (HTML error page) -> next endpoint
      if (payload && Array.isArray(payload.elements)) return { ok: true, payload };
    } catch (e) {
      clearTimeout(timer);
      // timeout / network -> try next endpoint
    }
  }
  return { ok: false };
}

exports.handler = async function (event) {
  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' };
  }

  const q = event.queryStringParameters || {};
  const lat = parseFloat(q.lat);
  const lon = parseFloat(q.lng != null ? q.lng : q.lon);
  if (!isFinite(lat) || !isFinite(lon)) {
    return {
      statusCode: 400, headers: CORS,
      body: JSON.stringify({ state: 'not_checked', reason: 'lat/lng required' })
    };
  }

  const key = cacheKey(lat, lon);
  const cached = cacheGet(key);
  if (cached) {
    return { statusCode: 200, headers: CORS, body: JSON.stringify(Object.assign({ cached: true }, cached)) };
  }

  const result = await fetchOverpass(buildQuery(lat, lon));
  if (!result.ok) {
    // Do not cache an unavailable result — it may recover shortly.
    return {
      statusCode: 200, headers: CORS,
      body: JSON.stringify({ state: 'unavailable', categories: { transport: [], health: [], shops: [], parks: [] } })
    };
  }

  const cats = parseOverpass(result.payload, lat, lon);
  const state = totalItems(cats) > 0 ? 'found' : 'none';
  const body = { state: state, categories: cats };
  cacheSet(key, body);
  return { statusCode: 200, headers: CORS, body: JSON.stringify(body) };
};

// Exported for unit tests (no network).
exports._test = { parseOverpass, categoryOf, distKm, totalItems, buildQuery, cacheKey };
