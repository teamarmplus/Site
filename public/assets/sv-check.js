/* SiteVerdict — Site Check Engine v2.0
   All 16 government APIs preserved.
   Executive Verdict + Institutional Scorecard added.
   Report gate via localStorage.
   Registration via Netlify Forms.
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
var GATE_KEY='sv_reports_used';
function gateUsed(){return parseInt(localStorage.getItem(GATE_KEY)||'0',10);}
function gateIncrement(){localStorage.setItem(GATE_KEY,gateUsed()+1);}
function gateIsFree(){return gateUsed()<1;}

// ── REGISTRATION MODAL ───────────────────────────────
function openRegModal(reason){
  var m=document.getElementById('reg-modal');
  if(m){
    var r=document.getElementById('reg-reason');
    if(r)r.textContent=reason||'Register to unlock your free full report.';
    m.classList.add('open');
  }
}
function goFocusBlock(){var b=document.getElementById("block");if(b)b.focus();}
function closeRegModal(){
  var m=document.getElementById('reg-modal');
  if(m)m.classList.remove('open');
}

// ── REPORT GATE ──────────────────────────────────────────────────
// First report free via localStorage. After that, show registration CTA.
// No Supabase/Stripe yet — localStorage MVP.
function buildReportGate(){
  if(gateIsFree()){
    gateIncrement();
    return '';
  }
  return '<div class="gate-box">'
    +'<div class="gate-title">Your free report has been used</div>'
    +'<div class="gate-sub">Register free to unlock another full intelligence report. No payment required. No subscription.</div>'
    +'<div class="gate-btns">'
      +'<button class="btn btn-gold" onclick="openRegModal()">Register free →</button>'
      +'<button class="btn btn-outline btn-sm" onclick="chatPro()">Ask us a question first</button>'
    +'</div>'
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
function chatPro(){window.open("https://wa.me/61402623628?text=Hi+SiteVerdict+I+want+to+chat+with+a+professional","_blank")}var MF={R1:12,R2:12,R3:9,R4:9,RU1:50,RU2:50,RU4:2e3},CD={ALBURY:{days:63,range:"53-63",n:3},BATHURST:{days:43,range:"33-73",n:3},BLACKTOWN:{days:153,range:"40-399",n:12},BYRON:{days:189,range:"14-393",n:6},CAMDEN:{days:45,range:"2-375",n:12},CAMPBELLTOWN:{days:109,range:"109-329",n:3},"CANADA BAY":{days:206,range:"127-557",n:5},CANTERBURY:{days:49,range:"5-448",n:62},BANKSTOWN:{days:49,range:"5-448",n:62},"CENTRAL COAST":{days:89,range:"21-165",n:8},CESSNOCK:{days:85,range:"50-110",n:3},"COFFS HARBOUR":{days:73,range:"65-168",n:3},CUMBERLAND:{days:186,range:"48-361",n:8},FAIRFIELD:{days:177,range:"136-177",n:2},GOULBURN:{days:122,range:"15-292",n:6},"INNER WEST":{days:119,range:"54-166",n:9},"LAKE MACQUARIE":{days:131,range:"41-474",n:15},LIVERPOOL:{days:314,range:"71-425",n:14},MAITLAND:{days:23,range:"18-85",n:4},NEWCASTLE:{days:122,range:"73-360",n:11},"NORTH SYDNEY":{days:279,range:"194-279",n:2},"NORTHERN BEACHES":{days:160,range:"90-173",n:3},PARRAMATTA:{days:133,range:"2-243",n:24},PENRITH:{days:204,range:"74-386",n:9},"PORT MACQUARIE":{days:281,range:"97-281",n:2},"PORT STEPHENS":{days:85,range:"1-92",n:3},RYDE:{days:86,range:"5-86",n:4},SHELLHARBOUR:{days:71,range:"7-392",n:8},SHOALHAVEN:{days:108,range:"3-171",n:6},SUTHERLAND:{days:118,range:"35-315",n:28},"THE HILLS":{days:148,range:"70-199",n:9},WAVERLEY:{days:332,range:"132-332",n:2},WOLLONDILLY:{days:480,range:"175-480",n:2},WOLLONGONG:{days:70,range:"15-233",n:12},WOOLLAHRA:{days:232,range:"208-232",n:2}};
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
function gc(e,suburbHint,postcodeHint){if(!e){var _fb0=gcSuburb(suburbHint,postcodeHint);return _fb0||{name:"",data:null,councilKnown:false,daTimelineCoverage:false,councilSource:"unknown"};}var t=e.toUpperCase().replace(/\bCITY COUNCIL\b/g,"").replace(/\bSHIRE COUNCIL\b/g,"").replace(/\bMUNICIPAL COUNCIL\b/g,"").replace(/\bREGIONAL COUNCIL\b/g,"").replace(/\bCOUNCIL\b/g,"").replace(/\bCITY\b/g,"").replace(/\bSHIRE\b/g,"").replace(/\bMUNICIPAL\b/g,"").replace(/\bREGIONAL\b/g,"").replace(/\bOF\b/g,"").replace(/\s+/g," ").trim();if(CD[t])return{name:t,data:CD[t],councilKnown:true,daTimelineCoverage:true,councilSource:"planning-portal"};for(var a in CD)if(t.indexOf(a)>-1||a.indexOf(t)>-1)return{name:a,data:CD[a],councilKnown:true,daTimelineCoverage:true,councilSource:"planning-portal"};if(KC[t])return{name:KC[t].displayName||t,data:null,councilKnown:true,daTimelineCoverage:KC[t].daTimelineCoverage,councilSource:"planning-portal"};for(var b in KC){if(t.indexOf(b)>-1||b.indexOf(t)>-1)return{name:KC[b].displayName||b,data:null,councilKnown:true,daTimelineCoverage:KC[b].daTimelineCoverage,councilSource:"planning-portal"};}var sbFb=gcSuburb(suburbHint||e,postcodeHint);if(sbFb)return sbFb;return{name:e,data:null,councilKnown:false,daTimelineCoverage:false,councilSource:"unknown"}}function calcLots(e,t,a,r){var s=Math.floor(e/a);return!t||t<3?s:Math.max(0,Math.min(s,Math.floor(t/(MF[r]||12))))}function getSig(e,t,a){if(e<2)return"r";var r=(e>=4?3:e>=3?2:1)+(t<=90?3:t<=150?2:1)+(a>=80?3:a>=70?2:1);return r>=7?"g":r>=4?"a":"r"}function setSt(e){document.getElementById("status").textContent=e;}
// ── SHARED GEOCODING ─────────────────────────────────────────────
// Used by both autoLookupBlock() and runCheck() so coordinates match.
// ── ADDRESS CLEANING UTILITIES ───────────────────────────────────
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
  // Extract suburb and postcode from address for fallback geocoding.
  // Works for normal, range and lot-based inputs such as:
  // "Lot 109, St Moritz Street, Austral, NSW 2179" and "6 Fenton Street, Panania NSW 2213".
  var streetWords=/\b(street|st|road|rd|avenue|ave|drive|dr|close|cl|place|pl|court|ct|crescent|cres|boulevard|bvd|parade|pde|lane|ln|highway|hwy)\b/i;
  var tail = addr.match(/,\s*([A-Za-z][A-Za-z\s'\-]+?)\s*,?\s*NSW\s*(\d{4})?\s*$/i);
  if(tail && !streetWords.test(tail[1])) return tail[1].trim() + ' NSW' + (tail[2] ? ' ' + tail[2] : '');
  var simple = addr.trim().match(/^([A-Za-z][A-Za-z\s'\-]+?)\s+NSW\s*(\d{4})?\s*$/i);
  if(simple && !streetWords.test(simple[1])) return simple[1].trim() + ' NSW' + (simple[2] ? ' ' + simple[2] : '');
  var parts = addr.split(',');
  if(parts.length >= 2){
    var last = parts[parts.length-1].trim();
    var prev = parts[parts.length-2].trim();
    var m = (prev+' '+last).match(/([A-Za-z][A-Za-z\s'\-]+?)\s+NSW\s*(\d{4})?/i);
    if(m && !streetWords.test(m[1])) return m[1].trim() + ' NSW' + (m[2] ? ' ' + m[2] : '');
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
  'CANLEY HEIGHTS':    {name:'Fairfield City Council',              postcode:'2166'},
  'CANLEY VALE':       {name:'Fairfield City Council',              postcode:'2166'},
  'CABRAMATTA':        {name:'Fairfield City Council',              postcode:'2166'},
  'FAIRFIELD':         {name:'Fairfield City Council',              postcode:'2165'},
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
  'RICHMOND':          {name:'Hawkesbury City Council',             postcode:'2753'}
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



function _showAddrNotFound(resultEl, n, addr){
  var wa = "https://wa.me/61402623628?text=" + encodeURIComponent("SiteVerdict manual review request: " + addr);
  resultEl.innerHTML = [
    "<div style=\"max-width:620px;margin:0 auto;padding:24px;background:var(--bg2);border:1px solid var(--border);border-radius:16px\">",
    "  <div style=\"font-size:.72rem;color:var(--amber);margin-bottom:8px\">&#9888; Address not confidently verified</div>",
    "  <div style=\"font-size:.84rem;font-weight:500;margin-bottom:10px\">" + addr + " could not be matched to a known NSW address.</div>",
    "  <div style=\"font-size:.74rem;color:var(--muted);line-height:1.8;margin-bottom:10px\">Try one of these:</div>",
    "  <ul style=\"font-size:.72rem;color:var(--muted);line-height:2;margin-bottom:14px;padding-left:18px\">",
    "    <li>Check the full address includes street, suburb, state and postcode</li>",
    "    <li>Avoid unit numbers — enter the main street address only (e.g. 20 Smith Street)</li>",
    "    <li>For range addresses (e.g. 39-45), try the first number only</li>",
    "    <li>Enter block size manually below and run the check again</li>",
    "  </ul>",
    "  <div style=\"display:flex;gap:10px;flex-wrap:wrap\">",
    "    <button class=\"btn btn-gold\" onclick=\"document.getElementById('addr').focus()\">Try a different address</button>",
    "    <a href=\"" + wa + "\" class=\"btn btn-outline\" target=\"_blank\" style=\"text-decoration:none\">Request manual review via WhatsApp</a>",
    "  </div>",
    "</div>"
  ].join("");
  resultEl.classList.add("show");
  setSt("");
  n.disabled = false;
  n.textContent = "Check this property \u2192";
}

async function geocodeWithConfidence(addr){
  // Try server-side geocode first (stronger, no CORS issues, Google API if configured)
  try {
    var res = await fetch('/.netlify/functions/geocode?address=' + encodeURIComponent(addr));
    if (res.ok) {
      var data = await res.json();
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
          lotWarning: data.lotWarning || null
        };
      }
    }
  } catch(e) {
    console.warn('Server geocode failed, falling back to browser:', e);
  }

  // Browser-side fallback (if server function unavailable)
  var nom     = 'https://nominatim.openstreetmap.org/search?format=json&limit=3&accept-language=en';
  var cleaned = cleanAddressForGeocode(addr);
  var parts   = extractAddressParts(addr);
  var suburb  = extractSuburbPostcode(addr);

  // Tightened NSW bbox: upper bound -28.5 excludes QLD border ambiguity
  function inNSW(lat, lon) {
    return lat >= -37.6 && lat <= -28.5 && lon >= 140.9 && lon <= 153.7;
  }

  var strategies = [
    { q: addr + ' NSW Australia', conf: 'Verified', label: 'Exact+NSW' },
    cleaned !== addr
      ? { q: cleaned + ' NSW Australia', conf: 'Verified', label: 'Cleaned+NSW' }
      : null,
    parts
      ? { structured: true, street: parts.number+' '+parts.streetName,
          city: parts.suburb, postcode: parts.postcode, conf: 'Verified', label: 'Structured' }
      : null,
    { q: addr, conf: 'Verified', label: 'Exact (au)', extra: '&countrycodes=au' },
    parts
      ? { q: parts.streetName+', '+parts.suburb+' NSW '+parts.postcode+' Australia',
          conf: 'Estimated', label: 'Street name' }
      : null,
    suburb
      ? { q: suburb + ' NSW Australia', conf: 'Estimated', label: 'Suburb fallback' }
      : null,
  ].filter(Boolean);

  for (var i = 0; i < strategies.length; i++) {
    var s = strategies[i];
    try {
      var url;
      if (s.structured) {
        url = nom + '&street=' + encodeURIComponent(s.street)
          + '&city=' + encodeURIComponent(s.city)
          + (s.postcode ? '&postalcode=' + encodeURIComponent(s.postcode) : '')
          + '&country=AU';
      } else {
        url = nom + '&q=' + encodeURIComponent(s.q) + (s.extra||'');
      }
      var r = await fetch(url);
      var j = await r.json();
      if (j && j.length) {
        for (var k = 0; k < j.length; k++) {
          var hit = j[k];
          var lat = parseFloat(hit.lat), lon = parseFloat(hit.lon);
          if (inNSW(lat, lon)) {
            console.log('Geocode (browser):', s.label, lat, lon, hit.display_name);
            return { lat, lon, raw: hit, source: 'Nominatim ('+s.label+')', confidence: s.conf };
          }
        }
      }
    } catch(e) { console.warn('Geocode strategy ('+s.label+') failed:', e); }
  }
  return null;
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

    document.getElementById("block").value=best.area;
    statusEl.innerHTML="✓ "+best.area+"m²"+(best.lot?" ("+best.lot+")":"")
      +' from NSW Cadastre · <span style="font-size:.64rem;color:var(--muted2)">Approximate only — confirm with title/survey</span>'
      +' · <span style="text-decoration:underline;cursor:pointer;color:var(--gold)" onclick="goFocusBlock()">edit</span>';
    console.log("Auto-detect success:",best.area,"m²");
  }catch(e){
    console.error("Auto-detect failed:",e);
    statusEl.innerHTML='<span style="color:var(--muted)">Could not auto-detect block size. Please enter it manually.</span>';
    btn.style.display="";
  }
}
async function runCheck(){var e=document.getElementById("addr").value.trim(),t=parseFloat(document.getElementById("block").value),a=document.getElementById("front"),r=a&&a.value?parseFloat(a.value):15;if(e){var s=!t||t<100,n=document.getElementById("run-btn");n.disabled=!0,n.textContent="Checking...";var i=document.getElementById("result");i.innerHTML="",i.classList.remove("show");var o=document.getElementById("block-lookup-status");o&&(o.textContent="");if(window._loadingTimer){clearInterval(window._loadingTimer);window._loadingTimer=null;}var _geoResult=null;window._parcelConfidence=null;window._parcelWarning=null;setSt("Finding your address...");try{var _geoResult=await geocodeWithConfidence(e);var _geo=_geoResult;if(!_geo){_showAddrNotFound(i,n,e);return;}

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
    if(!_postcodeHint && _geo.postcode) _postcodeHint = _geo.postcode;
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
    var _lotGeoWarn    = _geo.lotWarning || null;
    // For Google: ROOFTOP = exact; RANGE_INTERPOLATED = estimated; GEOMETRIC_CENTER/APPROXIMATE = suburb
    var _googleLocConf = _locationType==='ROOFTOP'?'Verified'
      :_locationType==='RANGE_INTERPOLATED'?'Estimated'
      :_locationType?'Needs review':'';
    // Recalculate addrConfidence using Google locationType when available.
    // But Google address match is not parcel verification: lot and range inputs stay conservative.
    if(_geoIsGoogle && _googleLocConf) _addrConfidence = _googleLocConf;
    if(_isLot) _addrConfidence = 'Needs review';
    else if(_isRange && _addrConfidence === 'Verified') _addrConfidence = 'Estimated';
    // Street-only and lot-geocoded-by-suburb are always Needs review
    if(_addrType==='street-only' || _isLotGeocode) _addrConfidence = 'Needs review';
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
    }var v=_geo.lat,u=_geo.lon,m=20037508.34*u/180,p=Math.log(Math.tan((90+v)*Math.PI/360))/(Math.PI/180)*20037508.34/180,g=encodeURIComponent(JSON.stringify({x:m,y:p,spatialReference:{wkid:102100}})),y="https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/Planning/Principal_Planning_Layers/MapServer";setSt("Checking zone, heritage, flood and overlays...");var[f,h,b,L,S,R,A,E,w,P,C,I]=await Promise.all([fetch(y+"/11/query?geometry="+g+"&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&outFields=LAY_CLASS,SYM_CODE,LGA_NAME&returnGeometry=false&f=json"),fetch(y+"/14/query?geometry="+g+"&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&outFields=LOT_SIZE&returnGeometry=false&f=json"),fetch(y+"/8/query?geometry="+g+"&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&outFields=H_NAME,H_ID,LEGIS_REF_CLAUSE&returnGeometry=false&f=json"),fetch(y+"/4/query?geometry="+g+"&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&outFields=FSR_MAX,LAY_CLASS&returnGeometry=false&f=json"),fetch(y+"/7/query?geometry="+g+"&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&outFields=HEIGHT_MAX,LAY_CLASS&returnGeometry=false&f=json"),fetch("https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/Planning/EPI_Flood_Planning_Area/MapServer/0/query?geometry="+g+"&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&outFields=*&returnGeometry=false&f=json"),fetch(y+"/16/query?geometry="+g+"&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&outFields=RESERVE_TYPE,LAY_CLASS&returnGeometry=false&f=json"),fetch(y+"/18/query?geometry="+g+"&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&outFields=LAY_CLASS&returnGeometry=false&f=json"),fetch(y+"/15/query?geometry="+g+"&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&outFields=LAY_CLASS,ACID_CLASS&returnGeometry=false&f=json").catch(()=>({json:()=>({features:[]})})),fetch(y+"/17/query?geometry="+g+"&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&outFields=LAY_CLASS&returnGeometry=false&f=json").catch(()=>({json:()=>({features:[]})})),fetch(y+"/13/query?geometry="+g+"&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&outFields=LAY_CLASS&returnGeometry=false&f=json").catch(()=>({json:()=>({features:[]})})),fetch("https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/Planning/Bush_Fire_Prone_Land/MapServer/0/query?geometry="+g+"&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&outFields=*&returnGeometry=false&f=json").catch(()=>({json:()=>({features:[]})}))]),[N,k,x,M,U,T,B,D,H,F,_,O]=await Promise.all([f.json(),h.json(),b.json(),L.json(),S.json(),R.json(),A.json(),E.json(),w.json(),P.json(),C.json(),I.json()]),j=B.features&&B.features.length?B.features[0].attributes.RESERVE_TYPE||B.features[0].attributes.LAY_CLASS||"Yes":null,z=D.features&&D.features.length>0,G=H.features&&H.features.length?H.features[0].attributes.ACID_CLASS||H.features[0].attributes.LAY_CLASS||"Yes":null,W=F.features&&F.features.length>0,q=_.features&&_.features.length>0,Y=O.features&&O.features.length>0,Z="",K="",V="";if(N.features&&N.features.length){var $=N.features[0].attributes;Z=$.SYM_CODE||"",K=$.LAY_CLASS||"",V=$.LGA_NAME||""}var X={R1:450,R2:450,R3:400,R4:350,R5:2e3,R6:450,RU1:4e3,RU2:4e3,RU3:4e3,RU4:2e3,RU5:2e3,RU6:4e3,E3:2e3,E4:500,C4:400,UR:500,MU1:400,MU2:400,SP1:2e3,SP2:4e3},Q=!1,J=X[Z]||450;if(k.features&&k.features.length&&k.features[0].attributes.LOT_SIZE){var ee=k.features[0].attributes.LOT_SIZE;ee>=({R1:50,R2:50,R3:50,R4:50,R5:100,R6:100,RU1:500,RU2:500,RU3:500,RU4:500,RU5:500,RU6:500,E4:100}[Z]||50)?(J=ee,Q=!0):(Q=!1,J=X[Z]||450,console.warn("Min lot size sanity fail: "+ee+"m² for zone "+Z+" — using zone default"))}var te=["R1","R2","R3","R4","R5","R6","RU1","RU2","RU3","RU4","RU5","RU6","E4","E3","C4","UR","MU1","MU2","B4","SP1","SP2"].indexOf(Z)>-1,ae=null;if(x.features&&x.features.length){var re=x.features[0].attributes;ae={name:re.H_NAME,clause:re.LEGIS_REF_CLAUSE}}var se=M.features&&M.features.length?M.features[0].attributes.FSR_MAX||M.features[0].attributes.LAY_CLASS:null,ne=U.features&&U.features.length?U.features[0].attributes.HEIGHT_MAX||U.features[0].attributes.LAY_CLASS:null,ie=T.features&&T.features.length>0;setSt("Loading infrastructure and comparable projects...");var oe=gc(V||(_geoResult&&_geoResult.council)||'',_geoResult&&_geoResult.suburbHint,_geoResult&&_geoResult.postcodeHint),le=(oe&&oe.name,fetch("/.netlify/functions/daleads?mode=comps&council="+encodeURIComponent(V||"")+"&lat="+v+"&lng="+u).catch(()=>null)),de=fetch("https://overpass-api.de/api/interpreter",{method:"POST",body:"data="+encodeURIComponent('[out:json];(node["railway"~"station|halt"](around:5000,'+v+","+u+');node["amenity"~"hospital"](around:5000,'+v+","+u+');node["shop"~"supermarket"](around:2000,'+v+","+u+"););out;")}).catch(()=>null),[ce,ve]=await Promise.all([le,de]),ue=[];if(ce)try{var me=await ce.json();for(var pe of me.comps||[])if(ue.push({addr:pe.address||"",lots:pe.lots||2,cost:pe.cost||0,days:pe.days||0}),ue.length>=3)break}catch(e){console.warn("DA Leads comps parse failed",e);ue=[];}var ge={transport:[],health:[],shopping:[]};if(ve)try{var ye=await ve.json();for(var fe of ye.elements||[]){var he=fe.tags||{},be=he.name;if(be){var Le=Math.round(1110*Math.sqrt(Math.pow((fe.lat||0)-v,2)+Math.pow((fe.lon||0)-u,2)))/10,Se=he.railway?"transport":"hospital"==he.amenity?"health":"shopping";ge[Se].length<3&&ge[Se].push({name:be,dist:Le})}}}catch(e){}var seppStation400=null,seppStation800=null,seppLightRail800=null;(ge.transport||[]).forEach(function(_st){if(_st.dist<=0.4&&!seppStation400)seppStation400=_st;if(_st.dist<=0.8&&!seppStation800)seppStation800=_st;});setSt("");var Re=calcLots(t,r,J,Z);s&&(Re=0),renderResult(e,Z,K,V,J,t,r,Re,oe,ae,ie,se,ne,ge,ue,j,z,te,Q,G,W,q,Y,seppStation400,seppStation800,seppLightRail800,s,(s&&window._parcelConfidence&&window._parcelConfidence!=='Not found'?window._parcelConfidence==='Verified'?'auto-detected':window._parcelConfidence==='Estimated'?'estimated':window._parcelConfidence==='Needs review'?'needs-review':'auto-detected':s?'auto-detected':'manual'),_geoResult&&_geoResult.source?_geoResult.source:'',_geoResult&&_geoResult.addrConfidence?_geoResult.addrConfidence:(_geoResult&&_geoResult.confidence?_geoResult.confidence:''),_geoResult&&_geoResult.matchedAddr?_geoResult.matchedAddr:'',_geoResult&&_geoResult.addrType?_geoResult.addrType:'normal',_geoResult&&_geoResult.lotNum?_geoResult.lotNum:null,oe&&oe.councilSource?oe.councilSource:'',_geoResult&&_geoResult.locationType?_geoResult.locationType:'',_geoResult&&_geoResult.paidApiUsed?_geoResult.paidApiUsed:false,_geoResult&&_geoResult.lotGeoWarn?_geoResult.lotGeoWarn:null)}catch(e){console.error("SiteVerdict runCheck failed:",e);setSt("Something went wrong: "+(e&&e.message?e.message:"Unknown error. Check browser console."));}n.disabled=!1,n.textContent="Check this property →"}else setSt("Please enter a property address.")}



// ── LOADING STATE MANAGER ─────────────────────────────
var _loadingTimer = null;
var _loadingMsgs = [
  'Verifying address…',
  'Checking zone and planning controls…',
  'Analysing 16+ overlay data sources…',
  'Calculating development potential…',
  'Reviewing council DA timelines…',
  'Compiling intelligence report…'
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
    try { await _orig.apply(this, arguments); }
    catch(e){
      console.error('runCheck wrapper caught:', e);
      setSt('Something went wrong. Please try again.');
    }
    finally {
      _checking = false;
      hideSkeleton();
      // Always re-enable button so repeat searches always work
      var btn = document.getElementById('run-btn');
      if(btn){ btn.disabled = false; btn.textContent = 'Check this property →'; }
      setSt('');
    }
  };
})();

// ── WHY THIS MATTERS HELPER ───────────────────────────
function whtm(text){
  return '<div class="whtm"><strong>Why this matters:</strong> '+text+'</div>';
}
// ── HTML ESCAPE ─────────────────────────────────────────────────
// Sanitises all AI-generated text before inserting into innerHTML
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
function srcBadge(type, text){
  var cls = type==='live'?'src-badge':type==='est'?'src-badge est':'src-badge unv';
  return '<span class="'+cls+'"><span class="src-badge-dot"></span>'+text+'</span>';
}

// ── VERDICT LABEL FROM SCORE (v2.2 — score-band primary) ──────────
// Task 1+2+3: score is the single source of truth for verdict label.
// Never use lot count alone to determine verdict wording.
function verdictLabelFromScore(score){
  if(score>=80) return 'Strong development opportunity';
  if(score>=65) return 'High-value review opportunity — professional verification required';
  if(score>=50) return 'Moderate potential — key constraints to verify';
  if(score>=35) return 'Limited potential — proceed carefully';
  return 'Low development potential';
}
function scoreRangeBand(score){
  if(score>=80) return 'STRONG DEVELOPMENT OPPORTUNITY';
  if(score>=65) return 'REVIEW OPPORTUNITY';
  if(score>=50) return 'MODERATE POTENTIAL';
  if(score>=35) return 'LIMITED POTENTIAL';
  return 'LOW DEVELOPMENT POTENTIAL';
}
// ── IMPROVED buildVerdictSection ──────────────────────
function buildVerdictSection(addr,zone,lga,n,cm,heritage,flood,bushfire,sepp400,sepp800,mls,mlsReal,block,overallScore){
  var days = cm&&cm.data ? cm.data.days : null;
  var zLabel = ({'R1':'Low density residential','R2':'Low density residential','R3':'Medium density residential','R4':'High density residential','R5':'Large lot residential','RU1':'Primary production','RU2':'Rural landscape','RU4':'2ha rural','E4':'Environmental living'})[zone] || (zone?zone+' zone':'Unknown zone');

  var hasMajorOverlay=!!(heritage||flood||bushfire);
  var verdict, verdictColor, verdictRange;
  // Task 1+4: Verdict from score band (primary) + overlay check
  // Score 80+: Strong | 65-79: Review | 50-64: Moderate | 35-49: Limited | <35: Low
  if(hasMajorOverlay){
    verdict='Proceed with caution — professional review required';
    verdictColor='var(--red)';
    verdictRange='Caution required';
  }else if(overallScore>=80){
    verdict='Strong development opportunity';
    verdictColor='var(--green)';
    verdictRange='Strong';
  }else if(overallScore>=65){
    verdict='High-value review opportunity — professional verification required';
    verdictColor='var(--amber)';
    verdictRange='Review opportunity';
  }else if(overallScore>=50){
    verdict='Moderate potential — key constraints to verify';
    verdictColor='var(--amber)';
    verdictRange='Moderate potential';
  }else if(overallScore>=35){
    verdict='Limited potential — proceed carefully';
    verdictColor='var(--red)';
    verdictRange='Limited potential';
  }else{
    verdict='Low development potential';
    verdictColor='var(--red)';
    verdictRange='Low potential';
  }

  var approvalPct = 55;
  if(zone&&['R2','R3','R4'].indexOf(zone)>-1) approvalPct += 15;
  if(!heritage) approvalPct += 5;
  if(!flood)    approvalPct += 5;
  if(!bushfire) approvalPct += 3;
  if(n>=2)      approvalPct += 5;
  if(days&&days>250) approvalPct -= 10;
  if(days&&days<=90) approvalPct += 5;
  approvalPct = Math.min(90,Math.max(20,approvalPct));

  var timeline = 'Unknown';
  if(days) timeline = (Math.round(days/30)+3)+'\u2013'+(Math.round(days/30)+9)+' months';

  var riskCount = [heritage,flood,bushfire].filter(Boolean).length;
  var riskLabel = riskCount===0?'Low':riskCount===1?'Medium':'High';
  var riskColor = riskCount===0?'var(--green)':riskCount===1?'var(--amber)':'var(--red)';

  // Hidden upside — what most buyers miss
  var hiddenUpside = '';
  if(mlsReal && mls<450) hiddenUpside = 'Min lot '+mls+'m\u00b2 (real LEP) \u2014 zone default is 450m\u00b2. Yields '+(block?Math.floor(block/mls):n)+' vs '+(block?Math.floor(block/450):'fewer')+' lots under default.';
  else if(n>=4) hiddenUpside = zone+' zone with '+n+'-lot LEP yield. Most comparable listings priced as single residences.';
  else if(sepp400) hiddenUpside = 'Within 400m of train station \u2014 SEPP 2024 provisions may apply, overriding standard LEP controls.';
  else hiddenUpside = n>=2?'Subdivision permissible in '+zLabel+' with '+n+' potential lots.':'Review DCP requirements for secondary dwelling options.';

  // Primary risk
  var primaryRisk = '';
  if(heritage) primaryRisk = 'Heritage overlay requires Impact Statement. Adds cost and DA complexity.';
  else if(flood) primaryRisk = 'Flood planning area. Hydraulic assessment required for DA.';
  else if(!days && cm && cm.councilKnown && !cm.daTimelineCoverage)
    primaryRisk = 'Council identified, but DA timeline coverage is not yet available for this council.';
  else if(!days && cm && cm.councilKnown)
    primaryRisk = 'Council identified \u2014 DA timeline coverage not yet available.';
  else if(!days)
    primaryRisk = 'Council not identified from address \u2014 DA timeline unavailable. Enter full address with suburb and postcode.';
  else if(days>250) primaryRisk = 'Council DA median '+days+'d \u2014 high holding cost risk. Allow 15\u201322 months.';
  else primaryRisk = 'Sewer capacity at street level unverified. Confirm with Sydney Water before offer.';

  // Approval outlook
  var outlook = approvalPct>=75?'Favourable \u2014 zone and overlay profile support approval':
    approvalPct>=60?'Conditional \u2014 standard DA pathway, council assessment required':
    'Uncertain \u2014 overlays or zoning constraints may complicate approval';


  // ── TASK 3+4 (updated): site_potential_tier + opportunity_reason ──
  var site_potential_tier, opportunity_reason, red_flags = [];

  // Collect red flags
  if(heritage)    red_flags.push('Heritage overlay');
  if(flood)       red_flags.push('Flood planning area');
  if(bushfire)    red_flags.push('Bushfire prone land');
  if(!zone)       red_flags.push('Zone not detected');
  if(zone==='E2'||zone==='RE1'||zone==='RU1') red_flags.push('Non-residential or environmental zone');

  var strongZone    = zone&&(['R3','R4','MU1','B1','B2','B4'].indexOf(zone)>-1);
  var largeBlock    = block&&block>=1200;
  var veryLargeBlock= block&&block>=2000;
  var missing_data  = !zone || !block;

  if(missing_data || red_flags.length>=2){
    site_potential_tier = 'Complex professional review required';
    opportunity_reason  = red_flags.length>=2
      ? 'Multiple overlays or data issues detected. Professional verification required before any decision.'
      : 'Zone or block size not confirmed. Professional verification required.';
  } else if(n>=9 || (strongZone&&zone==='R4'&&n>=6) || (zone==='MU1'&&n>=6)){
    // Tier 3: High-entry / complex
    site_potential_tier = 'High-entry / complex opportunity';
    opportunity_reason  = (zone||'Unknown')+' zone with estimated '+n+'+ dwelling / lot potential. Experienced developers, capital partners and consultant team required.';
  } else if(n>=4 || (strongZone && n>=3) || (veryLargeBlock && strongZone)){
    // Tier 2: Medium opportunity
    site_potential_tier = 'Medium opportunity — delivery and finance review';
    opportunity_reason  = strongZone
      ? (zone||'Unknown')+' zone with estimated '+n+(n>=4?' dwelling / lot':' dwelling')+' potential. Finance support and professional review likely useful.'
      : 'Large block ('+block+'m²) with estimated '+n+'-lot subdivision potential. Civil works and finance support likely needed.';
  } else if(n>=3 || (largeBlock && n>=2)){
    // Tier 2: Medium (smaller end)
    site_potential_tier = 'Medium opportunity — delivery and finance review';
    opportunity_reason  = n>=3
      ? 'Possible '+n+'-lot subdivision pathway — verify minimum lot size and overlays. Finance support may be useful.'
      : 'Large block may support '+n+'-lot subdivision. Confirm LEP minimum lot size with a licensed surveyor.';
  } else if(n>=2){
    // Tier 1: Entry / 2-lot or dual occupancy
    site_potential_tier = 'Entry opportunity — small subdivision review';
    opportunity_reason  = 'Possible 2-lot subdivision or dual occupancy pathway. Good entry-level opportunity for homeowners, small builders and local investors. Confirm LEP controls, frontage and servicing.';
  } else {
    // Tier 1: Entry / granny flat / secondary dwelling
    site_potential_tier = 'Entry opportunity — granny flat / secondary dwelling pathway';
    opportunity_reason  = 'Block size may support granny flat, secondary dwelling or small duplex. High-demand pathway for homeowners and small builders. Confirm with a licensed town planner.';
  }

  // Override: do not call anything High-entry/complex without meaningful scale
  if(site_potential_tier==='High-entry / complex opportunity' && n<6){
    site_potential_tier = 'Medium opportunity — delivery and finance review';
  }


  return '<div class="verdict-section">'
    +'<div class="vs-header">'
      +'<div class="vs-left">'
        +'<div class="vs-label">Executive intelligence verdict</div>'
        +'<div class="vs-verdict-text" style="color:'+verdictColor+'">'+verdict+'</div>'
        +'<div class="vs-summary" style="margin-bottom:10px">'
          +zLabel+' site in '+(lga||'unknown LGA')+(n>=2?'. '+n+'-lot LEP yield estimate':'')+'. '
          +(mlsReal?'Confirmed LEP min lot '+mls+'m\u00b2 \u2014 verified from NSW Planning Portal.':'Zone default min lot '+mls+'m\u00b2 applied \u2014 confirm real LEP value with council.')
          +(riskCount===0?' All 9 government overlays clear.':' '+riskCount+' overlay warning'+(riskCount>1?'s':'')+' detected.')
          +(days?' Council DA median '+days+'d.':'')
        +'</div>'
        +'<div class="verdict-callouts">'
          +'<div class="vc-item"><div class="vc-label">&#9652; Hidden upside</div><div class="vc-text">'+hiddenUpside+'</div></div>'
          +'<div class="vc-item"><div class="vc-label">&#9660; Primary risk</div><div class="vc-text">'+primaryRisk+'</div></div>'
          +'<div class="vc-item"><div class="vc-label">&#9654; Approval outlook</div><div class="vc-text">'+outlook+'</div></div>'
          +(opportunity_reason?'<div class="vc-item" style="border-left:2px solid var(--blue);padding-left:8px"><div class="vc-label" style="color:var(--blue)">&#8505; Ranking reason</div><div class="vc-text">'+opportunity_reason+'</div></div>':'')
      +'<div class="vc-item"><div class="vc-label">&#9203; Strategy</div><div class="vc-text">'+(n>=4?'Secure under option. Confirm sewer, BVM and DCP frontage before exchanging.':n===3?'Pre-DA meeting recommended. Commission surveyor and town planner before any offer.':n>=2?'Indicative 2-lot pathway — confirm LEP controls, frontage, access, easements and servicing with a licensed planner and surveyor before any offer.':overallScore>=50?'Block size not confirmed. If subdivision is a goal, engage a town planner to assess LEP controls, frontage and DCP requirements.':'Duplex or secondary dwelling may be viable. Full Torrens subdivision unlikely given site constraints — confirm with a licensed town planner.')+'</div></div>'
        +'</div>'
      +'</div>'
      +'<div class="vs-right">'
        +'<div class="vs-score-num" style="color:'+verdictColor+'">'+overallScore+'</div>'
        +'<div class="vs-score-lbl">Intelligence<br>score</div>'
        +'<div style="font-size:.56rem;font-weight:700;color:'+verdictColor+';margin-top:3px;text-transform:uppercase;letter-spacing:.06em">'+verdictRange+'</div>'
      +'</div>'
    +'</div>'
    +'<div class="verdict-kpis">'
      +'<div class="vkpi"><div class="vkpi-v" style="color:'+verdictColor+'">'+approvalPct+'%</div><div class="vkpi-l">Approval probability</div></div>'
      +'<div class="vkpi"><div class="vkpi-v a">'+(n>=2?n+' lots':'—')+'</div><div class="vkpi-l">LEP lot estimate</div></div>'
      +'<div class="vkpi"><div class="vkpi-v" style="color:'+riskColor+'">'+riskLabel+'</div><div class="vkpi-l">Risk level</div></div>'
      +'<div class="vkpi"><div class="vkpi-v b">'+timeline+'</div><div class="vkpi-l">Timeline est.</div></div>'
    +'<div class="vkpi" style="grid-column:span 2"><div class="vkpi-v" style="font-size:.65rem;color:var(--blue)">'+site_potential_tier+'</div><div class="vkpi-l">Site potential tier</div></div>'
    +'</div>'
    +(n>=4 || (block&&block>=2000) ?
      '<div style="margin-top:12px;padding:10px 14px;background:rgba(200,168,75,.06);border:1px solid rgba(200,168,75,.2);border-radius:8px;font-size:.72rem;color:var(--muted);line-height:1.7">'
      +'<strong style="color:var(--gold)">&#9432; Higher-level review may be required.</strong> This site may require a professional review due to its potential scale, complexity or value. Request a professional review before making any decision.'
      +'</div>' : '')
  +'</div>';
}

// ── IMPROVED SECTION TITLES WITH SOURCE BADGES ───────
// Patches section builder outputs to inject whtm() microcopy
function injectWhtm(html, sectionId, text){
  // Not used inline — whtm added directly in each builder
  return html;
}



// ── INSTITUTIONAL SCORECARD ─────────────────────────────────────
function buildScorecard(ps,ov,yp,ac,ir,hc,cc,ep){
  function item(label,sub,score){
    var color=score>=8?'var(--green)':score>=6?'var(--amber)':'var(--red)';
    var w=Math.round(score*10)+'%';
    return '<div class="sc-item">'
      +'<div class="sci-info"><div class="sci-label">'+label+'</div><div class="sci-sub">'+sub+'</div></div>'
      +'<div class="sci-right">'
        +'<div class="sci-score" style="color:'+color+'">'+score.toFixed(1)+'</div>'
        +'<div class="sci-bar"><div class="sci-fill" style="width:'+w+';background:'+color+'"></div></div>'
      +'</div>'
    +'</div>';
  }
  return '<div class="rsec">'
    +'<div class="rsec-title">Development scorecard <span class="tag tag-live">automated · 16+ data sources</span></div>'
    +'<div class="scorecard-grid">'
      +item('Planning strength','Zone, LEP controls, overlay status',ps)
      +item('Overlay risk','9 government checks — higher = cleaner',ov)
      +item('Yield potential','Block size vs min lot size',yp)
      +item('Approval confidence','Zone + overlays + council history',ac)
      +item('Infrastructure risk','Sewer, roads, services — higher = lower risk',ir)
      +item('Holding cost risk','Council DA speed — higher = faster council',hc)
      +item('Council complexity','DA process — higher = simpler',cc)
      +item('Exit potential','Marketability of end product',ep)
    +'</div>'
  +'</div>';
}


// ── CALC FUNCTIONS (required by renderResult wrapper) ────────────

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

function calcYieldPotential(block,mls,zone){
  if(!block||block<100) return 4;
  var lots=Math.floor(block/(mls||450));
  if(lots>=15) return 10;
  if(lots>=10) return 9;
  if(lots>=6)  return 8;
  if(lots>=4)  return 7;
  if(lots>=3)  return 6;
  if(lots>=2)  return 5;
  return 2;
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
    sigLabel='STRONG DEVELOPMENT OPPORTUNITY';
  }else if(_score>=65){
    sig='a';
    sigLabel='REVIEW OPPORTUNITY — PROFESSIONAL VERIFICATION REQUIRED';
  }else if(_score>=50){
    sig='a';
    sigLabel='MODERATE POTENTIAL — KEY CONSTRAINTS TO VERIFY';
  }else if(_score>=35){
    sig='r';
    sigLabel='LIMITED POTENTIAL — PROCEED CAREFULLY';
  }else if(skipLotCount){
    sig='a';
    sigLabel='Enter block size for full analysis';
  }else{
    sig='r';
    sigLabel='LOW DEVELOPMENT POTENTIAL';
  }
  var sigColor={'g':'var(--green)','a':'var(--amber)','r':'var(--red)'}[sig];

  // Lot count display
  var lotsDisplay = (!skipLotCount&&n>=2)?String(n):'—';

  // Council name
  var cmName = cm&&cm.name ? cm.name : (lga||'');

  // Zone label
  var zoneLabels={'R1':'Low density res','R2':'Low density res','R3':'Medium density res','R4':'High density res','R5':'Large lot res','RU1':'Primary production','RU2':'Rural landscape','E4':'Environmental living'};
  var zLabel=(zone&&zoneLabels[zone])||zoneName||(zone?zone+' zone':'Zone unknown');

  // Stats row values
  var daMedian = cm&&cm.data ? cm.data.days+'d median' : 'No data';
  var blockDisp = block&&block>0 ? block.toLocaleString('en-AU')+'m²' : 'Not detected';

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
    if(clear)  return '<div class="ov ok"><div class="ov-icon">\u2713</div><div class="ov-body"><div class="ov-title ok">'+label+' \u2014 Clear</div><div class="ov-src">'+src+'</div></div></div>';
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

  // Data confidence labels for the result header/card
  var _atypeLabel = addrType==='lot'?'Lot-based address'
    :addrType==='range'?'Range address'
    :addrType==='unit'?'Unit address'
    :addrType==='street-only'?'Street-only address'
    :'Normal address';
  var _atypeColor = addrType==='lot'||addrType==='range'||addrType==='street-only'?'var(--amber)':'var(--green)';
  var _csrcLabel  = councilSource==='planning-portal'?'\u2713 NSW Planning Portal'
    :councilSource==='suburb-postcode-fallback'?'\u26a0 Suburb/postcode inference'
    :'\u2014 Not identified';
  var _csrcColor  = councilSource==='planning-portal'?'var(--green)'
    :councilSource==='suburb-postcode-fallback'?'var(--amber)':'var(--muted2)';
  var _daLabel    = cm&&cm.daTimelineCoverage?'\u2713 Available'
    :cm&&cm.councilKnown?'\u26a0 Not yet available for this council'
    :'\u2014 Unknown';
  var _daColor    = cm&&cm.daTimelineCoverage?'var(--green)'
    :cm&&cm.councilKnown?'var(--amber)':'var(--muted2)';

  var H='<div class="rcard">'
    // Header
    +'<div class="rh '+sig+'">'
      +'<div>'
        +'<div class="sig-row" style="font-size:.67rem;display:flex;align-items:center;gap:10px;flex-wrap:wrap">'
        +'<span style="font-size:.57rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted2)">Address:</span> '
        +'<span style="font-weight:600;color:'+(geoConf==='Verified'?'var(--green)':geoConf==='Estimated'?'var(--amber)':'var(--amber)')+'">'+(geoConf||'Needs review')+'</span>'
        +' &middot; <span style="font-size:.57rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted2)">Zone:</span> '
        +'<span style="color:'+(zone?'var(--green)':'var(--red)')+'">'+(zone||'Not detected')+'</span>'
        +' &middot; <span style="font-size:.57rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted2)">Parcel:</span> '
        +'<span style="color:'+(blockSource==='auto-detected'?'var(--green)':'var(--amber)')+'">'+(blockSource==='auto-detected'?'Verified':'Needs review')+'</span>'
        +'</div>'
        +'<div class="rh-addr">'+esc(addr,80)+'</div>'
        +'<div class="rh-meta">'+esc(zLabel,60)+' \u00b7 '+esc(cmName,50)+'</div>'
      +'</div>'
      +'<div class="rh-right">'
        +'<div class="lots-big '+sig+'">'+lotsDisplay+'</div>'
        +'<div class="lots-lbl">'+((!skipLotCount&&n>=2)?'potential lots':'subdivision')+'</div>'
      +'</div>'
    +'</div>'

    // Stats row
    +'<div class="stats-row">'
      +'<div class="sr"><div class="sr-v '+(zoneAllows?'g':'a')+'">'+esc(zone||'?',6)+'</div><div class="sr-l">Zone</div></div>'
      +'<div class="sr"><div class="sr-v '+(mlsReal?'g':'a')+'">'+(mls||'?')+'m\u00b2</div><div class="sr-l">Min lot</div></div>'
      +'<div class="sr"><div class="sr-v b">'+esc(daMedian,20)+'</div><div class="sr-l">DA median</div></div>'
      +'<div class="sr"><div class="sr-v">'+esc(blockDisp,20)+'</div><div class="sr-l">Block size</div></div>'
    +'</div>'


    // Data confidence section
    +'<div class="rsec" style="background:rgba(255,255,255,.02);border-color:rgba(255,255,255,.08)">'      +'<div class="rsec-title">Data confidence'      +' <span class="tag" style="background:transparent;border-color:rgba(255,255,255,.1);color:var(--muted)">&#9432; What we verified &middot; What needs review</span>'      +'</div>'      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:.72rem;margin-bottom:8px">'
        +'<div style="background:var(--bg3);border-radius:8px;padding:10px 12px;grid-column:span 2">'          +'<div style="font-size:.58rem;text-transform:uppercase;letter-spacing:.07em;color:var(--muted2);margin-bottom:4px">Entered address</div>'          +'<div style="font-weight:500;color:var(--text);margin-bottom:3px">'+esc(addr,80)+'</div>'          +(addrType==='lot'&&lotNum            ?'<div style="font-size:.63rem;color:var(--amber)">&#9888; Lot '+esc(lotNum,10)+' detected &mdash; Lot number is not a street number. Verify parcel via NSW Land Registry or cadastre before any reliance.</div>'            :addrType==='range'            ?'<div style="font-size:.63rem;color:var(--amber)">&#9888; Range address &mdash; exact parcel may differ. Confidence lowered until parcel is verified.</div>'            :addrType==='street-only'            ?'<div style="font-size:.63rem;color:var(--amber)">&#9888; Street-only address &mdash; no house number. Results at street level only.</div>'            :(lotGeoWarn?'<div style="font-size:.63rem;color:var(--amber)">&#9888; '+esc(lotGeoWarn,200)+'</div>':''))        +'</div>'
        +'<div style="background:var(--bg3);border-radius:8px;padding:10px 12px">'          +'<div style="font-size:.58rem;text-transform:uppercase;letter-spacing:.07em;color:var(--muted2);margin-bottom:4px">Matched address</div>'          +'<div style="font-weight:500;color:var(--text);font-size:.75rem">'+esc(matchedAddr||addr,60)+'</div>'          +'<div style="margin-top:3px;font-size:.63rem;color:'+(geoSource&&geoSource.indexOf('Google')>-1?'var(--green)':'var(--amber)')+'">'            +(geoSource?'Source: '+esc(geoSource,40):'Address source unknown')          +'</div>'        +'</div>'
        +'<div style="background:var(--bg3);border-radius:8px;padding:10px 12px">'          +'<div style="font-size:.58rem;text-transform:uppercase;letter-spacing:.07em;color:var(--muted2);margin-bottom:4px">Address type</div>'          +'<div style="font-weight:600;color:'+_atypeColor+'">'+_atypeLabel+'</div>'          +'<div style="margin-top:3px;font-size:.63rem;color:var(--muted2)">'            +(geoConf==='Verified'?'\u2713 Verified':'\u26a0 '+(!geoConf?'Needs review':geoConf))            +(locationType?' &middot; '+esc(locationType,25):'')            +(paidApiUsed?' <span style="color:var(--green)">&#10003; Google API</span>':'')          +'</div>'        +'</div>'
        +'<div style="background:var(--bg3);border-radius:8px;padding:10px 12px">'          +'<div style="font-size:.58rem;text-transform:uppercase;letter-spacing:.07em;color:var(--muted2);margin-bottom:4px">Block size</div>'          +'<div style="font-weight:600;color:var(--text)">'+(block?block+'m\u00b2':'Not provided')+'</div>'          +'<div style="margin-top:3px;font-size:.63rem;color:'+(blockSource==='auto-detected'?'var(--green)':blockSource==='estimated'||blockSource==='needs-review'?'var(--amber)':'var(--amber)')+'">'            +(blockSource==='auto-detected'?'\u2713 Auto-detected (NSW Cadastre)'              :blockSource==='estimated'?'\u26a0 Cadastre approx \u2014 street-level match'              :blockSource==='needs-review'?'\u26a0 Cadastre \u2014 may be adjacent parcel'              :(block?'\u26a0 Manually entered \u2014 verify against title':'\u2014 Enter block size for better results'))          +'</div>'        +'</div>'
        +'<div style="background:var(--bg3);border-radius:8px;padding:10px 12px">'          +'<div style="font-size:.58rem;text-transform:uppercase;letter-spacing:.07em;color:var(--muted2);margin-bottom:4px">Zone</div>'          +'<div style="font-weight:600;color:var(--text)">'+(zone||'Not detected')+'</div>'          +'<div style="margin-top:3px;font-size:.63rem;color:'+(zone?'var(--green)':'var(--amber)')+'">'            +(zone?'\u2713 Live NSW Planning Portal':'\u26a0 Zone not detected')          +'</div>'        +'</div>'
        +'<div style="background:var(--bg3);border-radius:8px;padding:10px 12px">'          +'<div style="font-size:.58rem;text-transform:uppercase;letter-spacing:.07em;color:var(--muted2);margin-bottom:4px">Parcel match</div>'          +'<div style="font-weight:600;color:var(--text)">'            +(blockSource==='auto-detected'?'Parcel found'              :blockSource==='estimated'?'Parcel found (approx)'              :blockSource==='needs-review'?'Parcel found (needs review)'              :'Not matched')          +'</div>'          +'<div style="margin-top:3px;font-size:.63rem;color:'+(blockSource==='auto-detected'?'var(--green)':blockSource==='estimated'||blockSource==='needs-review'?'var(--amber)':'var(--muted2)')+'">'            +(blockSource==='auto-detected'?'\u2713 NSW Cadastre parcel matched'              :blockSource==='estimated'?'\u26a0 Parcel found \u2014 street-level approx'              :blockSource==='needs-review'?'\u26a0 Parcel area may not match address'              :'\u2014 NSW Cadastre parcel not matched')          +'</div>'        +'</div>'
        +'<div style="background:var(--bg3);border-radius:8px;padding:10px 12px">'          +'<div style="font-size:.58rem;text-transform:uppercase;letter-spacing:.07em;color:var(--muted2);margin-bottom:4px">Council</div>'          +'<div style="font-weight:600;color:var(--text)">'+(lga||'Not detected')+'</div>'          +'<div style="margin-top:3px;font-size:.63rem;color:'+_csrcColor+'">'+_csrcLabel+'</div>'        +'</div>'
        +'<div style="background:var(--bg3);border-radius:8px;padding:10px 12px">'          +'<div style="font-size:.58rem;text-transform:uppercase;letter-spacing:.07em;color:var(--muted2);margin-bottom:4px">DA timeline</div>'          +'<div style="font-weight:600;color:'+_daColor+'">'            +(cm&&cm.data&&cm.data.days?cm.data.days+'d median':(cm&&cm.councilKnown?'Known council':'Unknown'))          +'</div>'          +'<div style="margin-top:3px;font-size:.63rem;color:'+_daColor+'">'+_daLabel+'</div>'        +'</div>'
        +'<div style="background:var(--bg3);border-radius:8px;padding:10px 12px">'          +'<div style="font-size:.58rem;text-transform:uppercase;letter-spacing:.07em;color:var(--muted2);margin-bottom:4px">Overall confidence</div>'          +'<div style="font-weight:600;font-size:.72rem;color:'+(geoConf==='Verified'&&zone&&blockSource==='auto-detected'?'var(--green)':'var(--amber)')+'">'            +(geoConf==='Verified'&&zone&&blockSource==='auto-detected'?'Verified \u2014 address, zone and parcel confirmed'              :addrType==='lot'?'Needs review \u2014 Lot address, parcel verification required'              :geoConf==='Estimated'?'Estimated \u2014 address approximate, parcel needs review'              :geoConf==='Needs review'?'Needs review \u2014 not confidently verified'              :geoConf==='Verified'&&zone?'Address \u2714 \u00b7 Zone \u2714 \u00b7 Parcel needs review'              :geoConf==='Verified'?'Address verified \u2014 planning data needs review'              :'Needs review \u2014 professional verification required')          +'</div>'        +'</div>'
      +'</div>'      +(addrType==='lot'||addrType==='range'||geoConf==='Estimated'||geoConf==='Needs review'        ?'<div style="font-size:.62rem;color:var(--amber);line-height:1.7;padding:8px 10px;background:rgba(245,158,11,.06);border:1px solid rgba(245,158,11,.2);border-radius:6px;margin-top:4px">'          +(addrType==='lot'?'&#9888; Lot-based address: Lot and DP numbers must be matched to a specific parcel via NSW Land Registry or cadastre before any result can be relied upon. Parcel area, zone and overlays shown are based on geocoded coordinates only and may relate to a different parcel.'            :addrType==='range'?'&#9888; Range address: exact parcel may differ from geocoded coordinates. Parcel area and zone may relate to an adjacent property. Verify before relying on this result.'            :'&#9888; Address found at approximate location. Results below are indicative only \u2014 professional verification required.')        +'</div>'        :'')      +'</div>'    +

    // Planning controls
    +'<div class="rsec">'
      +'<div class="rsec-title">Planning controls <span class="tag tag-live">&#9679; NSW Planning Portal \u00b7 live</span></div>'
      +'<div class="ctrl-grid">'
        +'<div class="ctrl"><div class="ctrl-lbl">Zone</div><div class="ctrl-val">'+esc(zone||'Unknown',10)+'</div><div class="ctrl-src">'+esc(zLabel,60)+'</div></div>'
        +'<div class="ctrl"><div class="ctrl-lbl">Min lot size</div><div class="ctrl-val">'+(mls||'?')+'m\u00b2</div><div class="ctrl-src">'+esc(mlsConf,80)+'</div></div>'
        +'<div class="ctrl"><div class="ctrl-lbl">FSR</div><div class="ctrl-val">'+esc(fsrText,20)+'</div><div class="ctrl-src">Layer 4</div></div>'
        +'<div class="ctrl"><div class="ctrl-lbl">Height limit</div><div class="ctrl-val">'+esc(htText,20)+'</div><div class="ctrl-src">Layer 7</div></div>'
        +'<div class="ctrl"><div class="ctrl-lbl">DA pathway</div><div class="ctrl-val">'+(heritage?'Heritage DA':'Standard DA')+'</div><div class="ctrl-src">Layer 8 heritage check</div></div>'
        +'<div class="ctrl"><div class="ctrl-lbl">Council DA median</div><div class="ctrl-val '+( cm&&cm.data&&cm.data.days<=90?'g':cm&&cm.data&&cm.data.days>200?'r':'a')+'">'+esc(daMedian,20)+'</div><div class="ctrl-src">'+(cm&&cm.data?cm.data.n+' real DAs \u00b7 range: '+esc(cm.data.range||'',20):(cm&&cm.councilKnown?'Coverage not yet available':'Council not identified'))+'</div></div>'
      +'</div>'
    +'</div>'

    // Overlay analysis
    +'<div class="rsec">'
      +'<div class="rsec-title">Overlay analysis <span class="tag tag-live">&#9679; 9 live government checks</span></div>'
      +(ovAllClear?'<div style="background:var(--greenl);border:1px solid var(--greenb);border-radius:var(--r);padding:8px 12px;margin-bottom:8px;font-size:.76rem;color:var(--green)">&#10003; All 9 overlays clear \u2014 no additional reports required for DA</div>':'')
      +'<div class="ov-list">'
        +ovRow('Heritage',!heritage,'Layer 8 \u00b7 NSW Planning Portal',heritage&&heritage.name?'Heritage item: '+esc(heritage.name||'',40):'Heritage overlay present')
        +ovRow('Flood planning area',!flood,'NSW EPI Flood Planning Area')
        +ovRow('Bushfire prone land',!bushfire,'NSW RFS Bush Fire Prone Land')
        +ovRow('Acid sulfate soils',!acidSulfate,'Layer 15 \u00b7 NSW Planning Portal')
        +ovRow('Contaminated land',!contaminated,'Layer 17 \u00b7 NSW Planning Portal')
        +ovRow('Riparian / watercourse',!riparian,'Layer 13 \u00b7 NSW Planning Portal','Indicators only \u2014 watercourse buffers not yet fully modelled. Professional verification required.')
        +ovRow('Land reservation',!landReserve,'Layer 16 \u00b7 NSW Planning Portal',landReserve?'Reserved: '+esc(String(landReserve),40):'')
        +ovRow('Foreshore building line',!foreshore,'Layer 18 \u00b7 NSW Planning Portal')
        +seppNote
      +'</div>'
    +'</div>'


    // Risk register
    +'<div class="rsec">'
      +'<div class="rsec-title">Risk register <span class="tag" style="background:rgba(255,255,255,.03);border-color:rgba(255,255,255,.1);color:var(--muted)">Site-specific risks</span></div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:.72rem">'
        +'<div style="padding:8px 10px;border-radius:8px;background:var(--bg3)">'
          +'<div style="font-size:.58rem;text-transform:uppercase;letter-spacing:.07em;color:var(--muted2);margin-bottom:3px">Heritage</div>'
          +'<div style="color:'+(heritage?'var(--amber)':'var(--green)')+';font-weight:500">'+(heritage?'⚠ Heritage overlay detected':'✓ No heritage overlay')+'</div>'
          +(heritage?'<div style="font-size:.63rem;color:var(--muted);margin-top:2px">Impact Statement required. Licensed professional must assess.</div>':'')
        +'</div>'
        +'<div style="padding:8px 10px;border-radius:8px;background:var(--bg3)">'
          +'<div style="font-size:.58rem;text-transform:uppercase;letter-spacing:.07em;color:var(--muted2);margin-bottom:3px">Flood</div>'
          +'<div style="color:'+(flood?'var(--amber)':'var(--green)')+';font-weight:500">'+(flood?'⚠ Flood planning area detected':'✓ No flood planning area')+'</div>'
          +(flood?'<div style="font-size:.63rem;color:var(--muted);margin-top:2px">Hydraulic assessment required. Detailed flood depth not yet modelled.</div>':'')
        +'</div>'
        +'<div style="padding:8px 10px;border-radius:8px;background:var(--bg3)">'
          +'<div style="font-size:.58rem;text-transform:uppercase;letter-spacing:.07em;color:var(--muted2);margin-bottom:3px">Bushfire</div>'
          +'<div style="color:'+(bushfire?'var(--amber)':'var(--green)')+';font-weight:500">'+(bushfire?'⚠ Bushfire prone land':'✓ Not bushfire prone')+'</div>'
          +(bushfire?'<div style="font-size:.63rem;color:var(--muted);margin-top:2px">Bushfire Assessment Report likely required.</div>':'')
        +'</div>'
        +'<div style="padding:8px 10px;border-radius:8px;background:var(--bg3)">'
          +'<div style="font-size:.58rem;text-transform:uppercase;letter-spacing:.07em;color:var(--muted2);margin-bottom:3px">Riparian / watercourse</div>'
          +'<div style="color:var(--muted);font-weight:500">'+(riparian?'⚠ Indicator detected':'— Indicator not detected')+'</div>'
          +'<div style="font-size:.63rem;color:var(--muted2);margin-top:2px">Not yet fully modelled. Watercourse buffers require professional verification.</div>'
        +'</div>'
        +'<div style="padding:8px 10px;border-radius:8px;background:var(--bg3)">'
          +'<div style="font-size:.58rem;text-transform:uppercase;letter-spacing:.07em;color:var(--muted2);margin-bottom:3px">Slope &amp; earthworks</div>'
          +'<div style="color:var(--muted);font-weight:500">— Not yet modelled</div>'
          +'<div style="font-size:.63rem;color:var(--muted2);margin-top:2px">Slope and earthworks risk requires site inspection and geotechnical assessment.</div>'
        +'</div>'
        +(zone==='E2'||zone==='RE1'||zone==='RU1'?'<div style="padding:8px 10px;border-radius:8px;background:rgba(245,158,11,.07);border:1px solid rgba(245,158,11,.2)"><div style="font-size:.58rem;text-transform:uppercase;letter-spacing:.07em;color:var(--muted2);margin-bottom:3px">Zone warning</div><div style="color:var(--amber);font-weight:500">⚠ Non-residential zone detected</div><div style="font-size:.63rem;color:var(--muted);margin-top:2px">Zone may restrict residential development. Confirm zoning with council.</div></div>':'')
      +'</div>'
    +'</div>'

    // Development pathway
    +'<div class="rsec" style="background:rgba(91,156,242,.03);border-color:rgba(91,156,242,.15)">'
      +'<div class="rsec-title" style="color:#5b9cf2">Development pathway <span class="tag" style="background:rgba(91,156,242,.08);border-color:rgba(91,156,242,.2);color:#5b9cf2">Estimated \u2014 professional verification required</span></div>'
      +'<div style="font-size:.76rem;color:var(--muted);line-height:1.8;margin-bottom:10px">'
        +(n>=4?'<strong style="color:var(--text)">Multi-lot Torrens title subdivision pathway detected.</strong> '+zone+' zone with '+n+'-lot LEP yield estimate. Scaled civil works, engineering and multiple DA conditions likely. Town planner, civil engineer and licensed surveyor required.':
          n===3?'<strong style="color:var(--text)">3-lot subdivision pathway possible.</strong> Pre-DA council meeting recommended. Town planner and licensed surveyor required before any decision.':
          n===2?'<strong style="color:var(--text)">2-lot subdivision or dual occupancy pathway may be viable.</strong> Confirm LEP controls, frontage, access, easements and servicing with a licensed planner and surveyor.':
          zone==='R3'?'<strong style="color:var(--text)">Medium density zone (R3).</strong> Townhouse or multi-dwelling development may be permissible. Town planner review required to assess DCP controls.':
          '<strong style="color:var(--text)">Single dwelling or secondary dwelling pathway only.</strong> Block size or zoning does not support Torrens title subdivision under current LEP minimum lot size.')
      +'</div>'
      +'<div style="font-size:.67rem;color:var(--muted2);padding:8px 10px;background:rgba(255,255,255,.02);border-radius:6px;line-height:1.7">'
        +'<strong style="color:var(--muted)">Important:</strong> No DA approval is confirmed. This is a preliminary screening signal only. '
        +'Professional verification is required before any purchase, finance or development decision.'
      +'</div>'
    +'</div>'

        // Comparables (if any)
    +(compHtml?'<div class="rsec"><div class="rsec-title">Comparable DAs \u2014 same council <span class="tag tag-live">&#9679; DA Leads API</span></div>'+compHtml+'</div>':'')

    // Infrastructure
    +(infraHtml?'<div class="rsec"><div class="rsec-title">Infrastructure proximity <span class="tag tag-data">&#9679; OpenStreetMap Overpass</span></div>'+infraHtml+'</div>':'')

    // Disclaimer
    +'<div style="margin:20px 0 0;padding:14px 16px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:10px;font-size:.66rem;color:var(--muted);line-height:1.8">'
      +'<strong style="color:var(--muted2)">Disclaimer</strong> — This report is generated from publicly available government data sources including NSW Planning Portal, NSW ePlanning API, and OpenStreetMap. It is indicative only and does not constitute professional planning, legal or financial advice. Scores and feasibility assessments do not guarantee development approval. Site-specific conditions including slope, earthworks, easements, lot shape, Council DCP controls and servicing capacity are not fully assessed. Riparian / watercourse corridor buffers and detailed flood depth are not yet fully modelled — professional verification is required. A licensed town planner, surveyor, civil engineer and solicitor must confirm feasibility before any purchase, finance or development decision. No guaranteed prices, profits or outcomes are implied.'
    +'</div>'

    // CTA — next steps
    +'<div class="cta-box">'
      +'<div class="cta-title">What to do next with this site?</div>'
      +(overallScore>=65
        ?(n>=4||(block&&block>=2000)
          ?'<div class="cta-sub">This site may support a higher-value development pathway. A Full Report gives a structured planning-risk picture before you spend on professionals or finance decisions.</div>'
          :'<div class="cta-sub">This site shows development potential. Run a Full Report or request professional review before making any decision. No DA approval confirmed — preliminary screening only.</div>')
        :'<div class="cta-sub">Need practical help with this site? Request a quote for civil works, external works, drainage, driveway, retaining walls, excavation, landscaping or professional support. Handled directly or matched with trusted professionals.</div>')
      +'<div class="cta-btns">'
        +(overallScore>=65
          ?'<a href="full-report.html" class="btn btn-gold" style="text-decoration:none">Unlock full report →</a>'
           +'<button class="btn btn-outline btn-sm" onclick="window.location.href=\'services.html\'">Request professional review →</button>'
           +'<a href="finance.html" class="btn btn-outline btn-sm" style="text-decoration:none;margin-top:4px">Finance &amp; lender support</a>'
          :'<button class="btn btn-gold" onclick="window.location.href=\'services.html\'">Request quote →</button>'
           +'<button class="btn btn-outline btn-sm" onclick="chatPro()">Chat with us →</button>'
        )
      +'</div>'
    +'</div>'
  +'</div>';

  resultEl.innerHTML=H;
  resultEl.classList.add('show');
  resultEl.scrollIntoView({behavior:'smooth',block:'start'});
}

// Highest & Best Use Analysis
function buildHBUSection(zone,block,mls,n,heritage,flood,cm){
  var days=cm&&cm.data?cm.data.days:null;
  var opts=[];
  // Task 5: use block/mls to estimate lots even if n was zeroed by skipLotCount
  var possibleLots=block&&mls&&block>=mls?Math.floor(block/mls):n;
  var lotsForHBU=Math.max(n,possibleLots);
  if(lotsForHBU>=10)opts.push({label:'Large-scale Torrens subdivision ('+lotsForHBU+'+ lots)',status:'primary',complexity:'High',timeline:days?(Math.round(days/30)+9)+'\u2013'+(Math.round(days/30)+15)+' months':'Allow 18\u201326 months',desc:'Full civil design, staging and DA package required. Strong LEP precedent. Confirm sewer capacity with Sydney Water before offer.'});
  else if(lotsForHBU>=4)opts.push({label:'Torrens title subdivision ('+n+' lots)',status:'primary',complexity:'Medium',timeline:days?(Math.round(days/30)+3)+'\u2013'+(Math.round(days/30)+9)+' months':'Allow 9\u201315 months',desc:'Standard residential subdivision. Most common approval type in this zone. Survey plan, engineering drawings and DA required.'});
  else if(lotsForHBU>=2)opts.push({label:'Two-lot Torrens subdivision',status:'primary',complexity:'Low\u2013Medium',timeline:days?(Math.round(days/30)+2)+'\u2013'+(Math.round(days/30)+6)+' months':'Allow 6\u201312 months',desc:'Possible 2-lot pathway subject to LEP controls, DCP frontage, site access, easements and servicing. Requires survey plan and standard DA. Commission a licensed town planner and surveyor before any decision.'});
  if(['R2','R3','R4'].indexOf(zone)>-1)opts.push({label:'Duplex (dual occupancy)',status:'alt',complexity:'Low',timeline:'6\u201312 months',desc:'May be permissible as complying development or standard DA. Does not require subdivision. Lower yield.'});
  if(['R3','R4','MU1','B4'].indexOf(zone)>-1)opts.push({label:'Townhouse \/ multi-dwelling',status:'alt',complexity:'High',timeline:'12\u201324 months',desc:'Medium density pathway. Higher yield but greater design complexity and council assessment. Subject to DCP controls.'});
  opts.push({label:'Single dwelling or renovation',status:'lowest',complexity:'Low',timeline:'N\/A',desc:'Lowest-yield option. Only suitable if subdivision is not achievable due to site constraints.'});
  var rows=opts.map(function(o){
    var bg=o.status==='primary'?'var(--greenl)':'var(--bg3)';
    var bd=o.status==='primary'?'var(--greenb)':'var(--border)';
    var badge=o.status==='primary'?'<span style="font-size:.52rem;font-weight:700;background:var(--green);color:#000;padding:1px 6px;border-radius:3px;margin-left:6px">Recommended</span>':'';
    return '<div style="background:'+bg+';border:1px solid '+bd+';border-radius:var(--r);padding:10px 12px;margin-bottom:5px">'
      +'<div style="font-size:.76rem;font-weight:500;margin-bottom:4px">'+o.label+badge+'</div>'
      +'<div style="font-size:.68rem;color:var(--muted);margin-bottom:6px;line-height:1.6">'+o.desc+'</div>'
      +'<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;font-size:.62rem">'
        +'<div><span style="color:var(--muted2)">Complexity</span><br>'+o.complexity+'</div>'
        +'<div><span style="color:var(--muted2)">Timeline est.</span><br>'+o.timeline+'</div>'
      +'</div>'
    +'</div>';
  }).join('');
  return '<div class="rsec">'
    +'<div class="rsec-title">Highest &amp; best use analysis <span class="tag tag-data">planning interpretation</span></div>'
    +rows
    +'<div style="font-size:.62rem;color:var(--muted2);margin-top:6px;padding:6px 8px;background:var(--bg3);border-radius:var(--r)">Pathway analysis is based on zone, LEP minimum lot size and block size only. Site-specific constraints (slope, easements, DCP frontage, infrastructure) require professional assessment before any pathway can be confirmed.</div>'
  +whtm('The development pathway determines every other variable — yield, DA cost, timeline and financial return. Getting this right before any offer is made protects your capital.')
  +'</div>';
}

// Risk Register
function buildRiskRegister(heritage,flood,bushfire,acid,contaminated,riparian,landRes,foreshore,cm,n,zone,block,mls,geoConf,addrType,blockSource,lga,front){
  var days=cm&&cm.data?cm.data.days:null;
  // confidence helpers
  function conf(level){ return '<span style="font-size:.6rem;font-weight:700;padding:2px 7px;border-radius:4px;background:'+(level==='Verified'?'rgba(62,207,142,.12)':level==='Estimated'?'rgba(245,158,11,.12)':'rgba(239,68,68,.10)')+';\
color:'+(level==='Verified'?'var(--green)':level==='Estimated'?'var(--amber)':'var(--red)')+'">'+level+'</span>'; }
  function row(cat,name,status,why,confidence,next){
    var sc=status==='Pass'?'var(--green)':status==='Caution'?'var(--amber)':status==='Review'?'var(--amber)':'var(--red)';
    return '<tr>'
      +'<td style="padding:7px 8px;font-size:.62rem;color:var(--muted2);white-space:nowrap">'+cat+'</td>'
      +'<td style="padding:7px 8px;font-size:.71rem;font-weight:500;color:var(--text)">'+name+'</td>'
      +'<td style="padding:7px 8px;text-align:center"><span style="font-size:.62rem;font-weight:700;padding:2px 7px;border-radius:4px;background:'+sc+'22;color:'+sc+'">'+status+'</span></td>'
      +'<td style="padding:7px 8px;font-size:.65rem;color:var(--muted);line-height:1.6">'+why+'</td>'
      +'<td style="padding:7px 8px;text-align:center">'+conf(confidence)+'</td>'
      +'<td style="padding:7px 8px;font-size:.63rem;color:var(--muted2);line-height:1.5">'+next+'</td>'
      +'</tr>';
  }
  var rows='';
  // 1. Address match
  var addrStatus = geoConf==='Verified'?'Pass':geoConf==='Estimated'?'Caution':'Review';
  var addrConf   = geoConf==='Verified'?'Verified':geoConf==='Estimated'?'Estimated':'Needs review';
  var addrWhy    = addrType==='lot'?'Lot-based address — Lot number is not a house number. Geocode placed at suburb centroid only.'
    :addrType==='range'?'Range address — exact parcel not confirmed by geocode.'
    :addrType==='street-only'?'Street-only address — no house number provided.'
    :geoConf==='Verified'?'Address matched to rooftop level by Google Maps.'
    :'Address matched at street or suburb level — parcel not confirmed.';
  rows+=row('Address','Address match',addrStatus,addrWhy,addrConf,addrType==='lot'?'Verify Lot and DP via NSW Land Registry Search.':'Confirm address on Certificate of Title.');
  // 2. Parcel / Lot / DP
  var parcelStatus=blockSource==='auto-detected'?'Pass':blockSource==='estimated'?'Caution':'Review';
  var parcelConf=blockSource==='auto-detected'?'Verified':blockSource==='estimated'?'Estimated':'Needs review';
  rows+=row('Parcel','Parcel / Lot / DP',parcelStatus,'Parcel matched via NSW Cadastre coordinate lookup. Lot and DP number require verification via title search.',parcelConf,'Order full title search from NSW Land Registry. Confirm lot and DP number.');
  // 3. Lot size
  var lotSzStatus=blockSource==='auto-detected'?'Pass':block?'Caution':'Review';
  var lotSzConf=blockSource==='auto-detected'?'Verified':block?'Estimated':'Needs review';
  var lotSzWhy=blockSource==='auto-detected'?'Block area '+block+'m\u00b2 detected via NSW Cadastre.'
    :block?'Block area '+block+'m\u00b2 manually entered — confirm against title.':'Block size not provided. Required for subdivision and density calculations.';
  rows+=row('Parcel','Lot size',lotSzStatus,lotSzWhy,lotSzConf,blockSource==='auto-detected'?'Confirm against deposited plan or survey.':'Enter block size or order survey.');
  // 4. Zoning
  var zoneStatus=zone?'Pass':'Review';
  var zoneConf=zone?'Verified':'Needs review';
  rows+=row('Planning','Zoning',zoneStatus,zone?'Zone '+zone+' confirmed via NSW Planning Portal (live).'  :'Zone not detected from NSW Planning Portal for this address.',zoneConf,zone?'Confirm under current LEP. Zone may have recently changed.':'Obtain Section 10.7 Planning Certificate from council.');
  // 5. Minimum lot size
  var mlsStatus=mls?'Pass':'Review';
  rows+=row('Planning','Minimum lot size',mlsStatus,mls?'Min lot size '+mls+'m\u00b2 from NSW Planning Portal. Subject to DCP frontage and width controls.':'Min lot size not detected. Required before any subdivision assessment.',mls?'Estimated':'Needs review','Confirm LEP Schedule 1 and DCP Chapter under '+((lga||'your council')+'.')  );
  // 6. Heritage
  rows+=row('Overlay','Heritage overlay',heritage?'Caution':'Pass',heritage?'Heritage overlay detected. Heritage Impact Statement required before DA lodgement. Adds cost and time.':'No heritage overlay detected via NSW Planning Portal.',heritage?'Estimated':'Verified',heritage?'Engage heritage consultant. Pre-DA meeting with council recommended.':'Confirm on Section 10.7 certificate.');
  // 7. Flood
  rows+=row('Overlay','Flood planning area',flood?'Review':'Pass',flood?'Flood planning area detected. Hydraulic assessment and finished floor level compliance required.':'No flood planning area detected.',flood?'Estimated':'Verified',flood?'Obtain flood study from council. Engage hydraulic engineer for FPL assessment.':'Confirm on Section 10.7 certificate.');
  // 8. Riparian / watercourse
  rows+=row('Overlay','Riparian / watercourse',riparian?'Caution':'Pass',riparian?'Riparian indicator present. Watercourse buffer setbacks may apply under SEPP or LEP.':'No riparian indicator detected.',riparian?'Estimated':'Estimated','Check watercourse buffer requirements under local SEPP and DCP. Not yet fully modelled.');
  // 9. Bushfire
  rows+=row('Overlay','Bushfire prone land',bushfire?'Caution':'Pass',bushfire?'Bushfire prone land. Asset Protection Zone and BAL rating required. Affects construction standards.':'No bushfire prone land detected.',bushfire?'Estimated':'Verified',bushfire?'Obtain BAL assessment. Construction standard compliance required under 4.1.3.':'Confirm via NSW RFS mapping.');
  // 10. Acid sulfate soils
  rows+=row('Overlay','Acid sulfate soils',acid?'Caution':'Pass',acid?'Acid sulfate soil overlay detected. Acid Sulfate Soils Management Plan may be required.':'No acid sulfate soil overlay detected.',acid?'Estimated':'Verified',acid?'Engage geotechnical consultant for ASSMP.':'Confirm on Section 10.7 certificate.');
  // 11. Contaminated land
  rows+=row('Overlay','Contaminated land',contaminated?'Review':'Pass',contaminated?'Contaminated land indicator detected. Remediation and site audit may be required before development.':'No contamination indicator detected.',contaminated?'Needs review':'Verified',contaminated?'Order Phase 1/Phase 2 environmental assessment.':'Confirm on Section 10.7.');
  // 12. Slope / earthworks
  rows+=row('Civil','Slope / earthworks','Caution','Slope and earthworks cannot be assessed from government data alone. Retaining walls, cut/fill and drainage pathways depend on site survey.','Needs review','Commission a site survey and geotechnical assessment.');
  // 13. Stormwater
  rows+=row('Civil','Stormwater','Caution','Stormwater management and overland flow path not modelled. Required for any development approval.','Needs review','Engage civil engineer to assess OSD requirements and connection to public drainage.');
  // 14. Access / frontage
  var frontStatus=front&&front>=12?'Pass':front?'Caution':'Review';
  rows+=row('Civil','Access / frontage',frontStatus,front?'Frontage approximately '+front+'m. Check council DCP minimum frontage for proposed use.':'Frontage not detected. Minimum frontage requirements apply to dual occ, townhouses and subdivision.',front?'Estimated':'Needs review','Confirm frontage against current DCP controls and driveway crossover requirements.');
  // 15. Easements
  rows+=row('Parcel','Easements','Review','Easement locations cannot be determined from geocode data alone. Easements affect building envelope and may prevent subdivision.','Needs review','Search title for registered easements. Review deposited plan for drainage and electricity easements.');
  // 16. DA timeline
  var daStatus=days?'Pass':cm&&cm.councilKnown?'Caution':'Review';
  var daConf=days?'Estimated':cm&&cm.councilKnown?'Estimated':'Needs review';
  var daWhy=days?'DA median '+(cm&&cm.name?cm.name:'council')+': '+days+'d (based on '+((cm&&cm.data&&cm.data.n)||'')+'+ comparable DAs). Range: '+(cm&&cm.data?cm.data.range:'')+'.':cm&&cm.councilKnown?'Council identified ('+((cm&&cm.name)||lga||'unknown')+') but DA timeline data not yet available in SiteVerdict.':'Council not identified from address. DA timeline unknown.';
  rows+=row('Timeline','DA timeline',daStatus,daWhy,daConf,days?'Adjust finance assumptions for actual council timeline. Verify recent trends with council or town planner.':'Check council website for DA determination statistics or call council directly.');
  // 17. Approval stage / CC / OC
  rows+=row('Approval','Approval stage','Review','No Construction Certificate (CC) or Occupation Certificate (OC) status can be confirmed from government data alone. Unknown approval stage is a delivery risk.','Needs review','Request copies of DA consent, CC and OC from vendor. Order 149 certificate for any existing approvals.');
  // 18. Cost to complete
  rows+=row('Financial','Cost-to-complete','Review','Civil delivery costs (earthworks, services, driveway, retaining) cannot be reliably estimated without site survey. Unknown slope and servicing are key cost variables.','Needs review','Request civil quote based on site survey. Do not rely on rule-of-thumb estimates for budget or finance.');
  return '<div class="rsec">'
    +'<div class="rsec-title">Risk register'
    +' <span class="tag" style="background:transparent;border-color:rgba(255,255,255,.1);color:var(--muted)">18 checks &middot; confidence rated</span>'
    +'</div>'
    +'<div style="font-size:.62rem;color:var(--muted2);margin-bottom:8px;line-height:1.7">Each risk is rated against available data. Review and Caution items require independent professional verification before any purchase, finance or development decision.</div>'
    +'<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse">'
      +'<thead><tr>'
        +'<th style="font-size:.54rem;text-transform:uppercase;letter-spacing:.07em;color:var(--muted2);font-weight:600;padding:5px 8px;text-align:left;border-bottom:1px solid var(--border)">Cat.</th>'
        +'<th style="font-size:.54rem;text-transform:uppercase;letter-spacing:.07em;color:var(--muted2);font-weight:600;padding:5px 8px;text-align:left;border-bottom:1px solid var(--border)">Risk</th>'
        +'<th style="font-size:.54rem;text-transform:uppercase;letter-spacing:.07em;color:var(--muted2);font-weight:600;padding:5px 8px;text-align:center;border-bottom:1px solid var(--border)">Status</th>'
        +'<th style="font-size:.54rem;text-transform:uppercase;letter-spacing:.07em;color:var(--muted2);font-weight:600;padding:5px 8px;text-align:left;border-bottom:1px solid var(--border)">Why it matters</th>'
        +'<th style="font-size:.54rem;text-transform:uppercase;letter-spacing:.07em;color:var(--muted2);font-weight:600;padding:5px 8px;text-align:center;border-bottom:1px solid var(--border)">Confidence</th>'
        +'<th style="font-size:.54rem;text-transform:uppercase;letter-spacing:.07em;color:var(--muted2);font-weight:600;padding:5px 8px;text-align:left;border-bottom:1px solid var(--border)">Next verification step</th>'
      +'</tr></thead>'
      +'<tbody>'+rows+'</tbody>'
    +'</table></div>'
  +'</div>';
}

// ── EVIDENCE LEDGER ──────────────────────────────────────────────
function buildEvidenceLedger(zone,block,mls,lga,cm,geoConf,blockSource,addrType,matchedAddr,councilSource,locationType,heritage,flood,bushfire,acid,contaminated,riparian){
  function ledRow(label,value,tag,color){
    return '<div style="display:flex;align-items:baseline;gap:8px;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.04)">'
      +'<div style="flex:1;font-size:.71rem;color:var(--text)">'+label+'</div>'
      +'<div style="font-size:.67rem;color:var(--muted);flex:2">'+value+'</div>'
      +'<span style="font-size:.57rem;font-weight:700;padding:1px 6px;border-radius:3px;white-space:nowrap;background:'+color+'22;color:'+color+'">'+tag+'</span>'
    +'</div>';
  }
  var verified=[], inferred=[], estimated=[], missing=[];
  // Address
  if(geoConf==='Verified'&&addrType==='normal') verified.push(ledRow('Address',matchedAddr||'—','Verified','var(--green)'));
  else if(geoConf==='Estimated') estimated.push(ledRow('Address','Matched at street level — not rooftop','Estimated','var(--amber)'));
  else missing.push(ledRow('Address',addrType==='lot'?'Lot-based — suburb geocode only':addrType==='street-only'?'Street-only — no house number':'Not confirmed','Needs review','var(--red)'));
  // Zone
  if(zone) verified.push(ledRow('Zone',zone+' — NSW Planning Portal (live)','Verified','var(--green)'));
  else missing.push(ledRow('Zone','Not detected from Planning Portal','Needs review','var(--red)'));
  // Block size
  if(blockSource==='auto-detected'&&block) verified.push(ledRow('Block size',block+'m\u00b2 — NSW Cadastre','Verified','var(--green)'));
  else if(block) inferred.push(ledRow('Block size',block+'m\u00b2 — manually entered','Inferred','var(--blue)'));
  else missing.push(ledRow('Block size','Not provided','Needs review','var(--red)'));
  // Min lot size
  if(mls) verified.push(ledRow('Min lot size',mls+'m\u00b2 — NSW Planning Portal','Verified','var(--green)'));
  else missing.push(ledRow('Min lot size','Not detected','Needs review','var(--red)'));
  // Council
  if(councilSource==='planning-portal'&&cm&&cm.name) verified.push(ledRow('Council',cm.name+' — NSW Planning Portal','Verified','var(--green)'));
  else if(cm&&cm.councilKnown) inferred.push(ledRow('Council',(cm.name||lga||'Unknown')+' — suburb/postcode inference','Inferred','var(--blue)'));
  else missing.push(ledRow('Council','Not identified','Needs review','var(--red)'));
  // DA timeline
  if(cm&&cm.data&&cm.data.days) estimated.push(ledRow('DA timeline',cm.data.days+'d median — '+cm.data.n+' comparable DAs','Estimated','var(--amber)'));
  else if(cm&&cm.councilKnown) inferred.push(ledRow('DA timeline','Council known — no SiteVerdict data yet','Inferred','var(--blue)'));
  else missing.push(ledRow('DA timeline','Council not identified','Needs review','var(--red)'));
  // Overlays
  if(heritage) inferred.push(ledRow('Heritage','Detected — NSW Planning Portal','Inferred','var(--blue)'));
  if(flood)    inferred.push(ledRow('Flood','Flood planning area — NSW Planning Portal','Inferred','var(--blue)'));
  if(bushfire) inferred.push(ledRow('Bushfire','Bushfire prone land — NSW Planning Portal','Inferred','var(--blue)'));
  if(acid)     inferred.push(ledRow('Acid sulfate','Detected — NSW Planning Portal','Inferred','var(--blue)'));
  if(contaminated) estimated.push(ledRow('Contamination','Indicator — not a confirmed site audit','Estimated','var(--amber)'));
  if(riparian) estimated.push(ledRow('Riparian','Indicator — watercourse buffer not fully modelled','Estimated','var(--amber)'));
  // Always missing
  missing.push(ledRow('Slope / earthworks','Not assessed — requires site survey','Needs review','var(--red)'));
  missing.push(ledRow('Easements','Not modelled — requires title search','Needs review','var(--red)'));
  missing.push(ledRow('Services','Sewer/stormwater capacity not confirmed','Needs review','var(--red)'));
  missing.push(ledRow('CC / OC status','Not available — requires document check','Needs review','var(--red)'));

  function section(title,color,items){
    if(!items.length) return '';
    return '<div style="margin-bottom:12px">'
      +'<div style="font-size:.6rem;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:'+color+';margin-bottom:4px">'+title+' ('+items.length+')</div>'
      +items.join('')
    +'</div>';
  }
  return '<div class="rsec">'
    +'<div class="rsec-title">Evidence ledger'
    +' <span class="tag" style="background:transparent;border-color:rgba(255,255,255,.1);color:var(--muted)">Verified \u00b7 Inferred \u00b7 Estimated \u00b7 Missing</span>'
    +'</div>'
    +section('Verified — confirmed from government data sources','var(--green)',verified)
    +section('Inferred — derived from available data','var(--blue)',inferred)
    +section('Estimated — indicative only, not confirmed','var(--amber)',estimated)
    +section('Missing / Needs professional review','var(--red)',missing)
  +'</div>';
}

// ── DEVELOPMENT PATHWAY (confidence-gated) ───────────────────────
function buildDevPathway(zone,block,mls,n,heritage,flood,cm,geoConf,addrType){
  // Gate: if confidence is weak, pathway is preliminary signal only
  var isWeak = geoConf!=='Verified'||addrType==='lot'||addrType==='street-only'||addrType==='range';
  var days=cm&&cm.data?cm.data.days:null;
  var possibleLots=block&&mls&&block>=mls?Math.floor(block/mls):n;
  var lotsForPath=Math.max(n,possibleLots||0);

  var paths=[];
  // Secondary dwelling
  if(zone&&(zone.indexOf('R')===0||zone.indexOf('E')===0)&&block>=450)
    paths.push({label:'Secondary dwelling / granny flat',signal:'Possible',complexity:'Low',
      note:'Subject to SEPP 2021 controls. 60m\u00b2 max. Requires council DCP compliance.',
      disclaimer:'Preliminary signal only. SEPP 2021 controls apply. Verify with town planner.'});
  // Dual occupancy
  if(block>=600&&(zone==='R1'||zone==='R2'||zone==='R3')&&!heritage)
    paths.push({label:'Dual occupancy',signal:'Possible',complexity:'Medium',
      note:'Block '+block+'m\u00b2 may support dual occ. Subject to LEP and DCP controls.',
      disclaimer:'Estimated pathway. Not pre-approved. Town planner verification required.'});
  // Subdivision
  if(lotsForPath>=2&&mls&&block>=mls*2)
    paths.push({label:'Torrens title subdivision ('+(lotsForPath)+' lots est.)',signal:'Preliminary',complexity:'High',
      note:'Estimated '+(lotsForPath)+' lots at '+(mls)+'m\u00b2 min. Subject to frontage, access, services and DCP.',
      disclaimer:'Estimated yield only. Not a planning assessment. Town planner and civil designer required.'});
  // Townhouse / multi-dwelling
  if(zone==='R3'&&block>=800)
    paths.push({label:'Townhouse / multi-dwelling',signal:'Possible',complexity:'High',
      note:'R3 zone may support multi-dwelling housing subject to LEP height, FSR and DCP controls.',
      disclaimer:'Preliminary signal only. FSR, height and setback compliance must be verified by licensed town planner.'});
  // DA delivery review
  if(zone&&block&&n>=2)
    paths.push({label:'Approved DA delivery review',signal:'Enquire',complexity:'Assessment',
      note:'If DA consent exists, delivery scope and cost-to-complete require independent civil and building review.',
      disclaimer:'SiteVerdict does not confirm existence of DA consent. Request documents from vendor.'});

  if(!paths.length) paths.push({label:'Pathway requires further assessment',signal:'Review',complexity:'Undetermined',
    note:'Insufficient data to identify a clear pathway. Zone, block size or address data missing.',
    disclaimer:'Manual review required. Contact SiteVerdict or engage a licensed town planner.'});

  var pathHtml=paths.map(function(p){
    var sc=p.signal==='Possible'?'var(--green)':p.signal==='Preliminary'?'var(--amber)':'var(--muted)';
    return '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:12px 14px;margin-bottom:8px">'
      +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">'
        +'<span style="font-size:.7rem;font-weight:600;color:var(--text)">'+p.label+'</span>'
        +'<span style="font-size:.58rem;font-weight:700;padding:2px 7px;border-radius:4px;background:'+sc+'22;color:'+sc+'">'+p.signal+'</span>'
        +'<span style="font-size:.58rem;color:var(--muted2);margin-left:auto">'+p.complexity+'</span>'
      +'</div>'
      +'<div style="font-size:.67rem;color:var(--muted);line-height:1.6;margin-bottom:4px">'+p.note+'</div>'
      +'<div style="font-size:.6rem;color:var(--muted2);font-style:italic">'+p.disclaimer+'</div>'
    +'</div>';
  }).join('');

  return '<div class="rsec">'
    +'<div class="rsec-title">Development pathway'
    +' <span class="tag" style="background:transparent;border-color:rgba(255,255,255,.1);color:var(--muted)">Preliminary signal only</span>'
    +'</div>'
    +(isWeak?'<div style="font-size:.62rem;color:var(--amber);padding:6px 8px;background:rgba(245,158,11,.06);border:1px solid rgba(245,158,11,.2);border-radius:6px;margin-bottom:8px">&#9888; Address or parcel confidence is Limited. Pathway below is preliminary signal only. Do not rely on this for any purchase, finance or development decision without professional verification.</div>':'')
    +pathHtml
  +'</div>';
}

// ── PROFESSIONAL VERIFICATION CHECKLIST ──────────────────────────
function buildVerificationChecklist(zone,block,heritage,flood,bushfire,acid,contaminated,riparian,cm,n,addrType){
  var items=[
    {cat:'Title',item:'Full title search',who:'Solicitor / conveyancer',priority:'High'},
    {cat:'Survey',item:'Site survey and contour plan',who:'Licensed surveyor',priority:'High'},
    {cat:'Planning',item:'Section 10.7 Planning Certificate (full)',who:'Council',priority:'High'},
    {cat:'Planning',item:'LEP zone controls and Schedule 1 check',who:'Town planner',priority:'High'},
    {cat:'Planning',item:'DCP controls — frontage, setbacks, car parking',who:'Town planner',priority:'High'},
  ];
  if(heritage) items.push({cat:'Heritage',item:'Heritage assessment and Impact Statement',who:'Heritage consultant',priority:'High'});
  if(flood)    items.push({cat:'Flood',item:'Flood study and FPL assessment',who:'Hydraulic engineer',priority:'High'});
  if(riparian) items.push({cat:'Flood',item:'Riparian buffer and watercourse setback check',who:'Hydraulic engineer / town planner',priority:'Medium'});
  if(bushfire) items.push({cat:'Bushfire',item:'BAL rating assessment',who:'Accredited bushfire consultant',priority:'High'});
  if(acid)     items.push({cat:'Soils',item:'Acid sulfate soils management plan',who:'Geotechnical engineer',priority:'Medium'});
  if(contaminated) items.push({cat:'Environment',item:'Phase 1 / Phase 2 environmental assessment',who:'Environmental consultant',priority:'High'});
  items.push({cat:'Civil',item:'Stormwater and OSD assessment',who:'Civil engineer',priority:'High'});
  items.push({cat:'Civil',item:'Sewer and water connection capacity check',who:'Licensed plumber / Sydney Water',priority:'High'});
  items.push({cat:'Civil',item:'Driveway and access design',who:'Civil engineer / council',priority:'Medium'});
  items.push({cat:'Parcel',item:'Easement search and deposited plan review',who:'Solicitor / surveyor',priority:'High'});
  items.push({cat:'Approvals',item:'DA consent, CC and OC document check',who:'Certifier / solicitor',priority:'High'});
  items.push({cat:'Approvals',item:'Council conditions of consent review',who:'Town planner / solicitor',priority:'High'});
  if(n>=2) items.push({cat:'Civil',item:'Civil design for subdivision infrastructure',who:'Civil engineer',priority:'High'});
  items.push({cat:'Financial',item:'Cost-to-complete assessment',who:'Quantity surveyor / civil contractor',priority:'Medium'});

  function priorityColor(p){ return p==='High'?'var(--red)':'var(--amber)'; }
  var rows=items.map(function(it){
    return '<tr>'
      +'<td style="padding:5px 8px;font-size:.6rem;color:var(--muted2)">'+it.cat+'</td>'
      +'<td style="padding:5px 8px;font-size:.68rem;color:var(--text)">'+it.item+'</td>'
      +'<td style="padding:5px 8px;font-size:.64rem;color:var(--muted)">'+it.who+'</td>'
      +'<td style="padding:5px 8px;text-align:center"><span style="font-size:.57rem;font-weight:700;padding:2px 6px;border-radius:3px;background:'+priorityColor(it.priority)+'22;color:'+priorityColor(it.priority)+'">'+it.priority+'</span></td>'
    +'</tr>';
  }).join('');
  return '<div class="rsec">'
    +'<div class="rsec-title">Professional verification checklist'
    +' <span class="tag" style="background:transparent;border-color:rgba(255,255,255,.1);color:var(--muted)">'+items.length+' items</span>'
    +'</div>'
    +'<div style="font-size:.62rem;color:var(--muted2);margin-bottom:8px;line-height:1.7">Every item below must be completed by the listed professional before any purchase, finance or development decision. This checklist does not replace professional advice.</div>'
    +'<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse">'
      +'<thead><tr>'
        +'<th style="font-size:.54rem;text-transform:uppercase;letter-spacing:.07em;color:var(--muted2);padding:4px 8px;text-align:left;border-bottom:1px solid var(--border)">Category</th>'
        +'<th style="font-size:.54rem;text-transform:uppercase;letter-spacing:.07em;color:var(--muted2);padding:4px 8px;text-align:left;border-bottom:1px solid var(--border)">Verification item</th>'
        +'<th style="font-size:.54rem;text-transform:uppercase;letter-spacing:.07em;color:var(--muted2);padding:4px 8px;text-align:left;border-bottom:1px solid var(--border)">Who</th>'
        +'<th style="font-size:.54rem;text-transform:uppercase;letter-spacing:.07em;color:var(--muted2);padding:4px 8px;text-align:center;border-bottom:1px solid var(--border)">Priority</th>'
      +'</tr></thead>'
      +'<tbody>'+rows+'</tbody>'
    +'</table></div>'
  +'</div>';
}

// ── SHAREABLE SUMMARY ─────────────────────────────────────────────
// Public-safe: no owner, no lead data, no internal notes, address hidden
function buildShareableSummary(zone,block,mls,n,cm,heritage,flood,bushfire,geoConf,addrType,overall){
  var safeAddr = addrType==='lot'?'[Lot address — not shown]':'[Address on file — not shown publicly]';
  var confColor = geoConf==='Verified'?'var(--green)':'var(--amber)';
  var riskCount = [heritage,flood,bushfire].filter(Boolean).length;
  return '<div class="rsec" style="background:rgba(91,156,242,.04);border-color:rgba(91,156,242,.2)">'
    +'<div class="rsec-title" style="color:var(--blue)">&#128279; Shareable summary'
    +' <span class="tag" style="background:transparent;border-color:rgba(91,156,242,.2);color:var(--muted)">No owner data \u00b7 No lead data \u00b7 Address hidden</span>'
    +'</div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:.71rem;color:var(--muted)">'
      +'<div><span style="color:var(--muted2)">Address:</span> '+safeAddr+'</div>'
      +'<div><span style="color:var(--muted2)">Zone:</span> '+(zone||'Not detected')+'</div>'
      +'<div><span style="color:var(--muted2)">Block size:</span> '+(block?block+'m\u00b2':'Not provided')+'</div>'
      +'<div><span style="color:var(--muted2)">Council:</span> '+(cm&&cm.name?cm.name:'Not identified')+'</div>'
      +'<div><span style="color:var(--muted2)">DA median:</span> '+(cm&&cm.data?cm.data.days+'d':'Not available')+'</div>'
      +'<div><span style="color:var(--muted2)">Overlays flagged:</span> '+riskCount+'</div>'
      +'<div><span style="color:var(--muted2)">Address confidence:</span> <span style="color:'+confColor+'">'+geoConf+'</span></div>'
      +'<div><span style="color:var(--muted2)">Preliminary signal:</span> '+(n>=2?n+'-lot pathway identified':'Single dwelling')+'</div>'
    +'</div>'
    +'<div style="margin-top:8px;font-size:.6rem;color:var(--muted2);line-height:1.7">This summary contains no owner, applicant or internal lead information. It is derived from publicly available government data sources. Confidence and risk shown are indicative only. Not planning advice. Not financial advice. Professional verification required before any reliance.</div>'
  +'</div>';
}


function buildCouncilBehaviour(lga,cm){
  if(!cm||!cm.data){
    var _cmName = (cm&&cm.name) ? cm.name : (lga||'This council');
    var _known  = cm&&cm.councilKnown;
    var _body   = _known
      ? '<strong>'+_cmName+'</strong> has been identified from NSW Planning Portal data.'
        +' DA timeline and processing history coverage is not yet available for this council in SiteVerdict.'
        +' <span style="display:block;margin-top:6px">SiteVerdict can still provide preliminary site-risk context,'
        +' but local DA timing, council processing patterns and recent approval history should be'
        +' verified directly with council or through a professional review.</span>'
      : _cmName+' could not be identified from available NSW Planning Portal data for this address.'
        +' DA timeline estimates are not available.'
        +' Enter the full address including suburb, state and postcode and try again,'
        +' or request a manual SiteVerdict review.';
    return '<div class="rsec">'
      +'<div class="rsec-title">Council behaviour analysis</div>'
      +'<div style="font-size:.76rem;color:var(--muted);padding:8px 0;line-height:1.7">'+_body+'</div>'
      +(_known
        ? '<div style="font-size:.67rem;color:var(--amber);padding:4px 8px;background:rgba(245,158,11,.07);'
          +'border:1px solid rgba(245,158,11,.2);border-radius:6px;margin-top:4px">'
          +'&#9888;&nbsp;DA timeline coverage: Not yet available'
          +' &middot; Confidence: Needs review'
          +' &middot; Professional verification required'
          +'</div>'
        : '')
      +'</div>';
  }
  var d=cm.data,name=cm.name;
  var speed=d.days<=45?'Very fast':d.days<=90?'Fast':d.days<=150?'Average':d.days<=250?'Slow':'Very slow';
  var sc=d.days<=90?'var(--green)':d.days<=150?'var(--amber)':'var(--red)';
  var pct=Math.max(5,Math.min(95,Math.round((350-d.days)/3.5)));
  var rfiLevel=d.days>200?'High':d.days>120?'Medium':'Low';
  var rfiDesc=d.days>200?'Complex DAs frequently receive Requests for Information. Each RFI pauses the clock.':d.days>120?'RFIs possible on large or complex subdivisions. Complete DA package reduces risk.':'Well-prepared applications generally move without RFIs.';
  var advice=d.days>200?'Book a free pre-DA meeting before lodging. This council is in the slowest quartile of NSW. Engage a planner with direct '+name+' experience \u2014 council familiarity reduces RFI risk materially.':
    d.days>120?'Allow '+(Math.round(d.days/30)+3)+'\u2013'+(Math.round(d.days/30)+6)+' months from lodgement. Prepare a complete DA package to minimise RFI risk.':
    'Well-prepared applications in '+name+' move quickly. Invest in a thorough DA package upfront to avoid delays.';
  return '<div class="rsec">'
    +'<div class="rsec-title">Council behaviour analysis <span class="tag tag-live">'+d.n+' real DAs</span><span class="rsec-meta">'+(cm.name||lga)+'</span></div>'
    +'<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px">'
      +'<div class="card"><div class="card-lbl">DA median</div><div class="card-val" style="color:'+sc+'">'+d.days+'d</div><div class="card-sub">'+speed+' \u00b7 Range: '+d.range+'</div></div>'
      +'<div class="card"><div class="card-lbl">RFI risk</div><div class="card-val '+(d.days>200?'r':d.days>120?'a':'g')+'">'+rfiLevel+'</div><div class="card-sub">'+rfiDesc+'</div></div>'
      +'<div class="card"><div class="card-lbl">Speed rank</div><div class="card-val a">'+pct+'th pct</div><div class="card-sub">vs 34 councils in database</div></div>'
    +'</div>'
    +'<div style="font-size:.74rem;color:var(--muted);line-height:1.85"><strong style="color:var(--text)">Strategy for '+name+':</strong> '+advice+'</div>'
  +whtm('Council DA speed directly affects holding costs. At 7% interest on a $4M purchase, each 3-month delay costs ~$70K. Liverpool’s 314-day median is a key financial risk — not a planning one.')
  +'</div>';
}

// Financial Feasibility Assumptions (editable, no invented prices)
function buildFinancialAssumptions(n){
  var lots=n>=2?n:2;
  var uid='fa'+Date.now();
  return '<div class="rsec">'
    +'<div class="rsec-title">Financial feasibility assumptions <span class="tag tag-est">indicative only \u2014 not valuation advice</span></div>'
    +'<div style="background:rgba(245,158,11,.07);border:1px solid rgba(245,158,11,.2);border-radius:var(--r);padding:8px 11px;font-size:.68rem;color:var(--amber);margin-bottom:10px">&#9888; Enter your own assumptions. No market prices are provided or implied. This is not a valuation. Not financial advice. Engage a registered valuer and financial advisor before any investment decision.</div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">'
      +'<div><label style="font-size:.56rem;text-transform:uppercase;letter-spacing:.07em;color:var(--muted2);display:block;margin-bottom:3px">Land acquisition price ($)</label>'
        +'<input type="number" id="'+uid+'_land" class="fi" placeholder="Enter land price" min="0" step="50000" style="font-size:.8rem;padding:8px 10px" oninput="svCalcFin(\''+uid+'\','+lots+')" /></div>'
      +'<div><label style="font-size:.56rem;text-transform:uppercase;letter-spacing:.07em;color:var(--muted2);display:block;margin-bottom:3px">Your estimated lot sale price ($/lot)</label>'
        +'<input type="number" id="'+uid+'_lotsale" class="fi" placeholder="Enter your estimate" min="0" step="10000" style="font-size:.8rem;padding:8px 10px" oninput="svCalcFin(\''+uid+'\','+lots+')" /></div>'
      +'<div><label style="font-size:.56rem;text-transform:uppercase;letter-spacing:.07em;color:var(--muted2);display:block;margin-bottom:3px">Civil cost per lot ($) <span style="font-weight:400;text-transform:none">(Rawlinsons est. $70K)</span></label>'
        +'<input type="number" id="'+uid+'_civil" class="fi" value="70000" min="0" step="5000" style="font-size:.8rem;padding:8px 10px" oninput="svCalcFin(\''+uid+'\','+lots+')" /></div>'
      +'<div><label style="font-size:.56rem;text-transform:uppercase;letter-spacing:.07em;color:var(--muted2);display:block;margin-bottom:3px">S7.11 per lot ($) <span style="font-weight:400;text-transform:none">(est. $24K \u2014 confirm with council)</span></label>'
        +'<input type="number" id="'+uid+'_s711" class="fi" value="24000" min="0" step="1000" style="font-size:.8rem;padding:8px 10px" oninput="svCalcFin(\''+uid+'\','+lots+')" /></div>'
      +'<div><label style="font-size:.56rem;text-transform:uppercase;letter-spacing:.07em;color:var(--muted2);display:block;margin-bottom:3px">Interest rate (% pa)</label>'
        +'<input type="number" id="'+uid+'_rate" class="fi" value="7" min="1" max="30" step="0.5" style="font-size:.8rem;padding:8px 10px" oninput="svCalcFin(\''+uid+'\','+lots+')" /></div>'
      +'<div><label style="font-size:.56rem;text-transform:uppercase;letter-spacing:.07em;color:var(--muted2);display:block;margin-bottom:3px">Holding period (months)</label>'
        +'<input type="number" id="'+uid+'_hold" class="fi" value="18" min="1" max="60" style="font-size:.8rem;padding:8px 10px" oninput="svCalcFin(\''+uid+'\','+lots+')" /></div>'
    +'</div>'
    +'<div id="'+uid+'_out" style="background:var(--bg3);border-radius:var(--r);padding:10px 12px;font-size:.7rem;color:var(--muted);font-style:italic">Enter land price and lot sale price above to see indicative calculations.</div>'
  +whtm('Entering real land price and estimated lot values reveals whether this deal works. Most investors underestimate holding costs and S7.11 contributions — the two variables that most often kill otherwise viable projects.')
  +'</div>';
}
function svCalcFin(uid,lots){
  var land=parseFloat(document.getElementById(uid+'_land').value)||0;
  var lsp =parseFloat(document.getElementById(uid+'_lotsale').value)||0;
  var cpl =parseFloat(document.getElementById(uid+'_civil').value)||70000;
  var s7  =parseFloat(document.getElementById(uid+'_s711').value)||24000;
  var rate=parseFloat(document.getElementById(uid+'_rate').value)||7;
  var mo  =parseFloat(document.getElementById(uid+'_hold').value)||18;
  var out =document.getElementById(uid+'_out');
  if(!land&&!lsp){out.innerHTML='<span style="font-style:italic">Enter land price and lot sale price above.</span>';return;}
  var gross=lsp*lots;
  var civil=cpl*lots,s711=s7*lots,prof=150000;
  var hold=land*(rate/100)*(mo/12);
  var sell=gross*0.025;
  var sub=civil+s711+prof;
  var cont=sub*0.15;
  var total=land+civil+s711+prof+hold+sell+cont;
  var margin=gross-total;
  var roi=land>0?((margin/(land+sub+hold+cont))*100):0;
  var f=function(n){return'$'+Math.round(n).toLocaleString('en-AU');};
  var mc=margin>=0?'var(--green)':'var(--red)';
  var rc=roi>=15?'var(--green)':roi>=8?'var(--amber)':'var(--red)';
  out.innerHTML='<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'
    +'<div style="font-size:.66rem;line-height:2;color:var(--muted)">'
      +'Gross = lot price \u00d7 '+lots+' lots<br>'
      +'Civil = $'+cpl.toLocaleString('en-AU')+' \u00d7 '+lots+'<br>'
      +'S7.11 = $'+s7.toLocaleString('en-AU')+' \u00d7 '+lots+'<br>'
      +'Prof. fees (est.): '+f(prof)+'<br>'
      +'Holding = land \u00d7 '+rate+'% \u00d7 '+mo+'mo\u00f712<br>'
      +'Selling = gross \u00d7 2.5%<br>'
      +'Contingency = civil+contrib+prof \u00d7 15%'
    +'</div>'
    +'<div style="font-size:.7rem;line-height:2">'
      +'<div style="display:flex;justify-content:space-between"><span style="color:var(--muted)">Gross realisation</span><span style="font-family:var(--font-mono)">'+f(gross)+'</span></div>'
      +'<div style="display:flex;justify-content:space-between"><span style="color:var(--muted)">Total costs (ex land)</span><span style="font-family:var(--font-mono)">'+f(total-land)+'</span></div>'
      +'<div style="display:flex;justify-content:space-between"><span style="color:var(--muted)">Land cost</span><span style="font-family:var(--font-mono)">'+f(land)+'</span></div>'
      +'<div style="border-top:1px solid var(--border);padding-top:6px;display:flex;justify-content:space-between"><strong>Indicative margin</strong><strong style="font-family:var(--font-mono);color:'+mc+'">'+f(margin)+'</strong></div>'
      +'<div style="display:flex;justify-content:space-between"><span style="color:var(--muted)">Indicative ROI</span><span style="font-family:var(--font-mono);color:'+rc+'">'+roi.toFixed(1)+'%</span></div>'
    +'</div>'
  +'</div>'
  +'<div style="margin-top:8px;font-size:.58rem;color:var(--muted2);padding:5px 8px;background:var(--bg);border-radius:var(--r)">INDICATIVE ONLY. Based on '+lots+'-lot LEP estimate and user-entered assumptions. Professional fees estimated at $150K. Contingency 15%. Not a valuation. Not financial advice.</div>';
}

// Professional Verification Required
// ── PERSONA-SPECIFIC NEXT STEPS ──────────────────────────────────
// Safe, non-advisory next steps by user type.
// Never investment advice, financial advice, or guaranteed outcomes.
function buildPersonaNextSteps(zone,cm,heritage,flood,bushfire,block,addrType,overall){
  var low  = overallScore < 70;
  var _cm  = cm&&cm.name?cm.name:'your council';
  var _z   = zone||'unknown zone';
  var _weak = addrType==='lot'||addrType==='range';

  var sections = [

    // ── Investor / Buyer ─────────────────────────────────────────
    '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:16px 18px;margin-bottom:10px">'      +'<div style="font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--muted2);margin-bottom:8px">&#127968; Investor / Buyer</div>'      +'<div style="font-size:.78rem;color:var(--muted);line-height:1.8">'        +(low?'<div style="color:var(--amber);margin-bottom:6px">&#9888; Lower-priority site based on current checks. A Full Report is still available if you want to verify further.</div>':'')        +'<div style="margin-bottom:4px">&#9679; Zone '+esc(_z,20)+' &mdash; check what development is permissible under the LEP before relying on any planning signal.</div>'        +(heritage?'<div style="margin-bottom:4px">&#9679; Heritage overlay present &mdash; Heritage Impact Statement required. Seek specialist advice before purchase.</div>':'')        +(flood?'<div style="margin-bottom:4px">&#9679; Flood planning area &mdash; hydraulic assessment required. This affects lender appetite and insurance.</div>':'')        +'<div style="margin-bottom:4px">&#9679; A Full Report adds zone controls, DCP constraints, risk register and comparable DAs. Recommended before any purchase reliance.</div>'        +'<div style="font-size:.62rem;color:var(--muted2);margin-top:8px;padding-top:8px;border-top:1px solid var(--border)">Not investment advice. Not financial advice. Not a planning certificate. A licensed town planner and solicitor must be engaged before any purchase decision.</div>'      +'</div>'    +'</div>',

    // ── Builder ──────────────────────────────────────────────────
    '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:16px 18px;margin-bottom:10px">'      +'<div style="font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--muted2);margin-bottom:8px">&#128296; Builder</div>'      +'<div style="font-size:.78rem;color:var(--muted);line-height:1.8">'        +'<div style="margin-bottom:4px">&#9679; Likely delivery checks: driveway/access, drainage, retaining walls, external works, lot dimensions.</div>'        +(flood?'<div style="margin-bottom:4px">&#9679; Flood planning area &mdash; drainage and finished floor level compliance required.</div>':'')        +(bushfire?'<div style="margin-bottom:4px">&#9679; Bushfire prone land &mdash; BAL rating and construction standards apply.</div>':'')        +'<div style="margin-bottom:4px">&#9679; Confirm sewer/stormwater connection points and easements before quoting.</div>'        +'<div style="margin-bottom:4px">&#9679; Request a cost/services quote via the Services page for a project-specific estimate.</div>'        +'<div style="font-size:.62rem;color:var(--muted2);margin-top:8px;padding-top:8px;border-top:1px solid var(--border)">Delivery risks depend on actual site conditions. A site inspection and licensed civil/structural engineer are required before committing to scope or price.</div>'      +'</div>'    +'</div>',

    // ── Broker / Finance ─────────────────────────────────────────
    '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:16px 18px;margin-bottom:10px">'      +'<div style="font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--muted2);margin-bottom:8px">&#127974; Broker / Finance Support</div>'      +'<div style="font-size:.78rem;color:var(--muted);line-height:1.8">'        +'<div style="margin-bottom:4px">&#9679; A lender-ready planning report may support a finance conversation for development proposals.</div>'        +(cm&&cm.data&&cm.data.days?'<div style="margin-bottom:4px">&#9679; '+esc(_cm,40)+' DA median: '+cm.data.days+'d. This affects construction loan draw-down timing.</div>':'')        +(flood||heritage?'<div style="margin-bottom:4px">&#9679; Flood or heritage overlay present &mdash; lender appetite may be reduced. Verify with client\u2019s broker or lender directly.</div>':'')        +'<div style="font-size:.62rem;color:var(--muted2);margin-top:8px;padding-top:8px;border-top:1px solid var(--border)">Not financial advice. Not credit advice. Not loan approval. A licensed finance broker and/or credit representative must be engaged. SiteVerdict does not assess borrowing capacity or serviceability.</div>'      +'</div>'    +'</div>',

    // ── Town Planner ─────────────────────────────────────────────
    '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:16px 18px;margin-bottom:10px">'      +'<div style="font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--muted2);margin-bottom:8px">&#128203; Town Planner</div>'      +'<div style="font-size:.78rem;color:var(--muted);line-height:1.8">'        +'<div style="margin-bottom:4px">&#9679; Verification checklist: LEP zone &middot; permissible uses &middot; minimum lot size &middot; FSR &middot; height &middot; setbacks &middot; DCP frontage controls &middot; car parking &middot; SEPP applicability.</div>'        +(heritage?'<div style="margin-bottom:4px">&#9679; Heritage overlay: confirm listing status, heritage item or conservation area.</div>':'')        +(flood?'<div style="margin-bottom:4px">&#9679; Flood planning area: confirm flood planning levels and development controls.</div>':'')        +'<div style="margin-bottom:4px">&#9679; DA timeline shown is indicative based on comparable DAs. Actual processing time depends on application type and completeness.</div>'        +'<div style="font-size:.62rem;color:var(--muted2);margin-top:8px;padding-top:8px;border-top:1px solid var(--border)">This check uses live NSW government data. Full LEP/DCP review must be completed by a licensed town planner.</div>'      +'</div>'    +'</div>',

    // ── Civil Designer ───────────────────────────────────────────
    '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:16px 18px;margin-bottom:10px">'      +'<div style="font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--muted2);margin-bottom:8px">&#128295; Civil Designer</div>'      +'<div style="font-size:.78rem;color:var(--muted);line-height:1.8">'        +'<div style="margin-bottom:4px">&#9679; Civil checks required: stormwater &middot; access/driveway &middot; slope and earthworks &middot; retaining walls &middot; easements &middot; service connections (sewer, water, power).</div>'        +(flood?'<div style="margin-bottom:4px">&#9679; Flood planning area: stormwater management and flood mitigation requirements apply.</div>':'')        +'<div style="margin-bottom:4px">&#9679; Lot dimensions, easement locations and survey data from NSW Land Registry required before design.</div>'        +'<div style="font-size:.62rem;color:var(--muted2);margin-top:8px;padding-top:8px;border-top:1px solid var(--border)">Site survey, geotechnical report and council engineering guidelines required. This check does not provide survey data.</div>'      +'</div>'    +'</div>',

    // ── Owner / Homeowner ─────────────────────────────────────────
    '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:16px 18px;margin-bottom:10px">'      +'<div style="font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--muted2);margin-bottom:8px">&#127968; Homeowner / Owner</div>'      +'<div style="font-size:.78rem;color:var(--muted);line-height:1.8">'        +'<div style="margin-bottom:4px">&#9679; Your property is in '+esc(_z,20)+' zone. Check what changes or additions are permissible before starting any works.</div>'        +(heritage?'<div style="margin-bottom:4px">&#9679; Heritage overlay &mdash; talk to your council before any external changes. Heritage approval may be required.</div>':'')        +'<div style="margin-bottom:4px">&#9679; For a granny flat, extension, or subdivision, a licensed town planner or draftsperson is the right first step.</div>'        +'<div style="margin-bottom:4px">&#9679; Contact '+esc(_cm,40)+' for a pre-DA meeting to understand what is and isn\u2019t possible before spending money.</div>'        +'<div style="font-size:.62rem;color:var(--muted2);margin-top:8px;padding-top:8px;border-top:1px solid var(--border)">This is a starting-point check only, not formal planning advice. Talk to a licensed professional before spending money or making decisions.</div>'      +'</div>'    +'</div>'

  ,

    '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:16px 18px;margin-bottom:10px">'      +'<div style="font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--muted2);margin-bottom:8px">&#9989; Certifier / PCA</div>'      +'<div style="font-size:.78rem;color:var(--muted);line-height:1.8">'        +'<div style="margin-bottom:4px">&#9679; Approval stage is unverified unless DA consent, CC and OC documents are provided by vendor or applicant.</div>'        +'<div style="margin-bottom:4px">&#9679; Construction Certificate: confirm conditions of consent, approved plans, and any s.96 modifications.</div>'        +'<div style="margin-bottom:4px">&#9679; Occupation Certificate: confirm final inspection, fire safety schedule, and all conditions cleared.</div>'        +'<div style="margin-bottom:4px">&#9679; BASIX, BCAR and NCC compliance documentation required.</div>'        +'<div style="font-size:.62rem;color:var(--muted2);margin-top:8px;padding-top:8px;border-top:1px solid var(--border)">SiteVerdict does not confirm DA status, CC issuance or OC completion. All approval stage verification must be conducted by a licensed certifier via council, GIPA or ePlanning portal.</div>'      +'</div>'    +'</div>'

  ];

  return '<div class="rsec">'    +'<div class="rsec-title">Next steps by role'    +' <span class="tag" style="background:transparent;border-color:rgba(255,255,255,.1);color:var(--muted)">Select what applies to you</span>'    +'</div>'    +'<div style="font-size:.66rem;color:var(--muted2);margin-bottom:10px">'      +'Not investment advice. Not financial advice. Not a planning certificate. Not legal advice. '      +'These are indicative next steps only. A licensed professional must be engaged before any decision.'    +'</div>'    + sections.join('')  +'</div>';
}


function buildProVerification(){
  return '<div class="rsec" style="background:rgba(200,168,75,.04);border-color:rgba(200,168,75,.18)">'
    +'<div class="rsec-title" style="color:var(--gold)">&#9888; Professional verification required</div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:.74rem;color:var(--muted);line-height:1.9">'
      +'<div><div style="font-weight:500;color:var(--text);margin-bottom:4px">&#10003; Confirmed via 16+ live data sources</div>'
        +'Zone &middot; Min lot size &middot; Heritage &middot; Flood &middot; Bushfire &middot; Acid sulfate &middot; Contaminated land &middot; Riparian / watercourse indicators (where available) &middot; Land reservation &middot; Foreshore &middot; FSR &middot; Height &middot; SEPP 2024 proximity &middot; DA timeline (34 councils) &middot; Block size (cadastre) &middot; Comparable DAs (DA Leads API)</div>'
      +'<div><div style="font-weight:500;color:var(--text);margin-bottom:4px">&#9888; Requires licensed professional</div>'
        +'Lot boundaries &middot; Title easements &middot; Slope &amp; earthworks &middot; Sewer &amp; water capacity &middot; Tree preservation &middot; DCP frontage controls &middot; Dwelling position &middot; Driveway access &middot; Council pre-DA feedback &middot; SEPP exact applicability</div>'
    +'</div>'
    +'<div style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(200,168,75,.15);font-size:.68rem;color:var(--muted2)">This is an automated government data check only. Not a planning certificate. Not legal advice. Not financial advice. A licensed town planner, surveyor, civil engineer and solicitor must be engaged before any investment or development decision. Where referral arrangements exist, they are disclosed transparently before any client commits to services.</div>'
  +'</div>';
}

// ── UPDATED renderResult WRAPPER ────────────────────
function renderResult(addr,zone,zoneName,lga,mls,block,front,n,cm,heritage,flood,fsr,height,infra,comps,landReserve,foreshore,zoneAllows,mlsReal,acidSulfate,contaminated,riparian,bushfire,seppStation400,seppStation800,seppLightRail800,skipLotCount,blockSource,geoSource,geoConf,matchedAddr,addrType,lotNum,councilSource,locationType,paidApiUsed,lotGeoWarn){
  // Calculate scores
  var ps =calcPlanningStrength(zone,mls,mlsReal,heritage,fsr,height,zoneAllows);
  var ov =calcOverlayRisk(heritage,flood,bushfire,acidSulfate,contaminated,riparian,landReserve,foreshore);
  var yp =calcYieldPotential(block,mls,zone);
  var ac =calcApprovalConfidence(zone,heritage,flood,bushfire,zoneAllows,cm);
  var hc =calcHoldingCostRisk(cm);
  var cc =calcCouncilComplexity(cm);
  var ir =5; // Infrastructure unknown — honest default
  var ep =zoneAllows&&n>=2?7:4;
  var overall=Math.min(99,Math.max(1,Math.round((ps*0.2+ov*0.15+yp*0.2+ac*0.15+(10-ir)*0.1+hc*0.1+cc*0.05+ep*0.05)*10)));

  // Run inner renderer (sets innerHTML on #result)
  try{
    _renderResultInner(addr,zone,zoneName,lga,mls,block,front,n,cm,heritage,flood,fsr,height,infra,comps,landReserve,foreshore,zoneAllows,mlsReal,acidSulfate,contaminated,riparian,bushfire,seppStation400,seppStation800,seppLightRail800,skipLotCount,overall,blockSource,geoSource,geoConf,matchedAddr,addrType,lotNum,councilSource,locationType,paidApiUsed,lotGeoWarn);
  }catch(e){console.error("_renderResultInner failed:",e); return;}

  var resultEl=document.getElementById('result');
  var rcard=resultEl?resultEl.querySelector('.rcard'):null;
  if(!rcard){console.warn("rcard not found after render"); return;}

  // 1. Executive Verdict + Scorecard
  try{
    var rh=rcard.querySelector('.rh');
    if(rh){
      var topEl=document.createElement('div');
      topEl.innerHTML=buildVerdictSection(addr,zone,lga,n,cm,heritage,flood,bushfire,seppStation400,seppStation800,mls,mlsReal,block,overall)
        +buildScorecard(ps,ov,yp,ac,ir,hc,cc,ep);
      rh.insertAdjacentElement('afterend',topEl);
    }
  }catch(e){console.warn("Verdict/Scorecard render failed",e);}

  // 2. New institutional sections
  try{
    var ctaBox=rcard.querySelector('.cta-box');
    var newSections=document.createElement('div');
    newSections.innerHTML=buildEvidenceLedger(zone,block,mls,lga,cm,geoConf,blockSource,addrType,matchedAddr,councilSource,locationType,heritage,flood,bushfire,acidSulfate,contaminated,riparian)
      +buildRiskRegister(heritage,flood,bushfire,acidSulfate,contaminated,riparian,landReserve,foreshore,cm,n,zone,block,mls,geoConf,addrType,blockSource,lga,front)
      +buildDevPathway(zone,block,mls,n,heritage,flood,cm,geoConf,addrType)
      +buildCouncilBehaviour(lga,cm)
      +buildPersonaNextSteps(zone,cm,heritage,flood,bushfire,block,addrType,overall)
      +buildProVerification()
      +buildVerificationChecklist(zone,block,heritage,flood,bushfire,acidSulfate,contaminated,riparian,cm,n,addrType)
      +buildShareableSummary(zone,block,mls,n,cm,heritage,flood,bushfire,geoConf,addrType,overall);
    if(ctaBox){rcard.insertBefore(newSections,ctaBox);}else{rcard.appendChild(newSections);}
  }catch(e){console.warn("Institutional sections render failed",e);}

  // 3. Report gate
  try{
    var gate=buildReportGate();
    if(gate){var gEl=document.createElement('div');gEl.innerHTML=gate;rcard.appendChild(gEl);}
  }catch(e){console.warn("Report gate render failed",e);}

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
      w1.innerHTML='<strong>Why this matters:</strong> Zone and minimum lot size are the two numbers that determine whether subdivision is possible and how many lots you can create. Every other check depends on getting these right.';
      ctrl0.insertAdjacentElement('afterend',w1);
    }
    // Add whtm to overlays section
    var ovList = rcard.querySelector('.ov-list');
    if(ovList && !ovList.previousElementSibling?.classList?.contains('whtm')){
      var w2=document.createElement('div');
      w2.className='whtm';
      w2.style.marginBottom='8px';
      w2.innerHTML='<strong>Why this matters:</strong> Each overlay adds cost, time or constraints to the DA process. A clean result here is the best possible planning outcome — it means no additional reports are required at DA stage.';
      ovList.insertAdjacentElement('beforebegin',w2);
    }
  }catch(e){}

  // Phase 2: AI interpretation layer — async, does not block render
  // Runs after rule-based sections are visible; augments them if Claude is available
  runAIInterpretation(addr,zone,zoneName,lga,mls,block,front,n,cm,heritage,flood,fsr,height,infra,comps,landReserve,foreshore,zoneAllows,mlsReal,acidSulfate,contaminated,riparian,bushfire,seppStation400,seppStation800,seppLightRail800,skipLotCount).catch(function(){
    // Completely silent — rule-based report is already displayed
  });
}



// ── AI INTELLIGENCE LAYER ─────────────────────────────────────────
// Phase 2: Claude API integration via /.netlify/functions/ai-interpret
// Falls back to rule-based report silently on any failure.

// Prepare compact structured data for Claude (minimises tokens)
function prepareForAI(addr,zone,zoneName,lga,mls,block,front,n,cm,heritage,flood,fsr,height,infra,comps,landReserve,foreshore,zoneAllows,mlsReal,acidSulfate,contaminated,riparian,bushfire,sepp400,sepp800,skipLotCount){
  return {
    address: addr,
    zone: { code: zone||'', name: zoneName||'', lga: lga||'' },
    minLot: { value: mls||450, verified: !!mlsReal },
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
function renderAIVerdict(rcard, insights){
  var vs = rcard.querySelector('.verdict-section');
  if(!vs) return;

  var ev  = insights.executiveVerdict||{};
  var hbu = insights.highestBestUse||{};
  var ao  = insights.approvalOutlook||{};
  var sr  = insights.strategicRecommendation||{};
  var hu  = insights.hiddenUpside||{};

  var score     = parseInt(ev.score)||0;
  var rating    = esc(ev.rating||'Requires Investigation', 60);
  var scoreColor= score>=75?'var(--green)':score>=58?'var(--amber)':'var(--red)';
  var probRange = esc(ao.probabilityRange||'—', 20);
  var lotsBase  = esc(String(hbu.lotsRange&&hbu.lotsRange.base||hbu.lotsRange&&hbu.lotsRange.high||'—'), 10);
  var timeline  = esc(insights.councilBehaviour&&insights.councilBehaviour.speedRating||'—', 20);
  var riskLevel = (insights.risks||[]).filter(function(r){return r.severity==='High';}).length;
  var riskLabel = riskLevel>=2?'High':riskLevel===1?'Medium':'Low';
  var riskColor = riskLevel>=2?'var(--red)':riskLevel===1?'var(--amber)':'var(--green)';

  vs.innerHTML =
    '<div class="vs-header">'
      +'<div class="vs-left">'
        +'<div class="vs-label">AI development intelligence verdict <span class="src-badge" style="margin-left:6px;background:rgba(91,156,242,.1);color:var(--blue);border-color:rgba(91,156,242,.25)">&#9830; Claude Sonnet</span></div>'
        +'<div class="vs-verdict-text" style="color:'+scoreColor+'">'+rating+'</div>'
        +'<div class="vs-summary">'+esc(ev.summary||'No assessment available.',280)+'</div>'
        +'<div class="verdict-callouts" style="margin-top:10px">'
          +'<div class="vc-item"><div class="vc-label">&#9652; Hidden upside</div><div class="vc-text">'+esc(hu.text||'No significant hidden upside identified.',200)+'</div></div>'
          +'<div class="vc-item"><div class="vc-label">&#9660; Primary risk</div><div class="vc-text">'+((insights.risks&&insights.risks[0])?esc(insights.risks[0].name,60)+' \u2014 '+esc(insights.risks[0].description,150):'No critical risks identified at this stage.')+'</div></div>'
          +'<div class="vc-item"><div class="vc-label">&#9654; Recommended pathway</div><div class="vc-text">'+esc(hbu.recommended||'Assess after site-specific constraints confirmed.',120)+( hbu.rationale?' '+esc(hbu.rationale,120):'')+'</div></div>'
          +'<div class="vc-item"><div class="vc-label">&#9203; Strategy</div><div class="vc-text">'+esc(sr.action||'Seek professional assessment.',80)+(sr.rationale?' '+esc(sr.rationale,120):'')+'</div></div>'
        +'</div>'
      +'</div>'
      +'<div class="vs-right">'
        +'<div class="vs-score-num" style="color:'+scoreColor+'">'+score+'</div>'
        +'<div class="vs-score-lbl">AI intelligence<br>score</div>'
      +'</div>'
    +'</div>'
    +'<div class="verdict-kpis">'
      +'<div class="vkpi"><div class="vkpi-v a">'+probRange+'</div><div class="vkpi-l">Approval outlook</div></div>'
      +'<div class="vkpi"><div class="vkpi-v gold">'+(lotsBase+'')+'</div><div class="vkpi-l">Base lots (AI est.)</div></div>'
      +'<div class="vkpi"><div class="vkpi-v" style="color:'+riskColor+'">'+riskLabel+'</div><div class="vkpi-l">AI risk rating</div></div>'
      +'<div class="vkpi"><div class="vkpi-v b">'+timeline+'</div><div class="vkpi-l">Council speed</div></div>'
    +'</div>';
}

// Render AI risk register (replaces rule-based risk section)
function renderAIRisks(rcard, risks){
  if(!risks||!risks.length) return;
  var sections = rcard.querySelectorAll('.rsec');
  var riskSection = null;
  sections.forEach(function(s){
    var title = s.querySelector('.rsec-title');
    if(title && title.textContent.indexOf('Risk register')>-1) riskSection=s;
  });
  if(!riskSection) return;

  var rows = risks.map(function(r){
    var sc = r.severity==='High'?'var(--red)':r.severity==='Medium'?'var(--amber)':'var(--green)';
    var rCat  = esc(r.category||'General',30);
    var rName = esc(r.name||'Risk',80);
    var rDesc = esc(r.description||'',200);
    var rSev  = esc(r.severity||'Medium',10);
    var rMit  = esc(r.mitigation||'Seek professional advice.',200);
    return '<tr>'
      +'<td style="color:var(--muted2);font-size:.6rem;white-space:nowrap;padding:7px 8px;border-bottom:1px solid var(--border)">'+rCat+'</td>'
      +'<td style="padding:7px 8px;border-bottom:1px solid var(--border)"><div style="font-size:.72rem;font-weight:500">'+rName+'</div><div style="font-size:.64rem;color:var(--muted);line-height:1.5;margin-top:2px">'+rDesc+'</div></td>'
      +'<td style="padding:7px 8px;border-bottom:1px solid var(--border);white-space:nowrap"><span style="font-size:.58rem;font-weight:700;padding:2px 6px;border-radius:4px;border:1px solid;color:'+sc+';background:rgba(0,0,0,.15)">'+rSev+'</span></td>'
      +'<td style="font-size:.64rem;color:var(--muted);line-height:1.5;padding:7px 8px;border-bottom:1px solid var(--border)">'+rMit+'</td>'
    +'</tr>';
  }).join('');

  riskSection.innerHTML =
    '<div class="rsec-title">Risk register <span class="tag tag-data">'+risks.length+' risks \u00b7 AI analysis</span><span class="src-badge" style="margin-left:6px;background:rgba(91,156,242,.1);color:var(--blue);border-color:rgba(91,156,242,.25)">Claude Sonnet</span></div>'
    +'<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse">'
      +'<thead><tr>'
        +'<th style="font-size:.54rem;text-transform:uppercase;letter-spacing:.07em;color:var(--muted2);font-weight:600;padding:5px 8px;text-align:left;border-bottom:1px solid var(--border)">Cat.</th>'
        +'<th style="font-size:.54rem;text-transform:uppercase;letter-spacing:.07em;color:var(--muted2);font-weight:600;padding:5px 8px;text-align:left;border-bottom:1px solid var(--border)">Risk &amp; description</th>'
        +'<th style="font-size:.54rem;text-transform:uppercase;letter-spacing:.07em;color:var(--muted2);font-weight:600;padding:5px 8px;text-align:left;border-bottom:1px solid var(--border)">Severity</th>'
        +'<th style="font-size:.54rem;text-transform:uppercase;letter-spacing:.07em;color:var(--muted2);font-weight:600;padding:5px 8px;text-align:left;border-bottom:1px solid var(--border)">Mitigation</th>'
      +'</tr></thead>'
      +'<tbody>'+rows+'</tbody>'
    +'</table></div>';
}

// Render AI next actions section (appended to result)
function renderAINextActions(rcard, actions, dataQuality){
  if(!actions||!actions.length) return;
  var existing = rcard.querySelector('.ai-next-actions');
  if(existing) existing.remove();

  var rows = actions.slice(0,7).map(function(a,i){
    var urgencyColor = a.urgency==='Before any offer'?'af-now':a.urgency==='Before exchange'?'af-soon':'af-when';
    var aAction  = esc(a.action||'Action',80);
    var aDetail  = esc(a.detail||'',200);
    var aCost    = esc(a.cost||'',20);
    var aTime    = esc(a.timeframe||'',30);
    var aUrgency = esc(a.urgency||'If proceeding',40);
    return '<div class="action-item" style="background:var(--bg3);border-radius:var(--r);padding:10px 12px;display:grid;grid-template-columns:28px 1fr auto;gap:9px;align-items:start;border:1px solid var(--border);margin-bottom:5px">'
      +'<div style="font-size:.95rem;font-weight:700;font-family:var(--font-mono);color:var(--gold)">'+(i+1)+'</div>'
      +'<div><div style="font-size:.74rem;font-weight:500;margin-bottom:2px">'+aAction+'</div><div style="font-size:.67rem;color:var(--muted);line-height:1.6">'+aDetail+'</div></div>'
      +'<div style="text-align:right;flex-shrink:0">'
        +'<div style="font-size:.64rem;font-family:var(--font-mono);color:var(--text)">'+aCost+'</div>'
        +'<div style="font-size:.58rem;color:var(--muted2);margin-top:2px">'+aTime+'</div>'
        +'<span class="ai-flag '+ urgencyColor+'" style="font-size:.52rem;font-weight:700;padding:1px 5px;border-radius:3px;border:1px solid;display:inline-block;margin-top:4px">'+aUrgency+'</span>'
      +'</div>'
    +'</div>';
  }).join('');

  // Data quality summary
  var dqHtml = '';
  if(dataQuality){
    var verified   = (dataQuality.verified||[]).slice(0,5).map(function(x){return esc(x,120);}).join(' \u00b7 ');
    var estimated  = (dataQuality.estimated||[]).map(function(x){return esc(x,120);}).join(' \u00b7 ');
    var unverified = (dataQuality.unverified||[]).map(function(x){return esc(x,120);}).join(' \u00b7 ');
    dqHtml = '<div style="background:var(--bg3);border-radius:var(--r);padding:10px 12px;font-size:.64rem;line-height:1.8;margin-top:6px">'
      +'<div style="color:var(--muted2);font-size:.54rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px">Data quality assessment \u00b7 Claude Sonnet</div>'
      +(verified?'<div><span style="color:var(--green);font-weight:600">&#10003; Verified: </span><span style="color:var(--muted)">'+verified+'</span></div>':'')
      +(estimated?'<div style="margin-top:3px"><span style="color:var(--amber);font-weight:600">&#9650; Estimated: </span><span style="color:var(--muted)">'+estimated+'</span></div>':'')
      +(unverified?'<div style="margin-top:3px"><span style="color:var(--red);font-weight:600">&#9888; Unverified: </span><span style="color:var(--muted)">'+unverified+'</span></div>':'')
    +'</div>';
  }

  var el = document.createElement('div');
  el.className = 'rsec ai-next-actions';
  el.innerHTML =
    '<div class="rsec-title">Next actions <span class="tag tag-data">AI-sequenced workflow</span> <span class="src-badge" style="margin-left:6px;background:rgba(91,156,242,.1);color:var(--blue);border-color:rgba(91,156,242,.25)">Claude Sonnet</span></div>'
    +rows
    +dqHtml;

  // Insert before any gate/CTA boxes
  var gate = rcard.querySelector('.gate-box,.cta-box');
  if(gate) rcard.insertBefore(el, gate);
  else rcard.appendChild(el);
}

// Show AI loading indicator in the verdict section
function showAILoading(rcard){
  var vs = rcard.querySelector('.verdict-section');
  if(!vs) return;
  var indicator = document.createElement('div');
  indicator.id = 'ai-loading-indicator';
  indicator.style.cssText = 'padding:8px 18px;border-top:1px solid var(--border);background:var(--bg3);display:flex;align-items:center;gap:8px;font-size:.7rem;color:var(--muted)';
  indicator.innerHTML = '<span class="loading-dot"></span><span class="loading-dot"></span><span class="loading-dot"></span><span>Applying AI intelligence layer\u2026</span>';
  vs.insertAdjacentElement('afterend', indicator);
}

function hideAILoading(rcard){
  var el = rcard.querySelector('#ai-loading-indicator');
  if(el) el.remove();
}

// Main AI interpretation call — called after rule-based render
async function runAIInterpretation(addr, zone, zoneName, lga, mls, block, front, n, cm, heritage, flood, fsr, height, infra, comps, landReserve, foreshore, zoneAllows, mlsReal, acidSulfate, contaminated, riparian, bushfire, sepp400, sepp800, seppLR800, skipLotCount){
  var resultEl = document.getElementById('result');
  var rcard = resultEl ? resultEl.querySelector('.rcard') : null;
  if(!rcard) return;

  showAILoading(rcard);

  var planningData = prepareForAI(addr,zone,zoneName,lga,mls,block,front,n,cm,heritage,flood,fsr,height,infra,comps,landReserve,foreshore,zoneAllows,mlsReal,acidSulfate,contaminated,riparian,bushfire,sepp400,sepp800,seppLR800,skipLotCount);

  try {
    var res = await fetch('/.netlify/functions/ai-interpret', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: addr, planningData: planningData }),
    });

    if(!res.ok){ hideAILoading(rcard); return; }

    var data = await res.json();

    if(data.fallback || !data.aiInsights){
      // AI unavailable — rule-based report already visible, do nothing
      hideAILoading(rcard);
      return;
    }

    var insights = data.aiInsights;

    // Apply AI enhancements in order
    renderAIVerdict(rcard, insights);
    renderAIRisks(rcard, insights.risks);
    renderAINextActions(rcard, insights.nextActions, insights.dataQuality);

  } catch(e) {
    // Silent fail — rule-based report remains
    console.warn('[SiteVerdict AI] Interpretation unavailable:', e.message);
  } finally {
    hideAILoading(rcard);
  }
}


// ── UTILITY FUNCTIONS ────────────────────────────────
function toggleReg(){var e=document.getElementById("reg-box");e&&e.classList.toggle("show")}function saveResult(){var e=document.getElementById("rn").value.trim(),t=document.getElementById("re").value.trim(),a=document.getElementById("rp").value.trim();if(e&&t&&a){var r=document.getElementById("reg-box");r&&(r.innerHTML='<div style="font-size:.8rem;color:var(--green);padding:4px 0">✓ Saved. We will send you updates for this address.</div>')}else alert("Please fill in all three fields.")}function goReport(){var el=document.getElementById("result");if(el&&el.querySelector(".rcard")){el.scrollIntoView({behavior:"smooth",block:"start"});}else{runCheck();}}function goSample(){window.location.href="hot-list.html";}document.addEventListener("keydown",function(e){"Enter"===e.key&&"INPUT"===document.activeElement.tagName&&runCheck()});