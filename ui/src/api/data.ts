import request from './request'
import type { ApiResponse, EntityType, EntitySchema, EntityDataResponse } from '@/types'

export function getSchemas() {
  return request.get<unknown, ApiResponse<EntitySchema>>('/data/schemas')
}

export function getEntityData(entity: EntityType) {
  return request.get<unknown, ApiResponse<Record<string, unknown>[] | EntityDataResponse>>(`/data/${entity}`)
}

export function createEntityData(entity: EntityType, data: Record<string, unknown>) {
  return request.post<unknown, ApiResponse<unknown>>(`/data/${entity}`, data)
}
