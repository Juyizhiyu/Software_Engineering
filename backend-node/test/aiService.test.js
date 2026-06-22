const test = require('node:test');
const assert = require('node:assert/strict');
const aiService = require('../services/aiService');

async function withOfflinePython(fn) {
    const originalBaseUrl = aiService.pythonBaseUrl;
    aiService.pythonBaseUrl = 'http://127.0.0.1:1';

    try {
        await fn();
    } finally {
        aiService.pythonBaseUrl = originalBaseUrl;
    }
}

test('scoreRisk returns a flat fallback payload when Python AI is unavailable', async () => {
    await withOfflinePython(async () => {
        const result = await aiService.scoreRisk('S001', 'Supplier A', { compositeScore: 78 });

        assert.equal(result.supplier_id, 'S001');
        assert.equal(result.supplier_name, 'Supplier A');
        assert.equal(result.score, 78);
        assert.equal(result.risk_level, 'Low');
        assert.equal(result.metadata.mode, 'node-fallback');
        assert.equal(Object.prototype.hasOwnProperty.call(result, 'data'), false);
    });
});

test('analyzeWithAgent returns structured fallback evidence when Python AI is unavailable', async () => {
    await withOfflinePython(async () => {
        const result = await aiService.analyzeWithAgent('What is risky?', {
            datasets: {
                inventory: [{ currentStock: 10, safetyStock: 20, stockStatus: 'shortage' }],
                logistics: [{ status: 'delayed' }],
                risks: [{ status: 'open' }],
                suppliers: [{ compositeScore: 80 }]
            }
        });

        assert.equal(result.metadata.mode, 'node-fallback');
        assert.ok(result.answer.includes('What is risky?'));
        assert.equal(result.evidence.find(item => item.object === 'low_stock_count').value, 1);
        assert.equal(result.evidence.find(item => item.object === 'delayed_shipments').value, 1);
        assert.ok(Array.isArray(result.suggestions));
    });
});

test('forecastDemand returns stable fallback payload when Python AI is unavailable', async () => {
    await withOfflinePython(async () => {
        const result = await aiService.forecastDemand('P001', 'Product A', []);

        assert.equal(result.product_id, 'P001');
        assert.equal(result.product_name, 'Product A');
        assert.equal(result.confidence, 'medium');
        assert.equal(result.trend, 'upward');
        assert.equal(result.metadata.mode, 'node-fallback');
        assert.equal(typeof result.forecast_demand_7d, 'number');
    });
});

test('detectAnomalies returns fallback anomaly list when Python AI is unavailable', async () => {
    await withOfflinePython(async () => {
        const result = await aiService.detectAnomalies('inventory', [{ currentStock: 1 }]);

        assert.equal(result.data_type, 'inventory');
        assert.equal(result.total_records, 1);
        assert.equal(result.metadata.mode, 'node-fallback');
        assert.equal(result.anomalies.length, 1);
        assert.equal(result.anomalies[0].reason, 'fallback_rule');
    });
});
