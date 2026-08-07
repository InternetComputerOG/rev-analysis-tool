<script>
  let {
    value = $bindable(''),
    placeholder = 'Search…',
    onSubmit = null,
    onInput = null,
  } = $props()

  function onkeydown(e) {
    if (e.key === 'Enter' && onSubmit) onSubmit(value)
  }
</script>

<div class="relative">
  <input
    type="search"
    class="w-full rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1.5 text-sm text-[var(--text-h)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
    {placeholder}
    {value}
    oninput={(e) => {
      value = e.target.value
      onInput?.(value)
    }}
    {onkeydown}
  />
</div>
