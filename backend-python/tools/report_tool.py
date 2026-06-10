"""
报告生成工具 - 生成供应链分析报告
"""
from typing import Dict, List, Any
from datetime import datetime


class ReportTool:
    """报告生成工具"""
    
    def generate_daily_brief(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """生成日报摘要"""
        datasets = context.get("datasets", {})
        
        orders = datasets.get("orders", [])
        inventory = datasets.get("inventory", [])
        suppliers = datasets.get("suppliers", [])
        logistics = datasets.get("logistics", [])
        costs = datasets.get("costs", [])
        risks = datasets.get("risks", [])
        
        summary = {
            "report_type": "daily_brief",
            "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "overview": {
                "total_orders": len(orders),
                "total_inventory_items": len(inventory),
                "total_suppliers": len(suppliers),
                "total_shipments": len(logistics),
                "total_cost_items": len(costs),
                "total_risks": len(risks)
            }
        }
        
        return summary
    
    def generate_risk_report(self, risk_summary: Dict[str, Any]) -> Dict[str, Any]:
        """生成风险报告"""
        return {
            "report_type": "risk_report",
            "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "overall_risk_level": risk_summary.get("overall_risk_level", "Unknown"),
            "risk_breakdown": {
                "inventory": risk_summary.get("inventory_risks", {}),
                "logistics": risk_summary.get("logistics_risks", {}),
                "cost": risk_summary.get("cost_risks", {}),
                "supplier": risk_summary.get("supplier_risks", {})
            },
            "top_risks": risk_summary.get("top_risks", {})
        }
    
    def generate_supplier_report(self, supplier_data: List[Dict]) -> Dict[str, Any]:
        """生成供应商分析报告"""
        sorted_suppliers = sorted(
            supplier_data,
            key=lambda x: float(x.get("compositeScore", 0)),
            reverse=True
        )
        
        avg_score = sum(float(s.get("compositeScore", 0)) for s in supplier_data) / len(supplier_data) if supplier_data else 0
        
        return {
            "report_type": "supplier_report",
            "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "total_suppliers": len(supplier_data),
            "average_score": round(avg_score, 1),
            "top_5": sorted_suppliers[:5],
            "bottom_5": sorted_suppliers[-5:] if len(sorted_suppliers) >= 5 else sorted_suppliers
        }
    
    def generate_inventory_report(self, inventory_risks: List[Dict]) -> Dict[str, Any]:
        """生成库存分析报告"""
        shortage = [i for i in inventory_risks if i.get("status") == "Shortage"]
        overstock = [i for i in inventory_risks if i.get("status") == "Overstock"]
        warning = [i for i in inventory_risks if i.get("status") == "Warning"]
        
        return {
            "report_type": "inventory_report",
            "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "total_items": len(inventory_risks),
            "status_breakdown": {
                "shortage": len(shortage),
                "overstock": len(overstock),
                "warning": len(warning),
                "normal": len(inventory_risks) - len(shortage) - len(overstock) - len(warning)
            },
            "shortage_risk_items": shortage[:5],
            "overstock_risk_items": overstock[:5]
        }
    
    def generate_cost_report(self, cost_data: List[Dict]) -> Dict[str, Any]:
        """生成成本分析报告"""
        total_budget = sum(float(c.get("budget", 0)) for c in cost_data)
        total_actual = sum(float(c.get("actual", 0)) for c in cost_data)
        variance = total_actual - total_budget
        variance_pct = (variance / total_budget * 100) if total_budget > 0 else 0
        
        cost_by_type = {}
        for item in cost_data:
            cost_type = item.get("costType", item.get("type", "Unknown"))
            if cost_type not in cost_by_type:
                cost_by_type[cost_type] = {"budget": 0, "actual": 0}
            cost_by_type[cost_type]["budget"] += float(item.get("budget", 0))
            cost_by_type[cost_type]["actual"] += float(item.get("actual", 0))
        
        return {
            "report_type": "cost_report",
            "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "total_budget": round(total_budget, 2),
            "total_actual": round(total_actual, 2),
            "variance": round(variance, 2),
            "variance_pct": f"{round(variance_pct, 1)}%",
            "cost_breakdown_by_type": cost_by_type
        }
    
    def generate_full_report(self, context: Dict[str, Any], risk_summary: Dict[str, Any]) -> Dict[str, Any]:
        """生成完整供应链运营报告"""
        datasets = context.get("datasets", {})
        
        return {
            "report_type": "full_supply_chain_report",
            "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "executive_summary": {
                "overall_risk_level": risk_summary.get("overall_risk_level", "Unknown"),
                "total_orders": len(datasets.get("orders", [])),
                "total_inventory_items": len(datasets.get("inventory", [])),
                "total_suppliers": len(datasets.get("suppliers", [])),
                "total_shipments": len(datasets.get("logistics", []))
            },
            "risk_summary": risk_summary,
            "daily_brief": self.generate_daily_brief(context),
            "recommendations": self._generate_recommendations(risk_summary)
        }
    
    def _generate_recommendations(self, risk_summary: Dict[str, Any]) -> List[str]:
        """基于风险总结生成建议"""
        recommendations = []
        
        inv_risks = risk_summary.get("inventory_risks", {})
        log_risks = risk_summary.get("logistics_risks", {})
        cost_risks = risk_summary.get("cost_risks", {})
        sup_risks = risk_summary.get("supplier_risks", {})
        
        if inv_risks.get("high", 0) > 0:
            recommendations.append(f"库存风险：{inv_risks['high']} 个高风险库存项，建议优先补货")
        
        if log_risks.get("high", 0) > 0:
            recommendations.append(f"物流风险：{log_risks['high']} 条运输延迟，建议跟踪承运商")
        
        if cost_risks.get("high", 0) > 0:
            recommendations.append(f"成本风险：{cost_risks['high']} 项超预算，建议分析原因")
        
        if sup_risks.get("weak", 0) > 0:
            recommendations.append(f"供应商风险：{sup_risks['weak']} 家供应商评分偏低，建议复盘")
        
        if not recommendations:
            recommendations.append("当前供应链运行平稳，继续保持监控")
        
        return recommendations
