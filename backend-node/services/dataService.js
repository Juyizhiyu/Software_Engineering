const {
    ordersRepo,
    inventoryRepo,
    suppliersRepo,
    logisticsRepo,
    costsRepo,
    risksRepo
} = require('../repositories/jsonRepository');
const { entityDefinitions } = require('../config/dataDefinitions');

const repositoryMap = {
    orders: ordersRepo,
    inventory: inventoryRepo,
    suppliers: suppliersRepo,
    logistics: logisticsRepo,
    costs: costsRepo,
    risks: risksRepo
};

const productNames = {
    P001: '核心零件 A',
    P002: '核心零件 B',
    P003: '核心零件 C',
    P004: '核心零件 D',
    P005: '核心零件 E'
};

const warehouseNames = {
    W001: '广州中心仓',
    W002: '上海前置仓',
    W003: '北京分仓'
};

const routeMap = {
    '广州-上海': '华南到华东',
    '深圳-北京': '华南到华北',
    '上海-成都': '华东到西南'
};

function round(value, digits = 1) {
    return Number(Number(value || 0).toFixed(digits));
}

function nowDate() {
    return new Date().toISOString().slice(0, 10);
}

function nowDateTime() {
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

function generateId(prefix) {
    return `${prefix}${Date.now()}`;
}

function generateEntityId(prefix, length) {
    const next = String(length + 1).padStart(3, '0');
    return `${prefix}${next}`;
}

function normalizeRate(value) {
    const number = Number(value || 0);
    return number > 1 ? round(number / 100, 4) : round(number, 4);
}

function toNumber(value) {
    return Number(value || 0);
}

function normalizeInventoryItem(item, index) {
    const currentStock = toNumber(item.current_stock);
    const safetyStock = toNumber(item.safety_stock);
    const maxStock = toNumber(item.max_stock);

    let stockStatus = 'healthy';
    let stockStatusLabel = '健康';
    if (currentStock < safetyStock) {
        stockStatus = 'shortage';
        stockStatusLabel = '缺货风险';
    } else if (currentStock > maxStock) {
        stockStatus = 'overstock';
        stockStatusLabel = '积压';
    } else if (currentStock - safetyStock < 80) {
        stockStatus = 'warning';
        stockStatusLabel = '预警';
    }

    return {
        id: `${item.product_id}-${item.warehouse_id}-${index}`,
        productId: item.product_id,
        productName: item.product_name || productNames[item.product_id] || item.product_id,
        warehouseId: item.warehouse_id,
        warehouseName: item.warehouse_name || warehouseNames[item.warehouse_id] || item.warehouse_id,
        currentStock,
        safetyStock,
        maxStock,
        stockGap: currentStock - safetyStock,
        fillRate: round((currentStock / Math.max(safetyStock, 1)) * 100, 0),
        unitCost: toNumber(item.unit_cost),
        lastUpdate: item.last_update || nowDateTime(),
        stockStatus,
        stockStatusLabel
    };
}

function normalizeSupplier(item, index) {
    const compositeScore =
        normalizeRate(item.on_time_rate) * 0.35 +
        normalizeRate(item.quality_rate) * 0.3 +
        normalizeRate(item.price_stability) * 0.2 +
        normalizeRate(item.response_score) * 0.15;

    let riskLevel = 'low';
    let riskLabel = '低风险';
    if (compositeScore < 0.78) {
        riskLevel = 'high';
        riskLabel = '高风险';
    } else if (compositeScore < 0.87) {
        riskLevel = 'medium';
        riskLabel = '中风险';
    }

    return {
        id: `${item.supplier_id}-${index}`,
        supplierId: item.supplier_id,
        supplierName: item.supplier_name,
        region: item.region,
        onTimeRate: round(normalizeRate(item.on_time_rate) * 100, 1),
        qualityRate: round(normalizeRate(item.quality_rate) * 100, 1),
        priceStability: round(normalizeRate(item.price_stability) * 100, 1),
        responseScore: round(normalizeRate(item.response_score) * 100, 1),
        cooperationYears: toNumber(item.cooperation_years),
        compositeScore: round(compositeScore * 100, 1),
        riskLevel,
        riskLabel
    };
}

function normalizeShipment(item) {
    const expectedHours = toNumber(item.expected_duration_hours);
    const actualHours = toNumber(item.actual_duration_hours);
    const delayHours = Math.max(0, actualHours - expectedHours);
    const routeKey = `${item.origin}-${item.destination}`;

    return {
        shipmentId: item.shipment_id,
        orderId: item.order_id,
        routeName: routeMap[routeKey] || `${item.origin} - ${item.destination}`,
        origin: item.origin,
        destination: item.destination,
        carrier: item.carrier,
        expectedHours,
        actualHours,
        delayHours,
        status: item.status,
        statusLabel: item.status === 'delayed' ? '延迟' : '准时',
        transportCost: toNumber(item.transport_cost)
    };
}

function normalizeCost(item) {
    return {
        date: item.date,
        productId: item.product_id,
        productName: productNames[item.product_id] || item.product_id,
        purchaseCost: toNumber(item.purchase_cost),
        storageCost: toNumber(item.storage_cost),
        transportCost: toNumber(item.transport_cost),
        returnCost: toNumber(item.return_cost),
        totalCost: toNumber(item.total_cost)
    };
}

function normalizeRisk(item) {
    const riskLevelMap = {
        Critical: '严重',
        High: '高',
        Medium: '中',
        Low: '低'
    };

    return {
        riskId: item.risk_id,
        riskType: item.risk_type,
        riskLevel: item.risk_level,
        riskLevelLabel: riskLevelMap[item.risk_level] || item.risk_level,
        relatedObject: item.related_object,
        description: item.description,
        suggestion: item.suggestion,
        status: item.status,
        statusLabel: item.status === 'open' ? '待处理' : '已关闭',
        createdAt: item.created_at || nowDateTime()
    };
}

function normalizeOrder(item) {
    return {
        orderId: item.order_id,
        date: item.date,
        customerRegion: item.customer_region,
        productId: item.product_id,
        productName: item.product_name || productNames[item.product_id] || item.product_id,
        category: item.category || '核心零部件',
        quantity: toNumber(item.quantity),
        unitPrice: toNumber(item.unit_price),
        amount: toNumber(item.amount),
        status: item.status
    };
}

class DataService {
    async getRawData() {
        const [orders, inventory, suppliers, logistics, costs, risks] = await Promise.all([
            ordersRepo.findAll(),
            inventoryRepo.findAll(),
            suppliersRepo.findAll(),
            logisticsRepo.findAll(),
            costsRepo.findAll(),
            risksRepo.findAll()
        ]);

        return { orders, inventory, suppliers, logistics, costs, risks };
    }

    async loadAll() {
        const raw = await this.getRawData();
        return {
            orders: raw.orders.map(normalizeOrder),
            inventory: raw.inventory.map(normalizeInventoryItem),
            suppliers: raw.suppliers.map(normalizeSupplier),
            logistics: raw.logistics.map(normalizeShipment),
            costs: raw.costs.map(normalizeCost),
            risks: raw.risks.map(normalizeRisk)
        };
    }

    getRepository(entity) {
        const repository = repositoryMap[entity];
        if (!repository) {
            throw new Error(`Unsupported entity: ${entity}`);
        }
        return repository;
    }

    getEntitySchemas() {
        return entityDefinitions;
    }

    async getEntityData(entity) {
        const repository = this.getRepository(entity);
        return repository.findAll();
    }

    validateRequired(entity, payload) {
        const definition = entityDefinitions[entity];
        if (!definition) {
            throw new Error(`Unsupported entity: ${entity}`);
        }

        const missing = definition.required.filter(field => {
            const value = payload[field];
            return value === undefined || value === null || value === '';
        });

        if (missing.length) {
            throw new Error(`Missing required fields: ${missing.join(', ')}`);
        }
    }

    async createEntityRecord(entity, payload) {
        this.validateRequired(entity, payload);

        const definition = entityDefinitions[entity];
        const repository = this.getRepository(entity);
        const existing = await repository.findAll();
        const record = { ...definition.defaults, ...payload };

        if (entity === 'orders') {
            record.order_id = generateId(definition.prefix);
            record.amount = toNumber(record.quantity) * toNumber(record.unit_price);
            record.date = record.date || nowDate();
        }

        if (entity === 'inventory') {
            record.last_update = nowDateTime();
        }

        if (entity === 'suppliers') {
            record.supplier_id = generateEntityId(definition.prefix, existing.length);
            record.on_time_rate = normalizeRate(record.on_time_rate);
            record.quality_rate = normalizeRate(record.quality_rate);
            record.price_stability = normalizeRate(record.price_stability);
            record.response_score = normalizeRate(record.response_score);
        }

        if (entity === 'logistics') {
            record.shipment_id = generateId(definition.prefix);
        }

        if (entity === 'costs') {
            record.date = record.date || nowDate();
            record.total_cost =
                toNumber(record.purchase_cost) +
                toNumber(record.storage_cost) +
                toNumber(record.transport_cost) +
                toNumber(record.return_cost);
        }

        if (entity === 'risks') {
            record.risk_id = generateId(definition.prefix);
            record.created_at = nowDateTime();
        }

        await repository.append(record);
        return record;
    }

    async getDashboardSummary() {
        const { orders, inventory, logistics, risks, suppliers, costs } = await this.loadAll();

        const totalSales = orders.reduce((sum, item) => sum + item.amount, 0);
        const averageOrderAmount = totalSales / Math.max(orders.length, 1);
        const shortageCount = inventory.filter(item => item.stockStatus === 'shortage').length;
        const delayedShipments = logistics.filter(item => item.status === 'delayed').length;
        const openRisks = risks.filter(item => item.status === 'open').length;
        const totalCost = costs.reduce((sum, item) => sum + item.totalCost, 0);
        const supplierScoreAvg =
            suppliers.reduce((sum, item) => sum + item.compositeScore, 0) / Math.max(suppliers.length, 1);

        return {
            totalOrders: orders.length,
            totalSales,
            averageOrderAmount: round(averageOrderAmount, 0),
            totalStock: inventory.reduce((sum, item) => sum + item.currentStock, 0),
            shortageCount,
            delayedShipments,
            openRisks,
            totalCost,
            supplierScoreAvg: round(supplierScoreAvg, 1)
        };
    }

    async getDashboardOverview() {
        const { orders, inventory, suppliers, logistics, costs, risks } = await this.loadAll();

        return {
            salesTrend: orders.slice(-8).map(item => ({
                date: item.date,
                amount: item.amount,
                quantity: item.quantity
            })),
            inventoryAlerts: inventory
                .filter(item => item.stockStatus !== 'healthy')
                .sort((a, b) => a.stockGap - b.stockGap)
                .slice(0, 6),
            topSuppliers: [...suppliers]
                .sort((a, b) => b.compositeScore - a.compositeScore)
                .slice(0, 5),
            delayedRoutes: logistics
                .filter(item => item.status === 'delayed')
                .sort((a, b) => b.delayHours - a.delayHours)
                .slice(0, 6),
            costTrend: costs.slice(-8).map(item => ({
                date: item.date,
                totalCost: item.totalCost,
                purchaseCost: item.purchaseCost
            })),
            riskDistribution: ['Critical', 'High', 'Medium', 'Low'].map(level => ({
                level,
                count: risks.filter(item => item.riskLevel === level && item.status === 'open').length
            })),
            recentOrders: orders.slice(-6).reverse(),
            recordCounts: {
                orders: orders.length,
                inventory: inventory.length,
                suppliers: suppliers.length,
                logistics: logistics.length,
                costs: costs.length,
                risks: risks.length
            }
        };
    }

    async getOperationsSnapshot() {
        const { inventory, suppliers, logistics, costs } = await this.loadAll();

        return {
            inventory: inventory.sort((a, b) => a.currentStock - b.currentStock).slice(0, 8),
            suppliers: suppliers.sort((a, b) => b.compositeScore - a.compositeScore).slice(0, 8),
            logistics: logistics.sort((a, b) => b.delayHours - a.delayHours).slice(0, 8),
            costs: costs.sort((a, b) => b.totalCost - a.totalCost).slice(0, 8)
        };
    }

    async getInventoryAnalysis() {
        const { inventory } = await this.loadAll();
        return inventory.sort((a, b) => a.currentStock - b.currentStock);
    }

    async getSuppliersPerformance() {
        const { suppliers } = await this.loadAll();
        return suppliers.sort((a, b) => b.compositeScore - a.compositeScore);
    }

    async getLogisticsAnomalies() {
        const { logistics } = await this.loadAll();
        return logistics.filter(item => item.status === 'delayed').sort((a, b) => b.delayHours - a.delayHours);
    }

    async getCostsAnalysis() {
        const { costs } = await this.loadAll();
        return costs.sort((a, b) => a.date.localeCompare(b.date));
    }

    async getRisks() {
        const { risks } = await this.loadAll();
        return risks.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
}

module.exports = new DataService();
