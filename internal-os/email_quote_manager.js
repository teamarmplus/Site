#!/usr/bin/env node
/**
 * SiteVerdict Internal OS — Email + Quote Draft Manager (V2)
 * Reads queue.json (+ decisions.json) and produces high-quality internal drafts.
 * INTERNAL ONLY. No email sent. No invoice sent. No payment/Stripe/Xero/QuickBooks. No public change.
 * AI prepares · T approves · Nothing leaves the company without human approval.
 *
 * USAGE
 *   node email_quote_manager.js --queue output/queue.json --decisions output/decisions.json --out output/email-manager
 * Generates:
 *   <out>/email-index.md
 *   <out>/emails/<id>.md       (one selected draft per enquiry)
 *   <out>/quotes/<id>.md       (where appropriate)
 *   <out>/followups/<id>.md    (where appropriate)
 */
const fs = require('fs');
const path = require('path');

function parseArgs(argv){const a={};for(let i=2;i<argv.length;i++){if(argv[i].startsWith('--')){a[argv[i].slice(2)]=(argv[i+1]&&!argv[i+1].startsWith('--'))?argv[++i]:true;}}return a;}
function ensureDir(d){if(!fs.existsSync(d))fs.mkdirSync(d,{recursive:true});}
function slug(s){return (s||'enquiry').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,48);}
function firstName(name){ if(!name) return 'there'; return name.trim().split(/\s+/)[0]; }
function loadJSON(p,def){ try{ return JSON.parse(fs.readFileSync(p,'utf8')); }catch(e){ return def; } }

const SIGNOFF = '\nKind regards,\nThe SiteVerdict team';
const PRELIM = 'This is preliminary information based on NSW planning data, not legal, planning, financial, survey or valuation advice, and not a guarantee of any approval, value, profit or outcome.';
const APPROVAL = '\n\n[INTERNAL — NEEDS HUMAN APPROVAL before sending. Edit lightly, confirm address/parcel, then send manually. No email is sent by this tool.]';

// turn the queue record's flags into a short, warm "what still needs checking" line
function checksLine(it){
  const m=[];
  if((it.flags||[]).includes('zone_not_confirmed')) m.push('the zoning');
  if((it.flags||[]).includes('min_lot_not_confirmed')) m.push('the minimum lot size');
  if((it.flags||[]).includes('user_entered_only')) m.push('the land size/frontage you provided');
  m.push('title, boundaries and any easements');
  if((it.flags||[]).includes('heritage_detected')) m.push('heritage scope');
  if((it.flags||[]).includes('flood_detected')) m.push('flood/stormwater');
  if((it.flags||[]).includes('bushfire_detected')) m.push('bushfire (BAL)');
  // unique, max 4
  return [...new Set(m)].slice(0,4).join(', ');
}
function confirmedLine(it){
  // draft_excerpt holds the top verified facts; soften the wording
  return it.draft_excerpt && it.draft_excerpt!=='—' ? it.draft_excerpt : 'your property details';
}

// ---------- email builders (warm, structured, safe) ----------
function emailAcknowledgement(it){
  return { subject:`We've received your enquiry — ${it.address||'your property'}`,
    body:`Hi ${firstName(it.name)},

Thanks for getting in touch about ${it.address||'your property'}. We've received your Professional Review enquiry and we're looking into it now — you'll hear back from us within 24–48 hours on business days.

Here's a quick first look from NSW planning data:
- What we could confirm: ${confirmedLine(it)}
- What still needs checking before any decision: ${checksLine(it)}

We'll come back with a clear next step shortly.

${PRELIM}${SIGNOFF}` };
}
function emailMoreInfo(it){
  return { subject:`A quick detail to get started — ${it.address||'your enquiry'}`,
    body:`Hi ${firstName(it.name)},

Thanks for your Professional Review enquiry. We'd love to help — to look up the right property in NSW planning data, could you confirm the full address? A complete street number, street, suburb and postcode is all we need.

As soon as we have that, we'll prepare a plain-English summary of what we found and what still needs checking.

${PRELIM}${SIGNOFF}` };
}
function emailReviewOffer(it){
  const next = it.pathway && it.pathway!=='Not enough information' ? it.pathway : 'a first-step Professional Review with a town planner';
  return { subject:`Your next step for ${it.address||'your property'}`,
    body:`Hi ${firstName(it.name)},

Thanks for your enquiry about ${it.address||'your property'}. Here's where things stand and how we can help.

What we could confirm from NSW planning data:
${confirmedLine(it)}

What still needs checking before you spend money:
${checksLine(it)}

A useful next step: ${next}. A Professional Review brings the right professional in to confirm these properly, so you can make decisions with confidence. If you'd like to go ahead, just reply and we'll confirm the scope and any cost with you first — no surprises.

${PRELIM}${SIGNOFF}` };
}
function emailServicePathway(it){
  return { subject:`Helping with the next steps at ${it.address||'your property'}`,
    body:`Hi ${firstName(it.name)},

Thanks for your enquiry about ${it.address||'your property'}. Based on what you've told us, the practical next steps look like: ${it.pathway||'external works review'}.

Before any work, the things worth scoping are: ${checksLine(it)}.

We can help coordinate or quote this once we've confirmed the scope with you — we'll always confirm any cost before proceeding.

${PRELIM}${SIGNOFF}` };
}
function emailReferral(it){
  return { subject:`The right professional for ${it.address||'your property'}`,
    body:`Hi ${firstName(it.name)},

Thanks for your enquiry about ${it.address||'your property'}. From what we can see, the most useful next step is to involve the right professional: ${it.pathway||'a town planner'}.

What still needs checking: ${checksLine(it)}.

We can help point you to a suitable professional or coordinate it for you. Just let us know and we'll confirm the details first.

${PRELIM}${SIGNOFF}` };
}
function emailNotSuitable(it){
  return { subject:`Your enquiry about ${it.address||'your property'}`,
    body:`Hi ${firstName(it.name)},

Thanks for reaching out about ${it.address||'your property'}. Based on the details so far, this isn't something we can usefully help with right now — and we'd rather be upfront than overpromise. If your plans change or you can share more detail, we're very happy to take another look.

${PRELIM}${SIGNOFF}` };
}
function emailRevisionNote(it){
  return { subject:`[INTERNAL] Revision requested — ${it.address||it.enquiry_id}`,
    body:`[INTERNAL NOTE — not for client]

A revision was requested for ${it.name||'this enquiry'} (${it.address||'no address'}).
Current status: ${it.status} (${it.baseStatus}).
Suggested: review the prep sheet, adjust the draft response/scope, then regenerate before approving.

${APPROVAL}` , internal:true };
}
function emailFollowUp(it){
  return { subject:`Following up on ${it.address||'your enquiry'}`,
    body:`Hi ${firstName(it.name)},

Just a friendly follow-up on your enquiry about ${it.address||'your property'}. If you'd still like to take the next step (${it.pathway||'a Professional Review'}), reply any time and we'll pick it up from here. No rush at all.

${PRELIM}${SIGNOFF}` };
}

// ---------- quote builder (richer) ----------
function quoteService(it){
  switch(it.purpose){
    case 'oc': return 'OC / handover external works review';
    case 'external': return 'External works review (drainage / driveway / retaining / access)';
    case 'develop': return 'Preliminary Professional Review (planning)';
    case 'build': return 'Preliminary Professional Review (planning / certifier)';
    case 'buy': return 'Pre-purchase Professional Review';
    case 'sell': return 'Property data summary (no valuation)';
    default: return 'Site Check interpretation call';
  }
}
function quoteDeliverables(it){
  const base=['Plain-English summary of confirmed NSW planning facts','Clear list of what still needs checking','Recommended next step and suitable professional(s)'];
  if(['oc','external'].includes(it.purpose)) base.push('Scoped external-works item list (drainage, driveway/crossover, retaining, access)');
  return base;
}
function quoteDraft(it){
  const qid='Q-'+slug(it.enquiry_id).toUpperCase().slice(0,16);
  return `# QUOTE / SERVICE DRAFT — NEEDS HUMAN APPROVAL
**Status:** DRAFT — not sent. No invoice. No payment link. T confirms price, scope, and sends manually.

- **Quote ID:** ${qid}
- **Client:** ${it.name||'—'}  (${it.email||'—'} · ${it.phone||'—'})
- **Property:** ${it.address||'—'}
- **Enquiry purpose:** ${it.purpose}

## Proposed service
${quoteService(it)}

## Scope
- Confirm the NSW planning data relevant to "${it.purpose}" for this property.
- Interpret what it means in plain English and flag what still needs professional verification.
${['oc','external'].includes(it.purpose)?'- Scope the external-works items relevant to the site.':'- Identify and (if wanted) coordinate the right professional(s).'}

## Deliverables
${quoteDeliverables(it).map(d=>'- '+d).join('\n')}

## Assumptions
- Client confirms the address/parcel is correct.
- Information provided by the client (e.g. land size/frontage) is taken as supplied and noted as not independently verified.
- Public NSW planning layers are available at time of review.

## Exclusions
- Not legal, planning, financial, survey, valuation or engineering advice (provided by licensed professionals).
- Does not guarantee any approval, value, profit, loan or subdivision outcome.
- Council and third-party fees are not included unless stated.

## Commercials (placeholders — T to confirm)
- Price: **T to confirm**
- GST: **T to confirm**   ABN: **T to confirm**
- Payment terms: **T to confirm**
- Quote valid until: **T to confirm**

## Required from the client before starting
- Confirmation of the full property address/parcel.
- Any documents already held (e.g. prior reports, survey) — optional.

## Human approval
- [ ] T has confirmed scope and deliverables
- [ ] T has confirmed price / GST / ABN / validity
- [ ] T approves sending
*(No invoice is issued or sent by this tool. No payment link. AI prepares; T approves; system records.)*
`;
}

// ---------- decision-aware selection ----------
function latestDecision(decisions, enquiryId){
  const ds=decisions.filter(d=>d.enquiry_id===enquiryId);
  return ds.length?ds[ds.length-1].decision:null;
}
// returns {emailType, makeQuote, makeFollowUp}
function selectDrafts(it, decision){
  // decision overrides where present
  if(decision==='NEEDS_MORE_INFO') return {emailType:'more-info', makeQuote:false, makeFollowUp:false};
  if(decision==='PREPARE_QUOTE')  return {emailType:emailTypeByPurpose(it), makeQuote:true, makeFollowUp:false};
  if(decision==='REVISION_REQUESTED') return {emailType:'revision', makeQuote:false, makeFollowUp:false};
  if(decision==='APPROVED_TO_SEND') return {emailType:emailTypeByPurpose(it), makeQuote:!!it.quote, makeFollowUp:false};
  if(decision==='MARK_WON') return {emailType:'follow-up', makeQuote:false, makeFollowUp:true};
  if(decision==='MARK_LOST'||decision==='ARCHIVE') return {emailType:'none', makeQuote:false, makeFollowUp:false};
  // no decision yet -> derive from status
  if(it.status==='NEEDS_INFO') return {emailType:'more-info', makeQuote:false, makeFollowUp:false};
  if(it.status==='WON') return {emailType:'follow-up', makeQuote:false, makeFollowUp:true};
  if(['LOST','ARCHIVED'].includes(it.status)) return {emailType:'none', makeQuote:false, makeFollowUp:false};
  return {emailType:emailTypeByPurpose(it), makeQuote:(it.status==='QUOTE_READY'||!!it.quote), makeFollowUp:(it.status==='FOLLOW_UP_DUE')};
}
function emailTypeByPurpose(it){
  if(it.status==='NEEDS_INFO') return 'more-info';
  if(['oc','external'].includes(it.purpose)) return 'service-pathway';
  if(['develop','build','buy','sell'].includes(it.purpose)) return 'review-offer';
  if(it.purpose==='notsure') return 'acknowledgement';
  return 'acknowledgement';
}
function buildEmail(type, it){
  switch(type){
    case 'acknowledgement': return emailAcknowledgement(it);
    case 'more-info': return emailMoreInfo(it);
    case 'review-offer': return emailReviewOffer(it);
    case 'service-pathway': return emailServicePathway(it);
    case 'referral': return emailReferral(it);
    case 'not-suitable': return emailNotSuitable(it);
    case 'revision': return emailRevisionNote(it);
    case 'follow-up': return emailFollowUp(it);
    default: return null;
  }
}

function main(){
  const args=parseArgs(process.argv);
  const queue=loadJSON(args.queue||'output/queue.json',[]);
  const decisions=loadJSON(args.decisions||'output/decisions.json',[]);
  const out=args.out||'output/email-manager';
  ensureDir(path.join(out,'emails')); ensureDir(path.join(out,'quotes')); ensureDir(path.join(out,'followups'));

  const index=[];
  for(const it of queue){
    const decision=latestDecision(decisions, it.enquiry_id);
    const sel=selectDrafts(it, decision);
    const id=slug(it.enquiry_id);
    let emailFile='', quoteFile='', followFile='';

    if(sel.emailType && sel.emailType!=='none'){
      const e=buildEmail(sel.emailType, it);
      if(e){
        emailFile=path.join('emails',id+'.md');
        const header=e.internal?'# INTERNAL NOTE — NEEDS HUMAN APPROVAL\n\n':'# DRAFT EMAIL — NEEDS HUMAN APPROVAL (do not auto-send)\n\n';
        const tail=e.internal?'':APPROVAL;
        fs.writeFileSync(path.join(out,emailFile), `${header}**Type:** ${sel.emailType}\n**Subject:** ${e.subject}\n\n${e.body}${tail}\n`);
      }
    }
    if(sel.makeQuote){
      quoteFile=path.join('quotes',id+'.md');
      fs.writeFileSync(path.join(out,quoteFile), quoteDraft(it));
    }
    if(sel.makeFollowUp){
      const f=emailFollowUp(it);
      followFile=path.join('followups',id+'.md');
      fs.writeFileSync(path.join(out,followFile), `# FOLLOW-UP DRAFT — NEEDS HUMAN APPROVAL (do not auto-send)\n\n**Subject:** ${f.subject}\n\n${f.body}${APPROVAL}\n`);
    }
    index.push({...it, decision:decision||'(none yet)', emailType:sel.emailType, emailFile, quoteFile, followFile});
  }

  // index, triaged by status priority
  const order={NEEDS_INFO:0,WAITING_APPROVAL:1,QUOTE_READY:2,FOLLOW_UP_DUE:3,PREP_READY:4,QUOTED:5,WON:6,LOST:7,ARCHIVED:8};
  index.sort((a,b)=>(order[a.status]??9)-(order[b.status]??9));
  const md='# SiteVerdict — Email + Quote Draft Manager\nGenerated: '+new Date().toISOString()+`  |  ${index.length} enquiries\n\n`+
    'AI prepares · T approves · nothing is sent automatically. Open the draft, edit lightly, send manually.\n\n'+
    '| # | ID | Client | Address | Purpose | Status | Decision | Email draft | Quote draft | Follow-up | Needs |\n'+
    '|---|----|--------|---------|---------|--------|----------|-------------|-------------|-----------|-------|\n'+
    index.map((r,i)=>`| ${i+1} | ${r.enquiry_id} | ${r.name||'—'} | ${r.address||'(none)'} | ${r.purpose} | **${r.status}** | ${r.decision} | ${r.emailType==='none'?'—':r.emailFile||'—'} | ${r.quoteFile||'—'} | ${r.followFile||'—'} | ${(r.flags||[]).join(', ')||'—'} |`).join('\n')+'\n\n'+
    '_Human approval required on every draft. No email/invoice is sent. No payment is connected._\n';
  fs.writeFileSync(path.join(out,'email-index.md'), md);
  index.forEach(r=>console.log(`[${r.status}] ${r.enquiry_id} ${r.name||'—'} | email:${r.emailType} ${r.quoteFile?'| quote':''} ${r.followFile?'| follow-up':''}`));
  console.log('[index] '+path.join(out,'email-index.md'));
}

if(require.main===module) main();
module.exports = { selectDrafts, emailTypeByPurpose, buildEmail, quoteDraft, latestDecision, checksLine };
