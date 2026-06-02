"""
供应链数据管道：从抖音电商 CSV 生成后端 JSON 数据
输入：data/processed/douyin_final_v2_reordered.csv（200K 条）
输出：backend-node/data/*.json（6 个实体）
"""
import csv
import json
import random
import sys
import io
from pathlib import Path
from collections import defaultdict, Counter
from datetime import date, timedelta

# Fix Windows GBK encoding for emoji characters
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

random.seed(42)

ROOT = Path(__file__).resolve().parents[2]
CSV_PATH = ROOT / "data" / "processed" / "douyin_final_v2_reordered.csv"
OUT_DIR = ROOT / "backend-node" / "data"

REGIONS = ["广东", "浙江", "江苏", "上海", "北京", "四川", "湖北", "福建"]
WAREHOUSES = [
    {"id": "W001", "name": "广州中心仓", "region": "广东"},
    {"id": "W002", "name": "上海前置仓", "region": "上海"},
    {"id": "W003", "name": "北京分仓", "region": "北京"},
    {"id": "W004", "name": "成都区域仓", "region": "四川"},
    {"id": "W005", "name": "武汉中转仓", "region": "湖北"},
]
CARRIERS = ["顺达物流", "快运通", "飞豹运输", "京广速运", "通达供应链"]
ROUTES = [
    ("广州", "上海"), ("深圳", "北京"), ("上海", "成都"),
    ("广州", "北京"), ("杭州", "武汉"), ("南京", "广州"),
    ("成都", "上海"), ("武汉", "北京"),
]
RISK_TYPES = ["库存不足", "物流延误", "供应商波动", "成本异常", "需求突增", "品质下滑"]
RISK_LEVELS = ["Low", "Medium", "High", "Critical"]
STATUSES = ["completed", "completed", "completed", "pending", "processing"]


def main():
    print("=" * 60)
    print("供应链数据管道：抖音 CSV → 后端 JSON")
    print("=" * 60)

    # ── 1. 读取 CSV ──
    print("\n[1/5] 读取抖音 CSV ...")
    rows = []
    with open(CSV_PATH, encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for r in reader:
            rows.append(r)
    print(f"  已读取 {len(rows):,} 条记录")

    # ── 2. 聚合分析 ──
    print("\n[2/5] 聚合分析 ...")

    # 按 final_brand 聚合
    brand_stats = defaultdict(lambda: {
        "total_gmv": 0, "total_units": 0, "product_count": 0,
        "spu_ids": set(), "categories": set(), "shops": set(),
        "avg_price": 0, "record_count": 0
    })
    for r in rows:
        brand = r.get("final_brand", "") or r.get("brand_name", "") or "未知品牌"
        gmv = float(r.get("gmv", 0) or 0)
        units = float(r.get("unit_sold", 0) or 0)
        price = float(r.get("price_per_unit", 0) or 0)
        brand_stats[brand]["total_gmv"] += gmv
        brand_stats[brand]["total_units"] += int(units)
        brand_stats[brand]["record_count"] += 1
        brand_stats[brand]["spu_ids"].add(r.get("spu_id", ""))
        brand_stats[brand]["categories"].add(r.get("c1_name", ""))
        brand_stats[brand]["shops"].add(r.get("shop_name", ""))
        if price > 0:
            brand_stats[brand]["avg_price"] += price
            brand_stats[brand]["product_count"] += 1

    for brand, stats in brand_stats.items():
        if stats["product_count"] > 0:
            stats["avg_price"] = round(stats["avg_price"] / stats["product_count"], 2)

    # 按 spu_id 聚合 (产品)
    spu_stats = defaultdict(lambda: {
        "total_gmv": 0, "total_units": 0, "record_count": 0,
        "brand": "", "c1_name": "", "c2_name": "", "c3_name": "",
        "spu_name": "", "spu_name_clean": "", "avg_price": 0
    })
    for r in rows:
        spu_id = r.get("spu_id", "")
        spu_stats[spu_id]["total_gmv"] += float(r.get("gmv", 0) or 0)
        spu_stats[spu_id]["total_units"] += int(float(r.get("unit_sold", 0) or 0))
        spu_stats[spu_id]["record_count"] += 1
        spu_stats[spu_id]["brand"] = r.get("final_brand", "") or r.get("brand_name", "")
        spu_stats[spu_id]["c1_name"] = r.get("c1_name", "") or "未分类"
        spu_stats[spu_id]["c2_name"] = r.get("c2_name", "") or "未分类"
        spu_stats[spu_id]["c3_name"] = r.get("c3_name", "") or "未分类"
        spu_stats[spu_id]["spu_name"] = r.get("spu_name", "")
        spu_stats[spu_id]["spu_name_clean"] = r.get("spu_name_clean", "")
        price = float(r.get("price_per_unit", 0) or 0)
        if price > 0:
            spu_stats[spu_id]["avg_price"] += price

    for spu_id, stats in spu_stats.items():
        if stats["record_count"] > 0:
            stats["avg_price"] = round(stats["avg_price"] / stats["record_count"], 2)

    # Top 品牌
    top_brands = sorted(brand_stats.items(), key=lambda x: -x[1]["total_gmv"])
    print(f"  Top 品牌数: {len(top_brands)}")
    print(f"  Top 1 品牌: {top_brands[0][0]} (GMV: {top_brands[0][1]['total_gmv']:,.0f})")

    # Top 产品
    top_spus = sorted(spu_stats.items(), key=lambda x: -x[1]["total_gmv"])
    print(f"  去重产品 (SPU) 数: {len(spu_stats)}")

    # ── 3. 生成供应链实体数据 ──
    print("\n[3/5] 生成供应链实体数据 ...")

    today = date.today()
    base_date = date(2026, 5, 1)

    # --- 产品字典 ---
    PRODUCT_NAMES = {
        "男装": ["男士休闲夹克", "商务衬衫", "纯棉T恤", "运动卫衣", "牛仔裤"],
        "女装": ["连衣裙", "真丝衬衫", "针织开衫", "阔腿裤", "半身裙"],
        "鞋靴": ["运动跑鞋", "商务皮鞋", "休闲帆布鞋", "马丁靴", "乐福鞋"],
        "美妆": ["精华液", "面霜", "口红套装", "防晒乳", "粉底液"],
        "食品": ["坚果礼盒", "茶叶套装", "牛肉干", "蜂蜜礼盒", "咖啡豆"],
        "家居": ["床上四件套", "记忆枕", "遮光窗帘", "收纳箱", "地毯"],
        "母婴": ["婴儿湿巾", "纸尿裤", "儿童水杯", "益智玩具", "婴儿睡袋"],
        "数码": ["无线耳机", "充电宝", "手机壳", "蓝牙音箱", "数据线"],
        "运动": ["瑜伽垫", "哑铃套装", "跳绳", "运动水壶", "护膝"],
        "箱包": ["双肩背包", "旅行箱", "单肩托特包", "钱包", "洗漱包"],
    }

    # --- 供应商 (从品牌 Top 30) ---
    suppliers = []
    for idx, (brand, stats) in enumerate(top_brands[:30]):
        supplier = {
            "supplier_id": f"S{idx+1:03d}",
            "supplier_name": brand,
            "region": random.choice(REGIONS),
            "on_time_rate": round(random.uniform(0.78, 0.98), 2),
            "quality_rate": round(random.uniform(0.80, 0.99), 2),
            "price_stability": round(random.uniform(0.70, 0.97), 2),
            "response_score": round(random.uniform(0.72, 0.98), 2),
            "cooperation_years": random.randint(1, 12),
            "total_gmv": round(stats["total_gmv"], 2),
            "total_units": stats["total_units"],
            "product_count": len(stats["spu_ids"]),
        }
        suppliers.append(supplier)
    print(f"  供应商: {len(suppliers)} 条")

    # --- 产品 (从 Top SPU) ---
    products = []
    product_lookup = {}
    pid = 1
    for spu_id, stats in top_spus[:80]:
        product_name = stats["spu_name_clean"][:30] if stats["spu_name_clean"] else stats["spu_name"][:30]
        if not product_name or len(product_name) < 2:
            continue
        product = {
            "product_id": f"P{pid:03d}",
            "product_name": product_name,
            "spu_id": spu_id,
            "category": stats["c1_name"] or "综合",
            "sub_category": stats["c2_name"] or "",
            "brand": stats["brand"],
            "unit_price": stats["avg_price"] or round(random.uniform(50, 500), 2),
            "total_sales_gmv": round(stats["total_gmv"], 2),
            "total_units_sold": stats["total_units"],
        }
        products.append(product)
        product_lookup[spu_id] = product
        pid += 1
    print(f"  产品: {len(products)} 条")

    # --- 订单 (从 CSV 采样) ---
    orders = []
    sample_size = min(200, len(rows))
    sampled = random.sample(rows, sample_size)
    for idx, r in enumerate(sampled):
        spu_id = r.get("spu_id", "")
        product = product_lookup.get(spu_id, {})
        product_name = product.get("product_name", r.get("spu_name_clean", "未知产品")[:30])
        product_id = product.get("product_id", f"P{random.randint(1,80):03d}")
        category = product.get("category", r.get("c1_name", "综合") or "综合")
        unit_price = product.get("unit_price", float(r.get("price_per_unit", 0) or 100))
        quantity = max(1, int(float(r.get("unit_sold", 0) or 1)))
        order_date = base_date + timedelta(days=random.randint(0, 30))
        order = {
            "order_id": f"O{order_date.strftime('%Y%m%d')}{idx+1:04d}",
            "date": order_date.isoformat(),
            "customer_region": random.choice(["华南", "华东", "华北", "西南", "华中"]),
            "product_id": product_id,
            "product_name": product_name,
            "category": category,
            "quantity": quantity,
            "unit_price": round(unit_price, 2),
            "amount": round(unit_price * quantity, 2),
            "status": random.choice(STATUSES),
        }
        orders.append(order)
    orders.sort(key=lambda o: (o["date"], o["order_id"]))
    print(f"  订单: {len(orders)} 条")

    # --- 库存 ---
    inventory = []
    inv_id = 1
    for product in products[:60]:
        for wh in random.sample(WAREHOUSES, min(3, len(WAREHOUSES))):
            max_stock = random.randint(500, 3000)
            current_stock = random.randint(50, max_stock)
            safety_stock = random.randint(150, 500)
            last_update = (base_date + timedelta(days=random.randint(0, 25))).isoformat() + " 10:00:00"
            item = {
                "product_id": product["product_id"],
                "product_name": product["product_name"],
                "warehouse_id": wh["id"],
                "warehouse_name": wh["name"],
                "current_stock": current_stock,
                "safety_stock": safety_stock,
                "max_stock": max_stock,
                "unit_cost": round(product["unit_price"] * random.uniform(0.3, 0.7), 2),
                "last_update": last_update,
            }
            inventory.append(item)
            inv_id += 1
    print(f"  库存: {len(inventory)} 条")

    # --- 物流 ---
    logistics = []
    for idx, order in enumerate(orders):
        route = random.choice(ROUTES)
        expected = random.randint(24, 96)
        is_delayed = random.random() < 0.2
        actual = expected + random.randint(4, 48) if is_delayed else expected + random.randint(-4, 4)
        actual = max(actual, 1)
        shipment = {
            "shipment_id": f"L{order['order_id'][1:]}",
            "order_id": order["order_id"],
            "origin": route[0],
            "destination": route[1],
            "carrier": random.choice(CARRIERS),
            "expected_duration_hours": expected,
            "actual_duration_hours": actual,
            "status": "delayed" if is_delayed else "on_time",
            "transport_cost": round(random.uniform(400, 2000), 2),
        }
        logistics.append(shipment)
    print(f"  物流: {len(logistics)} 条")

    # --- 成本 ---
    costs = []
    cost_dates = [base_date + timedelta(days=d) for d in range(30)]
    for d in cost_dates:
        for product in random.sample(products[:40], min(6, len(products[:40]))):
            purchase = round(product["unit_price"] * random.randint(8, 80), 2)
            storage = round(purchase * random.uniform(0.05, 0.18), 2)
            transport = round(purchase * random.uniform(0.08, 0.22), 2)
            returned = round(purchase * random.uniform(0, 0.06), 2) if random.random() < 0.15 else 0
            cost = {
                "date": d.isoformat(),
                "product_id": product["product_id"],
                "purchase_cost": purchase,
                "storage_cost": storage,
                "transport_cost": transport,
                "return_cost": returned,
                "total_cost": round(purchase + storage + transport + returned, 2),
            }
            costs.append(cost)
    costs.sort(key=lambda c: (c["date"], c["product_id"]))
    print(f"  成本: {len(costs)} 条")

    # --- 风险 ---
    risks = []
    risk_id = 1
    low_stock_items = [i for i in inventory if i["current_stock"] < i["safety_stock"]]
    delayed_shipments = [l for l in logistics if l["status"] == "delayed"]
    weak_suppliers = [s for s in suppliers if s["on_time_rate"] < 0.85 or s["quality_rate"] < 0.85]
    high_cost_items = sorted(costs, key=lambda c: -c["total_cost"])[:10]

    for item in low_stock_items[:15]:
        risk = {
            "risk_id": f"R{risk_id:04d}",
            "risk_type": "库存不足",
            "risk_level": "High" if item["current_stock"] < item["safety_stock"] * 0.5 else "Medium",
            "related_object": item["product_id"],
            "description": f"产品 {item['product_name']} 在 {item['warehouse_name']} 库存仅剩 {item['current_stock']} 件，低于安全库存 {item['safety_stock']} 件",
            "suggestion": f"建议从其他仓库调拨或紧急采购 {item['product_name']}，补货量不少于 {item['safety_stock'] - item['current_stock'] + 200} 件",
            "status": "open",
            "created_at": f"{today.isoformat()} 09:00:00",
        }
        risks.append(risk)
        risk_id += 1

    for ship in delayed_shipments[:10]:
        delay = ship["actual_duration_hours"] - ship["expected_duration_hours"]
        risk = {
            "risk_id": f"R{risk_id:04d}",
            "risk_type": "物流延误",
            "risk_level": "High" if delay > 24 else "Medium",
            "related_object": ship["order_id"],
            "description": f"订单 {ship['order_id']} 由 {ship['carrier']} 承运，{ship['origin']}→{ship['destination']}，延误 {delay} 小时",
            "suggestion": f"联系承运商 {ship['carrier']} 确认货物位置，必要时启动备选物流方案",
            "status": "open",
            "created_at": f"{today.isoformat()} 09:00:00",
        }
        risks.append(risk)
        risk_id += 1

    for supp in weak_suppliers[:8]:
        issues = []
        if supp["on_time_rate"] < 0.85:
            issues.append(f"准时率仅 {supp['on_time_rate']:.0%}")
        if supp["quality_rate"] < 0.85:
            issues.append(f"品质评分偏低 ({supp['quality_rate']:.0%})")
        risk = {
            "risk_id": f"R{risk_id:04d}",
            "risk_type": "供应商波动",
            "risk_level": "Medium",
            "related_object": supp["supplier_id"],
            "description": f"供应商 {supp['supplier_name']}（{supp['region']}）存在履约波动：{'；'.join(issues)}",
            "suggestion": f"启动供应商履约复盘，评估是否需要引入备选供应商以分散风险",
            "status": "open" if supp["on_time_rate"] < 0.8 else "monitoring",
            "created_at": f"{today.isoformat()} 09:00:00",
        }
        risks.append(risk)
        risk_id += 1

    for cost in high_cost_items[:8]:
        risk = {
            "risk_id": f"R{risk_id:04d}",
            "risk_type": "成本异常",
            "risk_level": "Medium",
            "related_object": cost["product_id"],
            "description": f"产品 {cost['product_id']} 在 {cost['date']} 总成本 {cost['total_cost']:.2f} 元，高于均值",
            "suggestion": f"审查采购和物流成本构成，考虑供应商议价和运输方案优化",
            "status": "open",
            "created_at": f"{today.isoformat()} 09:00:00",
        }
        risks.append(risk)
        risk_id += 1

    # 补充通用风险
    for i in range(min(10, 50 - len(risks))):
        risk = {
            "risk_id": f"R{risk_id:04d}",
            "risk_type": random.choice(["需求突增", "品质下滑", "库存不足"]),
            "risk_level": random.choice(["Low", "Medium"]),
            "related_object": random.choice(products[:50])["product_id"] if products else "P001",
            "description": f"数据监测发现潜在供应链风险项 #{i+1}，需关注异常指标变化趋势",
            "suggestion": f"建议专项分析该指标的历史变化趋势，制定应对预案",
            "status": "open" if random.random() < 0.7 else "resolved",
            "created_at": (base_date + timedelta(days=random.randint(5, 28))).isoformat() + " 11:00:00",
        }
        risks.append(risk)
        risk_id += 1

    risks.sort(key=lambda r: r["created_at"], reverse=True)
    print(f"  风险: {len(risks)} 条")

    # ── 4. 写入 JSON 文件 ──
    print("\n[4/5] 写入 JSON 文件 ...")
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    datasets = {
        "orders.json": orders,
        "inventory.json": inventory,
        "suppliers.json": suppliers,
        "logistics.json": logistics,
        "costs.json": costs,
        "risks.json": risks,
    }

    for filename, data in datasets.items():
        path = OUT_DIR / filename
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"  [OK] {filename}: {len(data)} records -> {path}")

    # ── 5. 数据摘要 ──
    print("\n[5/5] 数据摘要")
    print("=" * 60)
    print(f"  供应商: {len(suppliers)} 条（Top {len(top_brands[:30])} 品牌）")
    print(f"  产品:   {len(products)} 条（Top SPU）")
    print(f"  订单:   {len(orders)} 条（从 {len(rows):,} 条采样）")
    print(f"  库存:   {len(inventory)} 条（{len(products[:60])} 产品 × 仓库）")
    print(f"  物流:   {len(logistics)} 条（与订单 1:1）")
    print(f"  成本:   {len(costs)} 条（30 天 × 产品）")
    print(f"  风险:   {len(risks)} 条（智能生成 + 通用补充）")
    print(f"\n  总计 {sum(len(d) for d in datasets.values())} 条数据记录")
    print("\n[DONE] Data pipeline completed!")


if __name__ == "__main__":
    main()
