/**
 * SiteVerdict — Fallback provider
 *
 * Returns a safe "not yet integrated" result for any state/territory
 * not yet supported. Used as a catch-all. Never crashes the site.
 *
 * Fields returned match the standard provider contract.
 */

'use strict';

const NOT_INTEGRATED = new Set(['QLD','WA','NT','ACT']);

/**
 * Run fallback provider for a given jurisdiction and geocode result.
 *
 * @param {string} jurisdiction  Two-letter state code (e.g. 'QLD')
 * @param {object} geocodeResult  Result from geocode function
 * @returns {object}  Standard provider result
 */
async function run(jurisdiction, geocodeResult) {
  const jur = (jurisdiction || 'UNKNOWN').toUpperCase();
  const isKnownNotIntegrated = NOT_INTEGRATED.has(jur);

  return {
    provider_name:      'SiteVerdict National Fallback',
    jurisdiction:       jur,
    source_type:        'fallback',
    confidence:         'Low',
    screening_label:    'Basic National Screening',
    checked_fields:     ['address', 'geocode_confidence', 'state_detected'],
    unavailable_fields: ['zone', 'min_lot_size', 'heritage', 'flood', 'bushfire',
                         'da_timeline', 'parcel_area', 'overlays'],
    result: {
      address_found:       geocodeResult ? geocodeResult.found === true : false,
      matched_address:     geocodeResult ? (geocodeResult.matchedAddr || null) : null,
      geocode_confidence:  geocodeResult ? (geocodeResult.confidence || 'Unknown') : 'Unknown',
      geocode_source:      geocodeResult ? (geocodeResult.source || 'Unknown') : 'Unknown',
      jurisdiction_detected: jur,
      planning_data:       null,
    },
    warnings: [
      isKnownNotIntegrated
        ? `${jur} planning data is not yet integrated into SiteVerdict. Basic address check only.`
        : `No planning data provider available for jurisdiction: ${jur}.`,
      'Zone, planning controls, overlays and DA timeline data are not available for this address.',
      'Preliminary screening signal only. Professional verification required.',
      'Some controls are not yet fully modelled.',
    ],
    raw_summary: {
      note: `Fallback result for ${jur}. No planning layer data available.`,
    },
    not_integrated: true,
  };
}

module.exports = { run };
