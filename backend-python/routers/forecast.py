from fastapi import APIRouter
from models.schemas import ForecastRequest

router = APIRouter(prefix="/ai/forecast", tags=["Forecast"])

@router.post("/demand")
def forecast_demand(request: ForecastRequest):
    # 模拟需求预测
    return {"product_id": request.product_id, "forecast_demand_7d": 150}
