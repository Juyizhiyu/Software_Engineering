import request from './request'
import type { ApiResponse, DashboardSummary, DashboardOverview } from '@/types'

export function getDashboardSummary(params?: { region?: string; date?: string; category?: string }) {
  return request.get<unknown, ApiResponse<DashboardSummary>>('/dashboard/summary', { params })
}

export function getDashboardOverview() {
  return request.get<unknown, ApiResponse<DashboardOverview>>('/dashboard/overview')
}
