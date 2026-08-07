<script>
  import { RotateCcw, PanelLeftClose, PanelLeft, Info } from '@lucide/svelte'
  import Chip from '../ui/Chip.svelte'
  import Button from '../ui/Button.svelte'
  import SearchInput from '../ui/SearchInput.svelte'
  import Toggle from '../ui/Toggle.svelte'
  import { formatMonth } from '../../utils/formatting.js'
  import { describeFilters } from '../../utils/filters.js'

  let {
    filters = $bindable(),
    meta = null,
    railCollapsed = false,
    onToggleRail = null,
    onReset = null,
    onShowQuality = null,
    onPinAccount = null,
  } = $props()

  let chips = $derived(describeFilters(filters))
  let customOpen = $state(false)

  const presets = [
    { id: 'all', label: 'All' },
    { id: '3m', label: 'Last 3M' },
    { id: '6m', label: 'Last 6M' },
    { id: '12m', label: 'Last 12M' },
    { id: 'ytd', label: 'YTD' },
  ]

  function applyPreset(id) {
    if (!meta?.allMonthTs?.length) return
    const months = meta.allMonthTs
    const end = months[months.length - 1]
    if (id === 'all') {
      filters = { ...filters, timeRange: { start: null, end: null } }
      return
    }
    if (id === 'ytd') {
      const endDate = new Date(end)
      const ytdStart = months.find((t) => new Date(t).getFullYear() === endDate.getFullYear()) ?? months[0]
      filters = { ...filters, timeRange: { start: ytdStart, end } }
      return
    }
    const n = id === '3m' ? 3 : id === '6m' ? 6 : 12
    const start = months[Math.max(0, months.length - n)]
    filters = { ...filters, timeRange: { start, end } }
  }

  function clearChip(id) {
    const next = { ...filters }
    if (id === 'entity') next.entityType = 'all'
    if (id === 'geo') {
      next.geoMode = 'all'
      next.regions = []
      next.countries = []
    }
    if (id === 'age') next.ageBands = []
    if (id === 'tenure') next.tenureRange = [1, 24]
    if (id === 'multi') next.multiStreamRange = [0, 9]
    if (id === 'presence') {
      next.streamPresence = Object.fromEntries(
        Object.keys(next.streamPresence).map((k) => [k, false]),
      )
    }
    if (id === 'active') next.activeOnly = false
    if (id === 'search') next.accountQuery = ''
    if (id === 'pinned') next.pinnedAccounts = []
    if (id === 'time') next.timeRange = { start: null, end: null }
    if (id === 'compare') next.compareEnabled = false
    filters = next
  }

  function submitSearch(q) {
    filters = { ...filters, accountQuery: q }
    if (q && onPinAccount) {
      // pin exact match if found later via parent
    }
  }
</script>

<header
  class="fixed top-0 right-0 left-0 z-40 flex h-[var(--bar-height)] items-center gap-3 border-b border-[var(--border)] bg-[var(--bg-elevated)] px-3 shadow-sm"
>
  <button
    type="button"
    class="rounded p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-h)]"
    aria-label="Toggle filters"
    onclick={onToggleRail}
  >
    {#if railCollapsed}
      <PanelLeft size={18} />
    {:else}
      <PanelLeftClose size={18} />
    {/if}
  </button>

  <div class="shrink-0">
    <div class="text-sm font-semibold tracking-tight text-[var(--text-h)]">Revenue Analysis</div>
  </div>

  <div class="mx-auto flex min-w-0 flex-1 flex-wrap items-center justify-center gap-1.5">
    {#each presets as p}
      <button
        type="button"
        class="rounded-md px-2 py-1 text-xs font-medium text-[var(--text)] hover:bg-[var(--bg-muted)]"
        onclick={() => applyPreset(p.id)}
      >
        {p.label}
      </button>
    {/each}
    <button
      type="button"
      class="rounded-md px-2 py-1 text-xs font-medium {customOpen
        ? 'bg-[var(--accent-bg)] text-[var(--accent)]'
        : 'text-[var(--text)] hover:bg-[var(--bg-muted)]'}"
      onclick={() => (customOpen = !customOpen)}
    >
      Custom
    </button>
    <div class="ml-2 flex items-center gap-2 border-l border-[var(--border)] pl-2">
      <Toggle
        label="Compare"
        checked={filters.compareEnabled}
        onchange={(v) => (filters = { ...filters, compareEnabled: v })}
      />
    </div>
  </div>

  <div class="flex w-[200px] shrink-0 items-center gap-2">
    <SearchInput
      value={filters.accountQuery}
      placeholder="Account ID…"
      onSubmit={submitSearch}
      onInput={(v) => (filters = { ...filters, accountQuery: v })}
    />
  </div>

  <Button variant="ghost" size="sm" onclick={onShowQuality} title="Data quality">
    <Info size={16} />
  </Button>
  <Button variant="outline" size="sm" onclick={onReset}>
    <RotateCcw size={14} />
    Reset All
  </Button>
</header>

{#if customOpen && meta?.allMonthTs}
  <div
    class="fixed top-[var(--bar-height)] right-0 left-0 z-30 flex items-center justify-center gap-3 border-b border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-2 text-xs"
  >
    <label class="flex items-center gap-1">
      From
      <select
        class="rounded border border-[var(--border)] bg-white px-2 py-1"
        value={filters.timeRange.start ?? ''}
        onchange={(e) => {
          const v = e.target.value ? Number(e.target.value) : null
          filters = { ...filters, timeRange: { ...filters.timeRange, start: v } }
        }}
      >
        <option value="">Start</option>
        {#each meta.allMonthTs as ts}
          <option value={ts}>{formatMonth(ts)}</option>
        {/each}
      </select>
    </label>
    <label class="flex items-center gap-1">
      To
      <select
        class="rounded border border-[var(--border)] bg-white px-2 py-1"
        value={filters.timeRange.end ?? ''}
        onchange={(e) => {
          const v = e.target.value ? Number(e.target.value) : null
          filters = { ...filters, timeRange: { ...filters.timeRange, end: v } }
        }}
      >
        <option value="">End</option>
        {#each meta.allMonthTs as ts}
          <option value={ts}>{formatMonth(ts)}</option>
        {/each}
      </select>
    </label>
    {#if filters.compareEnabled}
      <span class="text-[var(--text-muted)]">vs</span>
      <label class="flex items-center gap-1">
        Compare from
        <select
          class="rounded border border-[var(--border)] bg-white px-2 py-1"
          value={filters.compareRange.start ?? ''}
          onchange={(e) => {
            const v = e.target.value ? Number(e.target.value) : null
            filters = { ...filters, compareRange: { ...filters.compareRange, start: v } }
          }}
        >
          <option value="">Start</option>
          {#each meta.allMonthTs as ts}
            <option value={ts}>{formatMonth(ts)}</option>
          {/each}
        </select>
      </label>
      <label class="flex items-center gap-1">
        to
        <select
          class="rounded border border-[var(--border)] bg-white px-2 py-1"
          value={filters.compareRange.end ?? ''}
          onchange={(e) => {
            const v = e.target.value ? Number(e.target.value) : null
            filters = { ...filters, compareRange: { ...filters.compareRange, end: v } }
          }}
        >
          <option value="">End</option>
          {#each meta.allMonthTs as ts}
            <option value={ts}>{formatMonth(ts)}</option>
          {/each}
        </select>
      </label>
    {/if}
  </div>
{/if}

{#if chips.length}
  <div
    class="fixed right-0 left-0 z-20 flex flex-wrap items-center gap-1.5 border-b border-[var(--border)] bg-[var(--bg)] px-4 py-1.5"
    style="top: calc(var(--bar-height) + {customOpen ? '40px' : '0px'})"
  >
    {#each chips as chip}
      <Chip label={chip.label} onRemove={() => clearChip(chip.id)} />
    {/each}
  </div>
{/if}
