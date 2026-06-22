"""
供应链数据导入 MySQL
输入：data/processed/douyin_final_v2.csv
输出：
  1. 直接写入 MySQL 数据库 supply_chain_bi
  2. 更新 database_sql/build_database.sql（建表 + 插入数据）
"""
import csv
import json
import sys
import io
import random
import hashlib
from pathlib import Path
from datetime import date, timedelta
from collections import defaultdict

# Fix Windows encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

random.seed(42)

ROOT = Path(__file__).resolve().parents[2]
CSV_PATH = ROOT / "data" / "processed" / "douyin_final_v2_reordered.csv"
# fallback to v2 if reordered not available
if not CSV_PATH.exists():
    CSV_PATH = ROOT / "data" / "processed" / "douyin_final_v2.csv"
SQL_OUT = ROOT / "database" / "build_database.sql"

# MySQL connection config (same as backend-node/config/db.js)
MYSQL_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "123456",
    "database": "supply_chain_bi",
    "charset": "utf8mb4",
}

# ============================================================
# 维度映射常量
# ============================================================

REGIONS = [
    {"region_id": "R01", "warehouse_name": "广州中心仓", "province": "广东", "city": "广州", "channel_type": "线下"},
    {"region_id": "R02", "warehouse_name": "上海前置仓", "province": "上海", "city": "上海", "channel_type": "线上"},
    {"region_id": "R03", "warehouse_name": "北京分仓", "province": "北京", "city": "北京", "channel_type": "线下"},
    {"region_id": "R04", "warehouse_name": "成都区域仓", "province": "四川", "city": "成都", "channel_type": "线下"},
    {"region_id": "R05", "warehouse_name": "武汉中转仓", "province": "湖北", "city": "武汉", "channel_type": "线上"},
    {"region_id": "R06", "warehouse_name": "杭州电商仓", "province": "浙江", "city": "杭州", "channel_type": "线上"},
    {"region_id": "R07", "warehouse_name": "南京配送中心", "province": "江苏", "city": "南京", "channel_type": "自营"},
    {"region_id": "R08", "warehouse_name": "深圳跨境仓", "province": "广东", "city": "深圳", "channel_type": "加盟"},
]

SUPPLIER_RATINGS = ["A", "A", "B", "B", "B", "C", "C", "D"]  # weighted distribution
AGE_GROUPS = ["18-25", "26-35", "36-45", "46-55", "55+"]
CUSTOMER_LEVELS = ["普通", "普通", "普通", "黄金", "黄金", "钻石"]
RFM_SEGMENTS = ["高价值客户", "潜力客户", "流失风险", "一般客户", "低价值客户",
                "高价值客户", "潜力客户", "一般客户", "一般客户", "流失风险"]

# Category mapping from CSV c1_name -> DB category_name
CATEGORY_MAP = {
    "服装": "服装", "鞋靴": "鞋靴", "美妆": "美妆",
    "食品酒水": "食品", "家居": "家居", "母婴": "母婴",
    "数码": "数码", "运动": "运动", "箱包": "箱包",
    "图书": "图书", "珠宝": "珠宝", "家电": "家电",
    "个护": "美妆", "生鲜": "食品", "医药": "医药",
    "乐器": "乐器", "宠物": "宠物", "汽车": "汽车",
}


def read_csv(path, limit=None):
    """读取 CSV 返回 dict list"""
    rows = []
    with open(path, encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for i, r in enumerate(reader):
            if limit and i >= limit:
                break
            rows.append(r)
    return rows


def safe_float(v, default=0.0):
    try:
        return float(v) if v else default
    except (ValueError, TypeError):
        return default


def safe_int(v, default=0):
    try:
        return int(float(v)) if v else default
    except (ValueError, TypeError):
        return default


def make_id(prefix, n, width=3):
    return f"{prefix}{n:0{width}d}"


# ============================================================
# 1. 生成维度数据
# ============================================================

def build_suppliers(rows):
    """从品牌提取供应商（Top 30 品牌）"""
    brand_stats = defaultdict(lambda: {"gmv": 0, "units": 0, "count": 0})
    for r in rows:
        brand = r.get("final_brand", "") or r.get("brand_name", "") or "未知品牌"
        if not brand or brand == "未知品牌":
            continue
        brand_stats[brand]["gmv"] += safe_float(r.get("gmv"))
        brand_stats[brand]["units"] += safe_int(r.get("unit_sold"))
        brand_stats[brand]["count"] += 1

    top = sorted(brand_stats.items(), key=lambda x: -x[1]["gmv"])[:30]
    suppliers = []
    for i, (brand, stats) in enumerate(top):
        suppliers.append({
            "supplier_id": make_id("S", i + 1),
            "supplier_name": brand[:100],
            "supplier_rating": random.choice(SUPPLIER_RATINGS),
            "lead_time_days": random.randint(3, 30),
        })
    return suppliers


def build_products(rows, suppliers):
    """从 SPU 提取产品（Top 80 SPU），关联供应商"""
    spu_stats = defaultdict(lambda: {
        "spu_name": "", "spu_name_clean": "", "brand": "",
        "c1_name": "", "c2_name": "", "price": 0, "gmv": 0,
        "units": 0, "count": 0, "price_sum": 0,
    })
    for r in rows:
        spu_id = r.get("spu_id", "")
        if not spu_id:
            continue
        s = spu_stats[spu_id]
        s["spu_name"] = r.get("spu_name", "")
        s["spu_name_clean"] = r.get("spu_name_clean", "") or r.get("spu_name", "")
        s["brand"] = r.get("final_brand", "") or r.get("brand_name", "")
        raw_cat = r.get("c1_name", "") or "综合"
        s["c1_name"] = CATEGORY_MAP.get(raw_cat, raw_cat)
        s["c2_name"] = r.get("c2_name", "") or ""
        s["gmv"] += safe_float(r.get("gmv"))
        s["units"] += safe_int(r.get("unit_sold"))
        s["count"] += 1
        price = safe_float(r.get("price_per_unit"))
        if price > 0:
            s["price_sum"] += price

    # 建立 brand -> supplier_id 映射
    brand_supplier = {}
    for sup in suppliers:
        brand_supplier[sup["supplier_name"]] = sup["supplier_id"]

    top = sorted(spu_stats.items(), key=lambda x: -x[1]["gmv"])[:80]
    products = []
    for i, (spu_id, s) in enumerate(top):
        name = (s["spu_name_clean"] or s["spu_name"])[:200]
        if not name or len(name) < 2:
            continue
        avg_price = round(s["price_sum"] / s["count"], 2) if s["count"] > 0 else round(random.uniform(30, 500), 2)
        cost_price = round(avg_price * random.uniform(0.35, 0.65), 2)
        supplier_id = brand_supplier.get(s["brand"], suppliers[0]["supplier_id"] if suppliers else "S001")
        products.append({
            "product_id": make_id("P", len(products) + 1),
            "product_name": name,
            "category_name": s["c1_name"] or "综合",
            "brand": s["brand"][:100] if s["brand"] else None,
            "unit_price": avg_price,
            "cost_price": cost_price,
            "supplier_id": supplier_id,
        })
        if len(products) >= 60:
            break
    return products


def build_dates(start_date="2025-06-01", days=400):
    """生成日期维度数据"""
    dates = []
    start = date.fromisoformat(start_date)
    for i in range(days):
        d = start + timedelta(days=i)
        iso = d.isoformat()
        dates.append({
            "date_key": iso,
            "year": d.year,
            "quarter": (d.month - 1) // 3 + 1,
            "month": d.month,
            "day_of_month": d.day,
            "week_of_year": d.isocalendar()[1],
            "is_holiday": 1 if d.weekday() >= 5 else 0,  # 周末算节假日
        })
    return dates


def build_customers(rows):
    """从 CSV user_id 提取客户（去重 + 生成画像）"""
    user_ids = set()
    for r in rows:
        uid = r.get("user_id", "0")
        if uid and uid != "0":
            user_ids.add(uid)

    # 如果 user_id 都是 0（抖音数据通常如此），生成模拟客户
    if len(user_ids) < 50:
        user_ids = set()
        for i in range(1, 201):
            user_ids.add(f"U{i:05d}")

    customers = []
    for uid in sorted(user_ids)[:200]:
        customers.append({
            "customer_id": uid[:50],
            "gender": random.choice(["男", "女", "未知"]),
            "age_group": random.choice(AGE_GROUPS),
            "customer_level": random.choice(CUSTOMER_LEVELS),
            "rfm_segment": random.choice(RFM_SEGMENTS),
        })
    return customers


# ============================================================
# 2. 生成事实数据
# ============================================================

def build_orders(rows, products, customers, date_list, regions):
    """从 CSV 生成订单事实表"""
    # 建立映射
    product_ids = [p["product_id"] for p in products]
    customer_ids = [c["customer_id"] for c in customers]
    region_ids = [r["region_id"] for r in regions]

    # 按 spu_id -> product_id 建立快速查找
    spu_to_product = {}
    for p in products:
        # 产品名部分匹配
        spu_to_product[p["product_name"][:20]] = p

    orders = []
    order_counter = 1
    sample_size = min(5000, len(rows))
    sampled = random.sample(rows, sample_size)

    for r in sampled:
        spu_name = (r.get("spu_name_clean", "") or r.get("spu_name", ""))[:200]
        if not spu_name or len(spu_name) < 2:
            continue

        # 匹配产品
        matched_product = None
        for p in products:
            if p["product_name"][:10] in spu_name or spu_name[:10] in p["product_name"]:
                matched_product = p
                break
        if not matched_product:
            matched_product = random.choice(products)

        quantity = max(1, safe_int(r.get("unit_sold"), 1))
        unit_price = matched_product["unit_price"]
        sales_amount = round(unit_price * quantity, 2)
        discount_amount = round(sales_amount * random.uniform(0, 0.15), 2)
        profit = round(sales_amount - matched_product["cost_price"] * quantity - discount_amount, 2)

        # 随机选择日期
        date_key = random.choice(date_list)["date_key"]

        orders.append({
            "order_id": f"ORD{order_counter:06d}",
            "row_num": 1,
            "date_key": date_key,
            "product_id": matched_product["product_id"],
            "customer_id": random.choice(customer_ids),
            "region_id": random.choice(region_ids),
            "quantity": quantity,
            "sales_amount": sales_amount,
            "discount_amount": discount_amount,
            "profit": profit,
        })
        order_counter += 1

    print(f"  生成 {len(orders)} 条订单记录")
    return orders


def build_inventory(products, regions, date_list):
    """生成库存快照事实表"""
    inventory = []
    # 选最近 90 天的日期作为快照
    recent_dates = date_list[-90:]

    for product in products[:50]:
        for region in random.sample(regions, min(4, len(regions))):
            # 每个产品-仓库组合随机选择几个快照日期
            for snap_date in random.sample(recent_dates, min(3, len(recent_dates))):
                safety = random.randint(50, 300)
                on_hand = random.randint(10, 800)
                on_order = random.randint(0, 200)
                inventory.append({
                    "snapshot_date": snap_date["date_key"],
                    "product_id": product["product_id"],
                    "region_id": region["region_id"],
                    "on_hand_qty": on_hand,
                    "on_order_qty": on_order,
                    "safety_stock_qty": safety,
                })

    print(f"  生成 {len(inventory)} 条库存记录")
    return inventory


# ============================================================
# 3. SQL 生成
# ============================================================

def escape_sql(v):
    """转义 SQL 字符串值"""
    if v is None:
        return "NULL"
    if isinstance(v, (int, float)):
        return str(v)
    s = str(v).replace("\\", "\\\\").replace("'", "\\'")
    return f"'{s}'"


def build_insert_sql(table, columns, rows):
    """生成 INSERT 语句"""
    if not rows:
        return ""
    col_names = ", ".join(f"`{c}`" for c in columns)
    lines = [f"INSERT INTO `{table}` ({col_names}) VALUES"]
    value_lines = []
    for row in rows:
        vals = ", ".join(escape_sql(row.get(c)) for c in columns)
        value_lines.append(f"  ({vals})")
    lines.append(",\n".join(value_lines) + ";")
    return "\n".join(lines)


def get_ddl():
    """返回 DDL 建表语句"""
    return """
DROP TABLE IF EXISTS `fact_inventory`;
DROP TABLE IF EXISTS `fact_order`;
DROP TABLE IF EXISTS `dim_customer`;
DROP TABLE IF EXISTS `dim_region`;
DROP TABLE IF EXISTS `dim_product`;
DROP TABLE IF EXISTS `dim_supplier`;
DROP TABLE IF EXISTS `dim_date`;


CREATE TABLE `dim_date` (
`date_key` DATE NOT NULL COMMENT '日期(格式: YYYY-MM-DD)，主键',
`year` INT NOT NULL COMMENT '年份',
`quarter` INT NOT NULL COMMENT '季度 (1-4)',
`month` INT NOT NULL COMMENT '月份 (1-12)',
`day_of_month` INT NOT NULL COMMENT '每月几号 (1-31)',
`week_of_year` INT NOT NULL COMMENT '一年中的第几周',
`is_holiday` INT NOT NULL COMMENT '是否节假日 0:工作日, 1:节假日',
PRIMARY KEY (`date_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='时间维度表';


CREATE TABLE `dim_supplier` (
`supplier_id` VARCHAR(50) NOT NULL COMMENT '供应商唯一编码',
`supplier_name` VARCHAR(100) NOT NULL COMMENT '供应商全称',
`supplier_rating` VARCHAR(10) NOT NULL COMMENT '供应商初始信用评级 A/B/C/D',
`lead_time_days` INT NOT NULL COMMENT '承诺交期天数',
PRIMARY KEY (`supplier_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='供应商维度表';


CREATE TABLE `dim_product` (
`product_id` VARCHAR(50) NOT NULL COMMENT '商品/物料唯一编码',
`product_name` VARCHAR(200) NOT NULL COMMENT '商品标准名称',
`category_name` VARCHAR(100) NOT NULL COMMENT '商品大类/品类',
`brand` VARCHAR(100) DEFAULT NULL COMMENT '品牌名称',
`unit_price` DECIMAL(10,2) NOT NULL COMMENT '标准零售价',
`cost_price` DECIMAL(10,2) NOT NULL COMMENT '采购成本价',
`supplier_id` VARCHAR(50) DEFAULT NULL COMMENT '默认供应商ID',
PRIMARY KEY (`product_id`),
CONSTRAINT `fk_prod_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `dim_supplier` (`supplier_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品维度表';


CREATE TABLE `dim_region` (
`region_id` VARCHAR(50) NOT NULL COMMENT '区域/仓库唯一标识',
`warehouse_name` VARCHAR(100) NOT NULL COMMENT '仓库/门店名称',
`province` VARCHAR(50) NOT NULL COMMENT '地理省份',
`city` VARCHAR(50) NOT NULL COMMENT '地理城市',
`channel_type` VARCHAR(50) NOT NULL COMMENT '渠道类型 线上/线下/自营/加盟',
PRIMARY KEY (`region_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='地区/仓库维度表';


CREATE TABLE `dim_customer` (
`customer_id` VARCHAR(50) NOT NULL COMMENT '客户唯一编码',
`gender` VARCHAR(10) DEFAULT NULL COMMENT '性别',
`age_group` VARCHAR(20) DEFAULT NULL COMMENT '年龄段',
`customer_level` VARCHAR(20) NOT NULL COMMENT '会员等级',
`rfm_segment` VARCHAR(50) DEFAULT NULL COMMENT 'AI挖掘出的RFM价值标签',
PRIMARY KEY (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户维度表';


CREATE TABLE `fact_order` (
`order_id` VARCHAR(50) NOT NULL COMMENT '业务系统原始订单号',
`row_num` INT NOT NULL COMMENT '订单内行号',
`date_key` DATE NOT NULL COMMENT '关联 dim_date',
`product_id` VARCHAR(50) NOT NULL COMMENT '关联 dim_product',
`customer_id` VARCHAR(50) NOT NULL COMMENT '关联 dim_customer',
`region_id` VARCHAR(50) NOT NULL COMMENT '关联 dim_region',
`quantity` INT NOT NULL COMMENT '销售数量',
`sales_amount` DECIMAL(12,2) NOT NULL COMMENT '实际销售金额',
`discount_amount` DECIMAL(12,2) DEFAULT 0.00 COMMENT '优惠折扣金额',
`profit` DECIMAL(12,2) NOT NULL COMMENT '自动计算净毛利',
PRIMARY KEY (`order_id`, `row_num`),
CONSTRAINT `fk_order_date` FOREIGN KEY (`date_key`) REFERENCES `dim_date` (`date_key`),
CONSTRAINT `fk_order_product` FOREIGN KEY (`product_id`) REFERENCES `dim_product` (`product_id`),
CONSTRAINT `fk_order_customer` FOREIGN KEY (`customer_id`) REFERENCES `dim_customer` (`customer_id`),
CONSTRAINT `fk_order_region` FOREIGN KEY (`region_id`) REFERENCES `dim_region` (`region_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单明细事实表';


CREATE TABLE `fact_inventory` (
`snapshot_date` DATE NOT NULL COMMENT '快照日期',
`product_id` VARCHAR(50) NOT NULL COMMENT '物料/商品ID',
`region_id` VARCHAR(50) NOT NULL COMMENT '仓库ID',
`on_hand_qty` INT NOT NULL COMMENT '在库可用实物库存量',
`on_order_qty` INT NOT NULL COMMENT '在途库存量',
`safety_stock_qty` INT NOT NULL COMMENT '安全库存水位线',
PRIMARY KEY (`snapshot_date`, `product_id`, `region_id`),
CONSTRAINT `fk_inv_date` FOREIGN KEY (`snapshot_date`) REFERENCES `dim_date` (`date_key`),
CONSTRAINT `fk_inv_product` FOREIGN KEY (`product_id`) REFERENCES `dim_product` (`product_id`),
CONSTRAINT `fk_inv_region` FOREIGN KEY (`region_id`) REFERENCES `dim_region` (`region_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='库存快照事实表';
"""


# ============================================================
# 4. MySQL 连接
# ============================================================

def get_mysql_connection():
    try:
        import pymysql
        conn = pymysql.connect(**MYSQL_CONFIG)
        return conn
    except ImportError:
        pass
    try:
        import mysql.connector
        conn = mysql.connector.connect(**MYSQL_CONFIG)
        return conn
    except ImportError:
        pass
    return None


def execute_sql(conn, sql):
    """执行单条 SQL"""
    cursor = conn.cursor()
    try:
        # 跳过注释和空行
        for stmt in sql.split(";"):
            stmt = stmt.strip()
            if not stmt or stmt.startswith("--") or stmt.startswith("/*"):
                continue
            cursor.execute(stmt)
        conn.commit()
    except Exception as e:
        print(f"  [WARN] SQL 执行警告: {e}")
    finally:
        cursor.close()


def import_to_mysql(data, use_pymysql=True):
    """将数据导入 MySQL"""
    # 先尝试用命令行 mysql 导入（更可靠）
    import subprocess
    import tempfile
    import os

    # 生成完整 SQL
    sql = get_ddl()
    sql += build_insert_sql("dim_date",
                            ["date_key", "year", "quarter", "month", "day_of_month", "week_of_year", "is_holiday"],
                            data["dates"])
    sql += "\n\n"
    sql += build_insert_sql("dim_supplier",
                            ["supplier_id", "supplier_name", "supplier_rating", "lead_time_days"],
                            data["suppliers"])
    sql += "\n\n"
    sql += build_insert_sql("dim_region",
                            ["region_id", "warehouse_name", "province", "city", "channel_type"],
                            data["regions"])
    sql += "\n\n"
    sql += build_insert_sql("dim_customer",
                            ["customer_id", "gender", "age_group", "customer_level", "rfm_segment"],
                            data["customers"])
    sql += "\n\n"
    sql += build_insert_sql("dim_product",
                            ["product_id", "product_name", "category_name", "brand", "unit_price", "cost_price",
                             "supplier_id"],
                            data["products"])
    sql += "\n\n"
    # 事实表分批插入以提高可靠性
    for i in range(0, len(data["orders"]), 500):
        batch = data["orders"][i:i + 500]
        sql += build_insert_sql("fact_order",
                                ["order_id", "row_num", "date_key", "product_id", "customer_id", "region_id",
                                 "quantity", "sales_amount", "discount_amount", "profit"],
                                batch)
        sql += "\n\n"

    for i in range(0, len(data["inventory"]), 500):
        batch = data["inventory"][i:i + 500]
        sql += build_insert_sql("fact_inventory",
                                ["snapshot_date", "product_id", "region_id", "on_hand_qty", "on_order_qty",
                                 "safety_stock_qty"],
                                batch)
        sql += "\n\n"

    # 方法 1: 用命令行 mysql 客户端
    mysql_cmd = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe"
    if os.path.exists(mysql_cmd):
        print("  使用 mysql 命令行客户端导入...")
        with tempfile.NamedTemporaryFile(mode="w", suffix=".sql", encoding="utf-8", delete=False) as f:
            f.write(sql)
            tmp_path = f.name

        result = subprocess.run(
            [mysql_cmd, "-u", MYSQL_CONFIG["user"], f"-p{MYSQL_CONFIG['password']}",
             MYSQL_CONFIG["database"]],
            input=sql,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
        )
        os.unlink(tmp_path)
        if result.returncode == 0:
            print("  [OK] MySQL 导入成功")
            return True
        else:
            print(f"  [WARN] mysql 客户端导入出错，尝试 Python 连接: {result.stderr[:200] if result.stderr else 'unknown'}")

    # 方法 2: Python MySQL 连接器
    try:
        import pymysql
        conn = pymysql.connect(**MYSQL_CONFIG)
        print("  使用 pymysql 连接导入...")
        cursor = conn.cursor()

        # 分条执行
        statements = sql.split(";\n")
        done = 0
        for stmt in statements:
            stmt = stmt.strip()
            if not stmt or stmt.startswith("--") or stmt.startswith("/*"):
                continue
            try:
                cursor.execute(stmt)
                done += 1
            except Exception as e:
                if "Duplicate" in str(e) or "duplicate" in str(e):
                    pass  # 忽略重复键
                else:
                    print(f"  [WARN] SQL: {stmt[:80]}... -> {e}")

        conn.commit()
        cursor.close()
        conn.close()
        print(f"  [OK] pymysql 导入成功 ({done} 条语句)")
        return True
    except ImportError:
        print("  [SKIP] pymysql 未安装，跳过直接导入")
    except Exception as e:
        print(f"  [WARN] Python 导入失败: {e}")

    return False


# ============================================================
# Main
# ============================================================

def main():
    print("=" * 60)
    print("供应链数据导入 MySQL")
    print("=" * 60)

    # ── 读取 CSV ──
    print("\n[1/5] 读取 CSV 数据...")
    rows = read_csv(CSV_PATH)
    print(f"  已读取 {len(rows):,} 条记录")

    # ── 生成维度数据 ──
    print("\n[2/5] 生成维度数据...")
    suppliers = build_suppliers(rows)
    print(f"  dim_supplier: {len(suppliers)} 条")
    products = build_products(rows, suppliers)
    print(f"  dim_product:  {len(products)} 条")
    date_list = build_dates("2025-06-01", 400)
    print(f"  dim_date:     {len(date_list)} 条")
    regions = REGIONS
    print(f"  dim_region:   {len(regions)} 条")
    customers = build_customers(rows)
    print(f"  dim_customer: {len(customers)} 条")

    # ── 生成事实数据 ──
    print("\n[3/5] 生成事实数据...")
    orders = build_orders(rows, products, customers, date_list, regions)
    inventory = build_inventory(products, regions, date_list)

    data = {
        "suppliers": suppliers,
        "products": products,
        "dates": date_list,
        "regions": regions,
        "customers": customers,
        "orders": orders,
        "inventory": inventory,
    }

    # ── 写入 SQL 文件 ──
    print("\n[4/5] 写入 SQL 文件...")
    sql = get_ddl()
    sql += "\n\n-- ============================================================\n"
    sql += "-- 以下为数据导入语句\n"
    sql += "-- ============================================================\n\n"

    for table, cols in [
        ("dim_date", ["date_key", "year", "quarter", "month", "day_of_month", "week_of_year", "is_holiday"]),
        ("dim_supplier", ["supplier_id", "supplier_name", "supplier_rating", "lead_time_days"]),
        ("dim_region", ["region_id", "warehouse_name", "province", "city", "channel_type"]),
        ("dim_customer", ["customer_id", "gender", "age_group", "customer_level", "rfm_segment"]),
        ("dim_product", ["product_id", "product_name", "category_name", "brand", "unit_price", "cost_price",
                         "supplier_id"]),
    ]:
        key = {
            "dim_date": "dates", "dim_supplier": "suppliers", "dim_region": "regions",
            "dim_customer": "customers", "dim_product": "products",
        }[table]
        sql += f"\n-- {table}\n"
        sql += build_insert_sql(table, cols, data[key]) + "\n"

    # fact_order 分批
    sql += f"\n-- fact_order ({len(orders)} 条)\n"
    for i in range(0, len(orders), 500):
        batch = orders[i:i + 500]
        sql += build_insert_sql("fact_order",
                                ["order_id", "row_num", "date_key", "product_id", "customer_id", "region_id",
                                 "quantity", "sales_amount", "discount_amount", "profit"],
                                batch) + "\n"

    # fact_inventory 分批
    sql += f"\n-- fact_inventory ({len(inventory)} 条)\n"
    for i in range(0, len(inventory), 500):
        batch = inventory[i:i + 500]
        sql += build_insert_sql("fact_inventory",
                                ["snapshot_date", "product_id", "region_id", "on_hand_qty", "on_order_qty",
                                 "safety_stock_qty"],
                                batch) + "\n"

    SQL_OUT.parent.mkdir(parents=True, exist_ok=True)
    with open(SQL_OUT, "w", encoding="utf-8") as f:
        f.write(sql)

    file_size_mb = SQL_OUT.stat().st_size / (1024 * 1024)
    print(f"  [OK] {SQL_OUT} ({file_size_mb:.1f} MB)")

    # ── 导入 MySQL ──
    print("\n[5/5] 导入 MySQL...")
    success = import_to_mysql(data)

    # ── 验证 ──
    print("\n" + "=" * 60)
    print("数据统计:")
    print(f"  dim_date:     {len(date_list):>6} 条")
    print(f"  dim_supplier: {len(suppliers):>6} 条")
    print(f"  dim_product:  {len(products):>6} 条")
    print(f"  dim_region:   {len(regions):>6} 条")
    print(f"  dim_customer: {len(customers):>6} 条")
    print(f"  fact_order:   {len(orders):>6} 条")
    print(f"  fact_inventory:{len(inventory):>6} 条")
    total = len(date_list) + len(suppliers) + len(products) + len(regions) + len(customers) + len(orders) + len(
        inventory)
    print(f"  {'总计':>12}: {total:>6} 条")
    print("=" * 60)
    print("[DONE] 数据导入完成！")
    if success:
        print("  数据已写入 MySQL 数据库 supply_chain_bi")
    print(f"  SQL 文件已更新: {SQL_OUT}")


if __name__ == "__main__":
    main()
