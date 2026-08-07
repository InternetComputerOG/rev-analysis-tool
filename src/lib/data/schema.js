import { parse, isValid } from 'date-fns'

export const DATE_FORMAT = 'MMM d, yyyy'

export const REVENUE_STREAMS = [
  {
    key: 'retail_stock_pfof_revenue',
    label: 'Retail Stock PFOF',
    group: 'flow',
    color: 'var(--stream-stock-pfof)',
  },
  {
    key: 'retail_options_pfof_revenue',
    label: 'Retail Options PFOF',
    group: 'flow',
    color: 'var(--stream-options-pfof)',
  },
  {
    key: 'non_retail_revenue',
    label: 'Non-Retail',
    group: 'flow',
    color: 'var(--stream-non-retail)',
  },
  {
    key: 'market_data_revenue',
    label: 'Market Data',
    group: 'flow',
    color: 'var(--stream-market-data)',
  },
  {
    key: 'crypto_wallet_revenue',
    label: 'Crypto Wallet',
    group: 'flow',
    color: 'var(--stream-crypto)',
  },
  {
    key: 'margin_interest_revenue',
    label: 'Margin Interest',
    group: 'stock',
    color: 'var(--stream-margin)',
  },
  {
    key: 'cash_interest_revenue',
    label: 'Cash Interest',
    group: 'stock',
    color: 'var(--stream-cash)',
  },
  {
    key: 'fdic_sweep_alpaca_revenue',
    label: 'FDIC Sweep',
    group: 'stock',
    color: 'var(--stream-fdic)',
  },
  {
    key: 'stock_borrow_revenue',
    label: 'Stock Borrow',
    group: 'stock',
    color: 'var(--stream-borrow)',
  },
]

export const STREAM_KEYS = REVENUE_STREAMS.map((s) => s.key)

export const STOCK_STREAMS = REVENUE_STREAMS.filter((s) => s.group === 'stock').map((s) => s.key)
export const FLOW_STREAMS = REVENUE_STREAMS.filter((s) => s.group === 'flow').map((s) => s.key)

export const STREAM_BY_KEY = Object.fromEntries(REVENUE_STREAMS.map((s) => [s.key, s]))

export const AGE_BANDS = ['<25', '25–34', '35–44', '45–54', '55–64', '65+', 'Unknown']

export const TENURE_BANDS = ['1', '2–3', '4–6', '7–9', '10+']

export const REGIONS = [
  'North America',
  'Europe',
  'Latin America',
  'Middle East & Africa',
  'Asia-Pacific',
  'Other',
]

/** ISO-3 → region roll-up */
export const REGION_BY_COUNTRY = {
  // North America
  USA: 'North America',
  CAN: 'North America',
  BMU: 'North America',
  UMI: 'North America',
  // Europe
  AND: 'Europe',
  AUT: 'Europe',
  BEL: 'Europe',
  BGR: 'Europe',
  CHE: 'Europe',
  CYP: 'Europe',
  CZE: 'Europe',
  DEU: 'Europe',
  DNK: 'Europe',
  ESP: 'Europe',
  EST: 'Europe',
  FIN: 'Europe',
  FRA: 'Europe',
  GBR: 'Europe',
  GEO: 'Europe',
  GGY: 'Europe',
  GIB: 'Europe',
  GRC: 'Europe',
  HRV: 'Europe',
  HUN: 'Europe',
  IMN: 'Europe',
  IRL: 'Europe',
  ISL: 'Europe',
  ITA: 'Europe',
  JEY: 'Europe',
  LIE: 'Europe',
  LTU: 'Europe',
  LUX: 'Europe',
  LVA: 'Europe',
  MCO: 'Europe',
  MDA: 'Europe',
  MLT: 'Europe',
  MNE: 'Europe',
  NLD: 'Europe',
  NOR: 'Europe',
  POL: 'Europe',
  PRT: 'Europe',
  ROU: 'Europe',
  RUS: 'Europe',
  SVK: 'Europe',
  SVN: 'Europe',
  SWE: 'Europe',
  // Latin America
  ARG: 'Latin America',
  ATG: 'Latin America',
  BHS: 'Latin America',
  BLZ: 'Latin America',
  BOL: 'Latin America',
  BRB: 'Latin America',
  CHL: 'Latin America',
  COL: 'Latin America',
  CRI: 'Latin America',
  CUW: 'Latin America',
  CYM: 'Latin America',
  DOM: 'Latin America',
  ECU: 'Latin America',
  GTM: 'Latin America',
  GUY: 'Latin America',
  JAM: 'Latin America',
  KNA: 'Latin America',
  LCA: 'Latin America',
  MEX: 'Latin America',
  NIC: 'Latin America',
  PAN: 'Latin America',
  PER: 'Latin America',
  PRI: 'Latin America',
  PRY: 'Latin America',
  TTO: 'Latin America',
  URY: 'Latin America',
  VGB: 'Latin America',
  // Middle East & Africa
  ARE: 'Middle East & Africa',
  ARM: 'Middle East & Africa',
  BFA: 'Middle East & Africa',
  BHR: 'Middle East & Africa',
  EGY: 'Middle East & Africa',
  GHA: 'Middle East & Africa',
  IRQ: 'Middle East & Africa',
  ISR: 'Middle East & Africa',
  JOR: 'Middle East & Africa',
  KEN: 'Middle East & Africa',
  KWT: 'Middle East & Africa',
  LBN: 'Middle East & Africa',
  MAR: 'Middle East & Africa',
  MUS: 'Middle East & Africa',
  NAM: 'Middle East & Africa',
  NGA: 'Middle East & Africa',
  OMN: 'Middle East & Africa',
  QAT: 'Middle East & Africa',
  RWA: 'Middle East & Africa',
  SAU: 'Middle East & Africa',
  SYC: 'Middle East & Africa',
  TUR: 'Middle East & Africa',
  TZA: 'Middle East & Africa',
  UGA: 'Middle East & Africa',
  ZAF: 'Middle East & Africa',
  ZMB: 'Middle East & Africa',
  // Asia-Pacific
  AUS: 'Asia-Pacific',
  BGD: 'Asia-Pacific',
  CHN: 'Asia-Pacific',
  HKG: 'Asia-Pacific',
  IDN: 'Asia-Pacific',
  IND: 'Asia-Pacific',
  JPN: 'Asia-Pacific',
  KAZ: 'Asia-Pacific',
  KGZ: 'Asia-Pacific',
  KHM: 'Asia-Pacific',
  KOR: 'Asia-Pacific',
  LAO: 'Asia-Pacific',
  LKA: 'Asia-Pacific',
  MNG: 'Asia-Pacific',
  MYS: 'Asia-Pacific',
  NPL: 'Asia-Pacific',
  NZL: 'Asia-Pacific',
  PAK: 'Asia-Pacific',
  PHL: 'Asia-Pacific',
  PYF: 'Asia-Pacific',
  SGP: 'Asia-Pacific',
  THA: 'Asia-Pacific',
  TKM: 'Asia-Pacific',
  TWN: 'Asia-Pacific',
  UZB: 'Asia-Pacific',
  VNM: 'Asia-Pacific',
  WSM: 'Asia-Pacific',
}

export function parseTradeMonth(value) {
  if (!value) return null
  if (value instanceof Date) return isValid(value) ? value : null
  const d = parse(String(value), DATE_FORMAT, new Date())
  return isValid(d) ? d : null
}

export function parseDob(value) {
  if (value == null || value === '') return null
  if (value instanceof Date) return isValid(value) ? value : null
  const d = parse(String(value), DATE_FORMAT, new Date())
  return isValid(d) ? d : null
}

export function computeAge(tradeMonthDate, dobDate) {
  if (!tradeMonthDate || !dobDate) return null
  return tradeMonthDate.getFullYear() - dobDate.getFullYear()
}

export function ageToBand(age) {
  if (age == null || Number.isNaN(age)) return 'Unknown'
  if (age < 25) return '<25'
  if (age < 35) return '25–34'
  if (age < 45) return '35–44'
  if (age < 55) return '45–54'
  if (age < 65) return '55–64'
  return '65+'
}

export function tenureToBand(tenure) {
  if (tenure <= 1) return '1'
  if (tenure <= 3) return '2–3'
  if (tenure <= 6) return '4–6'
  if (tenure <= 9) return '7–9'
  return '10+'
}

export function getRegion(country) {
  return REGION_BY_COUNTRY[country] || 'Other'
}

export function sumStock(row) {
  return (
    (row.margin_interest_revenue || 0) +
    (row.cash_interest_revenue || 0) +
    (row.fdic_sweep_alpaca_revenue || 0) +
    (row.stock_borrow_revenue || 0)
  )
}

export function sumFlow(row) {
  return (
    (row.retail_stock_pfof_revenue || 0) +
    (row.retail_options_pfof_revenue || 0) +
    (row.non_retail_revenue || 0) +
    (row.market_data_revenue || 0) +
    (row.crypto_wallet_revenue || 0)
  )
}

export function multiStreamCount(row) {
  let n = 0
  for (const key of STREAM_KEYS) {
    if ((row[key] || 0) !== 0) n += 1
  }
  return n
}

export function primarySource(row) {
  let bestKey = null
  let bestAbs = -1
  let tie = false
  for (const key of STREAM_KEYS) {
    const abs = Math.abs(row[key] || 0)
    if (abs > bestAbs) {
      bestAbs = abs
      bestKey = key
      tie = false
    } else if (abs === bestAbs && abs > 0) {
      tie = true
    }
  }
  if (bestAbs <= 0) return 'None'
  if (tie) return 'Multiple'
  return bestKey
}

export function hasNegativeValues(row) {
  for (const key of STREAM_KEYS) {
    if ((row[key] || 0) < 0) return true
  }
  return false
}

export function normalizeLegalEntity(value) {
  if (typeof value === 'boolean') return value
  if (value == null) return false
  const s = String(value).trim().toUpperCase()
  return s === 'TRUE' || s === '1' || s === 'YES'
}

export function num(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (value == null || value === '') return 0
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}
