<script>
  let { title = '', open = true, onClose = null, children } = $props()
</script>

{#if open}
  <aside
    class="flex h-full w-[320px] shrink-0 flex-col border-l border-[var(--border)] bg-[var(--bg-elevated)] shadow-[var(--shadow-lg)]"
  >
    <div class="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
      <h3 class="text-sm font-semibold text-[var(--text-h)]">{title}</h3>
      {#if onClose}
        <button
          type="button"
          class="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-h)]"
          aria-label="Close panel"
          onclick={onClose}
        >
          ×
        </button>
      {/if}
    </div>
    <div class="flex-1 overflow-y-auto p-4">
      {@render children?.()}
    </div>
  </aside>
{/if}
