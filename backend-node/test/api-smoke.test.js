const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../app');
const db = require('../config/db');
const dataService = require('../services/dataService');
const aiService = require('../services/aiService');

test.after(async () => {
    try {
        await db.end();
    } catch {
        // The pool may already be closed by another test file in the same process.
    }
});

function listen(appInstance) {
    return new Promise(resolve => {
        const server = appInstance.listen(0, () => resolve(server));
    });
}

function close(server) {
    return new Promise((resolve, reject) => {
        server.close(error => (error ? reject(error) : resolve()));
    });
}

async function request(server, path, options = {}) {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}${path}`, {
        headers: { 'content-type': 'application/json', ...(options.headers || {}) },
        ...options
    });
    const body = await response.json();
    return { status: response.status, body };
}

test('core API routes return successful smoke-test payloads', async () => {
    const originals = {
        getDashboardSummary: dataService.getDashboardSummary,
        getOperationsSnapshot: dataService.getOperationsSnapshot,
        checkDatabaseHealth: dataService.checkDatabaseHealth,
        getDataQualitySummary: dataService.getDataQualitySummary,
        healthCheck: aiService.healthCheck,
        scoreRisk: aiService.scoreRisk,
        getDecisionAnalysis: dataService.getDecisionAnalysis,
        getRiskCenterAnalysis: dataService.getRiskCenterAnalysis
    };

    dataService.getDashboardSummary = async () => ({
        totalOrders: 12,
        totalSales: 3456,
        averageOrderAmount: 288,
        totalStock: 1000,
        shortageCount: 1,
        delayedShipments: 2,
        openRisks: 3,
        totalCost: 2000,
        supplierScoreAvg: 92.5
    });
    dataService.getOperationsSnapshot = async () => ({
        inventory: [{ id: 'I001' }],
        suppliers: [{ id: 'S001' }],
        logistics: [{ id: 'L001' }],
        costs: [{ id: 'C001' }],
        metrics: {},
        suggestions: []
    });
    dataService.getDecisionAnalysis = async () => ({
        metrics: [{ key: 'shortageItems', label: '缺货商品', value: 1, unit: '项', trend: 'up', status: 'danger' }],
        charts: {
            salesTrend: [{ date: '2026-06-20', amount: 1000, quantity: 10 }],
            riskMatrix: [{ name: '库存', value: 1, level: 'high' }],
            costBreakdown: [{ name: 'SKU', value: 100 }]
        },
        suggestions: [{ id: 'D001', priority: 'high', category: 'inventory', title: '补货', problem: '缺货', impact: '履约风险', action: '补货', evidence: ['库存 0'] }],
        riskLevel: 'high',
        summary: { shortageItems: 1, warningItems: 0, highRiskSuppliers: 0, delayedRoutes: 0, openRisks: 0, totalCost: 100 },
        metadata: { source: 'test' }
    });
    dataService.getRiskCenterAnalysis = async () => ({
        risks: [],
        openRisks: [],
        riskStats: { Critical: 0, High: 1, Medium: 0, Low: 0 },
        anomaly: { data_type: 'risk-center', total_records: 1, anomalies: [{ field: 'stock', reason: 'test' }], summary: 'test anomaly' },
        supplierRiskScores: [{ supplier_id: 'S001', supplier_name: 'Supplier A', score: 78, risk_level: 'Medium', recommendations: ['Review supplier'] }],
        summary: { openRisks: 0, anomalyCount: 1, scoredSuppliers: 1, highRiskSuppliers: 0 },
        metadata: { source: 'test', cache: { hit: false, key: 'risk', createdAt: '2026-06-20T00:00:00.000Z', signature: 'sig' } }
    });
    dataService.checkDatabaseHealth = async () => ({ online: false, source: 'json', error: 'test offline' });
    dataService.getDataQualitySummary = async () => ({
        status: 'complete',
        recordCounts: { orders: 1, inventory: 1, suppliers: 1, logistics: 1, costs: 1, risks: 1 },
        emptyEntities: []
    });
    aiService.healthCheck = async () => ({ online: false, llm_enabled: false, error: 'test offline' });
    aiService.scoreRisk = async () => ({
        supplier_id: 'S001',
        supplier_name: 'Supplier A',
        score: 81,
        risk_level: 'Medium',
        recommendations: ['Review delivery performance'],
        metadata: { mode: 'test' }
    });

    const server = await listen(app);
    try {
        const health = await request(server, '/api/health');
        assert.equal(health.status, 200);
        assert.equal(health.body.success, true);
        assert.equal(health.body.data.service, 'node-backend');
        assert.equal(health.body.data.database.source, 'json');
        assert.equal(health.body.data.dataQuality.status, 'complete');

        const summary = await request(server, '/api/dashboard/summary');
        assert.equal(summary.status, 200);
        assert.equal(summary.body.success, true);
        assert.equal(summary.body.data.openRisks, 3);
        assert.equal(summary.body.data.metadata.source, 'mixed');

        const snapshot = await request(server, '/api/operations/snapshot');
        assert.equal(snapshot.status, 200);
        assert.equal(snapshot.body.success, true);
        assert.equal(snapshot.body.data.inventory.length, 1);

        const decision = await request(server, '/api/decision/analysis?dimension=overview');
        assert.equal(decision.status, 200);
        assert.equal(decision.body.success, true);
        assert.equal(decision.body.data.metrics.length, 1);
        assert.equal(decision.body.data.suggestions[0].priority, 'high');
        assert.equal(decision.body.data.metadata.source, 'test');

        const riskAnalysis = await request(server, '/api/risks/analysis');
        assert.equal(riskAnalysis.status, 200);
        assert.equal(riskAnalysis.body.success, true);
        assert.equal(riskAnalysis.body.data.anomaly.anomalies.length, 1);
        assert.equal(riskAnalysis.body.data.supplierRiskScores.length, 1);

        const riskScore = await request(server, '/api/ai/risk-score', {
            method: 'POST',
            body: JSON.stringify({ supplier_id: 'S001', supplier_name: 'Supplier A' })
        });
        assert.equal(riskScore.status, 200);
        assert.equal(riskScore.body.success, true);
        assert.equal(riskScore.body.data.risk_level, 'Medium');
    } finally {
        await close(server);
        Object.assign(dataService, {
            getDashboardSummary: originals.getDashboardSummary,
            getOperationsSnapshot: originals.getOperationsSnapshot,
            getDecisionAnalysis: originals.getDecisionAnalysis,
            getRiskCenterAnalysis: originals.getRiskCenterAnalysis,
            checkDatabaseHealth: originals.checkDatabaseHealth,
            getDataQualitySummary: originals.getDataQualitySummary
        });
        aiService.healthCheck = originals.healthCheck;
        aiService.scoreRisk = originals.scoreRisk;
    }
});
