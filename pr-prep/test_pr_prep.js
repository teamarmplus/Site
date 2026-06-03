#!/usr/bin/env node
/**
 * Test suite for pr_prep v2 — runs against FIXTURES (offline, no network).
 * Asserts status, pathway content, min-lot honesty, and safety wording.
 */
const fs = require('fs');
const path = require('path');
const { analyze, fetchFixture, renderMarkdown } = require('./pr_prep.js');

const FX = path.join(__dirname,'fixtures');
const BANNED = ['guaranteed approval','guaranteed value','guaranteed profit','strong buy','certain subdivision','approved potential','loan approval','investment advice','will be approved','guaranteed outcome'];

let pass=0, fail=0;
function check(name, cond, detail){ if(cond){pass++;console.log(`  PASS  ${name}`);} else {fail++;console.log(`  FAIL  ${name}${detail?' — '+detail:''}`);} }

function run(fixtureFile){ const fx=fetchFixture(path.join(FX,fixtureFile)); return analyze(fx.signals, fx.enquiry); }
function bodyOf(s){ return renderMarkdown(s); }
function safe(s){
  // A banned phrase only counts as UNSAFE if it is NOT inside a safe-negation context.
  const md = bodyOf(s);
  const lines = md.split('\n');
  const NEG = /(no |not |never |without |does not|cannot|could imply|could read as|don'?t|avoid)/i;
  const hits = [];
  for(const b of BANNED){
    for(const line of lines){
      const re = new RegExp(b.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i');
      if(re.test(line) && !NEG.test(line)) hits.push(b+' :: '+line.trim().slice(0,60));
    }
  }
  return hits;
}

console.log('\n=== FIXTURE TESTS (offline) ===\n');

// 1 + (also test 5 via develop+no-zone fixture)
let s = run('residential-r4-epping.json');
console.log('[1] residential R4 develop:');
check('status PASS or REVIEW', ['PASS','REVIEW'].includes(s.status), s.status);
check('min-lot confirmed LEP 550 shown', bodyOf(s).includes('confirmed LEP): 550'));
check('planner+surveyor pathway', s.pathway.some(p=>/planner/i.test(p)) && s.pathway.some(p=>/surveyor/i.test(p)));
check('no banned wording', safe(s).length===0, safe(s).join(','));

// 2 non-residential E2
s = run('nonres-e2-parramatta.json');
console.log('[2] non-residential E2 buy:');
check('min-lot NOT confirmed (no fake default)', bodyOf(s).includes('Not confirmed for this zone'));
check('no residential default leaked', !/Typical minimum lot size for E2/.test(bodyOf(s)));
check('buy pathway planner+conveyancer', s.pathway.some(p=>/planner/i.test(p)) && s.pathway.some(p=>/conveyancer/i.test(p)));
check('no buy recommendation', !/recommend (you )?buy|should buy|good buy/i.test(bodyOf(s)));
check('no banned wording', safe(s).length===0, safe(s).join(','));

// 3 address not matched
s = run('address-not-matched.json');
console.log('[3] address not matched:');
check('status BLOCKED', s.status==='BLOCKED', s.status);
check('asks for complete address', bodyOf(s).toLowerCase().includes('complete nsw address'));
check('no invented zone/min-lot', !/Zone: [A-Z]/.test(bodyOf(s)) && !/confirmed LEP/.test(bodyOf(s)));
check('no banned wording', safe(s).length===0, safe(s).join(','));

// 4 OC / external
s = run('oc-external-newcastle.json');
console.log('[4] OC / external:');
check('certifier in pathway', s.pathway.some(p=>/certifier/i.test(p)));
check('drainage+driveway prioritised', bodyOf(s).includes('PRIORITY: drainage') && bodyOf(s).includes('PRIORITY: driveway'));
check('revenue pathway has external/OC works', s.revenue.some(r=>/external works|OC/i.test(r)));
check('no banned wording', safe(s).length===0, safe(s).join(','));

// 5 no zone / no min-lot (develop)
s = run('no-zone-or-no-minlot.json');
console.log('[5] no-zone / no-min-lot develop:');
check('zone Not confirmed', bodyOf(s).includes('Zone: Not confirmed'));
check('min-lot Not confirmed', bodyOf(s).includes('Minimum lot size: Not confirmed'));
check('status REVIEW (develop+missing)', s.status==='REVIEW', s.status);
check('develop-cannot-assess risk present', bodyOf(s).includes('CANNOT be assessed safely'));
check('no fake min-lot', !/confirmed LEP/.test(bodyOf(s)));
check('no banned wording', safe(s).length===0, safe(s).join(','));

// 6 buy (reuse E2 fixture but assert buy specifics already covered) — add explicit buy assertion
s = run('nonres-e2-parramatta.json');
console.log('[6] buy enquiry specifics:');
check('planner/conveyancer/surveyor before exchange', /before exchange/i.test(bodyOf(s)));
check('no buy/sell recommendation', !/we recommend buying|strong buy/i.test(bodyOf(s)));

// 7 sell — synthesize from a residential fixture with purpose override
(() => {
  const fx=fetchFixture(path.join(FX,'residential-r4-epping.json'));
  const s=analyze(fx.signals, {...fx.enquiry, purpose:'sell'});
  console.log('[7] sell enquiry:');
  check('property data summary pathway', s.pathway.some(p=>/data summary/i.test(p)));
  check('no valuation/price claim', !/we value (it|this) at|estimated value of \$|worth \$[0-9]|sale price will be/i.test(bodyOf(s)));
  check('no banned wording', safe(s).length===0, safe(s).join(','));
})();

// 8 heritage/flood/bushfire
s = run('heritage-flood-bushfire.json');
console.log('[8] heritage+flood+bushfire:');
check('heritage pathway', s.pathway.some(p=>/heritage/i.test(p)));
check('flood pathway', s.pathway.some(p=>/flood/i.test(p)));
check('bushfire/BAL pathway', s.pathway.some(p=>/bushfire|BAL/i.test(p)));
check('status REVIEW (overlays)', s.status==='REVIEW', s.status);
check('no banned wording', safe(s).length===0, safe(s).join(','));


// ---- V3 importer tests ----
(() => {
  const { mapRow, parseCSV, PURPOSE_MAP } = require('./pr_form_import.js');
  console.log('\n[V3] form importer:');
  const csv = 'name,email,phone,property_address,purpose,notes,Submitted At\nX,x@e.com,04,1 A St Epping NSW 2121,oc_handover,hi,2026-06-03';
  const rows = parseCSV(csv);
  check('CSV parses 1 row', rows.length===1);
  const m = mapRow(rows[0]);
  check('maps property_address -> address', m.address==='1 A St Epping NSW 2121');
  check('maps oc_handover -> oc', m.purpose==='oc');
  check('maps not_sure -> notsure', PURPOSE_MAP['not_sure']==='notsure');
  check('maps external_works -> external', PURPOSE_MAP['external_works']==='external');
  check('keeps name/email/phone', m.name==='X' && m.email==='x@e.com' && m.phone==='04');
})();

console.log(`\n=== FINAL: ${pass} passed / ${fail} failed ===`);
process.exit(fail===0?0:1);
