const fs = require('node:fs');
const path = require('node:path');
const db = require('../../backend-node/config/db');

const ROOT = path.resolve(__dirname, '..', '..');
const CSV_PATH = path.join(ROOT, 'data', 'logistics.csv');

function parseCsv(content) {
    const rows = [];
    let field = '';
    let row = [];
    let quoted = false;

    for (let i = 0; i < content.length; i += 1) {
        const char = content[i];
        const next = content[i + 1];

        if (char === '"') {
            if (quoted && next === '"') {
                field += '"';
                i += 1;
            } else {
                quoted = !quoted;
            }
            continue;
        }

        if (char === ',' && !quoted) {
            row.push(field);
            field = '';
            continue;
        }

        if ((char === '\n' || char === '\r') && !quoted) {
            if (char === '\r' && next === '\n') i += 1;
            row.push(field);
            if (row.some(value => value !== '')) rows.push(row);
            row = [];
            field = '';
            continue;
        }

        field += char;
    }

    if (field || row.length) {
        row.push(field);
        if (row.some(value => value !== '')) rows.push(row);
    }

    const headers = rows.shift();
    return rows.map(values => Object.fromEntries(headers.map((header, index) => [header, values[index] || ''])));
}

function toNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
}

function toDate(value) {
    return value || null;
}

function dateDiffHours(start, end) {
    if (!start || !end) return 0;
    const startMs = Date.parse(`${start}T00:00:00`);
    const endMs = Date.parse(`${end}T00:00:00`);
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return 0;
    return Math.max(0, Math.round((endMs - startMs) / 3600000));
}

function normalizeStatus(row) {
    const status = row['物流状态'] || '';
    if (status.includes('延误')) return 'delayed';
    const expected = row['预计到达'];
    const actual = row['实际到达'];
    if (expected && actual && Date.parse(actual) > Date.parse(expected)) return 'delayed';
    if (status.includes('签收')) return 'on_time';
    return 'in_transit';
}

function normalizeRow(row) {
    const shippedDate = row['发货日期'];
    const expectedArrival = row['预计到达'];
    const actualArrival = row['实际到达'];
    return {
        shipment_id: row['物流单号'],
        order_id: row['物流单号'],
        spu_id: row.spu_id,
        product_name: row['商品名称'],
        brand: row['品牌'],
        category_name: row['一级分类'],
        origin_warehouse: row['发货仓库'],
        destination_city: row['目的地城市'],
        carrier: row['物流公司'],
        transport_mode: row['运输方式'],
        shipped_date: toDate(shippedDate),
        expected_arrival: toDate(expectedArrival),
        actual_arrival: toDate(actualArrival),
        expected_duration_hours: dateDiffHours(shippedDate, expectedArrival),
        actual_duration_hours: dateDiffHours(shippedDate, actualArrival),
        transport_days: toNumber(row['运输天数']),
        transport_cost: toNumber(row['物流运费']),
        quantity: toNumber(row['发货数量']),
        unit_price: toNumber(row['件单价']),
        logistics_status: row['物流状态'],
        normalized_status: normalizeStatus(row)
    };
}

async function createTable() {
    await db.query(`
        CREATE TABLE IF NOT EXISTS fact_logistics (
            shipment_id VARCHAR(50) NOT NULL,
            order_id VARCHAR(50) NOT NULL,
            spu_id VARCHAR(50) NOT NULL,
            product_name VARCHAR(255) NOT NULL,
            brand VARCHAR(120) DEFAULT NULL,
            category_name VARCHAR(80) DEFAULT NULL,
            origin_warehouse VARCHAR(100) NOT NULL,
            destination_city VARCHAR(80) NOT NULL,
            carrier VARCHAR(80) NOT NULL,
            transport_mode VARCHAR(50) DEFAULT NULL,
            shipped_date DATE NOT NULL,
            expected_arrival DATE DEFAULT NULL,
            actual_arrival DATE DEFAULT NULL,
            expected_duration_hours INT NOT NULL DEFAULT 0,
            actual_duration_hours INT NOT NULL DEFAULT 0,
            transport_days INT NOT NULL DEFAULT 0,
            transport_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
            quantity INT NOT NULL DEFAULT 0,
            unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
            logistics_status VARCHAR(50) NOT NULL,
            normalized_status VARCHAR(20) NOT NULL,
            imported_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (shipment_id),
            KEY idx_fact_logistics_status (normalized_status),
            KEY idx_fact_logistics_ship_date (shipped_date),
            KEY idx_fact_logistics_spu (spu_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='物流明细事实表';
    `);
}

async function importRows(rows) {
    const sql = `
        INSERT INTO fact_logistics (
            shipment_id, order_id, spu_id, product_name, brand, category_name,
            origin_warehouse, destination_city, carrier, transport_mode,
            shipped_date, expected_arrival, actual_arrival,
            expected_duration_hours, actual_duration_hours, transport_days,
            transport_cost, quantity, unit_price, logistics_status, normalized_status
        ) VALUES ?
        ON DUPLICATE KEY UPDATE
            order_id = VALUES(order_id),
            spu_id = VALUES(spu_id),
            product_name = VALUES(product_name),
            brand = VALUES(brand),
            category_name = VALUES(category_name),
            origin_warehouse = VALUES(origin_warehouse),
            destination_city = VALUES(destination_city),
            carrier = VALUES(carrier),
            transport_mode = VALUES(transport_mode),
            shipped_date = VALUES(shipped_date),
            expected_arrival = VALUES(expected_arrival),
            actual_arrival = VALUES(actual_arrival),
            expected_duration_hours = VALUES(expected_duration_hours),
            actual_duration_hours = VALUES(actual_duration_hours),
            transport_days = VALUES(transport_days),
            transport_cost = VALUES(transport_cost),
            quantity = VALUES(quantity),
            unit_price = VALUES(unit_price),
            logistics_status = VALUES(logistics_status),
            normalized_status = VALUES(normalized_status),
            imported_at = CURRENT_TIMESTAMP
    `;

    const columns = [
        'shipment_id', 'order_id', 'spu_id', 'product_name', 'brand', 'category_name',
        'origin_warehouse', 'destination_city', 'carrier', 'transport_mode',
        'shipped_date', 'expected_arrival', 'actual_arrival',
        'expected_duration_hours', 'actual_duration_hours', 'transport_days',
        'transport_cost', 'quantity', 'unit_price', 'logistics_status', 'normalized_status'
    ];

    for (let i = 0; i < rows.length; i += 500) {
        const batch = rows.slice(i, i + 500).map(row => columns.map(column => row[column]));
        await db.query(sql, [batch]);
        console.log(`Imported ${Math.min(i + 500, rows.length)} / ${rows.length}`);
    }
}

async function main() {
    if (!fs.existsSync(CSV_PATH)) {
        throw new Error(`CSV not found: ${CSV_PATH}`);
    }

    const content = fs.readFileSync(CSV_PATH, 'utf8').replace(/^\uFEFF/, '');
    const sourceRows = parseCsv(content);
    const rows = sourceRows.map(normalizeRow).filter(row => row.shipment_id);

    await createTable();
    await importRows(rows);

    const [[summary]] = await db.query(`
        SELECT
            COUNT(*) AS total,
            SUM(normalized_status = 'delayed') AS delayedCount,
            SUM(normalized_status = 'in_transit') AS inTransitCount,
            SUM(normalized_status = 'on_time') AS onTimeCount,
            MIN(shipped_date) AS minDate,
            MAX(shipped_date) AS maxDate
        FROM fact_logistics
    `);

    console.log('Import complete:', summary);
}

main()
    .catch(error => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await db.end();
    });
