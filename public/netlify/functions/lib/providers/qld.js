/**
 * SiteVerdict — Queensland provider
 *
 * ── STATUS: STUB — QSCF cadastre received, PostGIS load pending ──────
 *
 * ── WHAT WE HAVE ──────────────────────────────────────────────────────
 *
 * QSCF (Queensland Spatial Cadastral Fabric) — whole of state
 *   File:       DP_QLD_QSCF_WOS_CUR.zip
 *   Received:   25-05-2026 via QSpatial order JobID: 20260525_175309737236-17072
 *   Source:     opendata@resources.qld.gov.au / Queensland Spatial Catalogue
 *   Licence:    Creative Commons Attribution 4.0 (CC BY 4.0) — CONFIRMED
 *               QLD DNRMMRRD CC BY waiver confirmed. Commercial use permitted.
 *   Attribution: "© State of Queensland (Department of Natural Resources and
 *                 Mines, Manufacturing and Regional and Rural Development) 2026.
 *                 Licensed under Creative Commons Attribution 4.0."
 *   Update:     Weekly (QSCF replaced DCDB as of April 2026)
 *   Format:     ESRI File Geodatabase (GDB)
 *
 * WHAT QSCF CONTAINS (cadastre only):
 *   lot_area      — lot area in m² (key Site Check field)
 *   shire_name    — local authority / council / LGA name
 *   locality      — suburb / locality name
 *   tenure        — tenure type (Freehold, State land, etc.)
 *   parcel_typ    — parcel type (Standard lot, Road, Water, etc.)
 *   surv_ind      — surveyed indicator (Y/N)
 *   acc_code      — spatial accuracy class
 *
 * WHAT QSCF DOES NOT CONTAIN:
 *   planning_zone     — NOT in QSCF. No single state layer exists for QLD.
 *   overlays          — NOT in QSCF.
 *   min_lot_size      — NOT in QSCF. Embedded in each council's planning scheme.
 *   heritage          — NOT in QSCF. Separate QLD Heritage Register dataset.
 *   flood             — NOT in QSCF. Separate QLD Floodplain Assessment Overlay.
 *   bushfire          — NOT in QSCF. Separate QFES Bushfire Prone Area dataset.
 *
 * ── WHAT DOES NOT EXIST FOR QLD PLANNING ZONES ───────────────────────
 *
 * There is NO single state-level QLD planning zone dataset.
 * QLD planning zones are held by each of 77 individual councils separately,
 * under the Planning Act 2016 (Qld). Each council maintains its own scheme.
 *
 * Available workarounds (none suitable for automated live Site Check):
 *   - MapsOnline API: asynchronous, reports delivered by email — not real-time
 *   - Individual council GIS APIs: 77 separate integrations required
 *   - State Planning Policy overlays: partial coverage only
 *
 * ── INTEGRATION PLAN (for when PostGIS infrastructure is ready) ───────
 *
 * Step 1 — Inspect the GDB:
 *   python3 inspect_vicmap_gdb.py /path/to/DP_QLD_QSCF_WOS_CUR.gdb
 *   (The inspector script works on any GDB, not just Vicmap)
 *   Confirm layer name, field names match this documentation.
 *
 * Step 2 — Extract and reproject:
 *   ogr2ogr -f GeoJSON -t_srs EPSG:4326 qld_parcels.geojson \
 *     DP_QLD_QSCF_WOS_CUR.gdb <layer_name>
 *   Only extract: lot_area, shire_name, locality, tenure, parcel_typ, surv_ind, acc_code
 *   Do NOT extract: owner, title, valuation, private address fields
 *
 * Step 3 — Load into PostGIS:
 *   ogr2ogr -f PostgreSQL "PG:host=... dbname=siteverdict" qld_parcels.geojson \
 *     -nln qld_parcels -t_srs EPSG:4326
 *   CREATE INDEX ON qld_parcels USING GIST(wkb_geometry);
 *
 * Step 4 — Set Netlify env var (server-side only, NEVER in frontend):
 *   PGCONNSTRING_QLD=postgresql://user:pass@host:5432/siteverdict
 *   OR use shared PGCONNSTRING if on same PostGIS instance as VIC.
 *
 * Step 5 — Activate provider by removing the early return stub below.
 *
 * ── DO NOT ────────────────────────────────────────────────────────────
 *   - Do NOT commit raw GDB or large GeoJSON to public GitHub
 *   - Do NOT expose PGCONNSTRING_QLD in any frontend file
 *   - Do NOT show planning zones from QSCF — it has none
 *   - Do NOT infer zoning from tenure type — tenure ≠ zone
 *
 * ── SITE CHECK HONEST WORDING (QLD) ──────────────────────────────────
 *   Parcel area:    "Indicative only — source: QSCF (QSpatial). Verify against title."
 *   Council:        "Indicative only — source: QSCF (QSpatial)."
 *   Planning zone:  "Not yet connected for Queensland. No single state planning zone
 *                    layer exists. Verify with the relevant council or licensed planner."
 *   Overlays:       "Not yet connected for Queensland."
 *   Min lot size:   "Not available — embedded in individual council planning schemes."
 */

'use strict';

// ── PostGIS query (activated once PGCONNSTRING_QLD env var is set) ────
async function queryQLDPostGIS(lat, lon) {
  // Use either a QLD-specific connection string or shared PostGIS instance
  const connString = process.env.PGCONNSTRING_QLD || process.env.PGCONNSTRING;
  if (!connString) return null;

  let pg;
  try { pg = require('pg'); } catch { return null; }

  const client = new pg.Client({ connectionString: connString });
  try {
    await client.connect();
    const res = await client.query(
      `SELECT lot_area, shire_name, locality, tenure, parcel_typ, surv_ind, acc_code
       FROM qld_parcels
       WHERE ST_Contains(wkb_geometry, ST_SetSRID(ST_MakePoint($1, $2), 4326))
       LIMIT 1`,
      [lon, lat]
    );
    await client.end();
    return res.rows[0] || null;
  } catch (err) {
    try { await client.end(); } catch {}
    console.error('[qld-provider] PostGIS query error:', err.message);
    return null;
  }
}

// ── Main provider ─────────────────────────────────────────────────────

// ── Live QSpatial ArcGIS REST (no account required) ──────────────
// QSpatial LPPF: https://spatial-gis.information.qld.gov.au/arcgis/rest/services/PlanningCadastre/LandParcelPropertyFramework/MapServer
// Layer 0: Addresses   — locality, street, LGA
// Layer 1: Land Parcels — lot, plan, area
// NOTE: Layer 0 addresses require a 200m buffer for point intersect to work
const QSPATIAL_LPPF = 'https://spatial-gis.information.qld.gov.au/arcgis/rest/services/PlanningCadastre/LandParcelPropertyFramework/MapServer';

function buildQSpatialURL(layerId, lat, lon, outFields, bufferM) {
  const geom = encodeURIComponent(JSON.stringify({ x: lon, y: lat, spatialReference: { wkid: 4326 } }));
  const buf  = bufferM ? `&distance=${bufferM}&units=esriSRUnit_Meter` : '';
  return `${QSPATIAL_LPPF}/${layerId}/query`
    + `?geometry=${geom}&geometryType=esriGeometryPoint&inSR=4326`
    + buf
    + `&spatialRel=esriSpatialRelIntersects`
    + `&outFields=${outFields.join(',')}`
    + `&returnGeometry=false&f=json`;
}

async function fetchWithTimeout(url, ms) {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'SiteVerdict-National/1.0' },
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

async function queryQSpatialAddresses(lat, lon) {
  try {
    const url = buildQSpatialURL(0, lat, lon, ['LOCALITY_NAME','LGA_NAME','STREET_NAME'], 200);
    const res = await fetchWithTimeout(url, 9000);
    if (!res.ok) return null;
    const d = await res.json();
    const feats = (d.features || []);
    if (!feats.length) return null;
    return feats[0].attributes;
  } catch { return null; }
}

async function queryQSpatialParcels(lat, lon) {
  try {
    const url = buildQSpatialURL(1, lat, lon, ['LOT','PLAN','AREA_M2','LGA_NAME'], 200);
    const res = await fetchWithTimeout(url, 9000);
    if (!res.ok) return null;
    const d = await res.json();
    const feats = (d.features || []);
    if (!feats.length) return null;
    return feats[0].attributes;
  } catch { return null; }
}

async function run(geocodeResult) {
  const hasPostGIS = !!(process.env.PGCONNSTRING_QLD || process.env.PGCONNSTRING);

  // ── STUB: no PostGIS yet ──────────────────────────────────────────
  // ── Attempt live QSpatial API (no account required) ──────────────
  if (!hasPostGIS && geocodeResult && geocodeResult.found === true) {
    const lat = geocodeResult.lat;
    const lon = geocodeResult.lon;
    const [addrData, parcelData] = await Promise.allSettled([
      queryQSpatialAddresses(lat, lon),
      queryQSpatialParcels(lat, lon),
    ]);
    const addr   = addrData.status   === 'fulfilled' ? addrData.value   : null;
    const parcel = parcelData.status === 'fulfilled' ? parcelData.value : null;
    const lgaName    = (addr   && addr.LGA_NAME)    || (parcel && parcel.LGA_NAME)  || null;
    const locality   = (addr   && addr.LOCALITY_NAME) || null;
    const lotPlan    = (parcel && parcel.LOT && parcel.PLAN) ? `Lot ${parcel.LOT} ${parcel.PLAN}` : null;
    const areaM2     = parcel ? parcel.AREA_M2 : null;

    if (lgaName || locality || lotPlan) {
      const checkedFields = ['address', 'geocode_confidence'];
      if (lgaName)  checkedFields.push('council');
      if (locality) checkedFields.push('locality');
      if (lotPlan)  checkedFields.push('lot_plan');
      if (areaM2)   checkedFields.push('parcel_area');
      return {
        provider_name:      'Queensland (QSpatial Live — LGA + Cadastre)',
        jurisdiction:       'QLD',
        source_type:        'official_open_data',
        confidence:         'Medium',
        screening_label:    'Basic National Screening',
        checked_fields:     checkedFields,
        unavailable_fields: ['zone', 'overlays', 'min_lot_size', 'heritage', 'flood', 'bushfire'],
        result: {
          address_found:         true,
          matched_address:       geocodeResult.matchedAddr || null,
          geocode_confidence:    geocodeResult.confidence  || 'Unknown',
          jurisdiction_detected: 'QLD',
          council:               lgaName,
          locality,
          lot_plan:              lotPlan,
          parcel_area_m2:        areaM2 ? Math.round(areaM2) : null,
          planning_data: {
            zone:        null,
            zone_note:   'Queensland planning zones are not yet connected in this beta Site Check. Zones are held by 77 individual councils separately — no single state layer exists.',
            overlays:    null,
          },
        },
        warnings: [
          'Queensland planning zones, overlays, heritage and flood controls are not yet connected in this beta Site Check.',
          'Verify all planning controls with ' + (lgaName || 'the relevant council') + ' or at planning.qld.gov.au.',
          'Parcel and LGA data from QSpatial LPPF — indicative only, verify against current title.',
          'Based on available official, public, and verifiable data. Planning-risk context only.',
          'Professional verification required before purchase, finance, or development decisions.',
        ],
        attribution: 'Queensland cadastre data from QSCF (QSpatial) © State of Queensland. CC BY 4.0. Indicative only.',
        attribution_url: 'https://spatial-gis.information.qld.gov.au',
        raw_summary: { lga: lgaName, locality, lot_plan: lotPlan, area_m2: areaM2 },
        not_integrated: false,
      };
    }
    // Live API returned no data — fall through to stub
  }

  if (!hasPostGIS) {
    return {
      provider_name:   'Queensland (QSCF Cadastre — PostGIS pending)',
      jurisdiction:    'QLD',
      source_type:     'official_open_data',
      confidence:      'Low',
      screening_label: 'Basic National Screening',
      checked_fields:   ['address', 'geocode_confidence'],
      unavailable_fields: [
        'lot_area', 'council', 'locality',
        'zone', 'overlays', 'min_lot_size', 'heritage', 'flood', 'bushfire',
      ],
      result: {
        address_found:         geocodeResult ? geocodeResult.found === true : false,
        matched_address:       geocodeResult ? (geocodeResult.matchedAddr || null) : null,
        geocode_confidence:    geocodeResult ? (geocodeResult.confidence || 'Unknown') : 'Unknown',
        jurisdiction_detected: 'QLD',
        council:               null,
        planning_data:         null,
      },
      warnings: [
        // Cadastre status
        'Queensland parcel data (QSCF) has been received. PostGIS integration pending.',
        // Planning zones — the key honest statement
        'Planning zone not yet connected for Queensland. '
          + 'No single state planning zone layer exists for Queensland — '
          + 'zones are held by each of 77 individual councils separately. '
          + 'Verify with the relevant council or a licensed planner.',
        // Overlays
        'Planning overlays not yet connected for Queensland.',
        // Min lot size
        'Minimum lot size is embedded in individual council planning schemes — '
          + 'not available as a spatial layer for Queensland.',
        // Standard wording
        'Based on available official, public, and verifiable data.',
        'Planning-risk context only.',
        'Professional verification required before purchase, finance, or development decisions.',
        'Not a planning certificate, valuation, legal, financial, or investment advice.',
      ],
      attribution:     '\u00a9 State of Queensland (DNRMMRRD) 2026. CC BY 4.0.',
      attribution_url: 'https://www.data.qld.gov.au/dataset/cadastral-data-queensland-series',
      data_sources: {
        cadastre: {
          source_name: 'Queensland Spatial Cadastral Fabric (QSCF)',
          source_url:  'https://qldspatial.information.qld.gov.au/catalogue/',
          source_date: '25-05-2026',
          licence:     'CC BY 4.0',
          status:      'received — PostGIS load pending',
          fields_available: ['lot_area','shire_name','locality','tenure','parcel_typ'],
          fields_missing:   ['zone','overlays','min_lot_size','heritage','flood','bushfire'],
        },
        planning_zones: {
          source_name: 'QLD council planning schemes (77 councils)',
          source_url:  'https://planning.qld.gov.au/',
          licence:     'N/A',
          status:      'not connected — no single state layer exists for QLD',
          fields_available: [],
          fields_missing:   ['zone','overlay','min_lot_size'],
        },
      },
      raw_summary: {
        note:          'QLD provider stub. PGCONNSTRING_QLD not set. QSCF received 25-05-2026.',
        qscf_status:   'received — PostGIS load pending',
        planning_note: 'No single state QLD planning zone layer. 77 individual council schemes.',
      },
      not_integrated: true,
    };
  }
  // ── END STUB ──────────────────────────────────────────────────────

  // ── LIVE PATH (PostGIS active) ────────────────────────────────────
  if (!geocodeResult || geocodeResult.found !== true) {
    return {
      provider_name:   'Queensland (QSCF Cadastre)',
      jurisdiction:    'QLD',
      source_type:     'official_open_data',
      confidence:      'Low',
      screening_label: 'Basic National Screening',
      checked_fields:   ['address'],
      unavailable_fields: ['lot_area','council','zone','overlays','min_lot_size'],
      result: {
        address_found:         false,
        jurisdiction_detected: 'QLD',
        planning_data:         null,
      },
      warnings: [
        'Address could not be geocoded. No Queensland cadastral data available.',
        'Planning zone not yet connected for Queensland. Verify with the relevant council or licensed planner.',
        'Preliminary screening signal only. Professional verification required.',
      ],
      attribution:    '\u00a9 State of Queensland (DNRMMRRD) 2026. CC BY 4.0.',
      raw_summary:    { note: 'Geocode failed — QLD provider aborted.' },
      not_integrated: false,
    };
  }

  const parcel = await queryQLDPostGIS(geocodeResult.lat, geocodeResult.lon);

  const lotArea    = parcel ? parcel.lot_area   : null;
  const council    = parcel ? parcel.shire_name  : null;
  const locality   = parcel ? parcel.locality    : null;
  const tenure     = parcel ? parcel.tenure      : null;
  const parcelTyp  = parcel ? parcel.parcel_typ  : null;
  const surveyed   = parcel ? parcel.surv_ind    : null;
  const accCode    = parcel ? parcel.acc_code    : null;

  const checkedFields   = ['address', 'geocode_confidence'];
  const uncheckedFields = [];
  if (lotArea) checkedFields.push('lot_area'); else uncheckedFields.push('lot_area');
  if (council) checkedFields.push('council');  else uncheckedFields.push('council');
  // Planning zones always missing — honest statement
  uncheckedFields.push('zone', 'overlays', 'min_lot_size');

  let confidence = 'Low';
  if (geocodeResult.confidence === 'Verified' && lotArea && council) confidence = 'Medium';

  return {
    provider_name:   'Queensland (QSCF Cadastre)',
    jurisdiction:    'QLD',
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
      jurisdiction_detected: 'QLD',
      council,
      locality,
      planning_data: {
        lot_area:         lotArea  ? Math.round(lotArea) : null,
        lot_area_source:  'QSCF (QSpatial) — indicative only. Verify against title.',
        council,
        locality,
        tenure,
        parcel_type:      parcelTyp,
        surveyed,
        accuracy_code:    accCode,
        // Planning data always absent
        zone:             null,
        zone_note:        'Planning zone not yet connected for Queensland. '
                        + 'No single state planning zone layer exists. '
                        + 'Verify with the relevant council or a licensed planner.',
        overlays:         null,
        overlays_note:    'Planning overlays not yet connected for Queensland.',
        min_lot_size:     null,
        min_lot_note:     'Minimum lot size is in each council\'s planning scheme — '
                        + 'not available as a spatial layer for Queensland.',
      },
    },
    warnings: [
      'Planning zone not yet connected for Queensland. '
        + 'No single state planning zone layer exists. '
        + 'Verify with the relevant council or a licensed planner.',
      'Planning overlays not yet connected for Queensland.',
      !lotArea ? 'Parcel area not returned from QSCF cadastre.' : null,
      !council ? 'Council not returned from QSCF cadastre.' : null,
      'Cadastre data: QSCF (QSpatial) \u00a9 State of Queensland. CC BY 4.0. '
        + 'Indicative only — verify against title.',
      'Based on available official, public, and verifiable data. Planning-risk context only.',
      'Professional verification required before purchase, finance, or development decisions.',
      'Not a planning certificate, valuation, legal, financial, or investment advice.',
    ].filter(Boolean),
    attribution:     '\u00a9 State of Queensland (DNRMMRRD) 2026. CC BY 4.0.',
    attribution_url: 'https://www.data.qld.gov.au/dataset/cadastral-data-queensland-series',
    raw_summary: {
      lot_area:    lotArea,
      council:     council,
      locality:    locality,
      tenure:      tenure,
      parcel_type: parcelTyp,
      surveyed,
    },
    not_integrated: false,
  };
}

module.exports = { run };
