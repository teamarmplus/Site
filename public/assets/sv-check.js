/* SiteVerdict — Site Check Engine (Package 99C)
   Public Site Check story + Professional Review flow.
   All 16 government APIs preserved.
   No public scoring widgets or report gate (retired); scoring kept internal-only.
   Scoring functions retained as internal-only logic (not shown publicly).
*/

// ── URL PARAM AUTO-FILL ──────────────────────────────
(function(){
  try{
    var p=new URLSearchParams(window.location.search).get('addr');
    if(p){var el=document.getElementById('addr');if(el){el.value=p;setTimeout(function(){runCheck();},120);}}
  }catch(e){}
})();

// ── OPPORTUNITY INTELLIGENCE (INTERNAL NOTE — NOT PUBLIC UI) ─────────
// High-value sites (score >= 80, n >= 4, or large/complex block) should
// be stored as SiteVerdict Opportunity Intelligence for internal use only.
// DO NOT label these as 'buy list', 'investment advice', or 'land banking'.
// DO NOT publish them as public recommendations.
// These are planning-intelligence records, not financial opinions.
// Use only to support professional referrals and lender-ready report requests.
// ─────────────────────────────────────────────────────────────────────────

// ── REPORT GATE ──────────────────────────────────────
// ── REPORT GATE (retired from public flow in 99C) ────
// The free-report gate is intentionally disabled. The public Site Check is not gated.
function gateUsed(){return 0;}
function gateIncrement(){/* no-op: public Site Check is not gated in 99C */}
function gateIsFree(){return true;}

// ── REGISTRATION MODAL (retired in 99C) ──────────────
// The register/free-report modal is removed from the public flow.
// These are kept as harmless no-ops in case of any stray reference.
function openRegModal(reason){ /* retired in 99C — public flow uses Professional Review page */ }
function goFocusBlock(){var b=document.getElementById("block");if(b)b.focus();}
function closeRegModal(){ /* retired in 99C */ }

// ── REPORT GATE ──────────────────────────────────────────────────
// First report free via localStorage. After that, show registration CTA.
// No Supabase/Stripe yet — localStorage MVP.
function buildReportGate(){
  if(gateIsFree()){
    gateIncrement();
    return '';
  }
  return ''
  +'</div>';
}


// ── SAFE FETCH HELPERS (fail-safe API calls) ─────────────────────
async function safeJson(url, fallback){
  try{
    var res=await fetch(url);
    if(!res.ok) throw new Error("HTTP "+res.status+" for "+url);
    return await res.json();
  }catch(err){
    console.warn("API failed:",url,err);
    return fallback||{features:[]};
  }
}
async function safeFunctionJson(url, fallback){
  try{
    var res=await fetch(url);
    if(!res.ok) throw new Error("Function HTTP "+res.status+" for "+url);
    return await res.json();
  }catch(err){
    console.warn("Function failed:",url,err);
    return fallback||{};
  }
}

// ── API ENGINE (preserved) ──────────────────────────
function chatPro(){window.location.href="/professional-review.html"}var MF={R1:12,R2:12,R3:9,R4:9,RU1:50,RU2:50,RU4:2e3},CD={ALBURY:{days:63,range:"53-63",n:3},BATHURST:{days:43,range:"33-73",n:3},BLACKTOWN:{days:153,range:"40-399",n:12},BYRON:{days:189,range:"14-393",n:6},CAMDEN:{days:45,range:"2-375",n:12},CAMPBELLTOWN:{days:109,range:"109-329",n:3},"CANADA BAY":{days:206,range:"127-557",n:5},CANTERBURY:{days:49,range:"5-448",n:62},BANKSTOWN:{days:49,range:"5-448",n:62},"CENTRAL COAST":{days:89,range:"21-165",n:8},CESSNOCK:{days:85,range:"50-110",n:3},"COFFS HARBOUR":{days:73,range:"65-168",n:3},CUMBERLAND:{days:186,range:"48-361",n:8},FAIRFIELD:{days:177,range:"136-177",n:2},GOULBURN:{days:122,range:"15-292",n:6},"INNER WEST":{days:119,range:"54-166",n:9},"LAKE MACQUARIE":{days:131,range:"41-474",n:15},LIVERPOOL:{days:314,range:"71-425",n:14},MAITLAND:{days:23,range:"18-85",n:4},NEWCASTLE:{days:122,range:"73-360",n:11},"NORTH SYDNEY":{days:279,range:"194-279",n:2},"NORTHERN BEACHES":{days:160,range:"90-173",n:3},PARRAMATTA:{days:133,range:"2-243",n:24},PENRITH:{days:204,range:"74-386",n:9},"PORT MACQUARIE":{days:281,range:"97-281",n:2},"PORT STEPHENS":{days:85,range:"1-92",n:3},RYDE:{days:86,range:"5-86",n:4},SHELLHARBOUR:{days:71,range:"7-392",n:8},SHOALHAVEN:{days:108,range:"3-171",n:6},SUTHERLAND:{days:118,range:"35-315",n:28},"THE HILLS":{days:148,range:"70-199",n:9},WAVERLEY:{days:332,range:"132-332",n:2},WOLLONDILLY:{days:480,range:"175-480",n:2},WOLLONGONG:{days:70,range:"15-233",n:12},WOOLLAHRA:{days:232,range:"208-232",n:2}};
// ── KNOWN COUNCILS REGISTRY ─────────────────────────────────────
// Separates council identification from DA timeline data coverage.
// councilKnown:true means the council can be named from NSW Planning Portal data.
// daTimelineCoverage:false means DA timeline data is not yet in SiteVerdict.
// A council can be known but have no DA timeline coverage — these are different states.
var KC={
  FEDERATION:       {displayName:'Federation Council',        daTimelineCoverage:false},
  COROWA:           {displayName:'Federation Council',        daTimelineCoverage:false},
  ALBURY:           {displayName:'Albury City Council',       daTimelineCoverage:true},
  ARMIDALE:         {displayName:'Armidale Regional',         daTimelineCoverage:false},
  BALLINA:          {displayName:'Ballina Shire',             daTimelineCoverage:false},
  BATHURST:         {displayName:'Bathurst Regional',         daTimelineCoverage:true},
  BLACKTOWN:        {displayName:'Blacktown City',            daTimelineCoverage:true},
  BLUE_MOUNTAINS:   {displayName:'Blue Mountains City',       daTimelineCoverage:false},
  BYRON:            {displayName:'Byron Shire',               daTimelineCoverage:true},
  CAMDEN:           {displayName:'Camden Council',            daTimelineCoverage:true},
  CAMPBELLTOWN:     {displayName:'Campbelltown City',         daTimelineCoverage:true},
  'CANADA BAY':     {displayName:'Canada Bay Council',        daTimelineCoverage:true},
  CANTERBURY:       {displayName:'Canterbury-Bankstown',      daTimelineCoverage:true},
  BANKSTOWN:        {displayName:'Canterbury-Bankstown',      daTimelineCoverage:true},
  'CENTRAL COAST':  {displayName:'Central Coast Council',     daTimelineCoverage:true},
  CESSNOCK:         {displayName:'Cessnock City',             daTimelineCoverage:true},
  'COFFS HARBOUR':  {displayName:'Coffs Harbour City',        daTimelineCoverage:true},
  CUMBERLAND:       {displayName:'Cumberland Council',        daTimelineCoverage:true},
  DUBBO:            {displayName:'Dubbo Regional',            daTimelineCoverage:false},
  FAIRFIELD:        {displayName:'Fairfield City',            daTimelineCoverage:true},
  GOULBURN:         {displayName:'Goulburn Mulwaree',         daTimelineCoverage:true},
  'INNER WEST':     {displayName:'Inner West Council',        daTimelineCoverage:true},
  'LAKE MACQUARIE': {displayName:'Lake Macquarie City',       daTimelineCoverage:true},
  LIVERPOOL:        {displayName:'Liverpool City',            daTimelineCoverage:true},
  MAITLAND:         {displayName:'Maitland City',             daTimelineCoverage:true},
  MOREE:            {displayName:'Moree Plains Shire',        daTimelineCoverage:false},
  MURRAY:           {displayName:'Murray River Council',      daTimelineCoverage:false},
  MURRUMBIDGEE:     {displayName:'Murrumbidgee Council',      daTimelineCoverage:false},
  NEWCASTLE:        {displayName:'Newcastle City',            daTimelineCoverage:true},
  'NORTH SYDNEY':   {displayName:'North Sydney Council',      daTimelineCoverage:true},
  'NORTHERN BEACHES':{displayName:'Northern Beaches Council', daTimelineCoverage:true},
  ORANGE:           {displayName:'Orange City',               daTimelineCoverage:false},
  PARRAMATTA:       {displayName:'City of Parramatta',        daTimelineCoverage:true},
  PENRITH:          {displayName:'Penrith City',              daTimelineCoverage:true},
  'PORT MACQUARIE': {displayName:'Port Macquarie-Hastings',   daTimelineCoverage:true},
  'PORT STEPHENS':  {displayName:'Port Stephens Council',     daTimelineCoverage:true},
  QUEANBEYAN:       {displayName:'Queanbeyan-Palerang',       daTimelineCoverage:false},
  RYDE:             {displayName:'City of Ryde',              daTimelineCoverage:true},
  SHELLHARBOUR:     {displayName:'Shellharbour City',         daTimelineCoverage:true},
  SHOALHAVEN:       {displayName:'Shoalhaven City',           daTimelineCoverage:true},
  SUTHERLAND:       {displayName:'Sutherland Shire',          daTimelineCoverage:true},
  TAMWORTH:         {displayName:'Tamworth Regional',         daTimelineCoverage:false},
  'THE HILLS':      {displayName:'The Hills Shire',           daTimelineCoverage:true},
  WAGGA:            {displayName:'Wagga Wagga City',          daTimelineCoverage:false},
  WAVERLEY:         {displayName:'Waverley Council',          daTimelineCoverage:true},
  WOLLONDILLY:      {displayName:'Wollondilly Shire',         daTimelineCoverage:true},
  WOLLONGONG:       {displayName:'Wollongong City',           daTimelineCoverage:true},
  WOOLLAHRA:        {displayName:'Woollahra Municipal',       daTimelineCoverage:true}
};
function gc(e,suburbHint,postcodeHint){if(!e)return null;var t=e.toUpperCase().replace(/\bCITY COUNCIL\b/g,"").replace(/\bSHIRE COUNCIL\b/g,"").replace(/\bMUNICIPAL COUNCIL\b/g,"").replace(/\bREGIONAL COUNCIL\b/g,"").replace(/\bCOUNCIL\b/g,"").replace(/\bCITY\b/g,"").replace(/\bSHIRE\b/g,"").replace(/\bMUNICIPAL\b/g,"").replace(/\bREGIONAL\b/g,"").replace(/\bOF\b/g,"").replace(/\s+/g," ").trim();if(CD[t])return{name:t,data:CD[t],councilKnown:true,daTimelineCoverage:true,councilSource:"planning-portal"};for(var a in CD)if(t.indexOf(a)>-1||a.indexOf(t)>-1)return{name:a,data:CD[a],councilKnown:true,daTimelineCoverage:true,councilSource:"planning-portal"};if(KC[t])return{name:KC[t].displayName||t,data:null,councilKnown:true,daTimelineCoverage:KC[t].daTimelineCoverage,councilSource:"planning-portal"};for(var b in KC){if(t.indexOf(b)>-1||b.indexOf(t)>-1)return{name:KC[b].displayName||b,data:null,councilKnown:true,daTimelineCoverage:KC[b].daTimelineCoverage,councilSource:"planning-portal"};}var sbFb=gcSuburb(suburbHint||e,postcodeHint);if(sbFb)return sbFb;return{name:e,data:null,councilKnown:false,daTimelineCoverage:false,councilSource:"unknown"}}function calcLots(e,t,a,r){if(!a||a<=0)return 0;var s=Math.floor(e/a);return!t||t<3?s:Math.max(0,Math.min(s,Math.floor(t/(MF[r]||12))))}function getSig(e,t,a){if(e<2)return"r";var r=(e>=4?3:e>=3?2:1)+(t<=90?3:t<=150?2:1)+(a>=80?3:a>=70?2:1);return r>=7?"g":r>=4?"a":"r"}function setSt(e){document.getElementById("status").textContent=e;}
// ── SHARED GEOCODING ─────────────────────────────────────────────
// Used by both autoLookupBlock() and runCheck() so coordinates match.
// ── ADDRESS CLEANING UTILITIES ───────────────────────────────────
// ── CLIENT-SIDE ADDRESS INPUT NORMALISER ────────────────────────
// Cleans messy user input before sending to geocode function.
// Tolerates: lowercase, missing NSW/spaces, partial suburb names, extra commas.
function normalizeAddressInput(s){
  if(!s) return s;
  s = s.trim();
  // Add space before trailing 4-digit postcode if missing: "Heights2166" -> "Heights 2166"
  s = s.replace(/([A-Za-z])(\d{4})$/, '$1 $2');
  // Normalise multiple commas/spaces
  s = s.replace(/,{2,}/g, ',').replace(/[ \t]{2,}/g, ' ');
  // Title-case each word (split/map avoids control-char regex issues)
  s = s.split(' ').map(function(w){
    return w.length ? w[0].toUpperCase() + w.slice(1) : w;
  }).join(' ');
  // Re-standardise NSW casing
  s = s.replace(/Nsw(?=\s|$)/g, 'NSW');
  // Add NSW if no state present but a 4-digit postcode exists
  if(s.indexOf('NSW') === -1 && !/VIC|QLD|SA|WA|TAS|NT|ACT/i.test(s) && /\d{4}/.test(s)){
    s = s.replace(/(\d{4})(\s*)$/, 'NSW $1');
  }
  return s.trim();
}
function cleanAddressForGeocode(addr){
  if(!addr) return addr;
  var s = addr.trim();
  // Preserve Lot addresses — do NOT strip Lot prefix (Lot 109 ≠ house number 109)
  var _isLotAddr = /^(lot|proposed\s+lot)\s+\d+/i.test(s);
  if(!_isLotAddr){
    // Remove unit/apt prefix only (not lot): "U4/20", "Unit 4/20", "Apt 3/"
    s = s.replace(/^(unit|apt|apartment|flat|shop|suite|level|loft)\s*[\d\w]+[\/\-]\s*/i,'');
    // Remove leading "U4/" or "4/" (but not Lot/)
    s = s.replace(/^\w{0,3}\d+[\/]/i,'');
  }
  // Normalise range addresses like "39-45" → use first number only
  s = s.replace(/^(\d+)-\d+\s/,'$1 ');
  // Expand common street-type abbreviations
  s = s.replace(/\bSt\b(?!\s*[A-Z]{3})/g,'Street')
       .replace(/\bAve\b/g,'Avenue')
       .replace(/\bRd\b/g,'Road')
       .replace(/\bDr\b/g,'Drive')
       .replace(/\bCr\b/g,'Crescent')
       .replace(/\bCres\b/g,'Crescent')
       .replace(/\bBvd\b/g,'Boulevard')
       .replace(/\bPde\b/g,'Parade')
       .replace(/\bCl\b/g,'Close')
       .replace(/\bPl\b/g,'Place')
       .replace(/\bCt\b/g,'Court')
       .replace(/\bHwy\b/g,'Highway')
       .replace(/\bLn\b/g,'Lane');
  // Remove excess whitespace
  s = s.replace(/\s{2,}/g,' ').trim();
  return s;
}

// Extract parts for Nominatim structured geocoding
function extractAddressParts(addr){
  var s = cleanAddressForGeocode(addr.trim());
  // Match "NUMBER STREET_NAME, SUBURB NSW POSTCODE" or without comma
  var m = s.match(/^(\d+[-\d]*)\s+([^,]+?)(?:,\s*|\s{2,})([A-Za-z][A-Za-z\s]+?)(?:\s+NSW)?(?:\s+(\d{4}))?\s*$/i);
  if(!m) {
    // Try looser: number + rest, suburb after comma
    var m2 = s.match(/^(\d+)\s+(.+?),\s*([A-Za-z][A-Za-z\s]+?)(?:\s+NSW)?(?:\s+(\d{4}))?\s*$/i);
    if(m2) m = m2;
  }
  if(!m) return null;
  return {
    number: m[1].replace(/-\d+$/,''), // range → first num
    streetName: m[2].trim(),
    suburb: m[3].trim(),
    postcode: m[4]||''
  };
}
function extractSuburbPostcode(addr){
  // Extract suburb and postcode from address for fallback geocoding
  var parts = addr.split(',');
  if(parts.length >= 2){
    // Last meaningful part often has suburb, state, postcode
    var last = parts[parts.length-1].trim();
    var prev = parts[parts.length-2].trim();
    // Try "Suburb NSW NNNN" or just "Suburb"
    var m = (last+' '+prev).match(/([A-Za-z\s]+NSW\s*\d{4})/i);
    if(m) return m[1].trim();
    var m2 = addr.match(/([A-Za-z\s]+NSW\s*\d{4})/i);
    if(m2) return m2[1].trim();
    // Try suburb only
    var m3 = addr.match(/,\s*([A-Za-z\s]+?)(?:,|\s+NSW|\s+\d{4}|$)/i);
    if(m3) return m3[1].trim() + ' NSW';
  }
  return null;
}


// ── ADDRESS TYPE DETECTION ──────────────────────────────────────
// Returns: 'lot' | 'range' | 'unit' | 'normal'
function detectAddressType(addr){
  var s = addr.trim();
  if(/^(lot|proposed\s+lot|lot\s*\d+\s+dp)\s+\d+/i.test(s)) return 'lot';
  if(/^\d+\s*-\s*\d+\s+/i.test(s)) return 'range';
  if(/^(unit|apt|flat|u)\s*\d+\/\d+/i.test(s)) return 'unit';
  // Street-only: has no leading house number (but has a suburb/state/postcode)
  if(!/^\d/.test(s) && /[A-Za-z]+\s+(?:NSW|VIC|QLD|SA|WA|TAS|NT|ACT)/i.test(s)) return 'street-only';
  return 'normal';
}

// ── SUBURB → COUNCIL FALLBACK ────────────────────────────────────
// Used when LGA_NAME is missing from NSW Planning Portal (regional/lot addresses)
var SC = {
  'AUSTRAL':           {name:'Liverpool City Council',              postcode:'2179'},
  'CASULA':            {name:'Liverpool City Council',              postcode:'2170'},
  'MOOREBANK':         {name:'Liverpool City Council',              postcode:'2170'},
  'WATTLE GROVE':      {name:'Liverpool City Council',              postcode:'2173'},
  'LEPPINGTON':        {name:'Camden Council',                      postcode:'2171'},
  'EDMONDSON PARK':    {name:'Liverpool City Council',              postcode:'2174'},
  'PANANIA':           {name:'Canterbury-Bankstown Council',        postcode:'2213'},
  'BANKSTOWN':         {name:'Canterbury-Bankstown Council',        postcode:'2200'},
  'CAMPSIE':           {name:'Canterbury-Bankstown Council',        postcode:'2194'},
  'LAKEMBA':           {name:'Canterbury-Bankstown Council',        postcode:'2195'},
  'CONDELL PARK':      {name:'Canterbury-Bankstown Council',        postcode:'2200'},
  'HOWLONG':           {name:'Federation Council',                  postcode:'2643'},
  'COROWA':            {name:'Federation Council',                  postcode:'2646'},
  'WAGGA WAGGA':       {name:'Wagga Wagga City Council',            postcode:'2650'},
  'TAMWORTH':          {name:'Tamworth Regional Council',           postcode:'2340'},
  'ORANGE':            {name:'Orange City Council',                 postcode:'2800'},
  'DUBBO':             {name:'Dubbo Regional Council',              postcode:'2830'},
  'GOULBURN':          {name:'Goulburn Mulwaree Council',           postcode:'2580'},
  'CESSNOCK':          {name:'Cessnock City Council',               postcode:'2325'},
  'MAITLAND':          {name:'Maitland City Council',               postcode:'2320'},
  'PENRITH':           {name:'Penrith City Council',                postcode:'2750'},
  'PARRAMATTA':        {name:'City of Parramatta',                  postcode:'2150'},
  'LIVERPOOL':         {name:'Liverpool City Council',              postcode:'2170'},
  'CAMPBELLTOWN':      {name:'Campbelltown City Council',           postcode:'2560'},
  'WOLLONGONG':        {name:'Wollongong City Council',             postcode:'2500'},
  'NEWCASTLE':         {name:'Newcastle City Council',              postcode:'2300'},
  'GOSFORD':           {name:'Central Coast Council',               postcode:'2250'},
  'WYONG':             {name:'Central Coast Council',               postcode:'2259'},
  'BLACKTOWN':         {name:'Blacktown City Council',              postcode:'2148'},
  'SEVEN HILLS':       {name:'Blacktown City Council',              postcode:'2147'},
  'WINDSOR':           {name:'Hawkesbury City Council',             postcode:'2756'},
  'RICHMOND':          {name:'Hawkesbury City Council',             postcode:'2753'},
  // Fairfield LGA
  'CANLEY HEIGHTS':    {name:'Fairfield City Council',              postcode:'2166'},
  'CANLEY VALE':       {name:'Fairfield City Council',              postcode:'2166'},
  'CABRAMATTA':        {name:'Fairfield City Council',              postcode:'2166'},
  'CABRAMATTA WEST':   {name:'Fairfield City Council',              postcode:'2166'},
  'FAIRFIELD':         {name:'Fairfield City Council',              postcode:'2165'},
  'FAIRFIELD EAST':    {name:'Fairfield City Council',              postcode:'2165'},
  'FAIRFIELD WEST':    {name:'Fairfield City Council',              postcode:'2165'},
  'FAIRFIELD HEIGHTS': {name:'Fairfield City Council',              postcode:'2165'},
  'BONNYRIGG':         {name:'Fairfield City Council',              postcode:'2177'},
  'EDENSOR PARK':      {name:'Fairfield City Council',              postcode:'2176'},
  'SMITHFIELD':        {name:'Fairfield City Council',              postcode:'2164'},
  'WETHERILL PARK':    {name:'Fairfield City Council',              postcode:'2164'}
};

// Lookup suburb in SC, optionally filter by postcode
function gcSuburb(suburb, postcode){
  if(!suburb) return null;
  var key = suburb.toUpperCase().trim();
  if(SC[key]){
    if(postcode && SC[key].postcode && SC[key].postcode !== postcode) return null;
    return {name: SC[key].name, data: null, councilKnown: true, daTimelineCoverage: false,
            councilSource: 'suburb-postcode-fallback'};
  }
  return null;
}



function _showAddrNotFound(resultEl, n, addr, reason){
  var prHref = "/professional-review.html?addr=" + encodeURIComponent(addr);
  resultEl.innerHTML = [
    "<div style=\"max-width:620px;margin:0 auto;padding:24px;background:var(--bg2);border:1px solid var(--border);border-radius:16px\">",
    "  <div style=\"font-size:.72rem;color:var(--amber);margin-bottom:8px\">&#9888; Address not matched</div>",
    "  <div style=\"font-size:.84rem;font-weight:500;margin-bottom:10px\">" + addr + " could not be matched in NSW address data.</div>",
    "  <div style=\"font-size:.74rem;color:var(--muted);line-height:1.8;margin-bottom:10px\">If address lookup is temporarily unavailable, try again shortly. Otherwise:</div>",
    "  <ul style=\"font-size:.72rem;color:var(--muted);line-height:2;margin-bottom:14px;padding-left:18px\">",
    "    <li>Include full street number, street name, suburb, NSW and postcode</li>",
    "    <li>Messy or abbreviated addresses (e.g. canley heigh,2166) are automatically cleaned — try once more after a small correction</li>",
    "    <li>For Lot addresses (e.g. Lot 109), include suburb and postcode</li>",
    "    <li>For range addresses (e.g. 39-45), the first number is used automatically</li>",
    "    <li>Enter block size manually below to still get a limited site report</li>",
    "  </ul>",
    "  <div style=\"display:flex;gap:10px;flex-wrap:wrap\">",
    "    <button class=\"btn btn-gold\" onclick=\"document.getElementById('addr').focus()\">Try a different address</button>",
    "    <a href=\"" + prHref + "\" class=\"btn btn-outline\" style=\"text-decoration:none\">Request a Professional Review</a>",
    "  </div>",
    "</div>"
  ].join("");
  resultEl.classList.add("show");
  // QA record for testing
  window._svLastQA = {
    build:              "sitecheck-expanded-report-2026-05-22",
    reportGenerated:    false,
    fakeAddressRejected:true,
    reason:             "Address not matched",
    enteredAddress:     addr||"",
    matchedAddress:     null,
    zoneCode:           null,
    overallResult:      "Address not matched"
  };
  setSt("");
  n.disabled = false;
  n.textContent = "Check this property \u2192";
}

async function geocodeWithConfidence(addr){
  // Try server-side geocode first (stronger, no CORS issues, Google API if configured)
  try {
    var res;
    try { res = await fetch('/.netlify/functions/geocode?address=' + encodeURIComponent(addr)); }
    catch(_net){ await new Promise(function(r){setTimeout(r,400);}); res = await fetch('/.netlify/functions/geocode?address=' + encodeURIComponent(addr)); }
    if (res.ok) {
      var data = await res.json();
      if (data.found === false) {
        // Server returned found:false (still 200 OK) — pass the reason back
        return { found: false, reason: data.reason||null, addressQuality: data.addressQuality||'failed', attempted: data.attempted||addr };
      }
      if (data.found) {
        console.log('Geocode (server):', data.source, data.lat, data.lon, data.matchedAddr);
        return {
          lat: data.lat,
          lon: data.lon,
          raw: { display_name: data.matchedAddr || addr },
          source: data.source,
          confidence: data.confidence,
          matchedAddr: data.matchedAddr,
          council: data.council || '',
          postcode: data.postcode || '',
          locationType: data.locationType || '',
          placeId: data.placeId || '',
          paidApiUsed: data.paidApiUsed || false,
          isLotAddress: data.isLotAddress || false,
          lotWarning: data.lotWarning || null,
          numberWarning: data.numberWarning || null,
          addressQuality: data.addressQuality || '',
          found: data.found !== false,
          reason: data.reason || null
        };
      }
    } else {
      // Server returned found:false — pass reason and quality back to caller
      if(data && data.found === false){
        return { found: false, reason: data.reason||null, addressQuality: data.addressQuality||'failed', attempted: data.attempted||addr };
      }
    }
  } catch(e) {
    console.warn('Server geocode failed, falling back to browser:', e);
  }

  // Browser-side fallback (if server function unavailable)
  // Uses same strict validation as server: streetMatch + pcOk required.
  // Suburb fallback removed — fake addresses must not produce usable results.
  var nom     = 'https://nominatim.openstreetmap.org/search?format=json&limit=3&accept-language=en';
  var cleaned = cleanAddressForGeocode(addr);
  var parts   = extractAddressParts(addr);
  var suburb  = extractSuburbPostcode(addr);
  var _bInputPc = (addr.match(/\b(\d{4})\b/) || [])[1] || null;
  var _isLotBr  = /^(lot|proposed\s+lot)\s+\d+/i.test(addr.trim());

  function inNSW(lat, lon) {
    return lat >= -37.6 && lat <= -28.5 && lon >= 140.9 && lon <= 153.7;
  }

  // Lot addresses: suburb fallback allowed, clearly marked Needs review
  if (_isLotBr && suburb) {
    try {
      var lotR = await fetch(nom + '&q=' + encodeURIComponent(suburb + ' NSW Australia'));
      var lotJ = await lotR.json();
      if (lotJ && lotJ.length) {
        var lh = lotJ[0];
        var llat = parseFloat(lh.lat), llon = parseFloat(lh.lon);
        if (inNSW(llat, llon)) {
          return { lat: llat, lon: llon, raw: lh, source: 'Nominatim (Lot suburb fallback)',
                   confidence: 'Needs review', addressQuality: 'suburb_only',
                   isLotAddress: true, found: true,
                   lotWarning: 'Lot-based address: placed at suburb centre. Verify via NSW Land Registry.' };
        }
      }
    } catch(e) { console.warn('Lot browser fallback failed:', e); }
  }

  if (!parts) return { found: false, reason: 'Address not matched.', addressQuality: 'failed' };

  var nomStrategies = [
    { structured: true, street: parts.number + ' ' + parts.streetName,
      city: parts.suburb, postcode: parts.postcode, conf: 'Estimated', label: 'Structured' },
    { q: cleaned + ' NSW Australia', conf: 'Estimated', label: 'Cleaned+NSW' },
  ].filter(Boolean);

  for (var bi = 0; bi < nomStrategies.length; bi++) {
    var bs = nomStrategies[bi];
    try {
      var burl;
      if (bs.structured) {
        burl = nom + '&street=' + encodeURIComponent(bs.street)
          + '&city=' + encodeURIComponent(bs.city)
          + (bs.postcode ? '&postalcode=' + encodeURIComponent(bs.postcode) : '')
          + '&country=AU';
      } else {
        burl = nom + '&q=' + encodeURIComponent(bs.q);
      }
      var br = await fetch(burl);
      var bj = await br.json();
      if (bj && bj.length) {
        for (var bk = 0; bk < bj.length; bk++) {
          var bhit = bj[bk];
          var blat = parseFloat(bhit.lat), blon = parseFloat(bhit.lon);
          if (!inNSW(blat, blon)) continue;
          // Street name must appear in result
          var bDisp = (bhit.display_name || '').toLowerCase();
          var bStreet = parts.streetName.toLowerCase();
          var bWords = bStreet.split(/\s+/).filter(function(w){ return w.length > 3; });
          var bMatch = bWords.length === 0 || bWords.some(function(w){ return bDisp.indexOf(w) !== -1; });
          // Postcode must match if input had one
          var bResPc = bhit.address ? bhit.address.postcode : null;
          var bPcOk  = !_bInputPc || !bResPc || _bInputPc === bResPc;
          if (!bMatch || !bPcOk) continue;
          console.log('Geocode (browser):', bs.label, blat, blon, bhit.display_name);
          return { lat: blat, lon: blon, raw: bhit, source: 'Nominatim (' + bs.label + ')',
                   confidence: bs.conf, addressQuality: 'interpolated', found: true };
        }
      }
    } catch(e) { console.warn('Geocode strategy (' + bs.label + ') failed:', e); }
  }
  return { found: false, reason: 'Address could not be confidently matched.', addressQuality: 'failed' };
}



// Keep original geocodeAddress as thin wrapper for autoLookupBlock compatibility
async function geocodeAddress(addr){
  var r = await geocodeWithConfidence(addr);
  if(!r) return null;
  return { lat: r.lat, lon: r.lon, raw: r.raw };
}

async function autoLookupBlock(){
  var addr=document.getElementById("addr").value.trim();
  var statusEl=document.getElementById("block-lookup-status");
  var btn=document.getElementById("auto-lookup-btn");
  if(!addr){setSt("Enter your address first, then click auto-detect.");return;}
  statusEl.textContent="Looking up...";
  btn.style.display="none";
  try{
    console.log("Auto-detect address:",addr);
    var geo=await geocodeAddress(addr);
    console.log("Auto-detect geocode:",geo);
    if(!geo){
      statusEl.innerHTML='<span style="color:var(--amber)">Address not found — include suburb and postcode, or enter block size manually</span>';
      btn.style.display="";
      return;
    }
    var lat=geo.lat,lon=geo.lon;
    console.log("Auto-detect lat/lon:",lat,lon);
    var mx=lon*20037508.34/180;
    var my=Math.log(Math.tan((90+lat)*Math.PI/360))/(Math.PI/180)*20037508.34/180;
    console.log("Auto-detect mx/my:",mx,my);
    var cadUrl="/.netlify/functions/cadastre?mx="+mx+"&my="+my;
    console.log("Auto-detect cadastre URL:",cadUrl);
    var cadRes=await fetch(cadUrl);
    var cadData=await cadRes.json();
    console.log("Auto-detect cadastre response:",cadData);
    // Store parcel quality from cadastre for use in main runCheck
    window._parcelConfidence = cadData.parcelConfidence || null;
    window._parcelWarning    = cadData.parcelWarning    || null;
    var features=cadData.features||[];
    // If no features at exact point, cadastre.js already tries buffer 5m and 15m internally
    if(!features.length){
      statusEl.innerHTML='<span style="color:var(--muted)">Parcel not found — enter block size manually or check <a href="https://www.valuergeneral.nsw.gov.au" target="_blank" style="color:var(--gold)">valuergeneral.nsw.gov.au</a></span>';
      btn.style.display="";
      return;
    }
    var candidates=[];
    // Log all features for staging debugging
    console.log("Cadastre all features:", cadData.features);
    features.forEach(function(feat){
      var a=feat.attributes||{};
      console.log("Cadastre parcel:", a.lotidstring||"?", "planlotarea:", a.planlotarea, "shape_Area:", a.shape_Area);
    });

    // ── PARCEL SELECTION LOGIC ────────────────────────────────
    // planlotarea = official registered title area (most reliable)
    // shape_Area  = GIS polygon area (unreliable: includes roads/reserves)
    // Strategy: prefer planlotarea; pick smallest plausible residential lot.

    function parseLotArea(a){
      var pla=parseFloat(a.planlotarea)||parseFloat(a.PLANLOTAREA)||parseFloat(a.lotarea)||parseFloat(a.LOTAREA)||0;
      var units=(a.planlotareaunits||a.PLANLOTAREAUNITS||"").toUpperCase();
      if(pla>0){if(units==="H"||units==="HA")pla*=10000;return{area:pla,source:"planlotarea"};}
      return null;
    }
    function parseShapeArea(a){
      var sa=parseFloat(a.shape_Area)||parseFloat(a.SHAPE_AREA)||parseFloat(a.Shape__Area)||parseFloat(a.Shape_Area)||parseFloat(a["st_area_shape__"])||0;
      return sa>0?{area:sa,source:"shape_Area"}:null;
    }

    // Pass 1: prefer planlotarea (registered title area)
    var plaPool=[];
    features.forEach(function(feat){
      var a=feat.attributes||{};
      var r=parseLotArea(a);
      if(r&&r.area>=50&&r.area<=100000)plaPool.push({area:Math.round(r.area),lot:a.lotidstring||a.LOTIDSTRING||"",source:"planlotarea"});
    });
    console.log("Auto-detect planlotarea pool:", plaPool);

    // Pass 2: fall back to shape_Area only if no planlotarea at all
    var shapePool=[];
    if(!plaPool.length){
      features.forEach(function(feat){
        var a=feat.attributes||{};
        var r=parseShapeArea(a);
        if(r&&r.area>=50&&r.area<=100000)shapePool.push({area:Math.round(r.area),lot:a.lotidstring||a.LOTIDSTRING||"",source:"shape_Area"});
      });
      console.log("Auto-detect shape_Area pool:", shapePool);
    }

    var pool=plaPool.length?plaPool:shapePool;
    console.log("Auto-detect final pool:", pool);

    if(!pool.length){
      var allAreas=[];
      features.forEach(function(feat){
        var a=feat.attributes||{};
        var r=parseLotArea(a)||parseShapeArea(a);
        if(r&&r.area>0)allAreas.push(Math.round(r.area));
      });
      var allLarge=allAreas.length>0&&allAreas.every(function(a){return a>5000;});
      statusEl.innerHTML='<span style="color:var(--muted)">'+( allLarge?"Cadastre found a large parent parcel only. Please enter block size manually.":"Cadastre found parcel but no reliable area — enter block size manually")+'</span>';
      btn.style.display="";
      return;
    }

    // Prefer smallest residential lot (100-2000m²); avoids parent parcels
    pool.sort(function(a,b){return a.area-b.area;});
    var residential=pool.filter(function(c){return c.area>=100&&c.area<=2000;});
    var best=residential.length?residential[0]:pool[0];

    if(best.area>5000){
      statusEl.innerHTML='<span style="color:var(--muted)">Cadastre returned an unusual parcel size ('+best.area+'m²). Please enter block size manually.</span>';
      btn.style.display="";
      console.log("Auto-detect: suspicious area, not auto-filled:", best.area);
      return;
    }

    // Store cadastre result separately — never overwrite user-entered value
    window._cadastreArea = best.area;
    window._cadastreLot  = best.lot || null;
    var existingEntry = parseFloat(document.getElementById("block").value);
    if(existingEntry && existingEntry >= 100){
      // User already entered a size — show cadastre alongside but do not overwrite
      statusEl.innerHTML="&#8505; NSW Cadastre detected "+best.area+"m²"+(best.lot?" ("+best.lot+")":"")+" · You have entered "+existingEntry+"m²"
        +'<span style="font-size:.62rem;color:var(--muted2);display:block;margin-top:2px">Your entered size will be used. Cadastre shown for comparison only.</span>';
    } else {
      // No user entry — fill in the cadastre value as a starting point
      document.getElementById("block").value=best.area;
      statusEl.innerHTML="&#10003; "+best.area+"m²"+(best.lot?" ("+best.lot+")":"")
        +' from NSW Cadastre &middot; <span style="font-size:.64rem;color:var(--muted2)">Approximate only &mdash; confirm with title/survey</span>'
;
    }

  }catch(e){
    console.error("Auto-detect failed:",e);
    statusEl.innerHTML='<span style="color:var(--muted)">Block size was not auto-detected. This check is limited. Enter block size manually or request a Professional Review.</span>';
    btn.style.display="";
  }
}
async function runCheck(){var e=normalizeAddressInput(document.getElementById("addr").value.trim()),t=parseFloat(document.getElementById("block").value),a=document.getElementById("front"),r=a&&a.value?parseFloat(a.value):NaN;
  // Land size + frontage are OPTIONAL. A user with only an address still gets the full
  // address-derived Site Check (zone, overlays, min-lot signal, nearby, parcel-needs-review).
  // Size/frontage, when provided, are treated as user-entered and only enrich the report.
  var _msg=document.getElementById("missing-fields-msg");
  if(_msg) _msg.style.display="none";
  if(e){var s=!t||t<100,n=document.getElementById("run-btn");n.disabled=!0,n.textContent="Checking...";var i=document.getElementById("result");i.innerHTML="",i.classList.remove("show");var o=document.getElementById("block-lookup-status");o&&(o.textContent="");if(window._loadingTimer){clearInterval(window._loadingTimer);window._loadingTimer=null;}var _geoResult=null;window._parcelConfidence=null;window._parcelWarning=null;window._cadastreArea=null;window._cadastreLot=null;window._resolvedParcel=null;setSt("Finding your address...");try{var _geoResult=await geocodeWithConfidence(e);var _geo=_geoResult;window._geoResult=_geoResult;
    if(!_geo){_showAddrNotFound(i,n,e);return;}
    // ── HARD GATE: invalid / fake address ─────────────────────────
    // If geocode returned found:false (even with a reason), stop here.
    // addressQuality:failed|suburb_only|route_only for normal street addr = no report.
    var _addrQuality = _geo.addressQuality || ((_geo.found===false) ? 'failed' : '');
    var _addrTypeEarly = detectAddressType(e);
    if(_geo.found===false){
      _showAddrNotFound(i,n,e,_geo.reason);
      return; // do not consume gate, do not query planning portal
    }
    // For normal addresses: reject suburb_only and route_only results
    if(_addrTypeEarly==='normal' && (_addrQuality==='suburb_only'||_addrQuality==='route_only'||_addrQuality==='approximate')){
      _showAddrNotFound(i,n,e,'Address matched suburb or route only — not specific enough for a planning check. Please enter a full street address.');
      return;
    }

    // ── GEOCODE QUALITY GATE ────────────────────────────────────
    // Address type detection
    var _addrType     = detectAddressType(e);   // 'lot'|'range'|'unit'|'normal'
    var _isRange      = _addrType === 'range';
    var _isLot        = _addrType === 'lot';
    // Extract suburb hint for council fallback
    var _suburbHint   = (function(){
      var _sp = extractSuburbPostcode(e);
      if(!_sp) return null;
      var _m = _sp.match(/^([A-Za-z][A-Za-z\s]+?)(?:\s+NSW)?(?:\s+\d{4})?\s*$/i);
      return _m ? _m[1].trim() : null;
    })();
    var _postcodeHint = (function(){
      var _m = e.match(/(\d{4})\s*$/);
      return _m ? _m[1] : null;
    })();
    // Lot number warning: Lot 109 ≠ house number 109
    var _lotNum = _isLot ? (e.match(/(?:lot|proposed\s+lot)\s+(\d+)/i)||[])[1] : null;
    // Detect street-level match (matched address doesn't start with a house number)
    var _matchedAddr = (_geo.matchedAddr||(_geo.raw&&_geo.raw.display_name)||'');
    var _isStreetLevel = !_matchedAddr.match(/^\d/) && !_matchedAddr.match(/,\s*\d+,/);
    // Detect source confidence
    var _geoIsGoogle = _geo.source&&_geo.source.indexOf('Google')>-1;
    var _geoIsSuburb = _geo.source&&(_geo.source.indexOf('fallback')>-1||_geo.source.indexOf('Suburb')>-1);
    // Overall address confidence level
    var _addrConfidence =
      _isLot        ? 'Needs review' :   // Lot addresses need cadastre to verify
      _geoIsSuburb  ? 'Needs review' :
      _isRange      ? 'Estimated' :
      _isStreetLevel && !_geoIsGoogle ? 'Estimated' :
      (_geo.confidence||'Estimated');
    // Set on _geoResult for use in rendering
    var _locationType  = _geo.locationType || '';
    var _paidApiUsed   = _geo.paidApiUsed || false;
    var _isLotGeocode  = _geo.isLotAddress || false;
    var _lotGeoWarn    = _isLot
      ? (_geo.lotWarning || 'Lot-based address detected. Lot number is not a street number. Verify lot/DP/title details before relying on parcel, zoning or planning conclusions.')
      : null;
    // For Google: ROOFTOP = exact; RANGE_INTERPOLATED = estimated; GEOMETRIC_CENTER/APPROXIMATE = suburb
    var _googleLocConf = _locationType==='ROOFTOP'?'Verified'
      :_locationType==='RANGE_INTERPOLATED'?'Estimated'
      :_locationType?'Needs review':'';
    // Recalculate addrConfidence using Google locationType when available
    if(_geoIsGoogle && _googleLocConf) _addrConfidence = _googleLocConf;
    // Street-only and lot-geocoded-by-suburb are always Needs review
    // Range and lot addresses: downgrade confidence regardless of Google locationType
    if(_isRange) _addrConfidence = 'Estimated';  // ROOFTOP may match first number only
    if(_isLot || _addrType==='street-only' || _isLotGeocode) _addrConfidence = 'Needs review';
    _geoResult.addrType      = _addrType;
    _geoResult.isRange       = _isRange;
    _geoResult.isLot         = _isLot;
    _geoResult.lotNum        = _lotNum;
    _geoResult.isStreetLevel = (_isStreetLevel && !_geoIsGoogle) || _addrType==='street-only';
    _geoResult.addrConfidence= _addrConfidence;
    _geoResult.suburbHint    = _suburbHint;
    _geoResult.postcodeHint  = _postcodeHint;
    _geoResult.locationType  = _locationType;
    _geoResult.paidApiUsed   = _paidApiUsed;
    _geoResult.lotGeoWarn    = _lotGeoWarn;
    if(_isLot||_isRange||(_isStreetLevel&&!_geoIsGoogle)){
      setSt('Address found — verifying parcel data…');
    }var _mAddr=(_geoResult&&_geoResult.matchedAddr)||'';var _mAddrU=_mAddr.toUpperCase();var _detState=(/\bNSW\b/.test(_mAddrU)||(/\b(1[0-9]{3}|2[0-9]{3})\b/.test(_mAddrU)&&!/\b(ACT|VIC|QLD|SA|WA|TAS|NT)\b/.test(_mAddrU)))?'NSW':/\bACT\b/.test(_mAddrU)?'ACT':/\bVIC\b/.test(_mAddrU)?'VIC':/\bQLD\b/.test(_mAddrU)?'QLD':/\bSA\b/.test(_mAddrU)?'SA':/\bTAS\b/.test(_mAddrU)?'TAS':/\bWA\b/.test(_mAddrU)?'WA':/\bNT\b/.test(_mAddrU)?'NT':'NSW';if(_detState!=='NSW'){_showNonNSWResult(e,_detState,_geoResult,t,r,_addrType);n.disabled=false;n.textContent='Check this property →';return;}var v=_geo.lat,u=_geo.lon,m=20037508.34*u/180,p=Math.log(Math.tan((90+v)*Math.PI/360))/(Math.PI/180)*20037508.34/180,g=encodeURIComponent(JSON.stringify({x:m,y:p,spatialReference:{wkid:102100}})),y="https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/Planning/Principal_Planning_Layers/MapServer";function ftx(u,_try){_try=_try||0;var c=new AbortController();var t=setTimeout(function(){c.abort();},9000);return fetch(u,{signal:c.signal}).then(function(r){clearTimeout(t);return r;}).catch(function(e){clearTimeout(t);if(_try<2){return new Promise(function(res){setTimeout(function(){res(ftx(u,_try+1));},400);});}return{json:function(){return Promise.resolve({features:[],_svTimeout:true});}};});}setSt("Checking zone, heritage, flood and overlays...");var[f,h,b,L,S,R,A,E,w,P,C,I]=await Promise.all([ftx(y+"/11/query?geometry="+g+"&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&outFields=LAY_CLASS,SYM_CODE,LGA_NAME&returnGeometry=false&f=json"),ftx(y+"/14/query?geometry="+g+"&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&outFields=LOT_SIZE&returnGeometry=false&f=json"),ftx(y+"/8/query?geometry="+g+"&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&outFields=H_NAME,H_ID,LEGIS_REF_CLAUSE&returnGeometry=false&f=json"),ftx(y+"/4/query?geometry="+g+"&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&outFields=FSR_MAX,LAY_CLASS&returnGeometry=false&f=json"),ftx(y+"/7/query?geometry="+g+"&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&outFields=HEIGHT_MAX,LAY_CLASS&returnGeometry=false&f=json"),ftx("https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/Planning/EPI_Flood_Planning_Area/MapServer/0/query?geometry="+g+"&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&outFields=*&returnGeometry=false&f=json"),ftx(y+"/16/query?geometry="+g+"&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&outFields=RESERVE_TYPE,LAY_CLASS&returnGeometry=false&f=json"),ftx(y+"/18/query?geometry="+g+"&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&outFields=LAY_CLASS&returnGeometry=false&f=json"),ftx(y+"/15/query?geometry="+g+"&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&outFields=LAY_CLASS,ACID_CLASS&returnGeometry=false&f=json").catch(()=>({json:()=>({features:[]})})),ftx(y+"/17/query?geometry="+g+"&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&outFields=LAY_CLASS&returnGeometry=false&f=json").catch(()=>({json:()=>({features:[]})})),ftx(y+"/13/query?geometry="+g+"&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&outFields=LAY_CLASS&returnGeometry=false&f=json").catch(()=>({json:()=>({features:[]})})),ftx("https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/Planning/Bush_Fire_Prone_Land/MapServer/0/query?geometry="+g+"&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&outFields=*&returnGeometry=false&f=json").catch(()=>({json:()=>({features:[]})}))]),[N,k,x,M,U,T,B,D,H,F,_,O]=await Promise.all([f.json(),h.json(),b.json(),L.json(),S.json(),R.json(),A.json(),E.json(),w.json(),P.json(),C.json(),I.json()]),j=B.features&&B.features.length?B.features[0].attributes.RESERVE_TYPE||B.features[0].attributes.LAY_CLASS||"Yes":null,z=D.features&&D.features.length>0,G=H.features&&H.features.length?H.features[0].attributes.ACID_CLASS||H.features[0].attributes.LAY_CLASS||"Yes":null,W=F.features&&F.features.length>0,q=_.features&&_.features.length>0,Y=O.features&&O.features.length>0,Z="",K="",V="";if(N.features&&N.features.length){var $=N.features[0].attributes;Z=$.SYM_CODE||"",K=$.LAY_CLASS||"",V=$.LGA_NAME||""}var XR={R1:450,R2:450,R3:400,R4:350,R5:2e3,R6:450},Q=!1,J=(XR[Z]!==undefined?XR[Z]:null);if(k.features&&k.features.length&&k.features[0].attributes.LOT_SIZE){var ee=k.features[0].attributes.LOT_SIZE;ee>=({R1:50,R2:50,R3:50,R4:50,R5:100,R6:100}[Z]||50)?(J=ee,Q=!0):(Q=!1,J=(XR[Z]!==undefined?XR[Z]:null),console.warn("Min lot size sanity fail: "+ee+"m² for zone "+Z+" — not confirmed"))}var te=["R1","R2","R3","R4","R5","R6","RU1","RU2","RU3","RU4","RU5","RU6","E4","E3","C4","UR","MU1","MU2","B4","SP1","SP2"].indexOf(Z)>-1,ae=null;if(x.features&&x.features.length){var re=x.features[0].attributes;ae={name:re.H_NAME,clause:re.LEGIS_REF_CLAUSE}}var se=M.features&&M.features.length?M.features[0].attributes.FSR_MAX||M.features[0].attributes.LAY_CLASS:null,ne=U.features&&U.features.length?U.features[0].attributes.HEIGHT_MAX||U.features[0].attributes.LAY_CLASS:null,ie=T.features&&T.features.length>0;setSt("Loading infrastructure and comparable projects...");var oe=gc(V,_geoResult&&_geoResult.suburbHint,_geoResult&&_geoResult.postcodeHint),le=(oe&&oe.name,fetch("/.netlify/functions/daleads?mode=comps&council="+encodeURIComponent(V||"")+"&lat="+v+"&lng="+u).catch(()=>null)),de=(function(){var _oc=new AbortController();var _ot=setTimeout(function(){_oc.abort();},9000);return fetch("/.netlify/functions/nearby?lat="+v+"&lng="+u,{signal:_oc.signal}).then(function(r){clearTimeout(_ot);return r;}).catch(function(){clearTimeout(_ot);return null;});})(),pr2=fetch("/.netlify/functions/parcel?lat="+v+"&lng="+u+(t>0?"&area="+t:"")+"&addr="+encodeURIComponent((_geoResult&&_geoResult.matchedAddr)||e)).then(function(r){return r.json();}).catch(function(){return null;});var[ce,ve]=await Promise.all([le,de]),ue=[];try{window._resolvedParcel=await pr2;}catch(e){window._resolvedParcel=null;}if(ce)try{var me=await ce.json();for(var pe of me.comps||[])if(ue.push({addr:pe.address||"",lots:pe.lots||2,cost:pe.cost||0,days:pe.days||0}),ue.length>=3)break}catch(e){console.warn("DA Leads comps parse failed",e);ue=[];}var ge={transport:[],health:[],shopping:[],openspace:[],nearbyState:"unavailable"};if(ve)try{var ny=await ve.json();ge.nearbyState=ny.state||"unavailable";var nc=ny.categories||{};ge.transport=(nc.transport||[]).slice(0,3);ge.health=(nc.health||[]).slice(0,3);ge.shopping=(nc.shops||[]).slice(0,3);ge.openspace=(nc.parks||[]).slice(0,3);}catch(e){ge.nearbyState="unavailable";}var seppStation400=null,seppStation800=null,seppLightRail800=null;(ge.transport||[]).forEach(function(_st){if(_st.dist<=0.4&&!seppStation400)seppStation400=_st;if(_st.dist<=0.8&&!seppStation800)seppStation800=_st;});setSt("");var Re=calcLots(t,r,J,Z);s&&(Re=0),renderResult(e,Z,K,V,J,t,r,Re,oe,ae,ie,se,ne,ge,ue,j,z,te,Q,G,W,q,Y,seppStation400,seppStation800,seppLightRail800,s,(s&&window._parcelConfidence&&window._parcelConfidence!=='Not found'?window._parcelConfidence==='Verified'?'auto-detected':window._parcelConfidence==='Estimated'?'estimated':window._parcelConfidence==='Needs review'?'needs-review':'auto-detected':s?'auto-detected':'manual'),_geoResult&&_geoResult.source?_geoResult.source:'',_geoResult&&_geoResult.addrConfidence?_geoResult.addrConfidence:(_geoResult&&_geoResult.confidence?_geoResult.confidence:''),_geoResult&&_geoResult.matchedAddr?_geoResult.matchedAddr:'',_geoResult&&_geoResult.addrType?_geoResult.addrType:'normal',_geoResult&&_geoResult.lotNum?_geoResult.lotNum:null,oe&&oe.councilSource?oe.councilSource:'',_geoResult&&_geoResult.locationType?_geoResult.locationType:'',_geoResult&&_geoResult.paidApiUsed?_geoResult.paidApiUsed:false,_geoResult&&_geoResult.lotGeoWarn?_geoResult.lotGeoWarn:null)}catch(e){console.error("SiteVerdict runCheck failed:",e);setSt("Something went wrong: "+(e&&e.message?e.message:"Unknown error. Check browser console."));}n.disabled=!1,n.textContent="Check this property →"}else setSt("Please enter a property address.")}




// ── NON-NSW RESULT RENDERER ───────────────────────────────────────
// Renders an honest, state-appropriate card when address is not NSW.
// NSW deep planning layers do NOT run for non-NSW addresses.
function _showNonNSWResult(addr, state, geo, landSizeInput, frontage, addrType){
  var resultEl = document.getElementById('result');
  if(!resultEl) return;

  var conf   = (geo && geo.confidence)  || 'Low';
  var mAddr  = (geo && geo.matchedAddr) || addr;
  var src    = (geo && geo.source)      || 'Geocode';
  var council= (geo && geo.council)     || '';
  try { window._svCouncil = council; } catch(e){}
  var geoConf= conf;

  // State-specific status messages
  var stateInfo = {
    ACT: {
      name: 'Australian Capital Territory',
      status: 'ACT Territory Plan data — basic site context available.',
      detail: 'Zone and planning context returned from official ACT data. Overlay details need professional verification.',
      next:   'Verify planning controls at actmapi.act.gov.au or with a licensed ACT planner.',
    },
    TAS: {
      name: 'Tasmania',
      status: 'Tasmania LIST data — basic site context available.',
      detail: 'Tasmanian Planning Scheme zone and land details returned from official state data (theLIST).',
      next:   'Verify planning controls at eplanningtas.com.au or with a licensed Tasmanian planner.',
    },
    VIC: {
      name: 'Victoria',
      status: 'Victoria address confirmed. Vicmap Planning data received; live zone layers not yet connected for this state.',
      detail: 'Victorian address confirmed. Detailed planning zone data is not yet connected for this state. Contact your local council or a licensed planner for planning controls.',
      next:   'Verify planning controls at planning.vic.gov.au or with a licensed Victorian planner.',
    },
    QLD: {
      name: 'Queensland',
      status: 'Queensland address confirmed. Planning zone data not yet connected for this state.',
      detail: 'Queensland address and local government area confirmed from geocode. QSCF cadastre data received (QSpatial, CC BY 4.0). Queensland planning zones are held by 77 individual councils separately — a single state layer does not exist. Zone data is not yet connected in this beta release.',
      next:   'Verify planning controls with the relevant council or at planning.qld.gov.au.',
    },
    SA: {
      name: 'South Australia',
      status: 'South Australia address confirmed. P&D Code data in preparation; live planning layers not yet connected for this state.',
      detail: 'SA Planning and Design Code GeoJSON received (data.sa.gov.au, CC BY 4.0). detailed planning zones are not yet connected.',
      next:   'Verify planning controls at saplanningportal.sa.gov.au or with a licensed SA planner.',
    },
    WA: {
      name: 'Western Australia',
      status: 'Western Australia address confirmed. Planning layer integration not yet available for this state.',
      detail: 'WA SLIP registration pending. Planning zone and cadastre integration not yet available.',
      next:   'Verify planning controls at myplanning.wa.gov.au or with a licensed WA planner.',
    },
    NT: {
      name: 'Northern Territory',
      status: 'Northern Territory address confirmed. Planning layer integration not yet available for this state.',
      detail: 'NT planning data integration not yet available.',
      next:   'Verify planning controls at nt.gov.au or with a licensed NT planner.',
    },
  };

  var info = stateInfo[state] || {
    name: state || 'Unknown state',
    status: 'State planning layers not yet connected.',
    detail: 'Planning data integration not yet available for this state.',
    next: 'Verify planning controls with the relevant council or a licensed planner.',
  };

  // Geocode confidence label
  var confColor = conf==='Verified'?'var(--green)':conf==='Estimated'?'var(--amber)':'var(--muted)';
  var confIcon  = conf==='Verified'?'✓':conf==='Estimated'?'~':'?';

  resultEl.innerHTML = [
    '<div class="rcard" style="max-width:620px;margin:0 auto;padding:24px;background:var(--bg2);border:1px solid var(--border);border-radius:16px">',

    // Header
    '<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">',
      '<div style="flex:1">',
        '<div style="font-size:.65rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:3px">Site Check — Basic National Screening</div>',
        '<div style="font-size:.95rem;font-weight:600">',escapeHTML(mAddr),'</div>',
        '<div style="font-size:.72rem;color:'+confColor+';margin-top:3px">'+confIcon+' Geocode: '+escapeHTML(geoConf)+'</div>',
      '</div>',
    '</div>',

    // State status card
    '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:14px">',
      '<div style="font-size:.65rem;text-transform:uppercase;letter-spacing:.07em;color:var(--muted2);margin-bottom:6px">'+escapeHTML(info.name)+' — Provider Status</div>',
      '<div style="font-size:.82rem;font-weight:500;margin-bottom:6px;color:var(--amber)">'+escapeHTML(info.status)+'</div>',
      '<div style="font-size:.74rem;color:var(--muted);line-height:1.7">'+escapeHTML(info.detail)+'</div>',
    '</div>',

    // Geocode facts
    council ? '<div style="font-size:.74rem;color:var(--muted);margin-bottom:10px">Local government area: '+escapeHTML(council)+'<span style="color:var(--muted2);font-size:.65rem"> — geocode indicator only</span></div>' : '',

    // Honest disclaimer
    '<div style="background:rgba(255,165,0,.07);border:1px solid rgba(255,165,0,.2);border-radius:8px;padding:10px 12px;font-size:.74rem;color:var(--amber);margin-bottom:12px">',
      'Planning zones, overlays, flood, heritage and development controls are not yet connected for this state.<br>',
      'Verify all planning controls with the relevant council or a licensed planner before any property decision.',
    '</div>',

    // Next step
    '<div style="font-size:.74rem;color:var(--muted);line-height:1.7;margin-bottom:14px">',
      '<strong style="color:var(--text)">Next step:</strong> '+escapeHTML(info.next),
    '</div>',

    // CTA — one button only
    '<div style="margin-top:16px">',
      '<a href="/professional-review.html" style="display:block;background:var(--gold);color:#07080a;text-decoration:none;padding:12px 18px;border-radius:10px;font-size:.84rem;font-weight:700;text-align:center">Professional Review →</a>',
    '</div>',

    // Standard disclaimer
    '<div style="font-size:.65rem;color:var(--muted2);line-height:1.8;border-top:1px solid var(--border);padding-top:10px">',
      'Based on available official, public, and verifiable data. Planning-risk context only.<br>',
      'Professional verification required before purchase, finance, or development decisions.<br>',
      'Not a planning certificate, valuation, legal, financial, or investment advice.',
    '</div>',

    '</div>',
  ].join('');

  resultEl.classList.add('show');
  // Package 99A: reveal optional user-entered inputs below the result (detect first, ask after)
  try { var _uic=document.getElementById('user-input-card'); if(_uic) _uic.style.display='block'; } catch(e){}
  setSt('');

  // Map preview: pin only for non-NSW until parcel outline is connected per state
  try {
    if (geo && geo.lat && geo.lon) {
      _renderMap(geo.lat, geo.lon, state, geo.matchedAddr || addr);
    }
  } catch(e) { /* silent */ }
}
// ── END NON-NSW RESULT RENDERER ─────────────────────────────────────

// ── LOADING STATE MANAGER ─────────────────────────────
var _loadingTimer = null;
var _loadingMsgs = [
  'Verifying address…',
  'Checking planning zone and controls…',
  'Checking overlay and hazard indicators…',
  'Checking council and DA information…',
  'Reviewing what we found…',
  'Preparing your result…'
];
function showSkeleton(){
  var sk = document.getElementById('result-skeleton');
  var res = document.getElementById('result');
  if(sk) sk.style.display = 'block';
  if(res){ res.innerHTML=''; res.classList.remove('show'); }
  var i = 0;
  _loadingTimer = setInterval(function(){
    setSt(_loadingMsgs[Math.min(i, _loadingMsgs.length-1)]);
    i++;
  }, 900);
}
function hideSkeleton(){
  var sk = document.getElementById('result-skeleton');
  if(sk) sk.style.display = 'none';
  if(_loadingTimer){ clearInterval(_loadingTimer); _loadingTimer = null; }
}

// ── WRAP runCheck TO ADD LOADING STATE ────────────────
(function(){
  var _orig = window.runCheck;
  if(typeof _orig !== 'function') return;
  var _checking = false;
  window.runCheck = async function(){
    if(_checking){ return; }  // prevent double-run while already searching
    _checking = true;
    showSkeleton();
    var _timeoutId = setTimeout(function(){
      // SITE_CHECK_TIMEOUT: result did not render within 20 seconds
      var res = document.getElementById('result');
      var hasResult = res && (res.querySelector('.rcard') || res.innerText.length > 60);
      if(!hasResult){
        hideSkeleton();
        setSt('');
        if(res){
          res.innerHTML = '<div class="rcard" style="max-width:620px;margin:0 auto;padding:20px;'+            'background:var(--bg2);border:1px solid var(--border);border-radius:14px">'            + '<div style="color:var(--amber);font-size:.8rem;margin-bottom:8px">&#9888; Site Check timed out</div>'            + '<div style="font-size:.82rem;margin-bottom:10px">The check took too long to complete. '            + 'This is usually a temporary connection issue.</div>'            + '<div style="font-size:.74rem;color:var(--muted)">Diagnostic: SITE_CHECK_TIMEOUT — '            + 'Please try again. If the problem continues, use the manual review option.</div></div>';
          res.classList.add('show');
        }
        var btn = document.getElementById('run-btn');
        if(btn){ btn.disabled = false; btn.textContent = 'Check this property →'; }
        _checking = false;
      }
    }, 20000);
    try { await _orig.apply(this, arguments); }
    catch(e){
      console.error('runCheck wrapper caught:', e);
      setSt('Something went wrong. Please try again.');
    }
    finally {
      clearTimeout(_timeoutId);  // clear timeout if result arrived in time
      _checking = false;
      hideSkeleton();
      // Always re-enable button so repeat searches always work
      var btn = document.getElementById('run-btn');
      if(btn){ btn.disabled = false; btn.textContent = 'Check this property →'; }
      // Only clear status if it does not contain an error message
      var stEl = document.getElementById('status');
      if(stEl && !stEl.textContent){ setSt(''); }
    }
  };
})();

// ── WHY THIS MATTERS HELPER ───────────────────────────

function escapeHTML(str){
  if(typeof str !== 'string') return str===null||str===undefined ? '' : String(str);
  return str
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}
// Escape a value and truncate to reasonable length
function esc(v, maxLen){
  var s = escapeHTML(v);
  return maxLen ? s.slice(0, maxLen) : s;
}


// ── SOURCE BADGE HELPER ───────────────────────────────

// Build the map card shell + ONE Leaflet map. Called once on load (base map) and
// reused on every check. Returns the map instance or null. Display-only.
// Package 99A: compute approximate parcel area from polygon rings + confidence.
// Display-only. Does NOT feed scoring or the result's own land-size logic.
// Returns { area, confidence } where confidence is 'detected' | 'estimated' | 'none'.
function _svParcelArea(rings, fieldArea) {
  if (!rings || !rings.length) return { area: null, confidence: 'none' };
  // Multi-ring (strata / multi-part) → not safe to state a single land size
  if (rings.length > 1) return { area: null, confidence: 'none' };
  var ring = rings[0];
  if (!ring || ring.length < 4) return { area: null, confidence: 'none' };
  var verts = ring.length - 1; // closing vertex repeats first
  // Local-metre approximation (equirectangular) — fine for small suburban lots only
  var lat0 = 0, i;
  for (i = 0; i < ring.length; i++) lat0 += ring[i][1];
  lat0 /= ring.length;
  var mlon = 111320 * Math.cos(lat0 * Math.PI / 180), mlat = 110540;
  var A = 0;
  for (i = 0; i < ring.length - 1; i++) {
    var x1 = ring[i][0] * mlon,   y1 = ring[i][1] * mlat;
    var x2 = ring[i+1][0] * mlon, y2 = ring[i+1][1] * mlat;
    A += x1 * y2 - x2 * y1;
  }
  var area = Math.abs(A) / 2;
  var fa = (fieldArea != null && fieldArea !== '') ? parseFloat(fieldArea) : null;
  // Confidence rules (per roadmap):
  // detected = simple ring, <=12 verts, 50–20,000 m2, and (if field present) within ~10%
  var simple = verts <= 12 && area >= 50 && area <= 20000;
  if (simple) {
    if (fa && fa > 0) {
      var diff = Math.abs(area - fa) / fa;
      if (diff <= 0.10) return { area: Math.round(area), confidence: 'detected' };
      return { area: Math.round(area), confidence: 'estimated' }; // disagree >10%
    }
    return { area: Math.round(area), confidence: 'detected' };
  }
  // single ring but outside bounds (large/rural or tiny) → estimated, not authoritative
  if (verts <= 20 && area > 0) return { area: Math.round(area), confidence: 'estimated' };
  return { area: null, confidence: 'none' };
}

function _ensureBaseMap() {
  var mapCard = document.getElementById('map-card');
  if (!mapCard) return null;
  if (typeof L === 'undefined') return null;

  // Already built — reuse the cached instance
  if (window._svMap) return window._svMap;

  mapCard.style.display = 'block';
  mapCard.style.maxWidth = '620px';
  mapCard.style.margin = '0 auto 12px';

  mapCard.innerHTML = [
    '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:16px;overflow:hidden">',
      '<div style="padding:10px 16px 6px;font-size:.62rem;font-weight:700;text-transform:uppercase;',
        'letter-spacing:.08em;color:var(--muted2);display:flex;align-items:center;gap:8px">',
        '<span>Map preview</span>',
        '<span style="font-weight:400;color:var(--muted)">&#183; Location approximate &#183; Not a survey</span>',
      '</div>',
      '<div id="sv-map" style="height:340px;width:100%;position:relative">',
        '<div id="sv-map-empty" style="position:absolute;inset:0;z-index:400;display:flex;',
          'align-items:center;justify-content:center;text-align:center;padding:0 18px;',
          'background:var(--bg2);color:var(--muted);font-size:.9rem;pointer-events:none">',
          'Enter your address to see your land',
        '</div>',
      '</div>',
      '<div id="sv-fact-strip" style="display:none;padding:8px 16px;border-top:1px solid var(--border);',
        'font-size:.9rem;color:var(--text);line-height:1.7;padding:11px 16px"></div>',
      '<div id="sv-map-note" style="padding:8px 16px 12px;font-size:.72rem;line-height:1.6;color:var(--muted)">',
        '&#169; <a href="https://www.openstreetmap.org/copyright" target="_blank" ',
        'style="color:var(--muted2)">OpenStreetMap contributors</a>',
      '</div>',
    '</div>',
  ].join('');

  try {
    var map = L.map('sv-map', {
      center: [-33.87, 151.05],   // Sydney / NSW region base view before any search
      zoom: 8,
      zoomControl: true,
      attributionControl: false,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
    window._svMap = map;
    window._svOverlayLayers = [];   // pin + parcel layers, cleared each check
    return map;
  } catch(e) {
    return null;
  }
}

function _renderMap(lat, lon, state, matchedAddr) {
  var mapCard = document.getElementById('map-card');
  if (!mapCard) return;
  if (typeof L === 'undefined') return;  // Leaflet not loaded

  mapCard.style.display = 'block';

  try {
    var map = _ensureBaseMap();

    if (map) {
      // REUSE path: clear previous pin/parcel layers, hide empty-state, pan in
      var empty = document.getElementById('sv-map-empty');
      if (empty) empty.style.display = 'none';
      if (window._svOverlayLayers) {
        window._svOverlayLayers.forEach(function(l){ try { map.removeLayer(l); } catch(e){} });
      }
      window._svOverlayLayers = [];
      // Reset the map note + fact strip for this check
      var note0 = document.getElementById('sv-map-note');
      if (note0) note0.innerHTML = '&#169; <a href="https://www.openstreetmap.org/copyright" target="_blank" style="color:var(--muted2)">OpenStreetMap contributors</a>';
      var fs0 = document.getElementById('sv-fact-strip');
      if (fs0) { fs0.style.display = 'none'; fs0.innerHTML = ''; }

      map.setView([lat, lon], 17);
      setTimeout(function(){ try { map.invalidateSize(); } catch(e){} }, 60);

      var pin = L.circleMarker([lat, lon], {
        radius: 7, fillColor: '#c8a84b', color: '#ffffff',
        weight: 2, opacity: 1, fillOpacity: 1,
      }).addTo(map);
      window._svOverlayLayers.push(pin);
    } else {
      // FALLBACK path (base map unavailable): original create-on-demand behaviour
      mapCard.style.maxWidth = '620px';
      mapCard.style.margin = '0 auto 12px';
      mapCard.innerHTML = [
        '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:16px;overflow:hidden">',
          '<div style="padding:10px 16px 6px;font-size:.62rem;font-weight:700;text-transform:uppercase;',
            'letter-spacing:.08em;color:var(--muted2);display:flex;align-items:center;gap:8px">',
            '<span>Map preview</span>',
            '<span style="font-weight:400;color:var(--muted)">&#183; Location approximate &#183; Not a survey</span>',
          '</div>',
          '<div id="sv-map" style="height:340px;width:100%"></div>',
          '<div id="sv-fact-strip" style="display:none;padding:8px 16px;border-top:1px solid var(--border);font-size:.9rem;color:var(--text);line-height:1.7"></div>',
          '<div id="sv-map-note" style="padding:8px 16px 12px;font-size:.72rem;line-height:1.6;color:var(--muted)">',
            '&#169; <a href="https://www.openstreetmap.org/copyright" target="_blank" style="color:var(--muted2)">OpenStreetMap contributors</a>',
          '</div>',
        '</div>',
      ].join('');
      map = L.map('sv-map', { center: [lat, lon], zoom: 17, zoomControl: true, attributionControl: false });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
      L.circleMarker([lat, lon], { radius: 7, fillColor: '#c8a84b', color: '#ffffff', weight: 2, opacity: 1, fillOpacity: 1 }).addTo(map);
    }

    // Parcel outline (unchanged adapters) — NSW / QLD / other
    if (state === 'NSW' || (state !== 'ACT' && state !== 'TAS' && state !== 'QLD' &&
        state !== 'VIC' && state !== 'SA' && state !== 'WA' && state !== 'NT')) {
      _fetchParcelOutline(lat, lon, map);
    } else if (state === 'QLD') {
      _fetchParcelOutlineQLD(lat, lon, map);
    } else {
      var note = document.getElementById('sv-map-note');
      if (note) {
        note.innerHTML += ' &#183; Parcel outline not yet available for this state &#183; Location pin only';
      }
    }
  } catch(e) {
    // Map failed to render — hide the card silently, do not break result
    mapCard.style.display = 'none';
  }
}

function _fetchParcelOutline(lat, lon, map) {
  // NSW SIX Maps Cadastre Layer 9 — CC BY 4.0
  // returnGeometry=true to get the parcel polygon
  var url = 'https://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_Cadastre/MapServer/9/query'
    + '?geometry=' + encodeURIComponent(JSON.stringify({x:lon,y:lat,spatialReference:{wkid:4326}}))
    + '&geometryType=esriGeometryPoint'
    + '&inSR=4326'
    + '&distance=50'
    + '&units=esriSRUnit_Meter'
    + '&spatialRel=esriSpatialRelIntersects'
    + '&outFields=*'
    + '&returnGeometry=true'
    + '&outSR=4326'
    + '&f=json';

  var ctrl = new AbortController();
  var timer = setTimeout(function() { ctrl.abort(); }, 8000);

  fetch(url, { signal: ctrl.signal })
    .then(function(r) { return r.json(); })
    .then(function(d) {
      clearTimeout(timer);
      var features = d && d.features;
      if (!features || !features.length) return;

      var feat = features[0];
      var geom = feat.geometry;
      var attrs = feat.attributes || {};

      // Draw parcel outline
      if (geom && geom.rings && geom.rings.length) {
        var latlngs = geom.rings[0].map(function(pt) { return [pt[1], pt[0]]; });
        var parcelPoly = L.polygon(latlngs, {
          color: '#c8a84b',
          weight: 4,
          fillColor: '#c8a84b',
          fillOpacity: 0.18,
        }).addTo(map);
        if (window._svOverlayLayers) window._svOverlayLayers.push(parcelPoly);

        // Fit map to parcel bounds
        map.fitBounds(parcelPoly.getBounds(), { padding: [20, 20] });
      }

      // Fact strip — display mirror of fields already fetched (no scoring, no compute)
      var fs = document.getElementById('sv-fact-strip');
      // Build a clean Lot/Plan from parts (avoid raw lotidstring like "100//DP1033915")
      var lotPlan = '';
      if (attrs.lotnumber && attrs.planlabel) lotPlan = 'Lot ' + attrs.lotnumber + ' \u00b7 ' + attrs.planlabel;
      else if (attrs.planlabel) lotPlan = attrs.planlabel;
      else if (attrs.lotnumber) lotPlan = 'Lot ' + attrs.lotnumber;
      // Land size (Package 99A): compute from polygon, label confidence.
      // planlotarea used only as cross-check/fallback. Never fabricate.
      var areaResult = _svParcelArea(geom && geom.rings, attrs.planlotarea);
      var landArea = areaResult.area;
      var landConf = areaResult.confidence;  // 'detected' | 'estimated' | 'none'
      // Fallback: if polygon gave nothing but the field has a value, show it as estimated
      if (landArea == null && attrs.planlotarea != null && attrs.planlotarea !== '') {
        var pf = parseFloat(attrs.planlotarea);
        if (pf > 0) { landArea = Math.round(pf); landConf = 'estimated'; }
      }
      var landLabel = landConf === 'detected' ? 'Detected from parcel'
        : (landConf === 'estimated' ? 'Estimated from map' : '');
      // Council: parcel lganame first, then existing result council value
      var council = (attrs.lganame && String(attrs.lganame).trim()) ? String(attrs.lganame).trim() : (window._svCouncil || '');
      if (fs && (lotPlan || landArea || council || window._svZoneName)) {
        var chips = [];
        if (landArea) chips.push('<b>Land size</b> ~' + landArea + ' m&#178; <span style="color:var(--muted2);font-size:.82em">(' + landLabel + ')</span>');
        else chips.push('<b>Land size</b> <span style="color:var(--muted2)">Not confirmed</span>');
        if (lotPlan)  chips.push('<b>Lot/Plan</b> ' + lotPlan + ((window._parcelConfidence === 'Verified') ? '' : ' <span style="color:var(--muted2);font-size:.82em">(signal — needs review)</span>'));
        if (council)  chips.push('<b>Council</b> ' + council);
        if (window._svZoneName) chips.push('<b>Planning zone</b> ' + window._svZoneName);
        if (chips.length) {
          fs.innerHTML = chips.join(' &nbsp;&#183;&nbsp; ')
            + '<div style="margin-top:6px;color:var(--muted2);font-size:.72rem">'
            + 'Approximate boundary and dimensions only — not a survey. Confirm by title plan or licensed surveyor.</div>';
          fs.style.display = 'block';
        }
      }

      // Update note with parcel info (clean Lot/Plan from parts)
      var note = document.getElementById('sv-map-note');
      if (note && (attrs.lotnumber || attrs.planlabel)) {
        var noteLotPlan = (attrs.lotnumber && attrs.planlabel) ? ('Lot ' + attrs.lotnumber + ' \u00b7 ' + attrs.planlabel)
          : (attrs.planlabel || ('Lot ' + attrs.lotnumber));
        var noteArea = (attrs.areatotalm2 != null && attrs.areatotalm2 !== '') ? attrs.areatotalm2
          : ((attrs.planlotarea != null && attrs.planlotarea !== '') ? attrs.planlotarea : null);
        var areaStr = noteArea ? ' &#183; ~' + Math.round(noteArea) + 'm&#178;' : '';
        note.innerHTML = noteLotPlan
          + areaStr
          + ' &#183; Source: NSW SIX Maps (CC BY 4.0)'
          + ' &#183; <a href="https://www.openstreetmap.org/copyright" target="_blank" '
          + 'style="color:var(--muted2)">&#169; OpenStreetMap</a>';
      }
    })
    .catch(function() {
      clearTimeout(timer);
      // Parcel outline failed — map still shows pin, no error displayed
    });
}

function _fetchParcelOutlineQLD(lat, lon, map) {
  // QLD DCDB — Land Parcel Property Framework, layer 4. Public, no key. © State of Queensland (CC BY 4.0)
  // Display-only. Approximate boundary and dimensions only — not a survey.
  var url = 'https://spatial-gis.information.qld.gov.au/arcgis/rest/services/PlanningCadastre/LandParcelPropertyFramework/MapServer/4/query'
    + '?geometry=' + encodeURIComponent(lon + ',' + lat)
    + '&geometryType=esriGeometryPoint'
    + '&inSR=4326'
    + '&spatialRel=esriSpatialRelIntersects'
    + '&outFields=lot,plan,lotplan,lot_area,locality,shire_name'
    + '&returnGeometry=true'
    + '&outSR=4326'
    + '&f=json';

  var ctrl = new AbortController();
  var timer = setTimeout(function() { ctrl.abort(); }, 8000);

  fetch(url, { signal: ctrl.signal })
    .then(function(r) { return r.json(); })
    .then(function(d) {
      clearTimeout(timer);
      var features = d && d.features;
      if (!features || !features.length) return;

      var feat = features[0];
      var geom = feat.geometry;
      var attrs = feat.attributes || {};

      // Draw parcel outline
      if (geom && geom.rings && geom.rings.length) {
        var latlngs = geom.rings[0].map(function(pt) { return [pt[1], pt[0]]; });
        var qPoly = L.polygon(latlngs, {
          color: '#c8a84b',
          weight: 4,
          fillColor: '#c8a84b',
          fillOpacity: 0.18,
        }).addTo(map);
        if (window._svOverlayLayers) window._svOverlayLayers.push(qPoly);
        map.fitBounds(qPoly.getBounds(), { padding: [20, 20] });
      }

      // Update note with parcel info — clear, two-line. Cannot imply planning certainty.
      var note = document.getElementById('sv-map-note');
      if (note && (attrs.lotplan || attrs.lot)) {
        var lotStr = attrs.lotplan || ((attrs.lot || '') + (attrs.plan ? '/' + attrs.plan : ''));
        var areaStr = attrs.lot_area ? ', ~' + Math.round(attrs.lot_area) + 'm&#178;' : '';
        var locStr  = attrs.locality ? ' (' + attrs.locality + ')' : '';
        note.innerHTML =
            '<div style="font-weight:600;color:var(--muted)">Parcel/address found. Planning controls for this state are not fully connected yet.</div>'
          + '<div style="margin-top:4px">Parcel ' + lotStr + areaStr + locStr + ' &#183; Source: QLD DCDB (CC BY 4.0)</div>'
          + '<div style="margin-top:4px">Approximate boundary and dimensions only — not a survey. Confirm by title plan or licensed surveyor.</div>'
          + '<div style="margin-top:4px">&#169; <a href="https://www.openstreetmap.org/copyright" target="_blank" style="color:var(--muted2)">OpenStreetMap</a></div>';
      }
    })
    .catch(function() {
      clearTimeout(timer);
      // Parcel outline failed — map still shows pin, no error displayed
    });
}

// ── END MAP PREVIEW ──────────────────────────────────────────────

function buildVerdictSection(addr,zone,lga,n,cm,heritage,flood,bushfire,sepp400,sepp800,mls,mlsReal,block,front,geoConf,blockSource,lotGeoWarn,fsr,height,matchedAddr,infra,purpose){

  var zLabel = ({
    'R1':'Low density residential',  'R2':'Low density residential',
    'R3':'Medium density residential','R4':'High density residential',
    'R5':'Large lot residential',     'RU1':'Primary production',
    'RU2':'Rural landscape',          'RU4':'Rural small holdings',
    'E4':'Environmental living',      'MU1':'Mixed use',
    'B2':'Local centre',              'B4':'Mixed use'
  })[zone] || (zone ? zone + ' zoning' : null);

  var hasZone    = !!zone;
  var hasBlock   = !!(block && block > 0);
  var hasFront   = !!(front && front > 0);
  var hasOverlay = !!(heritage || flood || bushfire);

  // Parcel confidence is LOW when geocode confidence is low or lot geometry flagged.
  // We never present an uncertain parcel as verified.
  var lowParcel = (geoConf && /low/i.test(String(geoConf))) || !!lotGeoWarn;
  var NBSP='\u00a0', DASH='\u2014', BOX='\u25a1', DOT='\u2022';
  var USER_LABEL = ' <span class="conf-tag" style="font-size:.66rem;color:var(--muted2);white-space:nowrap">User entered '+DASH+' not independently verified</span>';

  // REDUCED STATE: missing user land size or frontage
  if (!hasBlock || !hasFront) {
    return '<div class="signal-card">'
      + '<div class="signal-section"><div class="signal-heading">What we found</div>'
        + '<ul style="list-style:none;margin:0;padding:0;font-size:.78rem;line-height:1.75">'
          + '<li style="margin:0 0 5px;padding-left:14px;position:relative;color:var(--muted)"><span style="position:absolute;left:0;top:1px;color:var(--muted2)">'+BOX+'</span>Land size: Not confirmed</li>'
          + '<li style="margin:0 0 5px;padding-left:14px;position:relative;color:var(--muted)"><span style="position:absolute;left:0;top:1px;color:var(--muted2)">'+BOX+'</span>Frontage: Not confirmed</li>'
          + '<li style="margin:0 0 5px;padding-left:14px;position:relative;color:var(--muted)"><span style="position:absolute;left:0;top:1px;color:var(--muted2)">'+BOX+'</span>Professional verification needed</li>'
        + '</ul></div>'
      + '<div class="signal-section"><div class="signal-body">Add your land size and frontage above to see a fuller result '+DASH+' or request a professional review now.</div></div>'
      + _proReviewCta(addr) + _proVerifyLine()
    + '</div>';
  }

  // Section 1: What we found — structured, address-specific, confidence-labelled.
  // This is the standard that makes it a real Site Check, not a generic AI paragraph.
  var found = [];
  // Address (the check is tied to a specific property)
  found.push('Address: ' + esc(matchedAddr || addr, 90));
  // Council + zone
  if (lga)          found.push('Council / LGA: ' + esc(lga));
  else              found.push('Council / LGA: Not confirmed');
  if (zLabel)       found.push('Zone: ' + esc(zLabel) + ' (' + esc(zone) + ')');
  else              found.push('Zone: Not confirmed');
  // Minimum lot size
  if (mlsReal && mls) found.push('Minimum lot size (confirmed LEP): ' + mls + NBSP + 'm\u00b2');
  else if (mls)     found.push('Typical minimum lot size for this zone (not confirmed for this lot): ' + mls + NBSP + 'm\u00b2 ' + DASH + ' confirm with council');
  else              found.push('Minimum lot size: Not confirmed for this zone ' + DASH + ' Professional verification needed');
  // Height & FSR — show when available, else state Not confirmed (don't pretend)
  if (height && Number(height) > 0) found.push('Height limit: ' + esc(String(height)) + NBSP + 'm');
  else              found.push('Height limit: Not confirmed');
  if (fsr && Number(fsr) > 0)       found.push('Floor space ratio (FSR): ' + esc(String(fsr)));
  else              found.push('FSR: Not confirmed');
  // User-supplied land facts (clearly labelled)
  found.push('Land size: ' + Number(block).toLocaleString() + NBSP + 'm\u00b2' + USER_LABEL);
  found.push('Frontage: ' + Number(front).toLocaleString() + NBSP + 'm' + USER_LABEL);
  // Overlays — confirm each either way (positive confirmation, not silence)
  found.push('Heritage indicator: ' + (heritage ? 'present ' + DASH + ' scope needs verification' : 'none detected in this check'));
  found.push('Flood planning indicator: ' + (flood ? 'present ' + DASH + ' scope needs verification' : 'none detected in this check'));
  found.push('Bushfire prone indicator: ' + (bushfire ? 'present ' + DASH + ' scope needs verification' : 'none detected in this check'));
  // Parcel / location + data confidence (explicit, always shown)
  if (lowParcel)    found.push('Parcel / location confidence: low ' + DASH + ' parcel match not confirmed; professional verification needed');
  else              found.push('Parcel / location confidence: ' + esc(String(geoConf || 'Estimated')));
  found.push('Data confidence: planning signals from NSW sources; land size and frontage user-entered; items above marked Not confirmed are not yet verified');

  var foundHtml = found.map(function(f) {
    var isGap = /Not confirmed|not confirmed|confidence: low|not yet verified|none detected/.test(f);
    return '<li style="margin:0 0 5px;padding-left:14px;position:relative;color:'
      + (isGap ? 'var(--muted)' : 'var(--text)') + '"><span style="position:absolute;left:0;top:1px;color:var(--muted2)">'
      + (isGap ? BOX : DOT) + '</span>' + f + '</li>';
  }).join('');

  // Section 2: What this means
  var meaning = '';
  if (!hasZone) {
    meaning = 'We could not confirm the zone from connected government data. Entering the full address ' + DASH + ' including suburb, state and postcode ' + DASH + ' may help. A licensed planner can confirm the planning controls for this property.';
  } else if (hasOverlay) {
    var ol = [heritage?'a heritage overlay':null, flood?'a flood planning area':null, bushfire?'bushfire prone land':null].filter(Boolean).join(' and ');
    meaning = 'This property has ' + ol + ' indicator' + (([heritage,flood,bushfire].filter(Boolean).length > 1) ? 's' : '') + '. This does not by itself stop anything ' + DASH + ' but it means plans will need more assessment, time and possibly cost. Professional verification is important before any decision.';
  } else {
    meaning = 'The zone was found, and you entered a land size of ' + Number(block).toLocaleString() + NBSP + 'm\u00b2 and frontage of ' + Number(front).toLocaleString() + NBSP + 'm. The zone sets what use is generally expected; minimum lot size affects whether more than one dwelling or lot may be possible; frontage affects access and layout. These are starting points ' + DASH + ' not a decision, and not confirmation of what can be approved.';
    if (!mls) meaning += ' Minimum lot size was not confirmed from the available layer for this zone. It should be checked against the LEP/council controls before decisions.';
  }

  // Section 3: What still needs checking (missing/unconfirmed items, framed as checks not weaknesses)
  // Missing/unconfirmed items are framed as checks needed, NOT as the land's weaknesses.
  var check = [];
  if (lowParcel) check.push('Parcel match not confirmed ' + DASH + ' professional verification needed');
  check.push('Land size and frontage are user-entered ' + DASH + ' not independently verified');
  check.push('Title, DP and easements ' + DASH + ' need checking (title search)');
  check.push('Exact boundaries and dimensions ' + DASH + ' survey may be needed');
  if (!heritage) check.push('Heritage ' + DASH + ' not fully confirmed; local council schedule may differ');
  if (!flood)    check.push('Flood ' + DASH + ' not fully confirmed; flood study may be required');
  if (!bushfire) check.push('Bushfire ' + DASH + ' not fully confirmed');
  check.push('Stormwater and drainage ' + DASH + ' may need review');
  check.push('Slope, earthworks and retaining ' + DASH + ' may need review');
  check.push('Council / DCP controls ' + DASH + ' may need professional review');
  var checkHtml = check.map(function(m){return '<li style="margin:0 0 5px;padding-left:14px;position:relative;color:var(--muted)"><span style="position:absolute;left:0;top:1px;color:var(--muted2)">'+BOX+'</span>'+m+'</li>';}).join('');

  return '<div class="signal-card">'
    + _confirmLocationBanner(matchedAddr, geoConf, addr)
    + _parcelConfidenceLine()
    + '<div class="signal-section"><div class="signal-heading">What we found</div>'
      + '<ul style="list-style:none;margin:0;padding:0;font-size:.77rem;line-height:1.75">' + foundHtml + '</ul></div>'
    + '<div class="signal-section"><div class="signal-heading">What this means</div>'
      + '<div class="signal-body">' + meaning + '</div></div>'
    + _pathwaysSection(zone, hasZone, hasBlock, hasFront, block, mls, mlsReal, hasOverlay, purpose, DASH, BOX)
    + _constraintsSection(heritage, flood, bushfire, hasZone, mlsReal, DASH, BOX)
    + _nearbyContextSection(infra, DASH, DOT)
    + '<div class="signal-section"><div class="signal-heading">What still needs checking</div>'
      + '<ul style="list-style:none;margin:0;padding:0;font-size:.74rem;line-height:1.75">' + checkHtml + '</ul></div>'
    + '<div class="signal-section"><div class="signal-heading">Next useful step</div>'
      + '<div class="signal-body">To understand what may be worth reviewing or help reduce risk, request a Professional Review.</div></div>'
    + _proReviewCta(addr) + _proVerifyLine()
  + '</div>';
}

function _proReviewCta(addr){
  var q = addr ? ('?addr=' + encodeURIComponent(addr)) : '';
  return '<div style="margin-top:18px">'
    + '<a class="btn btn-gold" href="/professional-review.html' + q + '" '
      + 'style="display:block;text-align:center;text-decoration:none;width:100%;padding:13px 18px;font-size:.84rem;letter-spacing:.01em">'
      + 'Professional Review \u2192'
    + '</a></div>';
}
function _proVerifyLine(){
  return '<div style="margin-top:10px;font-size:.64rem;color:var(--muted);line-height:1.6;text-align:center">'
    + 'Preliminary information only. Professional verification required before decisions or spending money. '
    + 'Not a planning certificate, valuation, legal, financial or survey advice. '
    + 'Approximate boundary and dimensions only \u2014 not a survey. Confirm by title plan or licensed surveyor.'
  + '</div>';
}

// Possible pathways to review — safe, signal-based, never a promise of approval/yield/value.
function _pathwaysSection(zone, hasZone, hasBlock, hasFront, block, mls, mlsReal, hasOverlay, purpose, DASH, BOX){
  var items = [];
  var RESI = ['R1','R2','R3','R4','R5','R6'];
  var NONRESI_PRO = ['E1','E2','E3','E4','C1','C2','C3','C4','MU1','MU2','B1','B2','B3','B4','B5','B6','B7','IN1','IN2','IN3','SP1','SP2','SP3','RE1','RE2','W1','W2','W3'];
  var isResi = hasZone && RESI.indexOf(zone) > -1;
  var isNonResiPro = hasZone && NONRESI_PRO.indexOf(zone) > -1;

  // OC / external works purpose takes priority as a pathway signal
  if (purpose === 'oc' || purpose === 'external' || purpose === 'oc_handover' || purpose === 'external_works') {
    items.push('External works / OC pathway ' + DASH + ' drainage, driveway/crossover, retaining and compliance may be worth reviewing (early signal only, subject to verification)');
  }

  if (!hasZone) {
    items.push('Not enough confirmed data to assess pathways ' + DASH + ' enter the full address or request a Professional Review');
  } else if (isNonResiPro) {
    items.push('Professional planning review recommended before relying on this site ' + DASH + ' this zone is not a standard residential zone, so residential development assumptions do not apply');
  } else if (isResi) {
    if (hasBlock && hasFront) {
      items.push('Secondary dwelling / granny flat ' + DASH + ' may be worth reviewing (early signal only, subject to council controls and verification)');
      items.push('Dual occupancy ' + DASH + ' may be worth reviewing with a planner (subject to verification)');
      // Subdivision signal ONLY when user land size meaningfully exceeds a confirmed min-lot
      if (mlsReal && mls && block >= (mls * 2)) {
        items.push('Subdivision feasibility ' + DASH + ' may be worth reviewing; possible lot count depends on verified survey, frontage, access, services, easements, overlays and council controls (no lot count is implied here)');
      } else if (!mlsReal || !mls) {
        items.push('Subdivision ' + DASH + ' minimum lot size not confirmed for this lot, so subdivision cannot be assessed from this basic check');
      }
    } else {
      items.push('Add land size and frontage above, or request a Professional Review, to see which residential pathways may be worth checking');
    }
  } else {
    items.push('Professional planning review recommended before relying on this site');
  }

  if (hasOverlay) {
    items.push('Overlay present ' + DASH + ' any pathway above will need extra assessment for the detected overlay (heritage / flood / bushfire) before relying on it');
  }

  var li = items.map(function(t){
    return '<li style="margin:0 0 5px;padding-left:14px;position:relative;color:var(--muted)"><span style="position:absolute;left:0;top:1px;color:var(--muted2)">' + BOX + '</span>' + t + '</li>';
  }).join('');

  return '<div class="signal-section"><div class="signal-heading">Possible pathways to review</div>'
    + '<ul style="list-style:none;margin:0;padding:0;font-size:.75rem;line-height:1.75">' + li + '</ul>'
    + '<div style="font-size:.64rem;color:var(--muted2);margin-top:4px;line-height:1.55">These are early signals that may be worth reviewing '
    + DASH + ' subject to council controls, overlays, title, survey, services and professional verification. '
    + 'They are not approval, not a guarantee, and not confirmation of what can be built or subdivided.</div></div>';
}

// Development constraints to check — lists items that can affect what is suitable/approvable.
// Marks what this basic report DID look at vs. what is NOT checked here and needs professional
// verification. Never implies all constraints were detected.
function _constraintsSection(heritage, flood, bushfire, hasZone, mlsReal, DASH, BOX){
  // What this basic check actually looked at (detected status, honestly labelled)
  var checked = [];
  checked.push('Zoning ' + DASH + (hasZone ? ' detected (verify with council)' : ' not confirmed from this check'));
  checked.push('Minimum lot size ' + DASH + (mlsReal ? ' detected (estimate, verify with council)' : ' not confirmed for this lot'));
  checked.push('Heritage ' + DASH + (heritage ? ' a heritage signal was detected (verify)' : ' none detected in this basic check (still verify)'));
  checked.push('Flood ' + DASH + (flood ? ' a flood-related signal was detected (verify)' : ' none detected in this basic check (still verify)'));
  checked.push('Bushfire ' + DASH + (bushfire ? ' a bushfire signal was detected (verify)' : ' none detected in this basic check (still verify)'));

  // Items NOT assessed by this basic report — must be professionally verified
  var notChecked = [
    'Exact lot boundaries and title',
    'Survey area and frontage',
    'DCP and council-specific controls',
    'Biodiversity and trees',
    'Slope / earthworks',
    'Easements and restrictions on title',
    'Drainage and stormwater',
    'Driveway / access and crossover',
    'Services (water, sewer, power, NBN)'
  ];

  var ci = checked.map(function(t){
    return '<li style="margin:0 0 5px;padding-left:14px;position:relative;color:var(--muted)"><span style="position:absolute;left:0;top:1px;color:var(--muted2)">' + BOX + '</span>' + t + '</li>';
  }).join('');
  var ni = notChecked.map(function(t){
    return '<li style="margin:0 0 5px;padding-left:14px;position:relative;color:var(--muted)"><span style="position:absolute;left:0;top:1px;color:var(--muted2)">' + BOX + '</span>' + t + ' ' + DASH + ' not checked in this basic report</li>';
  }).join('');

  return '<div class="signal-section"><div class="signal-heading">Development constraints to check</div>'
    + '<div style="font-size:.7rem;color:var(--muted2);margin-bottom:6px;line-height:1.55">These items can affect what is suitable or approvable. '
    + 'Some are looked at in this basic report; many are not checked here and need professional verification.</div>'
    + '<ul style="list-style:none;margin:0 0 6px;padding:0;font-size:.75rem;line-height:1.7">' + ci + '</ul>'
    + '<ul style="list-style:none;margin:0;padding:0;font-size:.74rem;line-height:1.7">' + ni + '</ul>'
    + '<div style="font-size:.64rem;color:var(--muted2);margin-top:4px;line-height:1.55">Not confirmed from this basic check. '
    + 'Verify before relying. A Professional Review can assess these properly.</div></div>';
}

// Nearby context — visible open-map signals only. Hidden entirely if no data; never fabricated.
function _nearbyContextSection(infra, DASH, DOT){
  if (!infra) return '';
  var state = infra.nearbyState || (totalNearby(infra) > 0 ? 'found' : 'none');
  function totalNearby(o){return (o.transport||[]).length+(o.health||[]).length+(o.shopping||[]).length+(o.openspace||[]).length;}
  var heading = '<div class="signal-section"><div class="signal-heading">Nearby context</div>';
  var disclaimer = '<div style="font-size:.64rem;color:var(--muted2);margin-top:4px;line-height:1.55">Nearby context signals are early open-map / open-data signals only '
    + '(\u00a9 OpenStreetMap contributors). They can help you understand the area, but they are not a valuation, '
    + 'school-catchment check, transport assessment, or professional advice. Verify before relying.</div></div>';

  // Honest, distinct states — never blurred into one vague "not confirmed".
  if (state === 'unavailable') {
    return heading + '<div class="signal-body" style="font-size:.9rem;color:var(--muted)">Nearby data temporarily unavailable \u2014 try again shortly.</div></div>';
  }
  if (state === 'not_checked') {
    return heading + '<div class="signal-body" style="font-size:.9rem;color:var(--muted)">Nearby context was not checked for this address.</div></div>';
  }

  var rows = [];
  function add(label, list){
    if (list && list.length){
      var s = list[0];
      if (s && s.name) rows.push(label + ': ' + esc(s.name, 40) + ' ' + DASH + ' approx. ' + s.dist + ' km');
    }
  }
  add('Transport', infra.transport);
  add('Health service', infra.health);
  add('Retail / shops', infra.shopping);
  add('Open space', infra.openspace);

  if (!rows.length){
    // query succeeded, nothing nearby
    return heading + '<div class="signal-body" style="font-size:.9rem;color:var(--muted)">No transport, shops, health services or parks found near this address.</div></div>';
  }

  var li = rows.slice(0,5).map(function(t){
    return '<li style="margin:0 0 5px;padding-left:14px;position:relative;color:var(--text)"><span style="position:absolute;left:0;top:1px;color:var(--muted2)">' + DOT + '</span>' + t + '</li>';
  }).join('');

  return heading
    + '<ul style="list-style:none;margin:0;padding:0;font-size:.75rem;line-height:1.75">' + li + '</ul>'
    + disclaimer;
}

// Render-only confirm-location banner shown at the top of the result card.
// Shows the matched address + confidence and asks the user to check the map.
// Does NOT claim parcel/boundary/frontage confirmed. Does not change the flow.
function _confirmLocationBanner(matchedAddr, geoConf, inputAddr){
  var conf = String(geoConf || '').toLowerCase();
  // Treat these as weak confidence -> stronger "needs review" wording.
  var weak = (conf === 'needs review' || conf === 'approximate' || conf === 'estimated' ||
              conf === 'interpolated' || conf === '' || conf === 'not matched' || conf === 'low');
  var confLabel = geoConf ? esc(String(geoConf), 24) : 'not confirmed';
  var matched = matchedAddr ? esc(String(matchedAddr), 90) : '(no matched address returned)';

  if (weak) {
    return '<div style="border:1px solid var(--border);background:var(--bg2);border-radius:12px;'
      + 'padding:12px 14px;margin:0 0 12px;font-size:.78rem;line-height:1.6">'
      + '<div style="font-weight:700;color:var(--text);margin-bottom:4px">Location needs review</div>'
      + '<div style="color:var(--muted)">We matched: <span style="color:var(--text)">' + matched + '</span><br>'
      + 'Confidence: <span style="color:var(--text)">' + confLabel + '</span></div>'
      + '<div style="color:var(--muted);margin-top:6px">The address was not matched confidently enough to confirm the exact property. '
      + 'Please enter a full street number, street name, suburb and postcode, or request a Professional Review. '
      + 'This map is approximate and not a survey.</div></div>';
  }
  return '<div style="border:1px solid var(--border);background:var(--bg2);border-radius:12px;'
    + 'padding:12px 14px;margin:0 0 12px;font-size:.78rem;line-height:1.6">'
    + '<div style="font-weight:700;color:var(--text);margin-bottom:4px">Confirm the location</div>'
    + '<div style="color:var(--muted)">We matched: <span style="color:var(--text)">' + matched + '</span><br>'
    + 'Confidence: <span style="color:var(--text)">' + confLabel + '</span></div>'
    + '<div style="color:var(--muted);margin-top:6px">Please check the map before relying on this result. '
    + 'This map is approximate and not a survey. If this is not your property, edit the address and check again.</div></div>';
}

// Parcel confidence line — render-only. Prefers window._resolvedParcel (DCS property resolution:
// address->property->all contained lots + summed polygon area + confidence). Falls back to the
// legacy window._parcelConfidence. Defaults to "needs review" unless DCS confidence is 'verified'.
// Never claims a parcel/lot is confirmed when the system cannot prove it. No flow change.
function _parcelConfidenceLine(){
  var box = 'border:1px solid var(--border);background:var(--bg2);border-radius:12px;padding:10px 14px;margin:0 0 12px;font-size:.74rem;line-height:1.6;color:var(--muted)';
  var rp = null;
  try { rp = (typeof window !== 'undefined') ? window._resolvedParcel : null; } catch(e){ rp = null; }

  // Conflict warning takes priority — show BOTH figures, never the detected one alone as authoritative.
  function conflictHtml(c){
    if (!c) return '';
    return '<div style="margin-top:6px;color:var(--text)"><b>Land size needs checking:</b> the detected parcel area (~'
      + c.detected + ' m\u00b2, Estimated) differs from the size you entered (' + c.entered
      + ' m\u00b2). Verify by title plan or survey before relying on either.</div>';
  }

  if (rp && rp.confidence === 'verified' && rp.lots && rp.lots.length) {
    var ids = rp.lots.map(function(l){ return esc(l.identity, 40); }).join(' &amp; ');
    var areaStr = (rp.area && rp.area > 0) ? ('~' + rp.area + ' m\u00b2 (Estimated, summed from parcel polygons)') : 'not available';
    return '<div style="' + box + '">'
      + '<span style="font-weight:700;color:var(--text)">Parcel resolved \u2014 ' + ids + '.</span> '
      + 'Land size ' + areaStr + '. Sourced from NSW DCS cadastre. '
      + 'This is map/cadastre data, not a boundary survey \u2014 confirm exact boundaries and frontage by title plan or a licensed surveyor.'
      + conflictHtml(rp.conflict)
      + '</div>';
  }

  // estimated (resolved with minor ambiguity) — show lots but keep "needs review" framing
  if (rp && rp.confidence === 'estimated' && rp.lots && rp.lots.length) {
    var ids2 = rp.lots.map(function(l){ return esc(l.identity, 40); }).join(' &amp; ');
    return '<div style="' + box + '">'
      + '<span style="font-weight:700;color:var(--text)">Parcel signal needs review.</span> '
      + 'Closest cadastre match: ' + ids2 + ' (not confirmed). The exact property could not be matched with full confidence \u2014 '
      + 'confirm by title plan or survey. Any land size or frontage you entered is treated as user-entered.'
      + conflictHtml(rp.conflict)
      + '</div>';
  }

  // Legacy fallback / default — explicitly "needs review", never verified.
  return '<div style="' + box + '">'
    + '<span style="font-weight:700;color:var(--text)">Parcel signal needs review</span> ' + '\u2014 '
    + 'confirm by title plan or survey. The parcel/lot shown on the map is an approximate signal only and '
    + 'may not be the exact property. It is not confirmed, not a boundary, and not a survey. '
    + 'Any land size or frontage you entered is treated as user-entered and not independently verified.'
    + (rp ? conflictHtml(rp.conflict) : '')
    + '</div>';
}



function buildScorecard(){
  // Removed: development scorecard replaced by buildVerdictSection
  return '';
}
function calcPlanningStrength(zone,mls,mlsReal,heritage,fsr,height,zoneAllows){
  var s=0;
  if(zoneAllows) s+=3; else if(zone) s+=1;
  if(mlsReal) s+=2; else if(mls>0) s+=1;
  if(!heritage) s+=1;
  if(!fsr) s+=1;
  if(!height) s+=1;
  if(zone&&['R2','R3','R4'].indexOf(zone)>-1) s+=1;
  return Math.min(10,Math.max(0,s));
}

function calcOverlayRisk(heritage,flood,bushfire,acid,contaminated,riparian,landRes,foreshore){
  var s=10;
  if(heritage)     s-=2;
  if(flood)        s-=2;
  if(bushfire)     s-=1;
  if(acid)         s-=1;
  if(contaminated) s-=1.5;
  if(riparian)     s-=1;
  if(landRes)      s-=1;
  if(foreshore)    s-=0.5;
  return Math.max(0,Math.round(s*10)/10);
}

function calcYieldPotential(){
  // Neutralised for launch: SiteVerdict does not compute lot counts, yield scores, or use any
  // minimum-lot fallback. This stub performs no calculation and is intentionally unused.
  // (The old lot-math and yield scoring were removed for violating the no-fake-min-lot rule.)
  return null;
}

function calcApprovalConfidence(zone,heritage,flood,bushfire,zoneAllows,cm){
  var s=5;
  if(zoneAllows) s+=2;
  if(!heritage)  s+=1;
  if(!flood)     s+=0.5;
  if(!bushfire)  s+=0.5;
  if(cm&&cm.data){
    var days=cm.data.days;
    if(days&&days<=60) s+=1;
    else if(days&&days>200) s-=1;
  }
  return Math.min(10,Math.max(0,Math.round(s*10)/10));
}

function calcHoldingCostRisk(cm){
  if(!cm||!cm.data) return 5;
  var days=cm.data.days;
  if(days<=45)  return 9;
  if(days<=90)  return 8;
  if(days<=130) return 7;
  if(days<=180) return 5;
  if(days<=250) return 3;
  return 2;
}

function calcCouncilComplexity(cm){
  if(!cm||!cm.data) return 5;
  var days=cm.data.days;
  if(days<=45)  return 9;
  if(days<=90)  return 8;
  if(days<=150) return 6;
  if(days<=220) return 4;
  return 3;
}

// ── _renderResultInner — builds the base result HTML ─────────────
// Sets innerHTML on #result with the full report card structure.
// All enhancement sections (verdict, scorecard etc) are added by
// the renderResult wrapper AFTER this function runs.
function _renderResultInner(addr,zone,zoneName,lga,mls,block,front,n,cm,heritage,flood,fsr,height,infra,comps,landReserve,foreshore,zoneAllows,mlsReal,acidSulfate,contaminated,riparian,bushfire,seppStation400,seppStation800,seppLightRail800,skipLotCount,overallScore,blockSource,geoSource,geoConf,matchedAddr,addrType,lotNum,councilSource,locationType,paidApiUsed,lotGeoWarn){
  // State detection for overlay display — computed from matchedAddr parameter
  var _addrForState=(matchedAddr||addr||'').toUpperCase();
  var _isNSWAddr=(/\bNSW\b/.test(_addrForState)||(/\b(1[0-9]{3}|2[0-9]{3})\b/.test(_addrForState)&&!/\b(ACT|VIC|QLD|SA|WA|TAS|NT)\b/.test(_addrForState)));
  var resultEl=document.getElementById('result');
  if(!resultEl) return;

  // Signal
  var riskCount=[heritage,flood,bushfire].filter(Boolean).length;
  // Task 1-3: sig and sigLabel must match the score-band, not lot count alone.
  // overallScore is passed in from renderResult wrapper (calculated before this call).
  var _score=overallScore||0;
  var sig, sigLabel;
  if(riskCount>0){
    sig='r';
    sigLabel='Overlays present — professional review required';
  }else if(_score>=80){
    sig='g';
    sigLabel='Facts available — professional verification required';
  }else if(_score>=65){
    sig='a';
    sigLabel='Facts available — needs professional review';
  }else if(_score>=50){
    sig='a';
    sigLabel='Limited facts — professional review required';
  }else if(_score>=35){
    sig='r';
    sigLabel='Limited facts — professional verification required';
  }else if(skipLotCount){
    sig='a';
    sigLabel='Limited facts — land size needed for full analysis';
  }else{
    sig='r';
    sigLabel='Limited facts — professional review required';
  }
  var sigColor={'g':'var(--green)','a':'var(--amber)','r':'var(--red)'}[sig];

  // Lot count display
  var lotsDisplay = (!skipLotCount&&n>=2)?String(n):'—';

  // Council name
  var cmName = cm&&cm.name ? cm.name : (lga||'');

  // Zone label
  var zoneLabels={'R1':'Low density res','R2':'Low density res','R3':'Medium density res','R4':'High density res','R5':'Large lot res','RU1':'Primary production','RU2':'Rural landscape','E4':'Environmental living'};
  var zLabel=(zone&&zoneLabels[zone])||zoneName||(zone?zone+' zone':'Zone unknown');
  // Capture zone for the map fact strip (display mirror only — no scoring/logic change)
  try { window._svZoneName = (zone ? zLabel + ' (' + zone + ')' : zLabel); } catch(e){}
  // Capture LGA/council for the map fact strip (display mirror only — value the result already uses)
  try {
    if (lga) {
      var _lgaClean = String(lga).replace(/\b(\w)(\w*)/g, function(_,a,b){return a+b.toLowerCase();});
      window._svCouncil = /council|city|shire|municipal/i.test(_lgaClean) ? _lgaClean : (_lgaClean + ' Council');
    }
  } catch(e){}

  // Stats row values
  var daMedian = cm&&cm.data ? cm.data.days+'d median' : 'No data';
  var blockDisp = block&&block>0 ? block.toLocaleString('en-AU')+'m\u00b2' : 'Not detected';
  // Land size source tracking (Task 3-4)
  var _lsCadVal   = (window._cadastreArea&&window._cadastreArea>0) ? window._cadastreArea : null;
  var _lsUserVal  = (block&&block>0) ? block : null;
  var _lsUsed     = _lsUserVal || _lsCadVal;
  var _lsIsManual = blockSource==='manual' || (!['auto-detected','estimated','needs-review'].includes(blockSource)&&!!_lsUserVal);
  var _lsSrcLabel = _lsUserVal ? '\u270e Entered / advertised'
    : '\u2014 Not provided';
  var _lsSrcColor = _lsUserVal?'var(--blue)':'var(--muted2)';
  var _lsConflict = false; // auto-detection removed from beta — no conflict check needed

  // Overlays summary
  var ovSummary = [];
  if(heritage)     ovSummary.push('Heritage');
  if(flood)        ovSummary.push('Flood');
  if(bushfire)     ovSummary.push('Bushfire');
  if(acidSulfate)  ovSummary.push('Acid sulfate');
  if(contaminated) ovSummary.push('Contaminated');
  if(riparian)     ovSummary.push('Riparian');
  if(landReserve)  ovSummary.push('Land reservation');
  if(foreshore)    ovSummary.push('Foreshore');
  var ovAllClear = ovSummary.length===0;

  // SEPP note
  var seppNote='';
  if(seppStation400&&seppStation400.name)
    seppNote='<div class="ov ok"><div class="ov-icon">&#9733;</div><div class="ov-body"><div class="ov-title ok">SEPP 2024 — within 400m of '+esc(seppStation400.name,50)+' station ('+Math.round((seppStation400.dist||0)*1000)+'m)</div><div class="ov-desc">Enhanced SEPP 2024 provisions may apply. Housing diversity and minimum lot size provisions may be overridden. Confirm with a licensed town planner.</div><div class="ov-src">Overpass API \u00b7 SEPP Housing 2021 (2024 amendments)</div></div></div>';
  else if(seppStation800&&seppStation800.name)
    seppNote='<div class="ov info"><div class="ov-icon">&#9679;</div><div class="ov-body"><div class="ov-title info">SEPP 2024 — within 800m of '+esc(seppStation800.name,50)+' station ('+Math.round((seppStation800.dist||0)*1000)+'m)</div><div class="ov-desc">800m SEPP zone — more limited provisions than 400m zone. Confirm applicability with a licensed town planner.</div><div class="ov-src">Overpass API</div></div></div>';

  // Planning controls grid
  var mlsConf = mlsReal?'Real LEP value \u00b7 Layer 14 \u00b7 95% confidence':'Zone default \u00b7 confirm real LEP with council';
  var fsrText  = fsr?fsr+':1':'No LEP limit';
  var htText   = height?height+'m':'No LEP limit';

  // Overlay list HTML
  function ovRow(label,clear,src,warn){
    if(clear)  return '<div class="ov ok"><div class="ov-icon">\u2713</div><div class="ov-body"><div class="ov-title ok">'+label+' — Not detected in available layer</div><div class="ov-src">'+src+'</div></div></div>';
    return '<div class="ov warn"><div class="ov-icon">\u26a0</div><div class="ov-body"><div class="ov-title warn">'+label+' \u2014 '+(warn||'Overlay present')+'</div><div class="ov-src">'+src+'</div></div></div>';
  }

  // Comparables
  var compHtml='';
  if(comps&&comps.length){
    compHtml='<div class="comp-list">'
      +comps.map(function(c){
        return '<div class="comp">'
          +'<div class="comp-addr">'+esc(c.addr||'',60)+'</div>'
          +'<div class="comp-val">'+(c.lots||'?')+' lots</div>'
          +'<div class="comp-val">'+(c.cost?'$'+(c.cost/1e6).toFixed(1)+'M':'—')+'</div>'
          +'<div class="comp-val">'+(c.days?c.days+'d':'—')+'</div>'
        +'</div>';
      }).join('')
    +'</div>';
  }

  // Infrastructure
  var infraHtml='';
  if(infra&&infra.transport&&infra.transport.length){
    infraHtml='<div class="infra-grid">'
      +infra.transport.slice(0,3).map(function(s){return'<div class="ifr"><span class="ifr-name">\u25b6 '+esc(s.name,30)+'</span><span class="ifr-dist">'+s.dist+'km</span></div>';}).join('')
      +(infra.health||[]).slice(0,1).map(function(s){return'<div class="ifr"><span class="ifr-name">+ '+esc(s.name,30)+'</span><span class="ifr-dist">'+s.dist+'km</span></div>';}).join('')
    +'</div>';
  } else if(!seppStation400&&!seppStation800){
    infraHtml='<div style="font-size:.7rem;color:var(--muted)">No stations detected within 5km or data unavailable.</div>';
  }

  var H='<div class="rcard">'
    // Header
    +'<div class="rh '+sig+'">'
      +'<div>'
        +'<div class="sig-row" style="font-size:.67rem;display:flex;align-items:center;gap:10px;flex-wrap:wrap">'
        +'<span style="font-size:.57rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted2)">Address:</span> '
        +'<span style="font-weight:600;color:'+(geoConf==='Verified'?'var(--green)':geoConf==='Estimated'?'var(--amber)':'var(--amber)')+'">'+(geoConf||'Needs review')+'</span>'
        +' &middot; <span style="font-size:.57rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted2)">Zone:</span> '
        +'<span style="color:'+(zone?'var(--green)':(_addrForState&&!/\bNSW\b/.test(_addrForState)&&/\b(VIC|QLD|TAS|ACT|SA|WA|NT)\b/.test(_addrForState))?'var(--amber)':'var(--red)')+'">'+(zone||((_addrForState&&!/\bNSW\b/.test(_addrForState)&&/\b(VIC|QLD|TAS|ACT|SA|WA|NT)\b/.test(_addrForState))?'Not connected \u00b7 NSW deep check only':'Not detected'))+'</span>'
        +' &middot; <span style="font-size:.57rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted2)">Parcel:</span> '
        +'<span style="color:'+(blockSource==='auto-detected'?'var(--green)':'var(--amber)')+'">'+(blockSource==='auto-detected'?'Verified':'Needs review')+'</span>'
        +'</div>'
        +'<div class="rh-addr">'+esc(addr,80)+'</div>'
        +'<div class="rh-meta">'+esc(zLabel,60)+' \u00b7 '+esc(cmName,50)+'</div>'
      +'</div>'
    +'</div>'

    // Stats row (facts only — no scoring, no DA-median estimate)
    +'<div class="stats-row">'
      +'<div class="sr"><div class="sr-v '+(zoneAllows?'g':'a')+'">'+esc(zone||'?',6)+'</div><div class="sr-l">Zone</div></div>'
      +'<div class="sr"><div class="sr-v '+(mlsReal?'g':'a')+'">'+(mls||'?')+'m\u00b2</div><div class="sr-l">Min lot</div></div>'
      +'<div class="sr"><div class="sr-v">'+(block&&block>0?esc(block.toLocaleString('en-AU')+'m\u00b2',20):'\u2014')+'</div><div class="sr-l">Land size (entered)</div></div>'
      +'<div class="sr"><div class="sr-v">'+(front&&front>0?esc(front+'m',12):'\u2014')+'</div><div class="sr-l">Frontage (entered)</div></div>'
    +'</div>'



    // CTA handled by buildVerdictSection (injected before close)
  +'</div>';

  resultEl.innerHTML=H;
  resultEl.classList.add('show');
  // Package 99A: reveal optional user-entered inputs below the result (detect first, ask after)
  try { var _uic=document.getElementById('user-input-card'); if(_uic) _uic.style.display='block'; } catch(e){}
  resultEl.scrollIntoView({behavior:'smooth',block:'start'});
  // Layout fix: the parcel map + fact strip load async and shift page height after the
  // initial scroll, which can leave the result header tucked under the sticky nav.
  // Re-apply the scroll once content has settled so the header/stats are never covered.
  setTimeout(function(){ try { resultEl.scrollIntoView({behavior:'smooth',block:'start'}); } catch(e){} }, 1800);

  // Render map preview (display only — does not affect Site Check data)
  try {
    var _mapGeo = window._geoResult;
    if (_mapGeo && _mapGeo.lat && _mapGeo.lon) {
      var _mapAddrU = (_mapGeo.matchedAddr || '').toUpperCase();
      var _mapState = (/\bNSW\b/.test(_mapAddrU) || (/\b(1[0-9]{3}|2[0-9]{3})\b/.test(_mapAddrU) && !/\b(ACT|VIC|QLD|SA|WA|TAS|NT)\b/.test(_mapAddrU)))
        ? 'NSW' : (/\bACT\b/.test(_mapAddrU) ? 'ACT' : /\bVIC\b/.test(_mapAddrU) ? 'VIC'
        : /\bQLD\b/.test(_mapAddrU) ? 'QLD' : /\bSA\b/.test(_mapAddrU) ? 'SA'
        : /\bTAS\b/.test(_mapAddrU) ? 'TAS' : /\bWA\b/.test(_mapAddrU) ? 'WA'
        : /\bNT\b/.test(_mapAddrU) ? 'NT' : 'NSW');
      _renderMap(_mapGeo.lat, _mapGeo.lon, _mapState, _mapGeo.matchedAddr || '');
    }
  } catch(e) { /* map failure is silent */ }
}

// Highest & Best Use Analysis

function buildRiskRegister(){
  // Removed: risk register section replaced by buildVerdictSection
  return '';
}


function buildDevPathway(){
  // Removed: development pathway section replaced by buildVerdictSection
  return '';
}

function buildFullReportPreview(){
  // Removed: find-out pathway now uses buildVerdictSection + CTA
  return '';
}
function buildNextPathways(){
  // Removed: hot-list, sell-lease, finance cards
  return '';
}


function renderResult(addr,zone,zoneName,lga,mls,block,front,n,cm,heritage,flood,fsr,height,infra,comps,landReserve,foreshore,zoneAllows,mlsReal,acidSulfate,contaminated,riparian,bushfire,seppStation400,seppStation800,seppLightRail800,skipLotCount,blockSource,geoSource,geoConf,matchedAddr,addrType,lotNum,councilSource,locationType,paidApiUsed,lotGeoWarn){
  // Package 99C: public Site Check is fact-first and NOT scored.
  // The retired public scoring widgets (kept internal-only) and
  // the report gate are retired from the PUBLIC flow. The scoring functions
  // (calcApprovalConfidence, calcPlanningStrength, etc.) and the CD{} DA dataset
  // remain defined in this file as INTERNAL logic for the future Professional
  // Analysis Engine only. They are intentionally not called for public UI.
  var overall=null; // no public score

  // Run inner renderer (sets innerHTML on #result) — renders map + planning facts
  try{
    _renderResultInner(addr,zone,zoneName,lga,mls,block,front,n,cm,heritage,flood,fsr,height,infra,comps,landReserve,foreshore,zoneAllows,mlsReal,acidSulfate,contaminated,riparian,bushfire,seppStation400,seppStation800,seppLightRail800,skipLotCount,overall,blockSource,geoSource,geoConf,matchedAddr,addrType,lotNum,councilSource,locationType,paidApiUsed,lotGeoWarn);
  }catch(e){console.error("_renderResultInner failed:",e); return;}

  var resultEl=document.getElementById('result');
  var rcard=resultEl?resultEl.querySelector('.rcard'):null;
  if(!rcard){console.warn("rcard not found after render"); return;}

  // 99C: the truthful story card (Map + What we found / What this means /
  // Sections: What we found / What this means / What still needs checking / Next useful step / Professional Review
  try{
    var ctaBox=rcard.querySelector('.cta-box');
    var newSections=document.createElement('div');
    newSections.innerHTML=buildVerdictSection(addr,zone,lga,n,cm,heritage,flood,bushfire,
      seppStation400,seppStation800,mls,mlsReal,block,front,geoConf,blockSource,lotGeoWarn,fsr,height,matchedAddr,
      infra,(typeof window!=='undefined'&&window._svPurpose)?window._svPurpose:undefined);
    if(ctaBox){rcard.insertBefore(newSections,ctaBox);}else{rcard.appendChild(newSections);}
  }catch(e){console.warn("Story sections render failed",e);}

  // Report gate removed — single Professional Review CTA flow

  // 4. Post-render DOM enhancements: add whtm to inner sections
  try{
    // Add source badge to DA timeline section
    var ctrlSrcs = rcard.querySelectorAll('.ctrl-src');
    ctrlSrcs.forEach(function(el){
      var txt = el.textContent||'';
      if(txt.indexOf('real DA')>-1 && !el.querySelector('.src-badge')){
        el.innerHTML = '<span class="src-badge">&#9679; '+txt+'</span>';
      }
    });
    // Add whtm to planning controls section
    var ctrl0 = rcard.querySelector('.ctrl-grid');
    if(ctrl0 && !ctrl0.nextElementSibling?.classList?.contains('whtm')){
      var w1=document.createElement('div');
      w1.className='whtm';
      w1.innerHTML='<strong>Why this matters:</strong> Zone and minimum lot size help indicate whether subdivision may be worth reviewing, subject to survey, access, services, overlays and council controls. Every other check depends on getting these right.';
      ctrl0.insertAdjacentElement('afterend',w1);
    }
    // Add whtm to overlays section
    var ovList = rcard.querySelector('.ov-list');
    if(ovList && !ovList.previousElementSibling?.classList?.contains('whtm')){
      var w2=document.createElement('div');
      w2.className='whtm';
      w2.style.marginBottom='8px';
      w2.innerHTML='<strong>Why this matters:</strong> Each overlay adds cost, time or constraints to the DA process. A clean result here is a positive early planning signal, but it does not rule out other DA-stage reports or site-specific requirements. Confirm with council or a qualified professional before relying on it.';
      ovList.insertAdjacentElement('beforebegin',w2);
    }
  }catch(e){}

}




function prepareForAI(addr,zone,zoneName,lga,mls,block,front,n,cm,heritage,flood,fsr,height,infra,comps,landReserve,foreshore,zoneAllows,mlsReal,acidSulfate,contaminated,riparian,bushfire,sepp400,sepp800,skipLotCount){
  return {
    address: addr,
    zone: { code: zone||'', name: zoneName||'', lga: lga||'' },
    minLot: { value: mlsReal ? mls : null, verified: !!mlsReal },
    block:  { area: block||0, verified: !!(block&&block>100) },
    estimatedLots: (!skipLotCount && n>=0) ? n : 0,
    zoneAllows: !!zoneAllows,
    overlays: {
      heritage:      !!(heritage),
      heritageName:  heritage?heritage.name||'Heritage item':'',
      flood:         !!flood,
      bushfire:      !!bushfire,
      acidSulfate:   acidSulfate||null,
      contaminated:  !!contaminated,
      riparian:      !!riparian,
      landReservation: landReserve||null,
      foreshore:     !!foreshore,
    },
    controls: { fsr: fsr||null, height: height||null },
    sepp: {
      within400m:    !!sepp400,
      within800m:    !!(sepp400||sepp800),
      stationName400: sepp400?sepp400.name:'',
      stationName800: sepp800?sepp800.name:sepp400?sepp400.name:'',
    },
    council: cm&&cm.data ? {
      name:        cm.name||lga||'',
      daysMedian:  cm.data.days,
      range:       cm.data.range||'',
      sampleSize:  cm.data.n||0,
    } : null,
    comparables: (comps||[]).slice(0,3).map(function(c){
      return { address:c.addr||'', lots:c.lots||0, cost:c.cost||0, days:c.days||0 };
    }),
    infrastructure: {
      stations: (infra&&infra.transport||[]).slice(0,2).map(function(s){
        return { name:s.name, dist:s.dist };
      }),
    },
  };
}

// Render AI verdict section (replaces rule-based verdict in-place)



function toggleReg(){var e=document.getElementById("reg-box");e&&e.classList.toggle("show")}function saveResult(){var e=document.getElementById("rn").value.trim(),t=document.getElementById("re").value.trim(),a=document.getElementById("rp").value.trim();if(e&&t&&a){var r=document.getElementById("reg-box");r&&(r.innerHTML='<div style="font-size:.8rem;color:var(--green);padding:4px 0">✓ Saved. We will send you updates for this address.</div>')}else alert("Please fill in all three fields.")}function goReport(){var el=document.getElementById("result");if(el&&el.querySelector(".rcard")){el.scrollIntoView({behavior:"smooth",block:"start"});}else{runCheck();}}function goSample(){window.location.href="/services";}document.addEventListener("keydown",function(e){"Enter"===e.key&&"INPUT"===document.activeElement.tagName&&runCheck()});
// Package 97: show a calm base map on arrival (map-app feel). Display-only.
// Reuses _ensureBaseMap; _renderMap reuses the same instance after a check.
(function _svInitBaseMap(){
  function tryInit(attempts){
    if (typeof L !== 'undefined' && document.getElementById('map-card')) {
      try { _ensureBaseMap(); } catch(e) {}
      return;
    }
    if (attempts > 0) setTimeout(function(){ tryInit(attempts-1); }, 200);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ tryInit(15); });
  } else {
    tryInit(15);
  }
})();
