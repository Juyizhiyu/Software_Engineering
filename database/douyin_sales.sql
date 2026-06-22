-- ============================================================
-- 抖音电商销售明细表（仪表盘查询用扁平表）
-- 来源: data/processed/douyin_final_v2_reordered.csv
-- ============================================================

DROP TABLE IF EXISTS `douyin_sales`;

CREATE TABLE `douyin_sales` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  `spu_id` VARCHAR(50) NOT NULL COMMENT '商品SPU ID',
  `spu_name` VARCHAR(500) DEFAULT NULL COMMENT '商品原始名称',
  `spu_name_clean` VARCHAR(500) DEFAULT NULL COMMENT '商品清洗后名称',
  `user_id` VARCHAR(50) DEFAULT NULL COMMENT '用户ID',
  `brand_name` VARCHAR(200) DEFAULT NULL COMMENT '品牌原始名称',
  `brand_clean` VARCHAR(200) DEFAULT NULL COMMENT '品牌清洗后名称',
  `shop_id` VARCHAR(50) DEFAULT NULL COMMENT '店铺ID',
  `shop_name` VARCHAR(200) DEFAULT NULL COMMENT '店铺名称',
  `c1_id` VARCHAR(50) DEFAULT NULL COMMENT '一级品类ID',
  `c1_name` VARCHAR(100) DEFAULT NULL COMMENT '一级品类名称',
  `c2_id` VARCHAR(50) DEFAULT NULL COMMENT '二级品类ID',
  `c2_name` VARCHAR(100) DEFAULT NULL COMMENT '二级品类名称',
  `c3_id` VARCHAR(50) DEFAULT NULL COMMENT '三级品类ID',
  `c3_name` VARCHAR(100) DEFAULT NULL COMMENT '三级品类名称',
  `gmv` DECIMAL(12,2) DEFAULT 0.00 COMMENT '成交金额(GMV)',
  `unit_sold` INT DEFAULT 0 COMMENT '销量',
  `price_per_unit` DECIMAL(10,2) DEFAULT 0.00 COMMENT '单价（导入时自动计算 = gmv / unit_sold）',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '导入时间',
  PRIMARY KEY (`id`),
  INDEX `idx_spu_id` (`spu_id`),
  INDEX `idx_brand_clean` (`brand_clean`),
  INDEX `idx_c1_name` (`c1_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='抖音电商销售明细（扁平表，用于仪表盘实时查询）';
