<script>
  import Button from '../ui/Button.svelte'

  let {
    title,
    value,
    subtitle = '',
    spark = null,
    accent = null,
    onFocus = null,
    focusLabel = 'Focus on this segment',
    children,
  } = $props()
</script>

<div class="card flex flex-col gap-2 p-4">
  <div class="flex items-start justify-between gap-2">
    <div class="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">{title}</div>
  </div>
  <div class="mono text-xl font-semibold text-[var(--text-h)]">{value}</div>
  {#if subtitle}
    <div class="text-xs text-[var(--text-muted)]">{subtitle}</div>
  {/if}
  {#if children}
    {@render children()}
  {/if}
  {#if spark}
    <div class="mt-1 h-8">{@render spark()}</div>
  {/if}
  {#if onFocus}
    <Button variant="ghost" size="sm" onclick={onFocus} class="mt-auto self-start px-0 text-[var(--accent)]">
      {focusLabel} →
    </Button>
  {/if}
</div>
