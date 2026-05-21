exports.handler = async function(event) {
  const { mx, my } = event.queryStringParameters || {};
  if (!mx || !my) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing mx or my' }) };
  }

  const CORS = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  const base = 'https://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_Cadastre/MapServer/9/query';

  // RESIDENTIAL AREA THRESHOLDS
  // Parcel area > 10,000m² on a buffer≥15m hit is likely a wrong parcel
  // (park, rural lot, or adjacent large property — not the target property)
  const MAX_CREDIBLE_RESIDENTIAL = 10000; // m²

  for (const dist of [0, 5, 15]) {
    const distParam = dist > 0 ? `&distance=${dist}&units=esriSRUnit_Meter` : '';
    const url = `${base}?geometry=${mx},${my}&geometryType=esriGeometryPoint&inSR=102100&spatialRel=esriSpatialRelIntersects${distParam}&outFields=lotidstring,planlotarea,planlotareaunits,shape_Area&returnGeometry=false&f=json`;
    
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 Chrome/120' } });
      const data = await res.json();
      const feats = data.features || [];
      
      if (feats.length > 0) {
        // Score the best parcel match
        const attrs = feats[0].attributes || {};
        const area  = attrs.planlotarea || attrs.shape_Area || null;
        const areaN = area ? parseFloat(area) : null;

        // Quality assessment
        let parcelConfidence = 'Estimated';
        let parcelWarning    = null;

        if (dist === 0) {
          // Point is inside parcel → higher confidence
          parcelConfidence = areaN && areaN < MAX_CREDIBLE_RESIDENTIAL ? 'Verified' : 'Estimated';
        } else if (dist <= 5) {
          parcelConfidence = 'Estimated';
        } else {
          // Buffer ≥15m: geocoder likely returned street-level coords
          parcelConfidence = 'Needs review';
          parcelWarning = 'Parcel found by buffer search — geocoder returned approximate street-level coordinates. Parcel area may not match the entered address.';
        }

        // Large area flag regardless of buffer
        if (areaN && areaN > MAX_CREDIBLE_RESIDENTIAL) {
          parcelConfidence = 'Needs review';
          parcelWarning = (parcelWarning ? parcelWarning + ' ' : '')
            + `Parcel area (${Math.round(areaN).toLocaleString()}m²) exceeds typical residential size — this may be an adjacent rural, public or commercial parcel, not the target property.`;
        }

        return {
          statusCode: 200,
          headers: CORS,
          body: JSON.stringify({
            features: feats,
            buffer: dist,
            parcelConfidence,
            parcelWarning: parcelWarning || null,
            areaN: areaN ? Math.round(areaN) : null
          })
        };
      }
    } catch (e) {
      continue;
    }
  }

  return {
    statusCode: 200,
    headers: CORS,
    body: JSON.stringify({ features: [], buffer: -1, parcelConfidence: 'Not found', parcelWarning: null, areaN: null })
  };
};
