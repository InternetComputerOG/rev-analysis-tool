<script>
  let { title, open = $bindable(false), children } = $props()
</script>

<div class="border border-[var(--border)] rounded-[var(--radius)] bg-[var(--bg-elevated)]">
  <button
    type="button"
    class="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-[var(--text-h)] hover:bg-[var(--bg-muted)]/60"
    onclick={() => (open = !open)}
    aria-expanded={open}
  >
    <span>{title}</span>
    <span class="text-[var(--text-muted)]">{open ? '▾' : '▸'}</span>
  </button>
  {#if open}
    <div class="border-t border-[var(--border)] px-4 py-3">
      {@render children?.()}
    </div>
  {/if}
</div>
