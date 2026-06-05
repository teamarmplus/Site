// SiteVerdict — server-side PARCEL PRECISION resolver
// Method change: resolve POINT -> PROPERTY -> all contained LOTS (not point -> single lot).
// Source: NSW DCS Spatial Services (SIX Maps), CC-BY. No paid APIs.
//   - Property: NSW_Property/MapServer/4 (Urban_Property) — point-in-property, returns propid + polygon
//   - Lots:     NSW_Cadastre/MapServer/9 (Lot) — lots CONTAINED by the property polygon
// Returns Lot/Section/Plan for EVERY constituent lot + summed polygon area + a confidence state.
// Never fabricates: if no confident single-property match, returns confidence:'needs_review'.
//
// Confidence model:
//   verified     -> exactly ONE property at the point, geocode point inside it, lots resolved, area consistent
//   estimated    -> property resolved but with minor ambiguity (e.g. point matched via small buffer)
//   needs_review -> (default) no property at point, multiple properties, no lots contained, or area conflict
//
// Pure logic (parse/sum/confidence/conflict) is exported via _test for offline unit tests against
// RECORDED cadastre payloads. Live HTTP only runs in the handler.

const PROPERTY_URL = 'https://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_Property/MapServer/4/query';
const LOT_URL = 'https://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_Cadastre/MapServer/9/query';

// ---- pure helpers (unit-tested) ----

// Build a clean Lot/Section/Plan identity string for one lot.
function lotIdentity(a) {
  if (!a) return '';
  var lot = a.lotnumber != null ? 'Lot ' + a.lotnumber : '';
  var sec = (a.sectionnumber != null && String(a.sectionnumber).trim() !== '') ? ' Sec ' + a.sectionnumber : '';
  var plan = a.planlabel ? ' ' + a.planlabel : '';
  return (lot + sec + plan).trim();
}

// Sum area across lots. Prefer summed polygon shape_Area; planlotarea only as fallback when present.
function sumLotArea(lots) {
  if (!lots || !lots.length) return { area: null, source: null };
  var shapeSum = 0, shapeN = 0, planSum = 0, planN = 0;
  lots.forEach(function (l) {
    var a = l.attributes || l;
    var sa = parseFloat(a.shape_Area);
    if (isFinite(sa) && sa > 0) { shapeSum += sa; shapeN++; }
    var pla = parseFloat(a.planlotarea);
    if (isFinite(pla) && pla > 0) { planSum += pla; planN++; }
  });
  if (shapeN === lots.length && shapeSum > 0) return { area: Math.round(shapeSum), source: 'polygon' };
  if (planN === lots.length && planSum > 0) return { area: Math.round(planSum), source: 'planlotarea' };
  if (shapeSum > 0) return { area: Math.round(shapeSum), source: 'polygon-partial' };
  return { area: null, source: null };
}

// Decide confidence from resolution facts.
function decideConfidence(facts) {
  // facts: { propertyCount, pointInside, lotCount, areaConflict }
  if (!facts || facts.propertyCount === 0 || facts.lotCount === 0) return 'needs_review';
  if (facts.areaConflict) return 'needs_review';
  if (facts.propertyCount === 1 && facts.pointInside && facts.lotCount >= 1) return 'verified';
  if (facts.propertyCount === 1 && facts.lotCount >= 1) return 'estimated';
  return 'needs_review';
}

// Area conflict vs user-entered size (>25% difference). Returns {conflict, detected, entered, pct}.
function areaConflict(detected, entered) {
  var d = parseFloat(detected), e = parseFloat(entered);
  if (!isFinite(d) || d <= 0 || !isFinite(e) || e <= 0) return { conflict: false };
  var pct = Math.abs(d - e) / e;
  return { conflict: pct > 0.25, detected: Math.round(d), entered: Math.round(e), pct: Math.round(pct * 100) };
}

// Point-in-polygon (ray casting) against esri rings [[ [x,y], ... ]]. lon=x, lat=y.
function pointInRings(lat, lon, rings) {
  if (!rings || !rings.length) return false;
  var inside = false;
  for (var r = 0; r < rings.length; r++) {
    var ring = rings[r];
    for (var i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      var xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
      var intersect = ((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / ((yj - yi) || 1e-12) + xi);
      if (intersect) inside = !inside;
    }
  }
  return inside;
}

// Nearest-edge distance (metres, approx) from a point to polygon rings. 0 if inside.
function ringDistanceMetres(lat, lon, rings) {
  if (!rings || !rings.length) return Infinity;
  if (pointInRings(lat, lon, rings)) return 0;
  var mPerDegLat = 111000, mPerDegLon = 111000 * Math.cos(lat * Math.PI / 180);
  var best = Infinity;
  for (var r = 0; r < rings.length; r++) {
    var ring = rings[r];
    for (var i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      var ax = ring[j][0], ay = ring[j][1], bx = ring[i][0], by = ring[i][1];
      // segment a-b, point p; work in metres
      var px = (lon - ax) * mPerDegLon, py = (lat - ay) * mPerDegLat;
      var vx = (bx - ax) * mPerDegLon, vy = (by - ay) * mPerDegLat;
      var len2 = vx * vx + vy * vy;
      var t = len2 ? Math.max(0, Math.min(1, (px * vx + py * vy) / len2)) : 0;
      var dx = px - t * vx, dy = py - t * vy;
      var d = Math.sqrt(dx * dx + dy * dy);
      if (d < best) best = d;
    }
  }
  return best;
}

// --- Phase 3: authoritative address-first resolution ---

// Normalise a free-form address to the DCS property 'address' format: "<NUMBER> <STREET> <TYPE> <SUBURB>"
// Expands road-type abbreviations, uppercases, strips unit prefixes, state, postcode, country.
// Returns '' if it can't form a "<number> <street...> <suburb>" shape.
function normaliseForDcs(addr) {
  if (!addr) return '';
  var s = ' ' + String(addr).toUpperCase().replace(/,/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
  s = s.replace(/\bAUSTRALIA\b/g, ' ');
  s = s.replace(/\b(NSW|NEW SOUTH WALES|ACT|VIC|QLD|SA|WA|TAS|NT)\b/g, ' ');
  s = s.replace(/\b\d{4}\b/g, ' '); // postcode
  // drop a leading unit/number like "10/45" -> keep base number "45"
  s = s.replace(/^\s*(\d+)\s*\/\s*(\d+)\b/, ' $2 ');
  s = s.replace(/\s+/g, ' ').trim();
  var ABBR = { ST: 'STREET', RD: 'ROAD', AVE: 'AVENUE', AV: 'AVENUE', DR: 'DRIVE', DRV: 'DRIVE', CT: 'COURT', CR: 'CRESCENT', CRES: 'CRESCENT', PL: 'PLACE', PDE: 'PARADE', HWY: 'HIGHWAY', LN: 'LANE', CL: 'CLOSE', BVD: 'BOULEVARD', TCE: 'TERRACE', GR: 'GROVE', CCT: 'CIRCUIT' };
  var words = s.split(' ').filter(Boolean).map(function (w) { return ABBR[w] || w; });
  if (!words.length || !/^\d+[A-Z]?$/.test(words[0])) return ''; // must start with a house number
  // normalise leading "25A" -> "25"
  words[0] = words[0].replace(/[A-Z]$/, '');
  return words.join(' ');
}

// Build an exact DCS where-clause value for the address (escape single quotes).
function dcsAddressWhere(norm) {
  if (!norm) return '';
  return "address='" + norm.replace(/'/g, "''") + "'";
}

// --- Phase 2: safe verified-rate helpers ---

// Extract a comparable street name from a free-form address.
// "12 Valentine Ave, Parramatta NSW 2150" -> "valentine avenue"; "101/43 OXFORD STREET EPPING" -> "oxford street".
function streetName(addr) {
  if (!addr) return '';
  var s = ' ' + String(addr).toUpperCase().replace(/,/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
  // drop a leading unit/number token like "101/43" or "12"
  s = s.replace(/^\s*\d+\s*\/\s*\d+\s+/, ' ').replace(/^\s*\d+[A-Z]?\s+/, ' ');
  var ABBR = { ST: 'STREET', RD: 'ROAD', AVE: 'AVENUE', AV: 'AVENUE', DR: 'DRIVE', CT: 'COURT', CR: 'CRESCENT', CRES: 'CRESCENT', PL: 'PLACE', PDE: 'PARADE', HWY: 'HIGHWAY', LN: 'LANE', CL: 'CLOSE', BVD: 'BOULEVARD', TCE: 'TERRACE' };
  var TYPES = { STREET:1, ROAD:1, AVENUE:1, DRIVE:1, COURT:1, CRESCENT:1, PLACE:1, PARADE:1, HIGHWAY:1, LANE:1, CLOSE:1, BOULEVARD:1, TERRACE:1, WAY:1, GROVE:1, CIRCUIT:1 };
  var words = s.trim().split(' ');
  var out = [];
  for (var i = 0; i < words.length; i++) {
    var w = words[i];
    if (ABBR[w]) w = ABBR[w];
    out.push(w);
    if (TYPES[w]) break; // stop at the first road-type word
  }
  return out.join(' ').toLowerCase().trim();
}

function streetsMatch(a, b) {
  var sa = streetName(a), sb = streetName(b);
  if (!sa || !sb) return false;
  return sa === sb;
}

// Extract the leading street number (handles "45", "25A", "10/45" -> base number "45" or unit form).
function streetNumber(addr) {
  if (!addr) return '';
  var s = String(addr).trim().toUpperCase().replace(/,/g, ' ');
  var unit = s.match(/^\s*(\d+)\s*\/\s*(\d+)\b/); // unit/number form -> use the base number
  if (unit) return unit[2];
  var m = s.match(/^\s*(\d+)[A-Z]?\b/);
  return m ? m[1] : '';
}

// Full address match: same street AND same street number. Used to gate verified/estimated so a
// geocode point that drifts onto a SAME-STREET neighbour (e.g. 45 vs 46 Beecroft Rd) does NOT verify.
function addressMatches(candidate, input) {
  if (!streetsMatch(candidate, input)) return false;
  var cn = streetNumber(candidate), inn = streetNumber(input);
  if (!cn || !inn) return false;       // can't confirm number -> do not assert
  return cn === inn;
}

// Extract the suburb (last token-run after the street type) from an address, uppercased.
function suburbOf(addr){
  if(!addr) return '';
  var s=String(addr).toUpperCase().replace(/,/g,' ').replace(/\s+/g,' ').trim();
  s=s.replace(/\bAUSTRALIA\b/g,' ').replace(/\b(NSW|NEW SOUTH WALES|ACT|VIC|QLD|SA|WA|TAS|NT)\b/g,' ').replace(/\b\d{4}\b/g,' ').replace(/\s+/g,' ').trim();
  var TYPES=['STREET','ROAD','AVENUE','DRIVE','COURT','CRESCENT','PLACE','PARADE','HIGHWAY','LANE','CLOSE','BOULEVARD','TERRACE','WAY','GROVE','CIRCUIT','ST','RD','AVE','AV','DR','CT','CR','CRES','PL','PDE','HWY','LN','CL','BVD','TCE'];
  var w=s.split(' ').filter(Boolean);
  var lastType=-1;
  for(var i=0;i<w.length;i++){ if(TYPES.indexOf(w[i])>=0) lastType=i; }
  if(lastType>=0 && lastType<w.length-1) return w.slice(lastType+1).join(' ');
  return '';
}

// Strata signature: a unit-prefixed address like "101/43 OXFORD STREET" or many co-located unit properties.
function isStrataAddress(addr) {
  if (!addr) return false;
  return /^\s*\d+\s*\/\s*\d+\b/.test(String(addr).trim());
}

// Choose the correct property from candidates by street match to the user's input.
// Returns {property, pointInside, strata} or {property:null} if none safely matches.
function selectProperty(candidatesAtPoint, candidatesInBuffer, inputAddr) {
  var atPoint = candidatesAtPoint || [];
  var inBuf = candidatesInBuffer || [];
  function addrOf(f){ return (f.attributes ? f.attributes.address : f.address) || ''; }

  // Strata: many properties stacked at the point, or unit-prefixed addresses -> do not assert a land parcel.
  var strataLike = atPoint.length > 3 && atPoint.some(function(f){ return isStrataAddress(addrOf(f)); });
  if (strataLike) return { property: null, pointInside: false, strata: true };

  // Exactly one property (propid) at the point.
  if (atPoint.length >= 1) {
    var uniqProp = atPoint.filter(function (f, i, arr) {
      var pid = f.attributes ? f.attributes.propid : f.propid;
      return arr.findIndex(function (x) { return (x.attributes ? x.attributes.propid : x.propid) === pid; }) === i;
    });
    if (uniqProp.length === 1) {
      // Single distinct property at point — but only treat as point-inside (verified-eligible) if its
      // address street matches the input. A point can fall inside a large/adjacent property whose
      // street differs (e.g. a multi-frontage block) — that must NOT verify.
      var inside = inputAddr ? addressMatches(addrOf(uniqProp[0]), inputAddr) : true;
      if (inputAddr && !inside) return { property: null, pointInside: false, strata: false }; // number/street mismatch -> needs_review
      return { property: uniqProp[0], pointInside: inside, strata: false };
    }
    // Multiple distinct properties at point: pick the unique street match.
    var m = atPoint.filter(function (f) { return addressMatches(addrOf(f), inputAddr); });
    var mProp = m.filter(function (f, i, arr) {
      var pid = f.attributes ? f.attributes.propid : f.propid;
      return arr.findIndex(function (x) { return (x.attributes ? x.attributes.propid : x.propid) === pid; }) === i;
    });
    if (mProp.length === 1) return { property: mProp[0], pointInside: true, strata: false };
    return { property: null, pointInside: false, strata: false }; // ambiguous -> needs_review
  }

  // None at point (geocode drift): use a buffered candidate ONLY if its street matches the input street
  // AND it is the unique street-matching candidate. Otherwise fail safe.
  var bm = inBuf.filter(function(f){ return addressMatches(addrOf(f), inputAddr); });
  if (bm.length === 1) return { property: bm[0], pointInside: false, strata: false }; // estimated (point not inside)
  return { property: null, pointInside: false, strata: false };
}

// Build the full resolved-parcel object from a property + its contained lots (pure).
function buildResolved(property, lots, pointInside, enteredArea, strata) {
  if (strata) {
    return {
      confidence: 'needs_review', strata: true,
      propertyAddress: null, lots: [], lotCount: 0, area: null, areaSource: null,
      areaLabel: 'Estimated', conflict: null
    };
  }
  var propertyCount = property ? 1 : 0;
  var lotList = (lots || []).map(function (l) {
    var a = l.attributes || l;
    return { identity: lotIdentity(a), lot: a.lotnumber, section: a.sectionnumber, plan: a.planlabel };
  });
  var areaInfo = sumLotArea(lots || []);
  var conf = areaConflict(areaInfo.area, enteredArea);
  // Strata plans (SP-prefixed plan labels) are not plain land parcels — never assert as a land lot.
  var anyStrata = lotList.some(function(l){ return /^SP/i.test(String(l.plan||'')); });
    var confidence = decideConfidence({
    propertyCount: propertyCount,
    pointInside: !!pointInside,
    lotCount: lotList.length,
    areaConflict: conf.conflict
  });
  // Sanity cap: a single home property is rarely >4 lots. A high lot count means the polygon likely
  // spans a block/parent parcel — never assert that as verified OR estimated; force needs_review.
  if ((confidence === 'verified' || confidence === 'estimated') && lotList.length > 4) confidence = 'needs_review';
  if (anyStrata) confidence = 'needs_review';
  return {
    confidence: confidence,
    propertyAddress: property && (property.attributes ? property.attributes.address : property.address) || null,
    lots: lotList,
    lotCount: lotList.length,
    area: areaInfo.area,
    areaSource: areaInfo.source,    // 'polygon' | 'planlotarea' | 'polygon-partial' | null
    areaLabel: 'Estimated',          // never "Detected"
    conflict: conf.conflict ? conf : null
  };
}

// ---- live HTTP (handler only) ----

async function fetchJson(url, timeoutMs) {
  var ctrl = new AbortController();
  var t = setTimeout(function () { ctrl.abort(); }, timeoutMs || 9000);
  try {
    var r = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'SiteVerdict' } });
    clearTimeout(t);
    if (!r.ok) return null;
    var txt = await r.text();
    try { return JSON.parse(txt); } catch (e) { return null; }
  } catch (e) { clearTimeout(t); return null; }
}

function enc(o) { return encodeURIComponent(JSON.stringify(o)); }

exports.handler = async function (event) {
  var CORS = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };

  var q = event.queryStringParameters || {};
  var lat = parseFloat(q.lat), lon = parseFloat(q.lng != null ? q.lng : q.lon);
  var enteredArea = q.area != null ? parseFloat(q.area) : null;
  if (!isFinite(lat) || !isFinite(lon)) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ confidence: 'needs_review', reason: 'lat/lng required' }) };
  }

  var inputAddr = q.addr || q.matched || '';
  var userAddr = q.uaddr || inputAddr;  // raw user-typed address (suburb-relocation guard)

  // PART A: authoritative address-first resolution (eliminates geocode drift).
  var norm = normaliseForDcs(inputAddr);
  if (norm) {
    var addrRes = await fetchJson(PROPERTY_URL + '?where=' + encodeURIComponent(dcsAddressWhere(norm)) + '&outFields=propid,address&returnGeometry=true&outSR=4326&f=json');
    var addrMatches = (addrRes && addrRes.features) || [];
    // unique exact address match
    var uniqByProp = addrMatches.filter(function (f, i, arr) {
      var pid = f.attributes.propid;
      return arr.findIndex(function (x) { return x.attributes.propid === pid; }) === i;
    });
    if (uniqByProp.length === 1) {
      var ap = uniqByProp[0];
      // cross-check: geocode point inside the address-matched polygon, or NEAR it (<=30m).
      // The address match is authoritative (exact number+street+suburb -> unique propid); an
      // interpolated geocode often lands ~10-20m away on the road or an adjacent parcel. "Near"
      // confirms agreement without demanding strict containment. A FAR point means real disagreement.
      var inside = pointInRings(lat, lon, ap.geometry.rings);
      // Phase 4 near+suburb-guard: accept when point is inside OR within 30m, BUT only if the
      // geocoded suburb equals the address-matched property's suburb (kills the Newcastle->Stockton
      // relocation class). suburbGuard fails closed when either suburb is unknown.
      var near = inside || (isFinite(lat) && isFinite(lon) && ringDistanceMetres(lat, lon, ap.geometry.rings) <= 30);
      var gSub = suburbOf(userAddr), pSub = suburbOf(ap.attributes.address);
      var suburbOk = gSub && pSub && (gSub === pSub);
      var apoly = enc({ rings: ap.geometry.rings, spatialReference: { wkid: 4326 } });
      var apLotRes = await fetchJson(LOT_URL + '?geometry=' + apoly + '&geometryType=esriGeometryPolygon&inSR=4326&spatialRel=esriSpatialRelContains&outFields=lotnumber,sectionnumber,planlabel,planlotarea,shape_Area,hasstratum&returnGeometry=false&f=json');
      var apLots = (apLotRes && apLotRes.features) || [];
      var accept = (inside || near) && suburbOk;
      var resA = buildResolved(ap, apLots, accept, enteredArea, false);
      if (isFinite(lat) && isFinite(lon) && !accept) {
        if (resA.confidence === 'verified' || resA.confidence === 'estimated') resA.confidence = 'needs_review';
      }
      resA.resolvedBy = 'address';
      return { statusCode: 200, headers: CORS, body: JSON.stringify(resA) };
    }
  }

  // PART A fallback / Phase 2: point-in-property method.
  // 1) properties at point + a small buffer (for geocode drift), both on Urban_Property.
  var ptGeom = enc({ x: lon, y: lat, spatialReference: { wkid: 4326 } });
  var atPointRes = await fetchJson(PROPERTY_URL + '?geometry=' + ptGeom + '&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=propid,address&returnGeometry=false&f=json');
  var atPoint = (atPointRes && atPointRes.features) || [];

  var inBuffer = [];
  if (atPoint.length === 0) {
    var bufRes = await fetchJson(PROPERTY_URL + '?geometry=' + ptGeom + '&geometryType=esriGeometryPoint&inSR=4326&distance=12&units=esriSRUnit_Meter&spatialRel=esriSpatialRelIntersects&outFields=propid,address&returnGeometry=false&f=json');
    inBuffer = (bufRes && bufRes.features) || [];
  }

  var sel = selectProperty(atPoint, inBuffer, inputAddr);

  if (sel.strata) {
    return { statusCode: 200, headers: CORS, body: JSON.stringify(buildResolved(null, [], false, enteredArea, true)) };
  }
  if (!sel.property) {
    // fail safe — do not guess a lot
    return { statusCode: 200, headers: CORS, body: JSON.stringify(buildResolved(null, [], false, enteredArea, false)) };
  }

  // 2) fetch the selected property's polygon (by propid), then lots contained by it.
  var propid = sel.property.attributes.propid;
  var propGeomRes = await fetchJson(PROPERTY_URL + '?where=propid=' + encodeURIComponent(propid) + '&outFields=propid,address&returnGeometry=true&outSR=4326&f=json');
  var propFeat = (propGeomRes && propGeomRes.features && propGeomRes.features[0]) || null;
  if (!propFeat || !propFeat.geometry || !propFeat.geometry.rings) {
    return { statusCode: 200, headers: CORS, body: JSON.stringify(buildResolved(null, [], false, enteredArea, false)) };
  }
  var polyGeom = enc({ rings: propFeat.geometry.rings, spatialReference: { wkid: 4326 } });
  var lotRes = await fetchJson(LOT_URL + '?geometry=' + polyGeom + '&geometryType=esriGeometryPolygon&inSR=4326&spatialRel=esriSpatialRelContains&outFields=lotnumber,sectionnumber,planlabel,planlotarea,shape_Area,hasstratum&returnGeometry=false&f=json');
  var lots = (lotRes && lotRes.features) || [];

  var resolved = buildResolved(propFeat, lots, sel.pointInside, enteredArea, false);
  return { statusCode: 200, headers: CORS, body: JSON.stringify(resolved) };
};

exports._test = { lotIdentity, sumLotArea, decideConfidence, areaConflict, buildResolved, streetName, streetsMatch, streetNumber, addressMatches, isStrataAddress, selectProperty, normaliseForDcs, dcsAddressWhere, pointInRings, ringDistanceMetres, suburbOf };
