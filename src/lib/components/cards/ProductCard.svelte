<script>
  let {
    label,
    contribution,
    penetration,
    avgAmongUsers,
    status,
    topSegment,
    color,
    selected = false,
    onclick = null,
    spark = null,
  } = $props()

  let statusColor = $derived(
    status === 'Growing' ? '#1a7a4c' : status === 'Weak' ? 'var(--negative)' : 'var(--text-muted)',
  )
</script>

<button
  type="button"
  class="card flex w-full flex-col gap-2 p-3 text-left transition-shadow hover:shadow-[var(--shadow-lg)] {selected
    ? 'ring-2 ring-[var(--accent)]'
    : ''}"
  style="border-top: 3px solid {color}"
  {onclick}
>
  <div class="flex items-start justify-between gap-2">
    <div class="text-xs font-semibold text-[var(--text-h)]">{label}</div>
    <span class="text-[10px] font-medium" style="color:{statusColor}">{status}</span>
  </div>
  <div class="mono text-lg font-semibold text-[var(--text-h)]">{contribution}</div>
  <div class="grid grid-cols-2 gap-1 text-[10px] text-[var(--text-muted)]">
    <div>Pen. <span class="mono text-[var(--text)]">{penetration}</span></div>
    <div>Avg <span class="mono text-[var(--text)]">{avgAmongUsers}</span></div>
  </div>
  {#if spark}
    <div class="h-7">{@render spark()}</div>
  {/if}
  <div class="text-[10px] text-[var(--text-muted)]">Top: {topSegment}</div>
</button>
