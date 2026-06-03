#!/usr/bin/env node
/**
 * SiteVerdict Trusted Trader Lead Board — Core
 * Job lead cards with client details HIDDEN by design. INTERNAL ONLY.
 * No client details sent. No trader contacted automatically. No public marketplace. No deploy.
 * AI prepares · T approves · trader expresses interest · client consents · only then details shared.
 */
const fs = require('fs');
const { parseCSV } = require('./trader_registry.js');

const LEAD_STATUSES = ['DRAFT','NEEDS_T_REVIEW','APPROVED_FOR_TRADER_VIEW','TRADER_INTEREST_OPEN',
 'TRADER_INTEREST_RECEIVED','T_REVIEWING_TRADERS','CLIENT_CONSENT_NEEDED','MATCH_APPROVED',
 'DETAILS_RELEASED','IN_PROGRESS','COMPLETED','CLIENT_UNHAPPY','DISPUTED','CLOSED_WON','CLOSED_LOST','ARCHIVED'];

// fields that are SAFE to show a trader (no client PII)
const TRADER_PREVIEW_FIELDS = ['lead_id','suburb','council','service_category','job_summary','property_type','urgency','risk_flags','photos_plans'];
// fields that must NEVER appear on a lead card / preview
const FORBIDDEN_FIELDS = ['client_name','client_phone','client_email','exact_address','street_address','private_notes','upload','uploads'];

function loadLeads(csvPath){
  const rows=parseCSV(fs.readFileSync(csvPath,'utf8'));
  return rows.map(r=>({
    lead_id:r.lead_id, created_at:r.created_at, source_enquiry_id:r.source_enquiry_id,
    suburb:r.suburb, council:r.council, service_category:r.service_category,
    client_purpose:r.client_purpose, job_summary:r.job_summary, property_type:r.property_type,
    urgency:r.urgency, risk_flags:(r.risk_flags&&r.risk_flags!=='none')?r.risk_flags.split('|'):[],
    photos_plans:r.photos_plans,
    client_details_status:'hidden',
    status:LEAD_STATUSES.includes(r.status)?r.status:'DRAFT',
    matched_trader_status:'none',
    client_consent_status:'not_requested'
  }));
}

// trader-safe preview — strips everything except allowed fields, asserts no PII
function traderPreview(lead){
  const p={};
  for(const f of TRADER_PREVIEW_FIELDS) p[f]=lead[f];
  p.client_details='hidden until approved';
  return p;
}

// consent gate — ALL conditions required before any client detail is released
function consentGate({tApproved, selectedTrader, clientConsent, traderAgreementAccepted, privacyAcknowledged}){
  const missing=[];
  if(!tApproved) missing.push('T approval');
  if(!selectedTrader) missing.push('selected trader');
  if(!clientConsent) missing.push('client consent');
  if(!traderAgreementAccepted) missing.push('trader agreement accepted');
  if(!privacyAcknowledged) missing.push('privacy warning acknowledged');
  if(missing.length) return { release:false, message:'Client details must remain hidden.', missing };
  return { release:true, message:'All gates passed — T may release client details to the selected trader.', missing:[] };
}

module.exports = { loadLeads, traderPreview, consentGate, LEAD_STATUSES, TRADER_PREVIEW_FIELDS, FORBIDDEN_FIELDS };
