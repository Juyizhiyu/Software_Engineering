const entityDefinitions = {
    orders: {
        label: '订单',
        idField: 'order_id',
        prefix: 'O',
        required: ['date', 'customer_region', 'product_id', 'product_name', 'quantity', 'unit_price', 'status'],
        defaults: { status: 'pending', category: '核心零部件' }
    },
    inventory: {
        label: '库存',
        idField: null,
        prefix: 'INV',
        required: ['product_id', 'product_name', 'warehouse_id', 'warehouse_name', 'current_stock', 'safety_stock', 'max_stock', 'unit_cost'],
        defaults: {}
    },
    suppliers: {
        label: '供应商',
        idField: 'supplier_id',
        prefix: 'S',
        required: ['supplier_name', 'region', 'on_time_rate', 'quality_rate', 'price_stability', 'response_score', 'cooperation_years'],
        defaults: {}
    },
    logistics: {
        label: '物流',
        idField: 'shipment_id',
        prefix: 'L',
        required: ['order_id', 'origin', 'destination', 'carrier', 'expected_duration_hours', 'actual_duration_hours', 'status', 'transport_cost'],
        defaults: {}
    },
    costs: {
        label: '成本',
        idField: null,
        prefix: 'COST',
        required: ['date', 'product_id', 'purchase_cost', 'storage_cost', 'transport_cost', 'return_cost'],
        defaults: {}
    },
    risks: {
        label: '风险',
        idField: 'risk_id',
        prefix: 'R',
        required: ['risk_type', 'risk_level', 'related_object', 'description', 'suggestion', 'status'],
        defaults: {}
    }
};

module.exports = {
    entityDefinitions
};
