<script>
  import InsightCard from '../components/cards/InsightCard.svelte'
  import DualAxisTimeSeries from '../components/charts/DualAxisTimeSeries.svelte'
  import StackedStreamArea from '../components/charts/StackedStreamArea.svelte'
  import ParetoBars from '../components/charts/ParetoBars.svelte'
  import Sparkline from '../components/charts/Sparkline.svelte'
  import EmptyState from '../components/ui/EmptyState.svelte'
  import SectionHeader from '../components/ui/SectionHeader.svelte'
  import {
    periodGrowth,
    stockFlowSplit,
    usaNonUsa,
    legalEntityContribution,
    concentrationCallout,
    monthlySeries,
    paretoAccounts,
    paretoCountries,
  } from '../utils/aggregations.js'
  import { formatCurrency, formatPct, formatNumber } from '../utils/formatting.js'

  let { rows = [], onFilterPatch = null, focused = null } = $props()

  let growth = $derived(periodGrowth(rows))
  let sf = $derived(stockFlowSplit(rows))
  let geo = $derived(usaNonUsa(rows))
  let legal = $derived(legalEntityContribution(rows))
  let concentration = $derived(concentrationCallout(rows))
  let monthly = $derived(monthlySeries(rows))
  let accountPareto = $derived(paretoAccounts(rows, 12))
  let countryPareto = $derived(paretoCountries(rows, 12))
</script>

{#if !rows.length}
  <EmptyState
    title="No rows match the current filters"
    message="Reset filters or widen the time range to explore the full revenue dataset."
  />
{:else}
  <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
    <InsightCard
      title="Total revenue"
      value={formatCurrency(growth.total)}
      subtitle="Period growth (last vs prior month): {formatPct(growth.growth)}"
    />
    <InsightCard
      title="Stock vs Flow"
      value="{formatPct(sf.stockShare)} / {formatPct(sf.flowShare)}"
      subtitle="Stock {formatCurrency(sf.stock)} · Flow {formatCurrency(sf.flow)}"
    >
      {#snippet children()}
        <Sparkline data={sf.spark} valueKey="revenue" color="var(--accent)" />
      {/snippet}
    </InsightCard>
    <InsightCard
      title="USA vs Non-USA"
      value="{formatCurrency(geo.usa.revenue)} / {formatCurrency(geo.nonUsa.revenue)}"
      subtitle="USA {formatPct(geo.usa.growth)} · Non-USA {formatPct(geo.nonUsa.growth)}"
      onFocus={() => onFilterPatch?.({ geoMode: 'usa' })}
      focusLabel="Focus USA"
    />
    <InsightCard
      title="Legal entities"
      value={formatPct(legal.legalShare)}
      subtitle="{formatNumber(legal.legalAccounts)} accounts · ARPA {formatNumber(legal.arpaMultiple, { precise: true })}× individuals"
      onFocus={() => onFilterPatch?.({ entityType: 'legal' })}
    />
    <InsightCard
      title="Highest concentration"
      value={concentration ? (concentration.type === 'country' ? concentration.label : concentration.label) : '—'}
      subtitle={concentration
        ? `${concentration.type}: ${formatPct(concentration.share)} of revenue`
        : '—'}
      onFocus={() => {
        if (!concentration) return
        if (concentration.type === 'country') {
          onFilterPatch?.({ geoMode: 'country', countries: [concentration.id] })
        } else {
          onFilterPatch?.({ accountQuery: concentration.id, pinnedAccounts: [concentration.id] })
        }
      }}
    />
  </div>

  <div class="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
    <div class="card p-4">
      <SectionHeader title="Revenue & active accounts" subtitle="Monthly totals in the filtered set" />
      <DualAxisTimeSeries data={monthly} />
    </div>
    <div class="card p-4">
      <SectionHeader title="Revenue by stream" subtitle="Stacked composition over time" />
      <StackedStreamArea data={monthly} mode="area" groupBy="stream" />
    </div>
  </div>

  <div class="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
    <div class="card p-4">
      <SectionHeader title="Account Pareto" subtitle="Top accounts by revenue" />
      <ParetoBars
        data={accountPareto}
        onBarClick={(_e, detail) => {
          const id = detail?.data?.id
          if (id) onFilterPatch?.({ accountQuery: id, pinnedAccounts: [id] })
        }}
      />
    </div>
    <div class="card p-4">
      <SectionHeader title="Country Pareto" subtitle="Top countries by revenue" />
      <ParetoBars
        data={countryPareto}
        onBarClick={(_e, detail) => {
          const id = detail?.data?.id
          if (id) onFilterPatch?.({ geoMode: 'country', countries: [id] })
        }}
      />
    </div>
  </div>
{/if}
