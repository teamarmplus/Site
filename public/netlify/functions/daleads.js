// SiteVerdict — DA Leads API proxy
// Keeps API key secure server-side
// Called by hot-list.html and index.html

exports.handler = async function(event) {
  const API_KEY = process.env.DALEADS_API_KEY;
  
  if (!API_KEY) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'API key not configured' })
    };
  }

  const params = event.queryStringParameters || {};
  const mode = params.mode || 'hotlist';

  const HEADERS = {
    'Authorization': `Bearer ${API_KEY}`,
    'Accept': 'application/json',
    'User-Agent': 'SiteVerdict/1.0'
  };

  try {
    if (mode === 'hotlist') {
      // Pull best recent NSW approved residential subdivision DAs
      const url = 'https://daleads.com.au/api/v1/das?' + new URLSearchParams({
        state: 'NSW',
        is_residential: 'true',
        decision_status: 'Approved',
        per_page: '50',
        sort: 'decision_date',
        order: 'desc'
      });

      const res = await fetch(url, { headers: HEADERS });
      const data = await res.json();
      const records = data.data || [];

      // Filter: must have 2+ dwellings or lots, valid cost, valid coords
      const filtered = records.filter(r =>
        (r.number_of_dwellings >= 2 || r.lot_count >= 2) &&
        r.cost_of_development > 50000 &&
        r.latitude && r.longitude &&
        r.decision_date &&
        r.address
      );

      // Score each site
      const scored = filtered.map(r => {
        const lots = r.lot_count || r.number_of_dwellings || 2;
        const cost = r.cost_of_development || 0;
        const cpl = cost / lots;
        let score = 0;
        score += Math.min(lots * 15, 40);
        score += cpl < 300000 ? 25 : cpl < 500000 ? 20 : cpl < 800000 ? 12 : 5;
        score += cost > 0 && cost < 5000000 ? 15 : 5;
        score += 20; // base for approved status
        return {
          address: r.address,
          suburb: r.suburb,
          council: r.council,
          lots: lots,
          cost: cost,
          cost_per_lot: Math.round(cpl),
          decision_date: r.decision_date ? r.decision_date.split('T')[0].split(' ')[0] : null,
          status: r.decision_status,
          description: r.description,
          lat: r.latitude,
          lng: r.longitude,
          score: Math.min(score, 99),
          source: 'DA Leads'
        };
      });

      // Sort by score, take top 5
      scored.sort((a, b) => b.score - a.score);
      const top5 = scored.slice(0, 5);

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600'
        },
        body: JSON.stringify({
          date: new Date().toISOString().split('T')[0],
          sites: top5,
          total_pool: filtered.length
        })
      };
    }

    if (mode === 'comps') {
      // Get comparable DAs near a checked address
      const council = params.council || '';
      const lat = params.lat || '';
      const lng = params.lng || '';

      let queryUrl;
      if (lat && lng) {
        queryUrl = 'https://daleads.com.au/api/v1/das?' + new URLSearchParams({
          state: 'NSW',
          is_residential: 'true',
          decision_status: 'Approved',
          lat: lat,
          lng: lng,
          radius: '5',
          per_page: '5',
          sort: 'decision_date',
          order: 'desc'
        });
      } else {
        queryUrl = 'https://daleads.com.au/api/v1/das?' + new URLSearchParams({
          state: 'NSW',
          is_residential: 'true',
          decision_status: 'Approved',
          council: council,
          per_page: '5',
          sort: 'decision_date',
          order: 'desc'
        });
      }

      const res = await fetch(queryUrl, { headers: HEADERS });
      const data = await res.json();
      const records = (data.data || []).filter(r =>
        (r.number_of_dwellings >= 2 || r.lot_count >= 2) &&
        r.cost_of_development > 0
      );

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          comps: records.slice(0, 5).map(r => ({
            address: r.address,
            lots: r.lot_count || r.number_of_dwellings || 2,
            cost: r.cost_of_development,
            days: r.lodgement_date && r.decision_date
              ? Math.round((new Date(r.decision_date) - new Date(r.lodgement_date)) / 86400000)
              : null,
            date: r.decision_date ? r.decision_date.split('T')[0].split(' ')[0] : null
          }))
        })
      };
    }

    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Unknown mode' })
    };

  } catch (e) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: e.message })
    };
  }
};
