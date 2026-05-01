from services.llm_client import generate_report


class AgentOrchestrator:
    def analyze(self, question: str, context: dict) -> dict:
        return generate_report(question, context)


orchestrator = AgentOrchestrator()
