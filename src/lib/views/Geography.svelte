<script>
  import KpiCompareCard from '../components/cards/KpiCompareCard.svelte'
  import CountryTreemap from '../components/charts/CountryTreemap.svelte'
  import StackedStreamArea from '../components/charts/StackedStreamArea.svelte'
  import DetailPanel from '../components/ui/DetailPanel.svelte'
  import EmptyState from '../components/ui/EmptyState.svelte'
  import SectionHeader from '../components/ui/SectionHeader.svelte'
  import { usaNonUsa, countryRollup, monthlySeries, streamBreakdown } from '../utils/aggregations.js'
  import { formatCurrency, formatPct, formatNumber } from '../utils/formatting.js'

  let { rows = [], onFilterPatch = null } = $props()

  let geo = $derived(usaNonUsa(rows))
  let rollup = $derived(countryRollup(rows))
  let colorMode = $state('growth')
  let selectedCountry = $state('usa')

  let countryRows = $derived(
    selectedCountry ? rows.filter((r) => r.country_of_tax_residence === selectedCountry) : [],
  )
  let countryMonthly = $derived(monthlySeries(countryRows))
  let countryStreams = $derived(streamBreakdown(countryRows))
  let selectedMeta = $derived(rollup.countries.find((c) => c.country === selectedCountry))
</script>

{#if !rows.length}
  <EmptyState title="No geography data" message="Widen filters to compare regions and countries." />
{:else}
  <div class="flex gap-4">
    <div class="min-w-0 flex-1 space-y-4">
      <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
        <KpiCompareCard
          title="USA"
          metrics={[
            { label: 'Revenue', value: formatCurrency(geo.usa.revenue) },
            { label: 'ARPA', value: formatCurrency(geo.usa.arpa) },
            { label: 'Stock / Flow', value: `${formatPct(geo.usa.stockShare)} / ${formatPct(geo.usa.flowShare)}` },
            { label: 'Multi-stream avg', value: formatNumber(geo.usa.multiStreamAvg, { precise: true }) },
            { label: 'Active rate', value: formatPct(geo.usa.activeRate) },
            { label: 'Growth', value: formatPct(geo.usa.growth) },
          ]}
          onFocus={() => onFilterPatch?.({ geoMode: 'usa' })}
        />
        <KpiCompareCard
          title="Non-USA"
          metrics={[
            { label: 'Revenue', value: formatCurrency(geo.nonUsa.revenue) },
            { label: 'ARPA', value: formatCurrency(geo.nonUsa.arpa) },
            { label: 'Stock / Flow', value: `${formatPct(geo.nonUsa.stockShare)} / ${formatPct(geo.nonUsa.flowShare)}` },
            { label: 'Multi-stream avg', value: formatNumber(geo.nonUsa.multiStreamAvg, { precise: true }) },
            { label: 'Active rate', value: formatPct(geo.nonUsa.activeRate) },
            { label: 'Growth', value: formatPct(geo.nonUsa.growth) },
          ]}
          onFocus={() => onFilterPatch?.({ geoMode: 'non_usa' })}
        />
      </div>

      <div class="card p-4">
        <SectionHeader title="Countries" subtitle="Size = revenue · click for detail">
          {#snippet actions()}
            <div class="flex gap-1">
              <button
                type="button"
                class="rounded px-2 py-1 text-xs {colorMode === 'arpa' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-muted)]'}"
                onclick={() => (colorMode = 'arpa')}>Color: ARPA</button
              >
              <button
                type="button"
                class="rounded px-2 py-1 text-xs {colorMode === 'growth' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-muted)]'}"
                onclick={() => (colorMode = 'growth')}>Color: Growth</button
              >
            </div>
          {/snippet}
        </SectionHeader>
        <CountryTreemap
          data={rollup.countries}
          {colorMode}
          selected={selectedCountry}
          onSelect={(d) => {
            selectedCountry = d.country
          }}
        />
        <div class="mt-3 flex flex-wrap gap-4 text-xs text-[var(--text-muted)]">
          <span>Top-5 share: <strong class="mono text-[var(--text-h)]">{formatPct(rollup.top5Share)}</strong></span>
          <span>Top-10 share: <strong class="mono text-[var(--text-h)]">{formatPct(rollup.top10Share)}</strong></span>
          <span>Country Gini: <strong class="mono text-[var(--text-h)]">{formatNumber(rollup.gini, { precise: true })}</strong></span>
        </div>
      </div>
    </div>

    <DetailPanel
      title={selectedCountry ? selectedCountry : 'Country detail'}
      open={!!selectedCountry}
      onClose={() => (selectedCountry = null)}
    >
      {#if selectedMeta}
        <div class="mb-3 space-y-1 text-xs">
          <div>Revenue: <span class="mono font-semibold">{formatCurrency(selectedMeta.revenue)}</span></div>
          <div>Accounts: <span class="mono">{formatNumber(selectedMeta.accountCount)}</span></div>
          <div>ARPA: <span class="mono">{formatCurrency(selectedMeta.arpa)}</span></div>
          <div>Region: {selectedMeta.region}</div>
          <button
            type="button"
            class="mt-2 text-[var(--accent)] hover:underline"
            onclick={() =>
              onFilterPatch?.({ geoMode: 'country', countries: [selectedCountry] })}
          >
            Focus on this country →
          </button>
        </div>
        <div class="mb-4">
          <div class="mb-1 text-xs font-medium text-[var(--text-h)]">Entity split</div>
          <div class="text-xs text-[var(--text-muted)]">
            Individual {formatCurrency(selectedMeta.indRev)} · Legal {formatCurrency(selectedMeta.legalRev)}
          </div>
        </div>
        <div class="mb-4">
          <div class="mb-1 text-xs font-medium text-[var(--text-h)]">Stream mix</div>
          {#each countryStreams as s}
            <div class="mb-1 flex items-center gap-2 text-[11px]">
              <span class="h-2 w-2 rounded-full" style="background:{s.color}"></span>
              <span class="flex-1 truncate">{s.label}</span>
              <span class="mono">{formatCurrency(s.value)}</span>
            </div>
          {/each}
        </div>
        <div>
          <div class="mb-1 text-xs font-medium text-[var(--text-h)]">Monthly trend</div>
          <StackedStreamArea data={countryMonthly} mode="area" groupBy="stockflow" height={180} />
        </div>
      {/if}
    </DetailPanel>
  </div>
{/if}
