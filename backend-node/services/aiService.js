const axios = require('axios');

class AiService {
    constructor() {
        // 使用 127.0.0.1 替代 localhost，避免 IPv6 解析问题
        this.pythonBaseUrl = process.env.PYTHON_AI_BASE_URL || 'http://127.0.0.1:8000';
    }

    // ── 智能问答（主入口） ──
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

            const lowStockCount = inventory.filter(
                item => Number(item.currentStock) < Number(item.safetyStock)
            ).length;
            const delayedCount = logistics.filter(item => item.status === 'delayed').length;
            const openRiskCount = risks.filter(item => item.status === 'open').length;
            const weakSupplierCount = suppliers.filter(item => Number(item.compositeScore) < 80).length;

            return {
                answer: `AI 服务当前不可用，已返回 Node 本地规则分析。围绕"${question}"，当前应优先关注低库存、运输延迟和供应商履约波动。`,
                summary: [
                    `低于安全库存的记录数为 ${lowStockCount}。`,
                    `延迟运输任务数为 ${delayedCount}。`,
                    `开放风险数为 ${openRiskCount}，低评分供应商数为 ${weakSupplierCount}。`
                ],
                suggestions: [
                    '优先处理低库存 SKU，并补充高周转物料的安全库存。',
                    '跟踪延迟运输线路，必要时切换备选承运商。',
                    '对履约评分偏低的供应商启动专项复盘。'
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

    // ── 需求预测 ──
    async forecastDemand(productId, productName, historyData) {
        try {
            const response = await axios.post(`${this.pythonBaseUrl}/ai/forecast/demand`, {
                product_id: productId,
                product_name: productName,
                history_data: historyData
            }, { timeout: 60000 });
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Forecast error:', error.message);
            return {
                success: false,
                data: {
                    product_id: productId,
                    forecast_demand_7d: 0,
                    confidence: 'low',
                    trend: 'unknown',
                    analysis: `预测服务不可用: ${error.message}`
                }
            };
        }
    }

    // ── 异常检测 ──
    async detectAnomalies(dataType, data) {
        try {
            const response = await axios.post(`${this.pythonBaseUrl}/ai/anomaly/detect`, {
                data_type: dataType,
                data
            }, { timeout: 60000 });
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Anomaly detection error:', error.message);
            return {
                success: false,
                data: {
                    data_type: dataType,
                    total_records: data.length,
                    anomalies: [],
                    summary: `异常检测服务不可用: ${error.message}`
                }
            };
        }
    }

    // ── 风险评分 ──
    async scoreRisk(supplierId, supplierName, metrics) {
        try {
            const response = await axios.post(`${this.pythonBaseUrl}/ai/risk/score`, {
                supplier_id: supplierId,
                supplier_name: supplierName,
                metrics
            }, { timeout: 60000 });
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Risk scoring error:', error.message);
            return {
                success: false,
                data: {
                    supplier_id: supplierId,
                    score: 0,
                    risk_level: 'Unknown',
                    recommendations: [`风险评估服务不可用: ${error.message}`]
                }
            };
        }
    }

    // ── 健康检查 ──
    async healthCheck() {
        try {
            const response = await axios.get(`${this.pythonBaseUrl}/health`, {
                timeout: 5000,
                family: 4  // 强制 IPv4
            });
            return { online: true, ...response.data };
        } catch (error) {
            return { online: false, error: error.message };
        }
    }
}

module.exports = new AiService();
