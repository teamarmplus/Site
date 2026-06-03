#!/usr/bin/env node
/**
 * SiteVerdict Trusted Trader Network — Matcher
 * Matches a client need to suitable trusted traders. INTERNAL ONLY.
 * NEVER shares client details. NEVER contacts traders. T approves every match before any contact.
 *
 * USAGE
 *   node trader_matcher.js --traders sample-traders.csv --reviews reviews.csv --needs sample-client-needs.csv --out sample-matches.md
 */
const fs = require('fs');
const { loadTraders } = require('./trader_registry.js');
const { loadReviews, applyFeedback } = require('./trader_feedback.js');

const NEVER_MATCH_STATUS = ['banned','suspended','inactive','candidate','contacted'];
// high-risk needs require a fully 'approved' & verified trader (not probation)
const HIGH_RISK = ['excavation','earthworks','bushfire','retaining'];

function parseArgs(argv){const a={};for(let i=2;i<argv.length;i++){if(argv[i].startsWith('--')){a[argv[i].slice(2)]=(argv[i+1]&&!argv[i+1].startsWith('--'))?argv[++i]:true;}}return a;}

function servesArea(trader, councilSuburb){
  if(!councilSuburb) return false;
  const cs=councilSuburb.toLowerCase();
  return trader.councils_suburbs.some(area=>area.toLowerCase()===cs || cs.includes(area.toLowerCase()) || area.toLowerCase().includes(cs));
}
function inCategory(trader, need){
  return trader.categories.map(c=>c.toLowerCase()).includes((need||'').toLowerCase());
}

// returns {matches:[{trader,confidence,reasons}], warning}
function matchNeed(need, traders){
  const cat=(need.need_category||'').toLowerCase();
  const highRisk = HIGH_RISK.includes(cat) || (need.risk_level==='high');
  const candidates=[];
  for(const t of traders){
    // hard guards — never match
    if(NEVER_MATCH_STATUS.includes(t.status)) continue;
    if(t.flags.includes('unresolved_complaint')) continue;
    if(!inCategory(t, cat)) continue;
    if(!servesArea(t, need.council_suburb)) continue;
    if(highRisk && t.status!=='approved') continue; // high-risk needs a fully approved trader, not probation/verified
    // passed guards
    const reasons=[];
    reasons.push(`category "${cat}" matches`);
    reasons.push(`serves ${need.council_suburb}`);
    reasons.push(`status: ${t.status}`);
    reasons.push(`trust ${t.trust_score} (${t.review_count} reviews)`);
    if(t.response_time_hrs<=6) reasons.push('fast response');
    // confidence from trust + evidence + responsiveness
    let conf='Medium';
    if(t.trust_score>=4.5 && t.review_count>=10 && t.status==='approved') conf='High';
    else if(t.trust_score<3.8 || t.review_count<3 || t.status==='probation') conf='Low';
    candidates.push({trader:t, confidence:conf, reasons});
  }
  // rank: trust desc, then review_count desc, then response time asc
  candidates.sort((a,b)=> b.trader.trust_score-a.trader.trust_score
    || b.trader.review_count-a.trader.review_count
    || a.trader.response_time_hrs-b.trader.response_time_hrs);
  const warning = candidates.length? '' : 'No suitable verified trader yet for this need/area.';
  return { matches: candidates.slice(0,3), warning, highRisk };
}

function renderMatches(needs, traders){
  let md='# SiteVerdict — Internal Trader Match Suggestions\nGenerated: '+new Date().toISOString()+'\n\n'+
    'INTERNAL ONLY. AI suggests · T approves every match · client consent required before any contact.\n'+
    'No client details are shared with traders by this tool. No trader is contacted automatically.\n\n';
  for(const need of needs){
    const {matches, warning, highRisk}=matchNeed(need, traders);
    md+=`## Need ${need.client_id}: ${need.need_category} @ ${need.council_suburb} (${need.job_size||'any'}${highRisk?', HIGH-RISK':''})\n`;
    md+=`_${need.notes||''}_\n\n`;
    if(warning){
      md+=`> ⚠ ${warning}\n> Next action: keep looking / vet a new trader; do not force an unsuitable match.\n\n`;
      continue;
    }
    matches.forEach((m,i)=>{
      md+=`**${i+1}. ${m.trader.business_name}** (${m.trader.trader_id}) — confidence: ${m.confidence}\n`;
      md+=`- Why matched: ${m.reasons.join('; ')}\n`;
      md+=`- T must verify: ABN/licence current, insurance current, still available, area/scope fit\n`;
      md+=`- Client consent needed before sharing the client's details? YES — required\n`;
      md+=`- Next action: T reviews → if approved, ask client consent → then introduce\n\n`;
    });
  }
  md+='\n_AI prepares suggestions only. No job is guaranteed. No trader is contacted and no client details are shared without T approval and client consent._\n';
  return md;
}

function buildTraders(args){
  const traders=loadTraders(args.traders||'sample-traders.csv');
  const reviews=loadReviews(args.reviews||'reviews.csv');
  return applyFeedback(traders, reviews);
}

if(require.main===module){
  const args=parseArgs(process.argv);
  const traders=buildTraders(args);
  const { parseCSV }=require('./trader_registry.js');
  const needs=parseCSV(fs.readFileSync(args.needs||'sample-client-needs.csv','utf8'));
  const md=renderMatches(needs, traders);
  fs.writeFileSync(args.out||'sample-matches.md', md);
  console.log('Wrote '+(args.out||'sample-matches.md')+' for '+needs.length+' needs.');
}
module.exports = { matchNeed, renderMatches, buildTraders, servesArea, inCategory, NEVER_MATCH_STATUS, HIGH_RISK };
