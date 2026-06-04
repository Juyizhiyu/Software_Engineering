import { createApp } from 'vue'
import { createPinia } from 'pinia'
import VueECharts from 'vue-echarts'
import { use } from 'echarts/core'
import { BarChart, PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

import App from './App.vue'
import router from './router'

// ECharts 按需注册
use([BarChart, PieChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer])

// Element Plus 深色模式 CSS
import 'element-plus/theme-chalk/dark/css-vars.css'

// 全局样式（顺序重要：variables/mixins 通过 vite additionalData 注入）
import '@/styles/dark.scss'
import '@/styles/global.scss'
import '@/styles/element-overrides.scss'

const app = createApp(App)

// 全局注册 ECharts 组件
app.component('v-chart', VueECharts)

app.use(createPinia())
app.use(router)

app.mount('#app')
