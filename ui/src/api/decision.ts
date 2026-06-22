import request from './request'
import type { ApiResponse, DecisionAnalysisFilters, DecisionAnalysisResponse } from '@/types'

export function getDecisionAnalysis(params?: DecisionAnalysisFilters & { forceRefresh?: boolean }) {
  return request.get<unknown, ApiResponse<DecisionAnalysisResponse>>('/decision/analysis', { params })
}
