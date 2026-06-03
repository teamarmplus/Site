#!/usr/bin/env node
/**
 * SiteVerdict Internal OS — Decision Log
 * Appends a human decision record to output/decisions.json. AI prepares · T approves · System records.
 * INTERNAL ONLY. No email/invoice sent. No payment. No public file changed.
 *
 * USAGE (CLI)
 *   node decision_log.js --enquiry ENQ-001 --decision APPROVED_TO_SEND --by T --note "Approved after checking address" --out ./output
 * Programmatic: const { recordDecision } = require('./decision_log.js');
 */
const fs = require('fs');
const path = require('path');

const ALLOWED = ['APPROVED_TO_SEND','REVISION_REQUESTED','NEEDS_MORE_INFO','PREPARE_QUOTE','ARCHIVE','MARK_WON','MARK_LOST'];

function parseArgs(argv){const a={};for(let i=2;i<argv.length;i++){if(argv[i].startsWith('--')){a[argv[i].slice(2)]=(argv[i+1]&&!argv[i+1].startsWith('--'))?argv[++i]:true;}}return a;}
function ensureDir(d){if(!fs.existsSync(d))fs.mkdirSync(d,{recursive:true});}

function loadDecisions(file){
  if(fs.existsSync(file)){ try{ const d=JSON.parse(fs.readFileSync(file,'utf8')); if(Array.isArray(d)) return d; }catch(e){} }
  return [];
}

// validate + append; returns the new record (does NOT send anything)
function recordDecision({enquiry_id, decision, decided_by='T', decision_note='', outDir='./output'}){
  if(!enquiry_id) throw new Error('enquiry_id required');
  if(!ALLOWED.includes(decision)) throw new Error('decision must be one of: '+ALLOWED.join(', '));
  ensureDir(outDir);
  const file = path.join(outDir,'decisions.json');
  const log = loadDecisions(file);
  const rec = {
    decision_id: 'dec-'+String(log.length+1).padStart(3,'0'),
    enquiry_id, decision, decided_by,
    decision_note: decision_note||'',
    created_at: new Date().toISOString()
  };
  log.push(rec);
  fs.writeFileSync(file, JSON.stringify(log,null,2));
  return rec;
}

if(require.main===module){
  const a=parseArgs(process.argv);
  try{
    const rec=recordDecision({ enquiry_id:a.enquiry, decision:a.decision, decided_by:a.by||'T', decision_note:a.note||'', outDir:a.out||'./output' });
    console.log('Recorded:', JSON.stringify(rec));
    console.log('(No email or invoice was sent. Decision recorded only.)');
  }catch(e){ console.error('DECISION ERROR:', e.message); process.exit(1); }
}
module.exports = { recordDecision, loadDecisions, ALLOWED };
