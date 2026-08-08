# Revenue Analysis

Interactive single-page tool for deep analysis of a static longitudinal revenue dataset. Built for product managers and analysts to explore revenue composition, geography, segments, product performance, engagement, and opportunity gaps.

## Stack

- **Vite** + **Svelte 5** (runes & snippets)
- **Tailwind CSS 4**
- **LayerChart 2** for visualizations
- **PapaParse** (CSV), **date-fns**, **@lucide/svelte**
- Static hosting on **Cloudflare** (Workers static assets; no backend)

## Specs

- [Functional & UI/UX specification](./revenue-analysis-tool.md)
- [Technical implementation specification](./technical-implementation-specification.md)

## Dataset

The revenue CSV is **not** stored in this repository. Place it locally at `public/revenue-data.csv` before running `dev`, `build`, or `deploy`. Vite serves it at `/revenue-data.csv`. The file is ~17 MB and under Cloudflare’s 25 MiB per-file free-tier limit.

## Local development

```bash
npm install
# Ensure public/revenue-data.csv is present
npm run dev
```

Open the URL Vite prints (typically `http://localhost:5173`). On first load the app parses and enriches ~170k rows in the browser (worker parse + main-thread enrichment).

## Build

```bash
npm run build
npm run preview
```

Output is a pure static site in `dist/` (including the CSV when present locally).

## Deploy (Wrangler)

Deploy from a machine that has `public/revenue-data.csv` locally:

```bash
npm run deploy
```

This runs `vite build` then `wrangler deploy`. Do **not** connect Cloudflare Pages to GitHub auto-builds for this repo — the CSV is gitignored and would be missing from a remote build.

No R2 or environment variables are required.

## Usage notes

- All filters live in one global state; every view reacts instantly.
- Use **Focus on this segment** actions and chart clicks to drill into the data.
- Enable **Compare** in the top bar for period-over-period waterfall attribution.
- Open the info icon in the top bar for the data-quality summary (missing DOB, negatives, tenure distribution).

## Non-goals

No TypeScript, SvelteKit/SSR, backend, authentication, test suites, PWA, or i18n — this is a bare-bones analytical showcase.
