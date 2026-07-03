import { useState, useMemo } from "react";
import { Panel, SourceTag, useApi } from "../components/shared";
import { CLIMATE_ZONES, zoneFromLatitude, refineZone, UNIVERSAL_GROWER_NEEDS } from "../data/zones";

const PRESET_LOCATIONS = [
  { name: "Space Coast, FL", lat: 28.36, lon: -80.7 },
  { name: "Nairobi, Kenya", lat: -1.29, lon: 36.82 },
  { name: "Punjab, India", lat: 30.9, lon: 75.85 },
  { name: "São Paulo, Brazil", lat: -23.55, lon: -46.63 },
  { name: "Cairo, Egypt", lat: 30.04, lon: 31.24 },
  { name: "Saskatchewan, Canada", lat: 52.13, lon: -106.67 },
];

export default function ZonesPage() {
  const [loc, setLoc] = useState(PRESET_LOCATIONS[0]);
  const [customLat, setCustomLat] = useState("");
  const [customLon, setCustomLon] = useState("");

  const climate = useApi(`/api/climate?lat=${loc.lat}&lon=${loc.lon}`);

  const { zone, weekly } = useMemo(() => {
    const base = zoneFromLatitude(loc.lat);
    const daily = climate.data?.daily;
    if (!daily) return { zone: base, weekly: null };

    const precip = (daily.precipitation_sum || []).reduce((a, b) => a + (b || 0), 0);
    const highs = daily.temperature_2m_max || [];
    const avgHigh = highs.length ? highs.reduce((a, b) => a + b, 0) / highs.length : 0;
    const lows = daily.temperature_2m_min || [];
    const avgLow = lows.length ? lows.reduce((a, b) => a + b, 0) / lows.length : 0;
    const et0 = (daily.et0_fao_evapotranspiration || []).reduce((a, b) => a + (b || 0), 0);

    return {
      zone: refineZone(base, precip, avgHigh),
      weekly: {
        precip: Math.round(precip * 100) / 100,
        avgHigh: Math.round(avgHigh),
        avgLow: Math.round(avgLow),
        et0: Math.round(et0 * 100) / 100,
        waterDeficit: et0 > precip,
      },
    };
  }, [loc, climate.data]);

  const applyCustom = () => {
    const lat = parseFloat(customLat), lon = parseFloat(customLon);
    if (isNaN(lat) || isNaN(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return;
    setLoc({ name: `${lat.toFixed(2)}, ${lon.toFixed(2)}`, lat, lon });
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {/* Intro strip */}
      <div style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.65, maxWidth: 760 }}>
        Global data tells you where stress is. This layer answers the local question:
        <span style={{ color: "var(--text)" }}> what actually grows here, what do growers in this zone need, and what makes local food supply stable</span> — so
        any area has a path, not just a chart.
      </div>

      {/* Location picker */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {PRESET_LOCATIONS.map(p => (
          <button key={p.name} onClick={() => setLoc(p)}
            style={{
              background: loc.name === p.name ? "rgba(47,191,113,0.1)" : "transparent",
              border: `1px solid ${loc.name === p.name ? "var(--green)" : "var(--line)"}`,
              color: loc.name === p.name ? "var(--green)" : "var(--text-dim)",
              padding: "6px 13px", borderRadius: 4, fontSize: 12, cursor: "pointer", fontFamily: "var(--mono)",
            }}>
            {p.name}
          </button>
        ))}
        <div style={{ display: "flex", gap: 6, alignItems: "center", marginLeft: "auto" }}>
          <input value={customLat} onChange={e => setCustomLat(e.target.value)} placeholder="lat"
            style={inputStyle} />
          <input value={customLon} onChange={e => setCustomLon(e.target.value)} placeholder="lon"
            style={inputStyle} />
          <button onClick={applyCustom} style={{ ...inputStyle, cursor: "pointer", color: "var(--text)", width: "auto" }}>Go</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 14 }} className="tf-map-grid">
        {/* Zone profile */}
        <Panel title={`${zone.name} zone`} subtitle={`Köppen group ${zone.koppen} · ${loc.name}`}>
          <p style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.6, marginBottom: 14 }}>{zone.description}</p>

          <CropRow label="Staple calories" items={zone.staples} color="var(--amber)" />
          <CropRow label="High-value income crops" items={zone.highValue} color="var(--blue)" />
          <CropRow label="Fast food security (under 90 days)" items={zone.fastFood} color="var(--green)" />

          <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--line)" }}>
            <div style={{ fontSize: 11, fontFamily: "var(--mono)", textTransform: "uppercase", color: "var(--text-faint)", marginBottom: 6 }}>Water reality</div>
            <div style={{ fontSize: 12.5, color: "var(--text-dim)", lineHeight: 1.55 }}>{zone.waterNote}</div>
          </div>
        </Panel>

        {/* Live conditions + stability plan */}
        <div style={{ display: "grid", gap: 14, alignContent: "start" }}>
          <Panel title="Live growing conditions" subtitle="Next 7 days at this location" right={<SourceTag>Open-Meteo</SourceTag>}>
            {weekly ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                <Metric label="Avg high" value={`${weekly.avgHigh}°F`} />
                <Metric label="Avg low" value={`${weekly.avgLow}°F`} />
                <Metric label="7-day rain" value={`${weekly.precip}"`} />
                <Metric label="Evapotransp." value={`${weekly.et0}"`}
                  warn={weekly.waterDeficit} note={weekly.waterDeficit ? "deficit — irrigation week" : "surplus"} />
              </div>
            ) : (
              <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
                {climate.status === "loading" ? "Reading conditions…" : "Live weather loads once deployed."}
              </div>
            )}
          </Panel>

          <Panel title="Stability plan for this zone" subtitle="What actually moves local food security here">
            <ol style={{ display: "grid", gap: 10, paddingLeft: 18 }}>
              {zone.stabilityMoves.map((m, i) => (
                <li key={i} style={{ fontSize: 12.5, color: "var(--text-dim)", lineHeight: 1.55 }}>{m}</li>
              ))}
            </ol>
            <div style={{ marginTop: 12, fontSize: 11.5, color: "var(--text-faint)" }}>
              Key risks in this zone: {zone.risks.join(" · ")}
            </div>
          </Panel>
        </div>
      </div>

      {/* Universal needs */}
      <Panel title="What growers need everywhere" subtitle="The five constraints that decide local food stability, in rough priority order">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
          {UNIVERSAL_GROWER_NEEDS.map((n, i) => (
            <div key={n.need} style={{ borderLeft: "2px solid var(--line-bright)", paddingLeft: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, fontFamily: "var(--mono)" }}>
                <span style={{ color: "var(--text-faint)" }}>{String(i + 1).padStart(2, "0")}</span> {n.need}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.55 }}>{n.detail}</div>
            </div>
          ))}
        </div>
      </Panel>

      <div style={{ fontSize: 11, color: "var(--text-faint)", lineHeight: 1.6 }}>
        Zone guidance draws on USDA hardiness data, FAO crop calendars, and agricultural extension research.
        It's general-purpose orientation, not a substitute for local extension services or soil testing.
      </div>
    </div>
  );
}

const inputStyle = {
  background: "var(--bg-raise)", border: "1px solid var(--line)", borderRadius: 4,
  color: "var(--text)", padding: "6px 10px", fontSize: 12, width: 70, fontFamily: "var(--mono)",
};

function CropRow({ label, items, color }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontFamily: "var(--mono)", textTransform: "uppercase", color: "var(--text-faint)", marginBottom: 6 }}>{label}</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {items.map(c => (
          <span key={c} style={{ fontSize: 12, color, border: `1px solid ${color}44`, borderRadius: 4, padding: "3px 9px" }}>{c}</span>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value, warn, note }) {
  return (
    <div>
      <div style={{ fontSize: 10.5, fontFamily: "var(--mono)", textTransform: "uppercase", color: "var(--text-faint)" }}>{label}</div>
      <div style={{ fontSize: 19, fontWeight: 600, color: warn ? "var(--amber)" : "var(--text)", marginTop: 2 }}>{value}</div>
      {note && <div style={{ fontSize: 10, color: warn ? "var(--amber)" : "var(--green)", fontFamily: "var(--mono)" }}>{note}</div>}
    </div>
  );
}
