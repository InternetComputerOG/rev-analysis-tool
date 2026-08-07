# Revenue Analysis

Interactive single-page tool for deep analysis of a static longitudinal revenue dataset. Built for product managers and analysts to explore revenue composition, geography, segments, product performance, engagement, and opportunity gaps.

## Stack

- **Vite** + **Svelte 5** (runes & snippets)
- **Tailwind CSS 4**
- **LayerChart 2** for visualizations
- **PapaParse** (CSV), **date-fns**, **@lucide/svelte**
- Static hosting on **Cloudflare Pages** (no backend)

## Specs

- [Functional & UI/UX specification](./revenue-analysis-tool.md)
- [Technical implementation specification](./technical-implementation-specification.md)

## Dataset

Place the revenue CSV at [`public/revenue-data.csv`](./public/revenue-data.csv) (already included). Vite serves it at `/revenue-data.csv`. The file is ~17 MB and under Cloudflare Pages’ 25 MiB per-file free-tier limit.

## Local development

```bash
npm install
npm run dev
```

Open the URL Vite prints (typically `http://localhost:5173`). On first load the app parses and enriches ~170k rows in the browser (worker parse + main-thread enrichment).

## Build

```bash
npm run build
npm run preview
```

Output is a pure static site in `dist/` (including the CSV).

## Deploy (Cloudflare Pages)

1. Push this repository to GitHub.
2. In Cloudflare Pages, create a project connected to the repo.
3. Build settings:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Every push to `main` triggers a global CDN deploy.

No R2, Workers, or environment variables are required.

## Usage notes

- All filters live in one global state; every view reacts instantly.
- Use **Focus on this segment** actions and chart clicks to drill into the data.
- Enable **Compare** in the top bar for period-over-period waterfall attribution.
- Open the info icon in the top bar for the data-quality summary (missing DOB, negatives, tenure distribution).

## Non-goals

No TypeScript, SvelteKit/SSR, backend, authentication, test suites, PWA, or i18n — this is a bare-bones analytical showcase.
