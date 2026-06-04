from fastapi import APIRouter
from models.schemas import RiskScoreRequest
from services.llm_client import load_llm_config
import json

router = APIRouter(prefix="/ai/risk", tags=["Risk Score"])


def _rule_score(metrics: dict) -> dict:
    """基于加权公式的风险评分"""
    weights = {
        "on_time_rate": 0.4,
        "quality_rate": 0.3,
        "price_stability": 0.2,
        "response_score": 0.1
    }

    breakdown = {}
    total = 0
    for key, weight in weights.items():
        value = float(metrics.get(key, 0))
        # 归一化：如果值 >1 则视为百分制
        if value > 1:
            value = value / 100
        contribution = value * weight
        breakdown[key] = round(contribution, 4)
        total += contribution

    score = round(total * 100, 1)

    if score >= 85:
        level = "Low"
    elif score >= 70:
        level = "Medium"
    elif score >= 60:
        level = "High"
    else:
        level = "Critical"

    return {
        "score": score,
        "risk_level": level,
        "breakdown": {k: round(v, 4) for k, v in breakdown.items()},
        "method": "weighted_formula"
    }


def _llm_risk_analysis(supplier_id: str, supplier_name: str, metrics: dict, config: dict) -> dict:
    """LLM 增强风险分析：生成建议和深度研判"""
    system_prompt = (
        "你是供应链风险管理专家。请基于供应商的履约指标进行风险评估。"
        "输出必须是纯 JSON 对象，字段包括："
        "risk_level (Critical/High/Medium/Low), "
        "recommendations (字符串数组，3条中文建议，每条30字以内), "
        "analysis (中文综合分析，100字以内)。"
        "不要输出 Markdown 代码块。"
    )

    prompt = json.dumps({
        "task": "supplier_risk_assessment",
        "supplier_id": supplier_id,
        "supplier_name": supplier_name,
        "metrics": metrics
    }, ensure_ascii=False)

    import urllib.request
    payload = json.dumps({
        "model": config["openai_model"],
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.3,
        "max_tokens": 1024
    }).encode("utf-8")

    request = urllib.request.Request(
        f"{config['openai_base_url']}/chat/completions",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {config['openai_api_key']}"
        },
        method="POST"
    )

    with urllib.request.urlopen(request, timeout=config["timeout"]) as response:
        body = json.loads(response.read().decode("utf-8"))

    output = body.get("choices", [{}])[0].get("message", {}).get("content", "{}")
    output = output.strip()
    try:
        result = json.loads(output)
    except json.JSONDecodeError:
        start = output.find("{")
        end = output.rfind("}")
        result = json.loads(output[start:end + 1]) if start >= 0 and end > start else {}

    return result


@router.post("/score")
def calculate_risk_score(request: RiskScoreRequest):
    config = load_llm_config()

    # 规则公式评分（确定性、可解释）
    rule_result = _rule_score(request.metrics)

    result = {
        "supplier_id": request.supplier_id,
        "supplier_name": request.supplier_name,
        "score": rule_result["score"],
        "risk_level": rule_result["risk_level"],
        "breakdown": rule_result["breakdown"],
        "recommendations": [],
        "metadata": {"mode": "rule", "method": rule_result["method"]}
    }

    # 如果有 API Key，用 LLM 生成建议
    if config["openai_api_key"]:
        try:
            llm = _llm_risk_analysis(
                request.supplier_id, request.supplier_name,
                request.metrics, config
            )
            result["recommendations"] = llm.get("recommendations", [])
            # LLM 的 risk_level 可作为参考，但评分仍以公式为准
            if llm.get("risk_level") and llm["risk_level"] != rule_result["risk_level"]:
                result["metadata"]["llm_risk_level"] = llm["risk_level"]
            result["metadata"]["mode"] = "llm_enhanced"
            result["metadata"]["model"] = config["openai_model"]
        except Exception:
            pass

    return result
