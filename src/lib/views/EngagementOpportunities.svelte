<script>
  import HistogramBars from '../components/charts/HistogramBars.svelte'
  import RetentionCurves from '../components/charts/RetentionCurves.svelte'
  import OpportunityMatrix from '../components/charts/OpportunityMatrix.svelte'
  import EmptyState from '../components/ui/EmptyState.svelte'
  import SectionHeader from '../components/ui/SectionHeader.svelte'
  import {
    tenureDistribution,
    activeRateTrend,
    cohortRetention,
    opportunityMatrix,
  } from '../utils/aggregations.js'
  import { formatCurrency, formatPct, formatNumber } from '../utils/formatting.js'
  import { LineChart } from 'layerchart'

  let { rows = [], meta = null } = $props()

  let cohortDim = $state('firstMonth')
  let tenure = $derived(tenureDistribution(rows))
  let activeRate = $derived(activeRateTrend(rows, meta?.maxMonthTs))
  let cohorts = $derived(cohortRetention(rows, cohortDim))
  let opps = $derived(opportunityMatrix(rows))
  let selectedOpp = $state(null)

  let histData = $derived(tenure.map((t) => ({ count: t.band, accounts: t.accounts })))
</script>

{#if !rows.length}
  <EmptyState title="No engagement data" message="Adjust filters to analyze retention and opportunities." />
{:else}
  <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
    <div class="space-y-4">
      <div class="card p-4">
        <SectionHeader title="Tenure distribution" subtitle="Distinct trade months per account" />
        <HistogramBars data={histData} xKey="count" yKey="accounts" />
      </div>
      <div class="card p-4">
        <SectionHeader title="Active-account rate trend" subtitle="Active / ever-seen in filtered set" />
        {#if activeRate.length}
          <div class="h-[220px]">
            <LineChart
              data={activeRate}
              x="date"
              y="rate"
              height={220}
              padding={{ top: 8, right: 12, bottom: 32, left: 44 }}
              props={{
                line: { stroke: 'var(--accent)', strokeWidth: 2 },
                yAxis: { format: (d) => formatPct(d, 0) },
              }}
            />
          </div>
        {/if}
      </div>
      <div class="card p-4">
        <SectionHeader title="Cohort retention" subtitle="Share of cohort still active">
          {#snippet actions()}
            <select class="rounded border border-[var(--border)] px-2 py-1 text-xs" bind:value={cohortDim}>
              <option value="firstMonth">First observed month</option>
              <option value="age">Age band</option>
              <option value="country">Country</option>
              <option value="entity">Entity type</option>
            </select>
          {/snippet}
        </SectionHeader>
        <RetentionCurves {cohorts} mode={cohortDim === 'firstMonth' ? 'firstMonth' : 'absolute'} />
      </div>
    </div>

    <div class="space-y-4">
      <div class="card p-4">
        <SectionHeader
          title="Largest opportunities"
          subtitle="Incremental revenue if segment matched {opps.benchLabel} penetration"
        />
        <ol class="space-y-1.5">
          {#each opps.opportunities.slice(0, 8) as o, i}
            <li>
              <button
                type="button"
                class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-[var(--bg-muted)] {selectedOpp ===
                o
                  ? 'bg-[var(--accent-bg)]'
                  : ''}"
                onclick={() => (selectedOpp = o)}
              >
                <span class="mono w-4 text-[var(--text-muted)]">{i + 1}</span>
                <span class="flex-1 truncate">{o.segmentLabel} · {o.streamLabel}</span>
                <span class="mono font-medium text-[var(--text-h)]">{formatCurrency(o.incremental)}</span>
              </button>
            </li>
          {/each}
        </ol>
        {#if selectedOpp}
          <div class="mt-3 rounded border border-[var(--border)] bg-[var(--bg-muted)]/40 p-3 text-xs">
            <div class="font-medium text-[var(--text-h)]">{selectedOpp.segmentLabel} × {selectedOpp.streamLabel}</div>
            <div class="mt-1 text-[var(--text-muted)]">
              Segment pen. {formatPct(selectedOpp.segmentPen)} vs bench {formatPct(selectedOpp.benchPen)}
              (gap {formatPct(selectedOpp.gap)}). Est. incremental =
              gap × {formatNumber(selectedOpp.segmentAccounts)} accounts × benchmark avg among users ≈
              <strong class="text-[var(--text-h)]">{formatCurrency(selectedOpp.incremental)}</strong>
            </div>
          </div>
        {/if}
      </div>

      <div class="card p-4">
        <SectionHeader
          title="Opportunity gap matrix"
          subtitle="Rows emphasize non-USA individuals · color = penetration gap vs USA individuals"
        />
        <OpportunityMatrix
          segments={opps.segments}
          streams={opps.streams}
          cells={opps.cells}
          onCellClick={(c) => (selectedOpp = c)}
        />
      </div>
    </div>
  </div>
{/if}
