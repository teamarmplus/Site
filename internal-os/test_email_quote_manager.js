#!/usr/bin/env node
/** Tests for Email + Quote Draft Manager V2 (offline). */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const M = require('./email_quote_manager.js');

const DIR=__dirname;
let pass=0, fail=0;
function check(n,c,d){ if(c){pass++;console.log(`  PASS  ${n}`);} else {fail++;console.log(`  FAIL  ${n}${d?' — '+d:''}`);} }

console.log('\n=== EMAIL + QUOTE MANAGER V2 TESTS ===\n');

// build a 10-case synthetic queue exercising every type + decision
const queue=[
 {enquiry_id:'enq-001',name:'Alice Resident',email:'alice@e.com',phone:'04',address:'45 Oxford St Epping NSW 2121',purpose:'develop',status:'QUOTE_READY',baseStatus:'PASS',confidence:'High',pathway:'Town planner first',flags:['min_lot_not_confirmed'],draft_excerpt:'Zone R4; min-lot 550',quote:'x'},
 {enquiry_id:'enq-002',name:'Ben Buyer',email:'ben@e.com',phone:'04',address:'12 Valentine Ave Parramatta NSW 2150',purpose:'buy',status:'WAITING_APPROVAL',baseStatus:'REVIEW',confidence:'Medium',pathway:'Planner + conveyancer',flags:['min_lot_not_confirmed'],draft_excerpt:'Zone E2',quote:'x'},
 {enquiry_id:'enq-003',name:'Dan OC',email:'dan@e.com',phone:'04',address:'2 Honeysuckle Dr Newcastle NSW 2300',purpose:'oc',status:'QUOTE_READY',baseStatus:'PASS',confidence:'Medium',pathway:'OC external works',flags:['quote_needs_price'],draft_excerpt:'Zone MU1',quote:'x'},
 {enquiry_id:'enq-004',name:'Cara NoMatch',email:'cara@e.com',phone:'04',address:'GEORGE STREET',purpose:'notsure',status:'NEEDS_INFO',baseStatus:'BLOCKED',confidence:'Low',pathway:'Not enough information',flags:['address_not_matched'],draft_excerpt:'—',quote:''},
 {enquiry_id:'enq-005',name:'Gita Build',email:'gita@e.com',phone:'04',address:'1 Heritage Lane Springwood NSW 2777',purpose:'build',status:'WAITING_APPROVAL',baseStatus:'REVIEW',confidence:'High',pathway:'Planner/certifier + heritage/flood/BAL',flags:['heritage_detected','flood_detected','bushfire_detected'],draft_excerpt:'Zone R2',quote:'x'},
 {enquiry_id:'enq-006',name:'Maya Drains',email:'maya@e.com',phone:'04',address:'8 Creek Rd Penrith NSW 2750',purpose:'external',status:'QUOTE_READY',baseStatus:'PASS',confidence:'Medium',pathway:'Drainage/stormwater + driveway',flags:['quote_needs_price'],draft_excerpt:'Zone R2',quote:'x'},
 {enquiry_id:'enq-007',name:'Quinn Quote',email:'quinn@e.com',phone:'04',address:'5 King St Newcastle NSW 2300',purpose:'develop',status:'WAITING_APPROVAL',baseStatus:'REVIEW',confidence:'Medium',pathway:'Planner first',flags:[],draft_excerpt:'Zone R3',quote:'x'},
 {enquiry_id:'enq-008',name:'Rita Revise',email:'rita@e.com',phone:'04',address:'9 Queen St Sydney NSW 2000',purpose:'develop',status:'WAITING_APPROVAL',baseStatus:'REVIEW',confidence:'Low',pathway:'Planner first',flags:['zone_not_confirmed'],draft_excerpt:'—',quote:'x'},
 {enquiry_id:'enq-009',name:'Will Won',email:'will@e.com',phone:'04',address:'3 Park Ave Camden NSW 2570',purpose:'develop',status:'WON',baseStatus:'PASS',confidence:'High',pathway:'Completed',flags:[],draft_excerpt:'Zone R2; min-lot 600',quote:'x'},
 {enquiry_id:'enq-010',name:'Lou Lost',email:'lou@e.com',phone:'04',address:'7 Hill St Wollongong NSW 2500',purpose:'sell',status:'ARCHIVED',baseStatus:'PASS',confidence:'Medium',pathway:'Data summary',flags:[],draft_excerpt:'Zone R1',quote:''}
];
const decisions=[
 {decision_id:'dec-001',enquiry_id:'enq-003',decision:'PREPARE_QUOTE',decided_by:'T',decision_note:'',created_at:'2026-06-03T08:00:00+10:00'},
 {decision_id:'dec-002',enquiry_id:'enq-004',decision:'NEEDS_MORE_INFO',decided_by:'T',decision_note:'',created_at:'2026-06-03T08:01:00+10:00'},
 {decision_id:'dec-003',enquiry_id:'enq-008',decision:'REVISION_REQUESTED',decided_by:'T',decision_note:'',created_at:'2026-06-03T08:02:00+10:00'},
 {decision_id:'dec-004',enquiry_id:'enq-009',decision:'MARK_WON',decided_by:'T',decision_note:'',created_at:'2026-06-03T08:03:00+10:00'},
 {decision_id:'dec-005',enquiry_id:'enq-010',decision:'MARK_LOST',decided_by:'T',decision_note:'',created_at:'2026-06-03T08:04:00+10:00'},
 {decision_id:'dec-006',enquiry_id:'enq-001',decision:'APPROVED_TO_SEND',decided_by:'T',decision_note:'',created_at:'2026-06-03T08:05:00+10:00'}
];

const OUT=path.join(DIR,'output','email-manager-test');
fs.rmSync(OUT,{recursive:true,force:true});
fs.mkdirSync(OUT,{recursive:true});
fs.writeFileSync(path.join(OUT,'queue.json'),JSON.stringify(queue,null,2));
fs.writeFileSync(path.join(OUT,'decisions.json'),JSON.stringify(decisions,null,2));

// run the manager
execFileSync('node',[path.join(DIR,'email_quote_manager.js'),'--queue',path.join(OUT,'queue.json'),'--decisions',path.join(OUT,'decisions.json'),'--out',OUT],{cwd:DIR,encoding:'utf8'});

const read=p=>fs.existsSync(path.join(OUT,p))?fs.readFileSync(path.join(OUT,p),'utf8'):'';
const has=p=>fs.existsSync(path.join(OUT,p));

// index exists
check('email-index.md generated', has('email-index.md'));

// 10 case selection logic
function sel(id){ const it=queue.find(q=>q.enquiry_id===id); return M.selectDrafts(it, M.latestDecision(decisions,id)); }
check('1 develop PASS+approved → review-offer + quote', sel('enq-001').emailType==='review-offer'&&sel('enq-001').makeQuote);
check('2 buy REVIEW → review-offer (planner/conveyancer)', sel('enq-002').emailType==='review-offer');
check('3 OC + PREPARE_QUOTE → review-offer + quote', sel('enq-003').makeQuote===true);
check('4 address not matched → more-info, no quote', sel('enq-004').emailType==='more-info'&&!sel('enq-004').makeQuote);
check('5 heritage/flood/bushfire build → review-offer', sel('enq-005').emailType==='review-offer');
check('6 drainage/external → service-pathway', sel('enq-006').emailType==='service-pathway');
check('7 quote-ready develop → quote made', sel('enq-007').makeQuote===true);
check('8 REVISION_REQUESTED → revision note, no quote', sel('enq-008').emailType==='revision'&&!sel('enq-008').makeQuote);
check('9 WON → follow-up', sel('enq-009').makeFollowUp===true);
check('10 LOST/ARCHIVED → no active email', sel('enq-010').emailType==='none');

// quote only when appropriate: blocked/lost have none
check('no quote for BLOCKED (enq-004)', !has('quotes/enq-004.md'));
check('no quote for LOST (enq-010)', !has('quotes/enq-010.md'));
check('quote present for OC (enq-003)', has('quotes/enq-003.md'));

// email content quality checks
const e1=read('emails/enq-001.md');
check('email uses first name only (Alice)', /Hi Alice,/.test(e1)&&!/Hi Alice Resident/.test(e1));
check('email has subject', /\*\*Subject:\*\*/.test(e1));
check('email has confirmed + needs-checking structure', /could confirm/i.test(e1)&&/needs checking/i.test(e1));
check('email has approval gate', /NEEDS HUMAN APPROVAL/.test(e1));
check('email has preliminary/not-advice line', /not legal, planning, financial/.test(e1));

// quote content quality
const q3=read('quotes/enq-003.md');
check('quote has Quote ID', /Quote ID:/.test(q3));
check('quote has deliverables', /## Deliverables/.test(q3));
check('quote has assumptions', /## Assumptions/.test(q3));
check('quote has validity placeholder', /valid until:\s*\*\*T to confirm/i.test(q3));
check('quote price is T to confirm', /Price:\s*\*\*T to confirm/.test(q3));
check('quote requires human approval', /NEEDS HUMAN APPROVAL/.test(q3));

// SAFETY grep across all generated outputs
const BANNED=['guaranteed approval','guaranteed value','guaranteed profit','strong buy','certain subdivision','loan approval','investment advice','will be approved','invoice sent','email sent automatically','paid automatically','click to pay','payment link'];
const NEG=/(no |not |never |without |does not|cannot|could imply|requires approval|no invoice|no email|no payment)/i;
let unsafe=0;
function scan(d){for(const f of fs.readdirSync(d)){const p=path.join(d,f);if(fs.statSync(p).isDirectory())scan(p);else if(/\.(md)$/.test(f)){fs.readFileSync(p,'utf8').split('\n').forEach(l=>BANNED.forEach(b=>{if(new RegExp(b,'i').test(l)&&!NEG.test(l)){unsafe++;console.log('   UNSAFE:',f,'::',l.trim().slice(0,60));}}));}}}
scan(OUT);
check('safety grep: 0 unguarded unsafe phrases', unsafe===0, String(unsafe));

// no send/payment code in the manager
const js=fs.readFileSync(path.join(DIR,'email_quote_manager.js'),'utf8');
check('no SMTP/Gmail/send code', !/nodemailer|smtp|googleapis|gmail|sendMail|\.send\(/i.test(js));
check('no invoice/Stripe/Xero/QuickBooks/payment code', !/require\(['"](stripe|xero|quickbooks|node-quickbooks)|stripe\.[a-z]+\(|xero\.[a-z]+\(|sendInvoice\s*\(|paymentIntent|createCharge/i.test(js));
check('no hardcoded secret', !/dk_[A-Za-z0-9]{6}|API_KEY\s*=\s*["']/.test(js));

console.log(`\n=== RESULT: ${pass} passed / ${fail} failed ===`);
process.exit(fail===0?0:1);
