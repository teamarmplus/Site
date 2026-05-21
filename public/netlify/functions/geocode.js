// SiteVerdict — server-side geocode function
// Tries Google Geocoding API first (if GOOGLE_MAPS_API_KEY set), then Nominatim fallback
// Never exposes API keys to the frontend

exports.handler = async function(event) {
  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' };
  }

  const rawAddr = (event.queryStringParameters || {}).address || '';
  const addr    = normaliseInput(rawAddr);
  if (!addr || addr.trim().length < 5) {
    return {
      statusCode: 400,
      headers: CORS,
      body: JSON.stringify({ error: 'Address required', found: false })
    };
  }

  const cleaned = cleanAddress(addr.trim());
  const parts   = parseAddressParts(cleaned);
  const suburb  = extractSuburbPostcode(addr);

  // NSW bounding box — tightened upper bound to exclude QLD border ambiguity
  const NSW_BBOX = { latMin: -37.6, latMax: -28.5, lonMin: 140.9, lonMax: 153.7 };

  function inNSW(lat, lon) {
    return lat >= NSW_BBOX.latMin && lat <= NSW_BBOX.latMax
        && lon >= NSW_BBOX.lonMin && lon <= NSW_BBOX.lonMax;
  }

  // ── Strategy 1: Google Geocoding API ───────────────────────────
  const googleKey = process.env.GOOGLE_MAPS_API_KEY;
  if (googleKey) {
    try {
      const gUrl = 'https://maps.googleapis.com/maps/api/geocode/json'
        + '?address=' + encodeURIComponent(addr + ' NSW Australia')
        + '&components=country:AU|administrative_area:NSW'
        + '&key=' + googleKey;
      const gRes  = await fetch(gUrl);
      const gData = await gRes.json();
      if (gData.status === 'OK' && gData.results && gData.results.length) {
        const hit = gData.results[0];
        const loc = hit.geometry.location;
        if (inNSW(loc.lat, loc.lng)) {
          const postcode = extractPostcodeFromGoogleResult(hit);
          const council  = extractCouncilFromGoogleResult(hit);
          return {
            statusCode: 200,
            headers: CORS,
            body: JSON.stringify({
              found:        true,
              lat:          loc.lat,
              lon:          loc.lng,
              source:       'Google Geocoding API',
              confidence:   'Verified',
              matchedAddr:  hit.formatted_address,
              locationType: hit.geometry.location_type || '',
              placeId:      hit.place_id || '',
              paidApiUsed:  true,
              postcode,
              council
            })
          };
        }
      }
    } catch (e) {
      console.error('Google geocode failed:', e.message);
    }
  }

  // ── Nominatim fallback strategies ──────────────────────────────
  const nom = 'https://nominatim.openstreetmap.org/search?format=json&limit=3&accept-language=en';
  const UA  = { 'User-Agent': 'SiteVerdict/1.0 (siteverdict.com.au)' };

  // ── Lot address: try suburb-only geocoding (Lot# is not a house number) ──
  const _isLotAddr = /^(lot|proposed\s+lot)\s+\d+/i.test(addr.trim());
  if (_isLotAddr) {
    const lotSuburb = suburb ? suburb + ' NSW Australia' : null;
    if (lotSuburb) {
      try {
        const lotUrl = nom + '&q=' + enc(lotSuburb);
        const lotRes = await fetch(lotUrl, { headers: UA });
        const lotHits = await lotRes.json();
        if (lotHits && lotHits.length) {
          const h = lotHits[0];
          const lat = parseFloat(h.lat), lon = parseFloat(h.lon);
          if (inNSW(lat, lon)) {
            return {
              statusCode: 200,
              headers: CORS,
              body: JSON.stringify({
                found:        true,
                lat,
                lon,
                source:       'Nominatim (Lot suburb fallback)',
                confidence:   'Needs review',
                matchedAddr:  h.display_name,
                locationType: 'APPROXIMATE',
                paidApiUsed:  false,
                isLotAddress: true,
                lotWarning:   'Lot-based address: geocode placed at suburb centre. Parcel and zone data may not match the specific Lot. Verify via NSW Land Registry.'
              })
            };
          }
        }
      } catch (e) { console.warn('Lot suburb geocode failed:', e.message); }
    }
  }

  const strategies = [
    // 1. Exact with NSW forced
    { url: nom + '&q=' + enc(addr + ' NSW Australia'), label: 'Exact+NSW', conf: 'Verified' },
    // 2. Cleaned (abbreviations expanded) + NSW
    cleaned !== addr
      ? { url: nom + '&q=' + enc(cleaned + ' NSW Australia'), label: 'Cleaned+NSW', conf: 'Verified' }
      : null,
    // 3. Nominatim structured parameters (street / city / postcode)
    parts
      ? { url: nom
          + '&street=' + enc(parts.number + ' ' + parts.street)
          + '&city=' + enc(parts.suburb)
          + (parts.postcode ? '&postalcode=' + enc(parts.postcode) : '')
          + '&country=AU',
          label: 'Structured', conf: 'Verified' }
      : null,
    // 4. countrycodes=au
    { url: nom + '&q=' + enc(addr) + '&countrycodes=au', label: 'Exact (au)', conf: 'Verified' },
    // 5. Street name + suburb (no house number) — catches unmapped house numbers
    parts
      ? { url: nom + '&q=' + enc(parts.street + ', ' + parts.suburb + ' NSW ' + parts.postcode + ' Australia'),
          label: 'Street name', conf: 'Estimated' }
      : null,
    // 6. Suburb / postcode fallback
    suburb
      ? { url: nom + '&q=' + enc(suburb + ' NSW Australia'), label: 'Suburb fallback', conf: 'Estimated' }
      : null,
  ].filter(Boolean);

  for (const s of strategies) {
    try {
      const res  = await fetch(s.url, { headers: UA });
      const hits = await res.json();
      if (hits && hits.length) {
        for (const hit of hits) {
          const lat = parseFloat(hit.lat);
          const lon = parseFloat(hit.lon);
          if (inNSW(lat, lon)) {
            return {
              statusCode: 200,
              headers: CORS,
              body: JSON.stringify({
                found:       true,
                lat,
                lon,
                source:      'Nominatim (' + s.label + ')',
                confidence:  s.conf,
                matchedAddr: hit.display_name,
                postcode:    hit.address ? hit.address.postcode : '',
                council:     ''
              })
            };
          }
        }
      }
    } catch (e) {
      console.warn('Nominatim strategy failed (' + s.label + '):', e.message);
    }
  }

  // Not found
  return {
    statusCode: 200,
    headers: CORS,
    body: JSON.stringify({ found: false, attempted: addr })
  };
};

// ── Helpers ─────────────────────────────────────────────────────

function enc(s) { return encodeURIComponent(s); }

// ── Input normaliser ───────────────────────────────────────────
// Tolerates: lowercase, missing NSW, missing space before postcode,
// partial suburb name typos, extra commas, inconsistent capitalisation.
function normaliseInput(s) {
  if (!s) return s;
  s = s.trim();
  // Add space before trailing 4-digit postcode if missing (e.g. "Heights2166" → "Heights 2166")
  s = s.replace(/([A-Za-z])(\d{4})$/, '$1 $2');
  // Normalise multiple spaces/commas
  s = s.replace(/,{2,}/g, ',').replace(/\s{2,}/g, ' ');
  // Ensure NSW is present — add if missing and looks like an AU address
  if (!/NSW/i.test(s) && /\d{4}/.test(s)) {
    // Replace bare postcode with NSW POSTCODE
    s = s.replace(/(\d{4})(?!\s*$)/, 'NSW $1');
  }
  if (!/NSW/i.test(s) && !/VIC|QLD|SA|WA|TAS|NT|ACT/i.test(s)) {
    // Append NSW if no state at all
    if (!/Australia/i.test(s)) s = s + ' NSW';
  }
  // Title-case each word (helps geocoder match suburb names)
  s = s.replace(/\w/g, function(c){ return c.toUpperCase(); });
  // Re-standardise NSW casing after title-case
  s = s.replace(/Nsw/, 'NSW');
  return s.trim();
}


function cleanAddress(s) {
  // Preserve Lot addresses — Lot 109 ≠ house number 109
  const _isLot = /^(lot|proposed\s+lot)\s+\d+/i.test(s.trim());
  if (!_isLot) {
    // Remove unit prefix (not lot)
    s = s.replace(/^(unit|apt|apartment|flat|shop|suite|level|u)\s*[\d\w]+[\/\-]\s*/i, '');
    s = s.replace(/^\w{0,3}\d+\//i, '');
    // Range → first number
    s = s.replace(/^(\d+)-\d+\s/, '$1 ');
  }
  // Expand street type abbreviations
  const abbr = [
    [/\bSt\b(?!\s+[A-Z]{2,})/g, 'Street'], [/\bAve\b/g, 'Avenue'],
    [/\bRd\b/g, 'Road'], [/\bDr\b/g, 'Drive'], [/\bCr\b/g, 'Crescent'],
    [/\bCres\b/g, 'Crescent'], [/\bPde\b/g, 'Parade'], [/\bCl\b/g, 'Close'],
    [/\bPl\b/g, 'Place'], [/\bCt\b/g, 'Court'], [/\bHwy\b/g, 'Highway'],
    [/\bLn\b/g, 'Lane'], [/\bBvd\b/g, 'Boulevard'], [/\bTce\b/g, 'Terrace'],
    [/\bBvde\b/g, 'Boulevard'],
  ];
  for (const [pat, rep] of abbr) s = s.replace(pat, rep);
  return s.replace(/\s{2,}/g, ' ').trim();
}

function parseAddressParts(s) {
  // Match: NUMBER STREET_NAME, SUBURB NSW POSTCODE
  const m = s.match(/^(\d+)\s+(.+?),\s*([A-Za-z][A-Za-z\s]+?)(?:\s+NSW)?\s*(\d{4})?\s*$/i)
    || s.match(/^(\d+)\s+(.+?)\s{1,}([A-Za-z][A-Za-z\s]+?)(?:\s+NSW)?\s*(\d{4})?\s*$/i);
  if (!m) return null;
  return { number: m[1], street: m[2].trim(), suburb: m[3].trim(), postcode: m[4] || '' };
}

function extractSuburbPostcode(addr) {
  const m = addr.match(/,\s*([A-Za-z][A-Za-z\s]+NSW\s*\d{0,4})/i)
    || addr.match(/([A-Za-z][A-Za-z\s]+NSW\s*\d{4})/i);
  if (m) return m[1].trim();
  const m2 = addr.match(/,\s*([A-Za-z][A-Za-z\s]+?)\s*(?:NSW|\d{4}|$)/i);
  return m2 ? m2[1].trim() + ' NSW' : null;
}

function extractPostcodeFromGoogleResult(hit) {
  const pc = (hit.address_components || [])
    .find(c => c.types.includes('postal_code'));
  return pc ? pc.long_name : '';
}

function extractCouncilFromGoogleResult(hit) {
  const council = (hit.address_components || [])
    .find(c => c.types.includes('administrative_area_level_2'));
  return council ? council.long_name : '';
}
