// SiteVerdict — server-side geocode function
// Tries Google Geocoding API first (if GOOGLE_MAPS_API_KEY set), then Nominatim fallback
// Never exposes API keys to the frontend
// addressQuality field: exact | interpolated | approximate | suburb_only | route_only | failed

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
      body: JSON.stringify({ error: 'Address required', found: false, addressQuality: 'failed' })
    };
  }

  const cleaned = cleanAddress(addr.trim());
  const parts   = parseAddressParts(cleaned);
  const suburb  = extractSuburbPostcode(addr);

  // NSW bounding box
  const NSW_BBOX = { latMin: -37.6, latMax: -28.5, lonMin: 140.9, lonMax: 153.7 };
  function inNSW(lat, lon) {
    return lat >= NSW_BBOX.latMin && lat <= NSW_BBOX.latMax
        && lon >= NSW_BBOX.lonMin && lon <= NSW_BBOX.lonMax;
  }

  // ── Address type detection ──────────────────────────────────
  const _isLotAddr   = /^(lot|proposed\s+lot)\s+\d+/i.test(addr.trim());
  const _isRangeAddr = /^\d+\s*-\s*\d+\s+/i.test(addr.trim());
  const _hasStreetNum= /^\d+/.test(addr.trim()) || _isLotAddr;
  const _inputPc     = (addr.match(/\b(\d{4})\b/) || [])[1] || null;

  // ── Strategy 1: Google Geocoding API ───────────────────────
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
        const hit  = gData.results[0];
        const loc  = hit.geometry.location;
        const lType = hit.geometry.location_type || '';
        const isPartial = !!(hit.partial_match);

        if (inNSW(loc.lat, loc.lng)) {
          // ── Google validation gate ──────────────────────────
          // Reject suburb/route-only matches for normal street addresses
          const addressTypes = hit.types || [];
          const isSuburbOnly = addressTypes.some(t => ['locality','sublocality','postal_code',
            'administrative_area_level_1','administrative_area_level_2','country'].includes(t))
            && !addressTypes.includes('street_address')
            && !addressTypes.includes('premise')
            && !addressTypes.includes('route');
          const isRouteOnly  = addressTypes.includes('route')
            && !addressTypes.includes('street_address')
            && !addressTypes.includes('premise');

          // For normal addresses with a street number, require ROOFTOP or RANGE_INTERPOLATED
          const isGeomCentre = lType === 'GEOMETRIC_CENTER' || lType === 'APPROXIMATE';

          if (isSuburbOnly) {
            // Suburb/postcode-only result — not useful for street address
            if (!_isLotAddr) {
              return {
                statusCode: 200, headers: CORS,
                body: JSON.stringify({
                  found: false,
                  reason: 'Address could not be confidently matched — Google returned suburb/postcode only.',
                  attempted: addr, addressQuality: 'suburb_only'
                })
              };
            }
          }

          if (isRouteOnly && !_isLotAddr) {
            return {
              statusCode: 200, headers: CORS,
              body: JSON.stringify({
                found: false,
                reason: 'Address could not be confidently matched — Google matched street name only.',
                attempted: addr, addressQuality: 'route_only'
              })
            };
          }

          // For normal addresses with street number: reject GEOMETRIC_CENTER/APPROXIMATE
          // unless it's a lot or range address (those are legitimately imprecise)
          if (_hasStreetNum && !_isLotAddr && isGeomCentre && isPartial) {
            return {
              statusCode: 200, headers: CORS,
              body: JSON.stringify({
                found: false,
                reason: 'Address could not be confidently matched — approximate result only.',
                attempted: addr, addressQuality: 'approximate'
              })
            };
          }

          // Postcode sanity check: if input had a postcode, Google result must match it
          const googlePc = extractPostcodeFromGoogleResult(hit);
          if (_inputPc && googlePc && googlePc !== _inputPc) {
            // Postcode mismatch — likely wrong suburb or fake postcode
            return {
              statusCode: 200, headers: CORS,
              body: JSON.stringify({
                found: false,
                reason: 'Postcode in address does not match Google result — please verify address.',
                attempted: addr, addressQuality: 'failed'
              })
            };
          }

          // Determine addressQuality from locationType
          let addressQuality = 'approximate';
          if (lType === 'ROOFTOP') addressQuality = 'exact';
          else if (lType === 'RANGE_INTERPOLATED') addressQuality = 'interpolated';
          else if (isRouteOnly) addressQuality = 'route_only';
          else if (isSuburbOnly) addressQuality = 'suburb_only';

          const postcode = googlePc;
          const council  = extractCouncilFromGoogleResult(hit);
          // Downgrade confidence for range and lot addresses
          // regardless of Google locationType (ROOFTOP on first number != full parcel)
          let googleConf = (lType === 'ROOFTOP' || lType === 'RANGE_INTERPOLATED') ? 'Verified' : 'Needs review';
          if (_isRangeAddr) googleConf = 'Estimated';
          if (_isLotAddr)   googleConf = 'Needs review';

          const lotWarning = _isLotAddr
            ? 'Lot-based address detected. Lot number is not a street number. Verify lot/DP/title details before relying on parcel, zoning or planning conclusions.'
            : null;

          return {
            statusCode: 200,
            headers: CORS,
            body: JSON.stringify({
              found:        true,
              lat:          loc.lat,
              lon:          loc.lng,
              source:       'Google Geocoding API',
              confidence:   googleConf,
              matchedAddr:  hit.formatted_address,
              locationType: lType,
              placeId:      hit.place_id || '',
              paidApiUsed:  true,
              addressQuality,
              postcode,
              council,
              lotWarning,
              isLotAddress: _isLotAddr
            })
          };
        }
      }
    } catch (e) {
      console.error('Google geocode failed:', e.message);
    }
  }

  // ── Nominatim fallback ───────────────────────────────────────
  // Nominatim is only used for:
  // 1. Lot-based addresses (suburb-only geocode — clearly labelled)
  // 2. Real addresses Google didn't match (house + street + suburb must all appear in result)
  // Nominatim must NOT turn fake addresses into usable results.

  const nom = 'https://nominatim.openstreetmap.org/search?format=json&limit=3&accept-language=en';
  const UA  = { 'User-Agent': 'SiteVerdict/1.0 (siteverdict.com.au)' };

  // Lot address: suburb-only geocode, clearly marked as Needs review
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
              statusCode: 200, headers: CORS,
              body: JSON.stringify({
                found:        true,
                lat, lon,
                source:       'Nominatim (Lot suburb fallback)',
                confidence:   'Needs review',
                matchedAddr:  h.display_name,
                locationType: 'APPROXIMATE',
                paidApiUsed:  false,
                addressQuality: 'suburb_only',
                isLotAddress: true,
                lotWarning:   'Lot-based address: geocode placed at suburb centre. Parcel and zone data may not match the specific Lot. Verify via NSW Land Registry.'
              })
            };
          }
        }
      } catch (e) { console.warn('Lot suburb geocode failed:', e.message); }
    }
  }

  // For normal addresses: Nominatim must match street + suburb
  // Only use structured search (street number + street name + suburb) — not suburb-fallback
  if (parts && !_isLotAddr) {
    const nomStrategies = [
      // 1. Exact structured
      { url: nom
          + '&street=' + enc(parts.number + ' ' + parts.street)
          + '&city=' + enc(parts.suburb)
          + (parts.postcode ? '&postalcode=' + enc(parts.postcode) : '')
          + '&country=AU',
        label: 'Structured', conf: 'Estimated' },
      // 2. Cleaned full address + NSW
      { url: nom + '&q=' + enc(cleaned + ' NSW Australia'), label: 'Cleaned+NSW', conf: 'Estimated' },
      // 3. Range: first number + street + suburb
      _isRangeAddr ? { url: nom + '&q=' + enc(addr.replace(/^(\d+)-\d+\s/, '$1 ') + ' NSW Australia'), label: 'Range first', conf: 'Estimated' } : null,
    ].filter(Boolean);

    for (const s of nomStrategies) {
      try {
        const res  = await fetch(s.url, { headers: UA });
        const hits = await res.json();
        if (hits && hits.length) {
          for (const hit of hits) {
            const lat = parseFloat(hit.lat);
            const lon = parseFloat(hit.lon);
            if (!inNSW(lat, lon)) continue;

            // Validation: display_name must contain the street name from input
            const dispLower = (hit.display_name || '').toLowerCase();
            const streetLower = parts.street.toLowerCase();
            const streetWords = streetLower.split(/\s+/).filter(w => w.length > 3);
            const streetMatch = streetWords.length === 0 || streetWords.some(w => dispLower.includes(w));

            // Postcode check: if input had postcode and result has one, they must match
            const resultPc = hit.address ? hit.address.postcode : null;
            const pcOk = !_inputPc || !resultPc || _inputPc === resultPc;

            if (!streetMatch || !pcOk) continue; // reject non-matching result

            return {
              statusCode: 200, headers: CORS,
              body: JSON.stringify({
                found:       true,
                lat, lon,
                source:      'Nominatim (' + s.label + ')',
                confidence:  s.conf,
                matchedAddr: hit.display_name,
                addressQuality: 'interpolated',
                postcode:    resultPc || '',
                council:     ''
              })
            };
          }
        }
      } catch (e) {
        console.warn('Nominatim strategy failed (' + s.label + '):', e.message);
      }
    }
  }

  // Not found — all strategies exhausted
  return {
    statusCode: 200,
    headers: CORS,
    body: JSON.stringify({
      found: false,
      reason: 'Address could not be confidently matched. Check address and try again.',
      attempted: addr,
      addressQuality: 'failed'
    })
  };
};

// ── Helpers ─────────────────────────────────────────────────────

function enc(s) { return encodeURIComponent(s); }

function normaliseInput(s) {
  if (!s) return s;
  s = s.trim();
  s = s.replace(/([A-Za-z])(\d{4})$/, '$1 $2');
  s = s.replace(/,{2,}/g, ',').replace(/\s{2,}/g, ' ');
  if (!/\bNSW\b/i.test(s) && /\d{4}/.test(s)) {
    s = s.replace(/\b(\d{4})\b(?!\s*$)/, 'NSW $1');
  }
  if (!/\bNSW\b/i.test(s) && !/VIC|QLD|SA|WA|TAS|NT|ACT/i.test(s)) {
    if (!/\bAustralia\b/i.test(s)) s = s + ' NSW';
  }
  s = s.replace(/\b\w/g, function(c){ return c.toUpperCase(); });
  s = s.replace(/\bNsw\b/, 'NSW');
  return s.trim();
}

function cleanAddress(s) {
  const _isLot = /^(lot|proposed\s+lot)\s+\d+/i.test(s.trim());
  if (!_isLot) {
    s = s.replace(/^(unit|apt|apartment|flat|shop|suite|level|u)\s*[\d\w]+[\/\-]\s*/i, '');
    s = s.replace(/^\w{0,3}\d+\//i, '');
    s = s.replace(/^(\d+)-\d+\s/, '$1 ');
  }
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
