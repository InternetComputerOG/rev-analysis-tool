<script>
  import { formatCompact, formatNumber, formatCurrency, formatPct } from '../../utils/formatting.js'

  let {
    data = [],
    rows = [],
    cols = [],
    maxVal = 1,
    metric = 'revenue',
    onCellClick = null,
  } = $props()

  function cell(r, c) {
    return data.find((d) => d.row === r && d.col === c)
  }

  function bg(value) {
    const t = maxVal ? value / maxVal : 0
    return `rgba(13, 122, 140, ${0.08 + 0.75 * t})`
  }

  function fmt(v) {
    if (metric === 'revenue') return formatCompact(v)
    if (metric === 'arpa') return formatCurrency(v)
    return formatNumber(v, { precise: true })
  }
</script>

{#if rows.length && cols.length}
  <div class="overflow-auto">
    <table class="w-full border-collapse text-xs">
      <thead>
        <tr>
          <th class="sticky left-0 bg-[var(--bg-elevated)] p-2 text-left font-medium text-[var(--text-muted)]"></th>
          {#each cols as c}
            <th class="p-2 text-center font-medium text-[var(--text-muted)] whitespace-nowrap">{c}</th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each rows as r}
          <tr>
            <th class="sticky left-0 bg-[var(--bg-elevated)] p-2 text-left font-medium text-[var(--text-h)] whitespace-nowrap">
              {r}
            </th>
            {#each cols as c}
              {@const d = cell(r, c)}
              <td class="p-0.5">
                <button
                  type="button"
                  class="flex h-full min-h-[40px] w-full items-center justify-center rounded-sm mono text-[11px] text-[var(--text-h)] hover:ring-2 hover:ring-[var(--accent)]"
                  style="background:{bg(d?.value || 0)}"
                  onclick={() => onCellClick?.(d)}
                  title="{r} × {c}: {fmt(d?.value || 0)}"
                >
                  {fmt(d?.value || 0)}
                </button>
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{:else}
  <div class="flex h-[160px] items-center justify-center text-sm text-[var(--text-muted)]">No cross-tab data</div>
{/if}
