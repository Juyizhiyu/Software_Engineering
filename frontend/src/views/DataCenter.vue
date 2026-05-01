<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import request from '../api/request'
import { entityForms, entityOptions } from '../config/dataForms'

const activeEntity = ref('orders')
const records = reactive({})
const schemas = ref({})
const saving = ref(false)
const notice = ref('')

const form = reactive({})

function resetForm() {
  Object.keys(form).forEach((key) => delete form[key])
  for (const field of entityForms[activeEntity.value]) {
    form[field.key] = ''
  }
}

function formatRecordPreview(item) {
  return Object.entries(item)
    .slice(0, 5)
    .map(([key, value]) => `${key}: ${value}`)
    .join(' · ')
}

const currentFields = computed(() => entityForms[activeEntity.value] || [])
const currentRecords = computed(() => records[activeEntity.value] || [])

async function loadRecords(entity) {
  const res = await request.get(`/data/${entity}`)
  if (res.success) records[entity] = res.data
}

async function loadInitial() {
  const schemaRes = await request.get('/data/schemas')
  if (schemaRes.success) schemas.value = schemaRes.data

  await Promise.all(entityOptions.map((item) => loadRecords(item.key)))
  resetForm()
}

async function submitRecord() {
  saving.value = true
  notice.value = ''
  try {
    const payload = {}
    for (const field of currentFields.value) {
      payload[field.key] = form[field.key]
    }

    const res = await request.post(`/data/${activeEntity.value}`, payload)
    if (res.success) {
      notice.value = `${schemas.value?.[activeEntity.value]?.label || activeEntity.value} 已写入`
      await loadRecords(activeEntity.value)
      resetForm()
    }
  } catch (error) {
    notice.value = error?.response?.data?.message || '写入失败'
  } finally {
    saving.value = false
  }
}

function switchEntity(entity) {
  activeEntity.value = entity
  resetForm()
  notice.value = ''
}

onMounted(loadInitial)
</script>

<template>
  <section class="page-layout">
    <article class="hero-panel">
      <div class="page-header">
        <div>
          <p class="kicker">Data Center</p>
          <h3>供应链数据中心</h3>
        </div>
      </div>
      <p class="section-copy">
        在这里录入订单、库存、供应商、物流、成本和风险数据。所有数据会写回后端 JSON 数据源，后续可直接进入统计和 AI 分析。
      </p>
    </article>

    <div class="tabs-row">
      <button
        v-for="item in entityOptions"
        :key="item.key"
        class="tab-button"
        :class="{ active: activeEntity === item.key }"
        @click="switchEntity(item.key)"
      >
        {{ item.label }}
      </button>
    </div>

    <div class="split-layout">
      <article class="form-panel">
        <h4>录入 {{ schemas?.[activeEntity]?.label || activeEntity }}</h4>
        <p class="helper-text">必填项按当前实体定义校验，提交后会立即持久化到后端数据文件。</p>
        <div class="form-grid">
          <div
            v-for="field in currentFields"
            :key="field.key"
            class="field-block"
            :class="{ full: field.as === 'textarea' }"
          >
            <label>{{ field.label }}</label>
            <textarea
              v-if="field.as === 'textarea'"
              v-model="form[field.key]"
              :placeholder="field.placeholder || ''"
            />
            <input
              v-else
              v-model="form[field.key]"
              :type="field.type || 'text'"
              :placeholder="field.placeholder || ''"
            />
          </div>
        </div>

        <div class="inline-actions" style="margin-top: 16px;">
          <button class="primary-button" :disabled="saving" @click="submitRecord">
            {{ saving ? '提交中...' : '写入数据' }}
          </button>
          <button class="ghost-button" :disabled="saving" @click="resetForm">
            重置表单
          </button>
        </div>

        <div v-if="notice" class="alert-banner" style="margin-top: 16px;">
          {{ notice }}
        </div>
      </article>

      <article class="table-panel">
        <h4>最近记录</h4>
        <p class="helper-text">当前展示最近 8 条 {{ schemas?.[activeEntity]?.label || activeEntity }} 数据。</p>
        <div v-if="currentRecords.length" class="mini-list">
          <div
            v-for="(item, index) in currentRecords.slice(-8).reverse()"
            :key="index"
            class="mini-list-item"
          >
            <strong>{{ formatRecordPreview(item) }}</strong>
            <span>{{ item.date || item.created_at || item.last_update || item.supplier_name || item.product_name || item.order_id || '记录已保存' }}</span>
          </div>
        </div>
        <div v-else class="empty-state">当前实体暂无数据。</div>
      </article>
    </div>
  </section>
</template>
