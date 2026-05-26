/**
 * SiteVerdict — Provider Registry
 *
 * Routes a geocoded address to the correct state/territory provider.
 * Providers must implement: async run(geocodeResult) → standardised result object
 *
 * To add a new provider:
 *   1. Create lib/providers/<state>.js following the nsw.js pattern.
 *   2. Import it below.
 *   3. Add it to PROVIDERS map.
 *   4. Update data-source-registry.js with sources for that jurisdiction.
 *
 * No API keys belong here. Keys go in process.env via Netlify UI.
 */

'use strict';

const actProvider      = require('./act');
const nswProvider      = require('./nsw');
const qldProvider      = require('./qld');
const vicProvider      = require('./vic');
const saProvider       = require('./sa');
const tasProvider      = require('./tas');
const fallbackProvider = require('./fallback');

// Map two-letter jurisdiction codes to their providers
const PROVIDERS = {
  ACT: actProvider,     // live: ACTmapi ArcGIS REST, no key
  NSW: nswProvider,     // live: NSW ePlanning + SIX Maps + Protection layers
  QLD: qldProvider,     // stub: QSCF cadastre received — PostGIS load pending; planning zones gap documented
  VIC: vicProvider,     // prepared — pending PostGIS load of Vicmap Planning GDB
  SA:  saProvider,      // stub — pending GeoJSON PostGIS integration
  TAS: tasProvider,     // live: LIST ArcGIS REST (zone + cadastre + LGA, CC BY 3.0 AU)
  // WA, NT — not yet integrated, fall through to fallback
};

/**
 * Detect jurisdiction from a geocode result.
 * Uses state component from Google address_components if available,
 * otherwise infers from postcode range.
 *
 * @param {object} geocodeResult  From geocode.js
 * @param {string} rawAddress     Original input address (for postcode extraction)
 * @returns {string}  Two-letter state code, or 'UNKNOWN'
 */
function detectJurisdiction(geocodeResult, rawAddress) {
  // 1. NSW is the primary supported state — bias towards it
  const addr = (geocodeResult && geocodeResult.matchedAddr) || rawAddress || '';
  const raw  = rawAddress || '';

  // Explicit state mentions in address
  if (/\bNSW\b/i.test(raw) || /\bNSW\b/i.test(addr))                return 'NSW';
  if (/\bVIC\b/i.test(raw) || /\bVictoria\b/i.test(raw))            return 'VIC';
  if (/\bQLD\b/i.test(raw) || /\bQueensland\b/i.test(raw))          return 'QLD';
  if (/\bSA\b\b/.test(raw)  || /\bSouth Australia\b/i.test(raw))    return 'SA';
  if (/\bWA\b/i.test(raw)   || /\bWestern Australia\b/i.test(raw))  return 'WA';
  if (/\bTAS\b/i.test(raw)  || /\bTasmania\b/i.test(raw))           return 'TAS';
  if (/\bNT\b/i.test(raw)   || /\bNorthern Territory\b/i.test(raw)) return 'NT';
  if (/\bACT\b/i.test(raw)  || /\bCanber/i.test(raw))               return 'ACT';

  // Postcode range inference (rough but reliable)
  const pcMatch = raw.match(/\b(\d{4})\b/) || addr.match(/\b(\d{4})\b/);
  if (pcMatch) {
    const pc = parseInt(pcMatch[1], 10);
    if ((pc >= 1000 && pc <= 2999) || (pc >= 200 && pc <= 299))  return 'NSW';  // incl. ACT 2600-2618
    if (pc >= 3000 && pc <= 3999)                                 return 'VIC';
    if (pc >= 4000 && pc <= 4999)                                 return 'QLD';
    if (pc >= 5000 && pc <= 5999)                                 return 'SA';
    if (pc >= 6000 && pc <= 6999)                                 return 'WA';
    if (pc >= 7000 && pc <= 7999)                                 return 'TAS';
    if (pc >= 800  && pc <= 899)                                  return 'NT';
    if (pc >= 2600 && pc <= 2618)                                 return 'ACT';
  }

  // If geocode matched address contains "NSW" or coordinate is in NSW bounding box
  if (geocodeResult && geocodeResult.lat && geocodeResult.lon) {
    const lat = geocodeResult.lat;
    const lon = geocodeResult.lon;
    if (lat >= -37.6 && lat <= -28.5 && lon >= 140.9 && lon <= 153.7) return 'NSW';
    if (lat >= -39.2 && lat <= -34.0 && lon >= 140.9 && lon <= 149.9) return 'VIC';
    if (lat >= -29.2 && lat <= -10.5 && lon >= 137.9 && lon <= 153.5) return 'QLD';
    if (lat >= -38.1 && lat <= -26.0 && lon >= 129.0 && lon <= 141.0) return 'SA';
    if (lat >= -35.2 && lat <= -13.7 && lon >= 113.2 && lon <= 129.1) return 'WA';
    if (lat >= -43.7 && lat <= -39.6 && lon >= 143.8 && lon <= 148.5) return 'TAS';
    if (lat >= -26.1 && lat <= -10.9 && lon >= 129.0 && lon <= 138.0) return 'NT';
    if (lat >= -35.9 && lat <= -35.1 && lon >= 148.7 && lon <= 149.4) return 'ACT';
  }

  return 'UNKNOWN';
}

/**
 * Route to the correct provider and run it.
 *
 * @param {string} rawAddress     Original address input
 * @param {object} geocodeResult  Result from geocode.js
 * @returns {object}  Standard provider result + jurisdiction metadata
 */
async function runProvider(rawAddress, geocodeResult) {
  const jurisdiction = detectJurisdiction(geocodeResult, rawAddress);
  const provider     = PROVIDERS[jurisdiction] || null;

  let result;
  if (provider) {
    try {
      result = await provider.run(geocodeResult);
    } catch (err) {
      // Any unhandled provider error falls back safely
      console.error(`[national-site-check] Provider ${jurisdiction} threw:`, err.message);
      result = await fallbackProvider.run(jurisdiction, geocodeResult);
      result.provider_error = err.message;
    }
  } else {
    result = await fallbackProvider.run(jurisdiction, geocodeResult);
  }

  return {
    ...result,
    jurisdiction_detected: jurisdiction,
  };
}

module.exports = { detectJurisdiction, runProvider, PROVIDERS };
