import { useMemo, useState } from "react";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { Panel, StatusDot, SourceTag, useApi } from "../components/shared";

const COUNTRY_NAMES = {
  US: "United States", CN: "China", IN: "India", BR: "Brazil", NG: "Nigeria",
  EG: "Egypt", ID: "Indonesia", PK: "Pakistan", BD: "Bangladesh", MX: "Mexico",
  ET: "Ethiopia", PH: "Philippines", TR: "Türkiye", VN: "Vietnam", KE: "Kenya",
};

const FRED_SERIES = [
  { id: "CUSR0000SAF11", label: "Food at home (CPI)" },
  { id: "CUSR0000SEFC", label: "Meats, poultry, fish, eggs" },
  { id: "CUSR0000SEFB", label: "Dairy" },
  { id: "CUSR0000SEFA", label: "Cereals & cereal products" },
];

const LINE_COLORS = ["#E8B33D", "#4A9EDE", "#2FBF71", "#C77DDB", "#E05252", "#5BC4E8", "#DE9E4A", "#7DCF7D"];

export default function IndicatorsPage() {
  const wb = useApi("/api/food-inflation");
  const [fredSeries, setFredSeries] = useState(FRED_SERIES[0]);
  const fred = useApi(`/api/fred?series_id=${fredSeries.id}&start=2019-01-01`);

  // World Bank: latest inflation per country + 10y trend for top movers
  const { latestByCountry, trendData } = useMemo(() => {
    const rows = wb.data?.[1] || [];
    const byCountry = {};
    rows.forEach(r => {
      const iso = r.country?.id || r.countryiso3code?.slice(0, 2);
      if (!iso || r.value == null) return;
      if (!byCountry[iso]) byCountry[iso] = [];
      byCountry[iso].push({ year: +r.date, value: Math.round(r.value * 10) / 10 });
    });

    const latest = Object.entries(byCountry)
      .map(([iso, series]) => {
        const sorted = series.sort((a, b) => b.year - a.year);
        return { iso, name: COUNTRY_NAMES[iso] || iso, ...sorted[0] };
      })
      .sort((a, b) => b.value - a.value);

    // Build merged trend rows for the top 6 by latest inflation
    const top = latest.slice(0, 6).map(c => c.iso);
    const years = {};
    top.forEach(iso => {
      (byCountry[iso] || []).forEach(({ year, value }) => {
        if (year < 2010) return;
        if (!years[year]) years[year] = { year };
        years[year][COUNTRY_NAMES[iso] || iso] = value;
      });
    });
    const trend = Object.values(years).sort((a, b) => a.year - b.year);
    return { latestByCountry: latest, trendData: trend };
  }, [wb.data]);

  const trendKeys = useMemo(
    () => latestByCountry.slice(0, 6).map(c => c.name),
    [latestByCountry]
  );

  // FRED: monthly observations -> YoY % change
  const fredData = useMemo(() => {
    const obs = (fred.data?.observations || []).filter(o => o.value !== ".");
    return obs.map((o, i) => {
      const prev = obs[i - 12];
      const yoy = prev ? ((parseFloat(o.value) / parseFloat(prev.value)) - 1) * 100 : null;
      return {
        date: o.date.slice(0, 7),
        index: Math.round(parseFloat(o.value) * 10) / 10,
        yoy: yoy != null ? Math.round(yoy * 10) / 10 : null,
      };
    }).filter(d => d.yoy != null);
  }, [fred.data]);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.4fr) minmax(0,1fr)", gap: 14 }} className="tf-map-grid">
        {/* World Bank trend chart */}
        <Panel title="Inflation pressure · highest-burden countries" subtitle="Consumer price inflation, annual % · World Bank"
          right={<div style={{ display: "flex", gap: 8, alignItems: "center" }}><SourceTag>World Bank API</SourceTag><StatusDot status={wb.status} /></div>}>
          {trendData.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData} margin={{ top: 4, right: 8, bottom: 0, left: -14 }}>
                <CartesianGrid stroke="var(--line)" strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="year" tick={{ fill: "var(--text-faint)", fontSize: 10, fontFamily: "var(--mono)" }} tickLine={false} axisLine={{ stroke: "var(--line)" }} />
                <YAxis tick={{ fill: "var(--text-faint)", fontSize: 10, fontFamily: "var(--mono)" }} tickLine={false} axisLine={false} unit="%" />
                <Tooltip contentStyle={{ background: "var(--bg-raise)", border: "1px solid var(--line-bright)", borderRadius: 6, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {trendKeys.map((k, i) => (
                  <Line key={k} dataKey={k} type="monotone" stroke={LINE_COLORS[i]} strokeWidth={1.6} dot={false} connectNulls />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState status={wb.status} />
          )}
        </Panel>

        {/* Latest readings table */}
        <Panel title="Latest readings" subtitle="Most recent annual inflation by country">
          <div style={{ maxHeight: 320, overflowY: "auto", margin: -16, padding: 16 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
              <thead>
                <tr style={{ textAlign: "left", fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--text-faint)", textTransform: "uppercase" }}>
                  <th style={{ padding: "6px 0", fontWeight: 500 }}>Country</th>
                  <th style={{ padding: "6px 0", fontWeight: 500 }}>Year</th>
                  <th style={{ padding: "6px 0", fontWeight: 500, textAlign: "right" }}>Inflation</th>
                </tr>
              </thead>
              <tbody>
                {latestByCountry.map(c => (
                  <tr key={c.iso} style={{ borderTop: "1px solid var(--line)" }}>
                    <td style={{ padding: "8px 0" }}>{c.name}</td>
                    <td style={{ padding: "8px 0", color: "var(--text-dim)", fontFamily: "var(--mono)", fontSize: 11.5 }}>{c.year}</td>
                    <td style={{ padding: "8px 0", textAlign: "right", fontFamily: "var(--mono)", color: c.value > 15 ? "var(--red)" : c.value > 7 ? "var(--amber)" : "var(--green)" }}>
                      {c.value}%
                    </td>
                  </tr>
                ))}
                {!latestByCountry.length && (
                  <tr><td colSpan={3} style={{ padding: "16px 0", color: "var(--text-dim)" }}>
                    {wb.status === "loading" ? "Loading…" : "Available once deployed."}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      {/* FRED US detail */}
      <Panel title="United States · food category detail" subtitle="Year-over-year % change, monthly CPI"
        right={<div style={{ display: "flex", gap: 8, alignItems: "center" }}><SourceTag>FRED</SourceTag><StatusDot status={fred.status} /></div>}>
        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          {FRED_SERIES.map(s => (
            <button key={s.id} onClick={() => setFredSeries(s)}
              style={{
                background: fredSeries.id === s.id ? "rgba(74,158,222,0.12)" : "transparent",
                border: `1px solid ${fredSeries.id === s.id ? "var(--blue)" : "var(--line)"}`,
                color: fredSeries.id === s.id ? "var(--blue)" : "var(--text-dim)",
                padding: "5px 12px", borderRadius: 4, fontSize: 11.5, cursor: "pointer", fontFamily: "var(--mono)",
              }}>
              {s.label}
            </button>
          ))}
        </div>
        {fredData.length ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={fredData} margin={{ top: 4, right: 4, bottom: 0, left: -14 }}>
              <CartesianGrid stroke="var(--line)" strokeDasharray="2 4" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: "var(--text-faint)", fontSize: 10, fontFamily: "var(--mono)" }} tickLine={false} axisLine={{ stroke: "var(--line)" }} interval={Math.floor(fredData.length / 10)} />
              <YAxis tick={{ fill: "var(--text-faint)", fontSize: 10, fontFamily: "var(--mono)" }} tickLine={false} axisLine={false} unit="%" />
              <Tooltip contentStyle={{ background: "var(--bg-raise)", border: "1px solid var(--line-bright)", borderRadius: 6, fontSize: 12 }} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="yoy" name="YoY %" fill="var(--blue)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ fontSize: 12, color: "var(--text-dim)", padding: "20px 0" }}>
            {fred.status === "error"
              ? "FRED needs a free API key — add FRED_API_KEY in your Vercel environment variables (fred.stlouisfed.org). Everything else on this site runs keyless."
              : "Loading…"}
          </div>
        )}
      </Panel>
    </div>
  );
}

function EmptyState({ status }) {
  return (
    <div style={{ fontSize: 12, color: "var(--text-dim)", padding: "40px 0", textAlign: "center" }}>
      {status === "loading" ? "Fetching World Bank data…" : "Data loads once deployed (serverless functions need Vercel or `vercel dev`)."}
    </div>
  );
}
