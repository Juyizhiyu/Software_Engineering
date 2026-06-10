"""
图表解释工具 - 解释图表含义，辅助 LLM 理解数据可视化
"""
from typing import Dict, List, Any


class ChartExplainTool:
    """图表解释工具"""
    
    CHART_TYPES = {
        "line": "折线图",
        "bar": "柱状图",
        "pie": "饼图",
        "ring": "环形图",
        "scatter": "散点图",
        "radar": "雷达图",
        "gauge": "仪表盘"
    }
    
    def explain_chart(self, chart_type: str, data: Dict[str, Any]) -> str:
        """解释图表内容"""
        chart_name = self.CHART_TYPES.get(chart_type, chart_type)
        return f"这是一个{chart_name}，用于展示{data.get('title', '数据')}"
    
    def generate_chart_recommendations(self, data_summary: Dict[str, Any]) -> List[Dict[str, Any]]:
        """根据数据生成图表建议"""
        recommendations = []
        
        record_counts = data_summary.get("recordCounts", {})
        
        if record_counts.get("orders"):
            recommendations.append({
                "chart_type": "line",
                "title": "订单趋势",
                "data_key": "orders",
                "description": "展示订单量随时间变化的趋势"
            })
        
        if record_counts.get("inventory"):
            recommendations.append({
                "chart_type": "ring",
                "title": "库存状态分布",
                "data_key": "inventory",
                "description": "展示各类库存状态占比"
            })
        
        if record_counts.get("suppliers"):
            recommendations.append({
                "chart_type": "bar",
                "title": "供应商评分排行",
                "data_key": "suppliers",
                "description": "展示供应商绩效排名"
            })
        
        if record_counts.get("logistics"):
            recommendations.append({
                "chart_type": "scatter",
                "title": "物流效率分析",
                "data_key": "logistics",
                "description": "分析物流运输效率"
            })
        
        if record_counts.get("costs"):
            recommendations.append({
                "chart_type": "pie",
                "title": "成本构成分析",
                "data_key": "costs",
                "description": "展示各项成本占比"
            })
        
        if record_counts.get("risks"):
            recommendations.append({
                "chart_type": "gauge",
                "title": "风险等级仪表盘",
                "data_key": "risks",
                "description": "展示综合风险等级"
            })
        
        return recommendations
    
    def explain_trend(self, values: List[float]) -> str:
        """解释数据趋势"""
        if len(values) < 2:
            return "数据点不足，无法判断趋势"
        
        first_half = sum(values[:len(values)//2]) / (len(values)//2)
        second_half = sum(values[len(values)//2:]) / (len(values) - len(values)//2)
        
        change_ratio = (second_half - first_half) / first_half if first_half != 0 else 0
        
        if change_ratio > 0.1:
            return f"呈上升趋势，增长{abs(round(change_ratio * 100, 1))}%"
        elif change_ratio < -0.1:
            return f"呈下降趋势，下降{abs(round(change_ratio * 100, 1))}%"
        else:
            return "基本保持稳定"
    
    def explain_comparison(self, value1: float, value2: float, label1: str = "值1", label2: str = "值2") -> str:
        """解释两个值的比较"""
        if value2 == 0:
            return f"{label1}为{value1}，{label2}为0"
        
        ratio = value1 / value2
        diff = value1 - value2
        
        if ratio > 1.5:
            return f"{label1}({value1})远大于{label2}({value2})，约为{label2}的{round(ratio, 1)}倍"
        elif ratio > 1:
            return f"{label1}({value1})大于{label2}({value2})，差异{round(diff, 1)}"
        elif ratio > 0.5:
            return f"{label1}({value1})略小于{label2}({value2})，差异{round(abs(diff), 1)}"
        else:
            return f"{label1}({value1})远小于{label2}({value2})，约为{label2}的{round(ratio, 1)}倍"
