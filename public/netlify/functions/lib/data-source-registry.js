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
    id:           'tas_list',
    label:        'TAS LIST ArcGIS REST (Land Information System Tasmania)',
    jurisdiction: 'TAS',
    source_type:  'official_open_data',
    base_url:     'https://services.thelist.tas.gov.au/arcgis/rest/services',
    key_env_var:  null,
    fields:       ['zone','parcel_id','parcel_area'],
    confidence:   'Medium',
    notes:        'TAS LIST public ArcGIS REST services. No key required. '
                + 'Consult https://www.thelist.tas.gov.au for terms of use.',
    live:         false, // prepared, not yet wired
  },

  // ── QLD ────────────────────────────────────────────────────────
  {
    id:           'qld_dams',
    label:        'QLD Development Assessment Management System (DAMS)',
    jurisdiction: 'QLD',
    source_type:  'official_api',
    base_url:     'https://api.prod.qldgov.co/arcgis/rest/services',
    key_env_var:  'QLD_SPATIAL_API_KEY',
    fields:       ['zone','overlay'],
    confidence:   'Low',
    notes:        'QLD State Planning Policy zones via QSpatial. '
                + 'Free registration required. Set QLD_SPATIAL_API_KEY env var when ready. '
                + 'Not yet integrated — returns not_integrated status.',
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
