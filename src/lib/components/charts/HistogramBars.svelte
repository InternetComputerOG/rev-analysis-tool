<script>
  import { BarChart } from 'layerchart'

  let { data = [], height = 220, xKey = 'count', yKey = 'accounts' } = $props()

  let chartData = $derived(data.map((d) => ({ ...d, x: String(d[xKey]), y: d[yKey] })))
</script>

{#if chartData.length}
  <div class="w-full" style="height:{height}px">
    <BarChart
      data={chartData}
      x="x"
      y="y"
      {height}
      padding={{ top: 8, right: 8, bottom: 32, left: 40 }}
      props={{
        bars: { fill: 'var(--accent)', fillOpacity: 0.8 },
      }}
    />
  </div>
{:else}
  <div class="flex h-[140px] items-center justify-center text-sm text-[var(--text-muted)]">No histogram data</div>
{/if}
