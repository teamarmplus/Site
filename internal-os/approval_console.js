#!/usr/bin/env node
/**
 * SiteVerdict Internal OS — Approval Console V2 (generator)
 * Builds a static internal HTML dashboard from queue data. Open the HTML locally in a browser.
 * INTERNAL ONLY. No server. No email sent. No invoice sent. No payment. No public file changed.
 * AI prepares · T approves · System records.
 *
 * USAGE
 *   node approval_console.js --out ./output            (uses output/enquiries.json if present, else sample-queue.json)
 *   node approval_console.js --queue sample-queue.json --out .
 * Writes approval-console.html.
 */
const fs = require('fs');
const path = require('path');

function parseArgs(argv){const a={};for(let i=2;i<argv.length;i++){if(argv[i].startsWith('--')){a[argv[i].slice(2)]=(argv[i+1]&&!argv[i+1].startsWith('--'))?argv[++i]:true;}}return a;}

// priority from base status / flags
function priorityOf(item){
  const b=item.baseStatus||item.status;
  if(b==='BLOCKED'||(item.flags||[]).includes('address_not_matched')) return {rank:0,label:'urgent'};
  if(b==='REVIEW') return {rank:1,label:'high'};
  if(item.status==='QUOTE_READY'||(item.flags||[]).includes('quote_needs_price')) return {rank:2,label:'high'};
  if(b==='PASS' && !['WON','LOST','ARCHIVED'].includes(item.status)) return {rank:3,label:'normal'};
  return {rank:4,label:'low'};
}

const FLAG_WARN = {
  address_not_matched:'Address not confidently matched',
  min_lot_not_confirmed:'Minimum lot size not confirmed',
  zone_not_confirmed:'Zone not confirmed',
  heritage_detected:'Heritage indicator detected',
  flood_detected:'Flood planning indicator detected',
  bushfire_detected:'Bushfire prone indicator detected',
  user_entered_only:'Land size/frontage user-entered only',
  quote_needs_price:'Quote needs T price approval'
};

function loadQueue(args){
  const candidates=[];
  if(args.queue) candidates.push(args.queue);
  candidates.push(path.join(args.out||'.','enquiries.json'));
  candidates.push(path.join(__dirname,'sample-queue.json'));
  for(const c of candidates){ if(c && fs.existsSync(c)){ try{ const d=JSON.parse(fs.readFileSync(c,'utf8')); if(Array.isArray(d)&&d.length) return {data:d,source:c}; }catch(e){} } }
  return {data:[],source:'(none)'};
}

function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

function summaryCards(items){
  const c={ new:0, waiting:0, needsInfo:0, quoteReady:0, followUp:0, won:0, lost:0 };
  for(const it of items){
    if(it.status==='NEW'||it.status==='PREP_READY') c.new++;
    if(it.status==='WAITING_APPROVAL') c.waiting++;
    if(it.status==='NEEDS_INFO') c.needsInfo++;
    if(it.status==='QUOTE_READY'||it.status==='QUOTED') c.quoteReady++;
    if(it.status==='FOLLOW_UP_DUE') c.followUp++;
    if(it.status==='WON') c.won++;
    if(it.status==='LOST') c.lost++;
  }
  const purposes={},paths={};
  items.forEach(it=>{purposes[it.purpose]=(purposes[it.purpose]||0)+1;paths[it.pathway]=(paths[it.pathway]||0)+1;});
  const top=o=>Object.entries(o).sort((a,b)=>b[1]-a[1])[0];
  c.commonPurpose=top(purposes)?top(purposes)[0]:'—';
  c.commonPathway=top(paths)?top(paths)[0]:'—';
  c.opportunities=items.filter(it=>it.quote && !['WON','LOST','ARCHIVED'].includes(it.status)).length;
  return c;
}

function render(items, source){
  items.forEach(it=>{it._p=priorityOf(it);});
  items.sort((a,b)=>a._p.rank-b._p.rank || new Date(a.created_at)-new Date(b.created_at));
  const c=summaryCards(items);
  const card=(label,val,cls='')=>`<div class="card ${cls}"><div class="card-val">${val}</div><div class="card-lbl">${label}</div></div>`;
  const rows=items.map(it=>{
    const warns=(it.flags||[]).filter(f=>FLAG_WARN[f]).map(f=>`<span class="warn">⚠ ${esc(FLAG_WARN[f])}</span>`).join(' ');
    const link=(p,t)=>p?`<a href="${esc(p)}">${t}</a>`:`<span class="muted">—</span>`;
    return `<tr class="prio-${it._p.label}">
      <td><span class="prio prio-${it._p.label}">${it._p.label}</span></td>
      <td class="mono">${esc(it.enquiry_id)}</td>
      <td><strong>${esc(it.name)}</strong><div class="muted small">${esc(it.email)} · ${esc(it.phone)}</div></td>
      <td>${esc(it.address)||'<span class="muted">(none)</span>'}<div class="small">${esc(it.created_at).split('T')[0]}</div></td>
      <td>${esc(it.purpose)}</td>
      <td><span class="status s-${esc(it.status)}">${esc(it.status)}</span><div class="small muted">${esc(it.confidence)} conf</div></td>
      <td class="small">${esc(it.pathway)}</td>
      <td class="small">${esc(it.action)}${warns?`<div class="warns">${warns}</div>`:''}</td>
      <td class="small">${link(it.prep,'prep')} · ${link(it.email_file||it.email,'email')} · ${link(it.quote,'quote')}</td>
      <td class="decide">
        <button>Approve</button><button>Revision</button><button>More info</button>
        <button>Prepare quote</button><button>Archive</button><button>Won</button><button>Lost</button>
        <div class="muted small">V2 visual control — record in sample-decisions.json / future backend.</div>
      </td>
    </tr>
    <tr class="preview"><td colspan="10">
      <div class="pv"><strong>AI summary:</strong> ${esc(it.summary)}</div>
      <div class="pv"><strong>Draft response excerpt:</strong> ${esc(it.draft_excerpt)||'<span class="muted">—</span>'}</div>
      <div class="pv"><strong>Quote draft excerpt:</strong> ${esc(it.quote_excerpt)||'<span class="muted">none (triage/blocked)</span>'}</div>
      <div class="pv checklist"><strong>Human approval checklist:</strong> confirm address/parcel · re-read not-confirmed items · remove any unsupported claim · confirm pathway fits goal/budget · approve price (if quote) · send manually (never auto-send)</div>
    </td></tr>`;
  }).join('\n');

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>SiteVerdict — Internal Approval Console (V2)</title>
<style>
  :root{--bg:#0f1419;--panel:#1a222c;--line:#2a3644;--txt:#e6edf3;--muted:#8b98a5;--urgent:#ff6b6b;--high:#ffa94d;--normal:#4dabf7;--low:#69db7c;--accent:#4dabf7;}
  *{box-sizing:border-box} body{margin:0;background:var(--bg);color:var(--txt);font:14px/1.5 -apple-system,Segoe UI,Roboto,sans-serif}
  header{padding:18px 24px;border-bottom:1px solid var(--line);background:var(--panel)}
  h1{margin:0;font-size:18px} .sub{color:var(--muted);font-size:12px;margin-top:4px}
  .banner{background:#2a2113;border:1px solid #5c4a1a;color:#ffd966;padding:8px 24px;font-size:12px}
  .cards{display:flex;flex-wrap:wrap;gap:12px;padding:16px 24px}
  .card{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:12px 16px;min-width:120px}
  .card-val{font-size:22px;font-weight:700} .card-lbl{color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.04em}
  table{width:100%;border-collapse:collapse;font-size:13px} th,td{text-align:left;padding:10px 12px;vertical-align:top;border-bottom:1px solid var(--line)}
  th{color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.04em;position:sticky;top:0;background:var(--panel)}
  .mono{font-family:ui-monospace,monospace;font-size:12px;color:var(--muted)} .small{font-size:11px} .muted{color:var(--muted)}
  .prio{padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700;text-transform:uppercase}
  .prio-urgent{background:rgba(255,107,107,.15);color:var(--urgent)} .prio-high{background:rgba(255,169,77,.15);color:var(--high)}
  .prio-normal{background:rgba(77,171,247,.15);color:var(--normal)} .prio-low{background:rgba(105,219,124,.12);color:var(--low)}
  tr.prio-urgent td{background:rgba(255,107,107,.04)}
  .status{padding:2px 8px;border-radius:6px;font-size:11px;font-weight:600;background:var(--line)}
  .s-NEEDS_INFO{background:rgba(255,107,107,.2);color:var(--urgent)} .s-WAITING_APPROVAL{background:rgba(255,169,77,.2);color:var(--high)}
  .s-QUOTE_READY{background:rgba(77,171,247,.2);color:var(--normal)} .s-WON{background:rgba(105,219,124,.2);color:var(--low)}
  .warn{display:inline-block;background:rgba(255,107,107,.12);color:#ff8787;border-radius:5px;padding:1px 6px;font-size:11px;margin:2px 2px 0 0}
  .decide button{background:var(--line);color:var(--txt);border:0;border-radius:6px;padding:4px 8px;margin:2px;font-size:11px;cursor:pointer}
  .decide button:hover{background:var(--accent);color:#08121c}
  tr.preview td{background:#121922;border-bottom:2px solid var(--line)} .pv{margin:3px 0} .checklist{color:#ffd966}
  a{color:var(--accent)} footer{padding:16px 24px;color:var(--muted);font-size:12px;border-top:1px solid var(--line)}
</style></head><body>
<header><h1>SiteVerdict — Internal Approval Console <span class="muted">V2</span></h1>
<div class="sub">AI prepares · T approves · System records. &nbsp; Source: ${esc(path.basename(source))} · ${items.length} enquiries · generated ${new Date().toISOString()}</div></header>
<div class="banner">⚠ Internal only — do not share. No email is sent automatically. No invoice is sent automatically. No payment is connected. Every external action requires human approval.</div>
<div class="cards">
  ${card('New / prep ready',c.new)}
  ${card('Waiting approval',c.waiting,'')}
  ${card('Needs info',c.needsInfo)}
  ${card('Quote ready',c.quoteReady)}
  ${card('Follow-up due',c.followUp)}
  ${card('Won',c.won)}
  ${card('Lost',c.lost)}
  ${card('Opportunities',c.opportunities)}
  ${card('Common purpose',esc(c.commonPurpose))}
  ${card('Common pathway',esc(c.commonPathway))}
</div>
<table><thead><tr>
  <th>Priority</th><th>ID</th><th>Client</th><th>Address / date</th><th>Purpose</th><th>Status</th>
  <th>Revenue / service pathway</th><th>Recommended action / warnings</th><th>Docs</th><th>Decision (visual)</th>
</tr></thead><tbody>
${rows}
</tbody></table>
<footer>Decisions are recorded in sample-decisions.json (schema) and will be persisted by a future V3 backend.
Allowed decisions: APPROVED_TO_SEND · REVISION_REQUESTED · NEEDS_MORE_INFO · PREPARE_QUOTE · ARCHIVE · MARK_WON · MARK_LOST.
This console never sends emails or invoices and never connects payment.</footer>
</body></html>`;
}

function generate(args){
  const {data,source}=loadQueue(args);
  const html=render(data, source);
  const outDir=args.out||'.';
  if(!fs.existsSync(outDir)) fs.mkdirSync(outDir,{recursive:true});
  const out=path.join(outDir,'approval-console.html');
  fs.writeFileSync(out, html);
  return {out,count:data.length,source,html};
}

if(require.main===module){
  const r=generate(parseArgs(process.argv));
  console.log(`Generated ${r.out} from ${path.basename(r.source)} (${r.count} enquiries)`);
}
module.exports = { generate, render, priorityOf, summaryCards, loadQueue, FLAG_WARN };
