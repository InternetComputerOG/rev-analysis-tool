<script>
  let { label = '', options = [], selected = $bindable([]) } = $props()

  function toggle(value) {
    if (selected.includes(value)) {
      selected = selected.filter((v) => v !== value)
    } else {
      selected = [...selected, value]
    }
  }
</script>

<div class="space-y-1.5">
  {#if label}
    <div class="text-xs font-medium text-[var(--text-h)]">{label}</div>
  {/if}
  <div class="flex flex-col gap-1">
    {#each options as opt}
      {@const val = typeof opt === 'string' ? opt : opt.value}
      {@const lab = typeof opt === 'string' ? opt : opt.label}
      <label class="flex cursor-pointer items-center gap-2 text-xs text-[var(--text)]">
        <input
          type="checkbox"
          class="accent-[var(--accent)]"
          checked={selected.includes(val)}
          onchange={() => toggle(val)}
        />
        {lab}
      </label>
    {/each}
  </div>
</div>
