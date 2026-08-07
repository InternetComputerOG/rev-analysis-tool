<script>
  let { label, onRemove = null, active = false, onclick = null } = $props()
</script>

<span
  class="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs
    {active
      ? 'border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--accent)]'
      : 'border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text)]'}"
>
  {#if onclick}
    <button type="button" class="hover:text-[var(--text-h)]" {onclick}>{label}</button>
  {:else}
    {label}
  {/if}
  {#if onRemove}
    <button
      type="button"
      class="ml-0.5 rounded-full p-0.5 hover:bg-[var(--bg-muted)] text-[var(--text-muted)]"
      aria-label="Remove {label}"
      onclick={onRemove}
    >
      ×
    </button>
  {/if}
</span>
