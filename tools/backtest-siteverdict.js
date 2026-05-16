#!/usr/bin/env node
/**
 * SiteVerdict — Batch Validation / Backtesting Tool
 *
 * Tests SiteVerdict's rule-based scoring against real historical NSW DAs.
 *
 * Usage:
 *   node tools/backtest-siteverdict.js [options]
 *
 * Options:
 *   --limit N          Process N rows (default: 10)
 *   --dry-run          Print plan without calling any API
 *   --no-paid-api      Skip DA Leads; use only free government APIs
 *   --no-ai            No Claude calls (always true; AI never used in batch)
 *   --input FILE       Input CSV path (default: data/backtest-input.csv)
 *   --output FILE      Output CSV path (default: data/backtest-results.csv)
 *   --resume           Skip rows that already have a result in output CSV
 *   --delay-ms N       Delay between API requests in ms (default: 1200)
 *
 * Safety defaults:
 *   - No AI (always)
 *   - No paid API (unless omitted)
 *   - Limit 10 (unless specified)
 *   - Rate limited: 1 request per --delay-ms ms
 *
 * Examples:
 *   node tools/backtest-siteverdict.js --limit 10 --no-paid-api --dry-run
 *   node tools/backtest-siteverdict.js --limit 100 --no-paid-api
 *   node tools/backtest-siteverdict.js --limit 1000
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const { geocodeAddress, fetchPlanningData, parsePlanningData, delay } = require('./lib/api-client');
const { scoreProperty, verdictLabelFromScore, scoreRangeBand, getCouncilMatch } = require('./lib/scoring');

// ── CLI ARGS ──────────────────────────────────────────────────────

const args = process.argv.slice(2);
const getArg = (flag, def) => {
  const i = args.indexOf(flag);
  return i > -1 ? args[i + 1] : def;
};
const hasFlag = flag => args.includes(flag);

const LIMIT       = parseInt(getArg('--limit', '10'), 10);
const DRY_RUN     = hasFlag('--dry-run');
const NO_PAID_API = hasFlag('--no-paid-api');
const RESUME      = hasFlag('--resume');
const DELAY_MS    = parseInt(getArg('--delay-ms', '1200'), 10);
const INPUT_FILE  = getArg('--input',  path.join(__dirname, '../data/backtest-input.csv'));
const OUTPUT_FILE = getArg('--output', path.join(__dirname, '../data/backtest-results.csv'));
const SUMMARY_FILE = OUTPUT_FILE.replace('.csv', '-summary.json');
const REPORT_FILE  = OUTPUT_FILE.replace('.csv', '-report.md');

// ── CSV HELPERS ───────────────────────────────────────────────────

function parseCSV(raw) {
  const lines = raw.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g,''));
  return lines.slice(1).filter(l => l.trim()).map(line => {
    // Handle quoted fields
    const vals = [];
    let cur = '', inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; }
      else if (ch === ',' && !inQ) { vals.push(cur.trim()); cur = ''; }
      else cur += ch;
    }
    vals.push(cur.trim());
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] || '']));
  });
}

function toCSVRow(obj) {
  return Object.values(obj).map(v => {
    const s = String(v == null ? '' : v);
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? '"' + s.replace(/"/g, '""') + '"' : s;
  }).join(',');
}

// ── RESULT COMPARISON ─────────────────────────────────────────────

function calcTimeline(lodgement, determination) {
  if (!lodgement || !determination) return null;
  try {
    const d1 = new Date(lodgement);
    const d2 = new Date(determination);
    return Math.round((d2 - d1) / 86400000);
  } catch { return null; }
}

function compareResult(svResult, row) {
  const realStatus = (row.da_status || '').toLowerCase();
  const realLots   = parseInt(row.lots_or_dwellings || row.lots || '0', 10) || 0;
  const daTimeline = calcTimeline(row.lodgement_date, row.determination_date)
    || parseInt(row.approval_days || '0', 10) || null;

  const approved = realStatus.includes('approved') || realStatus.includes('determined');
  const refused  = realStatus.includes('refused') || realStatus.includes('rejected');
  const withdrawn= realStatus.includes('withdrawn');

  // Match: SiteVerdict score >= 65 AND real outcome was approved
  const svPositive = svResult.score >= 65;
  const match = (svPositive && approved) || (!svPositive && (refused || withdrawn))
    ? 'MATCH' : 'MISMATCH';

  // Flag false positives (high score, bad outcome) and negatives
  let flag = '';
  if (svResult.score >= 65 && refused) flag = 'FALSE_POSITIVE';
  else if (svResult.score >= 65 && withdrawn) flag = 'FALSE_POSITIVE_WITHDRAWN';
  else if (svResult.score < 50 && approved) flag = 'FALSE_NEGATIVE';
  else if (match === 'MATCH') flag = 'CORRECT';
  else flag = 'UNCERTAIN';

  // Timeline comparison
  let timelineNote = '';
  if (daTimeline && svResult.councilDays) {
    const diff = Math.abs(daTimeline - svResult.councilDays);
    timelineNote = diff <= 30 ? 'TIMELINE_ACCURATE' : `TIMELINE_DIFF_${diff}D`;
  }

  return { approved, refused, withdrawn, realLots, daTimeline, match, flag, timelineNote };
}

// ── MAIN PROCESS ROW ─────────────────────────────────────────────

async function processRow(row, idx, total, existingAddresses) {
  const address = [row.address, row.suburb, row.postcode].filter(Boolean).join(', ');
  const council = row.council || '';

  console.log(`\n[${idx+1}/${total}] ${address} (${council})`);

  // Helper: build error/skip return object
  const errRow = (sv_score, sv_verdict, flag, notes, lat='', lon='', coord_src='failed') => ({
    address, council,
    real_da_status:    row.da_status || '',
    real_lots:         row.lots_or_dwellings || row.lots || '',
    real_timeline_days:'',
    sv_score, sv_verdict, sv_band: '', sv_lots: '',
    zone: '', mls: '', mls_real: '', block: '', zone_allows: '',
    planning_strength: '', overlay_risk: '', yield_potential: '',
    approval_confidence: '', holding_cost_risk: '', council_complexity: '',
    overlay_flags: '', council_days: '', council_name: '',
    match: sv_score === 'DRY_RUN' ? 'DRY_RUN' : 'ERROR',
    flag, timeline_note: '',
    coordinate_source: coord_src,
    notes,
    geocode_lat: lat, geocode_lon: lon,
  });

  if (DRY_RUN) {
    console.log('  [DRY RUN] skipping API calls');
    return errRow('DRY_RUN', 'DRY_RUN', 'DRY_RUN', 'dry-run: no API calls made', '', '', 'dry_run');
  }

  // ── Coordinate resolution ─────────────────────────────────────────
  // If the input CSV has lat/lng columns, use them directly.
  // This avoids geocoding imprecision and is preferred for validated DA records.
  let geo = null;
  let coordSource = 'failed';
  let coordNote   = '';

  const inputLat = parseFloat(row.lat || row.latitude || '');
  const inputLon = parseFloat(row.lng || row.lon || row.longitude || '');

  if (!isNaN(inputLat) && !isNaN(inputLon) && inputLat !== 0 && inputLon !== 0) {
    geo = { lat: inputLat, lon: inputLon };
    coordSource = 'input_lat_lng';
    console.log('  [geo] using input lat/lng: ' + inputLat.toFixed(5) + ', ' + inputLon.toFixed(5));
  } else {
    try {
      geo = await geocodeAddress(address, DELAY_MS);
    } catch (e) {
      console.warn('  [geo] failed: ' + e.message);
      geo = null;
    }

    if (!geo) {
      console.warn('  [geo] no result — skipping');
      return errRow('ERROR', 'Geocode failed', 'GEOCODE_FAILED',
        'Geocode returned no result — add lat/lng columns to CSV for this row');
    }

    coordSource = 'geocoded';
    // Nominatim returns the address centroid, not the cadastral boundary.
    // For large or irregular lots the centroid may fall outside the actual parcel.
    coordNote = 'Geocoded — coordinate may not match DA site precisely; add lat/lng columns for accuracy';
    console.log('  [geo] geocoded: ' + geo.lat.toFixed(5) + ', ' + geo.lon.toFixed(5) + ' (use lat/lng columns for precision)');
  }

  // ── Fetch planning data ───────────────────────────────────────────
  let raw, parsed;
  try {
    raw    = await fetchPlanningData(geo.lat, geo.lon, { usePaidApi: !NO_PAID_API });
    parsed = parsePlanningData(raw, council);
    const overlayStr = [
      parsed.heritage ? 'H' : '',
      parsed.flood    ? 'FL' : '',
      parsed.bushfire ? 'BF' : '',
    ].filter(Boolean).join('') || 'clear';
    console.log('  [plan] zone=' + parsed.zone + ' mls=' + parsed.mls + ' block=' + parsed.block + 'm\u00b2 overlays=' + overlayStr);
  } catch (e) {
    console.warn('  [plan] failed: ' + e.message);
    return errRow('ERROR', 'API fetch failed', 'API_FAILED',
      e.message.slice(0, 100), geo.lat, geo.lon, coordSource);
  }

  // ── Score ─────────────────────────────────────────────────────────
  const sv = scoreProperty(parsed);
  console.log('  [score] ' + sv.score + ' (' + sv.band + ') | lots=' + sv.estimatedLots + ' | ' + sv.verdict);

  // ── Compare ───────────────────────────────────────────────────────
  const comp = compareResult(sv, row);

  return {
    address,
    council,
    real_da_status:       row.da_status || '',
    real_lots:            row.lots_or_dwellings || row.lots || '',
    real_timeline_days:   comp.daTimeline || '',
    sv_score:             sv.score,
    sv_verdict:           sv.verdict,
    sv_band:              sv.band,
    sv_lots:              sv.estimatedLots,
    zone:                 sv.zone,
    mls:                  sv.mls,
    mls_real:             sv.mlsReal ? 'YES' : 'NO',
    block:                sv.block,
    zone_allows:          sv.zoneAllows ? 'YES' : 'NO',
    planning_strength:    sv.planningStrength,
    overlay_risk:         sv.overlayRisk,
    yield_potential:      sv.yieldPotential,
    approval_confidence:  sv.approvalConfidence,
    holding_cost_risk:    sv.holdingCostRisk,
    council_complexity:   sv.councilComplexity,
    overlay_flags:        sv.overlayFlags,
    council_days:         sv.councilDays || '',
    council_name:         sv.councilName || council,
    match:                comp.match,
    flag:                 comp.flag,
    timeline_note:        comp.timelineNote,
    coordinate_source:    coordSource,
    notes:                coordNote,
    geocode_lat:          geo.lat,
    geocode_lon:          geo.lon,
  };
}

// ── SUMMARY METRICS ───────────────────────────────────────────────

function buildSummary(results) {
  const scored = results.filter(r => typeof r.sv_score === 'number');
  const errors = results.filter(r => r.sv_score === 'ERROR');
  const byBand = { STRONG:[], REVIEW:[], MODERATE:[], LIMITED:[], LOW:[] };
  const byCouncil = {};

  for (const r of scored) {
    const band = r.sv_band || 'LOW';
    (byBand[band] = byBand[band] || []).push(r);

    const c = r.council_name || r.council || 'UNKNOWN';
    if (!byCouncil[c]) byCouncil[c] = { scores:[], days:[], results:[] };
    byCouncil[c].scores.push(r.sv_score);
    if (r.real_timeline_days) byCouncil[c].days.push(Number(r.real_timeline_days));
    byCouncil[c].results.push(r);
  }

  const avg = arr => arr.length ? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length) : null;
  const median = arr => {
    if (!arr.length) return null;
    const s = [...arr].sort((a,b)=>a-b);
    const m = Math.floor(s.length/2);
    return s.length%2 ? s[m] : Math.round((s[m-1]+s[m])/2);
  };

  const approved = scored.filter(r => r.flag === 'CORRECT' && r.real_da_status && r.real_da_status.toLowerCase().includes('approved'));
  const refused  = scored.filter(r => r.real_da_status && (r.real_da_status.toLowerCase().includes('refused') || r.real_da_status.toLowerCase().includes('rejected')));
  const fp = scored.filter(r => r.flag === 'FALSE_POSITIVE' || r.flag === 'FALSE_POSITIVE_WITHDRAWN');
  const fn = scored.filter(r => r.flag === 'FALSE_NEGATIVE');
  const correct = scored.filter(r => r.flag === 'CORRECT');

  const bandSummary = {};
  for (const [band, rows] of Object.entries(byBand)) {
    const approvedCount = rows.filter(r => r.real_da_status && r.real_da_status.toLowerCase().includes('approved')).length;
    const days = rows.map(r => r.real_timeline_days).filter(Boolean).map(Number);
    bandSummary[band] = {
      count:          rows.length,
      approvedCount,
      approvalRate:   rows.length ? Math.round(approvedCount/rows.length*100) + '%' : 'n/a',
      avgScore:       avg(rows.map(r => r.sv_score)),
      medianTimeline: median(days),
    };
  }

  const councilSummary = Object.entries(byCouncil)
    .map(([name, d]) => ({
      council:      name,
      count:        d.results.length,
      avgScore:     avg(d.scores),
      medianSvDays: d.days.length ? median(d.days) : null,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  return {
    totalRows:    results.length,
    totalScored:  scored.length,
    totalErrors:  errors.length,
    totalCorrect: correct.length,
    accuracy:     scored.length ? Math.round(correct.length/scored.length*100) + '%' : 'n/a',
    avgScoreApproved: avg(approved.map(r => r.sv_score)),
    avgScoreRefused:  avg(refused.map(r => r.sv_score)),
    falsePositives:   fp.length,
    falseNegatives:   fn.length,
    bandSummary,
    councilSummary,
    generatedAt:  new Date().toISOString(),
  };
}

// ── REPORT ────────────────────────────────────────────────────────

function buildReport(summary, results) {
  const scored = results.filter(r => typeof r.sv_score === 'number');
  const fp = results.filter(r => r.flag === 'FALSE_POSITIVE' || r.flag === 'FALSE_POSITIVE_WITHDRAWN');
  const fn = results.filter(r => r.flag === 'FALSE_NEGATIVE');

  const top20Approved = scored
    .filter(r => r.real_da_status && r.real_da_status.toLowerCase().includes('approved'))
    .sort((a,b) => b.sv_score - a.sv_score)
    .slice(0, 20);

  const top20Refused = scored
    .filter(r => r.real_da_status && (r.real_da_status.toLowerCase().includes('refused') || r.real_da_status.toLowerCase().includes('rejected')))
    .sort((a,b) => b.sv_score - a.sv_score)
    .slice(0, 20);

  const bandTable = Object.entries(summary.bandSummary)
    .map(([band, d]) =>
      `| ${band.padEnd(10)} | ${String(d.count).padStart(5)} | ${String(d.approvedCount).padStart(8)} | ${d.approvalRate.padStart(11)} | ${String(d.avgScore||'n/a').padStart(8)} | ${String(d.medianTimeline||'n/a').padStart(14)} |`
    ).join('\n');

  const councilTable = summary.councilSummary.map(c =>
    `| ${c.council.padEnd(25)} | ${String(c.count).padStart(5)} | ${String(c.avgScore||'n/a').padStart(8)} | ${String(c.medianSvDays||'n/a').padStart(10)} |`
  ).join('\n');

  const topApprovedTable = top20Approved.map(r =>
    `| ${r.address.slice(0,35).padEnd(35)} | ${String(r.sv_score).padStart(5)} | ${r.sv_band.padEnd(8)} | ${r.real_da_status.slice(0,15).padEnd(15)} | ${String(r.real_timeline_days||'?').padStart(4)}d |`
  ).join('\n');

  const topRefusedTable = top20Refused.map(r =>
    `| ${r.address.slice(0,35).padEnd(35)} | ${String(r.sv_score).padStart(5)} | ${r.sv_band.padEnd(8)} | ${r.real_da_status.slice(0,15).padEnd(15)} | ${r.flag.padEnd(20)} |`
  ).join('\n');

  return `# SiteVerdict — Indicative Validation Report

Generated: ${summary.generatedAt}

---

## Methodology

This report compares SiteVerdict's automated rule-based scoring against historical NSW DA records.

**Data sources used:**
- NSW Planning Portal (zone, minimum lot size, overlays)
- NSW EPI Flood Planning Area
- NSW RFS Bushfire Prone Land
- NSW Spatial Cadastre (block size where detectable)
- SiteVerdict council DA median database (34 councils, 319 real DAs)

**Scoring logic:**
- Planning strength, overlay risk, yield potential, approval confidence, holding cost risk, council complexity, exit potential
- Overall score: weighted average × 10 → 1–99 scale
- Verdict bands: 80+ Strong | 65–79 Review | 50–64 Moderate | 35–49 Limited | <35 Low

**Important limitations:**
- This is an **indicative validation only**. It is not a predictive guarantee.
- The rule-based system cannot assess site-specific constraints (slope, easements, frontage, sewer).
- DA outcomes depend on scheme amendments, political decisions and applicant strategy — factors this system cannot capture.
- Geocoding accuracy affects results. Some addresses may geocode to the wrong parcel.
- Block sizes are estimated from NSW Cadastre and may not match the actual DA site.
- This comparison is **historical**, not forward-looking.

---

## Summary

| Metric | Value |
|---|---|
| Total rows | ${summary.totalRows} |
| Successfully scored | ${summary.totalScored} |
| Errors | ${summary.totalErrors} |
| Correct predictions | ${summary.totalCorrect} |
| Overall accuracy | ${summary.accuracy} |
| Avg score (approved DAs) | ${summary.avgScoreApproved || 'n/a'} |
| Avg score (refused DAs) | ${summary.avgScoreRefused || 'n/a'} |
| False positives | ${summary.falsePositives} |
| False negatives | ${summary.falseNegatives} |

---

## Score Band Performance

| Band | Count | Approved | Approval Rate | Avg Score | Median Timeline |
|---|---|---|---|---|---|
${bandTable}

---

## Council Breakdown

| Council | Count | Avg Score | Median Days |
|---|---|---|---|
${councilTable}

---

## Top 20 High-Scoring Approved Projects

| Address | Score | Band | DA Status | Timeline |
|---|---|---|---|---|
${topApprovedTable || '*(none with approved status in this batch)*'}

---

## Top 20 High-Scoring Refused / Withdrawn Projects

| Address | Score | Band | DA Status | Flag |
|---|---|---|---|---|
${topRefusedTable || '*(none with refused/withdrawn status in this batch)*'}

---

## Recommendations to Improve Scoring Logic

1. **Infrastructure weight**: Sewer capacity is the most common blocking factor for large subdivisions. Adding Sydney Water data would improve accuracy for 10+ lot sites.
2. **DCP frontage**: The current model uses a blunt frontage estimate (lot count × 12m). Real DCP frontage requirements vary by council. Integrating council DCPs would reduce false positives for narrow sites.
3. **Heritage nuance**: Heritage items range from minor significance to curtilage-protected buildings. A severity weighting would improve the overlay risk score.
4. **Slope**: Steep sites (>15°) significantly reduce yield. Terrain data (DEM) is available via NSW Spatial Services and could be integrated.
5. **Existing use**: An occupied dwelling on a small lot is not the same as a vacant block of the same size. ePlanning data could indicate existing use.

---

## Disclaimer

This report was generated by SiteVerdict's automated analysis tool. It is not a planning certificate, not financial advice, not legal advice, and not a valuation. All results are indicative only. A licensed NSW town planner, registered surveyor and legal practitioner must be consulted before any development, investment or acquisition decision.

SiteVerdict — siteverdict.com.au — ABN 42 663 950 070
`;
}

// ── MAIN ──────────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   SiteVerdict — Batch Validation Tool v1.0       ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log();
  console.log(`Input:      ${INPUT_FILE}`);
  console.log(`Output:     ${OUTPUT_FILE}`);
  console.log(`Limit:      ${LIMIT}`);
  console.log(`Dry run:    ${DRY_RUN}`);
  console.log(`No paid API:${NO_PAID_API}`);
  console.log(`Delay:      ${DELAY_MS}ms`);
  console.log(`Resume:     ${RESUME}`);
  console.log();

  // Read input
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`ERROR: Input file not found: ${INPUT_FILE}`);
    console.error('  Create data/backtest-input.csv or use --input path/to/file.csv');
    process.exit(1);
  }

  const rows = parseCSV(fs.readFileSync(INPUT_FILE, 'utf8'));
  console.log(`Loaded ${rows.length} rows from CSV`);

  // Load existing results for --resume
  const existingAddresses = new Set();
  let existingResults = [];
  if (RESUME && fs.existsSync(OUTPUT_FILE)) {
    existingResults = parseCSV(fs.readFileSync(OUTPUT_FILE, 'utf8'));
    existingResults.forEach(r => existingAddresses.add(r.address));
    console.log(`Resume: found ${existingResults.length} existing results`);
  }

  // Filter rows
  let toProcess = rows.slice(0, LIMIT);
  if (RESUME) {
    toProcess = toProcess.filter(r => {
      const addr = [r.address, r.suburb, r.postcode].filter(Boolean).join(', ');
      return !existingAddresses.has(addr);
    });
    console.log(`Resume: ${toProcess.length} rows to process (${existingAddresses.size} already done)`);
  }

  if (DRY_RUN) {
    console.log('\n[DRY RUN MODE] — no API calls will be made');
    console.log(`Would process ${toProcess.length} rows:`);
    toProcess.forEach((r, i) => {
      const addr = [r.address, r.suburb, r.postcode].filter(Boolean).join(', ');
      console.log(`  ${i+1}. ${addr} (${r.council || 'unknown council'}) — ${r.da_status || 'status unknown'}`);
    });
    console.log();
  }

  // Headers for output CSV
  const HEADERS = [
    'address','council','real_da_status','real_lots','real_timeline_days',
    'sv_score','sv_verdict','sv_band','sv_lots','zone','mls','mls_real','block','zone_allows',
    'planning_strength','overlay_risk','yield_potential','approval_confidence',
    'holding_cost_risk','council_complexity','overlay_flags','council_days','council_name',
    'match','flag','timeline_note','coordinate_source','notes','geocode_lat','geocode_lon',
  ];

  // Open output file (append if resume)
  const writeMode = RESUME && fs.existsSync(OUTPUT_FILE) ? 'a' : 'w';
  const out = fs.createWriteStream(OUTPUT_FILE, { flags: writeMode });
  if (writeMode === 'w') out.write(HEADERS.join(',') + '\n');

  const results = [...existingResults];

  // Process rows
  for (let i = 0; i < toProcess.length; i++) {
    const row = toProcess[i];
    const result = await processRow(row, i, toProcess.length, existingAddresses);
    results.push(result);

    // Write row
    out.write(toCSVRow(result) + '\n');
  }

  out.end();
  console.log(`\n✓ Results written to ${OUTPUT_FILE}`);

  // Summary
  const summary = buildSummary(results);
  fs.writeFileSync(SUMMARY_FILE, JSON.stringify(summary, null, 2));
  console.log(`✓ Summary written to ${SUMMARY_FILE}`);

  // Report
  const report = buildReport(summary, results);
  fs.writeFileSync(REPORT_FILE, report);
  console.log(`✓ Report written to ${REPORT_FILE}`);

  // Print summary to console
  console.log();
  console.log('═══════════════════════ SUMMARY ═══════════════════════');
  console.log(`Tested:        ${summary.totalScored} / ${summary.totalRows}`);
  console.log(`Errors:        ${summary.totalErrors}`);
  console.log(`Correct:       ${summary.totalCorrect} (${summary.accuracy})`);
  console.log(`False +ve:     ${summary.falsePositives}`);
  console.log(`False -ve:     ${summary.falseNegatives}`);
  console.log();
  console.log('Score bands:');
  for (const [band, d] of Object.entries(summary.bandSummary)) {
    if (d.count) console.log(`  ${band.padEnd(10)} n=${d.count} approved=${d.approvalRate} avgScore=${d.avgScore||'n/a'}`);
  }
  console.log('═══════════════════════════════════════════════════════');
}

main().catch(e => {
  console.error('\nFATAL ERROR:', e.message);
  process.exit(1);
});
