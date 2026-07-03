# terrafeed — global food signal

Live global food-security tracker: worldwide news signal map, price indicators, and a local food stability advisor. Built on open data. No keys required for core features, no tracking, no ads.

## What's live

| Layer | Source | Refresh | Key needed |
|---|---|---|---|
| Global signal map | GDELT GEO 2.0 (FOOD_SECURITY theme) | 15 min upstream, 30 min cache | No |
| News wire + coverage timeline | GDELT DOC 2.0 | 15 min cache | No |
| Country inflation indicators | World Bank Open Data API | 24 h cache | No |
| US food category CPI detail | FRED | 24 h cache | **Yes — free** |
| Live growing conditions | Open-Meteo | 1 h cache | No |
| Zone crop guidance | Curated (USDA/FAO-informed) | Static | No |

## Architecture

No database, no cron, no maintenance surface. Vite React frontend + Vercel serverless
functions (`/api/*`) that proxy the upstream APIs with edge caching
(`s-maxage` + `stale-while-revalidate`). The cache IS the "agent" — the site polls
sources on demand, Vercel's edge holds results, and every visitor gets fresh-enough
data without hammering the free APIs.

```
browser ── /api/map-events ──> GDELT GEO (30m edge cache)
        ── /api/news ────────> GDELT DOC (15m edge cache)
        ── /api/food-inflation> World Bank (24h edge cache)
        ── /api/fred ────────> FRED [key server-side] (24h edge cache)
        ── /api/climate ─────> Open-Meteo (1h edge cache)
```

## Deploy

```bash
npm install
npx vercel --prod
```

Optional: for the US CPI detail panel, get a free key at
https://fred.stlouisfed.org/docs/api/api_key.html and add `FRED_API_KEY`
in Vercel → Project → Settings → Environment Variables. Everything else
works with zero configuration.

## Local dev

`npm run dev` runs the frontend only — the `/api` functions need `npx vercel dev`
to run locally, or just deploy and iterate there.

## Honest limitations

- GDELT maps *news coverage* of food security, not ground-truth conditions. Heavy
  coverage ≠ worst conditions (media attention is uneven across regions).
- World Bank inflation is general CPI, annual — a stress indicator, not food-specific.
- Zone guidance is orientation-level, not a substitute for local agricultural extension.
