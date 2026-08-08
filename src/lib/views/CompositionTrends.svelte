<script>
  import StackedStreamArea from '../components/charts/StackedStreamArea.svelte'
  import WaterfallChart from '../components/charts/WaterfallChart.svelte'
  import HistogramBars from '../components/charts/HistogramBars.svelte'
  import Expandable from '../components/ui/Expandable.svelte'
  import EmptyState from '../components/ui/EmptyState.svelte'
  import SectionHeader from '../components/ui/SectionHeader.svelte'
  import {
    monthlySeries,
    multiStreamHistogram,
    growthWaterfall,
    primarySourceTransitions,
    negativeImpact,
    previousEqualWindow,
  } from '../utils/aggregations.js'
  import { applyFiltersWithTime } from '../utils/filters.js'
  import { STREAM_BY_KEY } from '../data/schema.js'
  import { formatCurrency, formatPct, formatNumber, formatMonth } from '../utils/formatting.js'

  let { rows = [], allRows = [], filters, meta = null } = $props()

  let mode = $state('area')
  let groupBy = $state('stream')

  let monthly = $derived(monthlySeries(rows))
  let hist = $derived(multiStreamHistogram(rows))

  let compareRows = $derived.by(() => {
    if (!allRows.length || !meta) return []
    let range = filters.compareRange
    if (!filters.compareEnabled || (!range?.start && !range?.end)) {
      range = previousEqualWindow(filters.timeRange, meta.allMonthTs)
    }
    if (range.start == null && range.end == null) return []
    return applyFiltersWithTime(allRows, { ...filters, compareEnabled: false }, range, {
      maxMonthTs: meta.maxMonthTs,
      activeAccountIds: meta.activeAccountIds,
    })
  })

  let waterfall = $derived(growthWaterfall(rows, compareRows))
  let transitions = $derived(primarySourceTransitions(rows))
  let negatives = $derived(negativeImpact(rows))

  let transitionTable = $derived.by(() => {
    const entries = [...transitions.matrix.entries()]
      .map(([key, count]) => {
        const [from, to] = key.split('|')
        return { from, to, count }
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 25)
    return entries
  })
</script>

{#if !rows.length}
  <EmptyState title="No composition data" message="Adjust filters to analyze stream mix and trends." />
{:else}
  <div class="card p-4">
    <SectionHeader title="Stream composition" subtitle="Toggle layout and stock/flow grouping">
      {#snippet actions()}
        <div class="flex gap-1">
          <button
            type="button"
            class="rounded px-2 py-1 text-xs {mode === 'area' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-muted)]'}"
            onclick={() => (mode = 'area')}>Area</button
          >
          <button
            type="button"
            class="rounded px-2 py-1 text-xs {mode === 'bar' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-muted)]'}"
            onclick={() => (mode = 'bar')}>Bar</button
          >
          <button
            type="button"
            class="rounded px-2 py-1 text-xs {groupBy === 'stream' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-muted)]'}"
            onclick={() => (groupBy = 'stream')}>By stream</button
          >
          <button
            type="button"
            class="rounded px-2 py-1 text-xs {groupBy === 'stockflow' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-muted)]'}"
            onclick={() => (groupBy = 'stockflow')}>Stock / Flow</button
          >
        </div>
      {/snippet}
    </SectionHeader>
    <StackedStreamArea data={monthly} {mode} {groupBy} horizontal={mode === 'bar'} />
  </div>

  <div class="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
    <div class="card p-4">
      <SectionHeader
        title="Growth attribution waterfall"
        subtitle="Current period vs {filters.compareEnabled ? 'compare range' : 'previous equal window'} · Δ {formatCurrency(waterfall.delta)}"
      />
      <WaterfallChart steps={waterfall.steps} />
    </div>
    <div class="card p-4">
      <SectionHeader title="Multi-stream count" subtitle="Distribution of concurrent revenue streams" />
      <HistogramBars data={hist} xKey="count" yKey="accounts" />
    </div>
  </div>

  <div class="mt-4 space-y-3">
    <Expandable title="Primary-source transition matrix">
      <table class="w-full text-xs">
        <thead>
          <tr class="text-left text-[var(--text-muted)]">
            <th class="py-1">From</th>
            <th>To</th>
            <th class="text-right">Transitions</th>
          </tr>
        </thead>
        <tbody>
          {#each transitionTable as t}
            <tr class="border-t border-[var(--border)]">
              <td class="py-1">{STREAM_BY_KEY[t.from]?.label || t.from}</td>
              <td>{STREAM_BY_KEY[t.to]?.label || t.to}</td>
              <td class="mono text-right">{formatNumber(t.count)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </Expandable>

    <Expandable title="Negative-value impact">
      <p class="mb-2 text-xs text-[var(--text-muted)]">
        Negative values are included in all calculations as provided (reductions / adjustments).
      </p>
      <table class="w-full text-xs">
        <thead>
          <tr class="text-left text-[var(--text-muted)]">
            <th class="py-1">Stream</th>
            <th class="text-right">Count</th>
            <th class="text-right">Amount</th>
            <th class="text-right">% rev affected</th>
          </tr>
        </thead>
        <tbody>
          {#each negatives as n}
            <tr class="border-t border-[var(--border)]">
              <td class="py-1">{n.label}</td>
              <td class="mono text-right">{formatNumber(n.count)}</td>
              <td class="mono text-right text-[var(--negative)]">{formatCurrency(n.amount)}</td>
              <td class="mono text-right">{formatPct(n.pctRevenueAffected)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </Expandable>
  </div>
{/if}
