/**
 * SiteVerdict — Victoria provider
 *
 * ── STATUS: PREPARED — awaiting PostGIS load of Vicmap Planning GDB ──
 *
 * Data source:
 *   Resource:     VICMAP_PLANNING (DataVic DataShare order)
 *   Publication:  20-05-2026
 *   Format:       ESRI File Geodatabase (GDA2020 Geographic)
 *   Licence:      Creative Commons Attribution 4.0 (CC BY 4.0)
 *   Attribution:  "Vicmap Planning © State of Victoria (Department of Transport and Planning)"
 *   Update freq:  Weekly (planning scheme amendments)
 *   Coverage:     79 Victorian LGAs + Alpine Resorts + French Island
 *                 (Port of Melbourne Planning Scheme excluded from dataset)
 *   Contact:      planning.mappingservices@transport.vic.gov.au
 *
 * ── CONFIRMED LAYER REGISTER (from official DataVic metadata) ───────
 *
 * VMPLAN_PLAN_ZONE (primary — USE_NOW once PostGIS loaded)
 *   Polygon features: land use zones for all Victorian planning schemes
 *   Confirmed fields:
 *     SCHEME_CODE  — planning scheme code (e.g. 'BANYULE' = Banyule SC)
 *     ZONE_NUM     — numeric zone identifier
 *     ZONE_CODE    — zone code (e.g. 'GRZ1', 'NRZ2', 'RGZ', 'C1Z', 'IN1Z')
 *     ZONE_STATUS  — status (Current / Historical)
 *     LGA_NAME     — local government area name
 *     LGA_CODE     — LGA numeric code
 *     CODE_PARENT  — parent zone code (for codelist join)
 *     ZONE_CODE_GROUP — zone classification group
 *   Note: ZONE_CODE is the key field for SiteVerdict display
 *   Note: No min_lot_size spatial field — min lot is in planning scheme text (VPP)
 *
 * VMPLAN_PLAN_OVERLAY (secondary — USE_NOW once PostGIS loaded)
 *   Polygon features: overlay controls for all Victorian planning schemes
 *   Confirmed fields: same structure as ZONE (SCHEME_CODE, ZONE_CODE, LGA_NAME etc.)
 *   Key overlay codes include:
 *     HO (Heritage Overlay), VPO (Vegetation Protection Overlay),
 *     BMO (Bushfire Management Overlay), FO (Flood Overlay),
 *     ESO (Environmental Significance Overlay), SLO (Significant Landscape Overlay),
 *     DDO (Design and Development Overlay), RO (Road Overlay),
 *     WMO (Wildfire Management Overlay), LSIO (Land Subject to Inundation Overlay)
 *
 * VMPLAN_PLAN_CODELIST (lookup table — load alongside ZONE layer)
 *   Aspatial table linking zone_num to full planning scheme descriptions
 *   Used to get full zone name from ZONE_NUM
 *
 * VMPLAN_PLAN_UGB — Urban Growth Boundary polygon (Melbourne metro only)
 *   Useful for flagging if a site is inside/outside the UGB
 *
 * ── INTEGRATION METHOD: PostGIS (self-hosted) ────────────────────────
 *
 * Step 1 — Extract GDB layers to GeoJSON:
 *   ogr2ogr -f GeoJSON -t_srs EPSG:4326 vmplan_zone.geojson VICMAP_PLANNING.gdb VMPLAN_PLAN_ZONE
 *   ogr2ogr -f GeoJSON -t_srs EPSG:4326 vmplan_overlay.geojson VICMAP_PLANNING.gdb VMPLAN_PLAN_OVERLAY
 *
 * Step 2 — Load into PostGIS:
 *   ogr2ogr -f PostgreSQL "PG:host=... dbname=siteverdict" vmplan_zone.geojson -nln vic_zones -t_srs EPSG:4326
 *   ogr2ogr -f PostgreSQL "PG:host=... dbname=siteverdict" vmplan_overlay.geojson -nln vic_overlays -t_srs EPSG:4326
 *   CREATE INDEX ON vic_zones USING GIST(wkb_geometry);
 *   CREATE INDEX ON vic_overlays USING GIST(wkb_geometry);
 *
 * Step 3 — Set Netlify env var (server-side only, NEVER in frontend):
 *   PGCONNSTRING=postgresql://user:pass@host:5432/siteverdict
 *
 * Step 4 — Activate this provider by removing the early return below
 *   Set live: true in data-source-registry.js for vic entries
 *
 * ── SIZE ESTIMATE ────────────────────────────────────────────────────
 *   VMPLAN_PLAN_ZONE:    ~30,000–60,000 features (whole state)
 *   VMPLAN_PLAN_OVERLAY: ~100,000–300,000 features (whole state, overlaps allowed)
 *   GeoJSON (ZONE):      ~50–150MB uncompressed
 *   PostGIS query time:  <100ms per point-in-polygon with GIST index
 *
 * ── MIN LOT SIZE NOTE ────────────────────────────────────────────────
 *   No spatial min lot size field exists in Vicmap Planning.
 *   Min lot size is embedded in planning scheme clause 32.08/32.09 text (VPP).
 *   For Site Check: show "Min lot size: See planning scheme — not a spatial field"
 *   For Full Report: extract from VPP via zone code lookup table
 *
 * ── ATTRIBUTION ──────────────────────────────────────────────────────
 *   "Vicmap Planning © State of Victoria (Department of Transport and Planning).
 *    CC BY 4.0. Source: DataVic — discover.data.vic.gov.au"
 *
 * ── DO NOT ───────────────────────────────────────────────────────────
 *   - Do NOT commit raw GDB or large GeoJSON to public GitHub
 *   - Do NOT expose PGCONNSTRING or raw data to browser/frontend
 *   - Do NOT query Port of Melbourne Planning Scheme area (not in dataset)
 *
 * ── SAFE WORDING ─────────────────────────────────────────────────────
 *   "Based on available official, public, and verifiable data."
 *   "Planning-risk context only."
 *   "Professional verification required before purchase, finance, or development decisions."
 *   "Not a planning certificate, valuation, legal, financial, or investment advice."
 */

'use strict';

const TIMEOUT_MS = 8000;

// ── PostGIS query (activated once PGCONNSTRING env var is set) ────
// This function is called only server-side from the Netlify function.
// PGCONNSTRING must be set as a Netlify environment variable — never in frontend.

async function queryVICPostGIS(lat, lon) {
  const connString = process.env.PGCONNSTRING;
  if (!connString) return null;  // PostGIS not yet configured — safe fallback

  // Dynamic require — pg module must be installed in Netlify function bundle
  let pg;
  try {
    pg = require('pg');
  } catch { return null; }

  const client = new pg.Client({ connectionString: connString });
  try {
    await client.connect();

    // Point-in-polygon: zone query
    const zoneRes = await client.query(
      `SELECT zone_code, lga_name, scheme_code, zone_num
       FROM vic_zones
       WHERE ST_Contains(wkb_geometry, ST_SetSRID(ST_MakePoint($1, $2), 4326))
       LIMIT 1`,
      [lon, lat]
    );

    // Point-in-polygon: overlay query (may return multiple overlapping overlays)
    const ovlyRes = await client.query(
      `SELECT zone_code as overlay_code, lga_name, scheme_code
       FROM vic_overlays
       WHERE ST_Contains(wkb_geometry, ST_SetSRID(ST_MakePoint($1, $2), 4326))
       LIMIT 10`,
      [lon, lat]
    );

    await client.end();

    return {
      zone:     zoneRes.rows[0]     || null,
      overlays: ovlyRes.rows        || [],
    };
  } catch (err) {
    try { await client.end(); } catch {}
    console.error('[vic-provider] PostGIS query error:', err.message);
    return null;
  }
}

// ── Main provider ─────────────────────────────────────────────────
async function run(geocodeResult) {
  // ── NOT YET LIVE — remove this block when PostGIS is loaded ──
  // Check if PostGIS is configured (env var present)
  const hasPostGIS = !!process.env.PGCONNSTRING;

  if (!hasPostGIS) {
    return {
      provider_name:      'Victoria (Vicmap Planning)',
      jurisdiction:       'VIC',
      source_type:        'official_open_data',
      source_name:        'Vicmap Planning',
      source_date:        '20-05-2026',
      confidence:         'Low',
      screening_label:    'Basic National Screening',
      checked_fields:     ['address', 'geocode_confidence'],
      unavailable_fields: ['zone', 'overlays', 'council', 'min_lot_size'],
      result: {
        address_found:        geocodeResult ? geocodeResult.found === true : false,
        matched_address:      geocodeResult ? (geocodeResult.matchedAddr || null) : null,
        geocode_confidence:   geocodeResult ? (geocodeResult.confidence || 'Unknown') : 'Unknown',
        jurisdiction_detected: 'VIC',
        council:              null,
        planning_data:        null,
      },
      warnings: [
        'Victoria Vicmap Planning data has been received (DataVic DataShare, 20-05-2026).',
        'PostGIS integration is in preparation — GDB layer extraction and database load pending.',
        'Basic address check only until PostGIS is configured (PGCONNSTRING env var).',
        'Based on available official, public, and verifiable data.',
        'Planning-risk context only.',
        'Professional verification required before purchase, finance, or development decisions.',
        'Not a planning certificate, valuation, legal, financial, or investment advice.',
      ],
      attribution:     'Vicmap Planning \u00a9 State of Victoria (Department of Transport and Planning). CC BY 4.0.',
      attribution_url: 'https://discover.data.vic.gov.au/dataset/vicmap-planning',
      raw_summary:     { note: 'VIC provider: awaiting PostGIS load. Set PGCONNSTRING env var to activate.' },
      not_integrated:  true,
    };
  }
  // ── END NOT YET LIVE ─────────────────────────────────────────

  if (!geocodeResult || geocodeResult.found !== true) {
    return {
      provider_name:      'Victoria (Vicmap Planning)',
      jurisdiction:       'VIC',
      source_type:        'official_open_data',
      source_name:        'Vicmap Planning',
      source_date:        '20-05-2026',
      confidence:         'Low',
      screening_label:    'Basic National Screening',
      checked_fields:     ['address'],
      unavailable_fields: ['zone', 'overlays', 'council'],
      result: {
        address_found:         false,
        jurisdiction_detected: 'VIC',
        planning_data:         null,
      },
      warnings: [
        'Address could not be geocoded. No VIC planning data available.',
        'Preliminary screening signal only. Professional verification required.',
      ],
      attribution:    'Vicmap Planning \u00a9 State of Victoria (Department of Transport and Planning). CC BY 4.0.',
      raw_summary:    { note: 'Geocode failed — VIC provider aborted.' },
      not_integrated: false,
    };
  }

  const lat = geocodeResult.lat;
  const lon = geocodeResult.lon;

  // Query PostGIS
  const pgResult = await queryVICPostGIS(lat, lon);

  const zoneData     = pgResult ? pgResult.zone     : null;
  const overlayData  = pgResult ? pgResult.overlays : [];

  const zoneCode   = zoneData ? zoneData.zone_code   : null;
  const lgaName    = zoneData ? zoneData.lga_name    : null;
  const schemeCode = zoneData ? zoneData.scheme_code : null;

  const overlayNames = overlayData.map(o => o.overlay_code).filter(Boolean);
  const heritageFlag = overlayNames.some(c => c && c.startsWith('HO'));
  const bushfireFlag = overlayNames.some(c => c && (c.startsWith('BMO') || c.startsWith('WMO')));
  const floodFlag    = overlayNames.some(c => c && (c.startsWith('FO') || c.startsWith('LSIO')));
  const vegFlag      = overlayNames.some(c => c && (c.startsWith('VPO') || c.startsWith('ESO')));

  const checkedFields   = ['address', 'geocode_confidence'];
  const uncheckedFields = [];
  if (zoneCode)  checkedFields.push('zone');    else uncheckedFields.push('zone');
  if (lgaName)   checkedFields.push('council'); else uncheckedFields.push('council');
  if (overlayData.length > 0) checkedFields.push('overlays'); else uncheckedFields.push('overlays');
  uncheckedFields.push('min_lot_size'); // Not a spatial field in Vicmap Planning

  const warnings = [];
  if (!zoneCode)  warnings.push('Zone not returned from Vicmap Planning. Verify at planning.vic.gov.au or with your council.');
  if (!lgaName)   warnings.push('Council/LGA not returned from Vicmap Planning.');
  if (heritageFlag) warnings.push('Heritage Overlay (HO) detected — Heritage Impact Assessment may be required.');
  if (bushfireFlag) warnings.push('Bushfire Management Overlay (BMO/WMO) detected — Bushfire Management Statement may be required.');
  if (floodFlag)    warnings.push('Flood/Inundation Overlay (FO/LSIO) detected — flood risk assessment may be required.');
  if (vegFlag)      warnings.push('Vegetation Overlay (VPO/ESO) detected — ecological or vegetation report may be required.');
  warnings.push('Min lot size is in the planning scheme clause text — not a spatial field.');
  warnings.push('Based on available official, public, and verifiable data. Planning-risk context only.');
  warnings.push('Source: Vicmap Planning \u00a9 State of Victoria. CC BY 4.0. Published 20-05-2026. Updated weekly.');
  warnings.push('Professional verification required before purchase, finance, or development decisions.');
  warnings.push('Not a planning certificate, valuation, legal, financial, or investment advice.');

  let confidence = 'Low';
  if (geocodeResult.confidence === 'Verified' && zoneCode && lgaName) confidence = 'Medium';
  else if (geocodeResult.confidence === 'Verified' && zoneCode)        confidence = 'Medium';

  return {
    provider_name:   'Victoria (Vicmap Planning)',
    jurisdiction:    'VIC',
    source_type:     'official_open_data',
    source_name:     'Vicmap Planning',
    source_date:     '20-05-2026',
    confidence,
    screening_label: 'Basic National Screening',
    checked_fields:   checkedFields,
    unavailable_fields: uncheckedFields,
    result: {
      address_found:         true,
      matched_address:       geocodeResult.matchedAddr || null,
      geocode_confidence:    geocodeResult.confidence  || 'Unknown',
      geocode_source:        geocodeResult.source      || 'Unknown',
      jurisdiction_detected: 'VIC',
      council:               lgaName,
      scheme_code:           schemeCode,
      planning_data: {
        zone_code:     zoneCode,
        zone_label:    zoneCode,  // Full label needs codelist join — use code until loaded
        scheme_code:   schemeCode,
        overlays:      overlayNames,
        heritage:      heritageFlag,
        bushfire:      bushfireFlag,
        flood:         floodFlag,
        vegetation:    vegFlag,
        min_lot_size:  null,
        min_lot_note:  'Min lot size is in planning scheme clause text (VPP) — not a spatial field.',
      },
    },
    warnings,
    attribution:     'Vicmap Planning \u00a9 State of Victoria (Department of Transport and Planning). CC BY 4.0.',
    attribution_url: 'https://discover.data.vic.gov.au/dataset/vicmap-planning',
    raw_summary: {
      zone_code:    zoneCode,
      scheme_code:  schemeCode,
      lga_name:     lgaName,
      overlay_count: overlayData.length,
      overlays:     overlayNames.slice(0, 10),  // Truncated for raw_summary
    },
    not_integrated: false,
  };
}

module.exports = { run };
