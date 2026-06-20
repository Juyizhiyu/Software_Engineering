import request from './request'
import type { ApiResponse, RiskCenterAnalysisFilters, RiskCenterAnalysisResponse, RiskItem } from '@/types'

export function getRisks() {
  return request.get<unknown, ApiResponse<RiskItem[]>>('/risks')
}

export function getRiskCenterAnalysis(params?: RiskCenterAnalysisFilters & { forceRefresh?: boolean }) {
  return request.get<unknown, ApiResponse<RiskCenterAnalysisResponse>>('/risks/analysis', { params })
}
