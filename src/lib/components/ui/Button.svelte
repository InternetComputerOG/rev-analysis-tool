<script>
  let {
    variant = 'primary',
    size = 'md',
    disabled = false,
    type = 'button',
    onclick,
    children,
    class: className = '',
  } = $props()

  const base =
    'inline-flex items-center justify-center gap-1.5 font-medium transition-colors rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:opacity-50 disabled:pointer-events-none'

  const variants = {
    primary: 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]',
    secondary: 'bg-[var(--bg-muted)] text-[var(--text-h)] hover:bg-[var(--border)]',
    ghost: 'bg-transparent text-[var(--text)] hover:bg-[var(--bg-muted)]',
    danger: 'bg-[var(--negative-bg)] text-[var(--negative)] hover:opacity-90',
    outline: 'border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-h)] hover:border-[var(--border-strong)]',
  }

  const sizes = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-sm px-4 py-2',
  }
</script>

<button {type} {disabled} class="{base} {variants[variant]} {sizes[size]} {className}" {onclick}>
  {@render children?.()}
</button>
