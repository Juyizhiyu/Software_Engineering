import request from './request'
import type { ApiResponse, OperationsSnapshot } from '@/types'

export function getOperationsSnapshot() {
  return request.get<unknown, ApiResponse<OperationsSnapshot>>('/operations/snapshot')
}
