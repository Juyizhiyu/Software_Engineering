import pandas as pd
import os

# 1. 定位路径
# 获取当前脚本的绝对路径 (d:\vscode\软件工程\期末作业\douyin\data\scripts\)
current_dir = os.path.dirname(os.path.abspath(__file__))

# 根据你报错的信息，文件应该在 scripts 的上一级的 raw 文件夹里
file_path = os.path.join(current_dir, '..', 'processed', 'douyin_cleaned_v1.csv') 

print(f"--- 正在初始化 ETL 任务 ---")
print(f"正在尝试读取: {os.path.abspath(file_path)}")

df = pd.read_csv(file_path, encoding='utf-8')
print(f"成功读取数据，当前规模: {len(df)} 行")
# 1. 检查有没有还没洗干净的空值
print(df[['final_brand', 'c3_name', 'gmv']].isnull().sum())

# 2. 看看有没有异常值（比如单价竟然是 0 的）
invalid_data = df[df['price_per_unit'] <= 0]
print(f"检测到异常数据条数: {len(invalid_data)}")

# 3. 统计一下最火的 5 个品牌，验证逻辑是否正确
print(df.groupby('final_brand')['gmv'].sum().nlargest(5))