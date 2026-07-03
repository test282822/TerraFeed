// GET /api/food-inflation?countries=US;BR;IN;NG;EG
// World Bank Indicators API - Consumer price index / inflation proxy for food stress.
// Uses FP.CPI.TOTL.ZG (inflation, consumer prices, annual %). Keyless. Cached 24h.

export default async function handler(req, res) {
  const countries = ((req.query.countries || "US;CN;IN;BR;NG;EG;ID;PK;BD;MX;ET;PH;TR;VN;KE").toString())
    .split(";").slice(0, 20).join(";");

  const url = `https://api.worldbank.org/v2/country/${countries}/indicator/FP.CPI.TOTL.ZG?format=json&per_page=400&date=2000:2026`;

  try {
    const r = await fetch(url);
    if (!r.ok) return res.status(r.status).json({ error: "World Bank API error" });
    const data = await r.json();
    res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=43200");
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
