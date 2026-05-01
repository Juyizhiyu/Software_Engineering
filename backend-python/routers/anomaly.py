from fastapi import APIRouter
from models.schemas import AnomalyRequest

router = APIRouter(prefix="/ai/anomaly", tags=["Anomaly"])

@router.post("/detect")
def detect_anomaly(request: AnomalyRequest):
    # 模拟异常检测
    return {"message": "No anomaly detected", "anomalies": []}
