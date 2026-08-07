<script>
  let { checked = $bindable(false), label = '', onchange = null } = $props()
</script>

<label class="inline-flex cursor-pointer items-center gap-2 text-xs text-[var(--text-h)]">
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label || 'Toggle'}
    class="relative h-5 w-9 rounded-full transition-colors {checked
      ? 'bg-[var(--accent)]'
      : 'bg-[var(--border)]'}"
    onclick={() => {
      checked = !checked
      onchange?.(checked)
    }}
  >
    <span
      class="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform {checked
        ? 'translate-x-4'
        : ''}"
    ></span>
  </button>
  {#if label}<span>{label}</span>{/if}
</label>
