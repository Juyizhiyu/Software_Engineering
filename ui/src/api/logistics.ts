import request from './request'
import type { ApiResponse, LogisticsItem } from '@/types'

export function getLogisticsAnomalies() {
  return request.get<unknown, ApiResponse<LogisticsItem[]>>('/logistics/anomalies')
}
