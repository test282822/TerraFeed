// GET /api/news?mode=artlist|timelinevol&query=...
// Proxies GDELT DOC 2.0 API. Keyless. Cached 15 min.

const DEFAULT_QUERY = '(food prices OR food shortage OR food security OR crop failure OR harvest)';

export default async function handler(req, res) {
  const mode = req.query.mode === "timelinevol" ? "timelinevol" : "artlist";
  const rawQuery = (req.query.query || "").toString().slice(0, 120);
  const query = rawQuery || DEFAULT_QUERY;

  const params = new URLSearchParams({
    query,
    mode,
    format: "json",
    maxrecords: "50",
    timespan: mode === "timelinevol" ? "14d" : "2d",
    sort: "hybridrel",
  });

  try {
    const r = await fetch(`https://api.gdeltproject.org/api/v2/doc/doc?${params}`, {
      headers: { "User-Agent": "TerraFeed/1.0" },
    });
    if (!r.ok) return res.status(r.status).json({ error: "GDELT DOC error" });
    const text = await r.text();
    // GDELT occasionally returns non-JSON error strings
    let data;
    try { data = JSON.parse(text); } catch { return res.status(502).json({ error: "GDELT returned non-JSON", raw: text.slice(0, 200) }); }
    res.setHeader("Cache-Control", "public, s-maxage=900, stale-while-revalidate=450");
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
