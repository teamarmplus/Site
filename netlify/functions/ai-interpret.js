/**
 * SiteVerdict — AI Interpretation Layer
 * Claude Sonnet integration via Anthropic API
 *
 * Security: ANTHROPIC_API_KEY in Netlify env vars only — never client-side
 * Input:  POST { planningData: {...}, address: "..." }
 * Output: { aiInsights: {...} } | { error: "..." }
 */

// ── SYSTEM PROMPT ────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are SiteVerdict's development intelligence engine.
You analyse NSW residential land parcels for development potential.
You have been given structured planning data collected from 16+ NSW government APIs.

YOUR ROLE:
Interpret this data as an experienced development analyst — thinking commercially, not just reporting facts.
Think like: a developer, a town planner, an acquisitions analyst, and a lender risk assessor simultaneously.

STRICT RULES:
1. Return ONLY valid JSON. No markdown. No HTML. No text outside JSON.
2. Distinguish confirmed government data from estimates and inferences.
3. Never promise profits, guarantee approvals, or state specific outcomes as certain.
4. Use probability ranges (e.g. "65–75%") not false certainty.
5. Each text field: maximum 2 concise sentences. No padding or filler.
6. Identify what most buyers miss (hidden upside) and what could kill the deal.
7. If data is missing or unverified, say so explicitly in the relevant field.
8. Tone: institutional, calm, concise, intelligent. No hype. No emotional language.

CONFIDENCE LEVELS (use exactly these strings):
- "Verified": Direct from government API, queried today
- "Calculated": Derived from verified data using standard planning rules
- "Estimated": Industry benchmark or inference — not confirmed
- "Unverified": Requires professional confirmation before reliance

Return this exact JSON schema with all fields populated:
{
  "executiveVerdict": {
    "rating": "Strong Proceed | Conditional Proceed | Requires Investigation | Avoid",
    "score": 0,
    "summary": "One sentence institutional assessment. No hype.",
    "confidence": "Verified | Calculated | Estimated"
  },
  "hiddenUpside": {
    "text": "The key value insight most buyers and agents miss.",
    "confidence": "Verified | Calculated | Estimated"
  },
  "approvalOutlook": {
    "probabilityRange": "XX–XX%",
    "complexity": "Low | Medium | High",
    "primaryConcerns": ["concern1", "concern2"],
    "rfiRisk": "Low | Medium | High",
    "confidence": "Calculated"
  },
  "highestBestUse": {
    "recommended": "Pathway name",
    "lotsRange": {"low": 0, "base": 0, "high": 0},
    "rationale": "Why this is the highest-value pathway.",
    "alternatives": [{"use": "Alternative pathway", "rationale": "Why considered."}],
    "confidence": "Calculated | Estimated"
  },
  "risks": [
    {
      "name": "Risk name",
      "category": "Planning | Infrastructure | Timeline | Market | Title | Biodiversity",
      "severity": "High | Medium | Low",
      "description": "Concise description of the risk.",
      "mitigation": "Specific mitigation action."
    }
  ],
  "councilBehaviour": {
    "speedRating": "Very Fast | Fast | Average | Slow | Very Slow",
    "rfiRisk": "Low | Medium | High",
    "attitude": "Supportive | Neutral | Complex",
    "strategicAdvice": "One sentence tactical recommendation for this council.",
    "confidence": "Verified | Calculated"
  },
  "financialObservations": {
    "keyValueDrivers": ["driver1", "driver2"],
    "keyRisks": ["risk1", "risk2"],
    "holdingCostNote": "Plain-language impact of council timeline on financing.",
    "confidence": "Estimated"
  },
  "strategicRecommendation": {
    "action": "Proceed | Secure under option | Pre-DA first | Avoid at current pricing | Investigate further",
    "rationale": "One sentence why.",
    "conditions": ["Condition 1 before any offer.", "Condition 2 before exchange."]
  },
  "nextActions": [
    {
      "priority": 1,
      "action": "Specific action name",
      "detail": "What to do and why it matters.",
      "cost": "$X",
      "timeframe": "X days",
      "urgency": "Before any offer | Before exchange | After securing | If proceeding"
    }
  ],
  "dataQuality": {
    "verified": ["List of verified data points"],
    "estimated": ["List of estimated items — label each clearly"],
    "unverified": ["List of items requiring professional confirmation"]
  }
}`;

// ── MODEL CONFIG ────────────────────────────────────────────────
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5';

// ── INPUT VALIDATION ─────────────────────────────────────────────
function validateInput(data) {
  if (!data || typeof data !== 'object') return 'Invalid request body';
  if (!data.address || typeof data.address !== 'string') return 'Missing address';
  if (!data.planningData || typeof data.planningData !== 'object') return 'Missing planning data';
  return null;
}

// ── BUILD COMPACT PROMPT ─────────────────────────────────────────
function buildUserPrompt(address, pd) {
  const lines = [
    `Property: ${address}`,
    `Zone: ${pd.zone?.code || 'Unknown'} — ${pd.zone?.name || ''}`,
    `LGA: ${pd.zone?.lga || 'Unknown'}`,
    `Min lot size: ${pd.minLot?.value || '?'}m² (${pd.minLot?.verified ? 'real LEP value from Layer 14' : 'zone default — unverified'})`,
    `Block size: ${pd.block?.area ? pd.block.area + 'm² (NSW Cadastre)' : 'not detected — unverified'}`,
    `Estimated lots (LEP calc only): ${pd.estimatedLots >= 2 ? pd.estimatedLots : 'less than 2 — subdivision unlikely'}`,
    `Zone allows subdivision: ${pd.zoneAllows ? 'Yes' : 'No or unconfirmed'}`,
    '',
    'GOVERNMENT OVERLAY CHECKS (all verified today):',
    `Heritage: ${pd.overlays?.heritage ? '⚠ PRESENT — ' + (pd.overlays.heritageName || 'heritage item/area') : '✓ Clear'}`,
    `Flood planning area: ${pd.overlays?.flood ? '⚠ PRESENT' : '✓ Clear'}`,
    `Bushfire prone: ${pd.overlays?.bushfire ? '⚠ PRESENT' : '✓ Clear'}`,
    `Acid sulfate soils: ${pd.overlays?.acidSulfate ? '⚠ PRESENT — ' + pd.overlays.acidSulfate : '✓ Clear'}`,
    `Contaminated land: ${pd.overlays?.contaminated ? '⚠ PRESENT' : '✓ Clear'}`,
    `Riparian corridor: ${pd.overlays?.riparian ? '⚠ PRESENT' : '✓ Clear'}`,
    `Land reservation: ${pd.overlays?.landReservation ? '⚠ PRESENT — ' + pd.overlays.landReservation : '✓ Clear'}`,
    `Foreshore: ${pd.overlays?.foreshore ? '⚠ PRESENT' : '✓ Clear'}`,
    `FSR: ${pd.controls?.fsr ? pd.controls.fsr + ':1' : 'No LEP limit'}`,
    `Height: ${pd.controls?.height ? pd.controls.height + 'm' : 'No LEP limit'}`,
    '',
    'TRANSPORT PROXIMITY (SEPP 2024):',
    `Within 400m of train station: ${pd.sepp?.within400m ? 'YES — ' + pd.sepp.stationName400 : 'No'}`,
    `Within 800m of train station: ${pd.sepp?.within800m ? 'YES — ' + pd.sepp.stationName800 : 'No'}`,
    '',
    'COUNCIL INTELLIGENCE (real DA records):',
    pd.council?.name
      ? `${pd.council.name}: ${pd.council.daysMedian}d median (n=${pd.council.sampleSize}, range ${pd.council.range})`
      : 'Council not in database — DA timeline unknown',
    '',
  ];

  if (pd.comparables?.length) {
    lines.push('COMPARABLE APPROVED DAs:');
    pd.comparables.slice(0, 3).forEach(c => {
      lines.push(`  ${c.address}: ${c.lots} lots, $${(c.cost / 1000).toFixed(0)}K dev cost, ${c.days}d DA`);
    });
    lines.push('');
  }

  if (pd.infrastructure?.stations?.length) {
    lines.push('NEARBY INFRASTRUCTURE:');
    pd.infrastructure.stations.slice(0, 2).forEach(s => {
      lines.push(`  ${s.name} station: ${s.dist}m`);
    });
    lines.push('');
  }

  lines.push('Analyse this property and return your development intelligence assessment as JSON only.');

  return lines.filter(l => l !== null).join('\n');
}

// ── CALL CLAUDE API ──────────────────────────────────────────────
async function callClaude(apiKey, userMessage) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1400,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Anthropic API error ${response.status}: ${errText.slice(0, 200)}`);
  }

  const data = await response.json();
  const raw = data.content?.[0]?.text;
  if (!raw) throw new Error('Empty response from Claude');

  // Strip any markdown fences if present (defensive)
  const clean = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
  const parsed = JSON.parse(clean);
  return parsed;
}

// ── HANDLER ──────────────────────────────────────────────────────
exports.handler = async function(event) {
  // Allowed origins — update if domain changes
  const ALLOWED_ORIGINS = [
    'https://siteverdict.com.au',
    'https://www.siteverdict.com.au',
    'http://localhost:3000',
    'http://localhost:8888', // Netlify dev
  ];
  // Also allow Netlify deploy preview URLs
  const origin = event.headers && (event.headers.origin || event.headers.Origin) || '';
  const isAllowed = ALLOWED_ORIGINS.includes(origin) ||
    /^https:\/\/[a-z0-9-]+--siteverdict\.netlify\.app$/.test(origin) ||
    /^https:\/\/deploy-preview-\d+--[a-z0-9-]+\.netlify\.app$/.test(origin);

  const CORS = {
    'Access-Control-Allow-Origin': isAllowed ? origin : 'https://siteverdict.com.au',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: { ...CORS, 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' } };
  }
  // Reject requests from disallowed origins
  if (event.httpMethod === 'POST' && !isAllowed) {
    return { statusCode: 403, headers: CORS, body: JSON.stringify({ error: 'Forbidden' }) };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 503, headers: CORS, body: JSON.stringify({ error: 'AI not configured', fallback: true }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const validationError = validateInput(body);
  if (validationError) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: validationError }) };
  }

  const { address, planningData } = body;

  try {
    const userMessage = buildUserPrompt(address, planningData);
    const aiInsights = await callClaude(apiKey, userMessage);

    return {
      statusCode: 200,
      headers: { ...CORS, 'Cache-Control': 'no-store' },
      body: JSON.stringify({ aiInsights }),
    };
  } catch (err) {
    // Full error logged server-side only — never exposed to client
    console.error('[SiteVerdict AI] Error:', err.message);
    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ fallback: true }),
    };
  }
};
