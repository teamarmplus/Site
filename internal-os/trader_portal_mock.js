#!/usr/bin/env node
/**
 * SiteVerdict Lead Board — Trader Portal (MOCK, read-only)
 * Simulates what an APPROVED trader would see: a client-safe lead preview only.
 * INTERNAL MOCK. No real portal, no login, no client PII, no contact. Demonstrates the privacy boundary.
 *
 * USAGE: node trader_portal_mock.js --leads sample-job-leads.csv --trader TR-012
 */
const fs = require('fs');
const { loadLeads, traderPreview, FORBIDDEN_FIELDS } = require('./lead_board.js');
const { loadTraders } = require('./trader_registry.js');

function parseArgs(argv){const a={};for(let i=2;i<argv.length;i++){if(argv[i].startsWith('--')){a[argv[i].slice(2)]=(argv[i+1]&&!argv[i+1].startsWith('--'))?argv[++i]:true;}}return a;}

// what a trader can see for a lead (preview only). Throws if any forbidden field sneaks in.
function viewAsTrader(lead){
  const pv=traderPreview(lead);
  for(const f of FORBIDDEN_FIELDS){ if(f in pv) throw new Error('PRIVACY BREACH: forbidden field in preview: '+f); }
  return pv;
}

// only approved/probation traders may view the board at all
function canViewBoard(trader){
  return ['approved','probation','verified'].includes(trader.status) && !trader.flags.includes('unresolved_complaint');
}

if(require.main===module){
  const args=parseArgs(process.argv);
  const leads=loadLeads(args.leads||'sample-job-leads.csv');
  console.log('=== TRADER PORTAL (MOCK) — client-safe previews only ===');
  console.log('Trader sees: suburb/council, service type, general scope, timing, risk label.');
  console.log('Trader NEVER sees: client name, phone, email, exact address, private notes, uploads.\n');
  for(const lead of leads){
    const pv=viewAsTrader(lead);
    console.log(`[${pv.lead_id}] ${pv.service_category} @ ${pv.suburb} (${pv.council}) — ${pv.job_summary}`);
    console.log(`   urgency:${pv.urgency} photos/plans:${pv.photos_plans} → ${pv.client_details}\n`);
  }
}
module.exports = { viewAsTrader, canViewBoard };
