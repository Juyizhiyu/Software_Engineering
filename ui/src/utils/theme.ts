/**
 * 主题工具 - 从 CSS 变量读取颜色，供 ECharts 等非 CSS 场景使用
 * 优先使用 Element Plus 提供的 CSS 变量，深色模式自动切换
 */

/** 读取单个 CSS 变量值 */
export function getCssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

/** Element Plus 主题色 */
export const themeColors = {
  primary: () => getCssVar('--el-color-primary'),
  success: () => getCssVar('--el-color-success'),
  warning: () => getCssVar('--el-color-warning'),
  danger: () => getCssVar('--el-color-danger'),
  info: () => getCssVar('--el-color-info'),
}

/** 文字颜色 */
export const textColors = {
  primary: () => getCssVar('--el-text-color-primary'),
  regular: () => getCssVar('--el-text-color-regular'),
  secondary: () => getCssVar('--el-text-color-secondary'),
  placeholder: () => getCssVar('--el-text-color-placeholder'),
}

/** 背景颜色 */
export const bgColors = {
  page: () => getCssVar('--el-bg-color-page'),
  card: () => getCssVar('--el-bg-color-overlay'),
  base: () => getCssVar('--el-bg-color'),
}

/** 边框颜色 */
export const borderColors = {
  base: () => getCssVar('--el-border-color'),
  light: () => getCssVar('--el-border-color-light'),
  lighter: () => getCssVar('--el-border-color-lighter'),
}

/** 风险等级颜色（映射到 Element Plus 语义色） */
export const riskLevelColors: Record<string, () => string> = {
  Critical: themeColors.danger,
  High: themeColors.warning,
  Medium: themeColors.primary,
  Low: themeColors.success,
}

/** 风险等级中文映射 */
export const riskLevelLabels: Record<string, string> = {
  Critical: '严重',
  High: '高危',
  Medium: '中等',
  Low: '低危',
}

/** 库存状态颜色 */
export const stockStatusColors: Record<string, () => string> = {
  shortage: themeColors.danger,
  warning: themeColors.warning,
  overstock: themeColors.primary,
  healthy: themeColors.success,
}

/** ECharts 通用 tooltip 配置 */
export function getChartTooltip() {
  return {
    backgroundColor: bgColors.card(),
    borderColor: borderColors.light(),
    textStyle: { color: textColors.primary() },
  }
}

/** ECharts 通用分割线样式 */
export function getChartSplitLine() {
  return { lineStyle: { color: borderColors.lighter() } }
}

/** ECharts 通用坐标轴标签样式 */
export function getChartAxisLabel() {
  return { color: textColors.regular(), fontSize: 11 }
}
