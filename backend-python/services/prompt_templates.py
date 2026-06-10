"""
Prompt 模板 - 为 LLM 分析提供的标准化提示词模板
"""

SYSTEM_PROMPT = """你是企业供应链 BI 分析助手。
你只能根据输入的 JSON 数据进行分析。
如果数据不足，请明确说明"当前数据不足，无法判断"。
你的回答需要包括：
1. 核心结论；
2. 数据依据；
3. 风险原因；
4. 处理建议；
5. 后续观察指标。
不要编造不存在的数据。
输出必须是纯 JSON 对象。"""


ANALYSIS_PROMPT = """请分析以下供应链数据，回答用户问题。

用户问题：{question}

数据上下文：
{context}

请严格基于以上数据进行分析，输出 JSON 格式：
{{
  "answer": "核心结论（中文，100字以内）",
  "summary": ["要点1", "要点2", "要点3"],
  "suggestions": ["建议1", "建议2", "建议3"],
  "evidence": [{{"type": "类型", "object": "对象", "value": 数值}}],
  "charts": [{{"type": "图表类型", "title": "图表标题", "data_key": "数据键"}}]
}}"""


RISK_ANALYSIS_PROMPT = """你是供应链风险管理专家。请基于以下数据评估风险。

风险类型：{risk_type}
相关数据：{data}

请输出 JSON：
{{
  "risk_level": "Critical/High/Medium/Low",
  "recommendations": ["建议1", "建议2", "建议3"],
  "analysis": "综合分析（100字以内）"
}}"""


FORECAST_PROMPT = """你是需求预测分析师。请基于历史数据预测未来需求。

产品ID：{product_id}
产品名称：{product_name}
历史数据：{history_data}

请输出 JSON：
{{
  "forecast_7d": 预测值,
  "forecast_30d": 月度预测值,
  "trend": "up/stable/down",
  "confidence": "high/medium/low",
  "analysis": "预测分析说明"
}}"""


REPORT_PROMPT = """你是供应链报告生成专家。请基于以下数据生成分析报告。

数据概览：{overview}
风险总结：{risk_summary}

请输出 JSON：
{{
  "report_type": "报告类型",
  "executive_summary": "执行摘要",
  "key_findings": ["发现1", "发现2", "发现3"],
  "recommendations": ["建议1", "建议2", "建议3"],
  "follow_up_indicators": ["后续观察指标1", "指标2"]
}}"""


SUPPLIER_ASSESSMENT_PROMPT = """你是供应商绩效评估专家。请基于以下指标评估供应商。

供应商ID：{supplier_id}
供应商名称：{supplier_name}
绩效指标：{metrics}

请输出 JSON：
{{
  "score": 评分,
  "risk_level": "Critical/High/Medium/Low",
  "breakdown": {{"指标名": 贡献值}},
  "recommendations": ["改进建议1", "建议2", "建议3"],
  "analysis": "评估分析"
}}"""


ANOMALY_DETECTION_PROMPT = """你是异常检测专家。请识别以下数据中的异常。

数据类型：{data_type}
数据记录数：{record_count}
样例数据：{sample_data}

请输出 JSON：
{{
  "anomaly_count": 异常数量,
  "anomalies": [{{"severity": "high/medium/low", "description": "描述", "field": "字段", "expected": 预期值, "actual": 实际值}}],
  "summary": "异常总结"
}}"""


def get_analysis_prompt(question: str, context: dict) -> str:
    """生成分析提示词"""
    import json
    return ANALYSIS_PROMPT.format(
        question=question,
        context=json.dumps(context, ensure_ascii=False, indent=2)
    )


def get_risk_prompt(risk_type: str, data: dict) -> str:
    """生成风险分析提示词"""
    import json
    return RISK_ANALYSIS_PROMPT.format(
        risk_type=risk_type,
        data=json.dumps(data, ensure_ascii=False)
    )


def get_forecast_prompt(product_id: str, product_name: str, history_data: list) -> str:
    """生成需求预测提示词"""
    import json
    return FORECAST_PROMPT.format(
        product_id=product_id,
        product_name=product_name,
        history_data=json.dumps(history_data, ensure_ascii=False)
    )


def get_report_prompt(overview: dict, risk_summary: dict) -> str:
    """生成报告提示词"""
    import json
    return REPORT_PROMPT.format(
        overview=json.dumps(overview, ensure_ascii=False),
        risk_summary=json.dumps(risk_summary, ensure_ascii=False)
    )


def get_supplier_assessment_prompt(supplier_id: str, supplier_name: str, metrics: dict) -> str:
    """生成供应商评估提示词"""
    import json
    return SUPPLIER_ASSESSMENT_PROMPT.format(
        supplier_id=supplier_id,
        supplier_name=supplier_name,
        metrics=json.dumps(metrics, ensure_ascii=False)
    )


def get_anomaly_detection_prompt(data_type: str, data: list) -> str:
    """生成异常检测提示词"""
    import json
    sample = data[:10] if len(data) > 10 else data
    return ANOMALY_DETECTION_PROMPT.format(
        data_type=data_type,
        record_count=len(data),
        sample_data=json.dumps(sample, ensure_ascii=False)
    )
