<script>
  import { formatCompact, formatCurrency, formatPct } from '../../utils/formatting.js'

  let {
    data = [],
    colorMode = 'arpa', // arpa | growth
    height = 360,
    onSelect = null,
    selected = null,
  } = $props()

  let maxRev = $derived(Math.max(1, ...data.map((d) => d.revenue)))
  let colorValues = $derived(data.map((d) => (colorMode === 'growth' ? d.growth : d.arpa)))
  let minC = $derived(Math.min(...colorValues, 0))
  let maxC = $derived(Math.max(...colorValues, 0.0001))

  function cellColor(d) {
    const v = colorMode === 'growth' ? d.growth : d.arpa
    const t = maxC === minC ? 0.5 : (v - minC) / (maxC - minC)
    if (colorMode === 'growth') {
      if (v < 0) return `rgba(181, 74, 74, ${0.25 + 0.55 * Math.min(1, Math.abs(v))})`
      return `rgba(13, 122, 140, ${0.25 + 0.6 * t})`
    }
    return `rgba(13, 122, 140, ${0.2 + 0.7 * t})`
  }

  // Simple squarified-ish layout via CSS grid with proportional spans
  let layout = $derived(
    data.slice(0, 40).map((d) => ({
      ...d,
      flex: Math.max(1, Math.round((d.revenue / maxRev) * 12)),
    })),
  )
</script>

{#if layout.length}
  <div class="flex flex-wrap content-start gap-1 overflow-auto" style="height:{height}px">
    {#each layout as d}
      <button
        type="button"
        class="flex min-h-[56px] min-w-[72px] flex-col justify-between rounded border p-2 text-left transition-shadow hover:shadow-md {selected ===
        d.country
          ? 'ring-2 ring-[var(--accent)]'
          : 'border-transparent'}"
        style="flex:{d.flex} 1 auto; background:{cellColor(d)}; color: var(--text-h)"
        onclick={() => onSelect?.(d)}
        title="{d.country}: {formatCurrency(d.revenue)} · ARPA {formatCurrency(d.arpa)} · growth {formatPct(d.growth)}"
      >
        <span class="text-xs font-semibold">{d.country}</span>
        <span class="mono text-[10px] opacity-90">{formatCompact(d.revenue)}</span>
      </button>
    {/each}
  </div>
  <div class="mt-2 text-[10px] text-[var(--text-muted)]">
    Size ∝ revenue · color ∝ {colorMode === 'arpa' ? 'ARPA' : 'month-over-month growth'}. Click a country for details.
  </div>
{:else}
  <div class="flex h-[200px] items-center justify-center text-sm text-[var(--text-muted)]">No country data</div>
{/if}
