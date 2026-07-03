// GET /api/fred?series_id=CUSR0000SAF11
// FRED proxy, key stays server-side. Cached 24h.
// Setup: add FRED_API_KEY in Vercel env vars (free key: fred.stlouisfed.org)

export default async function handler(req, res) {
  const { series_id, start, end } = req.query;
  if (!series_id) return res.status(400).json({ error: "Missing series_id" });

  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "FRED_API_KEY not configured" });

  const params = new URLSearchParams({
    series_id: series_id.toString(),
    api_key: apiKey,
    file_type: "json",
    observation_start: (start || "2015-01-01").toString(),
    observation_end: (end || "2026-12-31").toString(),
  });

  try {
    const r = await fetch(`https://api.stlouisfed.org/fred/series/observations?${params}`);
    if (!r.ok) return res.status(r.status).json({ error: "FRED API error" });
    const data = await r.json();
    res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=43200");
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
