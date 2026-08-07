<script>
  let { selected = $bindable('overview'), suggestions = [], onSuggestion = null } = $props()

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'composition', label: 'Composition & Trends' },
    { id: 'geography', label: 'Geography' },
    { id: 'segments', label: 'Segments' },
    { id: 'products', label: 'Products' },
    { id: 'engagement', label: 'Engagement & Opportunities' },
  ]
</script>

<div class="border-b border-[var(--border)] bg-[var(--bg-elevated)]">
  <nav class="flex gap-0 overflow-x-auto px-2" aria-label="Primary views">
    {#each tabs as tab}
      <button
        type="button"
        class="shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors {selected === tab.id
          ? 'border-[var(--accent)] text-[var(--accent)]'
          : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-h)]'}"
        onclick={() => (selected = tab.id)}
      >
        {tab.label}
      </button>
    {/each}
  </nav>
  {#if suggestions.length}
    <div class="flex flex-wrap items-center gap-2 border-t border-[var(--border)] px-4 py-1.5 text-xs">
      <span class="text-[var(--text-muted)]">Suggested:</span>
      {#each suggestions as s}
        <button
          type="button"
          class="rounded-full bg-[var(--accent-bg)] px-2.5 py-0.5 font-medium text-[var(--accent)] hover:opacity-80"
          onclick={() => onSuggestion?.(s)}
        >
          {s.label}
        </button>
      {/each}
    </div>
  {/if}
</div>
