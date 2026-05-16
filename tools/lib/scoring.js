/**
 * SiteVerdict — Scoring Logic (server-side mirror)
 * 
 * This file is a precise mirror of the scoring functions in assets/sv-check.js.
 * Any change to scoring logic must be made in BOTH files.
 * 
 * Used by: tools/backtest-siteverdict.js
 * Source:  assets/sv-check.js
 */

'use strict';

// ── ZONE DEFAULT MIN LOT SIZES ────────────────────────────────────
const ZONE_MLS = {
  R1:450, R2:450, R3:400, R4:350, R5:2000, R6:450,
  RU1:4000, RU2:4000, RU3:4000, RU4:2000, RU5:2000, RU6:4000,
  E3:2000, E4:500, C4:400, UR:500, MU1:400, MU2:400, SP1:2000, SP2:4000,
};

// ── MAX FLOORS PER ZONE (for calcLots frontage check) ────────────
const MF = { R1:12, R2:12, R3:9, R4:9, RU1:50, RU2:50, RU4:2000 };

// ── RESIDENTIAL ZONE LIST ─────────────────────────────────────────
const RESIDENTIAL_ZONES = [
  'R1','R2','R3','R4','R5','R6',
  'RU1','RU2','RU3','RU4','RU5','RU6',
  'E4','E3','C4','UR','MU1','MU2','B4','SP1','SP2',
];

// ── COUNCIL DA MEDIAN DATA (34 councils, 319 real DAs) ───────────
const CD = {
  ALBURY:            { days:63,  range:'53-63',    n:3  },
  BATHURST:          { days:43,  range:'33-73',    n:3  },
  BLACKTOWN:         { days:153, range:'40-399',   n:12 },
  BYRON:             { days:189, range:'14-393',   n:6  },
  CAMDEN:            { days:45,  range:'2-375',    n:12 },
  CAMPBELLTOWN:      { days:109, range:'109-329',  n:3  },
  'CANADA BAY':      { days:206, range:'127-557',  n:5  },
  CANTERBURY:        { days:49,  range:'5-448',    n:62 },
  BANKSTOWN:         { days:49,  range:'5-448',    n:62 },
  'CENTRAL COAST':   { days:89,  range:'21-165',   n:8  },
  CESSNOCK:          { days:85,  range:'50-110',   n:3  },
  'COFFS HARBOUR':   { days:73,  range:'65-168',   n:3  },
  CUMBERLAND:        { days:186, range:'48-361',   n:8  },
  FAIRFIELD:         { days:177, range:'136-177',  n:2  },
  GOULBURN:          { days:122, range:'15-292',   n:6  },
  'INNER WEST':      { days:119, range:'54-166',   n:9  },
  'LAKE MACQUARIE':  { days:131, range:'41-474',   n:15 },
  LIVERPOOL:         { days:314, range:'71-425',   n:14 },
  MAITLAND:          { days:23,  range:'18-85',    n:4  },
  NEWCASTLE:         { days:122, range:'73-360',   n:11 },
  'NORTH SYDNEY':    { days:279, range:'194-279',  n:2  },
  'NORTHERN BEACHES':{ days:160, range:'90-173',   n:3  },
  PARRAMATTA:        { days:133, range:'2-243',    n:24 },
  PENRITH:           { days:204, range:'74-386',   n:9  },
  'PORT MACQUARIE':  { days:281, range:'97-281',   n:2  },
  'PORT STEPHENS':   { days:85,  range:'1-92',     n:3  },
  RYDE:              { days:86,  range:'5-86',     n:4  },
  SHELLHARBOUR:      { days:71,  range:'7-392',    n:8  },
  SHOALHAVEN:        { days:108, range:'3-171',    n:6  },
  SUTHERLAND:        { days:118, range:'35-315',   n:28 },
  'THE HILLS':       { days:148, range:'70-199',   n:9  },
  WAVERLEY:          { days:332, range:'132-332',  n:2  },
  WOLLONDILLY:       { days:480, range:'175-480',  n:2  },
  WOLLONGONG:        { days:70,  range:'15-233',   n:12 },
  WOOLLAHRA:         { days:232, range:'208-232',  n:2  },
};

/**
 * Look up council data by LGA name.
 * Normalises case and handles common variants.
 * @param {string} lga
 * @returns {{ name: string, data: object } | null}
 */
function getCouncilMatch(lga) {
  if (!lga) return null;
  const key = lga.toUpperCase().trim()
    .replace(/\s+COUNCIL$/i, '')
    .replace(/\s+CITY COUNCIL$/i, '')
    .replace(/\s+SHIRE COUNCIL$/i, '')
    .replace('CITY OF ', '')
    .replace('-BANKSTOWN', '')
    .trim();

  // Direct match
  if (CD[key]) return { name: key, data: CD[key] };

  // Partial match
  for (const k of Object.keys(CD)) {
    if (k.includes(key) || key.includes(k)) {
      return { name: k, data: CD[k] };
    }
  }
  return null;
}

// ── SCORING FUNCTIONS (mirrors sv-check.js exactly) ─────────────

function calcPlanningStrength(zone, mls, mlsReal, heritage, fsr, height, zoneAllows) {
  let s = 0;
  if (zoneAllows) s += 3; else if (zone) s += 1;
  if (mlsReal) s += 2; else if (mls > 0) s += 1;
  if (!heritage) s += 1;
  if (!fsr) s += 1;
  if (!height) s += 1;
  if (zone && ['R2','R3','R4'].includes(zone)) s += 1;
  return Math.min(10, Math.max(0, s));
}

function calcOverlayRisk(heritage, flood, bushfire, acid, contaminated, riparian, landRes, foreshore) {
  let s = 10;
  if (heritage)     s -= 2;
  if (flood)        s -= 2;
  if (bushfire)     s -= 1;
  if (acid)         s -= 1;
  if (contaminated) s -= 1.5;
  if (riparian)     s -= 1;
  if (landRes)      s -= 1;
  if (foreshore)    s -= 0.5;
  return Math.max(0, Math.round(s * 10) / 10);
}

function calcYieldPotential(block, mls) {
  if (!block || block < 100) return 4;
  const lots = Math.floor(block / (mls || 450));
  if (lots >= 15) return 10;
  if (lots >= 10) return 9;
  if (lots >= 6)  return 8;
  if (lots >= 4)  return 7;
  if (lots >= 3)  return 6;
  if (lots >= 2)  return 5;
  return 2;
}

function calcApprovalConfidence(zone, heritage, flood, bushfire, zoneAllows, cm) {
  let s = 5;
  if (zoneAllows) s += 2;
  if (!heritage)  s += 1;
  if (!flood)     s += 0.5;
  if (!bushfire)  s += 0.5;
  if (cm && cm.data) {
    const days = cm.data.days;
    if (days && days <= 60)  s += 1;
    else if (days && days > 200) s -= 1;
  }
  return Math.min(10, Math.max(0, Math.round(s * 10) / 10));
}

function calcHoldingCostRisk(cm) {
  if (!cm || !cm.data) return 5;
  const days = cm.data.days;
  if (days <= 45)  return 9;
  if (days <= 90)  return 8;
  if (days <= 130) return 7;
  if (days <= 180) return 5;
  if (days <= 250) return 3;
  return 2;
}

function calcCouncilComplexity(cm) {
  if (!cm || !cm.data) return 5;
  const days = cm.data.days;
  if (days <= 45)  return 9;
  if (days <= 90)  return 8;
  if (days <= 150) return 6;
  if (days <= 220) return 4;
  return 3;
}

function calcLots(block, front, mls, zone) {
  const s = Math.floor(block / mls);
  if (!front || front < 3) return s;
  return Math.max(0, Math.min(s, Math.floor(front / (MF[zone] || 12))));
}

// ── OVERALL SCORE ─────────────────────────────────────────────────
// Mirrors renderResult wrapper formula exactly (×10 normalization).
function calcOverallScore({ ps, ov, yp, ac, ir, hc, cc, ep }) {
  const raw = ps * 0.2 + ov * 0.15 + yp * 0.2 + ac * 0.15
    + (10 - ir) * 0.1 + hc * 0.1 + cc * 0.05 + ep * 0.05;
  return Math.min(99, Math.max(1, Math.round(raw * 10)));
}

// ── VERDICT LABELS ────────────────────────────────────────────────
function verdictLabelFromScore(score) {
  if (score >= 80) return 'Strong development opportunity';
  if (score >= 65) return 'Review opportunity — professional verification required';
  if (score >= 50) return 'Moderate potential — key constraints to verify';
  if (score >= 35) return 'Limited potential — proceed carefully';
  return 'Low development potential';
}

function scoreRangeBand(score) {
  if (score >= 80) return 'STRONG';
  if (score >= 65) return 'REVIEW';
  if (score >= 50) return 'MODERATE';
  if (score >= 35) return 'LIMITED';
  return 'LOW';
}

// ── MASTER SCORE FUNCTION ─────────────────────────────────────────
/**
 * Run the full SiteVerdict score for a pre-fetched set of planning data.
 * Returns the same fields the website scorecard would show.
 *
 * @param {object} data  Structured planning data for the property
 * @returns {object}     Scores and verdict
 */
function scoreProperty(data) {
  const {
    zone      = '',
    mls       = 450,
    mlsReal   = false,
    block     = 0,
    front     = 15,
    lga       = '',
    heritage  = null,
    flood     = false,
    bushfire  = false,
    acid      = null,
    contaminated = false,
    riparian  = false,
    landRes   = null,
    foreshore = false,
    fsr       = null,
    height    = null,
    zoneAllows = false,
  } = data;

  const cm = getCouncilMatch(lga);
  const n  = block >= mls ? calcLots(block, front, mls, zone) : 0;

  const ps = calcPlanningStrength(zone, mls, mlsReal, heritage, fsr, height, zoneAllows);
  const ov = calcOverlayRisk(heritage, flood, bushfire, acid, contaminated, riparian, landRes, foreshore);
  const yp = calcYieldPotential(block, mls);
  const ac = calcApprovalConfidence(zone, heritage, flood, bushfire, zoneAllows, cm);
  const ir = 5; // infrastructure risk: default (no Overpass in batch mode)
  const hc = calcHoldingCostRisk(cm);
  const cc = calcCouncilComplexity(cm);
  const ep = (zoneAllows && n >= 2) ? 7 : 4;

  const overall = calcOverallScore({ ps, ov, yp, ac, ir, hc, cc, ep });

  const overlayFlags = [];
  if (heritage)     overlayFlags.push('HERITAGE');
  if (flood)        overlayFlags.push('FLOOD');
  if (bushfire)     overlayFlags.push('BUSHFIRE');
  if (acid)         overlayFlags.push('ACID_SULFATE');
  if (contaminated) overlayFlags.push('CONTAMINATED');
  if (riparian)     overlayFlags.push('RIPARIAN');
  if (landRes)      overlayFlags.push('LAND_RESERVATION');
  if (foreshore)    overlayFlags.push('FORESHORE');

  return {
    score:             overall,
    verdict:           verdictLabelFromScore(overall),
    band:              scoreRangeBand(overall),
    estimatedLots:     n,
    planningStrength:  ps,
    overlayRisk:       ov,
    yieldPotential:    yp,
    approvalConfidence:ac,
    holdingCostRisk:   hc,
    councilComplexity: cc,
    exitPotential:     ep,
    councilDays:       cm ? cm.data.days : null,
    councilName:       cm ? cm.name : null,
    overlayFlags:      overlayFlags.join('|') || 'NONE',
    zone,
    mls,
    mlsReal,
    block,
    zoneAllows,
  };
}

module.exports = {
  scoreProperty,
  getCouncilMatch,
  calcOverallScore,
  verdictLabelFromScore,
  scoreRangeBand,
  ZONE_MLS,
  RESIDENTIAL_ZONES,
  CD,
};
