#!/usr/bin/env node
/** Tests for Approval Console V2 — runs offline against sample-queue.json. */
const fs = require('fs');
const path = require('path');
const { generate, render, priorityOf, summaryCards, loadQueue } = require('./approval_console.js');

let pass=0, fail=0;
function check(name, cond, detail){ if(cond){pass++;console.log(`  PASS  ${name}`);} else {fail++;console.log(`  FAIL  ${name}${detail?' — '+detail:''}`);} }

console.log('\n=== APPROVAL CONSOLE V2 TESTS ===\n');

// sample data
const queue = JSON.parse(fs.readFileSync(path.join(__dirname,'sample-queue.json'),'utf8'));
check('sample queue has 8 items', queue.length===8, String(queue.length));
const decisions = JSON.parse(fs.readFileSync(path.join(__dirname,'sample-decisions.json'),'utf8'));
const ALLOWED=['APPROVED_TO_SEND','REVISION_REQUESTED','NEEDS_MORE_INFO','PREPARE_QUOTE','ARCHIVE','MARK_WON','MARK_LOST'];
check('decisions schema valid', decisions.every(d=>d.decision_id&&d.enquiry_id&&ALLOWED.includes(d.decision)&&d.decided_by&&d.created_at), 'fields/decision enum');

// generate
const r = generate({ queue: path.join(__dirname,'sample-queue.json'), out: path.join(__dirname,'output') });
check('approval-console.html generated', fs.existsSync(r.out));
const html = fs.readFileSync(r.out,'utf8');

// statuses render
check('statuses render', ['NEEDS_INFO','WAITING_APPROVAL','QUOTE_READY','WON','PREP_READY'].every(s=>html.includes(s)));

// priority sorting: urgent (BLOCKED) first
const ordered = queue.map(it=>({...it,_p:priorityOf(it)})).sort((a,b)=>a._p.rank-b._p.rank);
check('priority sorting: urgent first', ordered[0]._p.label==='urgent', ordered[0]._p.label);
check('priority labels present in html', ['urgent','high','normal','low'].every(l=>html.includes('prio-'+l)));

// summary cards count correctly
const c = summaryCards(queue);
check('summary: needsInfo=1', c.needsInfo===1, String(c.needsInfo));
check('summary: waiting=3', c.waiting===3, String(c.waiting));
check('summary: quoteReady=2', c.quoteReady===2, String(c.quoteReady));
check('summary: won=1', c.won===1, String(c.won));
check('summary: opportunities counted', c.opportunities>=2, String(c.opportunities));

// safety warnings appear
check('warning: address not matched', html.includes('Address not confidently matched'));
check('warning: min lot not confirmed', html.includes('Minimum lot size not confirmed'));
check('warning: heritage/flood/bushfire', html.includes('Heritage indicator detected')&&html.includes('Flood planning indicator detected')&&html.includes('Bushfire prone indicator detected'));
check('warning: quote needs price', html.includes('Quote needs T price approval'));
check('banner: not sent automatically', /No email is sent automatically/.test(html)&&/No invoice is sent automatically/.test(html));

// no real send logic / no secrets / no public files
const js = fs.readFileSync(path.join(__dirname,'approval_console.js'),'utf8');
check('no email-send logic', !/sendMail|nodemailer|smtp|\.send\(/.test(js));
// match actual send/payment CODE patterns, not safe prose like "No payment is connected"
check('no invoice-send logic', !/sendInvoice\s*\(|require\(['"]stripe|stripe\.[a-z]+\(|createCharge|payment(Intent|Gateway)/i.test(js));
check('no hardcoded API key', !/dk_[A-Za-z0-9]{6}|API_KEY\s*=\s*["']/.test(js));

// safety grep on generated html (context-aware)
const BANNED=['guaranteed approval','guaranteed value','guaranteed profit','strong buy','certain subdivision','loan approval','investment advice','invoice sent','email sent automatically','paid automatically'];
const NEG=/(no |not |never |without |does not|cannot|requires approval|no invoice|no email)/i;
let unsafe=0;
html.split('\n').forEach(line=>BANNED.forEach(b=>{ if(new RegExp(b,'i').test(line)&&!NEG.test(line)){unsafe++;console.log('   UNSAFE:',line.trim().slice(0,70));} }));
check('safety grep: 0 unguarded banned phrases', unsafe===0, String(unsafe));

console.log(`\n=== RESULT: ${pass} passed / ${fail} failed ===`);
process.exit(fail===0?0:1);
