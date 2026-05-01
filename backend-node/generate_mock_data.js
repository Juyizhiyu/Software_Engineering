const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');

const generateOrders = () => {
    return Array.from({ length: 20 }, (_, i) => ({
        order_id: `O20260401${String(i + 1).padStart(3, '0')}`,
        date: `2026-04-${String((i % 30) + 1).padStart(2, '0')}`,
        customer_region: ['华南', '华东', '华北', '西南'][i % 4],
        product_id: `P00${(i % 5) + 1}`,
        product_name: `核心零件${String.fromCharCode(65 + (i % 5))}`,
        category: '零部件',
        quantity: Math.floor(Math.random() * 500) + 50,
        unit_price: 300 + (i * 10),
        amount: 0, // will calculate
        status: i % 5 === 0 ? 'pending' : 'completed'
    })).map(o => ({ ...o, amount: o.quantity * o.unit_price }));
};

const generateInventory = () => {
    return Array.from({ length: 20 }, (_, i) => ({
        product_id: `P00${(i % 5) + 1}`,
        product_name: `核心零件${String.fromCharCode(65 + (i % 5))}`,
        warehouse_id: `W00${(i % 3) + 1}`,
        warehouse_name: ['广州中心仓', '上海前置仓', '北京分仓'][i % 3],
        current_stock: Math.floor(Math.random() * 1000) + 100,
        safety_stock: 300,
        max_stock: 1500,
        unit_cost: 180 + i * 5,
        last_update: `2026-04-01 10:00:00`
    }));
};

const generateSuppliers = () => {
    return Array.from({ length: 20 }, (_, i) => ({
        supplier_id: `S00${(i % 5) + 1}`,
        supplier_name: `供应商${i + 1}`,
        region: ['广东', '江苏', '浙江', '四川'][i % 4],
        on_time_rate: 0.8 + (Math.random() * 0.2),
        quality_rate: 0.85 + (Math.random() * 0.15),
        price_stability: 0.7 + (Math.random() * 0.3),
        response_score: 0.75 + (Math.random() * 0.25),
        cooperation_years: Math.floor(Math.random() * 10) + 1
    }));
};

const generateLogistics = () => {
    return Array.from({ length: 20 }, (_, i) => {
        const expected = 24 + Math.floor(Math.random() * 48);
        return {
            shipment_id: `L20260401${String(i + 1).padStart(3, '0')}`,
            order_id: `O20260401${String(i + 1).padStart(3, '0')}`,
            origin: ['广州', '深圳', '上海'][i % 3],
            destination: ['上海', '北京', '成都'][i % 3],
            carrier: ['顺达物流', '快运通', '飞豹运输'][i % 3],
            expected_duration_hours: expected,
            actual_duration_hours: expected + (i % 5 === 0 ? Math.floor(Math.random() * 20) : -Math.floor(Math.random() * 5)),
            status: i % 5 === 0 ? 'delayed' : 'on_time',
            transport_cost: 500 + Math.floor(Math.random() * 1000)
        };
    });
};

const generateCosts = () => {
    return Array.from({ length: 20 }, (_, i) => ({
        date: `2026-04-${String((i % 30) + 1).padStart(2, '0')}`,
        product_id: `P00${(i % 5) + 1}`,
        purchase_cost: 10000 + Math.floor(Math.random() * 20000),
        storage_cost: 1000 + Math.floor(Math.random() * 2000),
        transport_cost: 1500 + Math.floor(Math.random() * 3000),
        return_cost: i % 4 === 0 ? 500 : 0,
        total_cost: 0 // calculate after
    })).map(c => ({...c, total_cost: c.purchase_cost + c.storage_cost + c.transport_cost + c.return_cost}));
};

const generateRisks = () => {
    return Array.from({ length: 20 }, (_, i) => ({
        risk_id: `R20260401${String(i + 1).padStart(3, '0')}`,
        risk_type: ['库存不足', '物流延误', '供应商波动', '成本异常'][i % 4],
        risk_level: ['High', 'Medium', 'Low', 'Critical'][i % 4],
        related_object: `P00${(i % 5) + 1}`,
        description: `这是一条自动生成的风险记录 ${i + 1}`,
        suggestion: `这是处理建议 ${i + 1}`,
        status: i % 3 === 0 ? 'resolved' : 'open',
        created_at: `2026-04-${String((i % 30) + 1).padStart(2, '0')} 11:00:00`
    }));
};

fs.writeFileSync(path.join(dataDir, 'orders.json'), JSON.stringify(generateOrders(), null, 2));
fs.writeFileSync(path.join(dataDir, 'inventory.json'), JSON.stringify(generateInventory(), null, 2));
fs.writeFileSync(path.join(dataDir, 'suppliers.json'), JSON.stringify(generateSuppliers(), null, 2));
fs.writeFileSync(path.join(dataDir, 'logistics.json'), JSON.stringify(generateLogistics(), null, 2));
fs.writeFileSync(path.join(dataDir, 'costs.json'), JSON.stringify(generateCosts(), null, 2));
fs.writeFileSync(path.join(dataDir, 'risks.json'), JSON.stringify(generateRisks(), null, 2));

console.log('Mock data generated successfully!');
