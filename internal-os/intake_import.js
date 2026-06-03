#!/usr/bin/env node
/**
 * SiteVerdict Internal OS — Intake Import
 * Maps a Netlify "siteverdict-professional-review" CSV export to internal enquiry records.
 * INTERNAL ONLY. No public file changed. No email/invoice sent. No deploy.
 *
 * USAGE: node intake_import.js --csv sample-netlify-form-export.csv --out ./output
 * Writes ./output/enquiries.json (array of internal enquiry records).
 */
const fs = require('fs');
const path = require('path');

const PURPOSE_MAP = {
  not_sure:'notsure', notsure:'notsure', 'not sure':'notsure',
  buy:'buy', sell:'sell', build:'build', develop:'develop',
  oc_handover:'oc', 'oc/handover':'oc', oc:'oc',
  external_works:'external', 'external works':'external', external:'external'
};

function parseArgs(argv){const a={};for(let i=2;i<argv.length;i++){if(argv[i].startsWith('--')){a[argv[i].slice(2)]=(argv[i+1]&&!argv[i+1].startsWith('--'))?argv[++i]:true;}}return a;}
function ensureDir(d){if(!fs.existsSync(d))fs.mkdirSync(d,{recursive:true});}
function parseCSV(text){
  const lines=text.split(/\r?\n/).filter(l=>l.trim());
  const headers=lines[0].split(',').map(h=>h.trim().toLowerCase().replace(/^"|"$/g,''));
  return lines.slice(1).map(line=>{const vals=[];let cur='',q=false;for(const ch of line){if(ch==='"'){q=!q;}else if(ch===','&&!q){vals.push(cur);cur='';}else cur+=ch;}vals.push(cur);const o={};headers.forEach((h,i)=>o[h]=(vals[i]||'').trim().replace(/^"|"$/g,''));return o;});
}
function slug(s){return (s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,32);}

function mapRow(row, i){
  const g=(...keys)=>{for(const k of keys){if(row[k]!==undefined&&row[k]!=='')return row[k];}return '';};
  const rawPurpose=(g('purpose')||'notsure').toLowerCase().replace(/[\s/]+/g,'_');
  const name=g('name'); const addr=g('property_address','address');
  const created=g('submitted at','created at','date','timestamp')||new Date().toISOString();
  return {
    submission_id: g('submission id','id') || ('ENQ-'+String(i+1).padStart(3,'0')+'-'+(slug(name)||slug(addr)||'x')),
    created_at: created,
    name, email: g('email'), phone: g('phone'),
    address: addr,
    purpose: PURPOSE_MAP[rawPurpose] || 'notsure',
    land_size: g('land_size','block','land size') || null,
    frontage: g('frontage','front') || null,
    notes: g('notes','description','message'),
    upload_filename: g('upload','file') || null,
    source: 'Professional Review form'
  };
}

function main(){
  const args=parseArgs(process.argv);
  if(!args.csv){console.error('ERROR: --csv <export.csv> required');process.exit(1);}
  const outDir=args.out||'./output'; ensureDir(outDir);
  const rows=parseCSV(fs.readFileSync(args.csv,'utf8'));
  const enquiries=rows.map(mapRow);
  fs.writeFileSync(path.join(outDir,'enquiries.json'), JSON.stringify(enquiries,null,2));
  console.log(`Imported ${enquiries.length} enquiries -> ${path.join(outDir,'enquiries.json')}`);
  enquiries.forEach(e=>console.log(`  ${e.submission_id} | ${e.name||'—'} | ${e.address||'(no address)'} | ${e.purpose}`));
}

if(require.main===module) main();
module.exports = { mapRow, parseCSV, PURPOSE_MAP };
