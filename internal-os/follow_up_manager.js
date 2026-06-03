#!/usr/bin/env node
/**
 * SiteVerdict Internal OS — Follow-Up + Revenue Control (V1)
 * One board that shows what needs attention today. INTERNAL ONLY.
 * No automatic emails. No automatic invoices. No automatic trader contact. No deploy. No public change.
 * AI prepares · system organises · T approves · business moves.
 *
 * USAGE
 *   node follow_up_manager.js --in sample-followups.csv --out follow-up-board.md [--today 2026-06-03]
 */
const fs = require('fs');

const ACTIVE_EXCLUDED = ['WON','LOST','ARCHIVED'];
const STATUSES = ['NEW','WAITING_T_APPROVAL','NEEDS_MORE_INFO','RESPONSE_READY','QUOTE_READY',
 'QUOTE_SENT_MANUALLY','FOLLOW_UP_DUE','WAITING_CLIENT','TRADER_MATCH_PENDING','CLIENT_CONSENT_NEEDED',
 'JOB_IN_PROGRESS','WON','LOST','ARCHIVED'];

// timing rule per status: {dueDays from the relevant anchor date, priority, action}
// anchor = last_touch_at if present else created_at
const RULES = {
  NEEDS_MORE_INFO:     {days:0,  prio:'urgent', action:'Send the "more info needed" draft today (blocked/missing details).'},
  NEW:                 {days:1,  prio:'high',   action:'Review the new enquiry and prepare a response (within 24h).'},
  WAITING_T_APPROVAL:  {days:2,  prio:'high',   action:'T to approve/edit the prepared response (ready 48h).'},
  RESPONSE_READY:      {days:2,  prio:'high',   action:'T to approve the draft response, then send manually (within 48h).'},
  QUOTE_READY:         {days:2,  prio:'high',   action:'T to confirm price/scope on the quote draft, then send manually.'},
  QUOTE_SENT_MANUALLY: {days:3,  prio:'normal', action:'Follow up on the quote (no reply after ~3 days).'},
  TRADER_MATCH_PENDING:{days:2,  prio:'high',   action:'Review trader shortlist; do not share client details without consent.'},
  CLIENT_CONSENT_NEEDED:{days:1, prio:'high',   action:'Request client consent before any trader introduction.'},
  WAITING_CLIENT:      {days:7,  prio:'normal', action:'Gentle client follow-up (no response ~7 days).'},
  FOLLOW_UP_DUE:       {days:7,  prio:'normal', action:'Send the gentle follow-up draft.'},
  JOB_IN_PROGRESS:     {days:14, prio:'low',    action:'Check progress / prepare to collect feedback.'},
  WON:                 {days:null,prio:'low',   action:'Closed-won. Optional: request a review / nurture.'},
  LOST:                {days:null,prio:'low',   action:'Closed-lost. No active follow-up.'},
  ARCHIVED:            {days:null,prio:'low',   action:'Archived. No active follow-up.'},
};
// escalation: if an active item is far past due, raise priority
function escalate(prio, overdueDays){
  if(overdueDays>=14 && prio!=='urgent') return 'urgent';
  if(overdueDays>=7 && prio==='normal') return 'high';
  return prio;
}

function parseArgs(argv){const a={};for(let i=2;i<argv.length;i++){if(argv[i].startsWith('--')){a[argv[i].slice(2)]=(argv[i+1]&&!argv[i+1].startsWith('--'))?argv[++i]:true;}}return a;}
function parseCSV(text){
  const lines=text.split(/\r?\n/).filter(l=>l.trim());
  const headers=lines[0].split(',').map(h=>h.trim());
  return lines.slice(1).map(line=>{const v=[];let c='',q=false;for(const ch of line){if(ch==='"'){q=!q;}else if(ch===','&&!q){v.push(c);c='';}else c+=ch;}v.push(c);const o={};headers.forEach((h,i)=>o[h]=(v[i]||'').trim());return o;});
}
function addDays(d, n){ const x=new Date(d); x.setTime(x.getTime()+n*86400000); return x; }
// date-only in AEST (+10:00) so anchors like 2026-06-03T08:00+10:00 stay on 2026-06-03
function dateOnly(d){ return new Date(new Date(d).getTime()+10*3600000).toISOString().slice(0,10); }

function computeItem(row, today){
  const status=STATUSES.includes(row.status)?row.status:'NEW';
  const rule=RULES[status]||RULES.NEW;
  const anchor=row.last_touch_at||row.created_at||today.toISOString();
  let dueDate=null, overdueDays=0, prio=rule.prio;
  const active=!ACTIVE_EXCLUDED.includes(status);
  if(rule.days!=null){
    dueDate=addDays(anchor, rule.days);
    // compare calendar dates in AEST to match the displayed due_date
    const dueCal=dateOnly(dueDate), todayCal=dateOnly(today);
    overdueDays=Math.round((new Date(todayCal+'T00:00:00Z') - new Date(dueCal+'T00:00:00Z'))/86400000);
    if(active && overdueDays>0) prio=escalate(prio, overdueDays);
  }
  // revenue opportunity (placeholders only — no real amounts)
  const rev=[];
  if(row.rev_review_fee==='yes') rev.push('review fee (T to confirm)');
  if(row.rev_service_quote==='yes') rev.push('service quote (T to confirm)');
  if(row.rev_trader_referral==='yes') rev.push('trader referral (T to confirm)');
  const related=[row.related_prep,row.related_email,row.related_quote,row.related_trader_match].filter(Boolean).join(' · ')||'—';
  return {
    item_id:row.item_id, client:row.client, suburb:row.suburb, purpose:row.purpose,
    status, active,
    due_date: dueDate?dateOnly(dueDate):'—',
    overdue: active && overdueDays>0 ? overdueDays : 0,
    priority: prio,
    reason: row.notes||'',
    action: rule.action,
    revenue: rev.join(', ')||'—',
    rev_status: row.rev_status||'draft',
    related
  };
}

function dashboard(items){
  const d={open:0,waitingApproval:0,quoteReady:0,followUpDue:0,traderPending:0,won:0,lost:0,delayed:0,opportunities:0};
  const needs={};
  for(const it of items){
    if(it.status==='NEW'||it.status==='NEEDS_MORE_INFO') d.open++;
    if(it.status==='WAITING_T_APPROVAL'||it.status==='RESPONSE_READY') d.waitingApproval++;
    if(it.status==='QUOTE_READY') d.quoteReady++;
    if(it.status==='FOLLOW_UP_DUE'||it.status==='WAITING_CLIENT'||it.status==='QUOTE_SENT_MANUALLY') d.followUpDue++;
    if(it.status==='TRADER_MATCH_PENDING'||it.status==='CLIENT_CONSENT_NEEDED') d.traderPending++;
    if(it.status==='WON') d.won++;
    if(it.status==='LOST') d.lost++;
    if(it.active && it.overdue>0) d.delayed++;
    if(it.active && it.revenue!=='—') d.opportunities++;
    if(it.active){ needs[it.purpose]=(needs[it.purpose]||0)+1; }
  }
  const top=Object.entries(needs).sort((a,b)=>b[1]-a[1])[0];
  d.commonNeed=top?top[0]:'—';
  return d;
}

const PRIO_RANK={urgent:0,high:1,normal:2,low:3};
function render(items){
  const active=items.filter(i=>i.active).sort((a,b)=> PRIO_RANK[a.priority]-PRIO_RANK[b.priority] || b.overdue-a.overdue || a.due_date.localeCompare(b.due_date));
  const closed=items.filter(i=>!i.active);
  const d=dashboard(items);
  let md='# SiteVerdict — Internal Follow-Up Board\nGenerated: '+new Date().toISOString()+'\n\n'+
   'AI prepares · system organises · T approves · business moves. '+
   'No emails/invoices/trader-contact are sent automatically — this board only reminds and links drafts.\n\n'+
   '## Dashboard\n'+
   `- Open enquiries: ${d.open}\n- Waiting T approval: ${d.waitingApproval}\n- Quote ready: ${d.quoteReady}\n`+
   `- Follow-up due: ${d.followUpDue}\n- Trader match / consent pending: ${d.traderPending}\n`+
   `- Won: ${d.won}\n- Lost: ${d.lost}\n- Delayed (overdue active): ${d.delayed}\n`+
   `- Revenue opportunities (open, placeholders): ${d.opportunities}\n- Common service need: ${d.commonNeed}\n\n`+
   '## Needs attention (active, by priority)\n'+
   '| Priority | Item | Client | Suburb | Purpose | Status | Due | Overdue | Next action (human-approved) | Revenue (placeholder) | Related |\n'+
   '|----------|------|--------|--------|---------|--------|-----|---------|------------------------------|-----------------------|---------|\n'+
   active.map(i=>`| **${i.priority}** | ${i.item_id} | ${i.client} | ${i.suburb} | ${i.purpose} | ${i.status} | ${i.due_date} | ${i.overdue?i.overdue+'d':'—'} | ${i.action} | ${i.revenue} (${i.rev_status}) | ${i.related} |`).join('\n')+'\n\n'+
   '## Closed / archived (not active)\n'+
   (closed.length? closed.map(i=>`- ${i.item_id} ${i.client} — **${i.status}** (${i.rev_status})`).join('\n') : '- (none)')+'\n\n'+
   '_Every next action requires human approval. No email, invoice, or trader contact is sent by this tool. Revenue figures are placeholders to be confirmed by T._\n';
  return md;
}

function build(args){
  const today = args.today ? new Date(args.today+'T12:00:00+10:00') : new Date();
  const rows = parseCSV(fs.readFileSync(args.in||'sample-followups.csv','utf8'));
  const items = rows.map(r=>computeItem(r, today));
  return { items, today };
}

if(require.main===module){
  const args=parseArgs(process.argv);
  const { items }=build(args);
  fs.writeFileSync(args.out||'follow-up-board.md', render(items));
  const d=dashboard(items);
  console.log('Wrote '+(args.out||'follow-up-board.md')+' — '+items.length+' items | open '+d.open+' · waiting '+d.waitingApproval+' · quote '+d.quoteReady+' · delayed '+d.delayed);
}
module.exports = { computeItem, dashboard, render, build, RULES, STATUSES, ACTIVE_EXCLUDED, escalate };
