import pandas as pd
import os

# 获取当前脚本所在的文件夹路径
current_dir = os.path.dirname(__file__)
# 把文件夹路径和文件名拼接起来
file_path = os.path.join(current_dir, 'douyin.csv')

# 1. 加载数据 (注意编码，如果是TikTok数据，通常是 utf-8)
df = pd.read_csv(file_path, encoding='utf-8')

# 2. 快速预览
print(df.info())      # 查看各列的数据类型和缺失值
print(df.describe())  # 查看数值列的分布（价格、销量是否合理）
print(df.head())      # 看前5行，确认具体的单位格式（比如是否有 K+）