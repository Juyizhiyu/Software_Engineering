export function formatCurrency(value) {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

export function formatNumber(value) {
  return new Intl.NumberFormat('zh-CN').format(Number(value || 0))
}

export function formatPercent(value) {
  return `${Number(value || 0).toFixed(1)}%`
}

export function levelTone(level) {
  if (level === 'Critical' || level === 'high') return 'danger'
  if (level === 'High' || level === 'medium') return 'warning'
  if (level === 'Medium') return 'accent'
  return 'success'
}
