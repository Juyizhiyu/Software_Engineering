import type { EntityType, SchemaField } from '@/types'

/** 实体类型配置 */
export const entityConfig: Record<EntityType, { label: string; icon: string }> = {
  orders: { label: '订单', icon: 'Document' },
  inventory: { label: '库存', icon: 'Box' },
  suppliers: { label: '供应商', icon: 'User' },
  logistics: { label: '物流', icon: 'Van' },
  costs: { label: '成本', icon: 'Money' },
  risks: { label: '风险', icon: 'Warning' },
}

/** 实体类型列表 */
export const entityTypes = Object.keys(entityConfig) as EntityType[]

/** 前端表单字段定义（当后端 Schema 不可用时的降级方案） */
export const fallbackFormFields: Record<EntityType, SchemaField[]> = {
  orders: [
    { key: 'date', label: '日期', type: 'date', required: true },
    { key: 'customer_region', label: '客户区域', type: 'select', required: true, options: ['华南', '华东', '华北', '西南', '华中'] },
    { key: 'product_id', label: '产品ID', type: 'text', required: true, placeholder: '如 P001' },
    { key: 'product_name', label: '产品名称', type: 'text', required: true },
    { key: 'quantity', label: '数量', type: 'number', required: true },
    { key: 'unit_price', label: '单价', type: 'number', required: true },
    { key: 'status', label: '状态', type: 'select', required: false, options: ['pending', 'shipped', 'delivered', 'cancelled'] },
  ],
  inventory: [
    { key: 'product_id', label: '产品ID', type: 'text', required: true, placeholder: '如 P001' },
    { key: 'product_name', label: '产品名称', type: 'text', required: true },
    { key: 'warehouse_id', label: '仓库ID', type: 'text', required: true, placeholder: '如 W001' },
    { key: 'warehouse_name', label: '仓库名称', type: 'text', required: true },
    { key: 'current_stock', label: '当前库存', type: 'number', required: true },
    { key: 'safety_stock', label: '安全库存', type: 'number', required: true },
    { key: 'max_stock', label: '最大库存', type: 'number', required: true },
    { key: 'unit_cost', label: '单位成本', type: 'number', required: true },
  ],
  suppliers: [
    { key: 'supplier_name', label: '供应商名称', type: 'text', required: true },
    { key: 'region', label: '区域', type: 'select', required: true, options: ['华南', '华东', '华北', '西南', '华中'] },
    { key: 'on_time_rate', label: '准时率(%)', type: 'number', required: true },
    { key: 'quality_rate', label: '质量率(%)', type: 'number', required: true },
    { key: 'price_stability', label: '价格稳定性(%)', type: 'number', required: true },
    { key: 'response_score', label: '响应评分(%)', type: 'number', required: true },
    { key: 'cooperation_years', label: '合作年限', type: 'number', required: true },
  ],
  logistics: [
    { key: 'order_id', label: '订单ID', type: 'text', required: true, placeholder: '如 O001' },
    { key: 'origin', label: '出发地', type: 'text', required: true },
    { key: 'destination', label: '目的地', type: 'text', required: true },
    { key: 'carrier', label: '承运商', type: 'text', required: true },
    { key: 'expected_duration_hours', label: '预计时长(小时)', type: 'number', required: true },
    { key: 'actual_duration_hours', label: '实际时长(小时)', type: 'number', required: true },
    { key: 'status', label: '状态', type: 'select', required: true, options: ['pending', 'in_transit', 'delivered', 'delayed'] },
    { key: 'transport_cost', label: '运输成本', type: 'number', required: true },
  ],
  costs: [
    { key: 'date', label: '日期', type: 'date', required: true },
    { key: 'product_id', label: '产品ID', type: 'text', required: true, placeholder: '如 P001' },
    { key: 'product_name', label: '产品名称', type: 'text', required: true },
    { key: 'purchase_cost', label: '采购成本', type: 'number', required: true },
    { key: 'storage_cost', label: '仓储成本', type: 'number', required: true },
    { key: 'transport_cost', label: '运输成本', type: 'number', required: true },
    { key: 'return_cost', label: '退货成本', type: 'number', required: false },
  ],
  risks: [
    { key: 'risk_type', label: '风险类型', type: 'select', required: true, options: ['supply_shortage', 'quality_issue', 'delivery_delay', 'price_volatility', 'logistics_disruption'] },
    { key: 'risk_level', label: '风险等级', type: 'select', required: true, options: ['Critical', 'High', 'Medium', 'Low'] },
    { key: 'related_object', label: '关联对象', type: 'text', required: true },
    { key: 'description', label: '描述', type: 'text', required: true },
    { key: 'suggestion', label: '建议', type: 'text', required: true },
    { key: 'status', label: '状态', type: 'select', required: true, options: ['open', 'resolved', 'monitoring'] },
  ],
}
