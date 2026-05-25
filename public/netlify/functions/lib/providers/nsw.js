/**
 * SiteVerdict — NSW provider
 *
 * Wraps the existing NSW planning layer logic:
 * - geocode (already run by the time this provider is called)
 * - cadastre (NSW SIX Maps parcel query)
 * - NSW Planning Portal spatial APIs (zone, overlays, etc.)
 *
 * This provider does NOT re-run geocoding.
 * It receives the geocode result and fetches NSW-specific planning data.
 *
 * All API calls are server-side only. No keys in responses.
 * Env vars used: GOOGLE_MAPS_API_KEY (for geocode, already handled upstream)
 */

'use strict';

const TIMEOUT_MS = 8000;

// ── Helpers ──────────────────────────────────────────────────────

function safeJson(text) {
  try { return JSON.parse(text); } catch { return null; }
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

// ── NSW Planning Portal spatial query ────────────────────────────
// Queries the NSW ePlanning ArcGIS REST services for a given coordinate.

async function queryNSWPlanning(lat, lon) {
  const point    = JSON.stringify({ x: lon, y: lat, spatialReference: { wkid: 4326 } });
  const geometry = encodeURIComponent(point);
  const base     = 'https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/Planning/EPI_Primary_Planning_Layers/MapServer';

  const LAYER_ZONE     = 0;
  const LAYER_MLS      = 1;
  const LAYER_HERITAGE = 2;
  const LAYER_FLOOD    = 5;
  const LAYER_BUSHFIRE = 10;

  async function queryLayer(layerId, outFields) {
    const url = `${base}/${layerId}/query?geometry=${geometry}&geometryType=esriGeometryPoint`
      + `&spatialRel=esriSpatialRelIntersects&outFields=${outFields.join(',')}`
      + `&returnGeometry=false&f=json`;
    try {
      const res  = await fetchWithTimeout(url, {}, TIMEOUT_MS);
      const text = await res.text();
      const data = safeJson(text);
      return data && data.features && data.features.length ? data.features[0].attributes : null;
    } catch { return null; }
  }

  const [zone, mls, heritage, flood, bushfire] = await Promise.allSettled([
    queryLayer(LAYER_ZONE,     ['ZONE_CODE','ZONE_NAME']),
    queryLayer(LAYER_MLS,      ['LOT_SIZE','AREA_VALUE']),
    queryLayer(LAYER_HERITAGE, ['HER_NAME','SIGNIFICANCE']),
    queryLayer(LAYER_FLOOD,    ['FP_LABEL']),
    queryLayer(LAYER_BUSHFIRE, ['BAL_VALUE']),
  ]);

  return {
    zone:      zone.status     === 'fulfilled' ? zone.value      : null,
    mls:       mls.status      === 'fulfilled' ? mls.value       : null,
    heritage:  heritage.status === 'fulfilled' ? heritage.value  : null,
    flood:     flood.status    === 'fulfilled' ? flood.value     : null,
    bushfire:  bushfire.status === 'fulfilled' ? bushfire.value  : null,
  };
}

// ── NSW Protection layers (acid sulfate, riparian, biodiversity) ─
// Source: Planning/Protection MapServer (CC BY 4.0, no key)
//   Layer 1:  Acid Sulfate Soils     — fields: EPI_NAME, LAY_CLASS (Class 1–5)
//   Layer 7:  Riparian Lands/Watercourses — fields: EPI_NAME
//   Layer 10: Terrestrial Biodiversity — fields: EPI_NAME
async function queryNSWProtection(lat, lon) {
  const point    = JSON.stringify({ x: lon, y: lat, spatialReference: { wkid: 4326 } });
  const geometry = encodeURIComponent(point);
  const base     = 'https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/Planning/Protection/MapServer';

  const LAYER_ACID_SULFATE  = 1;
  const LAYER_RIPARIAN      = 7;
  const LAYER_BIODIVERSITY  = 10;

  async function queryProtLayer(layerId, outFields) {
    const url = `${base}/${layerId}/query?geometry=${geometry}&geometryType=esriGeometryPoint`
      + `&spatialRel=esriSpatialRelIntersects&outFields=${outFields.join(',')}`
      + `&returnGeometry=false&f=json`;
    try {
      const res  = await fetchWithTimeout(url, {}, TIMEOUT_MS);
      const text = await res.text();
      const data = safeJson(text);
      return data && data.features && data.features.length ? data.features[0].attributes : null;
    } catch { return null; }
  }

  const [acidSulfate, riparian, biodiversity] = await Promise.allSettled([
    queryProtLayer(LAYER_ACID_SULFATE,  ['EPI_NAME', 'LAY_CLASS']),
    queryProtLayer(LAYER_RIPARIAN,      ['EPI_NAME']),
    queryProtLayer(LAYER_BIODIVERSITY,  ['EPI_NAME']),
  ]);

  return {
    acidSulfate:  acidSulfate.status  === 'fulfilled' ? acidSulfate.value  : null,
    riparian:     riparian.status     === 'fulfilled' ? riparian.value     : null,
    biodiversity: biodiversity.status === 'fulfilled' ? biodiversity.value : null,
  };
}

// ── NSW FSR and Height of Buildings ──────────────────────────────
// Source: ePlanning/Planning_Portal_Principal_Planning MapServer (CC BY 4.0)
//   Layer 9:  Floor Space Ratio Map (current LEP)  — fields: EPI_NAME, FSR (where present)
//   Layer 12: Height of Buildings Map (current LEP) — fields: EPI_NAME, HOB (where present)
async function queryNSWFSRHeight(lat, lon) {
  const point    = JSON.stringify({ x: lon, y: lat, spatialReference: { wkid: 4326 } });
  const geometry = encodeURIComponent(point);
  const base     = 'https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/ePlanning/Planning_Portal_Principal_Planning/MapServer';

  const LAYER_FSR    = 9;
  const LAYER_HEIGHT = 12;

  async function queryPPLayer(layerId, outFields) {
    const url = `${base}/${layerId}/query?geometry=${geometry}&geometryType=esriGeometryPoint`
      + `&spatialRel=esriSpatialRelIntersects&outFields=${outFields.join(',')}`
      + `&returnGeometry=false&f=json`;
    try {
      const res  = await fetchWithTimeout(url, {}, TIMEOUT_MS);
      const text = await res.text();
      const data = safeJson(text);
      return data && data.features && data.features.length ? data.features[0].attributes : null;
    } catch { return null; }
  }

  const [fsr, height] = await Promise.allSettled([
    queryPPLayer(LAYER_FSR,    ['EPI_NAME', 'FSR']),
    queryPPLayer(LAYER_HEIGHT, ['EPI_NAME', 'HOB']),
  ]);

  return {
    fsr:    fsr.status    === 'fulfilled' ? fsr.value    : null,
    height: height.status === 'fulfilled' ? height.value : null,
  };
}

// ── NSW Cadastre (SIX Maps) ───────────────────────────────────────
async function queryNSWCadastre(lat, lon) {
  // Convert WGS84 to Web Mercator (approximate, sufficient for parcel query)
  const R = 6378137;
  const mx = lon * (Math.PI / 180) * R;
  const my = Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180) * R * Math.PI / 180;

  const url = 'https://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_Cadastre/MapServer/9/query'
    + `?geometry=${mx},${my}&geometryType=esriGeometryPoint`
    + `&inSR=102100&outSR=4326&spatialRel=esriSpatialRelIntersects`
    + `&outFields=lotidstring,shape_area,lotnumber,plannumber`
    + `&returnGeometry=false&f=json`;
  try {
    const res  = await fetchWithTimeout(url, {}, TIMEOUT_MS);
    const text = await res.text();
    const data = safeJson(text);
    return data && data.features && data.features.length ? data.features[0].attributes : null;
  } catch { return null; }
}

// ── Main provider ─────────────────────────────────────────────────

/**
 * Run NSW provider.
 * @param {object} geocodeResult  Result from geocode.js (already run upstream)
 * @returns {object}  Standard provider result
 */
async function run(geocodeResult) {
  if (!geocodeResult || geocodeResult.found !== true) {
    return {
      provider_name:      'NSW Planning Portal + Cadastre',
      jurisdiction:       'NSW',
      source_type:        'official_open_data',
      confidence:         'Low',
      screening_label:    'Basic National Screening',
      checked_fields:     ['address'],
      unavailable_fields: ['zone', 'min_lot_size', 'heritage', 'flood', 'bushfire',
                           'da_timeline', 'parcel_area'],
      result:             { address_found: false },
      warnings: [
        'Address could not be geocoded. No planning data available.',
        'Preliminary screening signal only. Professional verification required.',
      ],
      raw_summary:        { note: 'Geocode failed — NSW provider aborted.' },
    };
  }

  const lat = geocodeResult.lat;
  const lon = geocodeResult.lon;

  // Fetch NSW planning + cadastre + protection + FSR/height in parallel
  const [planning, cadastre, protection, fsrHeight] = await Promise.allSettled([
    queryNSWPlanning(lat, lon),
    queryNSWCadastre(lat, lon),
    queryNSWProtection(lat, lon),
    queryNSWFSRHeight(lat, lon),
  ]);

  const planData  = planning.status    === 'fulfilled' ? planning.value    : {};
  const cadData   = cadastre.status    === 'fulfilled' ? cadastre.value    : null;
  const protData  = protection.status  === 'fulfilled' ? protection.value  : {};
  const fsrData   = fsrHeight.status   === 'fulfilled' ? fsrHeight.value   : {};

  const zoneCode = planData.zone ? planData.zone.ZONE_CODE : null;
  const zoneName = planData.zone ? planData.zone.ZONE_NAME : null;
  const mlsVal   = planData.mls  ? (planData.mls.LOT_SIZE || planData.mls.AREA_VALUE || null) : null;
  const heritageFound = !!(planData.heritage && Object.keys(planData.heritage).length > 0
                           && planData.heritage.HER_NAME);
  const floodFound    = !!(planData.flood && planData.flood.FP_LABEL);
  const bushfireFound = !!(planData.bushfire && planData.bushfire.BAL_VALUE);
  const parcelArea    = cadData ? cadData.shape_area  : null;
  const lotId         = cadData ? cadData.lotidstring : null;

  // Protection layer results
  const acidSulfateFound  = !!(protData && protData.acidSulfate);
  const acidSulfateClass  = (protData && protData.acidSulfate) ? (protData.acidSulfate.LAY_CLASS || 'detected') : null;
  const riparianFound     = !!(protData && protData.riparian);
  const biodiversityFound = !!(protData && protData.biodiversity);

  // FSR / Height results (only present when an LEP control exists)
  const fsrValue    = (fsrData && fsrData.fsr)    ? (fsrData.fsr.FSR    || null) : null;
  const heightValue = (fsrData && fsrData.height) ? (fsrData.height.HOB || null) : null;

  const checkedFields    = ['address', 'geocode_confidence'];
  const uncheckedFields  = [];
  if (zoneCode)       checkedFields.push('zone');           else uncheckedFields.push('zone');
  if (mlsVal)         checkedFields.push('min_lot_size');    else uncheckedFields.push('min_lot_size');
  if (parcelArea)     checkedFields.push('parcel_area');     else uncheckedFields.push('parcel_area');
  checkedFields.push('heritage_indicator', 'flood_indicator', 'bushfire_indicator',
                     'acid_sulfate_indicator', 'riparian_indicator', 'biodiversity_indicator');
  if (fsrValue)    checkedFields.push('fsr');    else uncheckedFields.push('fsr');
  if (heightValue) checkedFields.push('height'); else uncheckedFields.push('height');

  const warnings = [];
  if (!zoneCode)   warnings.push('Zone could not be confirmed. Check NSW ePlanning directly.');
  if (!mlsVal)     warnings.push('Minimum lot size not available from planning layer.');
  if (!parcelArea) warnings.push('Parcel area not available from cadastre.');
  if (heritageFound)     warnings.push('Heritage overlay indicator detected — Heritage Impact Statement may be required.');
  if (floodFound)        warnings.push('Flood planning indicator detected — hydraulic assessment may be required.');
  if (bushfireFound)     warnings.push('Bushfire prone land indicator detected — BAL rating assessment required.');
  if (acidSulfateFound)  warnings.push(`Acid sulfate soils indicator detected (${acidSulfateClass}) — indicator only. ASSMP may be required.`);
  if (riparianFound)     warnings.push('Riparian / watercourse indicator detected — buffer setbacks may apply. Indicator only.');
  if (biodiversityFound) warnings.push('Terrestrial biodiversity indicator detected — Biodiversity Assessment Report may be required.');
  warnings.push('Preliminary screening signal only. Professional verification required.');
  warnings.push('Overlay checks are indicators only. Not a Section 10.7 certificate. Contamination: check Section 10.7 directly.');

  // Derive overall confidence
  let confidence = 'Low';
  if (geocodeResult.confidence === 'Verified' && zoneCode && parcelArea) confidence = 'High';
  else if (geocodeResult.confidence === 'Verified' && zoneCode)           confidence = 'Medium';
  else if (zoneCode)                                                       confidence = 'Medium';

  return {
    provider_name:      'NSW Planning Portal + Cadastre',
    jurisdiction:       'NSW',
    source_type:        'official_open_data',
    confidence,
    screening_label:    'Basic National Screening',
    checked_fields:     checkedFields,
    unavailable_fields: uncheckedFields,
    result: {
      address_found:        true,
      matched_address:      geocodeResult.matchedAddr || null,
      geocode_confidence:   geocodeResult.confidence  || 'Unknown',
      geocode_source:       geocodeResult.source      || 'Unknown',
      jurisdiction_detected: 'NSW',
      planning_data: {
        zone_code:        zoneCode,
        zone_name:        zoneName,
        min_lot_size:     mlsVal   ? Number(mlsVal)   : null,
        parcel_area:      parcelArea ? Number(parcelArea) : null,
        lot_id:           lotId,
        heritage:         heritageFound,
        flood:            floodFound,
        bushfire:         bushfireFound,
        acid_sulfate:     acidSulfateFound,
        acid_sulfate_class: acidSulfateClass,
        riparian:         riparianFound,
        biodiversity:     biodiversityFound,
        fsr:              fsrValue   ? String(fsrValue)   : null,
        height_m:         heightValue ? String(heightValue) : null,
      },
    },
    warnings,
    raw_summary: {
      zone_code:    zoneCode,
      zone_name:    zoneName,
      min_lot_size: mlsVal,
      parcel_area:  parcelArea,
      heritage:     heritageFound,
      flood:        floodFound,
      bushfire:     bushfireFound,
    },
    not_integrated: false,
  };
}

module.exports = { run };
