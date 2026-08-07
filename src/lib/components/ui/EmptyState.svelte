<script>
  let { title = 'No data', message = 'Adjust filters to see results.', children } = $props()
</script>

<div class="flex flex-col items-center justify-center gap-2 rounded-[var(--radius)] border border-dashed border-[var(--border)] bg-[var(--bg-muted)]/50 px-6 py-12 text-center">
  <h3 class="text-base font-semibold text-[var(--text-h)]">{title}</h3>
  <p class="max-w-md text-sm text-[var(--text-muted)]">{message}</p>
  {#if children}
    <div class="mt-2">{@render children()}</div>
  {/if}
</div>
