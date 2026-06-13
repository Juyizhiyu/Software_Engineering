import request from './request'
import type { ApiResponse, LoginRequest, LoginResponse } from '@/types'

export function login(data: LoginRequest) {
  return request.post<unknown, ApiResponse<LoginResponse>>('/auth/login', data)
}
