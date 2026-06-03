#!/usr/bin/env node
/**
 * SiteVerdict Trusted Trader Network — Feedback / Reviews
 * Applies internal reviews to adjust trust signals and flag/suspend/ban recommendations.
 * INTERNAL ONLY. Recommendations require human (T) approval before any status change is acted on.
 */
const fs = require('fs');
const { parseCSV } = require('./trader_registry.js');

function loadReviews(csvPath){
  if(!fs.existsSync(csvPath)) return [];
  return parseCSV(fs.readFileSync(csvPath,'utf8'));
}

// derive feedback signals per trader; never auto-changes status — proposes action for T
function applyFeedback(traders, reviews){
  const byTrader={};
  for(const r of reviews){ (byTrader[r.trader_id]=byTrader[r.trader_id]||[]).push(r); }
  for(const t of traders){
    const rs=byTrader[t.trader_id]||[];
    t.feedback_count=rs.length;
    t.unresolved_complaints=rs.filter(r=>(r.complaint&&r.complaint!=='none')&&(r.outcome==='unresolved')).length;
    const ratings=rs.map(r=>parseFloat(r.client_rating)).filter(n=>!isNaN(n));
    t.feedback_avg=ratings.length?(ratings.reduce((a,b)=>a+b,0)/ratings.length):null;
    // proposed actions (for T to approve) — does NOT mutate status automatically
    t.proposed_action='none';
    if(rs.some(r=>r.action_taken==='ban')) t.proposed_action='ban (review)';
    else if(rs.some(r=>r.action_taken==='flag')||t.unresolved_complaints>0) t.proposed_action='flag / review';
    // trust score: blend registry review_score with feedback, penalise unresolved complaints
    let trust=t.review_score;
    if(t.feedback_avg!=null) trust=(t.review_score*0.6)+(t.feedback_avg*0.4);
    trust-=t.unresolved_complaints*1.5;
    if(t.review_count<3) trust-=0.3; // thin evidence
    t.trust_score=Math.max(0,Math.round(trust*100)/100);
    if(t.unresolved_complaints>0 && !t.flags.includes('unresolved_complaint')) t.flags.push('unresolved_complaint');
  }
  return traders;
}

module.exports = { loadReviews, applyFeedback };
