from fastapi import APIRouter
from models.schemas import AgentRequest, AgentResponse
from services.agent_orchestrator import orchestrator

router = APIRouter(prefix="/agent", tags=["Agent"])

@router.post("/analyze", response_model=AgentResponse)
def analyze_data(request: AgentRequest):
    result = orchestrator.analyze(request.question, request.context)
    return result
