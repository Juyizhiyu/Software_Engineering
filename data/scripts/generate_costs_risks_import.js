const fs = require('node:fs');
const path = require('node:path');
const db = require('../../backend-node/config/db');

const ROOT = path.resolve(__dirname, '..', '..');
const COSTS_CSV = path.join(ROOT, 'data', 'costs.csv');
const RISKS_CSV = path.join(ROOT, 'data', 'risks.csv');

function csvEscape(value) {
    if (value === null || value === undefined) return '';
    const text = String(value);
    if (/[",\r\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
    return text;
}

function writeCsv(filePath, columns, rows) {
    const lines = [
        columns.join(','),
        ...rows.map(row => columns.map(column => csvEscape(row[column])).join(','))
    ];
    fs.writeFileSync(filePath, `${lines.join('\n')}\n`, 'utf8');
}

function round(value, digits = 2) {
    return Number(Number(value || 0).toFixed(digits));
}

function riskLevel(score) {
    if (score >= 90) return 'Critical';
    if (score >= 70) return 'High';
    if (score >= 40) return 'Medium';
    return 'Low';
}

async function createTables() {
    await db.query(`
        CREATE TABLE IF NOT EXISTS fact_costs (
            cost_date DATE NOT NULL,
            product_id VARCHAR(50) NOT NULL,
            product_name VARCHAR(255) DEFAULT NULL,
            purchase_cost DECIMAL(14,2) NOT NULL DEFAULT 0,
            storage_cost DECIMAL(14,2) NOT NULL DEFAULT 0,
            transport_cost DECIMAL(14,2) NOT NULL DEFAULT 0,
            return_cost DECIMAL(14,2) NOT NULL DEFAULT 0,
            total_cost DECIMAL(14,2) NOT NULL DEFAULT 0,
            imported_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (cost_date, product_id),
            KEY idx_fact_costs_total (total_cost)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='成本事实表';
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS fact_risks (
            risk_id VARCHAR(50) NOT NULL,
            risk_type VARCHAR(80) NOT NULL,
            risk_level VARCHAR(20) NOT NULL,
            related_object VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            suggestion TEXT NOT NULL,
            status VARCHAR(20) NOT NULL,
            created_at DATETIME NOT NULL,
            imported_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (risk_id),
            KEY idx_fact_risks_level (risk_level),
            KEY idx_fact_risks_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='风险事件事实表';
    `);
}

async function buildCosts() {
    const [rows] = await db.query(`
        SELECT
            f.date_key AS cost_date,
            f.product_id,
            COALESCE(MAX(p.product_name), f.product_id) AS product_name,
            SUM(f.quantity * COALESCE(p.cost_price, p.unit_price * 0.55, 0)) AS purchase_cost,
            SUM(f.sales_amount) AS sales_amount,
            SUM(f.quantity) AS quantity
        FROM fact_order f
        LEFT JOIN dim_product p ON f.product_id = p.product_id
        GROUP BY f.date_key, f.product_id
        ORDER BY f.date_key DESC, sales_amount DESC
        LIMIT 500
    `);

    return rows.map(row => {
        const purchase = round(row.purchase_cost);
        const sales = Number(row.sales_amount || 0);
        const storage = round(purchase * 0.08 + Number(row.quantity || 0) * 1.2);
        const transport = round(sales * 0.06);
        const returns = round(sales * 0.018);
        return {
            cost_date: row.cost_date instanceof Date ? row.cost_date.toISOString().slice(0, 10) : String(row.cost_date).slice(0, 10),
            product_id: row.product_id,
            product_name: row.product_name,
            purchase_cost: purchase,
            storage_cost: storage,
            transport_cost: transport,
            return_cost: returns,
            total_cost: round(purchase + storage + transport + returns)
        };
    });
}

async function buildRisks(costRows) {
    const risks = [];
    let index = 1;

    const [inventoryRows] = await db.query(`
        SELECT
            i.product_id,
            COALESCE(p.product_name, i.product_id) AS product_name,
            r.warehouse_name,
            i.on_hand_qty,
            i.safety_stock_qty,
            i.snapshot_date
        FROM fact_inventory i
        LEFT JOIN dim_product p ON i.product_id = p.product_id
        LEFT JOIN dim_region r ON i.region_id = r.region_id
        WHERE i.on_hand_qty < i.safety_stock_qty
        ORDER BY (i.safety_stock_qty - i.on_hand_qty) DESC
        LIMIT 60
    `);

    for (const row of inventoryRows) {
        const gap = Number(row.safety_stock_qty || 0) - Number(row.on_hand_qty || 0);
        const score = Math.min(100, 40 + gap / Math.max(Number(row.safety_stock_qty || 1), 1) * 80);
        risks.push({
            risk_id: `RINV${String(index).padStart(5, '0')}`,
            risk_type: '库存不足',
            risk_level: riskLevel(score),
            related_object: row.product_id,
            description: `${row.product_name} 在 ${row.warehouse_name || '未知仓库'} 当前库存 ${row.on_hand_qty}，低于安全库存 ${row.safety_stock_qty}。`,
            suggestion: `优先补货 ${row.product_name}，建议补货量不少于 ${Math.ceil(gap * 1.5)} 件。`,
            status: score >= 70 ? 'open' : 'monitoring',
            created_at: `${row.snapshot_date instanceof Date ? row.snapshot_date.toISOString().slice(0, 10) : String(row.snapshot_date).slice(0, 10)} 09:00:00`
        });
        index += 1;
    }

    const [logisticsRows] = await db.query(`
        SELECT
            shipment_id,
            product_name,
            origin_warehouse,
            destination_city,
            carrier,
            actual_duration_hours - expected_duration_hours AS delay_hours,
            shipped_date
        FROM fact_logistics
        WHERE normalized_status = 'delayed'
        ORDER BY delay_hours DESC
        LIMIT 60
    `);

    for (const row of logisticsRows) {
        const delay = Number(row.delay_hours || 0);
        risks.push({
            risk_id: `RLOG${String(index).padStart(5, '0')}`,
            risk_type: '物流延误',
            risk_level: riskLevel(Math.min(100, 35 + delay)),
            related_object: row.shipment_id,
            description: `${row.origin_warehouse} 到 ${row.destination_city} 的 ${row.carrier} 运单延误 ${delay} 小时，商品为 ${row.product_name}。`,
            suggestion: '跟进承运商时效，必要时切换加急线路或调整发货仓。',
            status: delay >= 48 ? 'open' : 'monitoring',
            created_at: `${row.shipped_date instanceof Date ? row.shipped_date.toISOString().slice(0, 10) : String(row.shipped_date).slice(0, 10)} 10:00:00`
        });
        index += 1;
    }

    const sortedCosts = [...costRows].sort((a, b) => Number(b.total_cost) - Number(a.total_cost)).slice(0, 40);
    for (const row of sortedCosts) {
        if (Number(row.total_cost) < 50000) continue;
        risks.push({
            risk_id: `RCOST${String(index).padStart(5, '0')}`,
            risk_type: '成本异常',
            risk_level: Number(row.total_cost) > 120000 ? 'High' : 'Medium',
            related_object: row.product_id,
            description: `${row.product_name} 在 ${row.cost_date} 总成本 ${row.total_cost} 元，采购、仓储、运输或退货成本需要复核。`,
            suggestion: '拆分成本结构，优先复核采购价、仓储周转和运输线路成本。',
            status: Number(row.total_cost) > 120000 ? 'open' : 'monitoring',
            created_at: `${row.cost_date} 11:00:00`
        });
        index += 1;
    }

    return risks.slice(0, 160);
}

async function importCosts(rows) {
    await db.query('TRUNCATE TABLE fact_costs');
    if (!rows.length) return;
    const values = rows.map(row => [
        row.cost_date,
        row.product_id,
        row.product_name,
        row.purchase_cost,
        row.storage_cost,
        row.transport_cost,
        row.return_cost,
        row.total_cost
    ]);
    await db.query(`
        INSERT INTO fact_costs
        (cost_date, product_id, product_name, purchase_cost, storage_cost, transport_cost, return_cost, total_cost)
        VALUES ?
    `, [values]);
}

async function importRisks(rows) {
    await db.query('TRUNCATE TABLE fact_risks');
    if (!rows.length) return;
    const values = rows.map(row => [
        row.risk_id,
        row.risk_type,
        row.risk_level,
        row.related_object,
        row.description,
        row.suggestion,
        row.status,
        row.created_at
    ]);
    await db.query(`
        INSERT INTO fact_risks
        (risk_id, risk_type, risk_level, related_object, description, suggestion, status, created_at)
        VALUES ?
    `, [values]);
}

async function main() {
    await createTables();
    const costs = await buildCosts();
    const risks = await buildRisks(costs);

    writeCsv(COSTS_CSV, [
        'cost_date', 'product_id', 'product_name', 'purchase_cost',
        'storage_cost', 'transport_cost', 'return_cost', 'total_cost'
    ], costs);
    writeCsv(RISKS_CSV, [
        'risk_id', 'risk_type', 'risk_level', 'related_object',
        'description', 'suggestion', 'status', 'created_at'
    ], risks);

    await importCosts(costs);
    await importRisks(risks);

    const [[costSummary]] = await db.query('SELECT COUNT(*) AS total, SUM(total_cost) AS totalCost FROM fact_costs');
    const [[riskSummary]] = await db.query(`
        SELECT
            COUNT(*) AS total,
            SUM(risk_level = 'Critical') AS criticalCount,
            SUM(risk_level = 'High') AS highCount,
            SUM(status = 'open') AS openCount
        FROM fact_risks
    `);

    console.log('Costs CSV:', COSTS_CSV);
    console.log('Risks CSV:', RISKS_CSV);
    console.log('Cost import summary:', costSummary);
    console.log('Risk import summary:', riskSummary);
}

main()
    .catch(error => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await db.end();
    });
