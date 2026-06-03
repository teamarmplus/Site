#!/usr/bin/env node
/**
 * SiteVerdict — Internal Professional Review Prep Engine (v2)
 * INTERNAL OPERATING TOOL. Not a public feature. Changes NO public website file. No deploy.
 *
 * Architecture:
 *   - analyze(signals, enquiry)  -> PURE function (no network). Builds the prep sheet object.
 *   - fetchLive(enquiry)         -> live SV geocode + NSW ePlanning layers -> signals
 *   - fetchFixture(path)         -> load saved signals (offline test mode)
 * This separation means the test suite runs against fixtures even with no internet.
 *
 * USAGE
 *   node pr_prep.js --address "45 Oxford Street Epping NSW 2121" --purpose develop --block 580 --front 15 [--out DIR]
 *   node pr_prep.js --file enquiry-template.json [--out DIR]
 *   node pr_prep.js --batch sample-enquiries.csv [--out DIR]
 *   node pr_prep.js --fixture fixtures/residential-r4-epping.json [--out DIR]   (offline)
 * Default --out ./pr-prep-output. CSV cols: name,email,phone,address,purpose,block,front,notes
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const SV_GEOCODE = 'https://siteverdict2.netlify.app/.netlify/functions/geocode?address=';
const NSW = 'https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/Planning/Principal_Planning_Layers/MapServer';
const FLOOD = 'https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/Planning/EPI_Flood_Planning_Area/MapServer/0';
const BUSHFIRE = 'https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/Planning/Bush_Fire_Prone_Land/MapServer/0';

const RES = ['R1','R2','R3','R4','R5','R6'];
const XR = { R1:450, R2:450, R3:400, R4:350, R5:2000, R6:450 };
const THR = { R1:50, R2:50, R3:50, R4:50, R5:100, R6:100 };
const PURPOSES = ['buy','sell','build','develop','oc','external','notsure'];

// ---------- pure helpers ----------
function merc(lat, lon){ return { x: 20037508.34*lon/180, y: Math.log(Math.tan((90+lat)*Math.PI/360))/(Math.PI/180)*20037508.34/180 }; }
function slugify(s){ return (s||'enquiry').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,48); }
function ensureDir(d){ if(!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }
function parseArgs(argv){ const a={}; for(let i=2;i<argv.length;i++){ if(argv[i].startsWith('--')){ a[argv[i].slice(2)]=(argv[i+1]&&!argv[i+1].startsWith('--'))?argv[++i]:true; } } return a; }

// ---------- network ----------
function get(url){ return new Promise((res,rej)=>{ const r=https.get(url,{timeout:12000},x=>{let d='';x.on('data',c=>d+=c);x.on('end',()=>res(d));}); r.on('timeout',()=>{r.destroy();rej(new Error('timeout'));}); r.on('error',rej); }); }
async function getJSON(url,tries=2){ for(let i=0;i<=tries;i++){ try{ return JSON.parse(await get(url)); }catch(e){ if(i===tries) return null; await new Promise(r=>setTimeout(r,400)); } } }

// ---------- data sources -> normalized signals ----------
async function fetchLive(enquiry){
  const g = await getJSON(SV_GEOCODE + encodeURIComponent(enquiry.address||''));
  const sig = { geocode: g || {found:false}, zone:null, minLotLayer:null, heritage:false, flood:false, bushfire:false, mode:'live' };
  if(g && g.found && g.lat){
    const m = merc(g.lat,g.lon);
    const geom = encodeURIComponent(JSON.stringify({x:m.x,y:m.y,spatialReference:{wkid:102100}}));
    const q = `/query?geometry=${geom}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&returnGeometry=false&f=json`;
    const [zr,lr,hr,flr,bfr] = await Promise.all([
      getJSON(NSW+'/11'+q+'&outFields=SYM_CODE,LAY_CLASS,LGA_NAME'),
      getJSON(NSW+'/14'+q+'&outFields=LOT_SIZE'),
      getJSON(NSW+'/8'+q+'&outFields=H_NAME'),
      getJSON(FLOOD+q+'&outFields=*'),
      getJSON(BUSHFIRE+q+'&outFields=*'),
    ]);
    if(zr && zr.features && zr.features.length){ const z=zr.features[0].attributes; sig.zone={code:z.SYM_CODE||'',name:z.LAY_CLASS||''}; }
    sig.minLotLayer = (lr && lr.features && lr.features[0] && lr.features[0].attributes && lr.features[0].attributes.LOT_SIZE) || null;
    sig.heritage = !!(hr && hr.features && hr.features.length);
    sig.flood = !!(flr && flr.features && flr.features.length);
    sig.bushfire = !!(bfr && bfr.features && bfr.features.length);
  }
  return sig;
}
function fetchFixture(p){
  const f = JSON.parse(fs.readFileSync(p,'utf8'));
  return { enquiry:f.enquiry, signals:{ geocode:f.geocode, zone:f.zone, minLotLayer:f.minLotLayer, heritage:!!f.heritage, flood:!!f.flood, bushfire:!!f.bushfire, mode:'fixture' } };
}

// ---------- per-purpose pathways ----------
function suggestPathway(purpose, sig){
  const out=[];
  switch(purpose){
    case 'buy':
      out.push('Town planner — confirm permissible use and constraints before exchange (not a purchase recommendation)');
      out.push('Conveyancer/solicitor — title, DP and easements review before exchange');
      if(!sig.minlotConfirmed || !sig.zone) out.push('Surveyor + planner — lot/zone not confirmed; verify before relying on any development assumption'); break;
    case 'sell':
      out.push('Property data summary + missing-check list for the listing (no valuation or price claim)');
      out.push('Conveyancer/solicitor — contract/title disclosures'); break;
    case 'build':
      out.push('Town planner — confirm what the controls permit for this lot');
      out.push('Certifier — pathway (DA vs CDC) and conditions');
      out.push('Builder + surveyor — set-out, levels and dimensions'); break;
    case 'develop':
      out.push('Town planner FIRST — confirm permissible development for the zone/controls');
      out.push(sig.minlotConfirmed ? 'Surveyor SECOND — confirm lot dimensions vs minimum lot size'
                                   : 'Surveyor SECOND — minimum lot size not confirmed; must be checked against the LEP before any subdivision/dual-occupancy assumption'); break;
    case 'oc':
      out.push('Certifier — occupation certificate requirements and outstanding conditions');
      out.push('External works / drainage / driveway — final compliance items if OC conditions require');
      out.push('Final-compliance trades — landscaping/access/retaining as conditioned'); break;
    case 'external':
      out.push('Civil/external works — stormwater, drainage and driveway/crossover scope');
      out.push('Surveyor — set-out and levels if earthworks/retaining involved');
      out.push('Retaining/landscaping/access — as required by site conditions'); break;
    default:
      out.push('Professional Review first-step triage — clarify the goal, then route to the right professional');
  }
  if(sig.heritage) out.push('Heritage consultant / planner — heritage indicator present; scope needs verification');
  if(sig.flood) out.push('Civil/flood engineer — flood planning indicator present; flood study may be required');
  if(sig.bushfire) out.push('Bushfire (BAL) assessor — bushfire prone indicator present');
  return [...new Set(out)];
}

// internal-only revenue/action classification
function revenuePathway(purpose, sig){
  if(!sig.matched) return ['Not enough information yet — request a complete NSW address'];
  const out=[];
  if(purpose==='oc'){ out.push('OC/handover external works','Drainage/stormwater','Driveway/crossover','Retaining/earthworks'); }
  else if(purpose==='external'){ out.push('Civil/external works review','Drainage/stormwater','Driveway/crossover','Retaining/earthworks'); }
  else if(purpose==='develop'){ out.push('Professional Review (planning)', sig.minlotConfirmed?'Survey/feasibility referral':'Professional referral (planner) — potential not yet assessable'); }
  else if(purpose==='build'){ out.push('Professional Review (planning/certifier)','Builder/survey referral'); }
  else if(purpose==='buy'){ out.push('Professional Review (pre-purchase)','Conveyancer referral'); }
  else if(purpose==='sell'){ out.push('Property data summary','Conveyancer referral'); }
  else { out.push('Professional Review only'); }
  if(sig.flood) out.push('Stormwater/drainage');
  return [...new Set(out)];
}

// ---------- PURE analysis (no network) ----------
function analyze(signals, enquiry){
  let purpose=(enquiry.purpose||'notsure').toLowerCase(); if(!PURPOSES.includes(purpose)) purpose='notsure';
  const block = enquiry.block?Number(enquiry.block):null;
  const front = enquiry.front?Number(enquiry.front):null;
  const g = signals.geocode||{found:false};
  const s = {
    address: enquiry.address, purpose,
    client:{name:enquiry.name||'',email:enquiry.email||'',phone:enquiry.phone||''},
    notes:enquiry.notes||'', mode:signals.mode||'live', generatedAt:new Date().toISOString(),
    verified:[], userEntered:[], notConfirmed:[], missingChecks:[], risks:[], pathway:[], revenue:[], dataConfidence:{},
    status:'PASS', confidence:'Medium', summary:'', recommendedAction:''
  };

  // BLOCKED: address not matched
  if(!g.found || !g.lat){
    s.status='BLOCKED'; s.confidence='Low';
    s.notConfirmed.push('Address: could not be confidently matched in NSW address data');
    s.dataConfidence.address='Not matched';
    s.missingChecks.push('Confirm a complete NSW address (full street number, suburb, postcode)');
    s.risks.push('Address not matched — planning checks cannot run until a valid NSW address is confirmed');
    s.pathway.push('Professional Review — ask the client for a complete NSW address, then re-run');
    s.revenue = revenuePathway(purpose,{matched:false});
    s.summary = 'BLOCKED: the address could not be matched in NSW data, so no planning facts could be confirmed. Ask the client for a complete NSW address (street number, suburb, postcode) before review.';
    s.recommendedAction = 'Reply requesting a complete NSW address; do not prepare planning facts yet.';
    return s;
  }

  s.verified.push('Address (matched): '+g.matchedAddr+'  ['+ (g.confidence||'Detected') +']');
  s.dataConfidence.address = g.confidence || 'Detected';
  if(g.council) s.verified.push('Council / LGA: '+g.council+'  [Detected]'); else s.notConfirmed.push('Council / LGA: Not confirmed');

  const zone = signals.zone && signals.zone.code ? signals.zone.code : '';
  const zoneName = signals.zone && signals.zone.name ? signals.zone.name : '';
  if(zone){ s.verified.push('Zone: '+zoneName+' ('+zone+')  [Detected from layer]'); s.dataConfidence.zone='Detected from available layer'; }
  else { s.notConfirmed.push('Zone: Not confirmed from available layer — Professional verification needed'); s.dataConfidence.zone='Not confirmed'; s.missingChecks.push('Planner verification of zone (layer returned no zone)'); }

  const lep = signals.minLotLayer;
  let minlotConfirmed=false;
  if(lep && lep >= (THR[zone]||50)){ minlotConfirmed=true; s.verified.push('Minimum lot size (confirmed LEP): '+lep+' m²  [Verified from source]'); s.dataConfidence.minLot='Verified (LEP layer)'; }
  else if(XR[zone]!==undefined){ s.notConfirmed.push('Typical minimum lot size for '+zone+' (not confirmed for this lot): '+XR[zone]+' m² — confirm with council'); s.dataConfidence.minLot='Not confirmed (typical only)'; s.missingChecks.push('LEP/council verification of minimum lot size for this lot'); }
  else { s.notConfirmed.push('Minimum lot size: Not confirmed for this zone — Professional verification needed'); s.dataConfidence.minLot='Not confirmed'; s.missingChecks.push('LEP/council verification of minimum lot size for this zone'); }

  const {heritage,flood,bushfire} = signals;
  s.verified.push('Heritage indicator: '+(heritage?'present — scope needs verification':'none detected in this check')+'  [Detected from layer]');
  s.verified.push('Flood planning indicator: '+(flood?'present — scope needs verification':'none detected in this check')+'  [Detected from layer]');
  s.verified.push('Bushfire prone indicator: '+(bushfire?'present — scope needs verification':'none detected in this check')+'  [Detected from layer]');

  if(block) s.userEntered.push('Land size: '+block.toLocaleString()+' m²  [User entered — not independently verified]');
  if(front) s.userEntered.push('Frontage: '+front+' m  [User entered — not independently verified]');

  // not-confirmed standing items
  s.notConfirmed.push('Parcel boundary not confirmed (needs title/survey)');
  if(block||front) s.notConfirmed.push('User-entered land size / frontage not independently verified');
  s.notConfirmed.push('Title / DP / easements not checked');
  s.notConfirmed.push('Overlays not fully checked beyond heritage/flood/bushfire indicators');

  // tailored missing checks
  s.missingChecks.push('Title / DP','Survey (boundaries & dimensions)','Easements');
  if(block||front) s.missingChecks.push('Independently confirm user-entered land size / frontage');
  s.missingChecks.push('LEP / council controls','DCP controls');
  if(flood) s.missingChecks.push('Flood study (flood indicator detected)');
  if(bushfire) s.missingChecks.push('Bushfire / BAL assessment (bushfire indicator detected)');
  if(heritage) s.missingChecks.push('Heritage scope (heritage indicator detected)');
  s.missingChecks.push('Stormwater / drainage','Slope / earthworks','Retaining wall','Driveway / access');
  if(['oc','external'].includes(purpose)) s.missingChecks.unshift('PRIORITY: certifier / OC conditions','PRIORITY: drainage / stormwater','PRIORITY: driveway / crossover','PRIORITY: retaining / earthworks','PRIORITY: site access','PRIORITY: landscaping / final external works');
  s.missingChecks.push('Professional review');

  // risks + status escalation
  if(!minlotConfirmed) s.risks.push('Minimum lot size not confirmed — any subdivision/dual-occupancy assumption must be checked against the LEP/council');
  if(!zone) s.risks.push('Zone not confirmed — do not assume permitted use until verified');
  if(heritage) s.risks.push('Heritage indicator present — plans likely need heritage input');
  if(flood) s.risks.push('Flood planning indicator present — flood study likely required');
  if(bushfire) s.risks.push('Bushfire prone indicator present — BAL assessment likely required');
  const approx = /estimate|review|interpolat/i.test((g.confidence||'')+(g.locationType||''));
  if(approx) s.risks.push('Address location approximate/interpolated — confirm exact parcel');

  // STATUS rules (PASS / REVIEW / BLOCKED)
  // develop with missing zone/min-lot => REVIEW (severe) ; missing zone entirely => REVIEW
  if(purpose==='develop' && (!minlotConfirmed || !zone)){
    s.status='REVIEW'; s.risks.push('DEVELOP intent but zone/min-lot not confirmed — development potential CANNOT be assessed safely yet; planner verification required first');
  }
  if(!zone) s.status='REVIEW';
  if(heritage||flood||bushfire) s.status = s.status==='BLOCKED'?'BLOCKED':'REVIEW';
  if(approx && s.status==='PASS') s.status='REVIEW';
  // confidence
  const confirmedCount = (zone?1:0)+(minlotConfirmed?1:0)+(g.confidence==='Verified'?1:0);
  s.confidence = confirmedCount>=3?'High':confirmedCount===2?'Medium':'Low';

  s.pathway = suggestPathway(purpose, {heritage,flood,bushfire,minlotConfirmed,zone});
  s.revenue = revenuePathway(purpose, {matched:true,minlotConfirmed,flood});

  // executive summary + recommended action
  const conf = s.verified.filter(v=>/Zone:|Minimum lot|Council/.test(v)).map(v=>v.split('  [')[0]).join('; ');
  s.summary = `${s.status} (${s.confidence} confidence). ${purpose.toUpperCase()} enquiry. Confirmed: ${conf||'address only'}. `
    + (s.status==='REVIEW' ? 'Needs human attention before responding (see risks/not-confirmed).' : 'Enough to prepare a useful draft for human approval.');
  s.recommendedAction = s.status==='REVIEW'
    ? 'Human review the not-confirmed items + risks, confirm pathway, then approve the draft response.'
    : 'Confirm address/parcel, then approve and send the draft response; consider the revenue pathway.';
  return s;
}

// ---------- render ----------
function renderMarkdown(s){
  const L = a => a.length ? a.map(x=>'- '+x).join('\n') : '- (none)';
  const notConfList = s.notConfirmed.map(x=>x.split(':')[0].split(' not ')[0]).join(', ') || '—';
  return `# Professional Review — Internal Prep Sheet (v2)

## A. Executive internal summary (for T)
${s.summary}
**Status:** ${s.status}  |  **Confidence:** ${s.confidence}  |  **Mode:** ${s.mode}
**Recommended action:** ${s.recommendedAction}

## B. Client goal
**Purpose:** ${s.purpose}
**Client:** ${s.client.name||'—'} | ${s.client.email||'—'} | ${s.client.phone||'—'}
**Address:** ${s.address}
**Enquiry notes:** ${s.notes||'—'}

## C. Verified / detected facts
${L(s.verified)}

## D. User-entered facts
${L(s.userEntered)}

## E. Not confirmed
${L(s.notConfirmed)}

## F. Missing checks
${L(s.missingChecks)}

## G. Risk notes (factual, calm)
${L(s.risks)}

## H. Professional / service pathway (suggestion, not a promise)
${L(s.pathway)}

## I. Revenue / action pathway (INTERNAL ONLY — do not show client as-is)
${L(s.revenue)}

## J. Draft client response (for HUMAN approval — do not auto-send)
> Hi ${s.client.name||'there'}, thanks for your Professional Review request for ${s.address}.
> Here's what we could confirm from NSW planning data, and what still needs checking before any decision.
> Confirmed/detected: ${s.verified.slice(0,4).map(v=>v.split('  [')[0]).join('; ')||'—'}.
> Not yet confirmed: ${notConfList}.
> Before spending money, the key things to verify are: ${s.missingChecks.filter(c=>!c.startsWith('PRIORITY')).slice(0,4).join('; ')}.
> Based on your goal (${s.purpose}), a useful next step is: ${(s.pathway[0]||'a town planner first-step review')}.
> We aim to respond within 24–48 hours on business working days.
> This is preliminary information only — not legal, planning, financial, survey or valuation advice, and not a guarantee of any approval, value, profit or outcome. We can help arrange the right professional review if you'd like.

## K. Human approval checklist (before sending)
- Confirm the address/parcel is the one the client meant.
- Re-read every "Not confirmed" item — do not imply certainty.
- Remove anything that could imply a promised result, certain value, profit, loan success, or financial recommendation.
- Confirm the suggested pathway fits the client's real goal and budget.
- Decide whether paid Professional Review / a service quote / a referral is appropriate.
- A human approves and sends — never auto-send.
`;
}

function parseCSV(text){
  const lines=text.split(/\r?\n/).filter(l=>l.trim());
  const headers=lines[0].split(',').map(h=>h.trim());
  return lines.slice(1).map(line=>{ const vals=[];let cur='',q=false; for(const ch of line){ if(ch==='"'){q=!q;} else if(ch===','&&!q){vals.push(cur);cur='';} else cur+=ch; } vals.push(cur); const o={}; headers.forEach((h,i)=>o[h]=(vals[i]||'').trim()); return o; });
}

// ---------- main ----------
async function processOne(enquiry, useFixturePath){
  let signals;
  if(useFixturePath){ const fx=fetchFixture(useFixturePath); enquiry=fx.enquiry; signals=fx.signals; }
  else signals = await fetchLive(enquiry);
  return analyze(signals, enquiry);
}

async function main(){
  const args=parseArgs(process.argv);
  const outDir=args.out||'./pr-prep-output'; ensureDir(outDir);
  let sheets=[];
  if(args.fixture){ sheets=[await processOne(null, args.fixture)]; }
  else if(args.batch){ for(const e of parseCSV(fs.readFileSync(args.batch,'utf8'))) sheets.push(await processOne(e)); }
  else if(args.file){ sheets=[await processOne(JSON.parse(fs.readFileSync(args.file,'utf8')))]; }
  else if(args.address){ sheets=[await processOne(args)]; }
  else { console.error('ERROR: provide --address, --file, --batch, or --fixture'); process.exit(1); }

  const index=[];
  for(const s of sheets){
    const file=path.join(outDir,'prep-'+slugify(s.address)+'.md');
    fs.writeFileSync(file, renderMarkdown(s));
    index.push({client:s.client.name,address:s.address,purpose:s.purpose,status:s.status,confidence:s.confidence,action:s.recommendedAction,file:path.basename(file)});
    console.log(`[${s.status}/${s.confidence}] ${s.address} -> ${file}`);
  }
  if(sheets.length>1 || args.batch){
    const idx='# Professional Review — Prep Index\nGenerated: '+new Date().toISOString()+'\n\n'+
      index.map(r=>`- **[${r.status} · ${r.confidence}]** ${r.client||'—'} — ${r.address} (${r.purpose})\n  - next: ${r.action}\n  - file: ${r.file}`).join('\n')+'\n';
    fs.writeFileSync(path.join(outDir,'index.md'), idx);
    console.log('[index] '+path.join(outDir,'index.md'));
  }
}

module.exports = { analyze, fetchFixture, suggestPathway, revenuePathway, renderMarkdown };
if(require.main===module) main().catch(e=>{ console.error('PR-PREP ERROR:', e.message); process.exit(1); });
