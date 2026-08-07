import {
  STREAM_KEYS,
  REVENUE_STREAMS,
  STOCK_STREAMS,
  FLOW_STREAMS,
  AGE_BANDS,
  TENURE_BANDS,
  STREAM_BY_KEY,
} from '../data/schema.js'
import { growthRate } from './formatting.js'

const SLOPE_EPS = 0.002

export function computeSummary(rows) {
  const accounts = new Set()
  let revenue = 0
  let stock = 0
  let flow = 0
  for (const r of rows) {
    accounts.add(r.account_id)
    revenue += r.trade_month_total
    stock += r.stockTotal
    flow += r.flowTotal
  }
  return {
    accountCount: accounts.size,
    revenue,
    stock,
    flow,
    rowCount: rows.length,
    arpa: accounts.size ? revenue / accounts.size : 0,
  }
}

export function monthlySeries(rows) {
  const map = new Map()
  for (const r of rows) {
    let m = map.get(r.tradeMonthTs)
    if (!m) {
      m = {
        ts: r.tradeMonthTs,
        date: r.tradeMonthDate,
        revenue: 0,
        accounts: new Set(),
        stock: 0,
        flow: 0,
      }
      for (const k of STREAM_KEYS) m[k] = 0
      map.set(r.tradeMonthTs, m)
    }
    m.revenue += r.trade_month_total
    m.accounts.add(r.account_id)
    m.stock += r.stockTotal
    m.flow += r.flowTotal
    for (const k of STREAM_KEYS) m[k] += r[k]
  }
  return [...map.values()]
    .sort((a, b) => a.ts - b.ts)
    .map((m) => ({
      ...m,
      activeAccounts: m.accounts.size,
      accounts: undefined,
    }))
}

export function periodGrowth(rows, allMonthTs) {
  const series = monthlySeries(rows)
  if (series.length < 2) {
    const total = series.reduce((s, m) => s + m.revenue, 0)
    return { total, growth: 0, series }
  }
  const last = series[series.length - 1]
  const prev = series[series.length - 2]
  const total = series.reduce((s, m) => s + m.revenue, 0)
  return {
    total,
    growth: growthRate(last.revenue, prev.revenue),
    lastRevenue: last.revenue,
    prevRevenue: prev.revenue,
    series,
    allMonthTs,
  }
}

export function stockFlowSplit(rows) {
  const series = monthlySeries(rows)
  let stock = 0
  let flow = 0
  for (const r of rows) {
    stock += r.stockTotal
    flow += r.flowTotal
  }
  const spark = series.map((m) => ({
    date: m.date,
    ts: m.ts,
    stock: m.stock,
    flow: m.flow,
    revenue: m.revenue,
  }))
  const total = stock + flow
  return {
    stock,
    flow,
    stockShare: total ? stock / total : 0,
    flowShare: total ? flow / total : 0,
    spark,
  }
}

export function usaNonUsa(rows) {
  const buckets = {
    usa: emptyGeoBucket('USA'),
    nonUsa: emptyGeoBucket('Non-USA'),
  }
  const months = new Set()
  const maxTs = rows.reduce((m, r) => Math.max(m, r.tradeMonthTs), -Infinity)

  for (const r of rows) {
    const b = r.isUsa ? buckets.usa : buckets.nonUsa
    b.revenue += r.trade_month_total
    b.accounts.add(r.account_id)
    b.stock += r.stockTotal
    b.flow += r.flowTotal
    b.multiSum += r.multiStreamCount
    b.rows += 1
    months.add(r.tradeMonthTs)
    if (r.tradeMonthTs === maxTs) b.activeAccounts.add(r.account_id)
    if (!b.byMonth.has(r.tradeMonthTs)) {
      b.byMonth.set(r.tradeMonthTs, { revenue: 0, accounts: new Set() })
    }
    const bm = b.byMonth.get(r.tradeMonthTs)
    bm.revenue += r.trade_month_total
    bm.accounts.add(r.account_id)
  }

  function finalize(b) {
    const accountCount = b.accounts.size
    const total = b.stock + b.flow
    const monthSeries = [...b.byMonth.entries()]
      .sort((a, c) => a[0] - c[0])
      .map(([ts, v]) => ({ ts, revenue: v.revenue, accounts: v.accounts.size }))
    const last = monthSeries[monthSeries.length - 1]
    const prev = monthSeries[monthSeries.length - 2]
    return {
      label: b.label,
      revenue: b.revenue,
      accountCount,
      arpa: accountCount ? b.revenue / accountCount : 0,
      stock: b.stock,
      flow: b.flow,
      stockShare: total ? b.stock / total : 0,
      flowShare: total ? b.flow / total : 0,
      multiStreamAvg: b.rows ? b.multiSum / b.rows : 0,
      activeRate: accountCount ? b.activeAccounts.size / accountCount : 0,
      growth: last && prev ? growthRate(last.revenue, prev.revenue) : 0,
    }
  }

  return { usa: finalize(buckets.usa), nonUsa: finalize(buckets.nonUsa) }
}

function emptyGeoBucket(label) {
  return {
    label,
    revenue: 0,
    accounts: new Set(),
    stock: 0,
    flow: 0,
    multiSum: 0,
    rows: 0,
    activeAccounts: new Set(),
    byMonth: new Map(),
  }
}

export function legalEntityContribution(rows) {
  const ind = { revenue: 0, accounts: new Set() }
  const legal = { revenue: 0, accounts: new Set() }
  for (const r of rows) {
    const b = r.is_legal_entity ? legal : ind
    b.revenue += r.trade_month_total
    b.accounts.add(r.account_id)
  }
  const indArpa = ind.accounts.size ? ind.revenue / ind.accounts.size : 0
  const legalArpa = legal.accounts.size ? legal.revenue / legal.accounts.size : 0
  const totalRev = ind.revenue + legal.revenue
  return {
    legalAccounts: legal.accounts.size,
    individualAccounts: ind.accounts.size,
    legalRevenue: legal.revenue,
    individualRevenue: ind.revenue,
    legalShare: totalRev ? legal.revenue / totalRev : 0,
    arpaMultiple: indArpa ? legalArpa / indArpa : 0,
    legalArpa,
    individualArpa: indArpa,
  }
}

export function paretoAccounts(rows, limit = 15) {
  const map = new Map()
  for (const r of rows) {
    map.set(r.account_id, (map.get(r.account_id) || 0) + r.trade_month_total)
  }
  const sorted = [...map.entries()]
    .map(([id, revenue]) => ({ id, label: id.slice(0, 8), revenue }))
    .sort((a, b) => b.revenue - a.revenue)
  const total = sorted.reduce((s, x) => s + x.revenue, 0)
  let cum = 0
  return sorted.slice(0, limit).map((x, i) => {
    cum += x.revenue
    return { ...x, rank: i + 1, share: total ? x.revenue / total : 0, cumShare: total ? cum / total : 0 }
  })
}

export function paretoCountries(rows, limit = 15) {
  const map = new Map()
  for (const r of rows) {
    const c = r.country_of_tax_residence
    let m = map.get(c)
    if (!m) {
      m = { country: c, revenue: 0, accounts: new Set() }
      map.set(c, m)
    }
    m.revenue += r.trade_month_total
    m.accounts.add(r.account_id)
  }
  const sorted = [...map.values()]
    .map((m) => ({
      id: m.country,
      label: m.country,
      revenue: m.revenue,
      accountCount: m.accounts.size,
      arpa: m.accounts.size ? m.revenue / m.accounts.size : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)
  const total = sorted.reduce((s, x) => s + x.revenue, 0)
  let cum = 0
  return sorted.slice(0, limit).map((x, i) => {
    cum += x.revenue
    return { ...x, rank: i + 1, share: total ? x.revenue / total : 0, cumShare: total ? cum / total : 0 }
  })
}

export function concentrationCallout(rows) {
  const accounts = paretoAccounts(rows, 1)
  const countries = paretoCountries(rows, 1)
  const topAccount = accounts[0]
  const topCountry = countries[0]
  if (!topAccount && !topCountry) return null
  if (!topAccount) return { type: 'country', ...topCountry }
  if (!topCountry) return { type: 'account', ...topAccount }
  // Prefer country if its share is higher or comparable; otherwise account
  if (topCountry.share >= topAccount.share) return { type: 'country', ...topCountry }
  return { type: 'account', ...topAccount }
}

export function countryRollup(rows) {
  const map = new Map()
  const byMonthCountry = new Map()

  for (const r of rows) {
    const c = r.country_of_tax_residence
    let m = map.get(c)
    if (!m) {
      m = {
        country: c,
        region: r.region,
        isUsa: r.isUsa,
        revenue: 0,
        accounts: new Set(),
        stock: 0,
        flow: 0,
        multiSum: 0,
        rows: 0,
        legalRev: 0,
        indRev: 0,
        streams: Object.fromEntries(STREAM_KEYS.map((k) => [k, 0])),
      }
      map.set(c, m)
    }
    m.revenue += r.trade_month_total
    m.accounts.add(r.account_id)
    m.stock += r.stockTotal
    m.flow += r.flowTotal
    m.multiSum += r.multiStreamCount
    m.rows += 1
    if (r.is_legal_entity) m.legalRev += r.trade_month_total
    else m.indRev += r.trade_month_total
    for (const k of STREAM_KEYS) m.streams[k] += r[k]

    const key = `${c}|${r.tradeMonthTs}`
    if (!byMonthCountry.has(key)) {
      byMonthCountry.set(key, { country: c, ts: r.tradeMonthTs, revenue: 0 })
    }
    byMonthCountry.get(key).revenue += r.trade_month_total
  }

  const list = [...map.values()].map((m) => ({
    country: m.country,
    region: m.region,
    isUsa: m.isUsa,
    revenue: m.revenue,
    accountCount: m.accounts.size,
    arpa: m.accounts.size ? m.revenue / m.accounts.size : 0,
    stock: m.stock,
    flow: m.flow,
    multiStreamAvg: m.rows ? m.multiSum / m.rows : 0,
    legalRev: m.legalRev,
    indRev: m.indRev,
    streams: m.streams,
  }))

  // growth from last two months per country
  const monthMap = new Map()
  for (const v of byMonthCountry.values()) {
    if (!monthMap.has(v.country)) monthMap.set(v.country, [])
    monthMap.get(v.country).push(v)
  }
  for (const item of list) {
    const series = (monthMap.get(item.country) || []).sort((a, b) => a.ts - b.ts)
    item.monthly = series
    if (series.length >= 2) {
      item.growth = growthRate(series[series.length - 1].revenue, series[series.length - 2].revenue)
    } else {
      item.growth = 0
    }
  }

  list.sort((a, b) => b.revenue - a.revenue)
  const total = list.reduce((s, x) => s + x.revenue, 0)
  const top5 = list.slice(0, 5).reduce((s, x) => s + x.revenue, 0)
  const top10 = list.slice(0, 10).reduce((s, x) => s + x.revenue, 0)

  return {
    countries: list,
    total,
    top5Share: total ? top5 / total : 0,
    top10Share: total ? top10 / total : 0,
    gini: giniCoefficient(list.map((c) => c.revenue)),
  }
}

export function giniCoefficient(values) {
  const arr = values.filter((v) => v >= 0).sort((a, b) => a - b)
  const n = arr.length
  if (n === 0) return 0
  const mean = arr.reduce((s, v) => s + v, 0) / n
  if (mean === 0) return 0
  let sumDiff = 0
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      sumDiff += Math.abs(arr[i] - arr[j])
    }
  }
  return sumDiff / (2 * n * n * mean)
}

export function multiStreamHistogram(rows) {
  const counts = Array.from({ length: 10 }, (_, i) => ({ count: i, accounts: 0, rows: 0 }))
  const seen = Array.from({ length: 10 }, () => new Set())
  for (const r of rows) {
    const c = Math.min(9, Math.max(0, r.multiStreamCount))
    counts[c].rows += 1
    seen[c].add(r.account_id)
  }
  for (let i = 0; i < 10; i++) counts[i].accounts = seen[i].size
  return counts
}

export function growthWaterfall(currentRows, previousRows) {
  const cur = Object.fromEntries(STREAM_KEYS.map((k) => [k, 0]))
  const prev = Object.fromEntries(STREAM_KEYS.map((k) => [k, 0]))
  let curTotal = 0
  let prevTotal = 0
  for (const r of currentRows) {
    curTotal += r.trade_month_total
    for (const k of STREAM_KEYS) cur[k] += r[k]
  }
  for (const r of previousRows) {
    prevTotal += r.trade_month_total
    for (const k of STREAM_KEYS) prev[k] += r[k]
  }

  const steps = [{ label: 'Previous', value: prevTotal, type: 'total', base: 0 }]
  let running = prevTotal
  for (const s of REVENUE_STREAMS) {
    const delta = cur[s.key] - prev[s.key]
    const base = delta >= 0 ? running : running + delta
    steps.push({
      label: s.label,
      key: s.key,
      value: delta,
      type: 'delta',
      base,
      color: s.color,
    })
    running += delta
  }
  steps.push({ label: 'Current', value: curTotal, type: 'total', base: 0 })
  return { steps, curTotal, prevTotal, delta: curTotal - prevTotal }
}

export function primarySourceTransitions(rows) {
  // For each account, order months and count transitions from primary A → B
  const byAccount = new Map()
  for (const r of rows) {
    if (!byAccount.has(r.account_id)) byAccount.set(r.account_id, [])
    byAccount.get(r.account_id).push(r)
  }
  const matrix = new Map()
  for (const list of byAccount.values()) {
    list.sort((a, b) => a.tradeMonthTs - b.tradeMonthTs)
    for (let i = 1; i < list.length; i++) {
      const from = list[i - 1].primarySource
      const to = list[i].primarySource
      const key = `${from}|${to}`
      matrix.set(key, (matrix.get(key) || 0) + 1)
    }
  }
  const sources = [...new Set([...matrix.keys()].flatMap((k) => k.split('|')))]
  return { matrix, sources }
}

export function negativeImpact(rows) {
  return REVENUE_STREAMS.map((s) => {
    let count = 0
    let amount = 0
    let affectedRevenue = 0
    for (const r of rows) {
      const v = r[s.key]
      if (v < 0) {
        count += 1
        amount += v
        affectedRevenue += r.trade_month_total
      }
    }
    const totalRev = rows.reduce((sum, r) => sum + r.trade_month_total, 0)
    return {
      key: s.key,
      label: s.label,
      group: s.group,
      count,
      amount,
      pctRevenueAffected: totalRev ? affectedRevenue / totalRev : 0,
    }
  })
}

function dimValue(row, dim) {
  switch (dim) {
    case 'entity':
      return row.is_legal_entity ? 'Legal Entity' : 'Individual'
    case 'age':
      return row.ageBand
    case 'geography':
      return row.isUsa ? 'USA' : 'Non-USA'
    case 'region':
      return row.region
    case 'tenure':
      return row.tenureBand
    default:
      return 'Other'
  }
}

export function crossTab(rows, rowDim, colDim, metric = 'revenue') {
  const cells = new Map()
  const rowKeys = new Set()
  const colKeys = new Set()

  for (const r of rows) {
    const rk = dimValue(r, rowDim)
    const ck = dimValue(r, colDim)
    rowKeys.add(rk)
    colKeys.add(ck)
    const key = `${rk}|${ck}`
    let cell = cells.get(key)
    if (!cell) {
      cell = { row: rk, col: ck, revenue: 0, accounts: new Set(), multiSum: 0, rows: 0 }
      cells.set(key, cell)
    }
    cell.revenue += r.trade_month_total
    cell.accounts.add(r.account_id)
    cell.multiSum += r.multiStreamCount
    cell.rows += 1
  }

  const orderedRows = orderDimKeys(rowDim, rowKeys)
  const orderedCols = orderDimKeys(colDim, colKeys)

  const data = []
  let maxVal = 0
  for (const rk of orderedRows) {
    for (const ck of orderedCols) {
      const cell = cells.get(`${rk}|${ck}`)
      let value = 0
      if (cell) {
        if (metric === 'revenue') value = cell.revenue
        else if (metric === 'arpa') value = cell.accounts.size ? cell.revenue / cell.accounts.size : 0
        else if (metric === 'multi') value = cell.rows ? cell.multiSum / cell.rows : 0
      }
      if (value > maxVal) maxVal = value
      data.push({
        row: rk,
        col: ck,
        value,
        revenue: cell?.revenue || 0,
        accountCount: cell?.accounts.size || 0,
      })
    }
  }
  return { data, rows: orderedRows, cols: orderedCols, maxVal, metric }
}

function orderDimKeys(dim, keySet) {
  if (dim === 'age') return AGE_BANDS.filter((b) => keySet.has(b))
  if (dim === 'tenure') return TENURE_BANDS.filter((b) => keySet.has(b))
  if (dim === 'entity') {
    return ['Individual', 'Legal Entity'].filter((b) => keySet.has(b))
  }
  if (dim === 'geography') {
    return ['USA', 'Non-USA'].filter((b) => keySet.has(b))
  }
  return [...keySet].sort()
}

export function streamBreakdown(rows) {
  const totals = Object.fromEntries(STREAM_KEYS.map((k) => [k, 0]))
  let total = 0
  for (const r of rows) {
    total += r.trade_month_total
    for (const k of STREAM_KEYS) totals[k] += r[k]
  }
  return REVENUE_STREAMS.map((s) => ({
    key: s.key,
    label: s.label,
    group: s.group,
    color: s.color,
    value: totals[s.key],
    share: total ? totals[s.key] / total : 0,
  }))
}

export function productCards(rows) {
  const months = monthlySeries(rows)
  const accountCount = new Set(rows.map((r) => r.account_id)).size
  const byAccountStream = new Map()

  for (const r of rows) {
    for (const k of STREAM_KEYS) {
      if ((r[k] || 0) === 0) continue
      const key = `${r.account_id}|${k}`
      byAccountStream.set(key, (byAccountStream.get(key) || 0) + r[k])
    }
  }

  return REVENUE_STREAMS.map((s) => {
    let contribution = 0
    let users = new Set()
    let userSum = 0
    for (const r of rows) {
      const v = r[s.key] || 0
      contribution += v
      if (v !== 0) {
        users.add(r.account_id)
        userSum += v
      }
    }
    const penetration = accountCount ? users.size / accountCount : 0
    const avgAmongUsers = users.size ? userSum / users.size : 0

    const spark = months.map((m) => ({
      date: m.date,
      ts: m.ts,
      value: m[s.key] || 0,
    }))

    // penetration trend: share of active accounts with non-zero stream per month
    const penSeries = months.map((m) => {
      let active = 0
      let withStream = 0
      // approximate from monthly series isn't enough; compute from rows
      return { ts: m.ts, value: 0 }
    })
    const monthPen = new Map()
    for (const r of rows) {
      let mp = monthPen.get(r.tradeMonthTs)
      if (!mp) {
        mp = { accounts: new Set(), withStream: new Set() }
        monthPen.set(r.tradeMonthTs, mp)
      }
      mp.accounts.add(r.account_id)
      if ((r[s.key] || 0) !== 0) mp.withStream.add(r.account_id)
    }
    const penTrend = [...monthPen.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([ts, mp]) => ({
        ts,
        value: mp.accounts.size ? mp.withStream.size / mp.accounts.size : 0,
      }))

    const slope = linearSlope(penTrend.map((p) => p.value))
    let status = 'Flat'
    if (slope > SLOPE_EPS) status = 'Growing'
    else if (slope < -SLOPE_EPS) status = 'Weak'

    // top contributing segment: age band by revenue
    const segMap = new Map()
    for (const r of rows) {
      const v = r[s.key] || 0
      if (!v) continue
      segMap.set(r.ageBand, (segMap.get(r.ageBand) || 0) + v)
    }
    let topSegment = '—'
    let topSegVal = -Infinity
    for (const [k, v] of segMap) {
      if (v > topSegVal) {
        topSegVal = v
        topSegment = k
      }
    }

    return {
      key: s.key,
      label: s.label,
      group: s.group,
      color: s.color,
      contribution,
      penetration,
      avgAmongUsers,
      spark,
      status,
      slope,
      topSegment,
      penTrend,
    }
  })
}

function linearSlope(values) {
  const n = values.length
  if (n < 2) return 0
  let sumX = 0
  let sumY = 0
  let sumXY = 0
  let sumXX = 0
  for (let i = 0; i < n; i++) {
    sumX += i
    sumY += values[i]
    sumXY += i * values[i]
    sumXX += i * i
  }
  const denom = n * sumXX - sumX * sumX
  if (denom === 0) return 0
  return (n * sumXY - sumX * sumY) / denom
}

export function productWorkspace(rows, streamKey) {
  const cards = productCards(rows)
  const card = cards.find((c) => c.key === streamKey)

  function breakdown(dimFn, labelFn) {
    const map = new Map()
    for (const r of rows) {
      const key = dimFn(r)
      let m = map.get(key)
      if (!m) m = { key, label: labelFn(key), accounts: new Set(), withStream: new Set(), sum: 0 }
      m.accounts.add(r.account_id)
      if ((r[streamKey] || 0) !== 0) {
        m.withStream.add(r.account_id)
        m.sum += r[streamKey]
      }
      map.set(key, m)
    }
    return [...map.values()]
      .map((m) => ({
        key: m.key,
        label: m.label,
        penetration: m.accounts.size ? m.withStream.size / m.accounts.size : 0,
        avg: m.withStream.size ? m.sum / m.withStream.size : 0,
        contribution: m.sum,
        accounts: m.withStream.size,
      }))
      .sort((a, b) => b.contribution - a.contribution)
  }

  const byGeo = breakdown(
    (r) => (r.isUsa ? 'USA' : 'Non-USA'),
    (k) => k,
  )
  const byEntity = breakdown(
    (r) => (r.is_legal_entity ? 'Legal Entity' : 'Individual'),
    (k) => k,
  )
  const byAge = breakdown(
    (r) => r.ageBand,
    (k) => k,
  )
  const byCountry = breakdown(
    (r) => r.country_of_tax_residence,
    (k) => k,
  ).slice(0, 20)

  // Pearson correlation of this stream vs others at account-month level
  const correlations = STREAM_KEYS.filter((k) => k !== streamKey).map((other) => {
    const xs = []
    const ys = []
    for (const r of rows) {
      xs.push(r[streamKey] || 0)
      ys.push(r[other] || 0)
    }
    return {
      key: other,
      label: STREAM_BY_KEY[other]?.label || other,
      color: STREAM_BY_KEY[other]?.color,
      correlation: pearson(xs, ys),
    }
  })
  correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))

  return { card, byGeo, byEntity, byAge, byCountry, correlations }
}

function pearson(xs, ys) {
  const n = xs.length
  if (n < 2) return 0
  let sx = 0
  let sy = 0
  for (let i = 0; i < n; i++) {
    sx += xs[i]
    sy += ys[i]
  }
  const mx = sx / n
  const my = sy / n
  let num = 0
  let dx = 0
  let dy = 0
  for (let i = 0; i < n; i++) {
    const a = xs[i] - mx
    const b = ys[i] - my
    num += a * b
    dx += a * a
    dy += b * b
  }
  const denom = Math.sqrt(dx * dy)
  return denom === 0 ? 0 : num / denom
}

export function tenureDistribution(rows) {
  const map = new Map()
  const accounts = new Map()
  for (const r of rows) {
    if (!accounts.has(r.account_id)) {
      accounts.set(r.account_id, r.tenure)
    }
  }
  for (const tenure of accounts.values()) {
    const band = tenure <= 1 ? '1' : tenure <= 3 ? '2–3' : tenure <= 6 ? '4–6' : tenure <= 9 ? '7–9' : '10+'
    map.set(band, (map.get(band) || 0) + 1)
  }
  return TENURE_BANDS.map((b) => ({ band: b, accounts: map.get(b) || 0 }))
}

export function activeRateTrend(rows, maxMonthTs) {
  // For each month: unique accounts that month / unique accounts ever seen up to that month (in filtered set)
  const byMonth = new Map()
  const firstSeen = new Map()
  for (const r of rows) {
    if (!byMonth.has(r.tradeMonthTs)) byMonth.set(r.tradeMonthTs, new Set())
    byMonth.get(r.tradeMonthTs).add(r.account_id)
    const prev = firstSeen.get(r.account_id)
    if (prev == null || r.tradeMonthTs < prev) firstSeen.set(r.account_id, r.tradeMonthTs)
  }
  const months = [...byMonth.keys()].sort((a, b) => a - b)
  const result = []
  const ever = new Set()
  for (const ts of months) {
    for (const [id, first] of firstSeen) {
      if (first <= ts) ever.add(id)
    }
    const active = byMonth.get(ts).size
    result.push({
      ts,
      date: new Date(ts),
      active,
      ever: ever.size,
      rate: ever.size ? active / ever.size : 0,
    })
  }
  return result
}

export function cohortRetention(rows, cohortDim = 'firstMonth') {
  // Cohort by first observed month (default), or age/country/entity of first row
  const accountMeta = new Map()
  for (const r of rows) {
    let m = accountMeta.get(r.account_id)
    if (!m || r.tradeMonthTs < m.firstTs) {
      accountMeta.set(r.account_id, {
        firstTs: r.firstMonthTs ?? r.tradeMonthTs,
        ageBand: r.ageBand,
        country: r.country_of_tax_residence,
        entity: r.is_legal_entity ? 'Legal Entity' : 'Individual',
        months: m?.months || new Set(),
      })
    }
    const cur = accountMeta.get(r.account_id)
    cur.months.add(r.tradeMonthTs)
  }

  function cohortKey(meta) {
    if (cohortDim === 'age') return meta.ageBand
    if (cohortDim === 'country') return meta.country
    if (cohortDim === 'entity') return meta.entity
    return meta.firstTs
  }

  const cohorts = new Map()
  for (const meta of accountMeta.values()) {
    const key = cohortKey(meta)
    if (!cohorts.has(key)) cohorts.set(key, [])
    cohorts.get(key).push(meta)
  }

  // Limit to top cohorts by size for readability
  const sortedCohorts = [...cohorts.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 8)

  const allMonthTs = [...new Set(rows.map((r) => r.tradeMonthTs))].sort((a, b) => a - b)

  return sortedCohorts.map(([key, members]) => {
    const size = members.length
    const points = []
    // relative month offsets from cohort start (for firstMonth) or absolute activity rate
    if (cohortDim === 'firstMonth') {
      const offsets = [0, 1, 2, 3, 4, 5, 6]
      for (const off of offsets) {
        let retained = 0
        for (const m of members) {
          const target = addMonthsTs(m.firstTs, off)
          if (m.months.has(target)) retained += 1
        }
        points.push({ offset: off, rate: size ? retained / size : 0, retained, size })
      }
      return {
        key,
        label: typeof key === 'number' ? new Date(key).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : String(key),
        size,
        points,
      }
    }
    for (const ts of allMonthTs) {
      let active = 0
      for (const m of members) {
        if (m.months.has(ts)) active += 1
      }
      points.push({
        ts,
        date: new Date(ts),
        rate: size ? active / size : 0,
        retained: active,
        size,
      })
    }
    return { key: String(key), label: String(key), size, points }
  })
}

function addMonthsTs(ts, months) {
  const d = new Date(ts)
  d.setMonth(d.getMonth() + months)
  return d.getTime()
}

/**
 * Opportunity gap matrix.
 * Rows: key segments (default non-USA individuals by age band)
 * Columns: secondary streams
 * Cell: penetration gap vs benchmark (default USA individuals)
 */
export function opportunityMatrix(rows, { benchmarkFilter, segmentBuilder } = {}) {
  const benchRows = benchmarkFilter
    ? rows.filter(benchmarkFilter)
    : rows.filter((r) => r.isUsa && !r.is_legal_entity)
  const segRows = segmentBuilder
    ? segmentBuilder(rows)
    : null

  // Default segments: non-USA individuals by age band
  const segments = []
  if (segRows) {
    // custom not used in default path
  }
  for (const band of AGE_BANDS.filter((b) => b !== 'Unknown')) {
    segments.push({
      id: `nonusa-ind-${band}`,
      label: `Non-USA Ind · ${band}`,
      filter: (r) => !r.isUsa && !r.is_legal_entity && r.ageBand === band,
    })
  }
  segments.push({
    id: 'nonusa-ind-all',
    label: 'Non-USA Individuals',
    filter: (r) => !r.isUsa && !r.is_legal_entity,
  })
  segments.push({
    id: 'nonusa-legal',
    label: 'Non-USA Legal',
    filter: (r) => !r.isUsa && r.is_legal_entity,
  })

  function penetration(subset, streamKey) {
    const accounts = new Set()
    const withStream = new Set()
    let sum = 0
    let userSum = 0
    for (const r of subset) {
      accounts.add(r.account_id)
      const v = r[streamKey] || 0
      if (v !== 0) {
        withStream.add(r.account_id)
        userSum += v
      }
      sum += v
    }
    const pen = accounts.size ? withStream.size / accounts.size : 0
    const avg = withStream.size ? userSum / withStream.size : 0
    return { pen, avg, accounts: accounts.size, users: withStream.size, sum }
  }

  const benchPen = Object.fromEntries(
    STREAM_KEYS.map((k) => [k, penetration(benchRows, k)]),
  )

  const cells = []
  const opportunities = []

  for (const seg of segments) {
    const subset = rows.filter(seg.filter)
    for (const s of REVENUE_STREAMS) {
      const segP = penetration(subset, s.key)
      const gap = benchPen[s.key].pen - segP.pen
      const incremental =
        gap > 0 && segP.accounts
          ? gap * segP.accounts * (benchPen[s.key].avg || segP.avg || 0)
          : 0
      const cell = {
        segmentId: seg.id,
        segmentLabel: seg.label,
        streamKey: s.key,
        streamLabel: s.label,
        color: s.color,
        segmentPen: segP.pen,
        benchPen: benchPen[s.key].pen,
        gap,
        incremental,
        segmentAccounts: segP.accounts,
      }
      cells.push(cell)
      if (incremental > 0) opportunities.push(cell)
    }
  }

  opportunities.sort((a, b) => b.incremental - a.incremental)

  return {
    segments: segments.map((s) => ({ id: s.id, label: s.label })),
    streams: REVENUE_STREAMS,
    cells,
    opportunities: opportunities.slice(0, 15),
    benchLabel: 'USA Individuals',
  }
}

export function previousEqualWindow(timeRange, allMonthTs) {
  if (!allMonthTs?.length) return { start: null, end: null }
  const sorted = [...allMonthTs].sort((a, b) => a - b)
  let start = timeRange?.start ?? sorted[0]
  let end = timeRange?.end ?? sorted[sorted.length - 1]
  const inRange = sorted.filter((t) => t >= start && t <= end)
  const len = inRange.length || 1
  const startIdx = sorted.indexOf(inRange[0] ?? sorted[0])
  const prevEndIdx = startIdx - 1
  if (prevEndIdx < 0) return { start: null, end: null }
  const prevStartIdx = Math.max(0, prevEndIdx - len + 1)
  return { start: sorted[prevStartIdx], end: sorted[prevEndIdx] }
}

export { STOCK_STREAMS, FLOW_STREAMS, STREAM_KEYS, REVENUE_STREAMS }
