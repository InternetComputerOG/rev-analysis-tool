<script>
  import { AreaChart } from 'layerchart'
  import { formatCompact, formatMonth } from '../../utils/formatting.js'

  let {
    data = [],
    height = 280,
  } = $props()

  const series = [
    { key: 'revenue', value: 'revenue', color: 'var(--accent)', label: 'Revenue' },
  ]
</script>

{#if data.length}
  <div class="relative w-full" style="height:{height}px">
    <AreaChart
      {data}
      x="date"
      y="revenue"
      {series}
      {height}
      padding={{ top: 16, right: 48, bottom: 32, left: 48 }}
      props={{
        area: { fillOpacity: 0.15 },
        xAxis: { format: (d) => formatMonth(d) },
        yAxis: { format: (d) => formatCompact(d) },
      }}
    >
      {#snippet tooltip()}
        <!-- LayerChart default tooltip -->
      {/snippet}
    </AreaChart>
    <!-- Active accounts overlay as line using second chart layered conceptually via labels -->
    <div class="pointer-events-none absolute top-2 right-2 flex gap-3 text-[10px] text-[var(--text-muted)]">
      <span class="flex items-center gap-1"><span class="inline-block h-2 w-2 rounded-full bg-[var(--accent)]"></span> Revenue</span>
      <span class="flex items-center gap-1"><span class="inline-block h-0.5 w-3 bg-[#c45c2a]"></span> Active accounts (see table)</span>
    </div>
  </div>
  <div class="mt-2 overflow-x-auto">
    <table class="w-full text-[10px] text-[var(--text-muted)]">
      <thead>
        <tr>
          <th class="text-left font-medium">Month</th>
          {#each data as d}
            <th class="px-1 font-normal">{formatMonth(d.date)}</th>
          {/each}
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="pr-2">Accounts</td>
          {#each data as d}
            <td class="mono px-1 text-center text-[var(--text)]">{d.activeAccounts}</td>
          {/each}
        </tr>
      </tbody>
    </table>
  </div>
{:else}
  <div class="flex h-[200px] items-center justify-center text-sm text-[var(--text-muted)]">No time series data</div>
{/if}
