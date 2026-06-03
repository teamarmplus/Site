#!/usr/bin/env node
/**
 * SiteVerdict Trusted Trader Network — Registry
 * Loads + validates trader records. INTERNAL ONLY. No client details sent. No auto-contact. No deploy.
 */
const fs = require('fs');

const STATUSES = ['candidate','contacted','verified','probation','approved','suspended','banned','inactive'];
const MATCHABLE = ['approved','verified','probation']; // probation only for normal-risk (see matcher)

function parseCSV(text){
  const lines=text.split(/\r?\n/).filter(l=>l.trim());
  const headers=lines[0].split(',').map(h=>h.trim());
  return lines.slice(1).map(line=>{const vals=[];let cur='',q=false;for(const ch of line){if(ch==='"'){q=!q;}else if(ch===','&&!q){vals.push(cur);cur='';}else cur+=ch;}vals.push(cur);const o={};headers.forEach((h,i)=>o[h]=(vals[i]||'').trim());return o;});
}

function loadTraders(csvPath){
  const rows=parseCSV(fs.readFileSync(csvPath,'utf8'));
  return rows.map(r=>({
    trader_id:r.trader_id, business_name:r.business_name, contact_name:r.contact_name,
    phone:r.phone, email:r.email, website:r.website,
    abn_licence:r.abn_licence, insurance_status:r.insurance_status,
    categories:(r.categories||'').split('|').map(s=>s.trim()).filter(Boolean),
    service_areas:r.service_areas,
    base_location:r.base_location,
    councils_suburbs:(r.councils_suburbs||'').split('|').map(s=>s.trim()).filter(Boolean),
    review_score:parseFloat(r.review_score)||0,
    review_count:parseInt(r.review_count)||0,
    years_experience:parseInt(r.years_experience)||0,
    proof_of_work:r.proof_of_work,
    preferred_job_size:r.preferred_job_size,
    response_time_hrs:parseInt(r.response_time_hrs)||999,
    availability:r.availability,
    notes:r.notes,
    status:STATUSES.includes(r.status)?r.status:'candidate',
    flags:[]
  }));
}

function validateTrader(t){
  const issues=[];
  if(!t.trader_id) issues.push('missing trader_id');
  if(!t.categories.length) issues.push('no service categories');
  if(!t.councils_suburbs.length) issues.push('no service area');
  if(!STATUSES.includes(t.status)) issues.push('invalid status');
  return issues;
}

module.exports = { loadTraders, validateTrader, parseCSV, STATUSES, MATCHABLE };
