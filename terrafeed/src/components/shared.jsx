import { useState, useEffect, useCallback } from "react";

// ---------- Shared UI primitives ----------

export function Panel({ title, subtitle, right, children, style }) {
  return (
    <section style={{
      background: "var(--bg-card)", border: "1px solid var(--line)",
      borderRadius: 8, overflow: "hidden", ...style,
    }}>
      {(title || right) && (
        <header style={{
          display: "flex", alignItems: "baseline", justifyContent: "space-between",
          padding: "12px 16px", borderBottom: "1px solid var(--line)",
        }}>
          <div>
            <h2 style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", fontFamily: "var(--mono)" }}>{title}</h2>
            {subtitle && <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>{subtitle}</div>}
          </div>
          {right}
        </header>
      )}
      <div style={{ padding: 16 }}>{children}</div>
    </section>
  );
}

export function StatusDot({ status }) {
  const color = status === "live" ? "var(--green)" : status === "loading" ? "var(--amber)" : "var(--red)";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontFamily: "var(--mono)", color: "var(--text-dim)" }}>
      <span style={{
        width: 7, height: 7, borderRadius: "50%", background: color,
        animation: status === "live" ? "tf-pulse 2.4s infinite" : "none",
      }} />
      {status === "live" ? "LIVE" : status === "loading" ? "SYNCING" : "OFFLINE"}
    </span>
  );
}

export function SourceTag({ children }) {
  return (
    <span style={{
      fontSize: 10, fontFamily: "var(--mono)", color: "var(--text-faint)",
      border: "1px solid var(--line)", borderRadius: 3, padding: "2px 6px",
    }}>{children}</span>
  );
}

// ---------- Data hooks ----------

export function useApi(path, { enabled = true } = {}) {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);

  const refetch = useCallback(() => {
    if (!enabled) return;
    setStatus("loading");
    fetch(path)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(d => { setData(d); setStatus("live"); setError(null); })
      .catch(e => { setError(e.message); setStatus("error"); });
  }, [path, enabled]);

  useEffect(() => { refetch(); }, [refetch]);

  return { data, status, error, refetch };
}

// Parse GDELT GeoJSON into map points
export function parseGeoPoints(geojson) {
  if (!geojson?.features) return [];
  return geojson.features
    .map(f => {
      const [lon, lat] = f.geometry?.coordinates || [];
      if (lon == null || lat == null) return null;
      return {
        lon, lat,
        name: f.properties?.name || "Unknown location",
        count: f.properties?.count || 1,
        html: f.properties?.html || "",
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.count - a.count)
    .slice(0, 400);
}

// Extract article links from GDELT point html blob
export function articlesFromPointHtml(html) {
  if (!html) return [];
  const out = [];
  const re = /<a href="([^"]+)"[^>]*>([^<]+)<\/a>/g;
  let m;
  while ((m = re.exec(html)) && out.length < 6) {
    out.push({ url: m[1], title: m[2].trim() });
  }
  return out;
}

export function timeAgo(ts) {
  // GDELT seendate: "20260701T031500Z"
  if (!ts) return "";
  const m = ts.match(/(\d{4})(\d{2})(\d{2})T?(\d{2})(\d{2})/);
  if (!m) return "";
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]));
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}
