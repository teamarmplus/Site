/**
 * SiteVerdict — National Data Source Registry
 *
 * Each entry describes a data source, its jurisdiction, openness,
 * and what fields it can contribute to a Site Check result.
 *
 * source_type values:
 *   official_open_data   – public government data, no key required
 *   official_api         – government API, free but may require registration/key
 *   registered_free_api  – third-party free with registration (env var placeholder)
 *   fallback             – geocode-only, no planning data
 *
 * DO NOT add paid commercial APIs here (CoreLogic, PriceFinder, RP Data, etc.)
 * DO NOT hardcode any keys — use process.env placeholders only.
 */

'use strict';

const REGISTRY = [

  // ── NSW ────────────────────────────────────────────────────────
  {
    id:           'nsw_planning_portal',
    label:        'NSW Planning Portal',
    jurisdiction: 'NSW',
    source_type:  'official_open_data',
    base_url:     'https://mapprod3.environment.nsw.gov.au/arcgis/rest/services',
    key_env_var:  null,
    fields:       ['zone','min_lot_size','heritage','flood','bushfire','acid_sulfate',
                   'contaminated','riparian','land_reserve','foreshore','fsr','height'],
    confidence:   'High',
    notes:        'NSW ePlanning spatial APIs. No key required. Rate-limited.',
    live:         true,
  },
  {
    id:           'nsw_cadastre',
    label:        'NSW Cadastre (SIX Maps)',
    jurisdiction: 'NSW',
    source_type:  'official_open_data',
    base_url:     'https://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_Cadastre',
    key_env_var:  null,
    fields:       ['parcel_area','lot_number','dp_number'],
    confidence:   'High',
    notes:        'NSW Land Registry cadastre via SIX Maps REST API. No key required.',
    live:         true,
  },
  {
    id:           'nsw_eplanning_da',
    label:        'NSW ePlanning DA data (DA Leads)',
    jurisdiction: 'NSW',
    source_type:  'registered_free_api',
    base_url:     'https://api.daleads.com.au',
    key_env_var:  'DALEADS_API_KEY',
    fields:       ['da_timeline_median','da_count','da_comparables'],
    confidence:   'Medium',
    notes:        'DA timeline data via DA Leads API. Requires DALEADS_API_KEY env var.',
    live:         true,
  },

  // ── VIC ────────────────────────────────────────────────────────
  {
    id:           'vic_vicmap_property',
    label:        'Vicmap Property (DataVic)',
    jurisdiction: 'VIC',
    source_type:  'official_open_data',
    base_url:     'https://opendata.maps.vic.gov.au/geoserver/ows',
    key_env_var:  null,
    fields:       ['parcel_area','prop_id','council'],
    confidence:   'Medium',
    notes:        'Vicmap Property via DataVic WFS. No key required. Bulk download available. '
                + 'Point-in-polygon queries may require local tile server for production use.',
    live:         false, // prepared, not yet wired
  },
  {
    id:           'vic_planning_maps',
    label:        'VicPlan (Victorian Planning Maps)',
    jurisdiction: 'VIC',
    source_type:  'official_open_data',
    base_url:     'https://services2.land.vic.gov.au/gis/rest/services/SPEAR/MapServer',
    key_env_var:  null,
    fields:       ['zone','overlay','schedule'],
    confidence:   'Medium',
    notes:        'Victorian planning zones and overlays via DELWP SPEAR REST service. '
                + 'Register at https://planning.vic.gov.au/planning-schemes/planning-maps for terms.',
    live:         false, // prepared, not yet wired
  },

  // ── SA ─────────────────────────────────────────────────────────
  {
    id:           'sa_pdc',
    label:        'SA Planning and Design Code (PlanSA)',
    jurisdiction: 'SA',
    source_type:  'official_open_data',
    base_url:     'https://location.sa.gov.au/arcgis/rest/services/Planning/Planning/MapServer',
    key_env_var:  null,
    fields:       ['zone','overlay','policy_area'],
    confidence:   'Medium',
    notes:        'SA Planning and Design Code spatial REST API via SAILIS/PlanSA. '
                + 'Open data. See https://plan.sa.gov.au/planning_and_design_code for coverage.',
    live:         false, // prepared, not yet wired
  },

  // ── TAS ────────────────────────────────────────────────────────
  {
    id:           'tas_list_planning_zones',
    label:        'TAS Tasmanian Planning Scheme Zones (theLIST)',
    jurisdiction: 'TAS',
    source_type:  'official_open_data',
    base_url:     'https://services.thelist.tas.gov.au/arcgis/rest/services/Public/PlanningOnline/MapServer',
    key_env_var:  null,
    fields:       ['zone_no','zone_label','lps_ref'],
    confidence:   'Medium',
    notes:        'Layer 13: Tasmanian Planning Scheme Zones. Authorised under s80M LUPAA. '
                + 'Licence: metadata check recommended. '
                + 'Attribution: Tasmanian Planning Scheme Zones from theLIST © State of Tasmania. '
                + 'T&Cs: listdata.thelist.tas.gov.au/public/LISTWebServicesTermsConditions.pdf',
    live:         true,
  },
  {
    id:           'tas_list_cadastre',
    label:        'TAS Cadastral Parcels (theLIST)',
    jurisdiction: 'TAS',
    source_type:  'official_open_data',
    base_url:     'https://services.thelist.tas.gov.au/arcgis/rest/services/Public/CadastreAndAdministrative/MapServer',
    key_env_var:  null,
    fields:       ['pid','parcel_area','prop_add'],
    confidence:   'Medium',
    notes:        'Layer 38: CC BY 3.0 AU CONFIRMED in Copyright Text. '
                + 'Attribution: Cadastral Parcels from theLIST © State of Tasmania. '
                + 'NOTE: PID links to VISTAS/TASFOL (title/valuation) — do not query those systems.',
    live:         true,
  },
  {
    id:           'tas_list_lga',
    label:        'TAS Local Government Areas (theLIST)',
    jurisdiction: 'TAS',
    source_type:  'official_open_data',
    base_url:     'https://services.thelist.tas.gov.au/arcgis/rest/services/Public/CadastreAndAdministrative/MapServer',
    key_env_var:  null,
    fields:       ['lga_name','lga_code'],
    confidence:   'High',
    notes:        'Layer 4: 29 Tasmania municipalities. Gazetted 1993. '
                + 'Attribution: Local Government Areas from theLIST © State of Tasmania. '
                + 'Metadata check recommended at thelist.tas.gov.au/app/content/data.',
    live:         true,
  },
  {
    id:           'tas_list_overlays',
    label:        'TAS TPS Code Overlay (theLIST) — PENDING',
    jurisdiction: 'TAS',
    source_type:  'official_open_data',
    base_url:     'https://services.thelist.tas.gov.au/arcgis/rest/services/Public/PlanningOnline/MapServer',
    key_env_var:  null,
    fields:       ['overlay_name'],
    confidence:   'Low',
    notes:        'Layer 14: OV_NAME field. Copyright Text EMPTY in REST service. '
                + 'Licence clarification pending — email listhelp@nre.tas.gov.au. '
                + 'Do NOT use until CC BY 3.0 AU confirmed.',
    live:         false,
  },

  // ── QLD ────────────────────────────────────────────────────────
  // ── QSCF: cadastre layer — confirmed CC BY 4.0, received 25-05-2026 ──
  // DO NOT commit raw GDB/GeoJSON to public GitHub.
  // Process offline → PostGIS → backend query only.
  {
    id:           'qld_qscf_cadastre',
    label:        'QLD Spatial Cadastral Fabric (QSCF) — whole of state',
    jurisdiction: 'QLD',
    source_type:  'official_open_data',
    base_url:     'https://qldspatial.information.qld.gov.au/catalogue/',
    key_env_var:  null,
    fields:       ['lot_area','shire_name','locality','tenure','parcel_typ','surv_ind','acc_code'],
    confidence:   'Medium',
    notes:        'CADASTRE ONLY — not a planning dataset. '
                + 'File: DP_QLD_QSCF_WOS_CUR.zip received 25-05-2026 via QSpatial order '
                + 'JobID: 20260525_175309737236-17072. '
                + 'Licence: CC BY 4.0 confirmed (QLD DNRMMRRD). Commercial use permitted. '
                + 'Attribution: © State of Queensland (DNRMMRRD) 2026. CC BY 4.0. '
                + 'Integration method: ogr2ogr → PostGIS (PGCONNSTRING_QLD env var). '
                + 'Available fields: lot_area (m²), shire_name (LGA), locality (suburb), '
                + 'tenure, parcel_typ, surv_ind, acc_code. '
                + 'NOT available: planning zones, overlays, min lot size, heritage, flood, bushfire. '
                + 'Download available until 01/06/2026 — re-order from QSpatial when needed. '
                + 'Data update cadence: weekly (QSCF replaces DCDB as of April 2026). '
                + 'DCDB remains available as reference until 2027.',
    live:         false,  // activate when PGCONNSTRING_QLD is set and PostGIS is loaded
  },
  // ── QLD planning zones: NO SINGLE STATE LAYER EXISTS ─────────────────
  // QLD planning zones are held by each of 77 individual councils separately.
  // There is no unified state-level planning zone dataset.
  // Each council maintains its own planning scheme under the Planning Act 2016.
  // Workaround options (none suitable for automated Site Check yet):
  //   - MapsOnline API: asynchronous email delivery — not real-time
  //   - Individual council GIS APIs: 77 separate integrations required
  //   - State Planning Policy overlays (env.qld.gov.au): partial coverage only
  // Status: SAVE_FOR_LATER — no viable automated integration path currently.
  {
    id:           'qld_planning_zones',
    label:        'QLD Planning Zones — council-by-council (not yet integrated)',
    jurisdiction: 'QLD',
    source_type:  'fallback',
    base_url:     null,
    key_env_var:  null,
    fields:       [],
    confidence:   'Low',
    notes:        'NO single state planning zone layer for QLD. '
                + '77 individual council schemes under Planning Act 2016. '
                + 'MapsOnline API is asynchronous (email delivery) — not suitable for live Site Check. '
                + 'Show honest not-connected message for QLD planning zones. '
                + 'Verify at planning.qld.gov.au or with the relevant council.',
    live:         false,
  },

  // ── WA ─────────────────────────────────────────────────────────
  {
    id:           'wa_slip',
    label:        'WA Shared Land Information Platform (SLIP)',
    jurisdiction: 'WA',
    source_type:  'official_api',
    base_url:     'https://services.slip.wa.gov.au/public',
    key_env_var:  'WA_SLIP_API_KEY',
    fields:       ['zone','parcel','reserve'],
    confidence:   'Low',
    notes:        'WA SLIP public datasets. Free SLIP account required. '
                + 'Set WA_SLIP_API_KEY when registered. Not yet integrated.',
    live:         false,
  },

  // ── NT ─────────────────────────────────────────────────────────
  {
    id:           'nt_ntlis',
    label:        'NT Land Information System (NTLIS)',
    jurisdiction: 'NT',
    source_type:  'official_open_data',
    base_url:     'https://opendata.nt.gov.au',
    key_env_var:  null,
    fields:       ['zone','lot'],
    confidence:   'Low',
    notes:        'NT spatial data via Open Data portal. '
                + 'Not yet integrated — returns not_integrated status.',
    live:         false,
  },

  // ── ACT ────────────────────────────────────────────────────────
  {
    id:           'act_actmapi',
    label:        'ACT ACTMAPI',
    jurisdiction: 'ACT',
    source_type:  'official_open_data',
    base_url:     'https://www.actmapi.act.gov.au/actmapi/index.html',
    key_env_var:  null,
    fields:       ['zone','territory_plan_overlay'],
    confidence:   'Low',
    notes:        'ACT Territory Plan zones via ACTMAPI. '
                + 'Not yet integrated — returns not_integrated status.',
    live:         false,
  },

];

/**
 * Get registry entry for a jurisdiction.
 * Returns array because a jurisdiction may have multiple sources.
 */
function getSources(jurisdiction) {
  if (!jurisdiction) return [];
  return REGISTRY.filter(s => s.jurisdiction === (jurisdiction || '').toUpperCase());
}

/**
 * Get all live sources for a jurisdiction.
 */
function getLiveSources(jurisdiction) {
  return getSources(jurisdiction).filter(s => s.live);
}

/**
 * Summary metadata for a jurisdiction (for UI "what we checked" display).
 */
function getJurisdictionMeta(jurisdiction) {
  const all  = getSources(jurisdiction);
  const live = all.filter(s => s.live);
  return {
    jurisdiction:   (jurisdiction || '').toUpperCase(),
    total_sources:  all.length,
    live_sources:   live.length,
    sources:        all.map(s => ({
      id:          s.id,
      label:       s.label,
      source_type: s.source_type,
      live:        s.live,
      fields:      s.fields,
      confidence:  s.confidence,
      notes:       s.notes,
    })),
  };
}

module.exports = { REGISTRY, getSources, getLiveSources, getJurisdictionMeta };
