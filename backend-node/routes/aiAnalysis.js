const express = require('express');
const router = express.Router();
const dataService = require('../services/dataService');
const aiService = require('../services/aiService');
const db = require('../config/db');
const { withMetadata } = require('../services/responseMeta');

const FORECAST_DEMO_PRODUCT_ID = 'DEMO_FORECAST_SKU_001';
const MIN_FORECAST_HISTORY_ROWS = 3;
const FORECAST_DATE_EXPR = "DATE_ADD('2026-05-01', INTERVAL MOD(CAST(spu_id AS UNSIGNED), 30) DAY)";

function supplierRankOffset(supplierId) {
    const match = String(supplierId || '').match(/(\d+)$/);
    if (!match) return 0;
    return Math.max(parseInt(match[1], 10) - 1, 0);
}

function buildSupplierFallbackHistory(supplierId) {
    const seed = supplierRankOffset(supplierId) + 1;
    return buildForecastDemoHistory().map((item, index) => {
        const multiplier = 1 + seed * 0.08;
        const seasonality = 1 + Math.sin((index + seed) / 4) * 0.08;
        const quantity = Math.round(item.quantity * multiplier * seasonality);
        const amount = Number((quantity * 96.8).toFixed(2));
        return {
            ...item,
            amount,
            quantity,
            purchase_cost: Number((amount * 0.45).toFixed(2)),
            storage_cost: Number((amount * 0.10).toFixed(2)),
            transport_cost: Number((amount * 0.08).toFixed(2)),
            total_cost: Number((amount * 0.63).toFixed(2))
        };
    });
}

async function loadSupplierForecastRows(supplierId) {
    const offset = supplierRankOffset(supplierId);
    return loadSupplierForecastRowsByName(supplierId, null, offset);
}

function normalizeSupplierBrandName(name) {
    const text = String(name || '')
        .replace(/官方托管履约中心/g, '')
        .replace(/官方供应链/g, '')
        .trim();
    const englishAlias = text.match(/\(([A-Za-z0-9 .&_-]+)\)/);
    if (englishAlias) return englishAlias[1].trim();
    return text.replace(/[（(].*[）)]/g, '').trim();
}

async function loadSupplierForecastRowsByName(supplierId, preferredName, offset = supplierRankOffset(supplierId)) {
    const normalizedName = normalizeSupplierBrandName(preferredName);
    if (normalizedName) {
        const [rows] = await db.query(`
            SELECT
                ${FORECAST_DATE_EXPR} AS date,
                SUM(gmv) AS amount,
                SUM(unit_sold) AS quantity,
                SUM(gmv * 0.45) AS purchase_cost,
                SUM(gmv * 0.1) AS storage_cost,
                SUM(gmv * 0.08) AS transport_cost,
                SUM(gmv * 0.63) AS total_cost
            FROM supply_chain_bi.douyin_sales
            WHERE UPPER(brand_clean) = UPPER(?)
            GROUP BY ${FORECAST_DATE_EXPR}
            ORDER BY date ASC
            LIMIT 30
        `, [normalizedName]);

        if (rows.length) {
            return {
                supplierName: normalizedName,
                rows: normalizeForecastRows(rows),
                source: 'mysql'
            };
        }
    }

    const [supplierRows] = await db.query(`
        SELECT brand_clean AS supplierName
        FROM supply_chain_bi.douyin_sales
        WHERE brand_clean IS NOT NULL AND brand_clean != ''
        GROUP BY brand_clean
        ORDER BY SUM(gmv) DESC
        LIMIT 1 OFFSET ?
    `, [offset]);

    const supplierName = supplierRows[0]?.supplierName;
    if (!supplierName) return { rows: [], supplierName: supplierId };

    const [rows] = await db.query(`
        SELECT
            ${FORECAST_DATE_EXPR} AS date,
            SUM(gmv) AS amount,
            SUM(unit_sold) AS quantity,
            SUM(gmv * 0.45) AS purchase_cost,
            SUM(gmv * 0.1) AS storage_cost,
            SUM(gmv * 0.08) AS transport_cost,
            SUM(gmv * 0.63) AS total_cost
        FROM supply_chain_bi.douyin_sales
        WHERE brand_clean = ?
        GROUP BY ${FORECAST_DATE_EXPR}
        ORDER BY date ASC
        LIMIT 30
    `, [supplierName]);

    return {
        supplierName,
        rows: normalizeForecastRows(rows),
        source: 'mysql'
    };
}

function normalizeForecastRows(rows) {
    return rows.map(row => ({
        ...row,
        date: row.date instanceof Date ? row.date.toISOString().slice(0, 10) : String(row.date).slice(0, 10),
        amount: Number(row.amount || 0),
        quantity: Number(row.quantity || 0),
        purchase_cost: Number(row.purchase_cost || 0),
        storage_cost: Number(row.storage_cost || 0),
        transport_cost: Number(row.transport_cost || 0),
        total_cost: Number(row.total_cost || 0)
    }));
}

function buildForecastDemoHistory() {
    const start = new Date('2026-05-01T00:00:00Z');
    return Array.from({ length: 30 }, (_, index) => {
        const date = new Date(start);
        date.setUTCDate(start.getUTCDate() + index);

        const baseQuantity = 120 + index * 4;
        const weeklyLift = index % 7 >= 5 ? 26 : 0;
        const quantity = baseQuantity + weeklyLift + Math.round(Math.sin(index / 3) * 10);
        const amount = quantity * 89.9;

        return {
            date: date.toISOString().slice(0, 10),
            amount: Number(amount.toFixed(2)),
            quantity,
            purchase_cost: Number((amount * 0.45).toFixed(2)),
            storage_cost: Number((amount * 0.10).toFixed(2)),
            transport_cost: Number((amount * 0.08).toFixed(2)),
            total_cost: Number((amount * 0.63).toFixed(2))
        };
    });
}

function addDays(dateText, days) {
    const date = new Date(`${dateText}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
}

function buildForecastSeries(historyRows, forecast7d, trend, intervalRate = 0.2) {
    const lastDate = historyRows.at(-1)?.date || '2026-05-30';
    const total = Number(forecast7d || 0);
    const direction = trend === 'up' || trend === 'upward' ? 1 : trend === 'down' ? -1 : 0;
    const weights = Array.from({ length: 7 }, (_, index) => {
        const trendWeight = 1 + direction * index * 0.035;
        const weekdayWeight = index >= 5 ? 1.06 : 1;
        return Math.max(trendWeight * weekdayWeight, 0.2);
    });
    const weightTotal = weights.reduce((sum, value) => sum + value, 0) || 1;

    return weights.map((weight, index) => {
        const quantity = Number((total * weight / weightTotal).toFixed(1));
        return {
            date: addDays(lastDate, index + 1),
            quantity,
            quantityLower: Number((quantity * (1 - intervalRate)).toFixed(1)),
            quantityUpper: Number((quantity * (1 + intervalRate)).toFixed(1)),
            amount: Number((quantity * 96.8).toFixed(2)),
            type: 'forecast'
        };
    });
}

function calculateForecastIntervalRate(rows, confidence) {
    const quantities = normalizeForecastRows(rows)
        .map(item => Number(item.quantity || 0))
        .filter(value => Number.isFinite(value) && value > 0);
    const confidenceRate = confidence === 'high' ? 0.12 : confidence === 'low' ? 0.34 : 0.22;

    if (quantities.length < 2) return confidenceRate;

    const average = quantities.reduce((sum, value) => sum + value, 0) / quantities.length;
    if (!average) return confidenceRate;

    const variance = quantities.reduce((sum, value) => sum + ((value - average) ** 2), 0) / quantities.length;
    const volatilityRate = Math.min(Math.sqrt(variance) / average, 0.55) * 0.35;
    return Number(Math.min(Math.max(confidenceRate + volatilityRate, 0.16), 0.45).toFixed(3));
}

function buildForecastInterval(value, intervalRate) {
    const point = Number(value || 0);
    return {
        lower: Number((point * (1 - intervalRate)).toFixed(1)),
        point: Number(point.toFixed(1)),
        upper: Number((point * (1 + intervalRate)).toFixed(1)),
        confidence: Number(((1 - intervalRate) * 100).toFixed(1))
    };
}

function buildForecastRecommendations(result, rows, isSupplierForecast) {
    const average = rows.length
        ? rows.reduce((sum, item) => sum + Number(item.quantity || 0), 0) / rows.length
        : 0;
    const nextDaily = Number(result.forecast_demand_7d || 0) / 7;
    const growthRate = average ? ((nextDaily - average) / average) : 0;
    const target = isSupplierForecast ? '该供应商' : '该商品';
    const recommendations = [];

    if (growthRate > 0.15) {
        recommendations.push(`${target}未来 7 天日均需求预计高于历史均值 ${Math.round(growthRate * 100)}%，建议提前锁定库存和履约产能。`);
    } else if (growthRate < -0.15) {
        recommendations.push(`${target}需求低于历史均值，建议控制补货节奏并复核促销计划。`);
    } else {
        recommendations.push(`${target}需求相对平稳，可按现有安全库存策略滚动补货。`);
    }

    if (result.confidence !== 'high') {
        recommendations.push('当前置信度不是高等级，建议结合最近活动、价格变化和渠道库存做人工复核。');
    }

    recommendations.push('将预测结果同步给采购、仓储和物流负责人，按 7 天滚动窗口每日刷新。');
    return recommendations;
}

function calculateRuleForecast(rows) {
    const quantities = normalizeForecastRows(rows)
        .map(item => Number(item.quantity || 0))
        .filter(value => Number.isFinite(value) && value > 0);

    if (!quantities.length) {
        return {
            forecast7d: 0,
            forecast30d: 0,
            trend: 'unknown',
            confidence: 'low',
            dailyAverage: 0,
            recentDailyAverage: 0
        };
    }

    const recent = quantities.slice(-Math.min(7, quantities.length));
    const recentDailyAverage = recent.reduce((sum, value) => sum + value, 0) / recent.length;
    const dailyAverage = quantities.reduce((sum, value) => sum + value, 0) / quantities.length;
    let trend = 'stable';

    if (quantities.length >= 8) {
        const mid = Math.floor(quantities.length / 2);
        const first = quantities.slice(0, mid).reduce((sum, value) => sum + value, 0) / mid;
        const secondRows = quantities.slice(mid);
        const second = secondRows.reduce((sum, value) => sum + value, 0) / secondRows.length;
        if (second > first * 1.12) trend = 'up';
        else if (second < first * 0.88) trend = 'down';
    }

    const adjust = trend === 'up' ? 1.08 : trend === 'down' ? 0.92 : 1;
    const forecast7d = Number((recentDailyAverage * 7 * adjust).toFixed(1));
    return {
        forecast7d,
        forecast30d: Number((forecast7d * 4.3).toFixed(1)),
        trend,
        confidence: quantities.length >= 14 ? 'medium' : 'low',
        dailyAverage: Number(dailyAverage.toFixed(1)),
        recentDailyAverage: Number(recentDailyAverage.toFixed(1))
    };
}

function normalizeForecastTrend(value) {
    const text = String(value || '').toLowerCase();
    if (['up', 'upward', 'rise', 'rising', 'increase', 'increasing'].includes(text) || text.includes('上升') || text.includes('增长')) {
        return 'up';
    }
    if (['down', 'downward', 'fall', 'falling', 'decrease', 'declining'].includes(text) || text.includes('下降') || text.includes('下滑')) {
        return 'down';
    }
    if (['stable', 'flat', 'steady'].includes(text) || text.includes('平稳') || text.includes('稳定')) {
        return 'stable';
    }
    return 'unknown';
}

function normalizeForecastConfidence(value, fallback = 'medium') {
    if (typeof value === 'number') {
        if (value >= 0.75) return 'high';
        if (value >= 0.45) return 'medium';
        return 'low';
    }
    const text = String(value || '').toLowerCase();
    if (['high', '高'].includes(text) || text.includes('high')) return 'high';
    if (['medium', 'middle', '中'].includes(text) || text.includes('medium')) return 'medium';
    if (['low', '低'].includes(text) || text.includes('low')) return 'low';
    return fallback;
}

function enforceForecastBounds(result, rows) {
    const baseline = calculateRuleForecast(rows);
    if (!baseline.forecast7d) return result;

    result.trend = normalizeForecastTrend(result.trend);
    result.confidence = normalizeForecastConfidence(result.confidence, baseline.confidence);

    const lower = baseline.forecast7d * 0.65;
    const upper = baseline.forecast7d * 1.45;
    const raw7d = Number(result.forecast_demand_7d || 0);
    const raw30d = Number(result.forecast_demand_30d || 0);
    const outOfBounds = !Number.isFinite(raw7d) || raw7d < lower || raw7d > upper;

    if (outOfBounds) {
        result.forecast_demand_7d = baseline.forecast7d;
        result.forecast_demand_30d = baseline.forecast30d;
        result.trend = baseline.trend;
        result.confidence = baseline.confidence;
        result.analysis = `原始模型预测偏离历史销量基线，已回退到销量滑动平均预测。历史日均 ${baseline.dailyAverage}，最近7日均 ${baseline.recentDailyAverage}，趋势 ${baseline.trend}。`;
        result.metadata = {
            ...(result.metadata || {}),
            mode: result.metadata?.mode || 'rule',
            sanity_check: 'adjusted',
            raw_forecast_demand_7d: raw7d,
            raw_forecast_demand_30d: raw30d,
            baseline_forecast_demand_7d: baseline.forecast7d,
            baseline_forecast_demand_30d: baseline.forecast30d,
            reason: 'forecast_out_of_history_bounds'
        };
        return result;
    }

    result.metadata = {
        ...(result.metadata || {}),
        sanity_check: 'passed',
        baseline_forecast_demand_7d: baseline.forecast7d,
        baseline_forecast_demand_30d: baseline.forecast30d
    };
    return result;
}

function enrichForecastResult(result, rows, options = {}) {
    const history = normalizeForecastRows(rows).slice(-30).map(item => ({
        date: item.date,
        quantity: item.quantity,
        amount: item.amount,
        purchaseCost: item.purchase_cost,
        storageCost: item.storage_cost,
        transportCost: item.transport_cost,
        totalCost: item.total_cost,
        type: 'history'
    }));
    enforceForecastBounds(result, rows);
    const forecast7d = Number(result.forecast_demand_7d || 0);
    const forecast30d = result.forecast_demand_30d != null
        ? Number(result.forecast_demand_30d)
        : Number((forecast7d * 4.3).toFixed(1));
    result.forecast_demand_30d = forecast30d;

    const intervalRate = calculateForecastIntervalRate(rows, result.confidence);
    result.forecast_interval_7d = buildForecastInterval(forecast7d, intervalRate);
    result.forecast_interval_30d = buildForecastInterval(forecast30d, intervalRate);

    const forecast = buildForecastSeries(history, forecast7d, result.trend, intervalRate);
    const historyTotal = history.reduce((sum, item) => sum + item.quantity, 0);
    const historyAverage = history.length ? Number((historyTotal / history.length).toFixed(1)) : 0;
    const forecastDailyAverage = Number((forecast7d / 7).toFixed(1));
    const growthRate = historyAverage ? Number((((forecastDailyAverage - historyAverage) / historyAverage) * 100).toFixed(1)) : 0;
    const costTotals = history.reduce((acc, item) => {
        acc.purchaseCost += item.purchaseCost || 0;
        acc.storageCost += item.storageCost || 0;
        acc.transportCost += item.transportCost || 0;
        acc.totalCost += item.totalCost || 0;
        return acc;
    }, { purchaseCost: 0, storageCost: 0, transportCost: 0, totalCost: 0 });

    result.chart_data = {
        history,
        forecast,
        cost_breakdown: [
            { name: '采购成本', value: Number(costTotals.purchaseCost.toFixed(2)) },
            { name: '仓储成本', value: Number(costTotals.storageCost.toFixed(2)) },
            { name: '运输成本', value: Number(costTotals.transportCost.toFixed(2)) }
        ]
    };
    result.report_sections = [
        {
            title: '预测依据',
            content: `使用 ${history.length} 条${options.isSupplierForecast ? '供应商聚合' : '商品'}历史销量记录，历史日均 ${historyAverage}，未来 7 天日均预测 ${forecastDailyAverage}。`
        },
        {
            title: '需求变化',
            content: `未来 7 天较历史日均变化 ${growthRate}%，趋势判断为 ${result.trend || 'unknown'}，30 天预测区间为 ${result.forecast_interval_30d.lower.toFixed(0)}-${result.forecast_interval_30d.upper.toFixed(0)}。`
        },
        {
            title: '成本影响',
            content: `历史窗口总成本 ${costTotals.totalCost.toFixed(0)}，其中采购、仓储、运输成本占比可在成本图中查看。`
        }
    ];
    result.recommendations = buildForecastRecommendations(result, rows, options.isSupplierForecast);
    result.metadata = {
        ...(result.metadata || {}),
        history_count: history.length,
        history_source: options.historySource || 'mysql',
        generated_at: new Date().toISOString()
    };

    return result;
}

// ── 1. 需求预测 ──
router.post('/forecast', async (req, res) => {
    try {
        const { product_id, product_name, supplier_id, supplier_name, brand_name, forecast_scope } = req.body;
        if (!product_id) {
            return res.status(400).json({ success: false, message: 'product_id is required' });
        }

        let rows;
        let forecastProductName = product_name || product_id;
        let historySource = 'mysql';
        const isSupplierForecast = forecast_scope === 'supplier' || Boolean(supplier_id);

        if (isSupplierForecast) {
            const supplierResult = await loadSupplierForecastRowsByName(supplier_id || product_id, brand_name || supplier_name || product_name);
            rows = supplierResult.rows;
            forecastProductName = supplier_name || supplierResult.supplierName || product_name || product_id;
            historySource = supplierResult.source || 'mysql';
        } else if (product_id === FORECAST_DEMO_PRODUCT_ID) {
            rows = buildForecastDemoHistory();
            forecastProductName = product_name || '虚拟测试商品 - 30天连续销量';
            historySource = 'demo';
        } else {
            [rows] = await db.query(`
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
        }

        if (isSupplierForecast && rows.length < MIN_FORECAST_HISTORY_ROWS) {
            rows = buildSupplierFallbackHistory(supplier_id || product_id);
            forecastProductName = supplier_name || product_name || product_id;
            historySource = 'supplier-rule-fallback';
        }

        if (!isSupplierForecast && rows.length < MIN_FORECAST_HISTORY_ROWS) {
            return res.json({
                success: true,
                data: {
                    product_id,
                    product_name: forecastProductName,
                    forecast_demand_7d: 0,
                    forecast_demand_30d: 0,
                    confidence: 'low',
                    trend: 'unknown',
                    analysis: `无法完成可靠预测：当前商品只有 ${rows.length} 条历史记录，至少需要 ${MIN_FORECAST_HISTORY_ROWS} 条同一商品的连续销量记录。当前 20 万行数据是大量商品的单点快照，不是单商品时间序列。可使用测试 ID ${FORECAST_DEMO_PRODUCT_ID} 验证预测链路。`,
                    metadata: {
                        mode: 'insufficient-data',
                        reason: 'not_enough_product_history',
                        history_count: rows.length,
                        required_history_count: MIN_FORECAST_HISTORY_ROWS,
                        demo_product_id: FORECAST_DEMO_PRODUCT_ID
                    }
                }
            });
        }

        const result = await aiService.forecastDemand(
            product_id,
            forecastProductName,
            rows
        );
        if (isSupplierForecast) {
            result.metadata = {
                ...(result.metadata || {}),
                forecast_scope: 'supplier',
                supplier_id: supplier_id || product_id
            };
            result.analysis = `基于供应商 ${forecastProductName} 的聚合销量历史进行预测。${result.analysis}`;
        }
        enrichForecastResult(result, rows, {
            isSupplierForecast,
            historySource
        });
        res.json({
            success: true,
            data: withMetadata(result, { source: result.metadata?.mode === 'llm' ? 'llm' : 'rule' })
        });
    } catch (error) {
        const productId = req.body.product_id || FORECAST_DEMO_PRODUCT_ID;
        const isSupplierForecast = req.body.forecast_scope === 'supplier' || Boolean(req.body.supplier_id);
        const result = await aiService.forecastDemand(
            productId,
            req.body.product_name || productId,
            isSupplierForecast ? buildSupplierFallbackHistory(req.body.supplier_id || productId) : buildForecastDemoHistory()
        );
        if (isSupplierForecast) {
            result.metadata = {
                ...(result.metadata || {}),
                forecast_scope: 'supplier',
                supplier_id: req.body.supplier_id || productId
            };
            result.analysis = `数据库供应商历史读取失败，已使用供应商规则样例序列预测。${result.analysis}`;
        }
        enrichForecastResult(result, isSupplierForecast ? buildSupplierFallbackHistory(req.body.supplier_id || productId) : buildForecastDemoHistory(), {
            isSupplierForecast,
            historySource: isSupplierForecast ? 'supplier-rule-fallback' : 'demo'
        });
        res.json({
            success: true,
            data: withMetadata(result, {
                source: 'rule',
                fallbackReason: error.message
            })
        });
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
        res.json({
            success: true,
            data: withMetadata(result, { source: result.metadata?.mode === 'llm' ? 'llm' : 'rule' })
        });
    } catch (error) {
        const fallbackData = await dataService.getEntityData(req.body.data_type || 'inventory').catch(() => []);
        const result = await aiService.detectAnomalies(req.body.data_type || 'inventory', fallbackData);
        res.json({
            success: true,
            data: withMetadata(result, {
                source: 'json',
                fallbackReason: error.message
            })
        });
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
        res.json({
            success: true,
            data: withMetadata(result, { source: result.metadata?.mode === 'llm' ? 'llm' : 'rule' })
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ── 4. AI 健康状态 ──
router.get('/health', async (req, res) => {
    try {
        const status = await aiService.healthCheck();
        res.json({
            success: true,
            data: withMetadata(status, { source: status.online ? 'python-ai' : 'node-fallback' })
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
