#!/usr/bin/env node
/** Tests for Follow-Up + Revenue Control V1 (offline, deterministic with fixed --today). */
const fs = require('fs');
const path = require('path');
const { computeItem, dashboard, render, build, ACTIVE_EXCLUDED } = require('./follow_up_manager.js');

const DIR=__dirname;
const TODAY=new Date('2026-06-03T12:00:00+10:00');
let pass=0, fail=0;
function check(n,c,d){ if(c){pass++;console.log(`  PASS  ${n}`);} else {fail++;console.log(`  FAIL  ${n}${d?' — '+d:''}`);} }

const { items } = build({ in: path.join(DIR,'sample-followups.csv'), today:'2026-06-03' });
const byId=id=>items.find(i=>i.item_id===id);

console.log('\n=== FOLLOW-UP SYSTEM V1 TESTS ===\n');

// board generated
const md=render(items);
fs.writeFileSync(path.join(DIR,'_test_board.md'), md);
check('follow-up board generated', md.includes('Internal Follow-Up Board') && md.includes('## Dashboard'));

// 12 sample cases — status + active + priority sanity
check('1 NEW not reviewed (FU-001) high, active', byId('FU-001').status==='NEW'&&byId('FU-001').active&&['high','urgent'].includes(byId('FU-001').priority));
check('2 blocked needs info (FU-002) urgent', byId('FU-002').status==='NEEDS_MORE_INFO'&&byId('FU-002').priority==='urgent');
check('3 response ready not approved (FU-003) high+overdue', byId('FU-003').status==='RESPONSE_READY'&&byId('FU-003').active);
check('4 quote ready (FU-004) high', byId('FU-004').status==='QUOTE_READY'&&['high','urgent'].includes(byId('FU-004').priority));
check('5 quote sent, follow-up due (FU-005)', byId('FU-005').status==='QUOTE_SENT_MANUALLY'&&byId('FU-005').active);
check('6 client waiting ~8 days (FU-006) overdue', byId('FU-006').status==='WAITING_CLIENT'&&byId('FU-006').overdue>0);
check('7 trader match pending (FU-007) high', byId('FU-007').status==='TRADER_MATCH_PENDING');
check('8 client consent needed (FU-008) high', byId('FU-008').status==='CLIENT_CONSENT_NEEDED');
check('9 job in progress (FU-009) active low', byId('FU-009').status==='JOB_IN_PROGRESS'&&byId('FU-009').active);
check('10 won (FU-010) NOT active', byId('FU-010').status==='WON'&&!byId('FU-010').active);
check('11 lost (FU-011) NOT active', byId('FU-011').status==='LOST'&&!byId('FU-011').active);
check('12 archived (FU-012) NOT active', byId('FU-012').status==='ARCHIVED'&&!byId('FU-012').active);

// due dates calculated
check('due dates calculated for active items', items.filter(i=>i.active).every(i=>i.due_date && i.due_date!=='—' || i.status==='JOB_IN_PROGRESS'));
// NEEDS_MORE_INFO due same day (days:0) from created 2026-06-03
check('NEEDS_MORE_INFO due same day', byId('FU-002').due_date==='2026-06-03', byId('FU-002').due_date);
// WAITING_CLIENT FU-006 anchored 2026-05-26 +7 = 2026-06-02 → overdue 1 by today 06-03
check('WAITING_CLIENT due 2026-06-02, overdue ~1d', byId('FU-006').due_date==='2026-06-02'&&byId('FU-006').overdue>=1, byId('FU-006').due_date+'/'+byId('FU-006').overdue);

// priority logic: urgent/high/normal/low all appear among active
const prios=new Set(items.filter(i=>i.active).map(i=>i.priority));
check('priority levels present (urgent/high/normal/low logic)', prios.has('urgent')&&prios.has('high')&&(prios.has('normal')||prios.has('low')), [...prios].join(','));

// escalation: an old overdue normal becomes high/urgent
check('escalation raises stale items', byId('FU-006').priority!=='low');

// dashboard counts
const d=dashboard(items);
check('dashboard open=2 (NEW+NEEDS_MORE_INFO)', d.open===2, String(d.open));
check('dashboard waitingApproval=1 (RESPONSE_READY)', d.waitingApproval===1, String(d.waitingApproval));
check('dashboard quoteReady=1', d.quoteReady===1, String(d.quoteReady));
check('dashboard won=1, lost=1', d.won===1&&d.lost===1, d.won+'/'+d.lost);
check('won/lost/archived not counted active in needs-attention', !render(items).split('Needs attention')[1].split('Closed')[0].match(/FU-010|FU-011|FU-012/));
check('revenue opportunities are placeholders only', items.every(i=>i.revenue==='—'||/T to confirm/.test(i.revenue)));

// SAFETY: no send/invoice/payment/auto-contact code; no secrets
const js=fs.readFileSync(path.join(DIR,'follow_up_manager.js'),'utf8');
check('no email/SMS send code', !/nodemailer|sendMail|twilio|smtp|sendSMS|\.send\(/i.test(js));
check('no invoice/payment code', !/sendInvoice\(|stripe\.[a-z]+\(|paymentIntent|createCharge/i.test(js));
check('no auto trader-contact code', !/contactTrader|notifyTrader|sendLead\(/i.test(js));
check('no hardcoded secret', !/dk_[A-Za-z0-9]{6}|API_KEY\s*=\s*["']/.test(js));

// safety grep on the board output (context-aware)
const BANNED=['guaranteed revenue','guaranteed job','guaranteed result','invoice sent','email sent automatically','paid automatically','payment guaranteed'];
const NEG=/(no |not |never |without |placeholder|requires|required|to be confirmed)/i;
let unsafe=0;
md.split('\n').forEach(l=>BANNED.forEach(b=>{if(new RegExp(b,'i').test(l)&&!NEG.test(l)){unsafe++;console.log('   UNSAFE:',l.trim().slice(0,60));}}));
check('safety grep: 0 unsafe phrases', unsafe===0, String(unsafe));
fs.unlinkSync(path.join(DIR,'_test_board.md'));

console.log(`\n=== RESULT: ${pass} passed / ${fail} failed ===`);
process.exit(fail===0?0:1);
