<script>
  import { formatPct, formatCurrency } from '../../utils/formatting.js'

  let {
    segments = [],
    streams = [],
    cells = [],
    onCellClick = null,
  } = $props()

  function cell(segId, streamKey) {
    return cells.find((c) => c.segmentId === segId && c.streamKey === streamKey)
  }

  function bg(gap) {
    if (gap == null) return 'transparent'
    if (gap <= 0) return 'rgba(26, 122, 76, 0.15)'
    const t = Math.min(1, gap * 2)
    return `rgba(196, 92, 42, ${0.15 + 0.65 * t})`
  }
</script>

{#if segments.length && streams.length}
  <div class="overflow-auto">
    <table class="w-full border-collapse text-[11px]">
      <thead>
        <tr>
          <th class="sticky left-0 bg-[var(--bg-elevated)] p-2 text-left font-medium text-[var(--text-muted)]">Segment</th>
          {#each streams as s}
            <th class="p-2 text-center font-medium text-[var(--text-muted)]" style="color:{s.color}">{s.label}</th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each segments as seg}
          <tr>
            <th class="sticky left-0 bg-[var(--bg-elevated)] p-2 text-left font-medium text-[var(--text-h)] whitespace-nowrap">
              {seg.label}
            </th>
            {#each streams as s}
              {@const d = cell(seg.id, s.key)}
              <td class="p-0.5">
                <button
                  type="button"
                  class="flex min-h-[44px] w-full flex-col items-center justify-center rounded-sm px-1 hover:ring-2 hover:ring-[var(--accent)]"
                  style="background:{bg(d?.gap)}"
                  onclick={() => onCellClick?.(d)}
                  title="Gap {formatPct(d?.gap || 0)} · Est. incremental {formatCurrency(d?.incremental || 0)}"
                >
                  <span class="mono font-medium text-[var(--text-h)]">{formatPct(d?.gap || 0, 0)}</span>
                  <span class="text-[9px] text-[var(--text-muted)]">{formatCurrency(d?.incremental || 0)}</span>
                </button>
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  <div class="mt-2 text-[10px] text-[var(--text-muted)]">
    Color encodes penetration gap vs USA individuals. Orange = lag (opportunity); green = at/above benchmark.
  </div>
{:else}
  <div class="flex h-[160px] items-center justify-center text-sm text-[var(--text-muted)]">No opportunity data</div>
{/if}
