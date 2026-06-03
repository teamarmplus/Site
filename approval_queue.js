#!/usr/bin/env node
/**
 * SiteVerdict Internal OS — Approval Queue
 * For each enquiry: run PR Prep engine -> prep sheet + draft email + quote draft (when a paid
 * pathway suits) -> queue-index.md. Everything marked NEEDS HUMAN APPROVAL.
 * INTERNAL ONLY. No email sent. No invoice sent. No public file changed. No deploy.
 *
 * USAGE
 *   node approval_queue.js --input ./output/enquiries.json --out ./output            (live)
 *   node approval_queue.js --input ./output/enquiries.json --out ./output --fixtures (offline)
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const { analyze, fetchFixture, renderMarkdown } = require('./pr_prep.js');

const SV='https://siteverdict2.netlify.app/.netlify/functions/geocode?address=';
const NSW='https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/Planning/Principal_Planning_Layers/MapServer';
const FLOOD='https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/Planning/EPI_Flood_Planning_Area/MapServer/0';
const BUSHFIRE='https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/Planning/Bush_Fire_Prone_Land/MapServer/0';

function get(u){return new Promise((res,rej)=>{const r=https.get(u,{timeout:12000},x=>{let d='';x.on('data',c=>d+=c);x.on('end',()=>res(d));});r.on('timeout',()=>{r.destroy();rej(new Error('timeout'));});r.on('error',rej);});}
async function getJSON(u,t=2){for(let i=0;i<=t;i++){try{return JSON.parse(await get(u));}catch(e){if(i===t)return null;await new Promise(r=>setTimeout(r,400));}}}
function merc(lat,lon){return {x:20037508.34*lon/180,y:Math.log(Math.tan((90+lat)*Math.PI/360))/(Math.PI/180)*20037508.34/180};}
async function fetchLive(enquiry){
  const g=await getJSON(SV+encodeURIComponent(enquiry.address||''));
  const sig={geocode:g||{found:false},zone:null,minLotLayer:null,heritage:false,flood:false,bushfire:false,mode:'live'};
  if(g&&g.found&&g.lat){
    const m=merc(g.lat,g.lon),geom=encodeURIComponent(JSON.stringify({x:m.x,y:m.y,spatialReference:{wkid:102100}}));
    const q=`/query?geometry=${geom}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&returnGeometry=false&f=json`;
    const [zr,lr,hr,flr,bfr]=await Promise.all([
      getJSON(NSW+'/11'+q+'&outFields=SYM_CODE,LAY_CLASS,LGA_NAME'),getJSON(NSW+'/14'+q+'&outFields=LOT_SIZE'),
      getJSON(NSW+'/8'+q+'&outFields=H_NAME'),getJSON(FLOOD+q+'&outFields=*'),getJSON(BUSHFIRE+q+'&outFields=*')]);
    if(zr&&zr.features&&zr.features.length){const z=zr.features[0].attributes;sig.zone={code:z.SYM_CODE||'',name:z.LAY_CLASS||''};}
    sig.minLotLayer=(lr&&lr.features&&lr.features[0]&&lr.features[0].attributes&&lr.features[0].attributes.LOT_SIZE)||null;
    sig.heritage=!!(hr&&hr.features&&hr.features.length);sig.flood=!!(flr&&flr.features&&flr.features.length);sig.bushfire=!!(bfr&&bfr.features&&bfr.features.length);
  }
  return sig;
}
function fixtureFor(address){
  const dir=path.join(__dirname,'fixtures'); if(!fs.existsSync(dir))return null;
  const a=(address||'').toLowerCase();
  for(const f of fs.readdirSync(dir)){try{const fx=JSON.parse(fs.readFileSync(path.join(dir,f)));if(fx.enquiry&&a&&fx.enquiry.address.toLowerCase().includes(a.split(' ').slice(0,3).join(' ')))return path.join(dir,f);}catch(e){}}
  return null;
}

function parseArgs(argv){const a={};for(let i=2;i<argv.length;i++){if(argv[i].startsWith('--')){a[argv[i].slice(2)]=(argv[i+1]&&!argv[i+1].startsWith('--'))?argv[++i]:true;}}return a;}
function ensureDir(d){if(!fs.existsSync(d))fs.mkdirSync(d,{recursive:true});}
function slug(s){return (s||'enquiry').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,48);}
function tpl(name){return fs.readFileSync(path.join(__dirname,'draft_templates',name),'utf8');}
function fill(t,vars){return t.replace(/\{\{(\w+)\}\}/g,(_,k)=>vars[k]!==undefined?vars[k]:'—');}

// choose email template from status + purpose
function chooseTemplate(sheet){
  if(sheet.status==='BLOCKED') return 'request-more-info.md';
  if(['oc','external'].includes(sheet.purpose)) return 'service-pathway.md';
  if(['develop','build','buy'].includes(sheet.purpose)) return 'professional-review-offer.md';
  if(sheet.purpose==='sell') return 'professional-review-offer.md';
  return 'acknowledgement.md';
}

// quote draft only when a paid pathway suits (not when BLOCKED / not-enough-info)
function quoteType(sheet){
  if(sheet.status==='BLOCKED') return null;
  switch(sheet.purpose){
    case 'oc': return 'OC / handover external works';
    case 'external': return 'External works review (drainage / driveway / retaining / access)';
    case 'develop': return 'Professional Review (planning) + possible survey/feasibility referral';
    case 'build': return 'Professional Review (planning / certifier)';
    case 'buy': return 'Pre-purchase Professional Review';
    case 'sell': return 'Property data summary (no valuation)';
    default: return null; // notsure -> triage first, no quote yet
  }
}

function quoteDraft(e, sheet, qtype){
  return `# QUOTE / SERVICE DRAFT — NEEDS HUMAN APPROVAL

**Status:** DRAFT — not sent. T to confirm price, scope and send.

## Client
- Name: ${e.name||'—'}
- Email: ${e.email||'—'}    Phone: ${e.phone||'—'}
- Property: ${e.address||'—'}
- Enquiry purpose: ${e.purpose}

## Proposed service
${qtype}

## Scope (draft — confirm with client)
- Confirm planning controls / data relevant to "${e.purpose}" for this property.
- Prepare a plain-English summary of confirmed facts and what still needs checking.
${['oc','external'].includes(e.purpose)?'- Scope external works items: drainage/stormwater, driveway/crossover, retaining/earthworks, site access as required.':'- Identify the right professional(s) and coordinate next steps.'}

## Exclusions
- Not legal, planning, financial, survey, valuation or engineering advice (provided by licensed professionals).
- Does not guarantee any approval, value, profit, loan or subdivision outcome.
- Council/third-party fees not included unless stated.

## Commercials (placeholders — T to confirm)
- Price: T to confirm
- GST: T to confirm (ABN: T to confirm)
- Payment terms: T to confirm

## Human approval
- [ ] T has confirmed scope
- [ ] T has confirmed price / GST / ABN
- [ ] T approves sending
*(No invoice is issued or sent by this tool. AI prepares; T approves; system records.)*
`;
}

async function main(){
  const args=parseArgs(process.argv);
  const outDir=args.out||'./output'; ensureDir(outDir);
  ensureDir(path.join(outDir,'prep-sheets')); ensureDir(path.join(outDir,'draft-emails')); ensureDir(path.join(outDir,'quote-drafts'));
  const enquiries=JSON.parse(fs.readFileSync(args.input||path.join(outDir,'enquiries.json'),'utf8'));

  const rows=[];
  for(const e of enquiries){
    const enquiry={ address:e.address, purpose:e.purpose, name:e.name, email:e.email, phone:e.phone, notes:e.notes, block:e.land_size, front:e.frontage };
    let sheet;
    if(args.fixtures){ const fx=fixtureFor(e.address); if(fx){const f=fetchFixture(fx); sheet=analyze(f.signals,{...f.enquiry,...enquiry,purpose:enquiry.purpose});} else sheet=analyze({geocode:{found:false},mode:'fixture'},enquiry); }
    else sheet=analyze(await fetchLive(enquiry), enquiry);

    const base=slug(e.submission_id+'-'+(e.address||e.name||'enq'));
    // prep sheet
    const prepFile=path.join('prep-sheets','prep-'+base+'.md');
    fs.writeFileSync(path.join(outDir,prepFile), renderMarkdown(sheet));
    // draft email
    const tname=chooseTemplate(sheet);
    const vars={ name:e.name||'there', address:e.address||'your property', purpose:sheet.purpose,
      confirmed: sheet.verified.slice(0,4).map(v=>v.split('  [')[0]).join('; ')||'—',
      not_confirmed: sheet.notConfirmed.map(x=>x.split(':')[0]).join(', ')||'—',
      pathway: sheet.pathway[0]||'a town planner first-step review',
      missing_checks: sheet.missingChecks.filter(c=>!c.startsWith('PRIORITY')).slice(0,4).join('; ') };
    const emailFile=path.join('draft-emails','email-'+base+'.md');
    fs.writeFileSync(path.join(outDir,emailFile), '# DRAFT EMAIL — NEEDS HUMAN APPROVAL (do not auto-send)\nTemplate: '+tname+'\n\n'+fill(tpl(tname),vars));
    // quote draft (conditional)
    const qtype=quoteType(sheet);
    let quoteFile='';
    if(qtype){ quoteFile=path.join('quote-drafts','quote-'+base+'.md'); fs.writeFileSync(path.join(outDir,quoteFile), quoteDraft(e,sheet,qtype)); }

    rows.push({ id:e.submission_id, client:e.name, address:e.address, purpose:sheet.purpose, status:sheet.status,
      confidence:sheet.confidence, action:sheet.recommendedAction, prep:prepFile, email:emailFile, quote:quoteFile||'(none — triage/blocked)' });
    console.log(`[${sheet.status}/${sheet.confidence}] ${e.submission_id} ${e.name||'—'} | ${e.address||'(no address)'} | email:${tname}${qtype?' | quote:'+qtype:''}`);
  }

  // queue index (triaged)
  const order={BLOCKED:0,REVIEW:1,PASS:2};
  rows.sort((a,b)=>order[a.status]-order[b.status]);
  const idx='# SiteVerdict — Internal Approval Queue\nGenerated: '+new Date().toISOString()+`  |  ${rows.length} enquiries\n\n`+
    'AI prepares · T approves · system records.  Work top-down: BLOCKED → REVIEW → PASS.\n\n'+
    '| # | ID | Client | Address | Purpose | Status | Conf | Next action | Prep | Draft email | Quote | Human decision |\n'+
    '|---|----|--------|---------|---------|--------|------|-------------|------|-------------|-------|----------------|\n'+
    rows.map((r,i)=>`| ${i+1} | ${r.id} | ${r.client||'—'} | ${r.address||'(none)'} | ${r.purpose} | **${r.status}** | ${r.confidence} | ${r.action} | ${r.prep} | ${r.email} | ${r.quote} | ☐ approve ☐ edit ☐ reject |`).join('\n')+'\n';
  fs.writeFileSync(path.join(outDir,'queue-index.md'), idx);
  console.log('[queue] '+path.join(outDir,'queue-index.md'));
}

if(require.main===module) main().catch(e=>{console.error('QUEUE ERROR:',e.message);process.exit(1);});
module.exports = { chooseTemplate, quoteType };
