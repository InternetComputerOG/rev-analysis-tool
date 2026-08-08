<script>
  import Toggle from '../ui/Toggle.svelte'
  import { AGE_BANDS, REGIONS, REVENUE_STREAMS } from '../../data/schema.js'
  import { formatCurrency, formatNumber } from '../../utils/formatting.js'

  let {
    filters = $bindable(),
    summary = { accountCount: 0, revenue: 0 },
    countries = [],
    collapsed = false,
  } = $props()
</script>

{#if !collapsed}
  <aside
    class="fixed top-[var(--bar-height)] bottom-0 left-0 z-10 flex w-[var(--rail-width)] flex-col overflow-y-auto border-r border-[var(--border)] bg-[var(--bg-elevated)]"
  >
    <div class="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3" style="padding-top: calc(var(--bar-height) - 13px);">
      <div class="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Filtered</div>
      <div class="mono mt-1 text-sm font-semibold text-[var(--text-h)]">
        {formatNumber(summary.accountCount)} accounts · {formatCurrency(summary.revenue)}
      </div>
    </div>

    <div class="flex flex-col gap-5 px-4 py-4">
      <div>
        <div class="mb-1.5 text-xs font-medium text-[var(--text-h)]">Entity type</div>
        <div class="flex flex-wrap gap-1">
          {#each [['all', 'All'], ['individual', 'Individual'], ['legal', 'Legal Entity']] as [val, lab]}
            <button
              type="button"
              class="rounded-md px-2 py-1 text-xs {filters.entityType === val
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--bg-muted)] text-[var(--text)]'}"
              onclick={() => (filters = { ...filters, entityType: val })}
            >
              {lab}
            </button>
          {/each}
        </div>
      </div>

      <div>
        <div class="mb-1.5 text-xs font-medium text-[var(--text-h)]">Geography</div>
        <div class="mb-2 flex flex-wrap gap-1">
          {#each [['all', 'All'], ['usa', 'USA'], ['non_usa', 'Non-USA'], ['region', 'Region'], ['country', 'Country']] as [val, lab]}
            <button
              type="button"
              class="rounded-md px-2 py-1 text-xs {filters.geoMode === val
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--bg-muted)] text-[var(--text)]'}"
              onclick={() => (filters = { ...filters, geoMode: val })}
            >
              {lab}
            </button>
          {/each}
        </div>
        {#if filters.geoMode === 'region'}
          <div class="mt-1 flex flex-col gap-1">
            {#each REGIONS as r}
              <label class="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  class="accent-[var(--accent)]"
                  checked={filters.regions.includes(r)}
                  onchange={() => {
                    const regions = filters.regions.includes(r)
                      ? filters.regions.filter((x) => x !== r)
                      : [...filters.regions, r]
                    filters = { ...filters, regions }
                  }}
                />
                {r}
              </label>
            {/each}
            {#if !filters.regions.length}
              <p class="mt-1 text-[10px] text-[var(--text-muted)]">Select at least one region</p>
            {/if}
          </div>
        {/if}
        {#if filters.geoMode === 'country'}
          <div class="max-h-40 overflow-y-auto rounded border border-[var(--border)] p-2">
            {#each countries as c}
              <label class="flex items-center gap-2 py-0.5 text-xs">
                <input
                  type="checkbox"
                  class="accent-[var(--accent)]"
                  checked={filters.countries.includes(c)}
                  onchange={() => {
                    const list = filters.countries.includes(c)
                      ? filters.countries.filter((x) => x !== c)
                      : [...filters.countries, c]
                    filters = { ...filters, countries: list }
                  }}
                />
                {c}
              </label>
            {/each}
          </div>
          {#if !filters.countries.length}
            <p class="mt-1 text-[10px] text-[var(--text-muted)]">Select at least one country</p>
          {/if}
        {/if}
      </div>

      <div>
        <div class="mb-1.5 text-xs font-medium text-[var(--text-h)]">Age band</div>
        <div class="flex flex-col gap-1">
          {#each AGE_BANDS as band}
            <label class="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                class="accent-[var(--accent)]"
                checked={filters.ageBands.includes(band)}
                onchange={() => {
                  const ageBands = filters.ageBands.includes(band)
                    ? filters.ageBands.filter((x) => x !== band)
                    : [...filters.ageBands, band]
                  filters = { ...filters, ageBands }
                }}
              />
              {band}
            </label>
          {/each}
        </div>
      </div>

      <div>
        <div class="mb-1.5 text-xs font-medium text-[var(--text-h)]">Tenure (months)</div>
        <div class="flex items-center gap-2 text-xs">
          <input
            type="number"
            min="1"
            max="24"
            class="w-14 rounded border border-[var(--border)] px-1 py-0.5"
            value={filters.tenureRange[0]}
            onchange={(e) =>
              (filters = {
                ...filters,
                tenureRange: [Number(e.target.value), filters.tenureRange[1]],
              })}
          />
          <span>–</span>
          <input
            type="number"
            min="1"
            max="24"
            class="w-14 rounded border border-[var(--border)] px-1 py-0.5"
            value={filters.tenureRange[1]}
            onchange={(e) =>
              (filters = {
                ...filters,
                tenureRange: [filters.tenureRange[0], Number(e.target.value)],
              })}
          />
        </div>
      </div>

      <div>
        <div class="mb-1.5 text-xs font-medium text-[var(--text-h)]">Multi-stream count</div>
        <div class="flex items-center gap-2 text-xs">
          <input
            type="number"
            min="0"
            max="9"
            class="w-14 rounded border border-[var(--border)] px-1 py-0.5"
            value={filters.multiStreamRange[0]}
            onchange={(e) =>
              (filters = {
                ...filters,
                multiStreamRange: [Number(e.target.value), filters.multiStreamRange[1]],
              })}
          />
          <span>–</span>
          <input
            type="number"
            min="0"
            max="9"
            class="w-14 rounded border border-[var(--border)] px-1 py-0.5"
            value={filters.multiStreamRange[1]}
            onchange={(e) =>
              (filters = {
                ...filters,
                multiStreamRange: [filters.multiStreamRange[0], Number(e.target.value)],
              })}
          />
        </div>
      </div>

      <div>
        <div class="mb-1.5 text-xs font-medium text-[var(--text-h)]">Stream presence</div>
        <div class="flex flex-col gap-1">
          {#each REVENUE_STREAMS as s}
            <label class="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                class="accent-[var(--accent)]"
                checked={filters.streamPresence[s.key]}
                onchange={() => {
                  filters = {
                    ...filters,
                    streamPresence: {
                      ...filters.streamPresence,
                      [s.key]: !filters.streamPresence[s.key],
                    },
                  }
                }}
              />
              <span class="inline-block h-2 w-2 rounded-full" style="background:{s.color}"></span>
              {s.label}
            </label>
          {/each}
        </div>
      </div>

      <Toggle
        label="Active accounts only"
        checked={filters.activeOnly}
        onchange={(v) => (filters = { ...filters, activeOnly: v })}
      />
    </div>
  </aside>
{/if}
