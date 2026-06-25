"""
基于 douyin_final_v2.csv 生成物流 CSV 表格
每条商品记录对应一笔物流发货单
"""
import pandas as pd
import numpy as np
import os
import random

current_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(current_dir, '..', 'processed', 'douyin_final_v2.csv')

df = pd.read_csv(csv_path, encoding='utf-8')
print(f"Loaded: {len(df)} rows")

# 随机抽取 10000 条用于生成物流数据（保证品类多样性）
df_sample = df.sample(n=min(10000, len(df)), random_state=42).copy()
print(f"Sample: {len(df_sample)} rows")

# ====== 物流辅助数据 ======
WAREHOUSES = ['广州白云仓', '上海嘉定仓', '北京通州仓', '成都双流仓', '武汉东西湖仓']
CARRIERS = ['顺丰速运', '圆通快递', '中通快递', '韵达物流', '京东物流', '极兔速递', '德邦物流', '申通快递']
SHIPPING_METHODS = ['标准快递', '特快专递', '陆运快件', '航空快件', '同城配送']

# 目的地城市列表（省会+主要城市）
CITIES = ['北京','上海','广州','深圳','杭州','成都','武汉','南京','重庆','西安',
          '郑州','长沙','苏州','天津','合肥','福州','厦门','青岛','大连','沈阳',
          '昆明','南宁','贵阳','南昌','石家庄','太原','哈尔滨','长春','济南','宁波']

STATUSES = ['运输中', '已签收', '已揽收', '派送中', '已延误', '已退回']
STATUS_WEIGHTS = [0.30, 0.35, 0.10, 0.15, 0.06, 0.04]

# ====== 生成物流数据 ======
records = []
for i, (_, row) in enumerate(df_sample.iterrows()):
    wh = random.choice(WAREHOUSES)
    city = random.choice(CITIES)
    carrier = random.choice(CARRIERS)
    method = random.choice(SHIPPING_METHODS)

    # 根据件单价估算运费（高价值商品用顺丰/航空）
    price = row['price_per_unit'] if pd.notna(row['price_per_unit']) and row['price_per_unit'] > 0 else 100
    qty = max(1, int(row['unit_sold']) if pd.notna(row['unit_sold']) else 1)

    # 基础运费 + 重量/体积加成
    base_cost = random.uniform(5, 20)
    weight_cost = qty * random.uniform(0.5, 3.0)
    shipping_fee = round(base_cost + weight_cost, 2)

    # 发货日期和预计到达
    ship_date = pd.Timestamp('2026-04-01') + pd.Timedelta(days=random.randint(0, 89))
    transit_days = random.randint(1, 5)
    est_arrival = ship_date + pd.Timedelta(days=transit_days)

    # 实际到达（约15%延误）
    is_delayed = random.random() < 0.15
    actual_arrival = est_arrival + pd.Timedelta(days=random.randint(1, 3)) if is_delayed else est_arrival

    # 物流状态
    if is_delayed:
        status = '已延误'
    else:
        status = random.choices(STATUSES[:4], weights=[30, 35, 15, 20], k=1)[0]

    # 物流单号
    tracking_no = f"YT{ship_date.strftime('%y%m%d')}{random.randint(1000000,9999999)}"

    # 商品名（优先用清洗后的）
    product_name = row['spu_name_clean'] if pd.notna(row.get('spu_name_clean')) and str(row.get('spu_name_clean')) != 'nan' else str(row['spu_name'])
    # 截断过长的名字
    if len(str(product_name)) > 60:
        product_name = str(product_name)[:60]

    records.append({
        '物流单号': tracking_no,
        'spu_id': str(row['spu_id']),
        '商品名称': product_name,
        '品牌': str(row['final_brand']) if pd.notna(row.get('final_brand')) else '未知品牌',
        '一级分类': str(row['c1_name']) if pd.notna(row['c1_name']) else '未分类',
        '发货仓库': wh,
        '目的地城市': city,
        '物流公司': carrier,
        '运输方式': method,
        '发货日期': ship_date.strftime('%Y-%m-%d'),
        '预计到达': est_arrival.strftime('%Y-%m-%d'),
        '实际到达': actual_arrival.strftime('%Y-%m-%d'),
        '运输天数': int((actual_arrival - ship_date).days),
        '物流运费': shipping_fee,
        '发货数量': qty,
        '件单价': round(price, 2),
        '物流状态': status,
    })

# ====== 保存 CSV ======
df_logistics = pd.DataFrame(records)
output_dir = os.path.join(current_dir, '..', 'processed')
output_path = os.path.join(output_dir, 'logistics.csv')
df_logistics.to_csv(output_path, index=False, encoding='utf-8-sig')

print(f"\nSaved: {output_path}")
print(f"Total: {len(df_logistics)} logistics records")
print(f"\n--- Preview ---")
print(df_logistics.head(10).to_string())
print(f"\n物流状态分布:")
print(df_logistics['物流状态'].value_counts())
print(f"\n物流公司分布:")
print(df_logistics['物流公司'].value_counts())
