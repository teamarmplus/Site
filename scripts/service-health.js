#!/usr/bin/env node
/* SiteVerdict NSW service-health self-test.
 * Pings every NSW layer/field the engine depends on and flags 400/404/missing-field,
 * so an upstream service move is caught immediately instead of silently degrading to false negatives.
 * Run: node scripts/service-health.js   (exit 1 if any dependency is broken)
 */
const { execFileSync } = require('child_process');
function curl(url){ try{ return JSON.parse(execFileSync('curl',['-s','-m','15',url],{maxBuffer:1e8}).toString()); }catch(e){ return {__neterr:String(e).slice(0,60)}; } }

// Single source of truth for every upstream dependency the engine relies on.
const PP='https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/Planning/Principal_Planning_Layers/MapServer';
const HZ='https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/Planning/Hazard/MapServer';
const BF='https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/Planning/Bush_Fire_Prone_Land/MapServer';
const PROP='https://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_Property/MapServer';
const CAD='https://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_Cadastre/MapServer';
// Canley Vale test point (known-good): expect zone R3, height 9, FSR 0.45.
const PT='geometry=150.9320647,-33.8849769&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&returnGeometry=false&f=json';

const DEPS = [
  { name:'Zone',     url:`${PP}/11/query?${PT}&outFields=LAY_CLASS,SYM_CODE,LGA_NAME`, field:'SYM_CODE' },
  { name:'MinLot',   url:`${PP}/14/query?${PT}&outFields=LOT_SIZE`, field:'LOT_SIZE', optional:true },
  { name:'Heritage', url:`${PP}/8/query?${PT}&outFields=H_NAME,LEGIS_REF_CLAUSE`, field:null, optional:true },
  { name:'FSR',      url:`${PP}/4/query?${PT}&outFields=FSR,LAY_CLASS`, field:'FSR', expectVal:0.45 },
  { name:'Height',   url:`${PP}/7/query?${PT}&outFields=MAX_B_H`, field:'MAX_B_H', expectVal:9 },
  { name:'Flood',    url:`${HZ}/1/query?${PT}&outFields=EPI_NAME,LGA_NAME`, field:null, optional:true },
  { name:'Bushfire', url:`${BF}/0/query?${PT}&outFields=*`, field:null, optional:true },
  { name:'Property', url:`${PROP}/4/query?where=address%3D%27148%20CANLEY%20VALE%20ROAD%20CANLEY%20HEIGHTS%27&outFields=propid&returnGeometry=false&f=json`, field:'propid' },
  { name:'Cadastre', url:`${CAD}/9?f=json`, field:null, meta:true },
];

let failures=0;
for(const d of DEPS){
  const r=curl(d.url);
  if(r.__neterr){ console.log(`  [NET ] ${d.name}: ${r.__neterr}`); failures++; continue; }
  if(r.error){ console.log(`  [FAIL] ${d.name}: HTTP ${r.error.code} ${r.error.message||''}`); failures++; continue; }
  if(d.meta){ console.log(`  [ OK ] ${d.name}: service reachable`); continue; }
  const fs=r.features||[];
  if(d.expectVal!==undefined){
    const v=fs.length?fs[0].attributes[d.field]:null;
    if(v===d.expectVal) console.log(`  [ OK ] ${d.name}: ${d.field}=${v}`);
    else { console.log(`  [WARN] ${d.name}: ${d.field}=${v} (expected ${d.expectVal}) - field/layer may have moved`); failures++; }
  } else if(d.field){
    const has=fs.length && (fs[0].attributes[d.field]!==undefined);
    if(has || d.optional) console.log(`  [ OK ] ${d.name}: field '${d.field}' present (${fs.length} feature/s)`);
    else { console.log(`  [FAIL] ${d.name}: field '${d.field}' missing`); failures++; }
  } else {
    console.log(`  [ OK ] ${d.name}: query ok (${fs.length} feature/s)`);
  }
}
console.log(failures? `\nSERVICE HEALTH: ${failures} dependency issue(s)`:'\nSERVICE HEALTH: all dependencies OK');
process.exit(failures?1:0);
