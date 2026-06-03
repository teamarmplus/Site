#!/usr/bin/env node
/**
 * SiteVerdict Lead Board — Interest matcher / shortlist
 * Ranks traders who expressed interest in a lead. INTERNAL ONLY. No client details involved.
 * No trader is shortlisted who is banned/suspended/inactive/wrong-category/outside-area/complained.
 *
 * USAGE
 *   node lead_matcher.js --traders sample-traders.csv --reviews reviews.csv --leads sample-job-leads.csv --interests sample-trader-interests.csv --out sample-lead-board.md
 */
const fs = require('fs');
const { loadTraders } = require('./trader_registry.js');
const { loadReviews, applyFeedback } = require('./trader_feedback.js');
const { loadLeads, traderPreview, consentGate } = require('./lead_board.js');
const { servesArea, inCategory } = require('./trader_matcher.js');

const NEVER_SHORTLIST = ['banned','suspended','inactive','candidate','contacted'];
const HIGH_RISK = ['excavation','earthworks','bushfire','retaining'];

function parseArgs(argv){const a={};for(let i=2;i<argv.length;i++){if(argv[i].startsWith('--')){a[argv[i].slice(2)]=(argv[i+1]&&!argv[i+1].startsWith('--'))?argv[++i]:true;}}return a;}

// shortlist interested traders for one lead
function shortlistFor(lead, interests, tradersById){
  const cat=(lead.service_category||'').toLowerCase();
  const highRisk = HIGH_RISK.includes(cat) || lead.urgency==='high' || lead.risk_flags.length>0;
  const out=[];
  for(const it of interests.filter(i=>i.lead_id===lead.lead_id)){
    const t=tradersById[it.trader_id];
    if(!t) continue;
    // never-shortlist guards
    if(NEVER_SHORTLIST.includes(t.status)) continue;
    if(t.flags.includes('unresolved_complaint')) continue;
    if(!inCategory(t, cat)) continue;
    if(!servesArea(t, lead.suburb) && !servesArea(t, lead.council)) continue;
    if(highRisk && t.status!=='approved') continue; // high-risk needs fully approved (not probation)
    // suitability score (no client data involved)
    let conf='Medium';
    if(t.trust_score>=4.5 && t.review_count>=10 && t.status==='approved') conf='High';
    else if(t.trust_score<3.8 || t.review_count<3 || t.status==='probation') conf='Low';
    out.push({interest:it, trader:t, confidence:conf});
  }
  // rank: status (approved>probation), trust, review_count, response history, availability
  const statusRank=s=>s==='approved'?0:s==='verified'?1:s==='probation'?2:3;
  out.sort((a,b)=> statusRank(a.trader.status)-statusRank(b.trader.status)
    || b.trader.trust_score-a.trader.trust_score
    || b.trader.review_count-a.trader.review_count
    || (parseInt(a.interest.est_response_time_hrs)||999)-(parseInt(b.interest.est_response_time_hrs)||999));
  return { shortlist: out.slice(0,3), highRisk, warning: out.length?'':'No suitable verified trader yet.' };
}

function render(leads, interests, tradersById){
  let md='# SiteVerdict — Internal Trader Lead Board\nGenerated: '+new Date().toISOString()+'\n\n'+
   'INTERNAL ONLY. Client details are HIDDEN on every card. AI prepares · T approves · trader expresses '+
   'interest · client consents · only then are details shared. No trader is contacted automatically.\n\n';
  for(const lead of leads){
    const {shortlist, highRisk, warning}=shortlistFor(lead, interests, tradersById);
    const pv=traderPreview(lead);
    md+=`## ${lead.lead_id} — ${lead.service_category} @ ${lead.suburb} (${lead.council})${highRisk?'  ⚠ HIGH-RISK':''}\n`;
    md+=`- Status: **${lead.status}**\n`;
    md+=`- Trader-safe preview: ${pv.job_summary} | ${lead.property_type||'?'} | urgency ${lead.urgency} | photos/plans: ${lead.photos_plans}\n`;
    md+=`- Risk flags: ${lead.risk_flags.join(', ')||'none'}\n`;
    md+=`- **Client details: hidden until approved** (consent not yet requested)\n\n`;
    if(warning){ md+=`> ⚠ ${warning} Next action: keep the lead open or vet a new trader; do not force a match.\n\n`; continue; }
    md+=`### Recommended shortlist (T selects)\n`;
    shortlist.forEach((s,i)=>{
      md+=`**${i+1}. ${s.trader.business_name}** (${s.trader.trader_id}) — confidence ${s.confidence}\n`;
      md+=`- Interest: ${s.interest.note} | availability ${s.interest.availability} | ~${s.interest.est_response_time_hrs}h | site visit: ${s.interest.wants_site_visit}\n`;
      md+=`- Trust ${s.trader.trust_score} (${s.trader.review_count} reviews), status ${s.trader.status}\n`;
      md+=`- No client details shared at this stage.\n\n`;
    });
    // consent gate status (nothing satisfied yet in sample)
    const gate=consentGate({tApproved:false, selectedTrader:false, clientConsent:false, traderAgreementAccepted:false, privacyAcknowledged:false});
    md+=`> Consent gate: ${gate.message} Missing: ${gate.missing.join(', ')}.\n`;
    md+=`> Next action: T reviews shortlist → selects trader → requests client consent → only then release details.\n\n`;
  }
  md+='\n_AI prepares suggestions only. No job is guaranteed and no result is promised. No client details '+
   'are shared and no trader is contacted without T approval and client consent._\n';
  return md;
}

function build(args){
  const traders=applyFeedback(loadTraders(args.traders||'sample-traders.csv'), loadReviews(args.reviews||'reviews.csv'));
  const byId={}; traders.forEach(t=>byId[t.trader_id]=t);
  const leads=loadLeads(args.leads||'sample-job-leads.csv');
  const interests=require('./trader_registry.js').parseCSV(fs.readFileSync(args.interests||'sample-trader-interests.csv','utf8'));
  return {traders, byId, leads, interests};
}

if(require.main===module){
  const args=parseArgs(process.argv);
  const {byId, leads, interests}=build(args);
  fs.writeFileSync(args.out||'sample-lead-board.md', render(leads, interests, byId));
  console.log('Wrote '+(args.out||'sample-lead-board.md')+' for '+leads.length+' leads.');
}
module.exports = { shortlistFor, render, build, NEVER_SHORTLIST, HIGH_RISK };
