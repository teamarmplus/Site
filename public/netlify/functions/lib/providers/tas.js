/**
 * SiteVerdict — Tasmania provider (prepared, not yet live)
 *
 * Data source:
 * - TAS LIST ArcGIS REST public services
 *   https://services.thelist.tas.gov.au/arcgis/rest/services
 *
 * Status: PREPARED — live: false
 * No API key required. Public ArcGIS REST services.
 * Review terms at: https://www.thelist.tas.gov.au/app/content/metadata/termsOfAccess
 *
 * LIST = Land Information System Tasmania (DPIPWE).
 * Relevant services include:
 *   - PropertyAndCadastre/MapServer  (parcel, lot)
 *   - Planning/MapServer             (zone, overlays) — confirm availability
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
 * Query TAS LIST property/cadastre layer.
 * Layer IDs and field names need verification before activating.
 * Ref: https://services.thelist.tas.gov.au/arcgis/rest/services/Public/
 */
async function queryTASCadastre(lat, lon) {
  const base = 'https://services.thelist.tas.gov.au/arcgis/rest/services/Public/PropertyAndCadastre/MapServer/0/query';
  const geometry = encodeURIComponent(JSON.stringify({ x: lon, y: lat, spatialReference: { wkid: 4326 } }));
  const url = `${base}?geometry=${geometry}&geometryType=esriGeometryPoint`
    + `&spatialRel=esriSpatialRelIntersects&outFields=PID,PROP_ID,POLY_AREA`
    + `&returnGeometry=false&f=json`;
  try {
    const res  = await fetchWithTimeout(url, {}, TIMEOUT_MS);
    const text = await res.text();
    const data = safeJson(text);
    return data && data.features && data.features.length ? data.features[0].attributes : null;
  } catch { return null; }
}

async function run(geocodeResult) {
  // ── NOT YET LIVE ─────────────────────────────────────────────
  return {
    provider_name:      'Tasmania (LIST ArcGIS REST)',
    jurisdiction:       'TAS',
    source_type:        'official_open_data',
    confidence:         'Low',
    screening_label:    'Basic National Screening',
    checked_fields:     ['address', 'geocode_confidence'],
    unavailable_fields: ['zone', 'parcel_area', 'overlays', 'lot_id'],
    result: {
      address_found:        geocodeResult ? geocodeResult.found === true : false,
      matched_address:      geocodeResult ? (geocodeResult.matchedAddr || null) : null,
      geocode_confidence:   geocodeResult ? (geocodeResult.confidence || 'Unknown') : 'Unknown',
      jurisdiction_detected: 'TAS',
      planning_data:        null,
    },
    warnings: [
      'Tasmania planning data integration is in preparation. Basic address check only.',
      'Zone, parcel and overlay data are not yet available for TAS addresses.',
      'Preliminary screening signal only. Professional verification required.',
      'Some controls are not yet fully modelled.',
    ],
    raw_summary: { note: 'TAS provider prepared but not yet live.' },
    not_integrated: true,
  };
  // ── END NOT YET LIVE ─────────────────────────────────────────

  /* eslint-disable no-unreachable */
  if (!geocodeResult || geocodeResult.found !== true) {
    return {
      provider_name: 'Tasmania (LIST ArcGIS REST)', jurisdiction: 'TAS',
      source_type: 'official_open_data', confidence: 'Low',
      screening_label: 'Basic National Screening',
      checked_fields: ['address'], unavailable_fields: ['zone','parcel_area','overlays'],
      result: { address_found: false },
      warnings: ['Address could not be geocoded.','Preliminary screening signal only.'],
      raw_summary: { note: 'Geocode failed — TAS provider aborted.' },
    };
  }
  const cad = await queryTASCadastre(geocodeResult.lat, geocodeResult.lon);
  const pid  = cad ? cad.PID     : null;
  const area = cad ? cad.POLY_AREA : null;
  const confidence = (geocodeResult.confidence === 'Verified' && area) ? 'Medium' : 'Low';
  return {
    provider_name: 'Tasmania (LIST ArcGIS REST)', jurisdiction: 'TAS',
    source_type: 'official_open_data', confidence,
    screening_label: 'Basic National Screening',
    checked_fields: ['address','geocode_confidence', area ? 'parcel_area' : null].filter(Boolean),
    unavailable_fields: [!area ? 'parcel_area' : null,'zone','overlays'].filter(Boolean),
    result: {
      address_found: true, matched_address: geocodeResult.matchedAddr || null,
      geocode_confidence: geocodeResult.confidence || 'Unknown',
      jurisdiction_detected: 'TAS',
      planning_data: { parcel_id: pid, parcel_area: area },
    },
    warnings: [
      'Zone data not yet available for TAS.',
      'Preliminary screening signal only. Professional verification required.',
      'Some controls are not yet fully modelled.',
    ],
    raw_summary: { parcel_id: pid, parcel_area: area },
    not_integrated: false,
  };
  /* eslint-enable no-unreachable */
}

module.exports = { run };
