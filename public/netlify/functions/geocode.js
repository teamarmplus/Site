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

  const addr = (event.queryStringParameters || {}).address || '';
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

  const nom = 'https://nominatim.openstreetmap.org/search?format=json&limit=3&accept-language=en';
  const UA  = { 'User-Agent': 'SiteVerdict/1.0 (siteverdict.com.au)' };
  const isLotAddr = /^(lot|proposed\s+lot)\s+\d+/i.test(addr.trim());
  const addressForGoogle = isLotAddr ? lotGeocodeQuery(addr, suburb) : addr;

  // ── Strategy 1: Google Geocoding API ───────────────────────────
  const googleKey = process.env.GOOGLE_MAPS_API_KEY;
  if (googleKey) {
    try {
      const gUrl = 'https://maps.googleapis.com/maps/api/geocode/json'
        + '?address=' + encodeURIComponent(addressForGoogle + ' NSW Australia')
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
              confidence:   isLotAddr ? 'Needs review' : 'Verified',
              matchedAddr:  hit.formatted_address,
              locationType: hit.geometry.location_type || '',
              placeId:      hit.place_id || '',
              paidApiUsed:  true,
              isLotAddress: isLotAddr,
              lotWarning: isLotAddr ? 'Lot-based address: Google matched the street/suburb, not a verified lot parcel. Verify lot/DP via NSW Land Registry or cadastre.' : '',
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

  // ── Lot address: try suburb-only geocoding (Lot# is not a house number) ──
  if (isLotAddr) {
    // For Lot addresses, geocode by suburb/postcode only — more honest than treating Lot# as house#
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

    // ── Nominatim fallback strategies ──────────────────────────────
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
  const streetWords = /\b(street|st|road|rd|avenue|ave|drive|dr|close|cl|place|pl|court|ct|crescent|cres|boulevard|bvd|parade|pde|lane|ln|highway|hwy)\b/i;
  // Best case: last locality before NSW/postcode, with or without a comma before NSW.
  const tail = addr.match(/,\s*([A-Za-z][A-Za-z\s'\-]+?)\s*,?\s*NSW\s*(\d{4})?\s*$/i);
  if (tail && !streetWords.test(tail[1])) return tail[1].trim() + ' NSW' + (tail[2] ? ' ' + tail[2] : '');
  // Partial input such as "Austral NSW 2179".
  const simple = addr.trim().match(/^([A-Za-z][A-Za-z\s'\-]+?)\s+NSW\s*(\d{4})?\s*$/i);
  if (simple && !streetWords.test(simple[1])) return simple[1].trim() + ' NSW' + (simple[2] ? ' ' + simple[2] : '');
  const m = addr.match(/,\s*([A-Za-z][A-Za-z\s]+NSW\s*\d{0,4})/i)
    || addr.match(/([A-Za-z][A-Za-z\s]+NSW\s*\d{4})/i);
  if (m) return m[1].trim();
  const m2 = addr.match(/,\s*([A-Za-z][A-Za-z\s]+?)\s*(?:NSW|\d{4}|$)/i);
  return m2 && !streetWords.test(m2[1]) ? m2[1].trim() + ' NSW' : null;
}

function lotGeocodeQuery(addr, suburbHint) {
  // Lot 109 is not house number 109. Remove the lot token and geocode the street/locality only.
  const stripped = addr.replace(/^(lot|proposed\s+lot)\s+\d+[A-Za-z]?\s*(?:dp\s*\d+)?\s*,?\s*/i, '').trim();
  return stripped || suburbHint || addr;
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
