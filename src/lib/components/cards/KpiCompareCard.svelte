<script>
  let { title, metrics = [], onFocus = null } = $props()
</script>

<div class="card p-4">
  <div class="mb-3 text-sm font-semibold text-[var(--text-h)]">{title}</div>
  <dl class="grid grid-cols-2 gap-3">
    {#each metrics as m}
      <div>
        <dt class="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{m.label}</dt>
        <dd class="mono text-sm font-semibold text-[var(--text-h)]">{m.value}</dd>
      </div>
    {/each}
  </dl>
  {#if onFocus}
    <button
      type="button"
      class="mt-3 text-xs font-medium text-[var(--accent)] hover:underline"
      onclick={onFocus}
    >
      Focus on this segment →
    </button>
  {/if}
</div>
