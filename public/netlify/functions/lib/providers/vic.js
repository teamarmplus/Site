/**
 * SiteVerdict — Victoria provider (prepared, not yet live)
 *
 * Data sources:
 * - Vicmap Property via DataVic WFS (open, no key required)
 * - VicPlan / SPEAR REST (DELWP, open, registration recommended)
 *
 * Status: PREPARED — live: false
 * Activate by setting vic.live = true in data-source-registry.js
 * and testing the WFS + SPEAR endpoints against real VIC coordinates.
 *
 * No API keys required. No commercial data.
 * All calls are server-side only.
 */

'use strict';

const TIMEOUT_MS = 8000;

function safeJson(text) {
  try { return JSON.parse(text); } catch { return null; }
}

async function fetchWithTimeout(url, opts, ms) {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { ...opts, signal: ctrl.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Query Victorian Planning zones via SPEAR ArcGIS REST service.
 * Endpoint is public. Registration recommended for production use.
 * Ref: https://services2.land.vic.gov.au/gis/rest/services/SPEAR/
 *
 * NOTE: This endpoint URL may change. Verify before activating.
 */
async function queryVicPlanning(lat, lon) {
  // SPEAR MapServer — zone layer (layer 0 is indicative; confirm correct layer id before use)
  const base = 'https://services2.land.vic.gov.au/gis/rest/services/SPEAR/MapServer/0/query';
  const geometry = encodeURIComponent(JSON.stringify({ x: lon, y: lat, spatialReference: { wkid: 4326 } }));
  const url = `${base}?geometry=${geometry}&geometryType=esriGeometryPoint`
    + `&spatialRel=esriSpatialRelIntersects&outFields=ZONE_CODE,ZONE_NAME`
    + `&returnGeometry=false&f=json`;
  try {
    const res  = await fetchWithTimeout(url, {}, TIMEOUT_MS);
    const text = await res.text();
    const data = safeJson(text);
    return data && data.features && data.features.length ? data.features[0].attributes : null;
  } catch { return null; }
}

/**
 * Run VIC provider.
 * Currently returns a "prepared but not yet live" result.
 * Remove the early return below when endpoints are verified and live: true.
 */
async function run(geocodeResult) {
  // ── NOT YET LIVE — remove this block when activating ─────────
  return {
    provider_name:      'Victoria (Vicmap / VicPlan)',
    jurisdiction:       'VIC',
    source_type:        'official_open_data',
    confidence:         'Low',
    screening_label:    'Basic National Screening',
    checked_fields:     ['address', 'geocode_confidence'],
    unavailable_fields: ['zone', 'min_lot_size', 'overlays', 'parcel_area'],
    result: {
      address_found:        geocodeResult ? geocodeResult.found === true : false,
      matched_address:      geocodeResult ? (geocodeResult.matchedAddr || null) : null,
      geocode_confidence:   geocodeResult ? (geocodeResult.confidence || 'Unknown') : 'Unknown',
      jurisdiction_detected: 'VIC',
      planning_data:        null,
    },
    warnings: [
      'Victoria planning data integration is in preparation. Basic address check only.',
      'Zone, overlays and parcel data are not yet available for VIC addresses.',
      'Preliminary screening signal only. Professional verification required.',
      'Some controls are not yet fully modelled.',
    ],
    raw_summary: { note: 'VIC provider prepared but not yet live.' },
    not_integrated: true,
  };
  // ── END NOT YET LIVE ─────────────────────────────────────────

  /* eslint-disable no-unreachable */
  if (!geocodeResult || geocodeResult.found !== true) {
    return {
      provider_name:      'Victoria (Vicmap / VicPlan)',
      jurisdiction:       'VIC',
      source_type:        'official_open_data',
      confidence:         'Low',
      screening_label:    'Basic National Screening',
      checked_fields:     ['address'],
      unavailable_fields: ['zone','min_lot_size','overlays','parcel_area'],
      result:             { address_found: false },
      warnings:           ['Address could not be geocoded. No VIC planning data available.',
                           'Preliminary screening signal only. Professional verification required.'],
      raw_summary:        { note: 'Geocode failed — VIC provider aborted.' },
    };
  }

  const planning = await queryVicPlanning(geocodeResult.lat, geocodeResult.lon);
  const zoneCode = planning ? planning.ZONE_CODE : null;
  const zoneName = planning ? planning.ZONE_NAME : null;
  const confidence = (geocodeResult.confidence === 'Verified' && zoneCode) ? 'Medium' : 'Low';

  return {
    provider_name:      'Victoria (Vicmap / VicPlan)',
    jurisdiction:       'VIC',
    source_type:        'official_open_data',
    confidence,
    screening_label:    'Basic National Screening',
    checked_fields:     ['address', 'geocode_confidence', zoneCode ? 'zone' : null].filter(Boolean),
    unavailable_fields: [!zoneCode ? 'zone' : null, 'min_lot_size','overlays','parcel_area'].filter(Boolean),
    result: {
      address_found:        true,
      matched_address:      geocodeResult.matchedAddr || null,
      geocode_confidence:   geocodeResult.confidence  || 'Unknown',
      jurisdiction_detected: 'VIC',
      planning_data:        { zone_code: zoneCode, zone_name: zoneName },
    },
    warnings: [
      !zoneCode ? 'Zone not returned from VicPlan layer — verify directly.' : null,
      'Min lot size and overlay data not yet modelled for VIC.',
      'Preliminary screening signal only. Professional verification required.',
      'Some controls are not yet fully modelled.',
    ].filter(Boolean),
    raw_summary:  { zone_code: zoneCode, zone_name: zoneName },
    not_integrated: false,
  };
  /* eslint-enable no-unreachable */
}

module.exports = { run };
