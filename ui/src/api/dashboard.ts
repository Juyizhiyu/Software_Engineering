import request from './request'
import type { ApiResponse, DashboardSummary, DashboardOverview } from '@/types'

export interface DashboardFilters {
  region?: string
  date?: string
  category?: string
}

export function getDashboardSummary(params?: DashboardFilters) {
  return request.get<unknown, ApiResponse<DashboardSummary>>('/dashboard/summary', { params })
}

export function getDashboardOverview(params?: DashboardFilters) {
  return request.get<unknown, ApiResponse<DashboardOverview>>('/dashboard/overview', { params })
}
