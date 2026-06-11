const db = require('../config/db'); 

const ordersRepo = {
    async findAll() {
        try {
            const sql = `
                SELECT 
                    f.order_id, 
                    f.date_key as date, 
                    r.province as customer_region,
                    f.product_id, 
                    p.product_name,
                    p.category_name as category,
                    f.quantity, 
                    p.unit_price,
                    f.sales_amount as amount,
                    'success' as status,
                    d.year,
                    r.channel_type
                FROM fact_order f
                LEFT JOIN dim_date d ON f.date_key = d.date_key
                LEFT JOIN dim_product p ON f.product_id = p.product_id
                LEFT JOIN dim_region r ON f.region_id = r.region_id
                ORDER BY f.date_key DESC
            `;
            const [rows] = await db.query(sql);
            return rows;
        } catch (error) {
            console.error('MySQL ordersRepo.findAll Error:', error);
            return [];
        }
    },

    async append(item) {
        try {
            const sql = `
                INSERT INTO fact_order 
                (order_id, row_num, date_key, product_id, customer_id, region_id, quantity, sales_amount, discount_amount, profit) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const params = [
                item.order_id || `O${Date.now()}`,
                item.row_num || 1,
                item.date || '2026-05-30', 
                item.product_id,
                item.customer_id || 'C001', 
                item.region_id || 'W001',   
                item.quantity || 0,
                item.amount || 0,
                item.discount_amount || 0,
                item.profit || 0
            ];
            await db.query(sql, params);
            return item;
        } catch (error) {
            console.error('MySQL ordersRepo.append Error:', error);
            throw error;
        }
    }
};

const inventoryRepo = {
    async findAll() {
        try {
            const sql = `
                SELECT 
                    f.snapshot_date, 
                    f.product_id, 
                    p.product_name,
                    f.region_id as warehouse_id, 
                    r.warehouse_name,
                    f.on_hand_qty as current_stock, 
                    0 as on_order_qty, -- 数仓事实表未提供，保留0兼容组长结构
                    f.safety_stock_qty as safety_stock,
                    p.unit_price as unit_cost
                FROM fact_inventory f
                LEFT JOIN dim_region r ON f.region_id = r.region_id
                LEFT JOIN dim_product p ON f.product_id = p.product_id
                ORDER BY f.snapshot_date DESC, (f.safety_stock_qty - f.on_hand_qty) DESC
            `;
            const [rows] = await db.query(sql);
            return rows;
        } catch (error) {
            console.error('MySQL inventoryRepo.findAll Error:', error);
            return [];
        }
    },

    async append(item) {
        try {
            const sql = `
                INSERT INTO fact_inventory 
                (snapshot_date, product_id, region_id, on_hand_qty, on_order_qty, safety_stock_qty) 
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            const params = [
                item.snapshot_date || '2026-05-30', // 对齐数仓的默认日期
                item.product_id,
                item.region_id || item.warehouse_id || 'W001',
                item.on_hand_qty || item.current_stock || 0,
                item.on_order_qty || 0,
                item.safety_stock_qty || item.safety_stock || 0
            ];
            await db.query(sql, params);
            return item;
        } catch (error) {
            console.error('MySQL inventoryRepo.append Error:', error);
            throw error;
        }
    }
};

const suppliersRepo = {
    async findAll() {
        try {
            const sql = `
                SELECT 
                    supplier_id,
                    supplier_name,
                    '通用区域' as region, 
                    0.96 as on_time_rate,
                    0.97 as quality_rate,
                    0.92 as price_stability,
                    4.8 as response_score,
                    lead_time_days as cooperation_years,
                    150000 as total_gmv,
                    6000 as total_units,
                    8 as product_count
                FROM dim_supplier
            `;
            const [rows] = await db.query(sql);
            return rows;
        } catch (error) {
            console.error('MySQL suppliersRepo.findAll Error:', error);
            return [];
        }
    },
    async append(item) { return item; }
};

const logisticsRepo = { async findAll() { return []; }, async append(item) { return item; } };
const costsRepo = { async findAll() { return []; }, async append(item) { return item; } };
const risksRepo = { async findAll() { return []; }, async append(item) { return item; } };

module.exports = {
    ordersRepo,
    inventoryRepo,
    suppliersRepo,
    logisticsRepo,
    costsRepo,
    risksRepo
};