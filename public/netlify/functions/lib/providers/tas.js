/**
 * SiteVerdict — Tasmania provider
 *
 * ── STATUS: LIVE — CC BY 3.0 AU layers from theLIST ─────────────
 *
 * Data sources (LIST public ArcGIS REST — no key, no login):
 *   Base URL: https://services.thelist.tas.gov.au/arcgis/rest/services/Public/
 *
 * T&Cs: https://listdata.thelist.tas.gov.au/public/LISTWebServicesTermsConditions.pdf
 * Attribution guidelines:
 *   https://listdata.thelist.tas.gov.au/public/LandTasmaniaDataAttributionGuidelines.pdf
 *
 * Land Tasmania / LIST support confirmed:
 *   - No known issues with public-facing display or automated point queries
 *   - These services are used in public applications such as PlanBuild Tasmania
 *   - Each layer must be reviewed individually for licensing
 *   - If CC BY 3.0 AU, commercial use permitted with attribution
 *
 * ── LAYER REGISTER ────────────────────────────────────────────────
 *
 * LAYER 1 — Tasmanian Planning Scheme Zones
 *   Service:   Public/PlanningOnline/MapServer/13
 *   Licence:   Copyright Text empty in REST service — metadata check recommended
 *   Fields:    ZONE_NO (integer renderer key), LPS (local planning scheme ref)
 *   Zone labels confirmed from renderer (ZONE_NO values 8–30):
 *     8=General Residential, 9=Inner Residential, 10=Low Density Residential,
 *     11=Rural Living, 12=Village, 13=Urban Mixed Use, 14=Local Business,
 *     15=General Business, 16=Central Business, 17=Commercial,
 *     18=Light Industrial, 19=General Industrial, 20=Rural, 21=Agriculture,
 *     22=Landscape Conservation, 23=Environmental Management, 24=Major Tourism,
 *     25=Port and Marine, 26=Utilities, 27=Community Purpose,
 *     28=Recreation, 29=Open Space, 30=Future Urban
 *   Status: USE_NOW — authoritative TPS layer
 *
 * LAYER 2 — Cadastral Parcels
 *   Service:   Public/CadastreAndAdministrative/MapServer/38
 *   Licence:   CC BY 3.0 AU CONFIRMED in Copyright Text field
 *   Fields:    PID, COMP_AREA, MEAS_AREA, PROP_ADD, VOLUME, FOLIO
 *   Status: USE_NOW
 *
 * LAYER 3 — Local Government Areas
 *   Service:   Public/CadastreAndAdministrative/MapServer/4
 *   Licence:   Same service as CC BY 3.0 AU layers; verify at
 *              thelist.tas.gov.au/app/content/data — search "Local Government Areas"
 *   Fields:    NAME, LGA_CODE, LGA_ID
 *   Status: USE_NOW (metadata check recommended before full production use)
 *
 * LAYER 4 — Tasmanian Planning Scheme Code Overlay
 *   Service:   Public/PlanningOnline/MapServer/14
 *   Licence:   Copyright Text EMPTY — email listhelp@nre.tas.gov.au to confirm
 *   Fields:    OV_NAME
 *   Status: SAVE_FOR_LATER — await licence clarification
 *
 * LAYER 5 — Tasmanian Interim Planning Zones (pre-TPS areas)
 *   Service:   Public/PlanningOnline/MapServer/4
 *   Licence:   Copyright Text EMPTY — also data from 2015, may be superseded
 *   Fields:    ZONECODE, ZONE
 *   Status: SAVE_FOR_LATER — await licence clarification
 *
 * ── ATTRIBUTION (required on all output using these layers) ───────
 *   "Cadastral Parcels from theLIST © State of Tasmania"
 *   "Tasmanian Planning Scheme Zones from theLIST © State of Tasmania"
 *   "Local Government Areas from theLIST © State of Tasmania"
 *
 * ── SAFE REPORT WORDING ───────────────────────────────────────────
 *   "Based on available official, public, and verifiable data."
 *   "Planning-risk context only."
 *   "Professional verification required before purchase, finance, or development decisions."
 *   "Not a planning certificate, valuation, legal, financial, or investment advice."
 *
 * ── DO NOT ASK FOR: title, ownership, valuation data ─────────────
 *   PID and Volume/Folio link to VISTAS/TASFOL systems that hold
 *   ownership, valuation and title. Do NOT attempt to query those
 *   systems — they require LIST account access under different T&Cs.
 */

'use strict';

const TIMEOUT_MS = 8000;

// ── TPS zone number → zone label ─────────────────────────────────
// Confirmed from PlanningOnline/MapServer/13 renderer (ZONE_NO field)
const TPS_ZONES = {
  8:  'General Residential',
  9:  'Inner Residential',
  10: 'Low Density Residential',
  11: 'Rural Living',
  12: 'Village',
  13: 'Urban Mixed Use',
  14: 'Local Business',
  15: 'General Business',
  16: 'Central Business',
  17: 'Commercial',
  18: 'Light Industrial',
  19: 'General Industrial',
  20: 'Rural',
  21: 'Agriculture',
  22: 'Landscape Conservation',
  23: 'Environmental Management',
  24: 'Major Tourism',
  25: 'Port and Marine',
  26: 'Utilities',
  27: 'Community Purpose',
  28: 'Recreation',
  29: 'Open Space',
  30: 'Future Urban',
};

// ── Helpers ──────────────────────────────────────────────────────

function safeJson(text) {
  try { return JSON.parse(text); } catch { return null; }
}

async function fetchWithTimeout(url, opts, ms) {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, {
      ...opts,
      signal: ctrl.signal,
      headers: { 'User-Agent': 'SiteVerdict-National/1.0' },
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

function arcgisPointQuery(baseUrl, layerId, lat, lon, outFields) {
  const geom = encodeURIComponent(
    JSON.stringify({ x: lon, y: lat, spatialReference: { wkid: 4326 } })
  );
  return `${baseUrl}/${layerId}/query`
    + `?geometry=${geom}`
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

// ── Layer queries ────────────────────────────────────────────────

// Layer 13 — Tasmanian Planning Scheme Zones
// Key field: ZONE_NO (integer), display: LPS (planning scheme ref)
async function queryTASZones(lat, lon) {
  const base = 'https://services.thelist.tas.gov.au/arcgis/rest/services/Public/PlanningOnline/MapServer';
  const url  = arcgisPointQuery(base, 13, lat, lon, ['ZONE_NO', 'LPS']);
  return queryArcGIS(url);
}

// Layer 38 — Cadastral Parcels (CC BY 3.0 AU confirmed)
// Key fields: PID, COMP_AREA, MEAS_AREA, PROP_ADD
// NOTE: Do NOT request VOLUME/FOLIO for public output — links to title system
async function queryTASCadastre(lat, lon) {
  const base = 'https://services.thelist.tas.gov.au/arcgis/rest/services/Public/CadastreAndAdministrative/MapServer';
  const url  = arcgisPointQuery(base, 38, lat, lon, ['PID', 'COMP_AREA', 'MEAS_AREA', 'PROP_ADD']);
  return queryArcGIS(url);
}

// Layer 4 — Local Government Areas (CadastreAndAdministrative)
// Key fields: NAME, LGA_CODE
async function queryTASLGA(lat, lon) {
  const base = 'https://services.thelist.tas.gov.au/arcgis/rest/services/Public/CadastreAndAdministrative/MapServer';
  const url  = arcgisPointQuery(base, 4, lat, lon, ['NAME', 'LGA_CODE']);
  return queryArcGIS(url);
}

// ── Main provider ────────────────────────────────────────────────

async function run(geocodeResult) {
  if (!geocodeResult || geocodeResult.found !== true) {
    return {
      provider_name:      'Tasmania (theLIST — Land Tasmania)',
      jurisdiction:       'TAS',
      source_type:        'official_open_data',
      confidence:         'Low',
      screening_label:    'Basic National Screening',
      checked_fields:     ['address'],
      unavailable_fields: ['zone', 'parcel_area', 'council', 'overlays'],
      result: {
        address_found:         false,
        jurisdiction_detected: 'TAS',
        council:               null,
        planning_data:         null,
      },
      warnings: [
        'Address could not be geocoded. No Tasmania planning data available.',
        'Preliminary screening signal only. Professional verification required.',
      ],
      raw_summary:    { note: 'Geocode failed — TAS provider aborted.' },
      attribution:    null,
      not_integrated: false,
    };
  }

  const lat = geocodeResult.lat;
  const lon = geocodeResult.lon;

  // All three queries in parallel — any failure is safe (returns null)
  const [zones, cadastre, lga] = await Promise.allSettled([
    queryTASZones(lat, lon),
    queryTASCadastre(lat, lon),
    queryTASLGA(lat, lon),
  ]);

  const zoneData    = zones.status    === 'fulfilled' ? zones.value    : null;
  const cadData     = cadastre.status === 'fulfilled' ? cadastre.value : null;
  const lgaData     = lga.status      === 'fulfilled' ? lga.value      : null;

  // Zone
  const zoneNo    = zoneData ? zoneData.ZONE_NO : null;
  const zoneLabel = zoneNo   ? (TPS_ZONES[Number(zoneNo)] || `Zone ${zoneNo}`) : null;
  const lpsRef    = zoneData ? zoneData.LPS : null;

  // Cadastre — use COMP_AREA first, fall back to MEAS_AREA
  const parcelArea = cadData
    ? (cadData.COMP_AREA || cadData.MEAS_AREA || null)
    : null;
  const pid = cadData ? cadData.PID : null;
  // PROP_ADD for reference only — do not expose full address if geocode already confirmed
  const propAdd = cadData ? cadData.PROP_ADD : null;

  // LGA
  const lgaName = lgaData ? lgaData.NAME : null;
  const lgaCode = lgaData ? lgaData.LGA_CODE : null;

  // Checked fields
  const checkedFields   = ['address', 'geocode_confidence'];
  const uncheckedFields = [];
  if (zoneLabel)  checkedFields.push('zone');        else uncheckedFields.push('zone');
  if (parcelArea) checkedFields.push('parcel_area'); else uncheckedFields.push('parcel_area');
  if (lgaName)    checkedFields.push('council');     else uncheckedFields.push('council');
  uncheckedFields.push('overlays'); // Layer 14 pending licence confirmation

  // Confidence
  let confidence = 'Low';
  if (geocodeResult.confidence === 'Verified' && zoneLabel && parcelArea) confidence = 'Medium';
  else if (geocodeResult.confidence === 'Verified' && zoneLabel)          confidence = 'Medium';

  // Warnings
  const warnings = [];
  if (!zoneLabel)  warnings.push('Zone not returned from Tasmanian Planning Scheme layer. Address may be in an area not yet under the TPS. Verify at eplanningtas.com.au or with your council.');
  if (!parcelArea) warnings.push('Parcel area not returned from LIST Cadastre. Verify with Land Tasmania.');
  if (!lgaName)    warnings.push('Council/LGA not returned. Tasmania has 29 municipalities — verify with theLIST or your council.');
  warnings.push('Tasmania overlay data (flood, heritage, bushfire constraints) is not yet connected — licence clarification pending.');
  warnings.push('Based on available official, public, and verifiable data. Planning-risk context only.');
  warnings.push('Not a planning certificate, valuation, legal, financial, or investment advice.');
  warnings.push('Professional verification required before purchase, finance, or development decisions.');

  // Attribution (required per Land Tasmania guidelines)
  const attribution = [
    zoneLabel    ? 'Tasmanian Planning Scheme Zones from theLIST \u00a9 State of Tasmania' : null,
    parcelArea   ? 'Cadastral Parcels from theLIST \u00a9 State of Tasmania' : null,
    lgaName      ? 'Local Government Areas from theLIST \u00a9 State of Tasmania' : null,
  ].filter(Boolean);

  return {
    provider_name:   'Tasmania (theLIST — Land Tasmania)',
    jurisdiction:    'TAS',
    source_type:     'official_open_data',
    confidence,
    screening_label: 'Basic National Screening',
    checked_fields:   checkedFields,
    unavailable_fields: uncheckedFields,
    result: {
      address_found:         true,
      matched_address:       geocodeResult.matchedAddr || null,
      geocode_confidence:    geocodeResult.confidence  || 'Unknown',
      geocode_source:        geocodeResult.source      || 'Unknown',
      jurisdiction_detected: 'TAS',
      council:               lgaName,
      council_code:          lgaCode,
      planning_data: {
        zone_no:      zoneNo,
        zone_label:   zoneLabel,
        lps_ref:      lpsRef,
        parcel_area:  parcelArea ? Math.round(parcelArea) : null,
        pid:          pid,
        // Overlays: pending LIST layer 14 licence confirmation
        overlays:     null,
        overlays_note: 'TPS Code Overlay layer not yet connected — licence confirmation pending.',
      },
    },
    warnings,
    // Attribution required per Land Tasmania Data Attribution Guidelines
    attribution: attribution.join(' | '),
    attribution_url: 'https://listdata.thelist.tas.gov.au/public/LandTasmaniaDataAttributionGuidelines.pdf',
    raw_summary: {
      zone_no:     zoneNo,
      zone_label:  zoneLabel,
      lps_ref:     lpsRef,
      parcel_area: parcelArea,
      pid:         pid,
      lga_name:    lgaName,
      lga_code:    lgaCode,
    },
    not_integrated: false,
  };
}

module.exports = { run };
