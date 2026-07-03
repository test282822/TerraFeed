// Landing page. All graphics are hand-built inline SVG — no stock photos,
// no emojis. Every data claim on this page names its source.

const S = {
  section: { maxWidth: 1080, margin: "0 auto", padding: "0 22px" },
  h2: { fontSize: 22, fontWeight: 700, letterSpacing: "-0.01em", marginBottom: 10 },
  lead: { fontSize: 14.5, color: "var(--text-dim)", lineHeight: 1.7, maxWidth: 640 },
  mono: { fontFamily: "var(--mono)" },
};

/* ---------- SVG art ---------- */

function GlobeArt() {
  // Stylized globe with signal points — echoes the live map
  const points = [
    [95, 52, 4], [138, 78, 6], [78, 95, 3], [160, 60, 3.5],
    [118, 110, 5], [60, 70, 2.5], [145, 120, 3], [102, 82, 2.5],
  ];
  return (
    <svg viewBox="0 0 220 170" width="100%" style={{ maxWidth: 460, display: "block" }} role="img"
      aria-label="Stylized globe with glowing signal points representing food security news locations">
      <defs>
        <radialGradient id="lg-glow">
          <stop offset="0%" stopColor="#E8B33D" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#E8B33D" stopOpacity="0" />
        </radialGradient>
        <clipPath id="lg-globe"><ellipse cx="110" cy="85" rx="82" ry="72" /></clipPath>
      </defs>
      <ellipse cx="110" cy="85" rx="82" ry="72" fill="#0B121A" stroke="#263547" strokeWidth="1" />
      <g clipPath="url(#lg-globe)" stroke="#1A2532" strokeWidth="0.8" fill="none">
        {/* meridians */}
        {[-60, -30, 0, 30, 60].map(o => (
          <ellipse key={o} cx={110 + o} cy="85" rx={Math.max(8, 82 - Math.abs(o))} ry="72" />
        ))}
        {/* parallels */}
        {[-45, -22, 0, 22, 45].map(o => (
          <line key={o} x1="28" x2="192" y1={85 + o} y2={85 + o} />
        ))}
        {/* landmass suggestion strokes */}
        <path d="M62 60 q18 -14 38 -8 q14 4 10 16 q-6 14 -24 12 q-20 -2 -24 -20z" fill="#111C29" stroke="#263547" />
        <path d="M120 96 q20 -8 34 2 q10 8 2 20 q-10 12 -26 6 q-16 -6 -10 -28z" fill="#111C29" stroke="#263547" />
        <path d="M80 112 q10 -6 20 0 q6 6 0 14 q-10 8 -20 0 q-6 -8 0 -14z" fill="#111C29" stroke="#263547" />
      </g>
      {points.map(([x, y, r], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={r * 2.6} fill="url(#lg-glow)" />
          <circle cx={x} cy={y} r={r * 0.55} fill="#E8B33D" />
        </g>
      ))}
      <ellipse cx="110" cy="85" rx="82" ry="72" fill="none" stroke="#263547" strokeWidth="1" />
    </svg>
  );
}

function ChartArt() {
  return (
    <svg viewBox="0 0 200 110" width="100%" style={{ maxWidth: 300, display: "block" }} role="img"
      aria-label="Line chart illustration showing an inflation trend with a highlighted spike">
      <g stroke="#1A2532" strokeWidth="0.8">
        {[25, 50, 75].map(y => <line key={y} x1="14" x2="192" y1={y} y2={y} />)}
      </g>
      <polyline fill="none" stroke="#4A9EDE" strokeWidth="1.6"
        points="14,80 40,74 66,76 92,62 118,66 144,38 170,46 192,30" />
      <polyline fill="none" stroke="#2FBF71" strokeWidth="1.6" opacity="0.75"
        points="14,88 40,86 66,82 92,84 118,78 144,72 170,74 192,68" />
      <circle cx="144" cy="38" r="3.5" fill="none" stroke="#E8B33D" strokeWidth="1.4" />
      <line x1="144" y1="42" x2="144" y2="96" stroke="#E8B33D" strokeWidth="0.8" strokeDasharray="3 3" />
      <line x1="14" y1="96" x2="192" y2="96" stroke="#263547" strokeWidth="1" />
    </svg>
  );
}

function ZoneArt() {
  return (
    <svg viewBox="0 0 200 110" width="100%" style={{ maxWidth: 300, display: "block" }} role="img"
      aria-label="Diagram of climate bands from tropical to polar with a crop marker">
      {[
        ["#2FBF71", 78, "0.5"], ["#E8B33D", 58, "0.45"], ["#4A9EDE", 38, "0.4"], ["#7D8FA3", 20, "0.3"],
      ].map(([c, y, o], i) => (
        <path key={i} d={`M10 ${y} q45 ${i % 2 ? 10 : -10} 90 0 q45 ${i % 2 ? -10 : 10} 90 0`}
          fill="none" stroke={c} strokeWidth="1.6" opacity={o} />
      ))}
      {/* sprout marker */}
      <g transform="translate(100 82)">
        <line x1="0" y1="0" x2="0" y2="14" stroke="#2FBF71" strokeWidth="1.6" />
        <path d="M0 4 q-9 -2 -11 -10 q9 0 11 10z" fill="#2FBF71" opacity="0.9" />
        <path d="M0 7 q9 -2 11 -10 q-9 0 -11 10z" fill="#2FBF71" opacity="0.65" />
        <circle cx="0" cy="18" r="2.4" fill="none" stroke="#7D8FA3" strokeWidth="1" />
      </g>
      <line x1="10" y1="100" x2="190" y2="100" stroke="#263547" strokeWidth="1" />
    </svg>
  );
}

/* ---------- Page ---------- */

export default function LandingPage({ onEnter }) {
  return (
    <div style={{ paddingBottom: 40 }}>
      {/* HERO */}
      <div style={{ ...S.section, display: "grid", gridTemplateColumns: "minmax(0,1.1fr) minmax(0,1fr)", gap: 32, alignItems: "center", padding: "56px 22px 48px" }} className="tf-map-grid">
        <div>
          <div style={{ ...S.mono, fontSize: 11, color: "var(--green)", letterSpacing: "0.12em", marginBottom: 14 }}>
            OPEN DATA · NO ACCOUNTS · NO ADS
          </div>
          <h1 style={{ fontSize: "clamp(30px, 4.5vw, 46px)", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.12, marginBottom: 16 }}>
            The world's food system,<br />as a live signal.
          </h1>
          <p style={{ ...S.lead, marginBottom: 24 }}>
            terrafeed maps where food security is making news right now, tracks the price
            pressure behind it, and turns global data into local growing guidance — so any
            place on the map has a path, not just a chart.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button onClick={onEnter} style={{
              background: "var(--green)", color: "#06110A", border: "none", borderRadius: 5,
              padding: "11px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer",
            }}>
              Open the live map
            </button>
            <a href="#sources" style={{
              ...S.mono, display: "inline-flex", alignItems: "center", padding: "11px 20px",
              fontSize: 12.5, color: "var(--text-dim)", textDecoration: "none",
              border: "1px solid var(--line-bright)", borderRadius: 5,
            }}>
              Where the data comes from
            </a>
          </div>
        </div>
        <GlobeArt />
      </div>

      {/* THREE LAYERS */}
      <div style={{ ...S.section, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, padding: "8px 22px 48px" }}>
        {[
          {
            art: <GlobeMini />, title: "Global Signal",
            body: "Every location mentioned in food-security news over the past 7 days, plotted live and sized by coverage volume. Click a point, read the actual articles.",
            src: "GDELT Project — updates every 15 minutes",
          },
          {
            art: <ChartArt />, title: "Price Indicators",
            body: "Inflation pressure across 15 high-population countries, plus US food-category detail down to dairy, meat, and cereals, month by month.",
            src: "World Bank Open Data · FRED (St. Louis Fed)",
          },
          {
            art: <ZoneArt />, title: "Local Stability",
            body: "Pick any point on Earth. Get its climate zone, what grows there, live water-deficit readings, and the moves that actually stabilize local food supply.",
            src: "Open-Meteo live weather · USDA/FAO-informed zone guidance",
          },
        ].map(card => (
          <div key={card.title} style={{ background: "var(--bg-card)", border: "1px solid var(--line)", borderRadius: 8, padding: 20, display: "grid", gap: 12, alignContent: "start" }}>
            <div style={{ height: 110, display: "flex", alignItems: "center" }}>{card.art}</div>
            <h3 style={{ fontSize: 15.5, fontWeight: 600 }}>{card.title}</h3>
            <p style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.65 }}>{card.body}</p>
            <div style={{ ...S.mono, fontSize: 10.5, color: "var(--text-faint)", borderTop: "1px solid var(--line)", paddingTop: 10 }}>
              SOURCE — {card.src}
            </div>
          </div>
        ))}
      </div>

      {/* SOURCES & HONESTY */}
      <div id="sources" style={{ borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", background: "var(--bg-raise)", padding: "44px 0" }}>
        <div style={S.section}>
          <h2 style={S.h2}>Where every number comes from</h2>
          <p style={{ ...S.lead, marginBottom: 24 }}>
            Nothing on this site is invented and nothing is resold. These are the pipes,
            exactly as they run in production:
          </p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 560 }}>
              <thead>
                <tr style={{ ...S.mono, fontSize: 10.5, color: "var(--text-faint)", textTransform: "uppercase", textAlign: "left" }}>
                  <th style={thStyle}>What you see</th>
                  <th style={thStyle}>Source</th>
                  <th style={thStyle}>Refresh</th>
                  <th style={thStyle}>What it actually measures</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Signal map & news wire", "GDELT Project (GEO + DOC 2.0 APIs)", "15 min", "News coverage mentioning food security — media attention, not ground-truth conditions"],
                  ["Country inflation", "World Bank Open Data (FP.CPI.TOTL.ZG)", "Annual, cached 24h", "General consumer inflation — a stress proxy, not food-only prices"],
                  ["US food categories", "FRED, Federal Reserve Bank of St. Louis", "Monthly, cached 24h", "Consumer Price Index by food category — prices paid, not quantities sold"],
                  ["Growing conditions", "Open-Meteo", "Hourly, cached 1h", "Modeled forecast data — very good, still a model"],
                  ["Zone crop guidance", "Curated from USDA hardiness data, FAO crop calendars, extension research", "Static, versioned", "General orientation by climate zone — not a soil test, not local extension advice"],
                ].map((row, i) => (
                  <tr key={i} style={{ borderTop: "1px solid var(--line)" }}>
                    {row.map((cell, j) => (
                      <td key={j} style={{ padding: "11px 16px 11px 0", color: j === 0 ? "var(--text)" : "var(--text-dim)", lineHeight: 1.5, fontFamily: j === 1 ? "var(--mono)" : "inherit", fontSize: j === 1 ? 12 : 13 }}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 26, borderLeft: "2px solid var(--amber)", paddingLeft: 16, maxWidth: 700 }}>
            <div style={{ ...S.mono, fontSize: 11, color: "var(--amber)", letterSpacing: "0.08em", marginBottom: 8 }}>WHERE THIS DATA CAN MISLEAD YOU</div>
            <ul style={{ display: "grid", gap: 8, paddingLeft: 16, fontSize: 13, color: "var(--text-dim)", lineHeight: 1.6 }}>
              <li>Heavy news coverage of a region doesn't mean it has the worst conditions — media attention is uneven, and quiet crises are underrepresented on the map.</li>
              <li>World Bank inflation is annual and general-purpose. Food inflation in a given country can run well above or below the headline number.</li>
              <li>If an upstream API is down or returns partial data, panels say so instead of showing stale numbers as fresh. Blank and honest beats full and wrong.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* BUILD NOTE */}
      <div style={{ ...S.section, padding: "44px 22px 8px" }}>
        <h2 style={S.h2}>How this was built</h2>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.5fr) minmax(0,1fr)", gap: 28 }} className="tf-map-grid">
          <div style={{ fontSize: 13.5, color: "var(--text-dim)", lineHeight: 1.75, display: "grid", gap: 12 }}>
            <p>
              terrafeed was designed and coded in collaboration with <strong style={{ color: "var(--text)" }}>Claude
              Fable 5</strong>, Anthropic's frontier AI model, working as the project's full-stack developer —
              from verifying that each public API actually exists and behaves as documented, through
              architecture, code, and the words on this page.
            </p>
            <p>
              A note from the model, in its own words: <em style={{ color: "var(--text)" }}>"My contribution was
              verification, architecture, and craft — checking API docs before writing code against them,
              choosing edge caching over a fake 'agent,' and insisting the limitations table above exists.
              The judgment about what this should be, and who it should serve, came from a human. That
              division of labor is the honest story of how software like this gets made in 2026."</em>
            </p>
            <p style={{ fontSize: 12.5, color: "var(--text-faint)" }}>
              The architecture is deliberately boring: a static React frontend, five serverless proxy
              functions, and edge caching. No database, no accounts, nothing to breach, nothing to maintain
              at 3am.
            </p>
          </div>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--line)", borderRadius: 8, padding: 18, alignSelf: "start" }}>
            <div style={{ ...S.mono, fontSize: 10.5, color: "var(--text-faint)", letterSpacing: "0.08em", marginBottom: 12 }}>BUILD FACTS</div>
            {[
              ["Stack", "React + Vite, Vercel serverless"],
              ["Database", "None — edge cache is the state"],
              ["API keys required", "Zero (one optional, for US CPI)"],
              ["Tracking / analytics", "None"],
              ["Developed with", "Claude Fable 5 (Anthropic)"],
              ["Data cost", "$0 — all public open data"],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "7px 0", borderTop: "1px solid var(--line)", fontSize: 12 }}>
                <span style={{ color: "var(--text-faint)", fontFamily: "var(--mono)", fontSize: 11 }}>{k}</span>
                <span style={{ color: "var(--text-dim)", textAlign: "right" }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FINAL CTA */}
      <div style={{ ...S.section, padding: "40px 22px 20px", textAlign: "center" }}>
        <button onClick={onEnter} style={{
          background: "transparent", color: "var(--green)", border: "1px solid var(--green)",
          borderRadius: 5, padding: "12px 32px", fontSize: 14, fontWeight: 600, cursor: "pointer",
        }}>
          Open the live map →
        </button>
      </div>
    </div>
  );
}

function GlobeMini() {
  return (
    <svg viewBox="0 0 200 110" width="100%" style={{ maxWidth: 300, display: "block" }} role="img" aria-label="Small globe illustration with signal points">
      <ellipse cx="100" cy="55" rx="52" ry="46" fill="#0B121A" stroke="#263547" />
      <g stroke="#1A2532" fill="none">
        {[-26, 0, 26].map(o => <ellipse key={o} cx={100 + o} cy="55" rx={Math.max(6, 52 - Math.abs(o))} ry="46" />)}
        {[-20, 0, 20].map(o => <line key={o} x1="48" x2="152" y1={55 + o} y2={55 + o} />)}
      </g>
      {[[82, 38, 3], [118, 62, 4.5], [100, 78, 2.5], [128, 40, 3]].map(([x, y, r], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={r * 2.2} fill="#E8B33D" opacity="0.15" />
          <circle cx={x} cy={y} r={r * 0.6} fill="#E8B33D" />
        </g>
      ))}
    </svg>
  );
}

const thStyle = { padding: "0 16px 10px 0", fontWeight: 500 };
