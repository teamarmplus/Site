/**
 * SiteVerdict — National Site Check Function
 *
 * Endpoint: /.netlify/functions/national-site-check?address=<addr>&landSize=<m2>
 *
 * Architecture:
 *   1. Geocode address (via existing geocode.js logic, reused here server-side)
 *   2. Detect jurisdiction from geocode result
 *   3. Route to jurisdiction-specific provider (NSW, VIC, SA, TAS or fallback)
 *   4. Return standardised result with confidence labels, checked/unchecked fields,
 *      warnings and "what we checked / what we could not check" summary
 *
 * Security:
 *   - All API keys in process.env only (never in response body)
 *   - Graceful timeout + error handling on every external call
 *   - No large raw payloads — only raw_summary
 *
 * UI labels:
 *   - "Basic National Screening"
 *   - "Preliminary screening signal only."
 *   - "Professional verification required."
 *   - Confidence: High / Medium / Low / Not available
 *
 * DO NOT add: paid APIs, scrapers, or hardcoded keys.
 * DO NOT expose: GOOGLE_MAPS_API_KEY, ANTHROPIC_API_KEY, DALEADS_API_KEY
 */

'use strict';

const { runProvider, detectJurisdiction } = require('./lib/providers/index');
const { getJurisdictionMeta }             = require('./lib/data-source-registry');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
};

const GEOCODE_TIMEOUT_MS = 8000;

// ── Internal geocode call ─────────────────────────────────────────
// Re-uses the existing geocode.js logic via HTTP to the same function.
// Keys remain server-side; this call is internal only.

async function geocodeAddress(address, siteUrl) {
  const url = `${siteUrl}/.netlify/functions/geocode?address=${encodeURIComponent(address)}`;
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), GEOCODE_TIMEOUT_MS);
  try {
    const res  = await fetch(url, { headers: { 'User-Agent': 'SiteVerdict-National/1.0' }, signal: ctrl.signal });
    const data = await res.json();
    return data;
  } catch (e) {
    return { found: false, reason: `Geocode error: ${e.message}`, addressQuality: 'failed' };
  } finally {
    clearTimeout(timer);
  }
}

// ── Confidence label mapping ──────────────────────────────────────
function confidenceLabel(raw) {
  const map = { High: 'High', Medium: 'Medium', Low: 'Low' };
  return map[raw] || 'Not available';
}

// ── Handler ───────────────────────────────────────────────────────
exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' };
  }

  const params  = event.queryStringParameters || {};
  const address = (params.address || '').trim();
  const landSize = params.landSize ? parseFloat(params.landSize) : null;

  if (!address) {
    return {
      statusCode: 400,
      headers: CORS,
      body: JSON.stringify({
        error:   'Address parameter required',
        example: '/.netlify/functions/national-site-check?address=148+Canley+Vale+Road+NSW+2166',
      }),
    };
  }

  // Determine site URL for internal geocode call
  const host   = (event.headers && (event.headers.host || event.headers['x-forwarded-host'])) || '';
  const proto  = (event.headers && event.headers['x-forwarded-proto']) || 'https';
  const siteUrl = host ? `${proto}://${host}` : 'https://siteverdict2.netlify.app';

  try {
    // Step 1: Geocode
    const geocodeResult = await geocodeAddress(address, siteUrl);

    // Step 2: Detect jurisdiction early (for metadata even if geocode fails)
    const jurisdiction = detectJurisdiction(geocodeResult, address);

    // Step 3: Run provider
    const providerResult = await runProvider(address, geocodeResult);

    // Step 4: Get data source metadata for this jurisdiction
    const jurisdictionMeta = getJurisdictionMeta(jurisdiction);

    // Step 5: Build UI summary
    const checkedSummary   = providerResult.checked_fields   || [];
    const uncheckedSummary = providerResult.unavailable_fields || [];
    const confidence       = confidenceLabel(providerResult.confidence);

    // Safe: do not include API keys or internal tokens in response
    const response = {
      // ── Meta ─────────────────────────────────────────────────
      screening_label:     'Basic National Screening',
      build:               'sitecheck-expanded-report-2026-05-22',
      checked_at:          new Date().toISOString(),

      // ── Address ──────────────────────────────────────────────
      entered_address:     address,
      matched_address:     geocodeResult.matchedAddr || null,
      address_found:       geocodeResult.found === true,
      address_confidence:  geocodeResult.confidence || 'Unknown',
      geocode_source:      geocodeResult.source || 'Unknown',
      address_quality:     geocodeResult.addressQuality || 'unknown',

      // ── Jurisdiction ─────────────────────────────────────────
      jurisdiction_detected:  jurisdiction,
      jurisdiction_supported: !!providerResult && !providerResult.not_integrated,
      provider:               providerResult.provider_name || 'Unknown',

      // ── Land size (user input only — never from paid data) ───
      land_size_entered:    landSize ? `${landSize}m²` : null,
      land_size_source:     landSize ? 'Entered by user — verify against title, contract or survey' : 'Not provided',

      // ── Planning data ─────────────────────────────────────────
      planning_data:        providerResult.result ? providerResult.result.planning_data : null,

      // ── Confidence ───────────────────────────────────────────
      overall_confidence:  confidence,
      source_type:         providerResult.source_type || 'fallback',

      // ── Transparency ─────────────────────────────────────────
      what_we_checked:    checkedSummary,
      what_we_could_not_check: uncheckedSummary,

      // ── Data source metadata ─────────────────────────────────
      data_sources: jurisdictionMeta,

      // ── Warnings ─────────────────────────────────────────────
      warnings: [
        ...(providerResult.warnings || []),
        'Preliminary screening signal only.',
        'Professional verification required before any property, planning, finance, purchase or construction decision.',
        geocodeResult.found === false
          ? `Address not matched: ${geocodeResult.reason || 'Unknown reason'}`
          : null,
      ].filter(Boolean),

      // ── Raw summary (no large payloads) ──────────────────────
      raw_summary: providerResult.raw_summary || null,

      // ── Disclosures ───────────────────────────────────────────
      disclaimers: [
        'Not legal advice. Not planning advice. Not financial advice. Not investment advice.',
        'Not a Section 10.7 Planning Certificate.',
        'Some controls are not yet fully modelled.',
        'Data sourced from free/open government APIs. Accuracy not guaranteed.',
        'Professional verification required before any reliance.',
      ],
    };

    return {
      statusCode: 200,
      headers:    CORS,
      body:       JSON.stringify(response, null, 2),
    };

  } catch (err) {
    console.error('[national-site-check] Unhandled error:', err.message);
    return {
      statusCode: 500,
      headers:    CORS,
      body:       JSON.stringify({
        error:            'Internal error in national site check.',
        message:          err.message,
        screening_label:  'Basic National Screening',
        warnings:         ['Preliminary screening signal only.',
                           'Professional verification required.'],
        disclaimers:      ['Not legal, planning, financial or investment advice.'],
      }),
    };
  }
};
