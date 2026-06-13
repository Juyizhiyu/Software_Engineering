import request from './request'
import type { ApiResponse, InventoryItem } from '@/types'

export function getInventoryAnalysis() {
  return request.get<unknown, ApiResponse<InventoryItem[]>>('/inventory/analysis')
}
