// GET /api/map-events?query=food+prices
// Proxies GDELT GEO 2.0 API - food security themed news locations, last 7 days.
// Keyless. Cached 30 min at the edge.

export default async function handler(req, res) {
  const rawQuery = (req.query.query || "").toString().slice(0, 80);
  // Default: GDELT's curated FOOD_SECURITY theme
  const query = rawQuery ? `${rawQuery} theme:FOOD_SECURITY` : "theme:FOOD_SECURITY";

  const url = `https://api.gdeltproject.org/api/v2/geo/geo?query=${encodeURIComponent(query)}&format=GeoJSON&maxpoints=800&timespan=7d`;

  try {
    const r = await fetch(url, { headers: { "User-Agent": "TerraFeed/1.0" } });
    if (!r.ok) return res.status(r.status).json({ error: "GDELT GEO error" });
    const data = await r.json();
    res.setHeader("Cache-Control", "public, s-maxage=1800, stale-while-revalidate=900");
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
