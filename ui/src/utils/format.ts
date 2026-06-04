import dayjs from 'dayjs'

/** 格式化货币（人民币） */
export function formatCurrency(value: number): string {
  if (value >= 10000) {
    return `¥${(value / 10000).toFixed(1)}万`
  }
  return `¥${value.toLocaleString('zh-CN')}`
}

/** 格式化数字（千分位） */
export function formatNumber(value: number): string {
  return value.toLocaleString('zh-CN')
}

/** 格式化百分比 */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

/** 风险等级对应颜色 */
export function riskLevelColor(level: string): string {
  const map: Record<string, string> = {
    Critical: '#f56c6c',
    High: '#e6a23c',
    Medium: '#409eff',
    Low: '#67c23a',
  }
  return map[level] || '#909399'
}

/** 库存状态对应颜色 */
export function stockStatusColor(status: string): string {
  const map: Record<string, string> = {
    shortage: '#f56c6c',
    warning: '#e6a23c',
    overstock: '#409eff',
    healthy: '#67c23a',
  }
  return map[status] || '#909399'
}

/** 格式化日期 */
export function formatDate(date: string, format = 'YYYY-MM-DD HH:mm'): string {
  return dayjs(date).format(format)
}

/** 格式化大数字 */
export function formatLargeNumber(value: number): string {
  if (value >= 100000000) {
    return `${(value / 100000000).toFixed(1)}亿`
  }
  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)}万`
  }
  return value.toLocaleString('zh-CN')
}
