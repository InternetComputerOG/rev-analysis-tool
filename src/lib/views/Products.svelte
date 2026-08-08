<script>
  import ProductCard from '../components/cards/ProductCard.svelte'
  import Sparkline from '../components/charts/Sparkline.svelte'
  import EmptyState from '../components/ui/EmptyState.svelte'
  import SectionHeader from '../components/ui/SectionHeader.svelte'
  import { productCards, productWorkspace } from '../utils/aggregations.js'
  import { formatCurrency, formatPct, formatNumber } from '../utils/formatting.js'

  let { rows = [], onFilterPatch = null } = $props()

  let cards = $derived(productCards(rows))
  let selectedKey = $state('crypto_wallet_revenue')
  let workspace = $state(null)
  let workspaceLoading = $state(false)

  $effect(() => {
    const key = selectedKey
    const data = rows

    if (!key || !data.length) {
      workspace = null
      workspaceLoading = false
      return
    }

    workspaceLoading = true
    const timer = setTimeout(() => {
      workspace = productWorkspace(data, key)
      workspaceLoading = false
    }, 0)

    return () => clearTimeout(timer)
  })
</script>

{#if !rows.length}
  <EmptyState title="No product data" message="Adjust filters to compare revenue streams." />
{:else}
  <SectionHeader title="Revenue products" subtitle="Select a product card to explore its workspace" />
  <div class="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-9">
    {#each cards as c}
      <ProductCard
        label={c.label}
        contribution={formatCurrency(c.contribution)}
        penetration={formatPct(c.penetration)}
        avgAmongUsers={formatCurrency(c.avgAmongUsers)}
        status={c.status}
        topSegment={c.topSegment}
        color={c.color}
        selected={selectedKey === c.key}
        onclick={() => (selectedKey = selectedKey === c.key ? null : c.key)}
      >
        {#snippet spark()}
          <Sparkline data={c.spark} color={c.color} />
        {/snippet}
      </ProductCard>
    {/each}
  </div>

  {#if selectedKey}
    <div class="card mt-4 p-4">
      {#if workspaceLoading}
        <div class="flex flex-col items-center justify-center gap-3 py-10">
          <div class="h-1.5 w-40 overflow-hidden rounded-full bg-[var(--bg-muted)]">
            <div class="h-full w-1/2 animate-pulse rounded-full bg-[var(--accent)]"></div>
          </div>
          <div class="text-sm text-[var(--text-muted)]">Loading workspace…</div>
        </div>
      {:else if workspace?.card}
        <SectionHeader
          title="{workspace.card.label} workspace"
          subtitle="Status: {workspace.card.status} · Penetration {formatPct(workspace.card.penetration)}"
        />
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div>
            <h4 class="mb-2 text-xs font-semibold uppercase text-[var(--text-muted)]">By geography</h4>
            {#each workspace.byGeo as r}
              <div class="flex justify-between border-b border-[var(--border)] py-1 text-xs">
                <span>{r.label}</span>
                <span class="mono">{formatPct(r.penetration)} · {formatCurrency(r.avg)}</span>
              </div>
            {/each}
            <h4 class="mb-2 mt-4 text-xs font-semibold uppercase text-[var(--text-muted)]">By entity</h4>
            {#each workspace.byEntity as r}
              <div class="flex justify-between border-b border-[var(--border)] py-1 text-xs">
                <span>{r.label}</span>
                <span class="mono">{formatPct(r.penetration)} · {formatCurrency(r.avg)}</span>
              </div>
            {/each}
          </div>
          <div>
            <h4 class="mb-2 text-xs font-semibold uppercase text-[var(--text-muted)]">By age band</h4>
            {#each workspace.byAge as r}
              <div class="flex justify-between border-b border-[var(--border)] py-1 text-xs">
                <span>{r.label}</span>
                <span class="mono">{formatPct(r.penetration)} · {formatCurrency(r.avg)}</span>
              </div>
            {/each}
          </div>
          <div>
            <h4 class="mb-2 text-xs font-semibold uppercase text-[var(--text-muted)]">Correlations</h4>
            {#each workspace.correlations as r}
              <div class="flex items-center gap-2 border-b border-[var(--border)] py-1 text-xs">
                <span class="h-2 w-2 rounded-full" style="background:{r.color}"></span>
                <span class="flex-1 truncate">{r.label}</span>
                <span class="mono">{formatNumber(r.correlation, { precise: true })}</span>
              </div>
            {/each}
          </div>
        </div>
        <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <h4 class="mb-2 text-xs font-semibold uppercase text-[var(--text-muted)]">Top countries</h4>
            <table class="w-full text-xs">
              <thead>
                <tr class="text-left text-[var(--text-muted)]">
                  <th>Country</th>
                  <th class="text-right">Contribution</th>
                  <th class="text-right">Pen.</th>
                </tr>
              </thead>
              <tbody>
                {#each workspace.byCountry.slice(0, 10) as r}
                  <tr class="border-t border-[var(--border)]">
                    <td class="py-1">
                      <button
                        type="button"
                        class="text-[var(--accent)] hover:underline"
                        onclick={() => onFilterPatch?.({ geoMode: 'country', countries: [r.key] })}
                      >
                        {r.label}
                      </button>
                    </td>
                    <td class="mono text-right">{formatCurrency(r.contribution)}</td>
                    <td class="mono text-right">{formatPct(r.penetration)}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
          <div>
            <h4 class="mb-2 text-xs font-semibold uppercase text-[var(--text-muted)]">Age bands ranked</h4>
            <table class="w-full text-xs">
              <thead>
                <tr class="text-left text-[var(--text-muted)]">
                  <th>Age</th>
                  <th class="text-right">Contribution</th>
                  <th class="text-right">Avg</th>
                </tr>
              </thead>
              <tbody>
                {#each workspace.byAge as r}
                  <tr class="border-t border-[var(--border)]">
                    <td class="py-1">
                      <button
                        type="button"
                        class="text-[var(--accent)] hover:underline"
                        onclick={() => onFilterPatch?.({ ageBands: [r.key] })}
                      >
                        {r.label}
                      </button>
                    </td>
                    <td class="mono text-right">{formatCurrency(r.contribution)}</td>
                    <td class="mono text-right">{formatCurrency(r.avg)}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      {/if}
    </div>
  {/if}
{/if}
