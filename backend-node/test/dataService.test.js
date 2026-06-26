const test = require('node:test');
const assert = require('node:assert/strict');
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

async function withMockQuery(handler, fn) {
    const originalQuery = db.query;
    db.query = handler;
    try {
        await fn();
    } finally {
        db.query = originalQuery;
    }
}

test('getInventoryAnalysis classifies shortage and warning inventory records', async () => {
    await withMockQuery(async () => [[
        {
            productId: 'P001',
            productName: 'Critical SKU',
            currentStock: 120,
            safetyStock: 300,
            maxStock: 1000,
            warehouseName: 'Main Warehouse'
        },
        {
            productId: 'P002',
            productName: 'Watch SKU',
            currentStock: 420,
            safetyStock: 300,
            maxStock: 1000,
            warehouseName: 'Main Warehouse'
        }
    ]], async () => {
        const result = await dataService.getInventoryAnalysis();

        assert.equal(result.length, 2);
        assert.equal(result[0].stockStatus, 'shortage');
        assert.ok(result[0].stockStatusLabel);
        assert.equal(result[1].stockStatus, 'warning');
        assert.equal(result[1].stockGap, 120);
        assert.equal(typeof result[0].unitCost, 'number');
    });
});

test('getSuppliersPerformance returns ranked supplier score payloads', async () => {
    await withMockQuery(async () => [[
        { supplierName: 'Supplier A', totalGmv: 1000, totalUnits: 100, productCount: 5, realCompositeScore: 99.1 },
        { supplierName: 'Supplier B', totalGmv: 500, totalUnits: 60, productCount: 3, realCompositeScore: 94.2 }
    ]], async () => {
        const result = await dataService.getSuppliersPerformance();

        assert.ok(result.length >= 2);
        assert.equal(result[0].supplierId, 'BR001');
        assert.equal(result[0].compositeScore, 99.1);
        assert.equal(result[0].riskLevel, 'low');
        assert.equal(result[1].riskLevel, 'medium');
        assert.equal(result[0].totalGmv, 1000);
        assert.ok(result.some(item => /APPLE|苹果/i.test(item.supplierName)));
    });
});

test('getRisks builds open risk records from low-sales high-price rows', async () => {
    await withMockQuery(async () => [[
        { spu_id: 'P001', spu_name_clean: 'High Value SKU', price_per_unit: 888, unit_sold: 2 }
    ]], async () => {
        const result = await dataService.getRisks();

        assert.equal(result.length, 2);
        assert.ok(result[0].riskType.includes('库存'));
        assert.equal(result[0].riskLevel, 'High');
        assert.equal(result[0].status, 'open');
        assert.equal(result[1].riskLevel, 'Critical');
    });
});

test('getOperationsSnapshot returns operations collections with metrics and suggestions', async () => {
    const originals = {
        getInventoryAnalysis: dataService.getInventoryAnalysis,
        getSuppliersPerformance: dataService.getSuppliersPerformance,
        getLogisticsAnomalies: dataService.getLogisticsAnomalies,
        getCostsAnalysis: dataService.getCostsAnalysis
    };

    dataService.getInventoryAnalysis = async () => Array.from({ length: 10 }, (_, index) => ({
        id: `I${index}`,
        stockStatus: index === 0 ? 'shortage' : index === 1 ? 'warning' : 'healthy'
    }));
    dataService.getSuppliersPerformance = async () => Array.from({ length: 9 }, (_, index) => ({
        id: `S${index}`,
        riskLevel: index === 0 ? 'high' : 'low'
    }));
    dataService.getLogisticsAnomalies = async () => Array.from({ length: 7 }, (_, index) => ({ id: `L${index}` }));
    dataService.getCostsAnalysis = async () => Array.from({ length: 6 }, (_, index) => ({ id: `C${index}` }));

    try {
        const snapshot = await dataService.getOperationsSnapshot();

        assert.ok(Array.isArray(snapshot.inventory));
        assert.ok(Array.isArray(snapshot.suppliers));
        assert.ok(Array.isArray(snapshot.logistics));
        assert.ok(Array.isArray(snapshot.costs));
        assert.equal(snapshot.inventory.length, 8);
        assert.equal(snapshot.suppliers.length, 8);
        assert.equal(snapshot.logistics.length, 7);
        assert.equal(snapshot.costs.length, 6);
        assert.equal(snapshot.metrics.shortageItems, 1);
        assert.equal(snapshot.metrics.warningItems, 1);
        assert.equal(snapshot.metrics.highRiskSuppliers, 1);
        assert.ok(snapshot.suggestions.length > 0);
    } finally {
        Object.assign(dataService, originals);
    }
});

test('getDashboardOverviewFallback returns configurable overview datasets', async () => {
    const originalLoadAll = dataService.loadAll;
    dataService.loadAll = async () => ({
        orders: [
            { orderId: 'O001', date: '2026-06-19', customerRegion: '华南', category: '服饰', productName: 'SKU A', quantity: 2, amount: 200 },
            { orderId: 'O002', date: '2026-06-20', customerRegion: '华南', category: '服饰', productName: 'SKU B', quantity: 1, amount: 100 }
        ],
        inventory: [
            { productId: 'P001', productName: 'SKU A', categoryName: '服饰', warehouseId: 'W001', warehouseName: '华南仓', currentStock: 20, safetyStock: 100, stockStatus: 'shortage', stockStatusLabel: '缺货' },
            { productId: 'P002', productName: 'SKU B', categoryName: '服饰', warehouseId: 'W001', warehouseName: '华南仓', currentStock: 120, safetyStock: 100, stockStatus: 'healthy', stockStatusLabel: '健康' }
        ],
        suppliers: [
            { supplierId: 'S001', supplierName: 'Supplier A', region: '华南', compositeScore: 96, riskLevel: 'low', riskLabel: '低风险' }
        ],
        logistics: [
            { shipmentId: 'L001', orderId: 'O001', routeName: '华南干线', origin: '广州', destination: '深圳', categoryName: '服饰', carrier: 'Carrier A', status: 'delayed', delayHours: 8, transportCost: 30 }
        ],
        costs: [
            { date: '2026-06-20', productId: 'P001', productName: 'SKU A', categoryName: '服饰', purchaseCost: 60, storageCost: 10, transportCost: 8, returnCost: 2, totalCost: 80 }
        ],
        risks: [
            { riskId: 'R001', riskLevel: 'High', status: 'open' }
        ]
    });

    try {
        const result = await dataService.getDashboardOverviewFallback({ region: '华南', category: '服饰' });

        assert.equal(result.salesTrend.length, 2);
        assert.equal(result.inventoryAlerts.length, 1);
        assert.equal(result.delayedRoutes.length, 1);
        assert.equal(result.costTrend.length, 1);
        assert.equal(result.inventoryStatus.find(item => item.status === 'shortage').count, 1);
        assert.equal(result.supplierScores[0].compositeScore, 96);
        assert.equal(result.costRanking[0].totalCost, 80);
    } finally {
        dataService.loadAll = originalLoadAll;
    }
});

test('getRiskCenterAnalysis integrates anomaly detection and supplier risk score with cache', async () => {
    const originals = {
        getRisks: dataService.getRisks,
        getOperationsSnapshot: dataService.getOperationsSnapshot,
        detectAnomalies: aiService.detectAnomalies,
        scoreRisk: aiService.scoreRisk
    };
    let anomalyCalls = 0;
    let scoreCalls = 0;

    dataService.getRisks = async () => [
        {
            riskId: 'R001',
            riskType: '库存不足',
            riskLevel: 'Critical',
            riskLevelLabel: '严重',
            relatedObject: 'P001',
            description: '库存低于安全线',
            suggestion: '立即补货',
            status: 'open',
            statusLabel: '待处理',
            createdAt: '2026-06-20 10:00:00'
        }
    ];
    dataService.getOperationsSnapshot = async () => ({
        inventory: [{ productId: 'P001', stockStatus: 'shortage', currentStock: 10, safetyStock: 20 }],
        suppliers: [{ supplierId: 'S001', supplierName: 'Supplier A', compositeScore: 78, onTimeRate: 80, qualityScore: 82, costScore: 75, responseScore: 76 }],
        logistics: [{ shipmentId: 'L001', status: 'delayed' }],
        costs: [{ productId: 'P001', totalCost: 1000 }]
    });
    aiService.detectAnomalies = async () => {
        anomalyCalls += 1;
        return {
            data_type: 'risk-center',
            total_records: 4,
            anomalies: [{ field: 'stock', reason: 'low_stock' }],
            summary: '1 anomaly',
            metadata: { mode: 'node-test' }
        };
    };
    aiService.scoreRisk = async supplierId => {
        scoreCalls += 1;
        return {
            supplier_id: supplierId,
            supplier_name: 'Supplier A',
            score: 78,
            risk_level: 'Medium',
            recommendations: ['Review supplier'],
            metadata: { mode: 'node-test' }
        };
    };

    try {
        await withMockQuery(async () => [[{ count: 1, maxCreatedAt: '2026-06-20', totalGmv: 100 }]], async () => {
            const first = await dataService.getRiskCenterAnalysis({ status: 'open' });
            const cached = await dataService.getRiskCenterAnalysis({ status: 'open' });
            const refreshed = await dataService.getRiskCenterAnalysis({ status: 'open' }, { forceRefresh: true });

            assert.equal(first.metadata.cache.hit, false);
            assert.equal(cached.metadata.cache.hit, true);
            assert.equal(refreshed.metadata.cache.hit, false);
            assert.equal(first.summary.anomalyCount, 1);
            assert.equal(first.supplierRiskScores.length, 1);
            assert.equal(anomalyCalls, 2);
            assert.equal(scoreCalls, 2);
        });
    } finally {
        dataService.getRisks = originals.getRisks;
        dataService.getOperationsSnapshot = originals.getOperationsSnapshot;
        aiService.detectAnomalies = originals.detectAnomalies;
        aiService.scoreRisk = originals.scoreRisk;
    }
});

test('getDecisionAnalysis builds prioritized decision suggestions', async () => {
    const originals = {
        getDashboardSummary: dataService.getDashboardSummary,
        getDashboardOverview: dataService.getDashboardOverview,
        getOperationsSnapshot: dataService.getOperationsSnapshot,
        getRisks: dataService.getRisks,
        analyzeWithAgent: aiService.analyzeWithAgent
    };

    dataService.getDashboardSummary = async () => ({
        totalSales: 120000,
        metadata: { source: 'test' }
    });
    dataService.getDashboardOverview = async () => ({
        salesTrend: [{ date: '2026-06-20', amount: 120000, quantity: 88 }]
    });
    dataService.getOperationsSnapshot = async () => ({
        inventory: [
            { productId: 'P001', productName: 'Critical SKU', stockStatus: 'shortage', currentStock: 20, safetyStock: 100 },
            { productId: 'P002', productName: 'Watch SKU', stockStatus: 'warning', currentStock: 110, safetyStock: 100 }
        ],
        suppliers: [
            { supplierId: 'S001', supplierName: 'Risk Supplier', riskLevel: 'high', riskLabel: 'High', compositeScore: 72 }
        ],
        logistics: [
            { shipmentId: 'L001', routeName: 'South Route', status: 'delayed', delayHours: 8, carrier: 'Carrier A' }
        ],
        costs: [
            { productId: 'P003', productName: 'Cost SKU', totalCost: 9000 },
            { productId: 'P004', productName: 'Normal SKU', totalCost: 1000 }
        ],
        metadata: { source: 'test' }
    });
    dataService.getRisks = async () => [
        { riskId: 'R001', riskLevel: 'Critical', riskLevelLabel: 'Critical', status: 'open', relatedObject: 'Warehouse', suggestion: 'Escalate owner' }
    ];
    let aiCalls = 0;
    aiService.analyzeWithAgent = async () => {
        aiCalls += 1;
        return {
            suggestions: [
                'Replenish critical stock',
                'Switch delayed logistics route',
                'Review high risk supplier',
                'Break down high cost item',
                'Close open risk'
            ],
            summary: ['stock', 'logistics', 'supplier', 'cost', 'risk'],
            evidence: [{ type: 'test', object: 'fixture', value: 1 }],
            metadata: { mode: 'llm', aiCalls }
        };
    };

    try {
        const result = await dataService.getDecisionAnalysis({ dimension: 'overview' });

        assert.equal(result.riskLevel, 'critical');
        assert.ok(result.metrics.some(item => item.key === 'shortageItems' && item.value === 1));
        assert.ok(result.charts.riskMatrix.length >= 4);
        assert.ok(result.charts.costBreakdown.length > 0);
        assert.ok(result.suggestions.length >= 5);
        assert.equal(result.suggestions[0].priority, 'high');
        assert.ok(result.suggestions.some(item => item.category === 'inventory'));
        assert.ok(result.suggestions.some(item => item.category === 'logistics'));
        assert.ok(result.suggestions.some(item => item.category === 'supplier'));
        assert.ok(result.suggestions.some(item => item.category === 'cost'));
        assert.ok(result.suggestions.some(item => item.category === 'risk'));
        assert.equal(result.metadata.ai.mode, 'llm');
        assert.equal(result.metadata.cache.hit, false);

        const cached = await dataService.getDecisionAnalysis({ dimension: 'overview' });
        assert.equal(cached.metadata.cache.hit, true);
        assert.equal(cached.metadata.cache.key, result.metadata.cache.key);
        assert.equal(aiCalls, 1);

        const refreshed = await dataService.getDecisionAnalysis({ dimension: 'overview' }, { forceRefresh: true });
        assert.equal(refreshed.metadata.cache.hit, false);
        assert.equal(refreshed.metadata.cache.key, result.metadata.cache.key);
        assert.equal(aiCalls, 2);

        const focused = await dataService.getDecisionAnalysis({ dimension: 'cost' });
        assert.equal(focused.metadata.cache.hit, false);
        assert.notEqual(focused.metadata.cache.key, result.metadata.cache.key);
        assert.equal(focused.suggestions[0].category, 'cost');
    } finally {
        dataService.getDashboardSummary = originals.getDashboardSummary;
        dataService.getDashboardOverview = originals.getDashboardOverview;
        dataService.getOperationsSnapshot = originals.getOperationsSnapshot;
        dataService.getRisks = originals.getRisks;
        aiService.analyzeWithAgent = originals.analyzeWithAgent;
    }
});
