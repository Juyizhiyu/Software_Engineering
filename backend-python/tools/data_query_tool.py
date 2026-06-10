"""
数据查询工具 - 从 context 中提取和查询各类数据
"""
from typing import Dict, List, Any, Optional


class DataQueryTool:
    """数据查询工具：查询订单、库存、供应商、物流、成本、风险数据"""
    
    def __init__(self, context: Dict[str, Any]):
        self.context = context
        self.datasets = context.get("datasets", {})
    
    def query_inventory(self, filters: Optional[Dict[str, Any]] = None) -> List[Dict]:
        """查询库存数据"""
        inventory = self.datasets.get("inventory", [])
        if not filters:
            return inventory
        
        result = []
        for item in inventory:
            match = True
            for key, value in filters.items():
                if item.get(key) != value:
                    match = False
                    break
            if match:
                result.append(item)
        return result
    
    def query_orders(self, filters: Optional[Dict[str, Any]] = None) -> List[Dict]:
        """查询订单数据"""
        orders = self.datasets.get("orders", [])
        if not filters:
            return orders
        
        result = []
        for item in orders:
            match = True
            for key, value in filters.items():
                if item.get(key) != value:
                    match = False
                    break
            if match:
                result.append(item)
        return result
    
    def query_suppliers(self, filters: Optional[Dict[str, Any]] = None) -> List[Dict]:
        """查询供应商数据"""
        suppliers = self.datasets.get("suppliers", [])
        if not filters:
            return suppliers
        
        result = []
        for item in suppliers:
            match = True
            for key, value in filters.items():
                if item.get(key) != value:
                    match = False
                    break
            if match:
                result.append(item)
        return result
    
    def query_logistics(self, filters: Optional[Dict[str, Any]] = None) -> List[Dict]:
        """查询物流数据"""
        logistics = self.datasets.get("logistics", [])
        if not filters:
            return logistics
        
        result = []
        for item in logistics:
            match = True
            for key, value in filters.items():
                if item.get(key) != value:
                    match = False
                    break
            if match:
                result.append(item)
        return result
    
    def query_costs(self, filters: Optional[Dict[str, Any]] = None) -> List[Dict]:
        """查询成本数据"""
        costs = self.datasets.get("costs", [])
        if not filters:
            return costs
        
        result = []
        for item in costs:
            match = True
            for key, value in filters.items():
                if item.get(key) != value:
                    match = False
                    break
            if match:
                result.append(item)
        return result
    
    def query_risks(self, filters: Optional[Dict[str, Any]] = None) -> List[Dict]:
        """查询风险数据"""
        risks = self.datasets.get("risks", [])
        if not filters:
            return risks
        
        result = []
        for item in risks:
            match = True
            for key, value in filters.items():
                if item.get(key) != value:
                    match = False
                    break
            if match:
                result.append(item)
        return result
    
    def get_low_stock_items(self) -> List[Dict]:
        """获取低于安全库存的物品"""
        inventory = self.query_inventory()
        low_stock = []
        for item in inventory:
            current = float(item.get("currentStock", 0))
            safety = float(item.get("safetyStock", 0))
            if current < safety:
                low_stock.append({
                    **item,
                    "gap": safety - current
                })
        return sorted(low_stock, key=lambda x: x.get("gap", 0), reverse=True)
    
    def get_delayed_shipments(self) -> List[Dict]:
        """获取延迟的运输任务"""
        logistics = self.query_logistics()
        return [item for item in logistics if item.get("status") in ["delayed", "Slight Delay", "Serious Delay"]]
    
    def get_high_risk_suppliers(self) -> List[Dict]:
        """获取高风险供应商"""
        suppliers = self.query_suppliers()
        return [s for s in suppliers if float(s.get("compositeScore", 100)) < 70]
    
    def get_open_risks(self) -> List[Dict]:
        """获取开放风险"""
        return self.query_risks({"status": "open"})
    
    def get_cost_anomalies(self) -> List[Dict]:
        """检测成本异常"""
        costs = self.query_costs()
        anomalies = []
        
        for item in costs:
            budget = float(item.get("budget", 0))
            actual = float(item.get("actual", 0))
            if budget > 0 and actual > budget * 1.2:
                anomalies.append({
                    **item,
                    "over_budget_ratio": (actual - budget) / budget
                })
        return sorted(anomalies, key=lambda x: x.get("over_budget_ratio", 0), reverse=True)
    
    def get_summary(self) -> Dict[str, Any]:
        """获取数据概览"""
        return {
            "total_orders": len(self.datasets.get("orders", [])),
            "total_inventory": len(self.datasets.get("inventory", [])),
            "total_suppliers": len(self.datasets.get("suppliers", [])),
            "total_logistics": len(self.datasets.get("logistics", [])),
            "total_costs": len(self.datasets.get("costs", [])),
            "total_risks": len(self.datasets.get("risks", [])),
            "low_stock_count": len(self.get_low_stock_items()),
            "delayed_shipments": len(self.get_delayed_shipments()),
            "high_risk_suppliers": len(self.get_high_risk_suppliers()),
            "open_risks": len(self.get_open_risks())
        }
