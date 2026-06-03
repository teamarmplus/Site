#!/usr/bin/env node
/**
 * SiteVerdict — PR Prep V3 — Professional Review form importer
 * INTERNAL OPERATING TOOL. Not a public feature. Changes NO public website file. No deploy.
 *
 * PURPOSE: take a Netlify Forms CSV export of "siteverdict-professional-review" submissions,
 * map each row to PR Prep input, run the PR Prep V2 engine, and produce an internal queue of
 * prep sheets + index.md. One command -> a review-ready queue. Reduces founder workload.
 *
 * WHY Option A (CSV export -> converter -> batch): simplest reliable path, no new infra, no
 * public deploy. T exports submissions from Netlify, runs one command, gets the queue.
 *
 * USAGE
 *   node pr_form_import.js --in sample-netlify-form-export.csv --out ./pr-prep-output
 *   node pr_form_import.js --in export.csv --out ./pr-prep-output --fixtures   (offline: map address->fixture if available)
 *
 * Netlify export columns (actual form field names): name, email, phone, property_address,
 * purpose, notes  (plus bot-field/viewport/upload which are ignored). Netlify also adds
 * metadata columns like "Submitted At" — ignored.
 */

const fs = require('fs');
const path = require('path');
const { analyze, fetchFixture } = require('./pr_prep.js');
const https = require('https');

// ---- form purpose value -> PR Prep purpose ----
const PURPOSE_MAP = {
  not_sure:'notsure', notsure:'notsure', 'not sure':'notsure',
  buy:'buy', sell:'sell', build:'build', develop:'develop',
  oc_handover:'oc', 'oc/handover':'oc', oc:'oc',
  external_works:'external', 'external works':'external', external:'external'
};

// ---- live fetch (same as engine) ----
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
      getJSON(NSW+'/11'+q+'&outFields=SYM_CODE,LAY_CLASS,LGA_NAME'),
      getJSON(NSW+'/14'+q+'&outFields=LOT_SIZE'),
      getJSON(NSW+'/8'+q+'&outFields=H_NAME'),
      getJSON(FLOOD+q+'&outFields=*'),
      getJSON(BUSHFIRE+q+'&outFields=*'),
    ]);
    if(zr&&zr.features&&zr.features.length){const z=zr.features[0].attributes;sig.zone={code:z.SYM_CODE||'',name:z.LAY_CLASS||''};}
    sig.minLotLayer=(lr&&lr.features&&lr.features[0]&&lr.features[0].attributes&&lr.features[0].attributes.LOT_SIZE)||null;
    sig.heritage=!!(hr&&hr.features&&hr.features.length);
    sig.flood=!!(flr&&flr.features&&flr.features.length);
    sig.bushfire=!!(bfr&&bfr.features&&bfr.features.length);
  }
  return sig;
}

function parseArgs(argv){const a={};for(let i=2;i<argv.length;i++){if(argv[i].startsWith('--')){a[argv[i].slice(2)]=(argv[i+1]&&!argv[i+1].startsWith('--'))?argv[++i]:true;}}return a;}
function slugify(s){return (s||'enquiry').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,48);}
function ensureDir(d){if(!fs.existsSync(d))fs.mkdirSync(d,{recursive:true});}
function parseCSV(text){
  const lines=text.split(/\r?\n/).filter(l=>l.trim());
  const headers=lines[0].split(',').map(h=>h.trim().toLowerCase().replace(/^"|"$/g,''));
  return lines.slice(1).map(line=>{const vals=[];let cur='',q=false;for(const ch of line){if(ch==='"'){q=!q;}else if(ch===','&&!q){vals.push(cur);cur='';}else cur+=ch;}vals.push(cur);const o={};headers.forEach((h,i)=>o[h]=(vals[i]||'').trim().replace(/^"|"$/g,''));return o;});
}

// map a Netlify export row -> PR Prep enquiry
function mapRow(row){
  // tolerate header variations
  const get=(...keys)=>{for(const k of keys){if(row[k]!==undefined&&row[k]!=='')return row[k];}return '';};
  const rawPurpose=(get('purpose')||'notsure').toLowerCase().replace(/[\s/]+/g,'_');
  return {
    name: get('name'),
    email: get('email'),
    phone: get('phone'),
    address: get('property_address','address'),
    purpose: PURPOSE_MAP[rawPurpose] || 'notsure',
    notes: get('notes','description','message'),
    submittedAt: get('submitted at','created at','date','timestamp')
  };
}

// fixture fallback for offline testing: match by address keyword
function fixtureFor(address){
  const dir=path.join(__dirname,'fixtures');
  if(!fs.existsSync(dir)) return null;
  const a=(address||'').toLowerCase();
  for(const f of fs.readdirSync(dir)){
    try{ const fx=JSON.parse(fs.readFileSync(path.join(dir,f))); if(fx.enquiry && a && fx.enquiry.address.toLowerCase().includes(a.split(' ').slice(0,3).join(' '))) return path.join(dir,f); }catch(e){}
  }
  return null;
}

async function main(){
  const args=parseArgs(process.argv);
  if(!args.in){console.error('ERROR: --in <netlify-export.csv> required');process.exit(1);}
  const outDir=args.out||'./pr-prep-output'; ensureDir(outDir);
  const rows=parseCSV(fs.readFileSync(args.in,'utf8')).map(mapRow);

  const index=[];
  for(const enquiry of rows){
    let sheet;
    if(args.fixtures){
      const fxPath=fixtureFor(enquiry.address);
      if(fxPath){ const fx=fetchFixture(fxPath); sheet=analyze(fx.signals, {...fx.enquiry, ...enquiry, purpose: enquiry.purpose}); }
      else { sheet=analyze({geocode:{found:false},mode:'fixture'}, enquiry); } // unknown address offline -> BLOCKED
    } else {
      sheet=analyze(await fetchLive(enquiry), enquiry);
    }
    const { renderMarkdown } = require('./pr_prep.js');
    const file=path.join(outDir,'prep-'+slugify(sheet.address||enquiry.name||'enquiry')+'.md');
    fs.writeFileSync(file, renderMarkdown(sheet));
    index.push({...enquiry, status:sheet.status, confidence:sheet.confidence, action:sheet.recommendedAction, file:path.basename(file)});
    console.log(`[${sheet.status}/${sheet.confidence}] ${enquiry.name||'—'} | ${enquiry.address||'(no address)'} -> ${file}`);
  }

  // internal queue index
  const order={BLOCKED:0,REVIEW:1,PASS:2};
  index.sort((a,b)=>(order[a.status]-order[b.status]));
  const idx='# Professional Review — Internal Queue\nGenerated: '+new Date().toISOString()+`\nSource: ${path.basename(args.in)}  |  ${index.length} enquiries\n\n`+
    'Triage order: BLOCKED (need info) -> REVIEW (human attention) -> PASS (ready to approve).\n\n'+
    index.map((r,i)=>`### ${i+1}. [${r.status} · ${r.confidence}] ${r.name||'—'}\n`+
      `- Address: ${r.address||'(none provided)'}\n`+
      `- Purpose: ${r.purpose}  |  Contact: ${r.email||'—'} ${r.phone||''}\n`+
      `- Submitted: ${r.submittedAt||'—'}\n`+
      `- Next action: ${r.action}\n`+
      `- Prep sheet: ${r.file}\n`).join('\n')+'\n';
  fs.writeFileSync(path.join(outDir,'index.md'), idx);
  console.log('[queue] '+path.join(outDir,'index.md'));
}

if(require.main===module) main().catch(e=>{console.error('IMPORT ERROR:',e.message);process.exit(1);});
module.exports = { mapRow, parseCSV, PURPOSE_MAP };
