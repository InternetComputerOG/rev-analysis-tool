<script>
  let { title, subtitle = '', actions = null } = $props()
</script>

<div class="mb-3 flex flex-wrap items-end justify-between gap-2">
  <div>
    <h2 class="text-base font-semibold text-[var(--text-h)]">{title}</h2>
    {#if subtitle}
      <p class="mt-0.5 text-xs text-[var(--text-muted)]">{subtitle}</p>
    {/if}
  </div>
  {#if actions}
    <div class="flex items-center gap-2">{@render actions()}</div>
  {/if}
</div>
