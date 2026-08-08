<script>
  import { onMount } from 'svelte'
  import GlobalBar from './lib/components/layout/GlobalBar.svelte'
  import FilterRail from './lib/components/layout/FilterRail.svelte'
  import MainTabs from './lib/components/layout/MainTabs.svelte'
  import Overview from './lib/views/Overview.svelte'
  import CompositionTrends from './lib/views/CompositionTrends.svelte'
  import Geography from './lib/views/Geography.svelte'
  import Segments from './lib/views/Segments.svelte'
  import Products from './lib/views/Products.svelte'
  import EngagementOpportunities from './lib/views/EngagementOpportunities.svelte'
  import Button from './lib/components/ui/Button.svelte'
  import { loadRevenueData } from './lib/data/loadData.js'
  import { createDefaultFilters, applyFilters } from './lib/utils/filters.js'
  import { computeSummary } from './lib/utils/aggregations.js'
  import { formatCurrency, formatNumber, formatMonth } from './lib/utils/formatting.js'
  import { STREAM_BY_KEY } from './lib/data/schema.js'

  let rows = $state([])
  let meta = $state(null)
  let loadError = $state(null)
  let loading = $state(true)
  let loadStage = $state('Starting…')
  let filters = $state(createDefaultFilters())
  let selectedTab = $state('overview')
  let focused = $state(null)
  let railCollapsed = $state(false)
  let showQuality = $state(false)
  let suggestions = $state([])
  let chipsOffset = $state(0)

  let filteredRows = $derived(
    applyFilters(rows, filters, {
      maxMonthTs: meta?.maxMonthTs,
      activeAccountIds: meta?.activeAccountIds,
    }),
  )
  let summary = $derived(computeSummary(filteredRows))

  onMount(() => {
    loadRevenueData((stage) => {
      loadStage = stage
    })
      .then((result) => {
        rows = result.rows
        meta = result.meta
        loading = false
      })
      .catch((err) => {
        loadError = err?.message || String(err)
        loading = false
      })
  })

  function patchFilters(patch) {
    filters = { ...filters, ...patch }
    // Suggested next views
    const next = []
    if (patch.geoMode === 'country' || patch.countries?.length) {
      next.push({ id: 'geography', label: 'Explore Geography' })
      next.push({ id: 'products', label: 'See Products' })
    } else if (patch.entityType && patch.entityType !== 'all') {
      next.push({ id: 'segments', label: 'Open Segments' })
      next.push({ id: 'engagement', label: 'Engagement gaps' })
    } else if (patch.ageBands?.length) {
      next.push({ id: 'segments', label: 'Cross-tab Segments' })
      next.push({ id: 'products', label: 'Product mix' })
    } else if (patch.accountQuery || patch.pinnedAccounts?.length) {
      next.push({ id: 'overview', label: 'Overview for account' })
      next.push({ id: 'composition', label: 'Stream mix' })
    }
    suggestions = next
  }

  function resetAll() {
    filters = createDefaultFilters()
    focused = null
    suggestions = []
  }

  let filterChips = $derived(
    [
      filters.entityType !== 'all',
      filters.geoMode !== 'all',
      filters.ageBands.length > 0,
      filters.tenureRange[0] > 1 || filters.tenureRange[1] < 24,
      filters.multiStreamRange[0] > 0 || filters.multiStreamRange[1] < 9,
      Object.values(filters.streamPresence).some(Boolean),
      filters.activeOnly,
      !!filters.accountQuery,
      filters.pinnedAccounts?.length > 0,
      !!(filters.timeRange.start || filters.timeRange.end),
      filters.compareEnabled,
    ].filter(Boolean).length,
  )
  let topPad = $derived(
    `calc(var(--bar-height) + ${filterChips ? '36px' : '0px'})`,
  )
</script>

{#if loading}
  <div class="flex min-h-svh flex-col items-center justify-center gap-3 bg-[var(--bg)]">
    <div class="text-lg font-semibold text-[var(--text-h)]">Revenue Analysis</div>
    <div class="h-1.5 w-48 overflow-hidden rounded-full bg-[var(--bg-muted)]">
      <div class="h-full w-1/2 animate-pulse rounded-full bg-[var(--accent)]"></div>
    </div>
    <div class="text-sm text-[var(--text-muted)]">{loadStage}</div>
  </div>
{:else if loadError}
  <div class="flex min-h-svh flex-col items-center justify-center gap-2 px-6 text-center">
    <h1 class="text-lg font-semibold text-[var(--negative)]">Failed to load data</h1>
    <p class="text-sm text-[var(--text-muted)]">{loadError}</p>
  </div>
{:else}
  <GlobalBar
    bind:filters
    {meta}
    railCollapsed={railCollapsed}
    onToggleRail={() => (railCollapsed = !railCollapsed)}
    onReset={resetAll}
    onShowQuality={() => (showQuality = true)}
  />

  <FilterRail
    bind:filters
    {summary}
    countries={meta?.countries || []}
    collapsed={railCollapsed}
  />

  <main
    class="min-h-svh"
    style="margin-left: {railCollapsed ? '0' : 'var(--rail-width)'}; padding-top: {topPad}"
  >
    <div>
      <MainTabs
        bind:selected={selectedTab}
        {suggestions}
        onSuggestion={(s) => {
          selectedTab = s.id
          suggestions = []
        }}
      />
      <div class="p-4">
        {#if selectedTab === 'overview'}
          <Overview rows={filteredRows} onFilterPatch={patchFilters} {focused} />
        {:else if selectedTab === 'composition'}
          <CompositionTrends rows={filteredRows} allRows={rows} {filters} {meta} />
        {:else if selectedTab === 'geography'}
          <Geography rows={filteredRows} onFilterPatch={patchFilters} />
        {:else if selectedTab === 'segments'}
          <Segments rows={filteredRows} onFilterPatch={patchFilters} />
        {:else if selectedTab === 'products'}
          <Products rows={filteredRows} onFilterPatch={patchFilters} />
        {:else if selectedTab === 'engagement'}
          <EngagementOpportunities rows={filteredRows} {meta} />
        {/if}
      </div>
    </div>
  </main>

  {#if showQuality && meta}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div class="card max-h-[85vh] w-full max-w-lg overflow-y-auto p-5">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-base font-semibold text-[var(--text-h)]">Data quality summary</h2>
          <Button variant="ghost" size="sm" onclick={() => (showQuality = false)}>Close</Button>
        </div>
        <dl class="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt class="text-xs text-[var(--text-muted)]">Rows</dt>
            <dd class="mono font-semibold">{formatNumber(meta.rowCount)}</dd>
          </div>
          <div>
            <dt class="text-xs text-[var(--text-muted)]">Unique accounts</dt>
            <dd class="mono font-semibold">{formatNumber(meta.uniqueAccounts)}</dd>
          </div>
          <div>
            <dt class="text-xs text-[var(--text-muted)]">Missing DOB (individuals)</dt>
            <dd class="mono font-semibold">{formatNumber(meta.missingDobIndividual)}</dd>
          </div>
          <div>
            <dt class="text-xs text-[var(--text-muted)]">Missing DOB (legal)</dt>
            <dd class="mono font-semibold">{formatNumber(meta.missingDobLegal)}</dd>
          </div>
          <div>
            <dt class="text-xs text-[var(--text-muted)]">Month range</dt>
            <dd class="mono text-xs font-semibold">
              {formatMonth(meta.minMonthTs)} – {formatMonth(meta.maxMonthTs)}
            </dd>
          </div>
        </dl>
        <h3 class="mt-4 mb-2 text-xs font-semibold uppercase text-[var(--text-muted)]">
          Negative values by stream
        </h3>
        <table class="w-full text-xs">
          <thead>
            <tr class="text-left text-[var(--text-muted)]">
              <th class="py-1">Stream</th>
              <th class="text-right">Count</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {#each Object.entries(meta.negativeByStream) as [key, v]}
              <tr class="border-t border-[var(--border)]">
                <td class="py-1">{STREAM_BY_KEY[key]?.label || key}</td>
                <td class="mono text-right">{formatNumber(v.count)}</td>
                <td class="mono text-right text-[var(--negative)]">{formatCurrency(v.amount)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
        <h3 class="mt-4 mb-2 text-xs font-semibold uppercase text-[var(--text-muted)]">
          Months observed per account
        </h3>
        <div class="flex flex-wrap gap-2 text-xs">
          {#each meta.monthsObserved as m}
            <span class="rounded bg-[var(--bg-muted)] px-2 py-1 mono">
              {m.months} mo: {formatNumber(m.accounts)}
            </span>
          {/each}
        </div>
      </div>
    </div>
  {/if}
{/if}
