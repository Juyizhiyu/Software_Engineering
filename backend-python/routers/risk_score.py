from fastapi import APIRouter
from models.schemas import RiskScoreRequest

router = APIRouter(prefix="/ai/risk", tags=["Risk Score"])

@router.post("/score")
def calculate_risk_score(request: RiskScoreRequest):
    # 模拟评分计算
    metrics = request.metrics
    score = (
        metrics.get("on_time_rate", 0) * 0.4 +
        metrics.get("quality_rate", 0) * 0.3 +
        metrics.get("price_stability", 0) * 0.2 +
        metrics.get("response_score", 0) * 0.1
    ) * 100
    
    level = "Critical"
    if score >= 85: level = "Low"
    elif score >= 70: level = "Medium"
    elif score >= 60: level = "High"

    return {"supplier_id": request.supplier_id, "score": score, "risk_level": level}
