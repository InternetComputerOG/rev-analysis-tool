import Papa from 'papaparse'
import {
  STREAM_KEYS,
  parseTradeMonth,
  parseDob,
  computeAge,
  ageToBand,
  tenureToBand,
  getRegion,
  sumStock,
  sumFlow,
  multiStreamCount,
  primarySource,
  hasNegativeValues,
  normalizeLegalEntity,
  num,
} from './schema.js'

/**
 * Fetch and parse the revenue CSV, then enrich every row with derived fields.
 * @param {(stage: string) => void} [onProgress]
 * @returns {Promise<{ rows: object[], meta: object }>}
 */
export function loadRevenueData(onProgress = () => {}) {
  return new Promise((resolve, reject) => {
    onProgress('Fetching CSV…')

    fetch('/revenue-data.csv')
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch CSV (${res.status})`)
        onProgress('Parsing…')
        return res.text()
      })
      .then((csvText) => {
        // PapaParse worker:true hangs under Vite (never fires complete/error)
        Papa.parse(csvText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          worker: false,
          complete: (results) => {
            try {
              if (results.errors?.length && !results.data?.length) {
                reject(new Error(results.errors[0]?.message || 'CSV parse produced no rows'))
                return
              }
              onProgress('Enriching…')
              setTimeout(() => {
                try {
                  resolve(enrichRows(results.data))
                } catch (err) {
                  reject(err)
                }
              }, 0)
            } catch (err) {
              reject(err)
            }
          },
          error: (err) => reject(err instanceof Error ? err : new Error(String(err))),
        })
      })
      .catch((err) => reject(err instanceof Error ? err : new Error(String(err))))
  })
}

function enrichRows(rawRows) {
  const accountIndex = new Map()
  for (const raw of rawRows) {
    const id = raw.account_id
    if (!id) continue
    let info = accountIndex.get(id)
    if (!info) {
      info = { months: new Set(), monthTotals: [] }
      accountIndex.set(id, info)
    }
    const monthDate = parseTradeMonth(raw.trade_month)
    if (!monthDate) continue
    const ts = monthDate.getTime()
    info.months.add(ts)
    info.monthTotals.push({
      ts,
      total: num(raw.trade_month_total),
    })
  }

  for (const info of accountIndex.values()) {
    info.tenure = info.months.size
    info.tenureBand = tenureToBand(info.tenure)
    const sortedTs = [...info.months].sort((a, b) => a - b)
    info.firstMonthTs = sortedTs[0] ?? null
    info.lastMonthTs = sortedTs[sortedTs.length - 1] ?? null
    info.monthTotals.sort((a, b) => a.ts - b.ts)
    let running = 0
    info.cumulativeByTs = new Map()
    for (const mt of info.monthTotals) {
      running += mt.total
      info.cumulativeByTs.set(mt.ts, running)
    }
  }

  const rows = []
  let maxMonthTs = -Infinity
  const negativeByStream = Object.fromEntries(
    STREAM_KEYS.map((k) => [k, { count: 0, amount: 0 }]),
  )
  let missingDobIndividual = 0
  let missingDobLegal = 0
  const tenureDist = new Map()

  for (const raw of rawRows) {
    if (!raw.account_id) continue
    const tradeMonthDate = parseTradeMonth(raw.trade_month)
    if (!tradeMonthDate) continue

    const isLegal = normalizeLegalEntity(raw.is_legal_entity)
    const dobDate = parseDob(raw.date_of_birth)
    const age = computeAge(tradeMonthDate, dobDate)
    const ageBand = ageToBand(age)
    const country = String(raw.country_of_tax_residence || '').trim() || 'UNK'
    const info = accountIndex.get(raw.account_id)
    const ts = tradeMonthDate.getTime()
    if (ts > maxMonthTs) maxMonthTs = ts

    if (!dobDate) {
      if (isLegal) missingDobLegal += 1
      else missingDobIndividual += 1
    }

    const row = {
      account_id: raw.account_id,
      date_of_birth: raw.date_of_birth ?? null,
      country_of_tax_residence: country,
      is_legal_entity: isLegal,
      account_total_revenue: num(raw.account_total_revenue),
      trade_month: raw.trade_month,
      trade_month_total: num(raw.trade_month_total),
      retail_stock_pfof_revenue: num(raw.retail_stock_pfof_revenue),
      margin_interest_revenue: num(raw.margin_interest_revenue),
      non_retail_revenue: num(raw.non_retail_revenue),
      market_data_revenue: num(raw.market_data_revenue),
      stock_borrow_revenue: num(raw.stock_borrow_revenue),
      crypto_wallet_revenue: num(raw.crypto_wallet_revenue),
      cash_interest_revenue: num(raw.cash_interest_revenue),
      retail_options_pfof_revenue: num(raw.retail_options_pfof_revenue),
      fdic_sweep_alpaca_revenue: num(raw.fdic_sweep_alpaca_revenue),
      tradeMonthDate,
      tradeMonthTs: ts,
      age,
      ageBand,
      tenure: info?.tenure ?? 1,
      tenureBand: info?.tenureBand ?? '1',
      firstMonthTs: info?.firstMonthTs ?? ts,
      lastMonthTs: info?.lastMonthTs ?? ts,
      isUsa: country === 'USA',
      region: getRegion(country),
      stockTotal: 0,
      flowTotal: 0,
      multiStreamCount: 0,
      primarySource: 'None',
      cumulativeRevenueToDate: info?.cumulativeByTs?.get(ts) ?? num(raw.trade_month_total),
      hasNegative: false,
    }

    row.stockTotal = sumStock(row)
    row.flowTotal = sumFlow(row)
    row.multiStreamCount = multiStreamCount(row)
    row.primarySource = primarySource(row)
    row.hasNegative = hasNegativeValues(row)

    if (row.hasNegative) {
      for (const key of STREAM_KEYS) {
        const v = row[key]
        if (v < 0) {
          negativeByStream[key].count += 1
          negativeByStream[key].amount += v
        }
      }
    }

    rows.push(row)
  }

  for (const info of accountIndex.values()) {
    const t = info.tenure
    tenureDist.set(t, (tenureDist.get(t) || 0) + 1)
  }

  const uniqueAccounts = accountIndex.size
  const monthsObserved = [...tenureDist.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([months, accounts]) => ({ months, accounts }))

  const allMonths = [...new Set(rows.map((r) => r.tradeMonthTs))].sort((a, b) => a - b)

  const meta = {
    rowCount: rows.length,
    uniqueAccounts,
    missingDobIndividual,
    missingDobLegal,
    negativeByStream,
    monthsObserved,
    maxMonthTs,
    minMonthTs: allMonths[0] ?? null,
    allMonthTs: allMonths,
    countries: [...new Set(rows.map((r) => r.country_of_tax_residence))].sort(),
  }

  return { rows, meta }
}
