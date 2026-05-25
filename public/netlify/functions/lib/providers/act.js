/**
 * SiteVerdict — Australian Capital Territory provider
 *
 * Data sources (all public ArcGIS REST — no key, no login):
 *   Territory Plan Land Use Zones:
 *     data.actmapi.act.gov.au/arcgis/rest/services/ACT_PLANNING/
 *     ACT_Territory_Plan_Land_Use_Zone_layer/MapServer/0
 *     Key field: LAND_USE_ZONE_CODE_ID
 *
 *   Territory Plan Overlay Zones:
 *     data.actmapi.act.gov.au/arcgis/rest/services/ACT_PLANNING/
 *     ACT_Territory_Plan_Overlay_Zone_layer/MapServer/1 (polygon layer)
 *     Key field: ZONE_OVERLAY_CODE_ID  |  display: DIVISION_NAME
 *
 *   ACT Blocks (cadastre):
 *     data.actmapi.act.gov.au/arcgis/rest/services/data_extract/
 *     Land_Administration/MapServer  (registered urban blocks)
 *     Key fields: DISTRICT_NAME, block identifiers
 *
 * ACT special rules:
 *   - NO LGA/Council. Territory is governed as one unit.
 *   - council always = "ACT Government"
 *   - councilSource always = "territory-level — no LGA in ACT"
 *   - Parcels are Blocks/Sections, NOT lot/DP as in other states
 *   - 23 zone types confirmed from ArcGIS renderer
 *   - Spatial ref: EPSG:7855 (GDA2020 MGA Zone 55) — use inSR=4326 for lat/lon queries
 *
 * Status: LIVE — public ArcGIS REST, no key required
 * Licence: Open government data, Creative Commons — commercial use permitted
 *
 * Safe wording:
 *   "ACT Territory Plan data — indicator only. Professional verification required.
 *    The authorised Territory Plan is on the ACT Legislation Register."
 */

'use strict';

const TIMEOUT_MS = 8000;

// ── ACT zone code → human label (confirmed from ArcGIS renderer) ─
const ACT_ZONE_LABELS = {
  'RZ1': 'Residential — Suburban',
  'RZ2': 'Residential — Suburban Core',
  'RZ3': 'Residential — Urban Residential',
  'RZ4': 'Residential — Medium Density',
  'RZ5': 'Residential — High Density',
  'CZ1': 'Commercial — Core',
  'CZ2': 'Commercial — Business',
  'CZ3': 'Commercial — Local Centre',
  'CZ4': 'Commercial — Industrial Mixed Use',
  'CZ5': 'Commercial — Mixed Use',
  'IZ1': 'Industrial — General Industrial',
  'IZ2': 'Industrial — Light Industrial',
  'CFZ': 'Community Facility',
  'PRZ1': 'Parks and Recreation — Urban Open Space',
  'PRZ2': 'Parks and Recreation — River Corridor',
  'TSZ': 'Transport and Services',
  'NUZ1': 'Non Urban — Hills, Ridges and Buffer Lands',
  'NUZ2': 'Non Urban — Rural',
  'NUZ3': 'Non Urban — Urban Open Space',
  'NUZ4': 'Non Urban — Broadacre',
  'FUZ':  'Future Urban',
  'DES':  'Designated Areas',
  'UD':   'Urban District (National Capital Plan)',
};

// ── Helpers ─────────────────────────────────────────────────────

function safeJson(text) {
  try { return JSON.parse(text); } catch { return null; }
}

async function fetchWithTimeout(url, opts, ms) {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { ...opts, signal: ctrl.signal,
      headers: { 'User-Agent': 'SiteVerdict-National/1.0' } });
    return res;
  } catch (e) {
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

// Build ArcGIS REST point query URL
function arcgisPointQuery(base, layerId, lat, lon, outFields) {
  const geometry = encodeURIComponent(JSON.stringify({
    x: lon, y: lat, spatialReference: { wkid: 4326 }
  }));
  return `${base}/${layerId}/query`
    + `?geometry=${geometry}`
    + `&geometryType=esriGeometryPoint`
    + `&inSR=4326`
    + `&spatialRel=esriSpatialRelIntersects`
    + `&outFields=${outFields.join(',')}`
    + `&returnGeometry=false`
    + `&f=json`;
}

async function queryArcGIS(url) {
  try {
    const res  = await fetchWithTimeout(url, {}, TIMEOUT_MS);
    const text = await res.text();
    const data = safeJson(text);
    if (!data || data.error) return null;
    return data.features && data.features.length ? data.features[0].attributes : null;
  } catch { return null; }
}

// ── ACT Territory Plan zones ─────────────────────────────────────
async function queryACTZones(lat, lon) {
  const base = 'https://data.actmapi.act.gov.au/arcgis/rest/services'
    + '/ACT_PLANNING/ACT_Territory_Plan_Land_Use_Zone_layer/MapServer';
  const url = arcgisPointQuery(base, 0, lat, lon, ['LAND_USE_ZONE_CODE_ID']);
  return queryArcGIS(url);
}

// ── ACT Territory Plan overlays ──────────────────────────────────
// Layer 1 = overlay polygon layer; returns ZONE_OVERLAY_CODE_ID, DIVISION_NAME
async function queryACTOverlays(lat, lon) {
  const base = 'https://data.actmapi.act.gov.au/arcgis/rest/services'
    + '/ACT_PLANNING/ACT_Territory_Plan_Overlay_Zone_layer/MapServer';
  const url = arcgisPointQuery(base, 1, lat, lon,
    ['ZONE_OVERLAY_CODE_ID', 'DIVISION_NAME']);
  return queryArcGIS(url);
}

// ── ACT Cadastre blocks ──────────────────────────────────────────
// Returns block and district info from registered urban blocks layer
async function queryACTCadastre(lat, lon) {
  const base = 'https://data.actmapi.act.gov.au/arcgis/rest/services'
    + '/data_extract/Land_Administration/MapServer';
  // Layer 0 = ACT Blocks (registered)
  const url = arcgisPointQuery(base, 0, lat, lon,
    ['DISTRICT_NAME', 'BLOCK_IDENTIFIER', 'CURRENT_LIFECYCLE_STAGE']);
  return queryArcGIS(url);
}

// ── Main provider ─────────────────────────────────────────────────
async function run(geocodeResult) {
  // Geocode failed
  if (!geocodeResult || geocodeResult.found !== true) {
    return {
      provider_name:      'ACT Territory Plan (ACTmapi)',
      jurisdiction:       'ACT',
      source_type:        'official_open_data',
      confidence:         'Low',
      screening_label:    'Basic National Screening',
      checked_fields:     ['address'],
      unavailable_fields: ['zone', 'overlay', 'cadastre'],
      result: {
        address_found:         false,
        council:               'ACT Government',
        councilSource:         'territory-level — no LGA in ACT',
        jurisdiction_detected: 'ACT',
        planning_data:         null,
      },
      warnings: [
        'Address could not be geocoded. No ACT planning data available.',
        'Preliminary screening signal only. Professional verification required.',
      ],
      raw_summary: { note: 'Geocode failed — ACT provider aborted.' },
      not_integrated: false,
    };
  }

  const lat = geocodeResult.lat;
  const lon = geocodeResult.lon;

  // Query in parallel — any failure is safe (returns null)
  const [zones, overlays, cadastre] = await Promise.allSettled([
    queryACTZones(lat, lon),
    queryACTOverlays(lat, lon),
    queryACTCadastre(lat, lon),
  ]);

  const zoneData     = zones.status    === 'fulfilled' ? zones.value     : null;
  const overlayData  = overlays.status === 'fulfilled' ? overlays.value  : null;
  const cadastreData = cadastre.status === 'fulfilled' ? cadastre.value  : null;

  // Zone code and label
  const zoneCode  = zoneData ? zoneData.LAND_USE_ZONE_CODE_ID : null;
  const zoneLabel = zoneCode ? (ACT_ZONE_LABELS[zoneCode] || zoneCode) : null;

  // Overlay
  const overlayCode = overlayData ? overlayData.ZONE_OVERLAY_CODE_ID : null;
  const overlayName = overlayData ? overlayData.DIVISION_NAME : null;

  // Cadastre
  const district  = cadastreData ? cadastreData.DISTRICT_NAME : null;
  const blockId   = cadastreData ? (cadastreData.BLOCK_IDENTIFIER || null) : null;

  // Build checked/unavailable fields
  const checkedFields    = ['address', 'geocode_confidence'];
  const uncheckedFields  = [];
  if (zoneCode)   checkedFields.push('zone'); else uncheckedFields.push('zone');
  if (overlayCode) checkedFields.push('overlay'); else uncheckedFields.push('overlay');
  if (district)   checkedFields.push('cadastre_block'); else uncheckedFields.push('cadastre_block');

  // Warnings
  const warnings = [];
  if (!zoneCode)    warnings.push('Zone not returned from ACT Territory Plan. Verify at actmapi.act.gov.au.');
  if (overlayCode)  warnings.push(`ACT overlay detected: ${overlayName || overlayCode}. Check Territory Plan overlay policies.`);
  warnings.push('ACT Territory Plan data — indicator only.');
  warnings.push('The authorised Territory Plan is available on the ACT Legislation Register.');
  warnings.push('Preliminary screening signal only. Professional verification required.');
  warnings.push('ACT blocks and sections are parcels — not lot/DP numbers used in other states.');

  // Confidence
  let confidence = 'Low';
  if (geocodeResult.confidence === 'Verified' && zoneCode) confidence = 'Medium';

  return {
    provider_name:      'ACT Territory Plan (ACTmapi)',
    jurisdiction:       'ACT',
    source_type:        'official_open_data',
    confidence,
    screening_label:    'Basic National Screening',
    checked_fields:     checkedFields,
    unavailable_fields: uncheckedFields,
    result: {
      address_found:         true,
      matched_address:       geocodeResult.matchedAddr || null,
      geocode_confidence:    geocodeResult.confidence || 'Unknown',
      geocode_source:        geocodeResult.source || 'Unknown',
      council:               'ACT Government',
      councilSource:         'territory-level — no LGA in ACT',
      jurisdiction_detected: 'ACT',
      planning_data: {
        zone_code:      zoneCode,
        zone_label:     zoneLabel,
        overlay_code:   overlayCode,
        overlay_name:   overlayName,
        district:       district,
        block_id:       blockId,
        // ACT has no single min lot size spatial layer — embedded in precinct codes
        min_lot_size:   null,
        min_lot_note:   'Min lot size is in Territory Plan precinct codes — not a spatial field.',
      },
    },
    warnings,
    raw_summary: {
      zone_code:    zoneCode,
      zone_label:   zoneLabel,
      overlay_code: overlayCode,
      overlay_name: overlayName,
      district:     district,
      block_id:     blockId,
    },
    not_integrated: false,
  };
}

module.exports = { run };
