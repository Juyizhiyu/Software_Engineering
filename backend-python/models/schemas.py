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
    product_name: str = ""
    history_data: List[Dict[str, Any]]


class ForecastResponse(BaseModel):
    product_id: str
    product_name: str = ""
    forecast_demand_7d: float
    forecast_demand_30d: Optional[float] = None
    confidence: str = "medium"
    trend: str = "stable"
    analysis: str = ""
    metadata: Optional[Dict[str, Any]] = {}


class AnomalyRequest(BaseModel):
    data_type: str
    data: List[Dict[str, Any]]


class AnomalyItem(BaseModel):
    index: int
    severity: str = "medium"
    description: str = ""
    field: str = ""
    expected: Optional[Any] = None
    actual: Optional[Any] = None


class AnomalyResponse(BaseModel):
    data_type: str
    total_records: int
    anomalies: List[AnomalyItem] = []
    summary: str = ""
    metadata: Optional[Dict[str, Any]] = {}


class RiskScoreRequest(BaseModel):
    supplier_id: str
    supplier_name: str = ""
    metrics: Dict[str, float]


class RiskScoreResponse(BaseModel):
    supplier_id: str
    supplier_name: str = ""
    score: float
    risk_level: str
    breakdown: Dict[str, float] = {}
    recommendations: List[str] = []
    metadata: Optional[Dict[str, Any]] = {}
