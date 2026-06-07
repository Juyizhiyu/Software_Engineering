
DROP TABLE IF EXISTS fact_inventory;
DROP TABLE IF EXISTS fact_order;
DROP TABLE IF EXISTS dim_customer;
DROP TABLE IF EXISTS dim_region;
DROP TABLE IF EXISTS dim_product;
DROP TABLE IF EXISTS dim_supplier;
DROP TABLE IF EXISTS dim_date;


CREATE TABLE `dim_date` (
`date_key` DATE NOT NULL COMMENT '日期(格式: YYYY-MM-DD)，主键', 
`year` INT NOT NULL COMMENT '年份 (如 2026)', 
`quarter` INT NOT NULL COMMENT '季度 (1-4)', 
`month` INT NOT NULL COMMENT '月份 (1-12)', 
`day_of_month` INT NOT NULL COMMENT '每月几号 (1-31)', 
`week_of_year` INT NOT NULL COMMENT '一年中的第几周 (1-53)', 
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
`age_group` VARCHAR(20) DEFAULT NULL COMMENT '年龄段 如 18-25', 
`customer_level` VARCHAR(20) NOT NULL COMMENT '会员等级 普通/黄金/钻石', 
`rfm_segment` VARCHAR(50) DEFAULT NULL COMMENT 'AI挖掘出的RFM价值标签', 
PRIMARY KEY (`customer_id`) 
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户维度表';


CREATE TABLE `fact_order` ( 
`order_id` VARCHAR(50) NOT NULL COMMENT '业务系统原始订单号', 
`row_num` INT NOT NULL COMMENT '订单内行号 (防止一单多货)', 
`date_key` DATE NOT NULL COMMENT '关联 dim_date', 
`product_id` VARCHAR(50) NOT NULL COMMENT '关联 dim_product', 
`customer_id` VARCHAR(50) NOT NULL COMMENT '关联 dim_customer', 
`region_id` VARCHAR(50) NOT NULL COMMENT '关联 dim_region', 
`quantity` INT NOT NULL COMMENT '销售数量', 
`sales_amount` DECIMAL(12,2) NOT NULL COMMENT '实际销售金额', 
`discount_amount` DECIMAL(12,2) DEFAULT 0.00 COMMENT '优惠折扣金额', 
`profit` DECIMAL(12,2) NOT NULL COMMENT '自动计算净毛利 (销售额 - 成本*数量)', 
PRIMARY KEY (`order_id`, `row_num`), 
CONSTRAINT `fk_order_date` FOREIGN KEY (`date_key`) REFERENCES `dim_date` (`date_key`), 
CONSTRAINT `fk_order_product` FOREIGN KEY (`product_id`) REFERENCES `dim_product` (`product_id`), 
CONSTRAINT `fk_order_customer` FOREIGN KEY (`customer_id`) REFERENCES `dim_customer` (`customer_id`), 
CONSTRAINT `fk_order_region` FOREIGN KEY (`region_id`) REFERENCES `dim_region` (`region_id`) 
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单明细事实表';


CREATE TABLE `fact_inventory` ( 
`snapshot_date` DATE NOT NULL COMMENT '快照日期 关联 dim_date', 
`product_id` VARCHAR(50) NOT NULL COMMENT '物料/商品ID 关联 dim_product', 
`region_id` VARCHAR(50) NOT NULL COMMENT '仓库ID 关联 dim_region', 
`on_hand_qty` INT NOT NULL COMMENT '在库可用实物库存量', 
`on_order_qty` INT NOT NULL COMMENT '在途库存量 (已向供应商采购但未入库)', 
`safety_stock_qty` INT NOT NULL COMMENT '安全库存水位线 (AI算法优化输出的动态安全库存)', 
PRIMARY KEY (`snapshot_date`, `product_id`, `region_id`), 
CONSTRAINT `fk_inv_date` FOREIGN KEY (`snapshot_date`) REFERENCES `dim_date` (`date_key`), 
CONSTRAINT `fk_inv_product` FOREIGN KEY (`product_id`) REFERENCES `dim_product` (`product_id`), 
CONSTRAINT `fk_inv_region` FOREIGN KEY (`region_id`) REFERENCES `dim_region` (`region_id`) 
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='库存快照事实表';