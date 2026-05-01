from pydantic import BaseModel
from typing import List, Dict, Any, Optional


class AgentRequest(BaseModel):
    question: str
    context: Dict[str, Any]


class AgentResponse(BaseModel):
    answer: str
    summary: List[str]
    suggestions: List[str]
    evidence: List[Dict[str, Any]]
    charts: Optional[List[Dict[str, Any]]] = []
    metadata: Optional[Dict[str, Any]] = {}


class ForecastRequest(BaseModel):
    product_id: str
    history_data: List[Dict[str, Any]]


class AnomalyRequest(BaseModel):
    data_type: str
    data: List[Dict[str, Any]]


class RiskScoreRequest(BaseModel):
    supplier_id: str
    metrics: Dict[str, float]
