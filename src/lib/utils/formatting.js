const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const currencyPrecise = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})

const compact = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

const numberFmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
const numberPrecise = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })

const monthFmt = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' })

export function formatCurrency(value, { precise = false } = {}) {
  const n = Number(value) || 0
  return precise ? currencyPrecise.format(n) : currency.format(n)
}

export function formatCompact(value) {
  return compact.format(Number(value) || 0)
}

export function formatPct(value, digits = 1) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return `${(n * 100).toFixed(digits)}%`
}

export function formatNumber(value, { precise = false } = {}) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return precise ? numberPrecise.format(n) : numberFmt.format(n)
}

export function formatMonth(tsOrDate) {
  if (tsOrDate == null) return '—'
  const d = tsOrDate instanceof Date ? tsOrDate : new Date(tsOrDate)
  if (Number.isNaN(d.getTime())) return '—'
  return monthFmt.format(d)
}

export function formatSignedCurrency(value) {
  const n = Number(value) || 0
  const abs = formatCurrency(Math.abs(n))
  if (n > 0) return `+${abs}`
  if (n < 0) return `−${abs.replace('$', '$')}`
  return abs
}

export function growthRate(current, previous) {
  if (previous == null || previous === 0) {
    if (current === 0) return 0
    return current > 0 ? 1 : -1
  }
  return (current - previous) / Math.abs(previous)
}
