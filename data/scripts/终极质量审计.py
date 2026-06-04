import pandas as pd
import os

# --- 1. 动态获取路径 (最稳健的方法) ---
current_dir = os.path.dirname(os.path.abspath(__file__))
# 拼接路径：当前目录 -> 上一级 -> processed -> 文件名
file_path = os.path.join(current_dir, '..', 'processed', 'douyin_final_v2_reordered.csv')

print(f"--- 启动终极审计 ---")
print(f"核查路径: {os.path.abspath(file_path)}")

# --- 2. 读取并检测 ---
try:
    df = pd.read_csv(file_path, encoding='utf-8-sig') # 记得用 sig 确保中文读取正常
    print("✅ 文件加载成功！开始体检...\n")
    
   # 1. 结构完整性检查
    print(f"[1] 数据规模: {df.shape[0]} 行, {df.shape[1]} 列")
    print(f"[2] 列名顺序确认: {df.columns.tolist()[:3]} ... (前三列应为 ID, Clean_Name, Raw_Name)")

    # 2. 清洗效果量化 (对比 spu_name 和 spu_name_clean)
    # 计算有多少名字被成功“美化”了
    changed_count = (df['spu_name'] != df['spu_name_clean']).sum()
    print(f"[3] 文本美化覆盖率: {changed_count} / {len(df)} ({changed_count/len(df)*100:.2f}%)")

    # 3. 核心维度零缺失检查
    essential_cols = ['spu_id', 'final_brand', 'gmv', 'unit_sold']
    missing = df[essential_cols].isnull().sum()
    print(f"[4] 核心字段缺失情况:\n{missing}")

    # 4. 业务逻辑合理性检查
    # 检查单价是否有异常（极高或极低）
    print(f"\n[5] 价格统计描述:")
    print(df['price_per_unit'].describe())

    # 5. 采样展示对比图
    print("\n[6] 随机抽取 3 条清洗对比记录:")
    sample = df.sample(3)
    for _, row in sample.iterrows():
        print(f"  - 原始: {row['spu_name'][:30]}...")
        print(f"  - 美化: {row['spu_name_clean']}")
        print("-" * 20)
    # 额外增加一个：检查前三列顺序
    print(f"当前前三列顺序: {list(df.columns[:3])}")
    
    # 检查是否真的把名字洗干净了 (抽样 3 条)
    print("\n清洗效果抽样对比:")
    display_cols = ['spu_name', 'spu_name_clean']
    print(df[display_cols].sample(3).to_string(index=False))

except FileNotFoundError:
    print(f"❌ 还是找不到文件！")
    print(f"请检查该路径下是否存在文件: {os.path.abspath(file_path)}")