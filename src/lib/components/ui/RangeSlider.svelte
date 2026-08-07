<script>
  let {
    label = '',
    min = 0,
    max = 10,
    value = $bindable([0, 10]),
    step = 1,
  } = $props()

  function onMin(e) {
    const v = Number(e.target.value)
    value = [Math.min(v, value[1]), value[1]]
  }
  function onMax(e) {
    const v = Number(e.target.value)
    value = [value[0], Math.max(v, value[0])]
  }
</script>

<div class="space-y-1.5">
  {#if label}
    <div class="flex items-center justify-between text-xs">
      <span class="font-medium text-[var(--text-h)]">{label}</span>
      <span class="mono text-[var(--text-muted)]">{value[0]} – {value[1]}</span>
    </div>
  {/if}
  <div class="flex items-center gap-2">
    <input type="range" class="w-full accent-[var(--accent)]" {min} {max} {step} value={value[0]} oninput={onMin} />
    <input type="range" class="w-full accent-[var(--accent)]" {min} {max} {step} value={value[1]} oninput={onMax} />
  </div>
</div>
