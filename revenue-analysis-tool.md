**Revenue Analysis Tool**  
**Authoritative Functional & UI/UX Specification**  
**Version 1.0**

This document defines the data, calculations, analytical capabilities, information architecture, visual design system, interaction model, and user experience of a single-page web application.

### 1. Purpose
The tool enables product managers and analysts to perform deep, interactive analysis of a static longitudinal revenue dataset. It surfaces revenue composition, temporal patterns, geographic and demographic differences, account-type economics, concentration, volatility, correlations, engagement, product performance, and opportunity gaps.

### 2. Dataset Schema and Explicit Assumptions
**Input columns**  
- `account_id`  
- `date_of_birth` (string, e.g. “Jul 18, 1969”; may be blank)  
- `country_of_tax_residence`  
- `is_legal_entity` (TRUE / FALSE)  
- `account_total_revenue`  
- `trade_month` (string, e.g. “May 1, 2023”)  
- `trade_month_total`  
- `retail_stock_pfof_revenue`  
- `margin_interest_revenue`  
- `non_retail_revenue`  
- `market_data_revenue`  
- `stock_borrow_revenue`  
- `crypto_wallet_revenue`  
- `cash_interest_revenue`  
- `retail_options_pfof_revenue`  
- `fdic_sweep_alpaca_revenue`

**Assumptions applied uniformly**  
- `crypto_wallet_revenue` represents revenue from crypto-related fee activities.  
- Negative values in any revenue column are reductions or adjustments and are included in all calculations exactly as provided.  
- `non_retail_revenue` is independent and can appear on both individual and legal-entity accounts.  
- `fdic_sweep_alpaca_revenue` and `cash_interest_revenue` are independent streams.  
- A small number of individual accounts may lack `date_of_birth`; a small number of legal-entity accounts may contain one. These records are retained. Age metrics place records without a valid date of birth into an “Unknown” band.  
- An account is active in a given month if it has a row for that `trade_month`.  
- Currently active accounts = all accounts that have a row for the most recent `trade_month` in the dataset.  
- Stock-based revenue = `margin_interest_revenue` + `cash_interest_revenue` + `fdic_sweep_alpaca_revenue` + `stock_borrow_revenue`.  
- Flow-based revenue = `retail_stock_pfof_revenue` + `retail_options_pfof_revenue` + `non_retail_revenue` + `market_data_revenue` + `crypto_wallet_revenue`.  
- Age = calendar year of `trade_month` minus year of `date_of_birth`.  
- Tenure = number of distinct `trade_month` values observed for the `account_id`.  
- Multi-stream count (month) = number of the eight revenue-stream columns with a non-zero value.  
- Primary revenue source (month) = the stream with the largest absolute value (ties recorded as “Multiple”).

### 3. Derived Fields
On load the tool computes and stores:  
- Parsed `trade_month` date  
- Age and age band (<25, 25–34, 35–44, 45–54, 55–64, 65+, Unknown)  
- Tenure  
- First and last observed `trade_month`  
- USA / non-USA flag and region roll-up (North America, Europe, Latin America, Middle East & Africa, Asia-Pacific, Other)  
- Stock-based total and flow-based total for every row  
- Multi-stream count and primary source for every row  
- Cumulative revenue to date per account  
- Negative-value presence flag per row

A data-quality summary is always available showing row count, unique accounts, missing date-of-birth counts by entity type, negative-value frequency and magnitude by stream, and distribution of months observed per account.

### 4. Application Architecture – Single-Page Web App
The tool is a single-page application with three persistent regions:

**Top Global Bar (fixed)**  
- Left: Tool title “Revenue Analysis”  
- Center: Time-range control (presets + custom range + side-by-side period comparison toggle)  
- Right: Account search by `account_id`, live filter-summary chips, Reset All button

**Left Filter Rail (collapsible, 280 px)**  
- Entity type (Individual / Legal Entity / All)  
- Geography (USA / Non-USA / Region / multi-select Country)  
- Age band  
- Tenure range slider  
- Multi-stream count range  
- Stream-presence checkboxes (one per revenue stream)  
- “Active accounts only” toggle (most recent month)  
- Live summary at top of rail: “X accounts · $Y revenue”

**Main Content Area**  
Horizontal primary tabs:  
1. Overview  
2. Composition & Trends  
3. Geography  
4. Segments  
5. Products  
6. Engagement & Opportunities  

All views are fully reactive to the global filter state and time range. Clicking any country, segment, stream, or account updates every visible chart and table and applies consistent visual highlighting.

### 5. Visual Design System
- Stock-based streams: cool blues / teals  
- Flow-based streams: warm oranges / ambers  
- Negative values: muted red, always accompanied by a legend  
- Legal-entity records: distinct border or shape treatment  
- Consistent color, typography, spacing, and card elevation across the application  
- Rich but scannable tooltips (value, share of total, rank, current filter context)  
- Empty and zero-filter states contain explicit guidance text

### 6. Primary Modes – Detailed Specification

**6.1 Overview (default landing view)**  
**Insight Strip (top)** – five fixed cards:  
- Total revenue and period growth  
- Stock-based vs Flow-based split with sparkline  
- USA vs Non-USA revenue and growth  
- Legal-entity contribution (account count, revenue share, ARPA multiple)  
- Highest-concentration call-out (country or account)  

**Main body**  
- Dual-axis time series: total revenue + number of active accounts  
- Stacked area chart of the eight streams (stock/flow color grouping)  
- Compact Pareto bars for accounts and for countries  

Every card and chart element supports a “Focus on this segment” action that sets the corresponding global filters.

**6.2 Composition & Trends**  
- Primary view: stacked area or horizontal stacked bar of the eight streams with stock/flow grouping toggle  
- Growth-attribution waterfall between any two selected periods  
- Multi-stream count distribution histogram  
- Expandable sections (progressive disclosure):  
  – Primary-source transition matrix  
  – Negative-value impact table (count, total amount, % of revenue affected) by stream and segment

**6.3 Geography**  
- Top comparison cards: USA vs Non-USA (revenue, ARPA, stock/flow mix, multi-stream intensity, active rate)  
- Interactive treemap or ranked bar of countries (size = revenue, color = ARPA or growth)  
- Selecting any country opens a persistent right-hand detail panel showing that country’s stream composition, monthly trend, and entity-type split  
- Always-visible concentration metrics: top-5 and top-10 country share, country-level Gini coefficient

**6.4 Segments**  
- Primary control: two-dimensional cross-tab builder (rows and columns selectable from entity type, age band, geography, tenure band)  
- Result rendered as a heatmap of the chosen metric (revenue, ARPA, or multi-stream count)  
- Clicking any cell sets the global filters to that intersection  
- Right-hand panel shows the detailed eight-stream breakdown for the current selection

**6.5 Products**  
- Horizontal row of eight product cards (one per revenue stream)  
- Each card displays: total contribution, penetration rate, average value among users with non-zero activity, monthly sparkline, and top contributing segment  
- Quantitative status indicator on each card (Growing / Flat / Weak) derived from penetration and trend slope  
- Clicking a card expands it into a full workspace containing:  
  – Penetration and average value by geography, entity type, and age band  
  – Correlation with each of the other seven streams  
  – Ranked country and age-band tables

**6.6 Engagement & Opportunities**  
**Left half – Engagement**  
- Tenure distribution  
- Active-account rate trend  
- Cohort retention curves (cohort definable by first observed month, age band, country, or entity type)  

**Right half – Opportunity Gaps**  
- Matrix: rows = key segments (default emphasis on non-USA individuals), columns = secondary streams  
- Cell color encodes penetration gap versus a user-selectable benchmark (default: USA individuals)  
- Hover or click reveals the arithmetic incremental-revenue estimate  
- Ranked “Largest opportunities” list above the matrix

### 7. Interaction Principles
- Single source of filter truth: every control updates the entire interface instantly.  
- Linked highlighting and brushing: selecting a time range, country, segment, or stream propagates everywhere.  
- Progressive disclosure: high-signal summaries first; dense tables, matrices, and detail panels appear only on explicit expansion or selection.  
- Suggested-next-view chips appear after major filter changes to guide exploration.  
- All charts support brush-to-filter on time axes.  
- Account search pins selected accounts for persistent comparison across modes.