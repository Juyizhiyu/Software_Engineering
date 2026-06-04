import pandas as pd
import os

# 1. 定位路径
# 获取当前脚本的绝对路径 (d:\vscode\软件工程\期末作业\douyin\data\scripts\)
current_dir = os.path.dirname(os.path.abspath(__file__))

# 根据你报错的信息，文件应该在 scripts 的上一级的 raw 文件夹里
file_path = os.path.join(current_dir, '..', 'raw', 'douyin.csv') 

print(f"--- 正在初始化 ETL 任务 ---")
print(f"正在尝试读取: {os.path.abspath(file_path)}")

# 2. 读取并清洗
try:
    # 加载数据
    df = pd.read_csv(file_path, encoding='utf-8')
    print(f"成功读取数据，当前规模: {len(df)} 行")

    # --- 开始清洗 Transform ---
    # 1. 填充分类和品牌的缺失值
    df['c3_name'] = df['c3_name'].fillna('未分类')
    df['brand_name'] = df['brand_name'].fillna('未知品牌')

    # 2. 合并品牌列
    df['final_brand'] = df['brand_clean'].combine_first(df['brand_name'])

    # 3. 转换 ID 类型（统一转为字符串，避免 .0 精度问题）
    id_cols = ['user_id', 'shop_id', 'c1_id', 'c2_id', 'c3_id']
    for col in id_cols:
        if col in df.columns:
            df[col] = df[col].fillna(0).astype(int).astype(str)

    # 4. 计算件单价 (Feature Engineering)
    df['price_per_unit'] = df['gmv'] / df['unit_sold']

    print("--- 内存清洗完成 ---")
    print(df[['spu_name', 'final_brand', 'gmv', 'unit_sold']].head())

    # 3. 保存结果 (Output)
    output_dir = os.path.join(current_dir, '..', 'processed')
    if not os.path.exists(output_dir):
        os.makedirs(output_dir) 
    
    output_path = os.path.join(output_dir, 'douyin_cleaned_v1.csv')
    # 使用 utf-8-sig 确保 Excel 打开不乱码
    df.to_csv(output_path, index=False, encoding='utf-8-sig')
    print(f"--- ETL 任务成功 ---")
    print(f"清洗后的文件已保存至: {os.path.abspath(output_path)}")

except FileNotFoundError:
    print(f"❌ 错误：找不到文件。请确保 douyin.csv 放在了以下位置：\n{os.path.abspath(file_path)}")
except Exception as e:
    print(f"❌ 运行过程中出现其他错误: {e}")