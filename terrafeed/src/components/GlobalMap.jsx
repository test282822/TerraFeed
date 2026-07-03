import { useState, useEffect, useRef, useMemo } from "react";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";

const WORLD_TOPO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export default function GlobalMap({ points, onSelectPoint, selectedPoint }) {
  const [world, setWorld] = useState(null);
  const [dims, setDims] = useState({ w: 960, h: 500 });
  const [hovered, setHovered] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    fetch(WORLD_TOPO_URL)
      .then(r => r.json())
      .then(topo => setWorld(feature(topo, topo.objects.countries)))
      .catch(() => setWorld(null));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width;
      setDims({ w, h: Math.max(380, w * 0.52) });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const projection = useMemo(
    () => geoNaturalEarth1().fitSize([dims.w, dims.h], { type: "Sphere" }),
    [dims]
  );
  const path = useMemo(() => geoPath(projection), [projection]);

  // Project points and scale radius by article count
  const projected = useMemo(() => {
    if (!points) return [];
    const maxCount = Math.max(1, ...points.map(p => p.count));
    return points
      .map(p => {
        const xy = projection([p.lon, p.lat]);
        if (!xy) return null;
        return { ...p, x: xy[0], y: xy[1], r: 2 + Math.sqrt(p.count / maxCount) * 9 };
      })
      .filter(Boolean);
  }, [points, projection]);

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      <svg width={dims.w} height={dims.h} style={{ display: "block" }}>
        <defs>
          <radialGradient id="dotGlow">
            <stop offset="0%" stopColor="var(--amber)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="var(--amber)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ocean */}
        <rect width={dims.w} height={dims.h} fill="#060A0F" />

        {/* Countries */}
        {world &&
          world.features.map((f, i) => (
            <path key={i} d={path(f)} fill="#0E1621" stroke="#1A2532" strokeWidth={0.5} />
          ))}

        {/* Graticule feel: subtle sphere outline */}
        <path d={path({ type: "Sphere" })} fill="none" stroke="#1A2532" strokeWidth={1} />

        {/* Event points */}
        {projected.map((p, i) => {
          const isSelected = selectedPoint && selectedPoint.name === p.name;
          const isHovered = hovered === i;
          return (
            <g key={i} style={{ cursor: "pointer" }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelectPoint(p)}>
              {/* glow */}
              <circle cx={p.x} cy={p.y} r={p.r * 2.4} fill="url(#dotGlow)" opacity={isSelected || isHovered ? 0.85 : 0.35} />
              {/* core */}
              <circle cx={p.x} cy={p.y} r={p.r} fill="var(--amber)"
                opacity={isSelected || isHovered ? 1 : 0.75}
                stroke={isSelected ? "#fff" : "none"} strokeWidth={1.2} />
            </g>
          );
        })}
      </svg>

      {/* Hover tooltip */}
      {hovered !== null && projected[hovered] && (
        <div style={{
          position: "absolute",
          left: Math.min(projected[hovered].x + 14, dims.w - 220),
          top: Math.max(projected[hovered].y - 14, 8),
          background: "var(--bg-raise)",
          border: "1px solid var(--line-bright)",
          borderRadius: 6,
          padding: "8px 12px",
          fontSize: 12,
          pointerEvents: "none",
          maxWidth: 220,
          zIndex: 5,
        }}>
          <div style={{ fontWeight: 600, marginBottom: 2 }}>{projected[hovered].name}</div>
          <div style={{ color: "var(--text-dim)", fontSize: 11 }}>
            {projected[hovered].count} article{projected[hovered].count !== 1 ? "s" : ""} · click for details
          </div>
        </div>
      )}

      {!world && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-faint)", fontSize: 13 }}>
          Loading map…
        </div>
      )}
    </div>
  );
}
