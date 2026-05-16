exports.handler = async function(event) {
  const { mx, my } = event.queryStringParameters || {};
  if (!mx || !my) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing mx or my' }) };
  }

  const base = 'https://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_Cadastre/MapServer/9/query';
  
  for (const dist of [0, 5, 15]) {
    const distParam = dist > 0 ? `&distance=${dist}&units=esriSRUnit_Meter` : '';
    const url = `${base}?geometry=${mx},${my}&geometryType=esriGeometryPoint&inSR=102100&spatialRel=esriSpatialRelIntersects${distParam}&outFields=lotidstring,planlotarea,planlotareaunits,shape_Area&returnGeometry=false&f=json`;
    
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 Chrome/120' }
      });
      const data = await res.json();
      const feats = data.features || [];
      
      if (feats.length > 0) {
        return {
          statusCode: 200,
          headers: { 
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ features: feats, buffer: dist })
        };
      }
    } catch (e) {
      continue;
    }
  }

  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
    body: JSON.stringify({ features: [], buffer: -1 })
  };
};
