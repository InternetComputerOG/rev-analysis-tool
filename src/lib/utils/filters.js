/**
 * Global filter defaults and pure applyFilters.
 */

export function createDefaultFilters() {
  return {
    entityType: 'all', // all | individual | legal
    geoMode: 'all', // all | usa | non_usa | region | country
    regions: [],
    countries: [],
    ageBands: [],
    tenureRange: [1, 24],
    multiStreamRange: [0, 9],
    streamPresence: {
      retail_stock_pfof_revenue: false,
      retail_options_pfof_revenue: false,
      non_retail_revenue: false,
      market_data_revenue: false,
      crypto_wallet_revenue: false,
      margin_interest_revenue: false,
      cash_interest_revenue: false,
      fdic_sweep_alpaca_revenue: false,
      stock_borrow_revenue: false,
    },
    activeOnly: false,
    timeRange: { start: null, end: null },
    compareEnabled: false,
    compareRange: { start: null, end: null },
    accountQuery: '',
    pinnedAccounts: [],
  }
}

/**
 * @param {object[]} rows
 * @param {ReturnType<typeof createDefaultFilters>} filters
 * @param {{ maxMonthTs?: number }} [ctx]
 */
export function applyFilters(rows, filters, ctx = {}) {
  const {
    entityType,
    geoMode,
    regions,
    countries,
    ageBands,
    tenureRange,
    multiStreamRange,
    streamPresence,
    activeOnly,
    timeRange,
    accountQuery,
    pinnedAccounts,
  } = filters

  const regionSet = regions?.length ? new Set(regions) : null
  const countrySet = countries?.length ? new Set(countries) : null
  const ageSet = ageBands?.length ? new Set(ageBands) : null
  const q = (accountQuery || '').trim().toLowerCase()
  const pinned = pinnedAccounts?.length ? new Set(pinnedAccounts) : null
  const presenceKeys = Object.entries(streamPresence || {})
    .filter(([, on]) => on)
    .map(([k]) => k)
  const maxMonthTs = ctx.maxMonthTs

  return rows.filter((row) => {
    if (pinned && pinned.size > 0) {
      if (!pinned.has(row.account_id)) return false
    } else if (q) {
      if (!String(row.account_id).toLowerCase().includes(q)) return false
    }

    if (entityType === 'individual' && row.is_legal_entity) return false
    if (entityType === 'legal' && !row.is_legal_entity) return false

    if (geoMode === 'usa' && !row.isUsa) return false
    if (geoMode === 'non_usa' && row.isUsa) return false
    if (geoMode === 'region' && regionSet) {
      if (!regionSet.has(row.region)) return false
    }
    if (geoMode === 'country' && countrySet) {
      if (!countrySet.has(row.country_of_tax_residence)) return false
    }

    if (ageSet && !ageSet.has(row.ageBand)) return false

    if (row.tenure < tenureRange[0] || row.tenure > tenureRange[1]) return false
    if (row.multiStreamCount < multiStreamRange[0] || row.multiStreamCount > multiStreamRange[1]) {
      return false
    }

    for (const key of presenceKeys) {
      if ((row[key] || 0) === 0) return false
    }

    if (activeOnly && maxMonthTs != null && row.tradeMonthTs !== maxMonthTs) return false

    if (timeRange?.start != null && row.tradeMonthTs < timeRange.start) return false
    if (timeRange?.end != null && row.tradeMonthTs > timeRange.end) return false

    return true
  })
}

/** Apply filters but force a specific time window (for compare periods). */
export function applyFiltersWithTime(rows, filters, timeRange, ctx = {}) {
  return applyFilters(rows, { ...filters, timeRange, activeOnly: false }, ctx)
}

export function describeFilters(filters) {
  const chips = []
  if (filters.entityType === 'individual') chips.push({ id: 'entity', label: 'Individuals' })
  if (filters.entityType === 'legal') chips.push({ id: 'entity', label: 'Legal entities' })
  if (filters.geoMode === 'usa') chips.push({ id: 'geo', label: 'USA' })
  if (filters.geoMode === 'non_usa') chips.push({ id: 'geo', label: 'Non-USA' })
  if (filters.geoMode === 'region' && filters.regions.length) {
    chips.push({ id: 'geo', label: `Regions: ${filters.regions.join(', ')}` })
  }
  if (filters.geoMode === 'country' && filters.countries.length) {
    chips.push({
      id: 'geo',
      label:
        filters.countries.length <= 3
          ? filters.countries.join(', ')
          : `${filters.countries.length} countries`,
    })
  }
  if (filters.ageBands.length) {
    chips.push({ id: 'age', label: `Age: ${filters.ageBands.join(', ')}` })
  }
  if (filters.tenureRange[0] > 1 || filters.tenureRange[1] < 24) {
    chips.push({
      id: 'tenure',
      label: `Tenure ${filters.tenureRange[0]}–${filters.tenureRange[1]}`,
    })
  }
  if (filters.multiStreamRange[0] > 0 || filters.multiStreamRange[1] < 9) {
    chips.push({
      id: 'multi',
      label: `Streams ${filters.multiStreamRange[0]}–${filters.multiStreamRange[1]}`,
    })
  }
  const presence = Object.entries(filters.streamPresence || {})
    .filter(([, v]) => v)
    .map(([k]) => k)
  if (presence.length) {
    chips.push({ id: 'presence', label: `${presence.length} stream filter(s)` })
  }
  if (filters.activeOnly) chips.push({ id: 'active', label: 'Active only' })
  if (filters.accountQuery) chips.push({ id: 'search', label: `Search: ${filters.accountQuery}` })
  if (filters.pinnedAccounts?.length) {
    chips.push({ id: 'pinned', label: `${filters.pinnedAccounts.length} pinned` })
  }
  if (filters.timeRange?.start || filters.timeRange?.end) {
    chips.push({ id: 'time', label: 'Custom time range' })
  }
  if (filters.compareEnabled) chips.push({ id: 'compare', label: 'Comparing periods' })
  return chips
}
