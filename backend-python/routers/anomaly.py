from fastapi import APIRouter
from models.schemas import AnomalyRequest, AnomalyResponse, AnomalyItem
from services.llm_client import load_llm_config
import json
import math

router = APIRouter(prefix="/ai/anomaly", tags=["Anomaly"])


def _rule_anomaly(data_type: str, data: list) -> dict:
    """规则引擎异常检测：基于统计离群值"""
    anomalies = []

    if not data:
        return {
            "data_type": data_type,
            "total_records": 0,
            "anomalies": [],
            "summary": "数据为空",
            "metadata": {"mode": "rule", "method": "none"}
        }

    # 找出所有数值字段
    numeric_fields = {}
    for item in data:
        for key, value in item.items():
            if isinstance(value, (int, float)) and not isinstance(value, bool):
                numeric_fields.setdefault(key, []).append(float(value))

    if not numeric_fields:
        return {
            "data_type": data_type,
            "total_records": len(data),
            "anomalies": [],
            "summary": "数据中无可分析的数值字段",
            "metadata": {"mode": "rule", "method": "no_numeric"}
        }

    # 对每个数值字段做 Z-score 检测
    found = []
    for field, values in numeric_fields.items():
        if len(values) < 4:
            continue
        mean = sum(values) / len(values)
        std = math.sqrt(sum((v - mean) ** 2 for v in values) / len(values))
        if std == 0:
            continue
        for idx, (v, item) in enumerate(zip(values, data)):
            z = abs((v - mean) / std)
            if z > 2.5:
                severity = "high" if z > 3.5 else "medium"
                found.append(AnomalyItem(
                    index=idx,
                    severity=severity,
                    description=f"字段 {field} 的值 {v} 偏离均值 {mean:.1f} ({z:.1f} 个标准差)",
                    field=field,
                    expected=round(mean, 2),
                    actual=v
                ))

    # 限制数量
    found.sort(key=lambda a: 0 if a.severity == "high" else 1)
    anomalies = found[:20]

    summary = f"在 {len(data)} 条 {data_type} 记录中检测到 {len(anomalies)} 个异常点"
    if any(a.severity == "high" for a in anomalies):
        summary += "，其中包含高严重度异常"

    return {
        "data_type": data_type,
        "total_records": len(data),
        "anomalies": [a.model_dump() for a in anomalies],
        "summary": summary,
        "metadata": {"mode": "rule", "method": "zscore"}
    }


def _llm_anomaly(data_type: str, data: list, config: dict) -> dict:
    """LLM 增强异常检测"""
    sample = data[:15]  # 限制上下文大小

    system_prompt = (
        "你是供应链异常检测专家。请分析数据找出异常点。"
        "输出必须是纯 JSON 对象，字段包括："
        "anomalies (数组，每项包含 index/severity/description/field/expected/actual), "
        "summary (中文摘要，100字以内)。"
        "severity 取 low/medium/high。"
        "只标出真正异常的数据点，不要过度标记。"
        "不要输出 Markdown 代码块。"
    )

    prompt = json.dumps({
        "task": "anomaly_detection",
        "data_type": data_type,
        "data_sample": sample
    }, ensure_ascii=False)

    import urllib.request
    payload = json.dumps({
        "model": config["openai_model"],
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.2,
        "max_tokens": 2048
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
    # Parse JSON from output
    output = output.strip()
    try:
        result = json.loads(output)
    except json.JSONDecodeError:
        start = output.find("{")
        end = output.rfind("}")
        result = json.loads(output[start:end + 1]) if start >= 0 and end > start else {}

    result["data_type"] = data_type
    result["total_records"] = len(data)
    result["metadata"] = {"mode": "llm", "model": config["openai_model"]}
    return result


@router.post("/detect")
def detect_anomaly(request: AnomalyRequest):
    config = load_llm_config()

    # 规则引擎检测作为基线
    base = _rule_anomaly(request.data_type, request.data)

    # 如果有 API Key 且数据量适中，尝试 LLM 增强
    if config["openai_api_key"] and 3 <= len(request.data) <= 30:
        try:
            llm_result = _llm_anomaly(request.data_type, request.data, config)
            # 合并结果，优先使用 LLM 的 anomalies
            llm_anomalies = llm_result.get("anomalies", [])
            if llm_anomalies:
                return {
                    **base,
                    "anomalies": llm_anomalies,
                    "summary": llm_result.get("summary", base["summary"]),
                    "metadata": {"mode": "llm", "model": config["openai_model"], "fallback_count": len(base["anomalies"])}
                }
        except Exception:
            pass

    return base
