import request from './request'
import type { ApiResponse, RiskItem } from '@/types'

export function getRisks() {
  return request.get<unknown, ApiResponse<RiskItem[]>>('/risks')
}
