// SiteVerdict — free authoritative NSW address autocomplete (token-free).
// Queries NSW_Property/MapServer/4 `address` field by prefix. Expands common abbreviations so the
// user's terse input matches the DCS "<number> <STREET> <TYPE> <SUBURB>" format. Returns {propid,address}.
// Fair-use: min length enforced here; the CLIENT must debounce (>=400ms) and cache. No geocoding.

var PROPERTY_URL = 'https://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_Property/MapServer/4/query';

// in-memory cache (per warm function instance) — keyed by normalised prefix
var CACHE = {};
var CACHE_MAX = 400;

var ABBR = { ST: 'STREET', RD: 'ROAD', AVE: 'AVENUE', AV: 'AVENUE', DR: 'DRIVE', DRV: 'DRIVE', CT: 'COURT', CR: 'CRESCENT', CRES: 'CRESCENT', PL: 'PLACE', PDE: 'PARADE', HWY: 'HIGHWAY', LN: 'LANE', CL: 'CLOSE', BVD: 'BOULEVARD', BLVD: 'BOULEVARD', TCE: 'TERRACE', GR: 'GROVE', CCT: 'CIRCUIT', PWY: 'PARKWAY' };

// Normalise a partial address to DCS prefix form. Keeps it a PREFIX (no trailing wildcard here).
function normalisePrefix(s) {
  if (!s) return '';
  var t = ' ' + String(s).toUpperCase().replace(/,/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
  t = t.replace(/\bAUSTRALIA\b/g, ' ').replace(/\b(NSW|NEW SOUTH WALES)\b/g, ' ').replace(/\b\d{4}\b/g, ' ');
  t = t.replace(/\s+/g, ' ').trim();
  var words = t.split(' ').filter(Boolean).map(function (w) { return ABBR[w] || w; });
  return words.join(' ');
}

// Escape single quotes for the ArcGIS where clause.
function esc(s) { return String(s).replace(/'/g, "''"); }

function fetchJson(url, ms) {
  var ctrl = new AbortController();
  var t = setTimeout(function () { ctrl.abort(); }, ms || 1500);
  return fetch(url, { signal: ctrl.signal })
    .then(function (r) { clearTimeout(t); return r.json(); })
    .catch(function () { clearTimeout(t); return { __timeout: true }; });
}

exports.handler = async function (event) {
  var CORS = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  var q = event.queryStringParameters || {};
  var raw = (q.q || '').trim();

  var norm = normalisePrefix(raw);
  // Fair-use: require a meaningful prefix (a number + at least a few street chars), min 6 chars.
  if (norm.length < 6 || !/^\d/.test(norm)) {
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ suggestions: [], reason: 'min 6 chars, start with street number' }) };
  }

  if (CACHE[norm]) {
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ suggestions: CACHE[norm], cached: true }) };
  }

  // NOTE: this layer rejects resultRecordCount (400) — do NOT send it; cap client-side here.
  var where = "address LIKE '" + esc(norm) + "%'";
  var url = PROPERTY_URL + '?where=' + encodeURIComponent(where) + '&outFields=propid,address&returnGeometry=false&f=json';
  var res = await fetchJson(url);

  if (!res || res.error || res.__timeout) {
    // never invent suggestions; surface an honest empty + soft error so the client falls back to free-type
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ suggestions: [], error: res && res.__timeout ? 'timeout' : (res && res.error ? res.error.code : 'unreachable') }) };
  }

  var feats = (res.features || []);
  // dedupe by propid, cap to 8
  var seen = {}, out = [];
  for (var i = 0; i < feats.length && out.length < 8; i++) {
    var a = feats[i].attributes || {};
    if (a.propid == null || seen[a.propid]) continue;
    seen[a.propid] = 1;
    out.push({ propid: a.propid, address: a.address });
  }

  // cache (bounded)
  if (Object.keys(CACHE).length > CACHE_MAX) CACHE = {};
  CACHE[norm] = out;

  return { statusCode: 200, headers: CORS, body: JSON.stringify({ suggestions: out }) };
};

// exported for offline tests
exports._test = { normalisePrefix: normalisePrefix, esc: esc };
