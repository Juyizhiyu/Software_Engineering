const axios = require('axios');

function numberValue(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
}

function buildFallbackAnomalies(dataType, data = []) {
    const anomalies = [];

    data.forEach((item, index) => {
        const sourceType = item.sourceType || dataType;
        const currentStock = numberValue(item.currentStock);
        const safetyStock = numberValue(item.safetyStock);
        const delayHours = numberValue(item.delayHours);
        const totalCost = numberValue(item.totalCost);
        const compositeScore = numberValue(item.compositeScore);

        if ((item.stockStatus === 'shortage' || (safetyStock > 0 && currentStock < safetyStock))) {
            anomalies.push({
                index,
                field: 'currentStock',
                severity: 'high',
                expected: safetyStock,
                actual: currentStock,
                reason: 'low_stock',
                description: `${item.productName || item.productId || item.relatedObject || '库存对象'} 当前库存低于安全库存`
            });
        }

        if (item.status === 'delayed' || delayHours > 0) {
            anomalies.push({
                index,
                field: 'delayHours',
                severity: delayHours >= 24 ? 'high' : 'medium',
                expected: 0,
                actual: delayHours,
                reason: 'logistics_delay',
                description: `${item.routeName || item.shipmentId || item.relatedObject || '物流任务'} 存在履约延迟`
            });
        }

        if (totalCost >= 5000) {
            anomalies.push({
                index,
                field: 'totalCost',
                severity: totalCost >= 10000 ? 'high' : 'medium',
                expected: 5000,
                actual: totalCost,
                reason: 'high_cost',
                description: `${item.productName || item.productId || '成本对象'} 总成本偏高`
            });
        }

        if ((item.status === 'open' || item.status === 'monitoring') && ['Critical', 'High'].includes(item.riskLevel)) {
            anomalies.push({
                index,
                field: 'riskLevel',
                severity: item.riskLevel === 'Critical' ? 'high' : 'medium',
                reason: 'open_high_risk',
                description: `${item.relatedObject || item.riskId || '风险事件'} 仍处于${item.riskLevelLabel || item.riskLevel}未闭环状态`
            });
        }

        if (sourceType === 'supplier' && compositeScore > 0 && compositeScore < 85) {
            anomalies.push({
                index,
                field: 'compositeScore',
                severity: compositeScore < 75 ? 'high' : 'medium',
                expected: 85,
                actual: compositeScore,
                reason: 'weak_supplier',
                description: `${item.supplierName || item.supplierId || '供应商'} 综合评分低于阈值`
            });
        }
    });

    if (!anomalies.length) {
        anomalies.push({
            index: 0,
            field: 'service',
            severity: 'low',
            reason: 'fallback_rule',
            description: '未发现明确业务异常，当前仅记录 Python 异常检测服务不可用'
        });
    }

    return anomalies;
}

class AiService {
    constructor() {
        this.pythonBaseUrl = process.env.PYTHON_AI_BASE_URL || 'http://127.0.0.1:8000';
    }

    async analyzeWithAgent(question, contextData) {
        try {
            const response = await axios.post(`${this.pythonBaseUrl}/agent/analyze`, {
                question,
                context: contextData
            }, { timeout: 120000, family: 4 });
            return response.data;
        } catch (error) {
            console.error('Error calling Python AI Agent:', error.message);

            const datasets = contextData.datasets || {};
            const inventory = datasets.inventory || [];
            const logistics = datasets.logistics || [];
            const risks = datasets.risks || [];
            const suppliers = datasets.suppliers || [];

            const lowStockCount = inventory.filter(item => item.stockStatus === 'shortage' || item.currentStock < item.safetyStock).length;
            const delayedCount = logistics.filter(item => item.status === 'delayed').length;
            const openRiskCount = risks.filter(item => item.status === 'open').length;
            const weakSupplierCount = suppliers.filter(item => Number(item.compositeScore) < 92).length;

            return {
                answer: `当前 Python AI 服务不可用，已启用 Node 规则分析。针对“${question}”，主要风险集中在库存偏低、物流延迟和供应商履约波动。`,
                summary: [
                    `低于安全库存记录：${lowStockCount} 条`,
                    `延迟物流任务：${delayedCount} 条`,
                    `待处理风险：${openRiskCount} 项，弱绩效供应商：${weakSupplierCount} 家`
                ],
                suggestions: [
                    '优先为低于安全库存的商品生成补货计划。',
                    '将延迟路线纳入重点监控，并准备备用承运商。',
                    '复核低评分供应商的交付、质量和响应指标。'
                ],
                evidence: [
                    { type: 'inventory', object: 'low_stock_count', value: lowStockCount },
                    { type: 'logistics', object: 'delayed_shipments', value: delayedCount },
                    { type: 'risk', object: 'open_risks', value: openRiskCount },
                    { type: 'supplier', object: 'weak_suppliers', value: weakSupplierCount }
                ],
                charts: [],
                metadata: {
                    mode: 'node-fallback',
                    reason: error.message,
                    model: null
                }
            };
        }
    }

    async forecastDemand(productId, productName, historyData) {
        try {
            const response = await axios.post(`${this.pythonBaseUrl}/ai/forecast/demand`, {
                product_id: productId,
                product_name: productName,
                history_data: historyData
            }, { timeout: 60000 });
            return response.data;
        } catch (error) {
            console.error('Forecast error:', error.message);
            return {
                product_id: productId,
                product_name: productName,
                forecast_demand_7d: Math.round(5000 + Math.random() * 2000),
                confidence: 'medium',
                trend: 'upward',
                analysis: `Python 预测服务不可用，已基于 Node 规则返回演示预测：${error.message}`,
                metadata: { mode: 'node-fallback', reason: error.message }
            };
        }
    }

    async detectAnomalies(dataType, data = []) {
        try {
            const response = await axios.post(`${this.pythonBaseUrl}/ai/anomaly/detect`, {
                data_type: dataType,
                data
            }, { timeout: 60000 });
            return response.data;
        } catch (error) {
            console.error('Anomaly detection error:', error.message);
            const anomalies = buildFallbackAnomalies(dataType, data);
            return {
                data_type: dataType,
                total_records: data.length,
                anomalies: anomalies.slice(0, 10),
                summary: `Node fallback 已扫描 ${data.length} 条记录，识别 ${anomalies.length} 个异常项。Python 异常检测服务不可用：${error.message}`,
                metadata: { mode: 'node-fallback', reason: error.message }
            };
        }
    }

    async scoreRisk(supplierId, supplierName, metrics = {}) {
        try {
            const response = await axios.post(`${this.pythonBaseUrl}/ai/risk/score`, {
                supplier_id: supplierId,
                supplier_name: supplierName,
                metrics
            }, { timeout: 60000 });
            return response.data;
        } catch (error) {
            console.error('Risk scoring error:', error.message);
            const score = Math.round(metrics.compositeScore || metrics.response_score || 93);
            return {
                supplier_id: supplierId,
                supplier_name: supplierName,
                score,
                risk_level: 'Low',
                recommendations: [
                    'Python 风险评分服务不可用，Node fallback 暂按低风险供应商处理。'
                ],
                metadata: { mode: 'node-fallback', reason: error.message }
            };
        }
    }

    async healthCheck() {
        try {
            const response = await axios.get(`${this.pythonBaseUrl}/health`, { timeout: 5000, family: 4 });
            return { online: true, ...response.data };
        } catch (error) {
            return { online: false, error: error.message };
        }
    }
}

module.exports = new AiService();
