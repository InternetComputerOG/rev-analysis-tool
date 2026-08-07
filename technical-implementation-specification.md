**Revenue Analysis Tool**  
**Technical Implementation Specification**  
**Version 1.0**  

This document fully defines the technology stack, project structure, data handling, visualization approach, state management, styling, build, and deployment for a bare-bones single-page showcase application that implements the functional & UI/UX specification.

### 1. Core Technology Stack

| Concern              | Technology                          | Version / Constraint                  |
|----------------------|-------------------------------------|---------------------------------------|
| Project scaffolding  | Vite                                | Latest stable (create-vite template) |
| UI framework         | Svelte                              | 5.x (runes & snippets only)          |
| Language             | JavaScript                          | ES modules, no TypeScript            |
| Styling              | Tailwind CSS                        | 4.x                                  |
| Charting library     | LayerChart                          | 2.x (Svelte 5 native)                |
| CSV parsing          | PapaParse                           | Latest                               |
| Date utilities       | date-fns                            | Latest                               |
| Icons                | lucide-svelte                       | Latest                               |
| Hosting & delivery   | Cloudflare Pages                    | Free tier                            |
| Source control       | GitHub                              | _                                    |
| Package manager      | npm                                 | —                                    |

No other frameworks, libraries, or services should be necessary. There is no backend, no database, no server-side rendering, no API routes, and no authentication.

### 2. Project Structure

Final directory layout:

```
rev-analysis-tool/
├── public/
│   └── revenue-data.csv          # 170,333 rows, 16,783 KB (exact file provided by user)
├── src/
│   ├── lib/
│   │   ├── data/
│   │   │   ├── loadData.js       # PapaParse + derived-field computation
│   │   │   └── schema.js         # Column constants & derived-field helpers
│   │   ├── stores/               # (empty – Svelte 5 runes only; no external stores)
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── GlobalBar.svelte
│   │   │   │   ├── FilterRail.svelte
│   │   │   │   └── MainTabs.svelte
│   │   │   ├── charts/           # LayerChart wrappers
│   │   │   ├── cards/
│   │   │   └── ui/               # buttons, chips, tooltips, empty states
│   │   ├── views/
│   │   │   ├── Overview.svelte
│   │   │   ├── CompositionTrends.svelte
│   │   │   ├── Geography.svelte
│   │   │   ├── Segments.svelte
│   │   │   ├── Products.svelte
│   │   │   └── EngagementOpportunities.svelte
│   │   └── utils/
│   │       ├── filters.js
│   │       ├── aggregations.js
│   │       └── formatting.js
│   ├── App.svelte                # Root: global filter state + three regions
│   ├── main.js
│   └── app.css                   # Tailwind + LayerChart CSS variables
├── index.html
├── vite.config.js
├── package.json
├── tailwind.config.js            # (minimal – Tailwind 4 uses CSS-first)
├── revenue-analysis-tool.md         # The primary product definition. Specifies functionality as well as UI/UX
├── technical-implementation-specification  # The primary technical implimentation specification for guiding development.
└── README.md                               # A standard project description and usage README for the public repository, meant for helping 3rd parties understand what the application is and how they could use it.
```

The file `public/revenue-data.csv` is the single source of truth for the entire dataset. Vite serves it at the absolute path `/revenue-data.csv`.

### 3. Data Loading & Derived Fields

- On application start, `src/lib/data/loadData.js` fetches `/revenue-data.csv`.
- PapaParse is configured with:
  - `header: true`
  - `dynamicTyping: true`
  - `skipEmptyLines: true`
  - `worker: true` (keeps the main thread responsive during the ~17 MB parse)
  - `complete` callback receives the full array of 170 333 row objects.
- Immediately after parsing, a single synchronous pass computes and attaches every derived field defined in the functional specification:
  - Parsed `trade_month` (Date)
  - Age and age band (`<25`, `25–34`, `35–44`, `45–54`, `55–64`, `65+`, `Unknown`)
  - Tenure (distinct trade months per account)
  - First / last observed trade month
  - USA / non-USA flag and region roll-up
  - Stock-based total and flow-based total
  - Multi-stream count and primary source
  - Cumulative revenue to date
  - Negative-value presence flag
- The resulting enriched array is stored once in a top-level Svelte 5 `$state` variable inside `App.svelte` and never mutated in place. All subsequent filtering produces new derived views via `$derived`.

Memory footprint after enrichment is acceptable for a modern browser; no further streaming or virtualization of the raw data is required.

### 4. State Management & Reactivity

All state lives inside `App.svelte` using Svelte 5 runes exclusively:

- `$state` for:
  - raw enriched data
  - global filter object (entity type, geography, age band, tenure range, multi-stream range, stream-presence flags, active-only toggle, time range, account search)
  - selected tab
  - pinned accounts
  - focused segment (country / age band / stream / account)
- `$derived` for:
  - filtered dataset
  - every aggregate required by the current view
  - live summary counts and revenue totals shown in the Filter Rail and Global Bar
- Filter changes instantly recompute the filtered view and all downstream charts/tables. There is a single source of truth; no duplicated filter state is allowed in child components.

### 5. Visualization Layer (LayerChart)

LayerChart 2.x is the sole charting library. All visualizations are built from its composable primitives and high-level charts:

- Dual-axis time series → `LineChart` / `AreaChart` + secondary axis
- Stacked area of eight revenue streams → `AreaChart` with `seriesLayout="stack"` and stock/flow color grouping
- Pareto bars → `BarChart` sorted descending
- Growth-attribution waterfall → custom LayerChart composition using `Bar` + baseline offsets
- Multi-stream histogram → `BarChart`
- Country treemap → `Treemap` from `layerchart/hierarchy`
- Heatmap (Segments view) → custom LayerChart grid of colored `Rect`s
- Sparklines → compact `LineChart` / `AreaChart` with no axes
- Cohort retention curves → multi-series `LineChart`
- Opportunity matrix → custom LayerChart heatmap
- All tooltips, brushing, highlighting, and linked selection use LayerChart’s built-in `Tooltip`, `Highlight`, and brush contexts.

Color system (hard-coded in CSS variables and passed to LayerChart):

- Stock-based streams → cool blues / teals
- Flow-based streams → warm oranges / ambers
- Negative values → muted red
- Legal-entity records → distinct stroke / border treatment

### 6. Layout & Interaction Model

`App.svelte` renders three persistent regions exactly as specified:

1. **Top Global Bar** (fixed) – title, time-range control (presets + custom + comparison toggle), account search, live filter chips, Reset All.
2. **Left Filter Rail** (collapsible, 280 px) – all filters listed in the functional spec + live “X accounts · $Y revenue” summary.
3. **Main Content Area** – horizontal primary tabs that switch among the six views. Each view is a separate Svelte component that receives the current filtered data and focused segment as props and reacts via `$derived`.

All “Focus on this segment” actions write into the single global filter state, causing every chart and table to update. Brush-to-filter on time axes is implemented with LayerChart’s brush context.

### 7. Styling

- Tailwind CSS 4 is configured via the official Vite plugin.
- `src/app.css` contains:
  - `@import "tailwindcss";`
  - LayerChart CSS variable overrides for the stock/flow/negative palette
  - Global typography, spacing, and card elevation tokens that match the visual design system.
- No other CSS frameworks or component libraries are used. All UI primitives (buttons, chips, cards, empty states) are hand-written Svelte components styled with Tailwind utility classes.

### 8. Build & Deployment

- `vite.config.js` uses the default Svelte plugin and the Tailwind Vite plugin. No additional plugins.
- `npm run build` produces a pure static site in `dist/`.
- The entire `dist/` folder (including the 16.8 MB CSV) is deployed to Cloudflare Pages.
- Cloudflare Pages is connected directly to the GitHub repository. Every push to `main` triggers an automatic build and global CDN deployment.
- The 16.8 MB CSV is under the 25 MiB per-file limit of Cloudflare Pages Free; no R2 or external storage is required.

### 9. Performance Constraints

- Initial CSV parse + enrichment occurs once on load and is non-blocking (worker).
- All subsequent filter/aggregate operations run against the in-memory array using plain JavaScript (`filter`, `reduce`, `Map` groupings). No additional data libraries are introduced.
- Charts receive only the aggregated series required for the current view; the full 170 k-row array is never passed to LayerChart.
- Empty and zero-filter states display explicit guidance text as required by the functional specification.

### 10. Non-Goals (Explicitly Excluded)

- TypeScript
- SvelteKit / SSR / adapters
- Any backend, API, or database
- Authentication or user accounts
- Unit / E2E test suites (showcase only)
- Progressive Web App features
- Dark-mode toggle beyond the fixed design-system palette
- Internationalization