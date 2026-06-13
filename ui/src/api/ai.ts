import request from './request'
import type {
  ApiResponse,
  ChatRequest,
  ChatResponse,
  ForecastRequest,
  ForecastResponse,
  AnomalyRequest,
  AnomalyResponse,
  RiskScoreRequest,
  RiskScoreResponse,
  AiHealthData,
} from '@/types'

export function chatWithAssistant(data: ChatRequest) {
  return request.post<unknown, ApiResponse<ChatResponse>>('/assistant/chat', data)
}

export function forecastDemand(data: ForecastRequest) {
  return request.post<unknown, ApiResponse<ForecastResponse>>('/ai/forecast', data)
}

export function detectAnomaly(data: AnomalyRequest) {
  return request.post<unknown, ApiResponse<AnomalyResponse>>('/ai/anomaly', data)
}

export function scoreRisk(data: RiskScoreRequest) {
  return request.post<unknown, ApiResponse<RiskScoreResponse>>('/ai/risk-score', data)
}

export function getAiHealth() {
  return request.get<unknown, ApiResponse<AiHealthData>>('/ai/health')
}
