#!/usr/bin/env node
/** Tests for Trusted Trader Lead Board V1 (offline). */
const fs = require('fs');
const path = require('path');
const { loadTraders } = require('./trader_registry.js');
const { loadReviews, applyFeedback } = require('./trader_feedback.js');
const { loadLeads, traderPreview, consentGate, FORBIDDEN_FIELDS } = require('./lead_board.js');
const { shortlistFor, render } = require('./lead_matcher.js');
const { viewAsTrader } = require('./trader_portal_mock.js');

const DIR=__dirname;
let pass=0, fail=0;
function check(n,c,d){ if(c){pass++;console.log(`  PASS  ${n}`);} else {fail++;console.log(`  FAIL  ${n}${d?' — '+d:''}`);} }

const traders=applyFeedback(loadTraders(path.join(DIR,'sample-traders.csv')), loadReviews(path.join(DIR,'reviews.csv')));
const byId={}; traders.forEach(t=>byId[t.trader_id]=t);
const leads=loadLeads(path.join(DIR,'sample-job-leads.csv'));
const interests=require('./trader_registry.js').parseCSV(fs.readFileSync(path.join(DIR,'sample-trader-interests.csv'),'utf8'));
const lead=id=>leads.find(l=>l.lead_id===id);
const sl=id=>shortlistFor(lead(id), interests, byId).shortlist.map(s=>s.trader.trader_id);

console.log('\n=== LEAD BOARD V1 TESTS ===\n');

// 1 + 2 lead cards hide client details
check('1 drainage lead card hides client details', lead('LEAD-001').client_details_status==='hidden');
check('2 driveway lead card hides client details', lead('LEAD-002').client_details_status==='hidden');

// 3 trader interest does not reveal client details (preview has no PII)
const pv=viewAsTrader(lead('LEAD-001'));
check('3 trader preview has NO forbidden client fields', FORBIDDEN_FIELDS.every(f=>!(f in pv)) && pv.client_details==='hidden until approved');

// 4 approved trader can be shortlisted (TR-012 approved drainage on LEAD-001)
check('4 approved trader shortlisted', sl('LEAD-001').includes('TR-012'), sl('LEAD-001').join(','));

// 5 banned trader cannot be shortlisted (TR-007 banned, interested in LEAD-004 excavation)
check('5 banned trader NOT shortlisted', !sl('LEAD-004').includes('TR-007'), sl('LEAD-004').join(','));

// 6 suspended trader cannot be shortlisted (TR-006 suspended, interested in LEAD-001)
check('6 suspended trader NOT shortlisted', !sl('LEAD-001').includes('TR-006'), sl('LEAD-001').join(','));

// 7 wrong-category trader cannot be shortlisted (TR-002 is driveway/civil, interest only on LEAD-002; ensure not on a drainage-only lead)
// craft: TR-010 (landscaping) would be wrong for drainage; it has no interest row, so test category guard directly
const wrongCat=shortlistFor(lead('LEAD-001'), [{interest_id:'X',lead_id:'LEAD-001',trader_id:'TR-010',availability:'available',est_response_time_hrs:'5',note:'',wants_site_visit:'no',status:'received'}], byId).shortlist.map(s=>s.trader.trader_id);
check('7 wrong-category trader NOT shortlisted', !wrongCat.includes('TR-010'), wrongCat.join(','));

// 8 outside-area trader cannot be shortlisted (TR-003 Newcastle interested in a Parramatta lead)
const outArea=shortlistFor(lead('LEAD-001'), [{interest_id:'Y',lead_id:'LEAD-001',trader_id:'TR-003',availability:'available',est_response_time_hrs:'5',note:'',wants_site_visit:'no',status:'received'}], byId).shortlist.map(s=>s.trader.trader_id);
check('8 outside-area trader NOT shortlisted', !outArea.includes('TR-003'), outArea.join(','));

// 9 details cannot be released without T approval
let g=consentGate({tApproved:false, selectedTrader:true, clientConsent:true, traderAgreementAccepted:true, privacyAcknowledged:true});
check('9 no release without T approval', g.release===false && g.message==='Client details must remain hidden.' && g.missing.includes('T approval'));

// 10 details cannot be released without client consent
g=consentGate({tApproved:true, selectedTrader:true, clientConsent:false, traderAgreementAccepted:true, privacyAcknowledged:true});
check('10 no release without client consent', g.release===false && g.missing.includes('client consent'));

// all gates satisfied → release allowed (sanity)
g=consentGate({tApproved:true, selectedTrader:true, clientConsent:true, traderAgreementAccepted:true, privacyAcknowledged:true});
check('all gates satisfied → release allowed', g.release===true);

// 11 client unhappy feedback flags trader (TR-006 unresolved complaint flagged via feedback)
check('11 unhappy feedback flags trader', byId['TR-006'].flags.includes('unresolved_complaint'));

// 12 no suitable trader → warning (LEAD-006 Dubbo drainage, no trader serves Dubbo + only TR-? interested) 
const dubbo=shortlistFor(lead('LEAD-006'), interests, byId);
check('12 no suitable trader → warning', dubbo.shortlist.length===0 && /No suitable verified trader yet/.test(dubbo.warning), dubbo.warning);

// high-risk: LEAD-004 excavation high-risk + only banned TR-007 interested → empty
check('bonus: high-risk excavation, banned-only interest → no shortlist', sl('LEAD-004').length===0, sl('LEAD-004').join(','));

// privacy: rendered board contains NO PII tokens and keeps client hidden
const md=render(leads, interests, byId);
fs.writeFileSync(path.join(DIR,'_test_board.md'), md);
check('rendered board keeps client details hidden', /Client details: hidden until approved/.test(md) && !/@example\.com/.test(md) && !/04000001\d\d/.test(md));

// SAFETY grep
const BANNED=['guaranteed best trader','guaranteed cheapest','guaranteed quality','guaranteed result','no risk','client details sent automatically','lead sold automatically','payment guaranteed','job guaranteed'];
const NEG=/(no |not |never |without |does not|cannot|requires|required|hidden)/i;
let unsafe=0;
const scanFiles=['_test_board.md','trader-agreement-rules.md','client-consent-rules.md','README_LEAD_BOARD.md'].map(f=>path.join(DIR,f)).filter(fs.existsSync);
for(const f of scanFiles){ fs.readFileSync(f,'utf8').split('\n').forEach(l=>BANNED.forEach(b=>{if(new RegExp(b,'i').test(l)&&!NEG.test(l)){unsafe++;console.log('   UNSAFE:',path.basename(f),'::',l.trim().slice(0,60));}})); }
check('safety grep: 0 unsafe phrases', unsafe===0, String(unsafe));
fs.unlinkSync(path.join(DIR,'_test_board.md'));

// no auto-send / no lead-sale / no auto-contact code
const js=['lead_board.js','lead_matcher.js','trader_portal_mock.js'].map(f=>fs.readFileSync(path.join(DIR,f),'utf8')).join('\n');
check('no email/SMS/auto-contact code', !/nodemailer|sendMail|twilio|smtp|sendSMS|\.send\(/i.test(js));
check('no payment/lead-sale code', !/stripe|paymentIntent|sellLead|chargeLead/i.test(js));

console.log(`\n=== RESULT: ${pass} passed / ${fail} failed ===`);
process.exit(fail===0?0:1);
