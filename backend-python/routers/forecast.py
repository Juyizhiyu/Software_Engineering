from fastapi import APIRouter
from models.schemas import ForecastRequest, ForecastResponse
from services.llm_client import load_llm_config
import json

router = APIRouter(prefix="/ai/forecast", tags=["Forecast"])


def _rule_forecast(product_id: str, product_name: str, history_data: list) -> dict:
    """规则引擎预测：基于历史数据的滑动平均"""
    if not history_data:
        return {
            "product_id": product_id,
            "product_name": product_name,
            "forecast_demand_7d": 0,
            "forecast_demand_30d": 0,
            "confidence": "low",
            "trend": "unknown",
            "analysis": "历史数据为空，无法进行预测",
            "metadata": {"mode": "rule", "method": "none"}
        }

    # 提取数值字段
    values = []
    for item in history_data:
        for key in ["amount", "quantity", "gmv", "unit_sold", "total_cost", "value"]:
            if key in item:
                try:
                    values.append(float(item[key]))
                except (ValueError, TypeError):
                    pass

    if not values:
        return {
            "product_id": product_id,
            "product_name": product_name,
            "forecast_demand_7d": round(sum(history[-1].values()) / len(history[-1]), 1) if history else 0,
            "forecast_demand_30d": 0,
            "confidence": "low",
            "trend": "unknown",
            "analysis": "无法从历史数据中提取有效数值",
            "metadata": {"mode": "rule", "method": "fallback"}
        }

    avg = sum(values) / len(values)
    recent_avg = sum(values[-min(7, len(values)):]) / min(7, len(values))
    weekly_avg = recent_avg * 7

    # 趋势判断
    if len(values) >= 4:
        first_half = sum(values[:len(values)//2]) / (len(values)//2)
        second_half = sum(values[len(values)//2:]) / (len(values) - len(values)//2)
        if second_half > first_half * 1.1:
            trend = "up"
            weekly_adjust = 1.15
        elif second_half < first_half * 0.9:
            trend = "down"
            weekly_adjust = 0.85
        else:
            trend = "stable"
            weekly_adjust = 1.0
    else:
        trend = "stable"
        weekly_adjust = 1.0

    forecast_7d = round(weekly_avg * weekly_adjust, 1)
    forecast_30d = round(forecast_7d * 4.3, 1)

    return {
        "product_id": product_id,
        "product_name": product_name,
        "forecast_demand_7d": forecast_7d,
        "forecast_demand_30d": forecast_30d,
        "confidence": "medium" if len(values) >= 10 else "low",
        "trend": trend,
        "analysis": f"基于 {len(values)} 条历史数据的滑动平均预测，趋势{trend}",
        "metadata": {"mode": "rule", "method": "moving_average"}
    }


def _llm_forecast(product_id: str, product_name: str, history_data: list, config: dict) -> dict:
    """LLM 增强预测 — 直接调用 API，返回纯净预测结果"""
    import urllib.request

    system_prompt = (
        "你是供应链需求预测专家。请基于历史销售数据预测未来7天和30天的需求。"
        "输出必须是纯 JSON 对象，字段包括："
        "forecast_demand_7d (数字), forecast_demand_30d (数字), "
        "confidence (low/medium/high), trend (up/down/stable), "
        "analysis (中文分析说明，50字以内)。"
        "不要输出 Markdown 代码块。"
    )

    user_msg = json.dumps({
        "task": "demand_forecast",
        "product_id": product_id,
        "product_name": product_name,
        "history_data": history_data[:20]
    }, ensure_ascii=False)

    payload = json.dumps({
        "model": config["openai_model"],
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_msg}
        ],
        "temperature": 0.2,
        "max_tokens": 1024
    }).encode("utf-8")

    req = urllib.request.Request(
        f"{config['openai_base_url']}/chat/completions",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {config['openai_api_key']}"
        },
        method="POST"
    )

    with urllib.request.urlopen(req, timeout=config["timeout"]) as resp:
        body = json.loads(resp.read().decode("utf-8"))

    output = body.get("choices", [{}])[0].get("message", {}).get("content", "{}")
    output = output.strip()
    try:
        result = json.loads(output)
    except json.JSONDecodeError:
        start = output.find("{")
        end = output.rfind("}")
        result = json.loads(output[start:end + 1]) if start >= 0 and end > start else {}

    result["product_id"] = product_id
    result["product_name"] = product_name
    result["metadata"] = {"mode": "llm", "model": config["openai_model"]}
    return result


@router.post("/demand")
def forecast_demand(request: ForecastRequest):
    config = load_llm_config()

    # 先用规则引擎做基线预测
    base = _rule_forecast(request.product_id, request.product_name, request.history_data)

    # 如果有 API Key，尝试 LLM 增强
    if config["openai_api_key"] and len(request.history_data) >= 3:
        try:
            llm_result = _llm_forecast(
                request.product_id, request.product_name,
                request.history_data, config
            )
            return {
                **base,
                **{k: v for k, v in llm_result.items() if k not in ("product_id", "product_name")},
                "metadata": {"mode": "llm", "model": config["openai_model"], "fallback_base": base}
            }
        except Exception:
            pass

    return base
