<script setup lang="ts">
import { ref } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import AiChatPanel from '@/components/ai-studio/AiChatPanel.vue'
import AiForecastPanel from '@/components/ai-studio/AiForecastPanel.vue'
import AiAnomalyPanel from '@/components/ai-studio/AiAnomalyPanel.vue'
import AiRiskScorePanel from '@/components/ai-studio/AiRiskScorePanel.vue'

const activeTab = ref('chat')
</script>

<template>
  <div class="page-container">
    <PageHeader title="AI 工作台" description="智能问答、需求预测、异常检测、风险评分" />

    <el-tabs v-model="activeTab" class="ai-studio__tabs">
      <el-tab-pane label="智能问答" name="chat">
        <AiChatPanel />
      </el-tab-pane>
      <el-tab-pane label="需求预测" name="forecast">
        <AiForecastPanel />
      </el-tab-pane>
      <el-tab-pane label="异常检测" name="anomaly">
        <AiAnomalyPanel />
      </el-tab-pane>
      <el-tab-pane label="风险评分" name="risk-score">
        <AiRiskScorePanel />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped lang="scss">
.ai-studio__tabs {
  :deep(.el-tabs__header) {
    margin-bottom: $spacing-lg;
  }
}
</style>
