#!/usr/bin/env node
/**
 * Full internal-loop test (offline, fixture mode):
 * sample CSV -> intake_import -> approval_queue (queue.json) -> approval_console render -> decision_log
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const DIR = __dirname;
const OUT = path.join(DIR,'output-looptest');
let pass=0, fail=0;
function check(name, cond, detail){ if(cond){pass++;console.log(`  PASS  ${name}`);} else {fail++;console.log(`  FAIL  ${name}${detail?' — '+detail:''}`);} }
function run(file,args){ return execFileSync('node',[path.join(DIR,file),...args],{cwd:DIR,encoding:'utf8'}); }

console.log('\n=== INTERNAL LOOP TEST (offline) ===\n');

// clean
fs.rmSync(OUT,{recursive:true,force:true});

// 1) intake
run('intake_import.js',['--csv','sample-netlify-form-export.csv','--out',OUT]);
const enquiries = JSON.parse(fs.readFileSync(path.join(OUT,'enquiries.json'),'utf8'));
check('intake created enquiries.json (8)', enquiries.length===8, String(enquiries.length));

// 2) approval queue -> queue.json (fixture mode)
run('approval_queue.js',['--input',path.join(OUT,'enquiries.json'),'--out',OUT,'--fixtures']);
check('queue.json created', fs.existsSync(path.join(OUT,'queue.json')));
const queue = JSON.parse(fs.readFileSync(path.join(OUT,'queue.json'),'utf8'));
check('queue.json has 8 records', queue.length===8, String(queue.length));

// schema fields present
const r0 = queue[0];
const required = ['enquiry_id','name','email','phone','address','purpose','status','baseStatus','confidence','created_at','action','pathway','risk','flags','prep','email_file','quote','summary','draft_excerpt','quote_excerpt'];
check('queue record has all console-schema fields', required.every(k=>k in r0), required.filter(k=>!(k in r0)).join(','));
check('contact email is an email (not a file path)', /@/.test(r0.email)&&!/\.md$/.test(r0.email), r0.email);
check('email_file is the draft link', /draft-emails\/.+\.md$/.test(r0.email_file), r0.email_file);

// statuses derived across the set
const statuses = new Set(queue.map(q=>q.status));
check('NEEDS_INFO present (BLOCKED enquiry)', statuses.has('NEEDS_INFO'));
check('WAITING_APPROVAL present (REVIEW enquiry)', statuses.has('WAITING_APPROVAL'));
check('QUOTE_READY or PREP_READY present (PASS enquiry)', statuses.has('QUOTE_READY')||statuses.has('PREP_READY'));

// 3) console reads the REAL queue.json
const { generate } = require('./approval_console.js');
const g = generate({ queue: path.join(OUT,'queue.json'), out: OUT });
check('console generated from queue.json', fs.existsSync(g.out));
check('console source is queue.json (not sample)', /queue\.json$/.test(g.source), g.source);
const html = fs.readFileSync(g.out,'utf8');
check('all enquiry ids render in console', queue.every(q=>html.includes(q.enquiry_id)));
check('console shows statuses', [...statuses].every(s=>html.includes(s)));
check('console banner: nothing sent automatically', /No email is sent automatically/.test(html)&&/No invoice is sent automatically/.test(html));

// 4) decision recorded -> decisions.json appends
const { recordDecision, loadDecisions, ALLOWED } = require('./decision_log.js');
const d1 = recordDecision({ enquiry_id: queue[0].enquiry_id, decision:'APPROVED_TO_SEND', decided_by:'T', decision_note:'Approved after checking address', outDir: OUT });
check('decision record valid schema', d1.decision_id&&d1.enquiry_id&&ALLOWED.includes(d1.decision)&&d1.decided_by&&d1.created_at);
const d2 = recordDecision({ enquiry_id: queue[3].enquiry_id, decision:'NEEDS_MORE_INFO', decided_by:'T', decision_note:'Ask for complete address', outDir: OUT });
const log = loadDecisions(path.join(OUT,'decisions.json'));
check('decisions.json appends (2 records)', log.length===2, String(log.length));
check('decision ids increment', log[0].decision_id==='dec-001'&&log[1].decision_id==='dec-002');
let threw=false; try{ recordDecision({enquiry_id:'X',decision:'BAD',outDir:OUT}); }catch(e){threw=true;}
check('invalid decision rejected', threw);

// 5) safety: no send/payment code; human approval in outputs
const qjs = fs.readFileSync(path.join(DIR,'approval_queue.js'),'utf8')+fs.readFileSync(path.join(DIR,'decision_log.js'),'utf8')+fs.readFileSync(path.join(DIR,'approval_console.js'),'utf8');
check('no email-send code', !/nodemailer|sendMail|smtp|\.send\(/.test(qjs));
check('no invoice/payment send code', !/sendInvoice\s*\(|require\(['"]stripe|stripe\.[a-z]+\(|createCharge|paymentIntent/i.test(qjs));
check('no hardcoded secret', !/dk_[A-Za-z0-9]{6}|API_KEY\s*=\s*["']/.test(qjs));
const emailsDir = path.join(OUT,'draft-emails');
const allEmails = fs.readdirSync(emailsDir);
check('every draft email requires human approval', allEmails.every(f=>/NEEDS HUMAN APPROVAL/.test(fs.readFileSync(path.join(emailsDir,f),'utf8'))));

// safety grep on client-facing outputs
const BANNED=['guaranteed approval','guaranteed value','guaranteed profit','strong buy','certain subdivision','approved potential','loan approval','investment advice','will be approved','guaranteed outcome','invoice sent','email sent automatically','paid automatically'];
const NEG=/(no |not |never |without |does not|cannot|could imply|requires approval|no invoice|no email)/i;
let unsafe=0;
function scan(d){for(const f of fs.readdirSync(d)){const p=path.join(d,f);if(fs.statSync(p).isDirectory())scan(p);else if(/\.(md|html)$/.test(f)){const t=fs.readFileSync(p,'utf8');t.split('\n').forEach(l=>BANNED.forEach(b=>{if(new RegExp(b,'i').test(l)&&!NEG.test(l))unsafe++;}));}}}
scan(OUT);
check('client-facing outputs: 0 unguarded unsafe phrases', unsafe===0, String(unsafe));

console.log(`\n=== RESULT: ${pass} passed / ${fail} failed ===`);
process.exit(fail===0?0:1);
