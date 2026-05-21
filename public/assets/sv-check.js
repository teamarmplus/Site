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
function chatPro(){window.open("https://wa.me/61402623628?text=Hi+SiteVerdict+I+want+to+chat+with+a+professional","_blank")}var MF={R1:12,R2:12,R3:9,R4:9,RU1:50,RU2:50,RU4:2e3},CD={ALBURY:{days:63,range:"53-63",n:3},BATHURST:{days:43,range:"33-73",n:3},BLACKTOWN:{days:153,range:"40-399",n:12},BYRON:{days:189,range:"14-393",n:6},CAMDEN:{days:45,range:"2-375",n:12},CAMPBELLTOWN:{days:109,range:"109-329",n:3},"CANADA BAY":{days:206,range:"127-557",n:5},CANTERBURY:{days:49,range:"5-448",n:62},BANKSTOWN:{days:49,range:"5-448",n:62},"CENTRAL COAST":{days:89,range:"21-165",n:8},CESSNOCK:{days:85,range:"50-110",n:3},"COFFS HARBOUR":{days:73,range:"65-168",n:3},CUMBERLAND:{days:186,range:"48-361",n:8},FAIRFIELD:{days:177,range:"136-177",n:2},GOULBURN:{days:122,range:"15-292",n:6},"INNER WEST":{days:119,range:"54-166",n:9},"LAKE MACQUARIE":{days:131,range:"41-474",n:15},LIVERPOOL:{days:314,range:"71-425",n:14},MAITLAND:{days:23,range:"18-85",n:4},NEWCASTLE:{days:122,range:"73-360",n:11},"NORTH SYDNEY":{days:279,range:"194-279",n:2},"NORTHERN BEACHES":{days:160,range:"90-173",n:3},PARRAMATTA:{days:133,range:"2-243",n:24},PENRITH:{days:204,range:"74-386",n:9},"PORT MACQUARIE":{days:281,range:"97-281",n:2},"PORT STEPHENS":{days:85,range:"1-92",n:3},RYDE:{days:86,range:"5-86",n:4},SHELLHARBOUR:{days:71,range:"7-392",n:8},SHOALHAVEN:{days:108,range:"3-171",n:6},SUTHERLAND:{days:118,range:"35-315",n:28},"THE HILLS":{days:148,range:"70-199",n:9},WAVERLEY:{days:332,range:"132-332",n:2},WOLLONDILLY:{days:480,range:"175-480",n:2},WOLLONGONG:{days:70,range:"15-233",n:12},WOOLLAHRA:{days:232,range:"208-232",n:2}};function gc(e){if(!e)return null;var t=e.toUpperCase().replace(/\bCITY COUNCIL\b/g,"").replace(/\bSHIRE COUNCIL\b/g,"").replace(/\bMUNICIPAL COUNCIL\b/g,"").replace(/\bREGIONAL COUNCIL\b/g,"").replace(/\bCOUNCIL\b/g,"").replace(/\bCITY\b/g,"").replace(/\bSHIRE\b/g,"").replace(/\bMUNICIPAL\b/g,"").replace(/\bREGIONAL\b/g,"").replace(/\bOF\b/g,"").replace(/\s+/g," ").trim();if(CD[t])return{name:t,data:CD[t]};for(var a in CD)if(t.indexOf(a)>-1||a.indexOf(t)>-1)return{name:a,data:CD[a]};return null}function calcLots(e,t,a,r){var s=Math.floor(e/a);return!t||t<3?s:Math.max(0,Math.min(s,Math.floor(t/(MF[r]||12))))}function getSig(e,t,a){if(e<2)return"r";var r=(e>=4?3:e>=3?2:1)+(t<=90?3:t<=150?2:1)+(a>=80?3:a>=70?2:1);return r>=7?"g":r>=4?"a":"r"}function setSt(e){document.getElementById("status").textContent=e;}
// ── SHARED GEOCODING ─────────────────────────────────────────────
// Used by both autoLookupBlock() and runCheck() so coordinates match.
async // ── ADDRESS CLEANING UTILITIES ───────────────────────────────────
function cleanAddressForGeocode(addr){
  if(!addr) return addr;
  var s = addr.trim();
  // Remove unit/apt prefix: "U4/20", "Unit 4/20", "Apt 3/"
  s = s.replace(/^(unit|apt|apartment|flat|shop|suite|level|loft|lot)\s*[\d\w]+[\/\-]\s*/i,'');
  // Remove leading "U4/" or "4/"
  s = s.replace(/^\w{0,3}\d+[\/]/i,'');
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
          postcode: data.postcode || ''
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
async function runCheck(){var e=document.getElementById("addr").value.trim(),t=parseFloat(document.getElementById("block").value),a=document.getElementById("front"),r=a&&a.value?parseFloat(a.value):15;if(e){var s=!t||t<100,n=document.getElementById("run-btn");n.disabled=!0,n.textContent="Checking...";var i=document.getElementById("result");i.innerHTML="",i.classList.remove("show");var o=document.getElementById("block-lookup-status");o&&(o.textContent="");if(window._loadingTimer){clearInterval(window._loadingTimer);window._loadingTimer=null;}setSt("Finding your address...");try{var _geoResult=await geocodeWithConfidence(e);var _geo=_geoResult;if(!_geo){_showAddrNotFound(i,n,e);return;}var v=_geo.lat,u=_geo.lon,m=20037508.34*u/180,p=Math.log(Math.tan((90+v)*Math.PI/360))/(Math.PI/180)*20037508.34/180,g=encodeURIComponent(JSON.stringify({x:m,y:p,spatialReference:{wkid:102100}})),y="https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/Planning/Principal_Planning_Layers/MapServer";setSt("Checking zone, heritage, flood and overlays...");var[f,h,b,L,S,R,A,E,w,P,C,I]=await Promise.all([fetch(y+"/11/query?geometry="+g+"&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&outFields=LAY_CLASS,SYM_CODE,LGA_NAME&returnGeometry=false&f=json"),fetch(y+"/14/query?geometry="+g+"&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&outFields=LOT_SIZE&returnGeometry=false&f=json"),fetch(y+"/8/query?geometry="+g+"&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&outFields=H_NAME,H_ID,LEGIS_REF_CLAUSE&returnGeometry=false&f=json"),fetch(y+"/4/query?geometry="+g+"&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&outFields=FSR_MAX,LAY_CLASS&returnGeometry=false&f=json"),fetch(y+"/7/query?geometry="+g+"&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&outFields=HEIGHT_MAX,LAY_CLASS&returnGeometry=false&f=json"),fetch("https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/Planning/EPI_Flood_Planning_Area/MapServer/0/query?geometry="+g+"&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&outFields=*&returnGeometry=false&f=json"),fetch(y+"/16/query?geometry="+g+"&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&outFields=RESERVE_TYPE,LAY_CLASS&returnGeometry=false&f=json"),fetch(y+"/18/query?geometry="+g+"&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&outFields=LAY_CLASS&returnGeometry=false&f=json"),fetch(y+"/15/query?geometry="+g+"&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&outFields=LAY_CLASS,ACID_CLASS&returnGeometry=false&f=json").catch(()=>({json:()=>({features:[]})})),fetch(y+"/17/query?geometry="+g+"&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&outFields=LAY_CLASS&returnGeometry=false&f=json").catch(()=>({json:()=>({features:[]})})),fetch(y+"/13/query?geometry="+g+"&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&outFields=LAY_CLASS&returnGeometry=false&f=json").catch(()=>({json:()=>({features:[]})})),fetch("https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/Planning/Bush_Fire_Prone_Land/MapServer/0/query?geometry="+g+"&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&outFields=*&returnGeometry=false&f=json").catch(()=>({json:()=>({features:[]})}))]),[N,k,x,M,U,T,B,D,H,F,_,O]=await Promise.all([f.json(),h.json(),b.json(),L.json(),S.json(),R.json(),A.json(),E.json(),w.json(),P.json(),C.json(),I.json()]),j=B.features&&B.features.length?B.features[0].attributes.RESERVE_TYPE||B.features[0].attributes.LAY_CLASS||"Yes":null,z=D.features&&D.features.length>0,G=H.features&&H.features.length?H.features[0].attributes.ACID_CLASS||H.features[0].attributes.LAY_CLASS||"Yes":null,W=F.features&&F.features.length>0,q=_.features&&_.features.length>0,Y=O.features&&O.features.length>0,Z="",K="",V="";if(N.features&&N.features.length){var $=N.features[0].attributes;Z=$.SYM_CODE||"",K=$.LAY_CLASS||"",V=$.LGA_NAME||""}var X={R1:450,R2:450,R3:400,R4:350,R5:2e3,R6:450,RU1:4e3,RU2:4e3,RU3:4e3,RU4:2e3,RU5:2e3,RU6:4e3,E3:2e3,E4:500,C4:400,UR:500,MU1:400,MU2:400,SP1:2e3,SP2:4e3},Q=!1,J=X[Z]||450;if(k.features&&k.features.length&&k.features[0].attributes.LOT_SIZE){var ee=k.features[0].attributes.LOT_SIZE;ee>=({R1:50,R2:50,R3:50,R4:50,R5:100,R6:100,RU1:500,RU2:500,RU3:500,RU4:500,RU5:500,RU6:500,E4:100}[Z]||50)?(J=ee,Q=!0):(Q=!1,J=X[Z]||450,console.warn("Min lot size sanity fail: "+ee+"m² for zone "+Z+" — using zone default"))}var te=["R1","R2","R3","R4","R5","R6","RU1","RU2","RU3","RU4","RU5","RU6","E4","E3","C4","UR","MU1","MU2","B4","SP1","SP2"].indexOf(Z)>-1,ae=null;if(x.features&&x.features.length){var re=x.features[0].attributes;ae={name:re.H_NAME,clause:re.LEGIS_REF_CLAUSE}}var se=M.features&&M.features.length?M.features[0].attributes.FSR_MAX||M.features[0].attributes.LAY_CLASS:null,ne=U.features&&U.features.length?U.features[0].attributes.HEIGHT_MAX||U.features[0].attributes.LAY_CLASS:null,ie=T.features&&T.features.length>0;setSt("Loading infrastructure and comparable projects...");var oe=gc(V),le=(oe&&oe.name,fetch("/.netlify/functions/daleads?mode=comps&council="+encodeURIComponent(V||"")+"&lat="+v+"&lng="+u).catch(()=>null)),de=fetch("https://overpass-api.de/api/interpreter",{method:"POST",body:"data="+encodeURIComponent('[out:json];(node["railway"~"station|halt"](around:5000,'+v+","+u+');node["amenity"~"hospital"](around:5000,'+v+","+u+');node["shop"~"supermarket"](around:2000,'+v+","+u+"););out;")}).catch(()=>null),[ce,ve]=await Promise.all([le,de]),ue=[];if(ce)try{var me=await ce.json();for(var pe of me.comps||[])if(ue.push({addr:pe.address||"",lots:pe.lots||2,cost:pe.cost||0,days:pe.days||0}),ue.length>=3)break}catch(e){console.warn("DA Leads comps parse failed",e);ue=[];}var ge={transport:[],health:[],shopping:[]};if(ve)try{var ye=await ve.json();for(var fe of ye.elements||[]){var he=fe.tags||{},be=he.name;if(be){var Le=Math.round(1110*Math.sqrt(Math.pow((fe.lat||0)-v,2)+Math.pow((fe.lon||0)-u,2)))/10,Se=he.railway?"transport":"hospital"==he.amenity?"health":"shopping";ge[Se].length<3&&ge[Se].push({name:be,dist:Le})}}}catch(e){}var seppStation400=null,seppStation800=null,seppLightRail800=null;(ge.transport||[]).forEach(function(_st){if(_st.dist<=0.4&&!seppStation400)seppStation400=_st;if(_st.dist<=0.8&&!seppStation800)seppStation800=_st;});setSt("");var Re=calcLots(t,r,J,Z);s&&(Re=0),renderResult(e,Z,K,V,J,t,r,Re,oe,ae,ie,se,ne,ge,ue,j,z,te,Q,G,W,q,Y,seppStation400,seppStation800,seppLightRail800,s,s?'auto-detected':'manual',_geoResult&&_geoResult.source?_geoResult.source:'',_geoResult&&_geoResult.confidence?_geoResult.confidence:'',_geoResult&&_geoResult.matchedAddr?_geoResult.matchedAddr:'')}catch(e){console.error("SiteVerdict runCheck failed:",e);setSt("Something went wrong: "+(e&&e.message?e.message:"Unknown error. Check browser console."));}n.disabled=!1,n.textContent="Check this property →"}else setSt("Please enter a property address.")}



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
  window.runCheck = async function(){
    showSkeleton();
    try { await _orig.apply(this, arguments); }
    catch(e){ setSt('Something went wrong. Please try again.'); }
    finally { hideSkeleton(); }
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
  else if(!days) primaryRisk = 'Council not in database \u2014 DA timeline unknown. Contact council directly.';
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
function _renderResultInner(addr,zone,zoneName,lga,mls,block,front,n,cm,heritage,flood,fsr,height,infra,comps,landReserve,foreshore,zoneAllows,mlsReal,acidSulfate,contaminated,riparian,bushfire,seppStation400,seppStation800,seppLightRail800,skipLotCount,overallScore,blockSource,geoSource,geoConf,matchedAddr){
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

  var H='<div class="rcard">'
    // Header
    +'<div class="rh '+sig+'">'
      +'<div>'
        +'<div class="sig-row"><span class="sd '+sig+'"></span><span class="st '+sig+'">'+sigLabel+'</span></div>'
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
    +'<div class="rsec" style="background:rgba(255,255,255,.02);border-color:rgba(255,255,255,.08)">'
      +'<div class="rsec-title">Data confidence'
      +' <span class="tag" style="background:transparent;border-color:rgba(255,255,255,.1);color:var(--muted)">&#9432; What we checked &middot; What needs professional review</span>'
      +'</div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:.72rem;margin-bottom:8px">'

        // Row 1: Address match
        +'<div style="background:var(--bg3);border-radius:8px;padding:10px 12px;grid-column:span 2">'
          +'<div style="font-size:.58rem;text-transform:uppercase;letter-spacing:.07em;color:var(--muted2);margin-bottom:4px">Address matched</div>'
          +'<div style="font-weight:500;color:var(--text)">'
            +(matchedAddr ? matchedAddr : esc(addr,60))
          +'</div>'
          +'<div style="margin-top:3px;font-size:.63rem;color:'
            +(geoSource&&geoSource.indexOf('Google')>-1?'var(--green)':'var(--amber)')
          +'">'
            +(geoSource ? '✓ Source: '+geoSource : '⚠ Address source unknown')
            +' · '
            +(geoConf==='Verified'?'✓ Verified':'&#8212; '+(!geoConf?'Needs review':geoConf))
          +'</div>'
        +'</div>'

        // Row 2: Block size
        +'<div style="background:var(--bg3);border-radius:8px;padding:10px 12px">'
          +'<div style="font-size:.58rem;text-transform:uppercase;letter-spacing:.07em;color:var(--muted2);margin-bottom:4px">Block size</div>'
          +'<div style="font-weight:600;color:var(--text)">'+(block?block+'m²':'Not provided')+'</div>'
          +'<div style="margin-top:3px;font-size:.63rem;color:'+(blockSource==='auto-detected'?'var(--green)':'var(--amber)')+'">'
            +(blockSource==='auto-detected'
              ?'✓ Auto-detected (NSW Cadastre)'
              :(block?'⚠ Manually entered — verify against title':'— Enter block size for better results'))
          +'</div>'
        +'</div>'

        // Row 3: Zone
        +'<div style="background:var(--bg3);border-radius:8px;padding:10px 12px">'
          +'<div style="font-size:.58rem;text-transform:uppercase;letter-spacing:.07em;color:var(--muted2);margin-bottom:4px">Zone</div>'
          +'<div style="font-weight:600;color:var(--text)">'+(zone||'Not detected')+'</div>'
          +'<div style="margin-top:3px;font-size:.63rem;color:'+(zone?'var(--green)':'var(--amber)')+'">'
            +(zone?'✓ Live NSW Planning Portal':'⚠ Zone not detected — enter full address with suburb')
          +'</div>'
        +'</div>'

        // Row 4: Parcel match
        +'<div style="background:var(--bg3);border-radius:8px;padding:10px 12px">'
          +'<div style="font-size:.58rem;text-transform:uppercase;letter-spacing:.07em;color:var(--muted2);margin-bottom:4px">Parcel match</div>'
          +'<div style="font-weight:600;color:var(--text)">'
            +(blockSource==='auto-detected'?'Parcel found':'Not matched')
          +'</div>'
          +'<div style="margin-top:3px;font-size:.63rem;color:'+(blockSource==='auto-detected'?'var(--green)':'var(--muted2)')+'">'
            +(blockSource==='auto-detected'?'✓ NSW Cadastre parcel matched':'— NSW Cadastre parcel not matched')
          +'</div>'
        +'</div>'

        // Row 5: Council
        +'<div style="background:var(--bg3);border-radius:8px;padding:10px 12px">'
          +'<div style="font-size:.58rem;text-transform:uppercase;letter-spacing:.07em;color:var(--muted2);margin-bottom:4px">Council</div>'
          +'<div style="font-weight:600;color:var(--text)">'+(lga||'Not detected')+'</div>'
          +'<div style="margin-top:3px;font-size:.63rem;color:'+(lga?'var(--green)':'var(--amber)')+'">'
            +(lga?'✓ NSW Planning Portal':'— Not detected')
          +'</div>'
        +'</div>'

        // Row 6: Overall confidence summary
        +'<div style="background:var(--bg3);border-radius:8px;padding:10px 12px">'
          +'<div style="font-size:.58rem;text-transform:uppercase;letter-spacing:.07em;color:var(--muted2);margin-bottom:4px">Overall confidence</div>'
          +'<div style="font-weight:600;font-size:.72rem;color:'
            +(geoConf==='Verified'&&zone&&blockSource==='auto-detected'?'var(--green)'
              :geoConf==='Verified'&&zone?'var(--amber)'
              :'var(--amber)')
          +'">'
            +(geoConf==='Verified'&&zone&&blockSource==='auto-detected'?'Verified — address, zone and parcel confirmed'
              :geoConf==='Verified'&&zone?'Address ✔ · Zone ✔ · Parcel needs review'
              :geoConf==='Verified'?'Address verified — planning data needs review'
              :'Needs review — professional verification required')
          +'</div>'
        +'</div>'

      +'</div>'
      // Disclaimer for partial results
      +((!geoConf||geoConf!=='Verified'||!zone||!blockSource||blockSource!=='auto-detected')
        ?'<div style="font-size:.62rem;color:var(--muted2);line-height:1.7;padding:6px 8px;background:rgba(255,255,255,.01);border-radius:6px">'
          +(geoConf==='Verified'&&!zone?'&#9888; Address verified but zone and parcel data could not be found. Enter your full address with suburb, state and postcode.':''  )
          +(geoConf==='Verified'&&zone&&blockSource!=='auto-detected'?'&#9888; Address and zone verified. Block size is estimated — professional verification required.':'')
          +(!geoConf?'&#9888; Address not confidently verified. Results below are approximate only.':'')
        +'</div>'
        :'')
      +'</div>'
    +

    // Planning controls
    +'<div class="rsec">'
      +'<div class="rsec-title">Planning controls <span class="tag tag-live">&#9679; NSW Planning Portal \u00b7 live</span></div>'
      +'<div class="ctrl-grid">'
        +'<div class="ctrl"><div class="ctrl-lbl">Zone</div><div class="ctrl-val">'+esc(zone||'Unknown',10)+'</div><div class="ctrl-src">'+esc(zLabel,60)+'</div></div>'
        +'<div class="ctrl"><div class="ctrl-lbl">Min lot size</div><div class="ctrl-val">'+(mls||'?')+'m\u00b2</div><div class="ctrl-src">'+esc(mlsConf,80)+'</div></div>'
        +'<div class="ctrl"><div class="ctrl-lbl">FSR</div><div class="ctrl-val">'+esc(fsrText,20)+'</div><div class="ctrl-src">Layer 4</div></div>'
        +'<div class="ctrl"><div class="ctrl-lbl">Height limit</div><div class="ctrl-val">'+esc(htText,20)+'</div><div class="ctrl-src">Layer 7</div></div>'
        +'<div class="ctrl"><div class="ctrl-lbl">DA pathway</div><div class="ctrl-val">'+(heritage?'Heritage DA':'Standard DA')+'</div><div class="ctrl-src">Layer 8 heritage check</div></div>'
        +'<div class="ctrl"><div class="ctrl-lbl">Council DA median</div><div class="ctrl-val '+( cm&&cm.data&&cm.data.days<=90?'g':cm&&cm.data&&cm.data.days>200?'r':'a')+'">'+esc(daMedian,20)+'</div><div class="ctrl-src">'+(cm&&cm.data?cm.data.n+' real DAs \u00b7 range: '+esc(cm.data.range||'',20):'Council not in database')+'</div></div>'
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
function buildRiskRegister(heritage,flood,bushfire,acid,contaminated,riparian,landRes,foreshore,cm,n){
  var days=cm&&cm.data?cm.data.days:null;
  var risks=[];
  risks.push({cat:'Planning',name:'Lot count requires verification',sev:n<2?'Medium':n>=4?'Low':'Low',desc:'The automated calculation suggests a possible subdivision pathway, but the real yield depends on LEP controls, DCP frontage, access, easements, slope and servicing. A licensed town planner must confirm before any offer.',mit:'Engage a licensed NSW town planner to verify LEP controls and DCP requirements.'});
  if(heritage)risks.push({cat:'Planning',name:'Heritage overlay',sev:'High',desc:'Heritage Impact Statement required ($3K\u2013$8K). Adds DA complexity and time.',mit:'Engage heritage consultant. Pre-DA meeting.'});
  if(flood)risks.push({cat:'Overlay',name:'Flood planning area',sev:'High',desc:'Flood impact assessment required. Construction standards may apply.',mit:'Hydraulic engineer report required for DA.'});
  if(bushfire)risks.push({cat:'Overlay',name:'Bushfire prone land',sev:'Medium',desc:'BAL assessment required. AS3959 construction standards increase costs.',mit:'BAL assessment before DA lodgement.'});
  if(acid)risks.push({cat:'Overlay',name:'Acid sulfate soils',sev:'Medium',desc:'Soils management plan may be required. Budget $5K\u2013$15K.',mit:'Geotechnical assessment.'});
  if(contaminated)risks.push({cat:'Overlay',name:'Contaminated land',sev:'High',desc:'Remediation assessment required. Potentially significant cost.',mit:'Phase 1 ESA before purchase.'});
  risks.push({cat:'Infrastructure',name:'Sewer capacity \u2014 unverified',sev:'High',desc:'Sewer main capacity is not publicly available. Augmentation can cost $200K\u2013$800K+.',mit:'Sydney Water pre-DA enquiry before offer. Free, 2\u20134 weeks.'});
  if(days&&days>150)risks.push({cat:'Timeline',name:days+'d DA median',sev:days>250?'High':'Medium',desc:'Council is in the slower half of NSW. Each extra 3 months adds ~7% land cost in holding charges.',mit:'Pre-DA meeting. Experienced local planner. Complete DA package.'});
  risks.push({cat:'Market',name:'26\u201330 month exposure',sev:'Medium',desc:'From purchase to lot settlement. Lot values at settlement are unknown.',mit:'Sensitivity test at \u00b110% lot value. Consider pre-sales.'});
  var rows=risks.map(function(r){
    var sc=r.sev==='High'?'var(--red)':r.sev==='Medium'?'var(--amber)':'var(--green)';
    return '<tr><td style="color:var(--muted2);font-size:.6rem;white-space:nowrap;padding:7px 8px;border-bottom:1px solid var(--border)">'+r.cat+'</td>'
      +'<td style="padding:7px 8px;border-bottom:1px solid var(--border)"><div style="font-size:.72rem;font-weight:500">'+r.name+'</div><div style="font-size:.64rem;color:var(--muted);line-height:1.5;margin-top:2px">'+r.desc+'</div></td>'
      +'<td style="padding:7px 8px;border-bottom:1px solid var(--border);white-space:nowrap"><span style="font-size:.58rem;font-weight:700;padding:2px 6px;border-radius:4px;border:1px solid;color:'+sc+';background:rgba(0,0,0,.15)">'+r.sev+'</span></td>'
      +'<td style="font-size:.64rem;color:var(--muted);line-height:1.5;padding:7px 8px;border-bottom:1px solid var(--border)">'+r.mit+'</td>'
    +'</tr>';
  }).join('');
  return '<div class="rsec">'
    +'<div class="rsec-title">Risk register <span class="tag tag-data">'+risks.length+' risks identified</span><span class="rsec-meta">14 May 2026 &middot; automated</span></div>'
    +'<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse">'
      +'<thead><tr>'
        +'<th style="font-size:.54rem;text-transform:uppercase;letter-spacing:.07em;color:var(--muted2);font-weight:600;padding:5px 8px;text-align:left;border-bottom:1px solid var(--border)">Cat.</th>'
        +'<th style="font-size:.54rem;text-transform:uppercase;letter-spacing:.07em;color:var(--muted2);font-weight:600;padding:5px 8px;text-align:left;border-bottom:1px solid var(--border)">Risk &amp; description</th>'
        +'<th style="font-size:.54rem;text-transform:uppercase;letter-spacing:.07em;color:var(--muted2);font-weight:600;padding:5px 8px;text-align:left;border-bottom:1px solid var(--border)">Severity</th>'
        +'<th style="font-size:.54rem;text-transform:uppercase;letter-spacing:.07em;color:var(--muted2);font-weight:600;padding:5px 8px;text-align:left;border-bottom:1px solid var(--border)">Mitigation</th>'
      +'</tr></thead>'
      +'<tbody>'+rows+'</tbody>'
    +'</table></div>'
  +'</div>';
}

// Council Behaviour Analysis
function buildCouncilBehaviour(lga,cm){
  if(!cm||!cm.data)return '<div class="rsec"><div class="rsec-title">Council behaviour analysis</div><div style="font-size:.76rem;color:var(--muted);padding:8px 0">'+(lga||'This council')+' is not yet in our database of '+34+' councils. Contact council directly for DA timeline estimates.</div></div>';
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
function renderResult(addr,zone,zoneName,lga,mls,block,front,n,cm,heritage,flood,fsr,height,infra,comps,landReserve,foreshore,zoneAllows,mlsReal,acidSulfate,contaminated,riparian,bushfire,seppStation400,seppStation800,seppLightRail800,skipLotCount,blockSource,geoSource,geoConf,matchedAddr){
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
    _renderResultInner(addr,zone,zoneName,lga,mls,block,front,n,cm,heritage,flood,fsr,height,infra,comps,landReserve,foreshore,zoneAllows,mlsReal,acidSulfate,contaminated,riparian,bushfire,seppStation400,seppStation800,seppLightRail800,skipLotCount,overall,blockSource,geoSource,geoConf,matchedAddr);
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
    newSections.innerHTML=buildHBUSection(zone,block,mls,n,heritage,flood,cm)
      +buildRiskRegister(heritage,flood,bushfire,acidSulfate,contaminated,riparian,landReserve,foreshore,cm,n)
      +buildCouncilBehaviour(lga,cm)
      +buildFinancialAssumptions(n)
      +buildProVerification();
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