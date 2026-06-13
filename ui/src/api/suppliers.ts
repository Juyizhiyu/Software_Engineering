import request from './request'
import type { ApiResponse, SupplierItem } from '@/types'

export function getSuppliersPerformance() {
  return request.get<unknown, ApiResponse<SupplierItem[]>>('/suppliers/performance')
}
