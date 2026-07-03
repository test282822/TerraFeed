import { useState, useMemo } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import GlobalMap from "../components/GlobalMap";
import { Panel, StatusDot, SourceTag, useApi, parseGeoPoints, articlesFromPointHtml, timeAgo } from "../components/shared";

const TOPIC_FILTERS = [
  { label: "All food security", q: "" },
  { label: "Prices & inflation", q: "food prices" },
  { label: "Shortages", q: "food shortage" },
  { label: "Harvest & crops", q: "harvest" },
  { label: "Drought", q: "drought" },
  { label: "Supply chain", q: "food supply chain" },
];

export default function MapPage() {
  const [filter, setFilter] = useState(TOPIC_FILTERS[0]);
  const [selectedPoint, setSelectedPoint] = useState(null);

  const geo = useApi(`/api/map-events${filter.q ? `?query=${encodeURIComponent(filter.q)}` : ""}`);
  const news = useApi(`/api/news?mode=artlist${filter.q ? `&query=${encodeURIComponent(filter.q + " food")}` : ""}`);
  const timeline = useApi(`/api/news?mode=timelinevol`);

  const points = useMemo(() => parseGeoPoints(geo.data), [geo.data]);
  const articles = news.data?.articles || [];

  const timelineData = useMemo(() => {
    const series = timeline.data?.timeline?.[0]?.data || [];
    return series.map(d => ({
      date: d.date?.slice(4, 8).replace(/(\d{2})(\d{2})/, "$1/$2") || "",
      vol: Math.round((d.value || 0) * 10000) / 100,
    }));
  }, [timeline.data]);

  const selectedArticles = useMemo(
    () => (selectedPoint ? articlesFromPointHtml(selectedPoint.html) : []),
    [selectedPoint]
  );

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {/* Filter bar */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {TOPIC_FILTERS.map(f => (
          <button key={f.label} onClick={() => { setFilter(f); setSelectedPoint(null); }}
            style={{
              background: filter.label === f.label ? "rgba(232,179,61,0.12)" : "transparent",
              border: `1px solid ${filter.label === f.label ? "var(--amber)" : "var(--line)"}`,
              color: filter.label === f.label ? "var(--amber)" : "var(--text-dim)",
              padding: "6px 14px", borderRadius: 4, fontSize: 12, cursor: "pointer",
              fontFamily: "var(--mono)", transition: "border-color .15s, color .15s",
            }}>
            {f.label}
          </button>
        ))}
        <div style={{ marginLeft: "auto" }}><StatusDot status={geo.status} /></div>
      </div>

      {/* Map + side feed */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2.2fr) minmax(280px, 1fr)", gap: 14 }} className="tf-map-grid">
        <Panel title="Global food signal map" subtitle="Locations mentioned in food-security news · last 7 days · updates every 15 min"
          right={<SourceTag>GDELT GEO 2.0</SourceTag>} style={{ minWidth: 0 }}>
          <GlobalMap points={points} onSelectPoint={setSelectedPoint} selectedPoint={selectedPoint} />
          {geo.status === "error" && (
            <div style={{ color: "var(--red)", fontSize: 12, marginTop: 8 }}>
              Couldn't reach GDELT — this works once deployed (serverless functions don't run under plain `vite dev`).
            </div>
          )}
        </Panel>

        <div style={{ display: "grid", gap: 14, alignContent: "start", minWidth: 0 }}>
          {/* Selected location detail */}
          {selectedPoint ? (
            <Panel title={selectedPoint.name} subtitle={`${selectedPoint.count} articles at this location`}
              right={<button onClick={() => setSelectedPoint(null)} style={{ background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer", fontSize: 16 }}>×</button>}>
              {selectedArticles.length ? selectedArticles.map((a, i) => (
                <a key={i} href={a.url} target="_blank" rel="noopener noreferrer"
                  style={{ display: "block", fontSize: 12.5, lineHeight: 1.5, color: "var(--text)", textDecoration: "none", padding: "8px 0", borderBottom: i < selectedArticles.length - 1 ? "1px solid var(--line)" : "none" }}>
                  {a.title} <span style={{ color: "var(--blue)" }}>→</span>
                </a>
              )) : <div style={{ fontSize: 12, color: "var(--text-dim)" }}>No article links parsed for this point.</div>}
            </Panel>
          ) : (
            <Panel title="Live wire" subtitle="Latest food-security coverage worldwide" right={<SourceTag>GDELT DOC 2.0</SourceTag>}>
              <div style={{ maxHeight: 420, overflowY: "auto", margin: -16, padding: 16 }}>
                {articles.slice(0, 14).map((a, i) => (
                  <a key={i} href={a.url} target="_blank" rel="noopener noreferrer"
                    style={{ display: "block", padding: "9px 0", borderBottom: "1px solid var(--line)", textDecoration: "none" }}>
                    <div style={{ fontSize: 12.5, lineHeight: 1.45, color: "var(--text)" }}>{a.title}</div>
                    <div style={{ fontSize: 10.5, color: "var(--text-faint)", marginTop: 3, fontFamily: "var(--mono)" }}>
                      {a.domain} · {a.sourcecountry || "—"} · {timeAgo(a.seendate)}
                    </div>
                  </a>
                ))}
                {news.status === "loading" && <div style={{ fontSize: 12, color: "var(--text-dim)", padding: "12px 0" }}>Loading wire…</div>}
                {news.status === "error" && <div style={{ fontSize: 12, color: "var(--red)", padding: "12px 0" }}>Wire unavailable in local dev — deploys fine.</div>}
              </div>
            </Panel>
          )}
        </div>
      </div>

      {/* Coverage volume timeline */}
      <Panel title="Global coverage intensity" subtitle="Share of all world news mentioning food security · 14 days"
        right={<SourceTag>GDELT TimelineVol</SourceTag>}>
        {timelineData.length ? (
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={timelineData} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
              <defs>
                <linearGradient id="volFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--amber)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--amber)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: "var(--text-faint)", fontSize: 10, fontFamily: "var(--mono)" }} tickLine={false} axisLine={{ stroke: "var(--line)" }} interval={Math.floor(timelineData.length / 8)} />
              <YAxis tick={{ fill: "var(--text-faint)", fontSize: 10, fontFamily: "var(--mono)" }} tickLine={false} axisLine={false} unit="%" />
              <Tooltip contentStyle={{ background: "var(--bg-raise)", border: "1px solid var(--line-bright)", borderRadius: 6, fontSize: 12 }} labelStyle={{ color: "var(--text-dim)" }} />
              <Area type="monotone" dataKey="vol" stroke="var(--amber)" strokeWidth={1.5} fill="url(#volFill)" name="Coverage %" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ fontSize: 12, color: "var(--text-dim)", padding: "24px 0", textAlign: "center" }}>
            {timeline.status === "loading" ? "Loading timeline…" : "Timeline available once deployed."}
          </div>
        )}
      </Panel>
    </div>
  );
}
