
-- Query 1 多维销售分析看板
SELECT
    d.year AS `年份`,
    p.category_name AS `商品品类`,
    r.channel_type AS `渠道类型`,
    SUM(f.quantity) AS `总销量`,
    SUM(f.sales_amount) AS `总销售额`,
    SUM(f.profit) AS `总利润`
FROM fact_order f
JOIN dim_date d ON f.date_key = d.date_key
JOIN dim_product p ON f.product_id = p.product_id
JOIN dim_region r ON f.region_id = r.region_id
GROUP BY d.year, p.category_name, r.channel_type
ORDER BY `总利润` DESC;

-- Query 2 库存健康度预警
SELECT 
    f.snapshot_date AS `检查日期`,
    r.warehouse_name AS `仓库名称`,
    p.product_name AS `商品名称`,
    f.on_hand_qty AS `当前现货库存`,
    f.safety_stock_qty AS `安全库存警戒线`,
    (f.safety_stock_qty - f.on_hand_qty) AS `缺货缺口`,
    CASE 
        WHEN f.on_hand_qty < f.safety_stock_qty THEN '红色预警-严重缺货'
        WHEN f.on_hand_qty = f.safety_stock_qty THEN '黄色橙警-压线运行'
        ELSE '绿色正常'
    END AS `健康状态`
FROM fact_inventory f
JOIN dim_region r ON f.region_id = r.region_id
JOIN dim_product p ON f.product_id = p.product_id
WHERE f.snapshot_date = '2026-05-30' 
  AND f.on_hand_qty <= f.safety_stock_qty
ORDER BY `缺货缺口` DESC;

-- Query 3 节假日效应分析
SELECT 
    CASE d.is_holiday 
        WHEN 1 THEN '节假日/周末' 
        WHEN 0 THEN '正常工作日' 
    END AS `日前属性`,
    COUNT(DISTINCT f.order_id) AS `总订单量`,
    SUM(f.quantity) AS `总商品销量`,
    ROUND(SUM(f.sales_amount) / COUNT(DISTINCT f.order_id), 2) AS `平均客单价`
FROM fact_order f
JOIN dim_date d ON f.date_key = d.date_key
GROUP BY d.is_holiday;

-- Query 4 AI客户画像价值分析
SELECT 
    c.rfm_segment AS `AI客户画像标签`,
    COUNT(DISTINCT f.customer_id) AS `消费客户数`,
    SUM(f.sales_amount) AS `贡献销售额`,
    SUM(f.profit) AS `贡献纯利润`,
    ROUND((SUM(f.profit) / SUM(f.sales_amount)) * 100, 2) AS `利润率(%)`
FROM fact_order f
JOIN dim_customer c ON f.customer_id = c.customer_id
WHERE c.rfm_segment IS NOT NULL
GROUP BY c.rfm_segment
ORDER BY `贡献纯利润` DESC;