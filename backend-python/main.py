from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import agent, forecast, anomaly, risk_score
from services.llm_client import get_llm_status

app = FastAPI(title="Supply Chain BI AI Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(agent.router)
app.include_router(forecast.router)
app.include_router(anomaly.router)
app.include_router(risk_score.router)


@app.get("/")
def read_root():
    return {"message": "AI Service is running"}


@app.get("/health")
def health():
    status = get_llm_status()
    return {
        "status": "ok",
        "service": "python-ai",
        "llm_enabled": status["llm_enabled"],
        "model": status["model"]
    }
