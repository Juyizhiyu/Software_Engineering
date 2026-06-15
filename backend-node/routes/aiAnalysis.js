const express = require('express');
const router = express.Router();
const dataService = require('../services/dataService');
const aiService = require('../services/aiService');
const db = require('../config/db');

// ── 1. 需求预测 ──
router.post('/forecast', async (req, res) => {
    try {
        const { product_id, product_name } = req.body;
        if (!product_id) {
            return res.status(400).json({ success: false, message: 'product_id is required' });
        }

        const [rows] = await db.query(`
            SELECT 
                '2026-06-11' AS date,
                gmv AS amount,
                unit_sold AS quantity,
                (gmv * 0.45) AS purchase_cost,
                (gmv * 0.1) AS storage_cost,
                (gmv * 0.08) AS transport_cost,
                (gmv * 0.63) AS total_cost
            FROM supply_chain_bi.douyin_sales
            WHERE spu_id = ?
            LIMIT 30
        `, [product_id]);

        const result = await aiService.forecastDemand(
            product_id,
            product_name || product_id,
            rows
        );
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ── 2. 异常检测 ──
router.post('/anomaly', async (req, res) => {
    try {
        const { data_type, data } = req.body;
        let analysisData = data;

        if (!analysisData) {
            // 从 MySQL 捞出抖音真流水
            const [rows] = await db.query(`
                SELECT 
                    spu_id,
                    spu_name_clean,
                    brand_clean,
                    price_per_unit,
                    unit_sold,
                    gmv
                FROM supply_chain_bi.douyin_sales
                WHERE brand_clean IS NOT NULL AND brand_clean != ''
                LIMIT 50
            `);

            if (data_type === 'inventory') {
                analysisData = rows.map(item => ({
                    id: item.spu_id,
                    productName: item.spu_name_clean,
                    brand: item.brand_clean,
                    price: item.price_per_unit,
                    currentStock: 5,
                    safetyStock: 10,
                    stockStatus: 'shortage'
                }));
            } else if (data_type === 'logistics') {
                analysisData = rows.map(item => ({
                    id: item.spu_id,
                    status: Math.random() > 0.7 ? 'delayed' : 'delivered',
                    destination: item.brand_clean + '托管点'
                }));
            } else {
                analysisData = await dataService.getEntityData(data_type);
            }
        }

        const result = await aiService.detectAnomalies(data_type, analysisData);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ── 3. 供应商风险评分 ──
router.post('/risk-score', async (req, res) => {
    try {
        const { supplier_id, supplier_name, metrics } = req.body;
        if (!supplier_id) {
            return res.status(400).json({ success: false, message: 'supplier_id is required' });
        }

        let supplierMetrics = metrics;
        if (!supplierMetrics) {
            // 对齐 aiService 期待的 compositeScore 命名
            supplierMetrics = {
                on_time_rate: 78.5,
                quality_rate: 82.0,
                price_stability: 75.4,
                response_score: 79.0,
                compositeScore: 78.2
            };
        }

        const result = await aiService.scoreRisk(
            supplier_id,
            supplier_name || supplier_id,
            supplierMetrics
        );
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ── 4. AI 健康状态 ──
router.get('/health', async (req, res) => {
    try {
        const status = await aiService.healthCheck();
        res.json({ success: true, data: status });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;