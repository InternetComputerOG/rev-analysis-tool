<script>
  import { BarChart } from 'layerchart'
  import { formatCompact, formatCurrency, formatPct } from '../../utils/formatting.js'

  let {
    data = [],
    height = 260,
    labelKey = 'label',
    valueKey = 'revenue',
    onBarClick = null,
    orientation = 'horizontal',
  } = $props()

  let chartData = $derived(
    data.map((d) => ({
      ...d,
      label: d[labelKey],
      value: d[valueKey],
    })),
  )
</script>

{#if chartData.length}
  <div class="w-full" style="height:{height}px">
    <BarChart
      data={chartData}
      x={orientation === 'vertical' ? 'label' : 'value'}
      y={orientation === 'vertical' ? 'value' : 'label'}
      {orientation}
      {height}
      padding={{
        top: 8,
        right: 16,
        bottom: orientation === 'vertical' ? 48 : 24,
        left: orientation === 'horizontal' ? 72 : 40,
      }}
      props={{
        bars: { fill: 'var(--accent)', fillOpacity: 0.85 },
        xAxis: {
          format: (d) => (typeof d === 'number' ? formatCompact(d) : String(d).slice(0, 10)),
        },
        yAxis: {
          format: (d) => (typeof d === 'number' ? formatCompact(d) : String(d).slice(0, 10)),
        },
      }}
      {onBarClick}
    />
  </div>
  <div class="mt-1 text-[10px] text-[var(--text-muted)]">
    Top item: {formatCurrency(chartData[0]?.value)} ({formatPct(chartData[0]?.share || 0)} of total)
  </div>
{:else}
  <div class="flex h-[160px] items-center justify-center text-sm text-[var(--text-muted)]">No Pareto data</div>
{/if}
