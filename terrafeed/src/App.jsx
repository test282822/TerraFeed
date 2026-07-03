import { useState } from "react";
import LandingPage from "./pages/LandingPage";
import MapPage from "./pages/MapPage";
import IndicatorsPage from "./pages/IndicatorsPage";
import ZonesPage from "./pages/ZonesPage";

const PAGES = [
  { id: "home", label: "Home", component: null },
  { id: "map", label: "Global Signal", component: MapPage },
  { id: "indicators", label: "Price Indicators", component: IndicatorsPage },
  { id: "zones", label: "Local Stability", component: ZonesPage },
];

export default function App() {
  const [pageId, setPageId] = useState("home");
  const page = PAGES.find(p => p.id === pageId);

  return (
    <div style={{ minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        @keyframes tf-pulse { 0%,100% { opacity: 1 } 50% { opacity: .35 } }
        @media (max-width: 880px) { .tf-map-grid { grid-template-columns: minmax(0,1fr) !important; } }
        button:focus-visible, input:focus-visible, a:focus-visible { outline: 1px solid var(--blue); outline-offset: 2px; }
      `}</style>

      <header style={{
        borderBottom: "1px solid var(--line)",
        padding: "0 22px",
        display: "flex", alignItems: "center", gap: 28,
        height: 54,
        position: "sticky", top: 0, zIndex: 20,
        background: "rgba(6,10,15,0.92)", backdropFilter: "blur(8px)",
      }}>
        <button onClick={() => setPageId("home")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "baseline", gap: 8, padding: 0 }}>
          <span style={{ fontFamily: "var(--mono)", fontWeight: 500, fontSize: 15, letterSpacing: "-0.01em", color: "var(--text)" }}>
            terra<span style={{ color: "var(--green)" }}>feed</span>
          </span>
          <span style={{ fontSize: 10, fontFamily: "var(--mono)", color: "var(--text-faint)", letterSpacing: "0.08em" }}>
            GLOBAL FOOD SIGNAL
          </span>
        </button>

        <nav style={{ display: "flex", gap: 2, height: "100%" }}>
          {PAGES.filter(p => p.id !== "home").map(p => (
            <button key={p.id} onClick={() => setPageId(p.id)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                padding: "0 14px", fontSize: 13, height: "100%",
                color: pageId === p.id ? "var(--text)" : "var(--text-dim)",
                borderBottom: `2px solid ${pageId === p.id ? "var(--green)" : "transparent"}`,
                fontWeight: pageId === p.id ? 600 : 400,
                transition: "color .15s",
              }}>
              {p.label}
            </button>
          ))}
        </nav>

        <div style={{ marginLeft: "auto", fontSize: 10.5, fontFamily: "var(--mono)", color: "var(--text-faint)" }}>
          GDELT · World Bank · FRED · Open-Meteo
        </div>
      </header>

      {pageId === "home" ? (
        <LandingPage onEnter={() => setPageId("map")} />
      ) : (
        <main style={{ maxWidth: 1240, margin: "0 auto", padding: "20px 22px 60px" }}>
          <page.component />
        </main>
      )}

      <footer style={{ borderTop: "1px solid var(--line)", padding: "18px 22px", fontSize: 11, color: "var(--text-faint)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <span>terrafeed · open data, no tracking, no ads · built with Claude Fable 5</span>
        <span style={{ fontFamily: "var(--mono)" }}>
          Sources: GDELT Project · World Bank Open Data · FRED · Open-Meteo
        </span>
      </footer>
    </div>
  );
}
