import { computed, reactive, ref } from 'vue'
import { getDecisionAnalysis } from '@/api/decision'
import type { DecisionAnalysisFilters, DecisionAnalysisResponse, UserDashboardConfig } from '@/types'

const STORAGE_KEY = 'supply-chain-bi:decision-config'

export const defaultDecisionConfig: UserDashboardConfig = {
  dimension: 'overview',
  defaultFilters: {},
  compactMode: false,
  visibleModules: {
    metrics: true,
    salesTrend: true,
    riskMatrix: true,
    costBreakdown: true,
    suggestions: true,
  },
}

function readConfig(): UserDashboardConfig {
  if (typeof localStorage === 'undefined') return structuredClone(defaultDecisionConfig)
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return structuredClone(defaultDecisionConfig)
    const parsed = JSON.parse(raw) as Partial<UserDashboardConfig>
    return {
      ...structuredClone(defaultDecisionConfig),
      ...parsed,
      defaultFilters: {
        ...defaultDecisionConfig.defaultFilters,
        ...parsed.defaultFilters,
      },
      visibleModules: {
        ...defaultDecisionConfig.visibleModules,
        ...parsed.visibleModules,
      },
    }
  } catch {
    return structuredClone(defaultDecisionConfig)
  }
}

function writeConfig(config: UserDashboardConfig) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

export function useDecisionAnalysis() {
  const loading = ref(false)
  const error = ref('')
  const analysis = ref<DecisionAnalysisResponse | null>(null)
  const config = reactive<UserDashboardConfig>(readConfig())
  const filters = reactive<DecisionAnalysisFilters>({
    ...config.defaultFilters,
    dimension: config.dimension,
  })

  const visibleSuggestions = computed(() => analysis.value?.suggestions ?? [])
  const visibleMetrics = computed(() => analysis.value?.metrics ?? [])

  async function fetchAnalysis(customFilters: DecisionAnalysisFilters = {}, options: { forceRefresh?: boolean } = {}) {
    loading.value = true
    error.value = ''
    try {
      const params = {
        ...filters,
        ...customFilters,
        dimension: customFilters.dimension || filters.dimension || config.dimension,
        forceRefresh: options.forceRefresh || undefined,
      }
      const { data } = await getDecisionAnalysis(params)
      analysis.value = data
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '决策分析数据加载失败'
      console.error('Failed to fetch decision analysis:', err)
    } finally {
      loading.value = false
    }
  }

  function applyFilters(nextFilters: DecisionAnalysisFilters) {
    Object.assign(filters, nextFilters)
    config.dimension = filters.dimension || config.dimension
    config.defaultFilters = { ...filters }
    writeConfig(config)
    return fetchAnalysis()
  }

  function refreshAnalysis() {
    return fetchAnalysis({}, { forceRefresh: true })
  }

  function saveConfig(nextConfig?: Partial<UserDashboardConfig>) {
    if (nextConfig) {
      Object.assign(config, nextConfig)
      if (nextConfig.visibleModules) {
        config.visibleModules = {
          ...config.visibleModules,
          ...nextConfig.visibleModules,
        }
      }
    }
    config.defaultFilters = { ...filters }
    config.dimension = filters.dimension || config.dimension
    writeConfig(config)
  }

  function resetConfig() {
    Object.assign(config, structuredClone(defaultDecisionConfig))
    Object.keys(filters).forEach((key) => {
      delete filters[key as keyof DecisionAnalysisFilters]
    })
    Object.assign(filters, {
      ...config.defaultFilters,
      dimension: config.dimension,
    })
    writeConfig(config)
  }

  return {
    loading,
    error,
    analysis,
    filters,
    config,
    visibleMetrics,
    visibleSuggestions,
    fetchAnalysis,
    refreshAnalysis,
    applyFilters,
    saveConfig,
    resetConfig,
  }
}
