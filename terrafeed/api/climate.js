// GET /api/climate?lat=28.4&lon=-80.7
// Open-Meteo: free, keyless. Current + 7-day agri-relevant weather. Cached 1h.

export default async function handler(req, res) {
  const lat = parseFloat(req.query.lat);
  const lon = parseFloat(req.query.lon);
  if (isNaN(lat) || isNaN(lon)) return res.status(400).json({ error: "lat/lon required" });

  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    daily: "temperature_2m_max,temperature_2m_min,precipitation_sum,et0_fao_evapotranspiration",
    current: "temperature_2m,relative_humidity_2m,precipitation",
    temperature_unit: "fahrenheit",
    precipitation_unit: "inch",
    timezone: "auto",
    forecast_days: "7",
  });

  try {
    const r = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
    if (!r.ok) return res.status(r.status).json({ error: "Open-Meteo error" });
    const data = await r.json();
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=1800");
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
