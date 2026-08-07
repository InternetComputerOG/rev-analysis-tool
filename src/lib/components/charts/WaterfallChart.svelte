<script>
  import { formatCompact } from '../../utils/formatting.js'

  let { steps = [], height = 280 } = $props()

  let maxAbs = $derived(
    Math.max(1, ...steps.map((s) => Math.abs(s.value) + Math.abs(s.base || 0))),
  )
</script>

{#if steps.length}
  <div class="flex items-end gap-1 overflow-x-auto px-2" style="height:{height}px">
    {#each steps as step}
      {@const isTotal = step.type === 'total'}
      {@const positive = step.value >= 0}
      {@const barH = Math.max(2, (Math.abs(step.value) / maxAbs) * (height - 48))}
      {@const offset = isTotal ? 0 : ((step.base || 0) / maxAbs) * (height - 48)}
      <div class="flex min-w-[56px] flex-1 flex-col items-center justify-end" style="height:{height - 28}px">
        <div class="relative flex w-full flex-1 flex-col justify-end">
          {#if !isTotal}
            <div class="absolute bottom-0 w-full" style="height:{Math.max(0, offset)}px"></div>
          {/if}
          <div
            class="mx-auto w-[70%] rounded-t-sm"
            style="height:{barH}px; background:{isTotal
              ? 'var(--accent)'
              : positive
                ? step.color || 'var(--stock-group)'
                : 'var(--negative)'}; margin-bottom:{isTotal ? 0 : Math.max(0, offset)}px; opacity:0.9"
            title="{step.label}: {formatCompact(step.value)}"
          ></div>
        </div>
        <div class="mt-1 max-w-[64px] truncate text-center text-[9px] text-[var(--text-muted)]" title={step.label}>
          {step.label}
        </div>
      </div>
    {/each}
  </div>
  <div class="mt-1 flex gap-3 text-[10px] text-[var(--text-muted)]">
    <span class="flex items-center gap-1"><span class="h-2 w-2 rounded-sm bg-[var(--accent)]"></span> Period total</span>
    <span class="flex items-center gap-1"><span class="h-2 w-2 rounded-sm bg-[var(--stock-group)]"></span> Positive delta</span>
    <span class="flex items-center gap-1"><span class="h-2 w-2 rounded-sm bg-[var(--negative)]"></span> Negative delta</span>
  </div>
{:else}
  <div class="flex h-[160px] items-center justify-center text-sm text-[var(--text-muted)]">No waterfall data</div>
{/if}
