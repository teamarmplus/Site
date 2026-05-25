/**
 * SiteVerdict — South Australia provider
 *
 * ── STATUS: STUB — requires GeoJSON download and PostGIS before live use ──
 *
 * Data sources (all CC BY 4.0, no registration, no key):
 *   Zones:    www.dptiapps.com.au/dataportal/PDCodeZones_geojson.zip
 *   Subzones: www.dptiapps.com.au/dataportal/PDCodeSubzones_geojson.zip
 *   Overlays: www.dptiapps.com.au/dataportal/PDCodeOverlays_geojson.zip
 *
 *   Catalogue: data.sa.gov.au/data/dataset/planning-and-design-code-zones
 *   Licence:   CC BY 4.0 — commercial use permitted
 *   Update:    Fortnightly by SA Department for Housing and Urban Development
 *
 * ── Integration plan (before this can go live) ───────────────────
 *
 * Step 1 — Download and extract
 *   Download all three GeoJSON zips from dptiapps.com.au/dataportal/
 *   Extract into a working directory
 *   Do NOT commit large GeoJSON files to the repo
 *
 * Step 2 — Load into PostGIS
 *   CREATE TABLE sa_pdc_zones     (gid serial, name text, geometry geometry(MultiPolygon, 4326));
 *   CREATE TABLE sa_pdc_subzones  (gid serial, name text, geometry geometry(MultiPolygon, 4326));
 *   CREATE TABLE sa_pdc_overlays  (gid serial, name text, overlay_type text, geometry geometry(MultiPolygon, 4326));
 *   ogr2ogr -f "PostgreSQL" PG:... PDCodeZones.geojson -nln sa_pdc_zones -t_srs EPSG:4326
 *   (repeat for subzones and overlays)
 *
 * Step 3 — Create a PostGIS query Netlify function
 *   SA queries are point-in-polygon against self-hosted PostGIS
 *   Not against an external REST API (no live SA REST confirmed stable)
 *   Store PostGIS connection string as env var: PGCONNSTRING (server-side only, never in frontend)
 *
 * Step 4 — Field names (confirmed from SAPPA ArcGIS service)
 *   Zone name field:    "name"   (e.g. "General Neighbourhood", "Urban Corridor (Living)")
 *   Subzone name field: "name"
 *   Overlay name field: "name" (type indicated by which layer the feature is in)
 *
 * Step 5 — Min lot size
 *   NOT a spatial field in SA. Embedded in P&D Code policy text per zone.
 *   Build a manual lookup table: zone name → typical range
 *   Show: "See P&D Code policy for min lot — varies by zone and subzone"
 *
 * Step 6 — Attribution
 *   "Planning and Design Code data © Government of South Australia.
 *    Licensed under Creative Commons Attribution 4.0 International.
 *    Source: data.sa.gov.au"
 *
 * ── Safe wording ──────────────────────────────────────────────────
 *   "SA Planning and Design Code data — indicator only.
 *    Professional verification required.
 *    Not a Development Assessment notification."
 *
 * ── Test address ──────────────────────────────────────────────────
 *   "15 Wattle Street, Fullarton SA 5063" — expect: General Neighbourhood zone
 *   "10 King William Street, Adelaide SA 5000" — expect: Capital City or Urban Activity Centre zone
 */

'use strict';

/**
 * Run SA provider — currently returns "not yet integrated" with plan stub.
 * This will be replaced once GeoJSON data is loaded into PostGIS.
 *
 * @param {object} geocodeResult  From geocode.js
 * @returns {object}  Standard provider result
 */
async function run(geocodeResult) {
  return {
    provider_name:      'South Australia (PlanSA / SA P&D Code)',
    jurisdiction:       'SA',
    source_type:        'official_open_data',
    confidence:         'Low',
    screening_label:    'Basic National Screening',
    checked_fields:     ['address', 'geocode_confidence'],
    unavailable_fields: ['zone', 'subzone', 'overlays', 'parcel_area', 'min_lot_size'],
    result: {
      address_found:        geocodeResult ? geocodeResult.found === true : false,
      matched_address:      geocodeResult ? (geocodeResult.matchedAddr || null) : null,
      geocode_confidence:   geocodeResult ? (geocodeResult.confidence || 'Unknown') : 'Unknown',
      jurisdiction_detected: 'SA',
      planning_data:        null,
    },
    warnings: [
      'South Australia Planning and Design Code data is in preparation. Basic address check only.',
      'SA P&D Code zones and overlays require GeoJSON download and PostGIS before live integration.',
      'Data available at data.sa.gov.au — CC BY 4.0, no registration required.',
      'Preliminary screening signal only. Professional verification required.',
      'Some controls are not yet fully modelled.',
    ],
    raw_summary: {
      note: 'SA provider stub — GeoJSON PostGIS integration pending.',
      data_source: 'data.sa.gov.au/data/dataset/planning-and-design-code-zones',
      licence: 'CC BY 4.0',
      integration_plan: 'See provider comments for full steps.',
    },
    not_integrated: true,
  };
}

module.exports = { run };
