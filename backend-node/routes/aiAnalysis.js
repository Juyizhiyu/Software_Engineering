const express = require('express');
const router = express.Router();
const dataService = require('../services/dataService');
const aiService = require('../services/aiService');

// ── 需求预测 ──
// POST /api/ai/forecast  { product_id, product_name? }
router.post('/forecast', async (req, res) => {
    try {
        const { product_id, product_name } = req.body;
        if (!product_id) {
            return res.status(400).json({ success: false, message: 'product_id is required' });
        }

        // 从成本数据中提取该产品的历史成本作为预测依据
        const rawCosts = await dataService.getEntityData('costs');
        const productCosts = rawCosts
            .filter(c => c.product_id === product_id)
            .map(c => ({
                date: c.date,
                total_cost: c.total_cost,
                purchase_cost: c.purchase_cost,
                storage_cost: c.storage_cost,
                transport_cost: c.transport_cost
            }));

        // 也从订单中提取历史销量
        const rawOrders = await dataService.getEntityData('orders');
        const productOrders = rawOrders
            .filter(o => o.product_id === product_id)
            .map(o => ({
                date: o.date,
                amount: o.amount,
                quantity: o.quantity
            }));

        const history = [...productOrders, ...productCosts].sort((a, b) =>
            (a.date || '').localeCompare(b.date || '')
        );

        const result = await aiService.forecastDemand(
            product_id,
            product_name || product_id,
            history
        );

        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ── 异常检测 ──
// POST /api/ai/anomaly  { data_type, data? }
router.post('/anomaly', async (req, res) => {
    try {
        const { data_type, data } = req.body;

        let analysisData = data;
        if (!analysisData) {
            // 自动从指定实体加载数据
            const raw = await dataService.getEntityData(data_type);
            analysisData = raw;
        }

        if (!analysisData || !analysisData.length) {
            return res.json({
                success: true,
                data: {
                    data_type,
                    total_records: 0,
                    anomalies: [],
                    summary: `没有 ${data_type} 数据可供分析`
                }
            });
        }

        const result = await aiService.detectAnomalies(data_type, analysisData);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ── 供应商风险评分 ──
// POST /api/ai/risk-score  { supplier_id, supplier_name?, metrics? }
router.post('/risk-score', async (req, res) => {
    try {
        const { supplier_id, supplier_name, metrics } = req.body;
        if (!supplier_id) {
            return res.status(400).json({ success: false, message: 'supplier_id is required' });
        }

        let supplierMetrics = metrics;
        if (!supplierMetrics) {
            // 从数据中查找该供应商的指标
            const rawSuppliers = await dataService.getEntityData('suppliers');
            const supplier = rawSuppliers.find(s => s.supplier_id === supplier_id);
            if (supplier) {
                supplierMetrics = {
                    on_time_rate: supplier.on_time_rate,
                    quality_rate: supplier.quality_rate,
                    price_stability: supplier.price_stability,
                    response_score: supplier.response_score
                };
            }
        }

        if (!supplierMetrics) {
            return res.status(400).json({
                success: false,
                message: `Supplier ${supplier_id} not found and no metrics provided`
            });
        }

        const result = await aiService.scoreRisk(
            supplier_id,
            supplier_name || supplier_id,
            supplierMetrics
        );
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ── AI 健康状态 ──
// GET /api/ai/health
router.get('/health', async (req, res) => {
    try {
        const status = await aiService.healthCheck();
        res.json({ success: true, data: status });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
