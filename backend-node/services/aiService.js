const axios = require('axios');

class AiService {
    constructor() {
        this.pythonBaseUrl = process.env.PYTHON_AI_BASE_URL || 'http://localhost:8000';
    }

    async analyzeWithAgent(question, contextData) {
        try {
            const response = await axios.post(`${this.pythonBaseUrl}/agent/analyze`, {
                question,
                context: contextData
            });
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
                answer: `AI 服务当前不可用，已返回 Node 本地规则分析。围绕“${question}”，当前应优先关注低库存、运输延迟和供应商履约波动。`,
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
}

module.exports = new AiService();
