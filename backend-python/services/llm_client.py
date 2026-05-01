import json
import urllib.error
import urllib.request
from pathlib import Path


DEFAULT_CONFIG = {
    "openai_api_key": "",
    "openai_model": "gpt-4.1-mini",
    "openai_base_url": "https://api.openai.com/v1"
}


def load_llm_config() -> dict:
    config_path = Path(__file__).resolve().parents[1] / "config.json"
    if not config_path.exists():
        return DEFAULT_CONFIG.copy()

    try:
        raw = json.loads(config_path.read_text(encoding="utf-8"))
    except Exception:
        return DEFAULT_CONFIG.copy()

    return {
        "openai_api_key": str(raw.get("openai_api_key", DEFAULT_CONFIG["openai_api_key"])).strip(),
        "openai_model": str(raw.get("openai_model", DEFAULT_CONFIG["openai_model"])).strip(),
        "openai_base_url": str(raw.get("openai_base_url", DEFAULT_CONFIG["openai_base_url"])).rstrip("/")
    }


def get_llm_status() -> dict:
    config = load_llm_config()
    return {
        "llm_enabled": bool(config["openai_api_key"]),
        "model": config["openai_model"],
        "base_url": config["openai_base_url"]
    }


def _safe_slice(items, limit=6):
    return items[:limit] if isinstance(items, list) else []


def _compact_context(context: dict) -> dict:
    summary = context.get("summary", {})
    overview = context.get("overview", {})
    datasets = context.get("datasets", {})

    return {
        "summary": summary,
        "overview": {
            "inventoryAlerts": _safe_slice(overview.get("inventoryAlerts", [])),
            "topSuppliers": _safe_slice(overview.get("topSuppliers", [])),
            "delayedRoutes": _safe_slice(overview.get("delayedRoutes", [])),
            "riskDistribution": _safe_slice(overview.get("riskDistribution", []), 4),
            "recentOrders": _safe_slice(overview.get("recentOrders", [])),
            "recordCounts": overview.get("recordCounts", {}),
        },
        "datasets": {
            "orders": _safe_slice(datasets.get("orders", [])),
            "inventory": _safe_slice(datasets.get("inventory", []), 10),
            "suppliers": _safe_slice(datasets.get("suppliers", []), 10),
            "logistics": _safe_slice(datasets.get("logistics", []), 10),
            "costs": _safe_slice(datasets.get("costs", []), 10),
            "risks": _safe_slice(datasets.get("risks", []), 10),
        }
    }


def _fallback_report(question: str, context: dict, reason: str) -> dict:
    datasets = context.get("datasets", {})
    inventory = datasets.get("inventory", [])
    logistics = datasets.get("logistics", [])
    risks = datasets.get("risks", [])
    suppliers = datasets.get("suppliers", [])

    low_stock = [item for item in inventory if float(item.get("currentStock", 0)) < float(item.get("safetyStock", 0))]
    delayed = [item for item in logistics if item.get("status") == "delayed"]
    open_risks = [item for item in risks if item.get("status") == "open"]
    weak_suppliers = [item for item in suppliers if float(item.get("compositeScore", 0)) < 80]

    return {
        "answer": f"当前返回的是本地规则分析结果。围绕“{question}”，系统检测到库存偏紧、运输延迟和供应商履约波动是当前最需要关注的方向。",
        "summary": [
            f"低于安全库存的记录共有 {len(low_stock)} 条。",
            f"存在 {len(delayed)} 条延迟运输任务，需要跟踪承运商与到货时间。",
            f"共有 {len(open_risks)} 条开放风险，且 {len(weak_suppliers)} 家供应商综合评分偏低。"
        ],
        "suggestions": [
            "优先对低于安全库存的核心产品发起补货或调拨。",
            "将延迟线路纳入重点监控，必要时启用备选物流方案。",
            "对评分偏低的供应商启动履约复盘并评估二供方案。"
        ],
        "evidence": [
            {"type": "inventory", "object": "low_stock_count", "value": len(low_stock)},
            {"type": "logistics", "object": "delayed_shipments", "value": len(delayed)},
            {"type": "risk", "object": "open_risks", "value": len(open_risks)},
            {"type": "supplier", "object": "weak_suppliers", "value": len(weak_suppliers)}
        ],
        "charts": [],
        "metadata": {
            "mode": "fallback",
            "reason": reason,
            "model": None
        }
    }


def _extract_json(text: str) -> dict:
    text = text.strip()
    if not text:
        raise ValueError("Empty LLM output")

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}")
        if start >= 0 and end > start:
            return json.loads(text[start:end + 1])
        raise


def _call_openai(question: str, context: dict, config: dict) -> dict:
    compact_context = _compact_context(context)
    prompt = {
        "question": question,
        "context": compact_context
    }

    instructions = (
        "你是企业供应链分析助手。"
        "请严格基于给定数据做分析，不要虚构不存在的数据。"
        "输出必须是 JSON 对象，字段包括 answer、summary、suggestions、evidence、charts。"
        "summary 和 suggestions 分别输出 3 条以内中文短句。"
        "evidence 为数组，每项包含 type、object、value。"
        "charts 为数组，可为空。"
        "不要输出 Markdown 代码块。"
    )

    payload = json.dumps({
        "model": config["openai_model"],
        "instructions": instructions,
        "input": [
            {
                "role": "user",
                "content": json.dumps(prompt, ensure_ascii=False)
            }
        ],
        "store": False,
        "text": {
            "format": {
                "type": "text"
            }
        }
    }).encode("utf-8")

    request = urllib.request.Request(
        f"{config['openai_base_url']}/responses",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {config['openai_api_key']}"
        },
        method="POST"
    )

    with urllib.request.urlopen(request, timeout=45) as response:
        body = json.loads(response.read().decode("utf-8"))

    output_text = body.get("output_text")
    if not output_text:
        output = body.get("output", [])
        parts = []
        for item in output:
            if item.get("type") == "message":
                for content in item.get("content", []):
                    if content.get("type") == "output_text":
                        parts.append(content.get("text", ""))
        output_text = "\n".join(parts)

    result = _extract_json(output_text)
    result["metadata"] = {
        "mode": "openai",
        "model": body.get("model", config["openai_model"]),
        "response_id": body.get("id")
    }
    return result


def generate_report(question: str, context: dict) -> dict:
    config = load_llm_config()
    if not config["openai_api_key"]:
        return _fallback_report(question, context, "config.json is missing openai_api_key")

    try:
        return _call_openai(question, context, config)
    except urllib.error.HTTPError as error:
        message = error.read().decode("utf-8", errors="ignore")
        return _fallback_report(question, context, f"HTTPError: {message}")
    except Exception as error:
        return _fallback_report(question, context, f"{type(error).__name__}: {error}")
