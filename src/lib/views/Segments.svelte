<script>
  import HeatmapGrid from '../components/charts/HeatmapGrid.svelte'
  import DetailPanel from '../components/ui/DetailPanel.svelte'
  import EmptyState from '../components/ui/EmptyState.svelte'
  import SectionHeader from '../components/ui/SectionHeader.svelte'
  import { crossTab, streamBreakdown } from '../utils/aggregations.js'
  import { formatCurrency, formatPct } from '../utils/formatting.js'

  let { rows = [], onFilterPatch = null } = $props()

  let rowDim = $state('entity')
  let colDim = $state('age')
  let metric = $state('revenue')
  let selection = $state(null)

  const dimOptions = [
    { id: 'entity', label: 'Entity type' },
    { id: 'age', label: 'Age band' },
    { id: 'geography', label: 'USA / Non-USA' },
    { id: 'region', label: 'Region' },
    { id: 'tenure', label: 'Tenure band' },
  ]

  let tab = $derived(crossTab(rows, rowDim, colDim, metric))

  let selectedRows = $derived.by(() => {
    if (!selection) return []
    return rows.filter((r) => {
      const rk = dimValue(r, rowDim)
      const ck = dimValue(r, colDim)
      return rk === selection.row && ck === selection.col
    })
  })

  let streams = $derived(streamBreakdown(selectedRows))

  function dimValue(row, dim) {
    switch (dim) {
      case 'entity':
        return row.is_legal_entity ? 'Legal Entity' : 'Individual'
      case 'age':
        return row.ageBand
      case 'geography':
        return row.isUsa ? 'USA' : 'Non-USA'
      case 'region':
        return row.region
      case 'tenure':
        return row.tenureBand
      default:
        return 'Other'
    }
  }

  function focusCell(cell) {
    if (!cell) return
    selection = cell
    const patch = {}
    applyDimToPatch(patch, rowDim, cell.row)
    applyDimToPatch(patch, colDim, cell.col)
    onFilterPatch?.(patch)
  }

  function applyDimToPatch(patch, dim, value) {
    if (dim === 'entity') patch.entityType = value === 'Legal Entity' ? 'legal' : 'individual'
    if (dim === 'age') patch.ageBands = [value]
    if (dim === 'geography') patch.geoMode = value === 'USA' ? 'usa' : 'non_usa'
    if (dim === 'region') {
      patch.geoMode = 'region'
      patch.regions = [value]
    }
    // tenure band → approximate range
    if (dim === 'tenure') {
      const map = { '1': [1, 1], '2–3': [2, 3], '4–6': [4, 6], '7–9': [7, 9], '10+': [10, 24] }
      patch.tenureRange = map[value] || [1, 24]
    }
  }
</script>

{#if !rows.length}
  <EmptyState title="No segment data" message="Adjust filters to build cross-tabs." />
{:else}
  <div class="flex gap-4">
    <div class="min-w-0 flex-1">
      <div class="card p-4">
        <SectionHeader title="Segment cross-tab" subtitle="Click a cell to set global filters to that intersection">
          {#snippet actions()}
            <div class="flex flex-wrap items-center gap-2 text-xs">
              <label class="flex items-center gap-1">
                Rows
                <select class="rounded border border-[var(--border)] px-2 py-1" bind:value={rowDim}>
                  {#each dimOptions as o}
                    <option value={o.id}>{o.label}</option>
                  {/each}
                </select>
              </label>
              <label class="flex items-center gap-1">
                Columns
                <select class="rounded border border-[var(--border)] px-2 py-1" bind:value={colDim}>
                  {#each dimOptions as o}
                    <option value={o.id}>{o.label}</option>
                  {/each}
                </select>
              </label>
              <label class="flex items-center gap-1">
                Metric
                <select class="rounded border border-[var(--border)] px-2 py-1" bind:value={metric}>
                  <option value="revenue">Revenue</option>
                  <option value="arpa">ARPA</option>
                  <option value="multi">Multi-stream avg</option>
                </select>
              </label>
            </div>
          {/snippet}
        </SectionHeader>
        <HeatmapGrid
          data={tab.data}
          rows={tab.rows}
          cols={tab.cols}
          maxVal={tab.maxVal}
          {metric}
          onCellClick={focusCell}
        />
      </div>
    </div>

    <DetailPanel
      title={selection ? `${selection.row} × ${selection.col}` : 'Selection'}
      open={!!selection}
      onClose={() => (selection = null)}
    >
      {#if selection}
        <div class="mb-3 text-xs text-[var(--text-muted)]">
          Revenue {formatCurrency(selection.revenue)} · {selection.accountCount} accounts
        </div>
        <div class="text-xs font-medium text-[var(--text-h)] mb-2">Eight-stream breakdown</div>
        {#each streams as s}
          <div class="mb-1.5 flex items-center gap-2 text-[11px]">
            <span class="h-2 w-2 rounded-full" style="background:{s.color}"></span>
            <span class="flex-1 truncate">{s.label}</span>
            <span class="mono">{formatCurrency(s.value)}</span>
            <span class="mono text-[var(--text-muted)] w-12 text-right">{formatPct(s.share)}</span>
          </div>
        {/each}
      {/if}
    </DetailPanel>
  </div>
{/if}
