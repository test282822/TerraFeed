# Contributing to terrafeed

Thanks for your interest. terrafeed is a small, deliberately boring codebase —
that's a feature. Contributions that keep it that way are the easiest to merge.

## Ground rules

- **No new required API keys.** Core features must work keyless. Optional
  key-gated panels (like FRED) are fine if they degrade gracefully.
- **No tracking, no analytics, no ads.** Non-negotiable.
- **Honest data handling.** If a source is a proxy for the thing being shown,
  say so in the UI. If data fails to load, show an honest empty state — never
  stale data presented as fresh. New data layers must be added to the sources
  table on the landing page, including the "what it actually measures" column.
- **No database unless there is no other way.** Edge caching is the state.

## How to contribute

1. Open an issue first for anything bigger than a typo — data-source proposals
   especially, so licensing and rate limits get checked before code is written.
2. Fork, branch from `main`, keep PRs focused on one change.
3. `npm run build` must pass. There is no test suite yet; if you add one,
   you are a hero.

## Good first contributions

- Country-level drill-down on the map
- Additional keyless open-data layers (FAOSTAT, USDA NASS)
- Translations of zone guidance
- Accessibility passes (keyboard nav on the map is imperfect)

## Data source proposals must include

- Link to the API docs and its terms of use
- Whether it's keyless, and rate limits
- What it *actually measures* vs what users might assume it measures
