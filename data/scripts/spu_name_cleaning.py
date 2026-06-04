import pandas as pd
import re
import os

def beauty_clean_name(name):
    if pd.isna(name):
        return "未知商品"
    
    # a. 去掉【】、[]、（）及其内部的内容（常见的带货话术）
    name = re.sub(r'【.*?】|\[.*?\]|（.*?）|\(.*?\)', '', name)
    
    # b. 去掉开头常见的营销前缀（如：xx推荐-，xx同款-）
    # 这里的正则表达式匹配“任何字符 + 推荐/同款 + 数字(可选) + 减号或空格”
    name = re.sub(r'^.*?推荐\d*[- ]*', '', name)
    name = re.sub(r'^.*?同款\d*[- ]*', '', name)
    
    # c. 去掉乱七八糟的特殊符号和表情（只保留中文、英文和数字）
    name = re.sub(r'[^\u4e00-\u9fa5a-zA-Z0-9\s]', ' ', name)
    
    # d. 去掉多余的空格
    name = ' '.join(name.split())
    
    return name

# --- 执行清洗 ---
current_dir = os.path.dirname(os.path.abspath(__file__))
input_path = os.path.join(current_dir, '..', 'processed', 'douyin_cleaned_v1.csv')
output_path = os.path.join(current_dir, '..', 'processed', 'douyin_final_v2.csv')

df = pd.read_csv(input_path)

print("正在为 20 万个商品名做“美颜”...")
df['spu_name_clean'] = df['spu_name'].apply(beauty_clean_name)

# 看看对比效果
print("\n--- 清洗效果对比 ---")
for i in range(5):
    print(f"原名: {df['spu_name'].iloc[i]}")
    print(f"新名: {df['spu_name_clean'].iloc[i]}")
    print("-" * 30)

# 保存最终版
df.to_csv(output_path, index=False, encoding='utf-8-sig')
print(f"\n最终版数据已生成: {os.path.abspath(output_path)}")

# 1. 获取当前所有的列名
cols = df.columns.tolist()

# 2. 从列表中移除 'spu_name_clean'（假设它目前在最后一列）
cols.remove('spu_name_clean')

# 3. 将其插入到索引为 1 的位置（即第二列）
cols.insert(1, 'spu_name_clean')

# 4. 按新顺序重新排列 DataFrame
df = df[cols]

# 5. 保存最终结果
output_path = os.path.join(current_dir, '..', 'processed', 'douyin_final_v2_reordered.csv')
df.to_csv(output_path, index=False, encoding='utf-8-sig')

print("列顺序调整完成！spu_name_clean 现在位于第二列。")
print(df.head(1)) # 打印第一行确认一下