import request from './request'
import type { ApiResponse, CostItem } from '@/types'

export function getCostsAnalysis() {
  return request.get<unknown, ApiResponse<CostItem[]>>('/costs/analysis')
}
