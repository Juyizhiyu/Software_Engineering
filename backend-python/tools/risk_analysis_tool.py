"""
风险分析工具 - 供应链风险评估和分析
"""
from typing import Dict, List, Any


class RiskAnalysisTool:
    """风险分析工具"""
    
    def calculate_supplier_score(self, metrics: Dict[str, float]) -> Dict[str, Any]:
        """计算供应商绩效评分"""
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
            "breakdown": breakdown,
            "method": "weighted_formula"
        }
    
    def analyze_inventory_risk(self, inventory_data: List[Dict]) -> List[Dict[str, Any]]:
        """分析库存风险"""
        risks = []
        
        for item in inventory_data:
            current = float(item.get("currentStock", 0))
            safety = float(item.get("safetyStock", 0))
            max_stock = float(item.get("maxStock", safety * 3))
            
            if current < safety:
                status = "Shortage"
                risk_level = "High" if current < safety * 0.5 else "Medium"
            elif current > max_stock:
                status = "Overstock"
                risk_level = "Medium"
            elif current < safety * 1.2:
                status = "Warning"
                risk_level = "Low"
            else:
                status = "Normal"
                risk_level = "Low"
            
            risks.append({
                "product_id": item.get("productId", ""),
                "product_name": item.get("productName", ""),
                "current_stock": current,
                "safety_stock": safety,
                "max_stock": max_stock,
                "status": status,
                "risk_level": risk_level,
                "warehouse": item.get("warehouse", "")
            })
        
        return risks
    
    def analyze_logistics_risk(self, logistics_data: List[Dict]) -> List[Dict[str, Any]]:
        """分析物流风险"""
        risks = []
        
        for item in logistics_data:
            actual_hours = float(item.get("actualDurationHours", 0))
            expected_hours = float(item.get("expectedDurationHours", 1))
            
            if expected_hours <= 0:
                continue
                
            delay_ratio = actual_hours / expected_hours
            
            if delay_ratio <= 1.1:
                status = "Normal"
                risk_level = "Low"
            elif delay_ratio <= 1.3:
                status = "Slight Delay"
                risk_level = "Medium"
            else:
                status = "Serious Delay"
                risk_level = "High"
            
            risks.append({
                "shipment_id": item.get("shipmentId", ""),
                "route": item.get("route", ""),
                "carrier": item.get("carrier", ""),
                "expected_hours": expected_hours,
                "actual_hours": actual_hours,
                "delay_ratio": round(delay_ratio, 2),
                "status": status,
                "risk_level": risk_level
            })
        
        return sorted(risks, key=lambda x: x.get("delay_ratio", 1), reverse=True)
    
    def analyze_cost_risk(self, costs_data: List[Dict]) -> List[Dict[str, Any]]:
        """分析成本风险"""
        risks = []
        
        for item in costs_data:
            budget = float(item.get("budget", 0))
            actual = float(item.get("actual", 0))
            
            if budget <= 0:
                continue
            
            variance = (actual - budget) / budget
            variance_pct = round(variance * 100, 1)
            
            if variance > 0.2:
                risk_level = "High"
            elif variance > 0.1:
                risk_level = "Medium"
            elif variance > 0:
                risk_level = "Low"
            else:
                risk_level = "Low"
            
            risks.append({
                "cost_id": item.get("costId", item.get("id", "")),
                "cost_type": item.get("costType", item.get("type", "")),
                "category": item.get("category", ""),
                "budget": budget,
                "actual": actual,
                "variance": round(actual - budget, 2),
                "variance_pct": f"{variance_pct}%",
                "risk_level": risk_level
            })
        
        return sorted(risks, key=lambda x: float(x.get("variance", 0)), reverse=True)
    
    def get_risk_summary(self, inventory_data: List[Dict], logistics_data: List[Dict],
                        costs_data: List[Dict], supplier_data: List[Dict]) -> Dict[str, Any]:
        """获取风险概览"""
        inv_risks = self.analyze_inventory_risk(inventory_data)
        log_risks = self.analyze_logistics_risk(logistics_data)
        cost_risks = self.analyze_cost_risk(costs_data)
        
        high_inv = [r for r in inv_risks if r.get("risk_level") == "High"]
        high_log = [r for r in log_risks if r.get("risk_level") == "High"]
        high_cost = [r for r in cost_risks if r.get("risk_level") == "High"]
        weak_suppliers = [s for s in supplier_data if float(s.get("compositeScore", 100)) < 70]
        
        overall_level = "High" if len(high_inv) + len(high_log) + len(high_cost) >= 3 else "Medium"
        
        return {
            "overall_risk_level": overall_level,
            "inventory_risks": {
                "total": len(inv_risks),
                "high": len(high_inv)
            },
            "logistics_risks": {
                "total": len(log_risks),
                "high": len(high_log)
            },
            "cost_risks": {
                "total": len(cost_risks),
                "high": len(high_cost)
            },
            "supplier_risks": {
                "total": len(supplier_data),
                "weak": len(weak_suppliers)
            },
            "top_risks": {
                "inventory": high_inv[:3],
                "logistics": high_log[:3],
                "cost": high_cost[:3]
            }
        }
