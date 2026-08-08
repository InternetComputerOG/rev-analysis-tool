<script>
  import { AreaChart, BarChart } from 'layerchart'
  import { REVENUE_STREAMS } from '../../data/schema.js'
  import { formatCompact, formatMonth } from '../../utils/formatting.js'

  let {
    data = [],
    mode = 'area', // area | bar
    groupBy = 'stream', // stream | stockflow
    height = 320,
    horizontal = false,
  } = $props()

  let series = $derived(
    groupBy === 'stockflow'
      ? [
          { key: 'stock', value: 'stock', color: 'var(--stock-group)', label: 'Stock-based' },
          { key: 'flow', value: 'flow', color: 'var(--flow-group)', label: 'Flow-based' },
        ]
      : REVENUE_STREAMS.map((s) => ({
          key: s.key,
          value: s.key,
          color: s.color,
          label: s.label,
        })),
  )

  let bottomPadding = $derived(groupBy === 'stream' ? 104 : 56)
  // Area charts degenerate with a single point — fall back to stacked bars.
  let useBar = $derived(mode === 'bar' || data.length === 1)
  let legend = {
    classes: {
      root: 'max-w-full',
      items: 'flex-wrap justify-center',
    },
  }
</script>

{#if data.length}
  <div class="w-full" style="height:{height}px">
    {#if useBar}
      <BarChart
        {data}
        x={horizontal ? undefined : 'date'}
        y={horizontal ? undefined : series[0]?.value}
        orientation={horizontal ? 'horizontal' : 'vertical'}
        {series}
        seriesLayout="stack"
        {height}
        padding={{ top: 12, right: 12, bottom: bottomPadding, left: horizontal ? 72 : 48 }}
        props={{
          xAxis: { format: (d) => (d instanceof Date ? formatMonth(d) : String(d)) },
          yAxis: { format: (d) => (typeof d === 'number' ? formatCompact(d) : String(d)) },
        }}
        {legend}
      />
    {:else}
      <AreaChart
        {data}
        x="date"
        {series}
        seriesLayout="stack"
        {height}
        padding={{ top: 12, right: 12, bottom: bottomPadding, left: 48 }}
        props={{
          area: { fillOpacity: 0.85 },
          xAxis: { format: (d) => formatMonth(d) },
          yAxis: { format: (d) => formatCompact(d) },
        }}
        {legend}
      />
    {/if}
  </div>
  {#if data.length === 1 && mode === 'area'}
    <div class="mt-1 text-center text-[10px] text-[var(--text-muted)]">Single month in range</div>
  {/if}
{:else}
  <div class="flex h-[200px] items-center justify-center text-sm text-[var(--text-muted)]">No stream data</div>
{/if}
