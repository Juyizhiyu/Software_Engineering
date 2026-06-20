"""
Supply Chain BI — AI Service (stdlib only, zero deps)
Usage: python main.py [--port 8000]
"""
import json
import math
import urllib.request
import urllib.error
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse
import sys
import os

ROOT = Path(__file__).resolve().parent
CONFIG_PATH = ROOT / "config.json"

# ── Config ────────────────────────────────────────────
def load_config():
    defaults = {
        "openai_api_key": "",
        "openai_model": "gpt-4.1-mini",
        "openai_base_url": "https://api.openai.com/v1",
        "api_style": "chat_completions",
        "timeout": 45,
        "max_retries": 1,
        "fallback_enabled": True,
        "fallback_log_level": "warning"
    }
    if not CONFIG_PATH.exists():
        return defaults
    try:
        raw = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    except Exception:
        return defaults
    return {
        "openai_api_key": str(raw.get("openai_api_key", "")).strip(),
        "openai_model": str(raw.get("openai_model", "gpt-4.1-mini")).strip(),
        "openai_base_url": str(raw.get("openai_base_url", "https://api.openai.com/v1")).rstrip("/"),
        "api_style": str(raw.get("api_style", "chat_completions")).strip(),
        "timeout": int(raw.get("timeout", 45)),
        "max_retries": int(raw.get("max_retries", 1)),
        "fallback_enabled": bool(raw.get("fallback_enabled", True)),
        "fallback_log_level": str(raw.get("fallback_log_level", "warning"))
    }


# ── DeepSeek / OpenAI Chat Completions ────────────────
def call_llm(system_prompt: str, user_prompt: str, temperature=0.3, max_tokens=2048) -> str:
    """Call Chat Completions API, return raw text output."""
    config = load_config()
    payload = json.dumps({
        "model": config["openai_model"],
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": temperature,
        "max_tokens": max_tokens
    }).encode("utf-8")

    for attempt in range(config["max_retries"] + 1):
        try:
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
            return body.get("choices", [{}])[0].get("message", {}).get("content", "")
        except Exception as e:
            if attempt >= config["max_retries"]:
                raise
    return ""


def extract_json(text: str) -> dict:
    """Robust JSON extraction from LLM output."""
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        s = text.find("{")
        e = text.rfind("}")
        if s >= 0 and e > s:
            return json.loads(text[s:e + 1])
        return {}


def llm_available() -> bool:
    config = load_config()
    return bool(config["openai_api_key"])


# ── Agent / Analyze ───────────────────────────────────
def _safe_slice(items, limit=6):
    return items[:limit] if isinstance(items, list) else []


def _compact_context(ctx: dict) -> dict:
    overview = ctx.get("overview", {})
    datasets = ctx.get("datasets", {})
    return {
        "summary": ctx.get("summary", {}),
        "overview": {
            "inventoryAlerts": _safe_slice(overview.get("inventoryAlerts", [])),
            "topSuppliers": _safe_slice(overview.get("topSuppliers", [])),
            "riskDistribution": _safe_slice(overview.get("riskDistribution", []), 4),
            "recentOrders": _safe_slice(overview.get("recentOrders", [])),
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


def fallback_report(question: str, ctx: dict, reason: str) -> dict:
    datasets = ctx.get("datasets", {})
    inventory = datasets.get("inventory", [])
    logistics = datasets.get("logistics", [])
    risks = datasets.get("risks", [])
    suppliers = datasets.get("suppliers", [])
    low_stock = [i for i in inventory if float(i.get("currentStock", 0)) < float(i.get("safetyStock", 0))]
    delayed = [i for i in logistics if i.get("status") == "delayed"]
    open_risks = [i for i in risks if i.get("status") == "open"]
    weak = [i for i in suppliers if float(i.get("compositeScore", 0)) < 80]
    return {
        "answer": f"当前分析基于本地规则引擎。「{question}」——检测到库存偏紧、运输延迟和供应商履约波动是主要关注点。",
        "summary": [
            f"低于安全库存的记录 {len(low_stock)} 条",
            f"延迟运输任务 {len(delayed)} 条",
            f"开放风险 {len(open_risks)} 个，低评分供应商 {len(weak)} 家"
        ],
        "suggestions": [
            "优先对低于安全库存的核心产品发起补货",
            "将延迟线路纳入重点监控，启用备选物流",
            "对低评分供应商启动履约复盘"
        ],
        "evidence": [
            {"type": "inventory", "object": "low_stock", "value": len(low_stock)},
            {"type": "logistics", "object": "delayed", "value": len(delayed)},
            {"type": "risk", "object": "open_risks", "value": len(open_risks)},
            {"type": "supplier", "object": "weak", "value": len(weak)}
        ],
        "charts": [],
        "metadata": {"mode": "fallback", "reason": reason}
    }


def agent_analyze(question: str, ctx: dict) -> dict:
    if not llm_available():
        return fallback_report(question, ctx, "API key not configured")

    compact = _compact_context(ctx)
    system = (
        "你是企业供应链分析助手。严格基于给定数据做分析，不虚构数据。"
        "输出纯 JSON：{answer, summary, suggestions, evidence, charts}。"
        "summary/suggestions 各 3 条以内中文短句。"
        "evidence 数组每项 {type, object, value}。charts 可为空数组。"
        "不要输出 Markdown 代码块。"
    )
    user = json.dumps({"question": question, "context": compact}, ensure_ascii=False)

    try:
        text = call_llm(system, user, temperature=0.3, max_tokens=2048)
        result = extract_json(text)
        result["metadata"] = {"mode": "llm", "model": load_config()["openai_model"]}
        return result
    except Exception as e:
        return fallback_report(question, ctx, str(e))


# ── Forecast ──────────────────────────────────────────
def forecast_demand(product_id: str, product_name: str, history: list) -> dict:
    values = []
    for item in history:
        value = None
        for key in ["quantity", "unit_sold", "demand", "sales_qty"]:
            if key in item:
                try:
                    value = float(item[key])
                    break
                except (ValueError, TypeError):
                    pass
        if value is not None and value >= 0:
            values.append(value)

    if not values:
        return {
            "product_id": product_id, "product_name": product_name,
            "forecast_demand_7d": 0, "forecast_demand_30d": 0,
            "confidence": "low", "trend": "unknown",
            "analysis": "历史销量数据不足", "metadata": {"mode": "rule", "method": "quantity_moving_average"}
        }

    recent = values[-min(7, len(values)):]
    recent_daily_avg = sum(recent) / len(recent)
    daily_avg = sum(values) / len(values)

    trend = "stable"
    if len(values) >= 8:
        mid = len(values) // 2
        first = sum(values[:mid]) / mid
        second = sum(values[mid:]) / (len(values) - mid)
        if second > first * 1.12: trend = "up"
        elif second < first * 0.88: trend = "down"

    adj = {"up": 1.08, "down": 0.92, "stable": 1.0}[trend]
    f7 = round(recent_daily_avg * 7 * adj, 1)
    f30 = round(f7 * 4.3, 1)
    lower = f7 * 0.65
    upper = f7 * 1.45

    base = {
        "product_id": product_id, "product_name": product_name,
        "forecast_demand_7d": f7, "forecast_demand_30d": f30,
        "confidence": "medium" if len(values) >= 10 else "low",
        "trend": trend,
        "analysis": f"基于 {len(values)} 条销量历史的滑动平均预测，历史日均{daily_avg:.1f}，最近7日均{recent_daily_avg:.1f}，趋势{trend}",
        "metadata": {"mode": "rule", "method": "quantity_moving_average"}
    }

    if llm_available() and len(history) >= 3:
        try:
            sys_prompt = (
                "你是供应链需求预测专家。只能基于历史销量 quantity/unit_sold 预测7天/30天需求。"
                "输出纯 JSON：{forecast_demand_7d, forecast_demand_30d, confidence, trend, analysis}。"
                "预测值必须贴近历史销量基线，不能把GMV、金额或成本当成销量。analysis 50字以内中文。"
            )
            user_prompt = json.dumps({
                "product_id": product_id,
                "product_name": product_name,
                "history": history[:30],
                "baseline_forecast_7d": f7,
                "allowed_forecast_7d_range": [round(lower, 1), round(upper, 1)]
            }, ensure_ascii=False)
            text = call_llm(sys_prompt, user_prompt, temperature=0.2, max_tokens=1024)
            llm_r = extract_json(text)
            llm_7d = float(llm_r.get("forecast_demand_7d", 0))
            if lower <= llm_7d <= upper:
                for k in ("forecast_demand_7d", "forecast_demand_30d", "confidence", "trend", "analysis"):
                    if k in llm_r: base[k] = llm_r[k]
                base["metadata"] = {
                    "mode": "llm",
                    "model": load_config()["openai_model"],
                    "sanity_check": "passed",
                    "baseline_forecast_demand_7d": f7
                }
            else:
                base["metadata"] = {
                    "mode": "rule",
                    "method": "quantity_moving_average",
                    "sanity_check": "adjusted",
                    "raw_forecast_demand_7d": llm_7d,
                    "baseline_forecast_demand_7d": f7,
                    "reason": "llm_forecast_out_of_history_bounds"
                }
        except Exception:
            pass

    return base


# ── Anomaly Detection ─────────────────────────────────
def detect_anomaly(data_type: str, data: list) -> dict:
    if not data:
        return {"data_type": data_type, "total_records": 0, "anomalies": [], "summary": "数据为空", "metadata": {"mode": "rule"}}

    numeric = {}
    for item in data:
        for k, v in item.items():
            if isinstance(v, (int, float)) and not isinstance(v, bool):
                numeric.setdefault(k, []).append(float(v))

    found = []
    for field, vals in numeric.items():
        if len(vals) < 4: continue
        mean = sum(vals) / len(vals)
        std = math.sqrt(sum((v - mean) ** 2 for v in vals) / len(vals))
        if std == 0: continue
        for i, (v, item) in enumerate(zip(vals, data)):
            z = abs((v - mean) / std)
            if z > 2.5:
                found.append({
                    "index": i, "severity": "high" if z > 3.5 else "medium",
                    "description": f"字段 {field} 值 {v} 偏离均值 {mean:.1f} ({z:.1f}σ)",
                    "field": field, "expected": round(mean, 2), "actual": v
                })

    found.sort(key=lambda a: 0 if a["severity"] == "high" else 1)
    anomalies = found[:20]
    summary = f"检测 {len(data)} 条 {data_type} 记录，发现 {len(anomalies)} 个异常"
    if any(a["severity"] == "high" for a in anomalies): summary += "，含高严重度异常"

    base = {"data_type": data_type, "total_records": len(data), "anomalies": anomalies, "summary": summary, "metadata": {"mode": "rule"}}

    if llm_available() and 3 <= len(data) <= 30:
        try:
            sys_prompt = (
                "你是供应链异常检测专家。找出真正的异常点，不要过度标记。"
                "输出纯 JSON：{anomalies: [{index, severity, description, field, expected, actual}], summary}。"
                "severity: low/medium/high。summary 100字以内中文。"
            )
            user_prompt = json.dumps({"data_type": data_type, "data": data[:15]}, ensure_ascii=False)
            text = call_llm(sys_prompt, user_prompt, temperature=0.2, max_tokens=2048)
            llm_r = extract_json(text)
            if llm_r.get("anomalies"): base["anomalies"] = llm_r["anomalies"]
            if llm_r.get("summary"): base["summary"] = llm_r["summary"]
            base["metadata"] = {"mode": "llm", "model": load_config()["openai_model"]}
        except Exception:
            pass

    return base


# ── Risk Score ────────────────────────────────────────
def calc_risk_score(supplier_id: str, supplier_name: str, metrics: dict) -> dict:
    weights = {"on_time_rate": 0.4, "quality_rate": 0.3, "price_stability": 0.2, "response_score": 0.1}
    breakdown = {}
    total = 0
    for k, w in weights.items():
        v = float(metrics.get(k, 0))
        if v > 1: v /= 100
        breakdown[k] = round(v * w, 4)
        total += v * w
    score = round(total * 100, 1)

    if score >= 85: level = "Low"
    elif score >= 70: level = "Medium"
    elif score >= 60: level = "High"
    else: level = "Critical"

    result = {
        "supplier_id": supplier_id, "supplier_name": supplier_name,
        "score": score, "risk_level": level, "breakdown": breakdown,
        "recommendations": [], "metadata": {"mode": "rule"}
    }

    if llm_available():
        try:
            sys_prompt = (
                "你是供应链风险管理专家。基于供应商指标输出风险评估。"
                "输出纯 JSON：{risk_level, recommendations: [3条中文建议], analysis}。"
                "risk_level: Critical/High/Medium/Low。每条建议30字以内。analysis 100字以内。"
            )
            user_prompt = json.dumps({"supplier_id": supplier_id, "supplier_name": supplier_name, "metrics": metrics}, ensure_ascii=False)
            text = call_llm(sys_prompt, user_prompt, temperature=0.3, max_tokens=1024)
            llm_r = extract_json(text)
            if llm_r.get("recommendations"): result["recommendations"] = llm_r["recommendations"]
            result["metadata"] = {"mode": "llm", "model": load_config()["openai_model"]}
        except Exception:
            pass

    return result


# ── HTTP Server ───────────────────────────────────────
class AIHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        print(f"[{self.log_date_time_string()}] {args[0]}", flush=True)

    def _send_json(self, data: dict, status=200):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", len(body))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def _read_body(self) -> dict:
        length = int(self.headers.get("Content-Length", 0))
        if length == 0:
            return {}
        raw = self.rfile.read(length)
        return json.loads(raw)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/health" or path == "/":
            config = load_config()
            self._send_json({
                "status": "ok", "service": "python-ai-stdlib",
                "llm_enabled": bool(config["openai_api_key"]),
                "model": config["openai_model"]
            })
        else:
            self._send_json({"error": "not found"}, 404)

    def do_POST(self):
        path = urlparse(self.path).path
        try:
            body = self._read_body()
        except Exception:
            self._send_json({"error": "invalid JSON"}, 400)
            return

        try:
            if path == "/agent/analyze":
                result = agent_analyze(body.get("question", ""), body.get("context", {}))
            elif path == "/ai/forecast/demand":
                result = forecast_demand(
                    body.get("product_id", ""), body.get("product_name", ""),
                    body.get("history_data", [])
                )
            elif path == "/ai/anomaly/detect":
                result = detect_anomaly(body.get("data_type", ""), body.get("data", []))
            elif path == "/ai/risk/score":
                result = calc_risk_score(
                    body.get("supplier_id", ""), body.get("supplier_name", ""),
                    body.get("metrics", {})
                )
            else:
                self._send_json({"error": f"unknown endpoint: {path}"}, 404)
                return
            self._send_json(result)
        except Exception as e:
            self._send_json({"error": str(e), "metadata": {"mode": "error"}}, 500)


def main():
    port = 8000
    for i, arg in enumerate(sys.argv):
        if arg == "--port" and i + 1 < len(sys.argv):
            port = int(sys.argv[i + 1])
        elif arg.startswith("--port="):
            port = int(arg.split("=", 1)[1])

    config = load_config()
    print(f"AI Service starting on port {port}")
    print(f"  LLM: {'enabled' if config['openai_api_key'] else 'disabled'} "
          f"(model={config['openai_model']}, base_url={config['openai_base_url']})")
    print(f"  Endpoints: /agent/analyze, /ai/forecast/demand, "
          f"/ai/anomaly/detect, /ai/risk/score, /health")

    server = HTTPServer(("0.0.0.0", port), AIHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down...")
        server.shutdown()


if __name__ == "__main__":
    main()
