"""
需求预测工具 - 基于历史数据进行需求预测
"""
from typing import Dict, List, Any


class ForecastTool:
    """需求预测工具"""
    
    def forecast_product(self, product_id: str, product_name: str, history_data: List[Dict]) -> Dict[str, Any]:
        """预测单个产品的需求"""
        if not history_data:
            return {
                "product_id": product_id,
                "product_name": product_name,
                "forecast_demand_7d": 0,
                "forecast_demand_30d": 0,
                "confidence": "low",
                "trend": "unknown",
                "analysis": "历史数据为空，无法进行预测"
            }
        
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
                "forecast_demand_7d": 0,
                "forecast_demand_30d": 0,
                "confidence": "low",
                "trend": "unknown",
                "analysis": "无法从历史数据中提取有效数值"
            }
        
        avg = sum(values) / len(values)
        recent_avg = sum(values[-min(7, len(values)):]) / min(7, len(values))
        weekly_avg = recent_avg * 7
        
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
            "analysis": f"基于 {len(values)} 条历史数据预测，趋势{trend}",
            "method": "moving_average"
        }
    
    def forecast_all(self, inventory_data: List[Dict], orders_data: List[Dict]) -> List[Dict[str, Any]]:
        """对所有库存商品进行需求预测"""
        forecasts = []
        
        for item in inventory_data:
            product_id = item.get("productId", item.get("product_id", ""))
            product_name = item.get("productName", item.get("product_name", ""))
            
            product_orders = [
                o for o in orders_data
                if o.get("productId") == product_id or o.get("product_id") == product_id
            ]
            
            forecast = self.forecast_product(product_id, product_name, product_orders)
            forecasts.append(forecast)
        
        return forecasts
    
    def get_shortage_risk_items(self, forecasts: List[Dict], inventory_data: List[Dict]) -> List[Dict]:
        """识别有缺货风险的商品"""
        shortage_risks = []
        
        inventory_map = {item.get("productId", item.get("product_id", "")): item for item in inventory_data}
        
        for forecast in forecasts:
            product_id = forecast.get("product_id", "")
            inv = inventory_map.get(product_id, {})
            
            current_stock = float(inv.get("currentStock", 0))
            forecast_7d = forecast.get("forecast_demand_7d", 0)
            
            if current_stock < forecast_7d:
                shortage_risks.append({
                    "product_id": product_id,
                    "product_name": forecast.get("product_name", ""),
                    "current_stock": current_stock,
                    "forecast_7d": forecast_7d,
                    "gap": forecast_7d - current_stock,
                    "risk_level": "High" if forecast_7d > current_stock * 2 else "Medium"
                })
        
        return sorted(shortage_risks, key=lambda x: x.get("gap", 0), reverse=True)
