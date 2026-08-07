<script>
  import { LineChart } from 'layerchart'

  let { data = [], valueKey = 'value', height = 36, color = 'var(--accent)' } = $props()

  let chartData = $derived(
    data.map((d) => ({
      date: d.date || (d.ts ? new Date(d.ts) : null),
      value: d[valueKey] ?? d.value ?? 0,
    })),
  )
</script>

{#if chartData.length > 1}
  <div class="w-full" style="height:{height}px">
    <LineChart
      data={chartData}
      x="date"
      y="value"
      series={[{ key: 'v', value: 'value', color }]}
      {height}
      padding={{ top: 2, right: 2, bottom: 2, left: 2 }}
      props={{
        xAxis: { ticks: [] },
        yAxis: { ticks: [] },
        grid: { x: false, y: false },
        rule: { x: false, y: false },
        line: { strokeWidth: 1.5 },
      }}
    />
  </div>
{:else}
  <div class="h-full w-full rounded bg-[var(--bg-muted)]" style="height:{height}px"></div>
{/if}
