<script>
  import { LineChart } from 'layerchart'
  import { formatPct } from '../../utils/formatting.js'

  let { cohorts = [], height = 280, mode = 'firstMonth' } = $props()

  // Flatten to multi-series: for firstMonth use offset; else use date
  let seriesData = $derived.by(() => {
    if (!cohorts.length) return { data: [], series: [] }
    if (mode === 'firstMonth') {
      const offsets = cohorts[0]?.points?.map((p) => p.offset) || []
      const data = offsets.map((offset) => {
        const row = { offset }
        for (const c of cohorts) {
          const pt = c.points.find((p) => p.offset === offset)
          row[c.key] = pt?.rate ?? null
        }
        return row
      })
      const colors = ['#0d7a8c', '#c45c2a', '#1a6b8a', '#d4782e', '#3aa8a0', '#b86b2e', '#5bb8c4', '#e09040']
      const series = cohorts.map((c, i) => ({
        key: String(c.key),
        value: String(c.key),
        label: c.label,
        color: colors[i % colors.length],
      }))
      return { data, series, x: 'offset' }
    }
    const dates = cohorts[0]?.points?.map((p) => p.ts) || []
    const data = dates.map((ts) => {
      const row = { date: new Date(ts), ts }
      for (const c of cohorts) {
        const pt = c.points.find((p) => p.ts === ts)
        row[c.key] = pt?.rate ?? null
      }
      return row
    })
    const colors = ['#0d7a8c', '#c45c2a', '#1a6b8a', '#d4782e', '#3aa8a0', '#b86b2e', '#5bb8c4', '#e09040']
    const series = cohorts.map((c, i) => ({
      key: String(c.key),
      value: String(c.key),
      label: c.label,
      color: colors[i % colors.length],
    }))
    return { data, series, x: 'date' }
  })

  let legend = {
    classes: {
      root: 'max-w-full',
      items: 'flex-wrap justify-center',
    },
  }
</script>

{#if seriesData.data.length}
  <div class="w-full" style="height:{height}px">
    <LineChart
      data={seriesData.data}
      x={seriesData.x}
      series={seriesData.series}
      {height}
      {legend}
      padding={{ top: 8, right: 12, bottom: 72, left: 44 }}
      props={{
        yAxis: { format: (d) => formatPct(d, 0) },
        line: { strokeWidth: 2 },
      }}
    />
  </div>
{:else}
  <div class="flex h-[160px] items-center justify-center text-sm text-[var(--text-muted)]">No cohort data</div>
{/if}
