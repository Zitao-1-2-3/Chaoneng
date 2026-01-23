<script setup lang="ts">
import PanelGroup from './components/PanelGroup.vue'
import { ElRow, ElCol, ElCard, ElSkeleton } from 'element-plus'
import { Echart } from '@/components/Echart'
import { pieOptions, barOptions, lineOptions } from './echarts-data'
import { ref, reactive } from 'vue'
import { getDailyStatisticsApi } from '@/api/statistics'
import { set } from 'lodash-es'
import { EChartsOption } from 'echarts'
import { useI18n } from '@/hooks/web/useI18n'

// Move Interface definition to the top
interface ApiStatisticsData {
  day_energy_income?: string
  total_energy_income?: string
  day_flash_change_cost?: string
  total_flash_change_cost?: string
  day_flash_change_income?: string
  total_flash_change_income?: string
  day_profit?: string
  total_profit?: string
  day_user_num?: number
  total_user_num?: number
  day_bot_income?: string
  total_bot_income?: string
  day_bot_num?: number
  total_bot_num?: number
  day_active_income?: string
  total_active_income?: string
  day_active_cost?: string
  total_active_cost?: string
  day_bandwidth_cost?: string
  total_bandwidth_cost?: string
  day_total?: { day: string; energy_income: string }[]
  last_week_user_num?: { day: string; num: number }[]
}

const { t } = useI18n()

const parseNum = (val: string | number | undefined): number => {
  if (typeof val === 'number') return val
  return parseFloat(val || '0') || 0
}

const formatDateLabel = (dateStr: string): string => {
  if (!dateStr || dateStr.length !== 8) return dateStr
  const month = dateStr.substring(4, 6)
  const day = dateStr.substring(6, 8)
  return `${month}月${day}日`
}

const loading = ref(true)

// Now the interface is defined before use
const panelStatsData = reactive<Partial<ApiStatisticsData>>({})

// --- Chart Options ---
const pieOptionsData = reactive<EChartsOption>(pieOptions) as EChartsOption
const energyIncomeChartOptions = reactive<EChartsOption>(barOptions) as EChartsOption
const agentActivityChartOptions = reactive<EChartsOption>(lineOptions) as EChartsOption

const fetchDashboardData = async () => {
  try {
    const res = await getDailyStatisticsApi()
    const responseData = res?.data as any

    if (responseData) {
      Object.assign(panelStatsData, responseData)

      if (responseData.day_total) {
        const dailyData = responseData.day_total.filter((item) => item && item.day).reverse()
        const dates = dailyData.map((v) => v.day)
        const incomeValues = dailyData.map((v) => parseNum(v.energy_income))
        set(energyIncomeChartOptions, 'title.text', '能量收入')
        set(energyIncomeChartOptions, 'xAxis.data', dates)
        set(energyIncomeChartOptions, 'yAxis.name', 'TRX')
        set(energyIncomeChartOptions, 'series', [
          { name: '能量收入', data: incomeValues, type: 'bar' }
        ])
        set(energyIncomeChartOptions, 'tooltip.formatter', '{b0}<br />{a0}: {c0} TRX')
      }

      if (responseData.last_week_user_num) {
        const weeklyData = [...responseData.last_week_user_num].reverse()
        const dates = weeklyData.map((v) => formatDateLabel(v.day))
        const numValues = weeklyData.map((v) => v.num)
        set(agentActivityChartOptions, 'title.text', '近一周代理活跃数')
        set(agentActivityChartOptions, 'xAxis.data', dates)
        set(agentActivityChartOptions, 'yAxis', { type: 'value', name: '', minInterval: 1 })
        set(agentActivityChartOptions, 'legend.data', ['活跃数'])
        set(agentActivityChartOptions, 'series', [
          {
            name: '活跃数',
            type: 'line',
            smooth: true,
            data: numValues,
            label: { show: true, position: 'top' },
            itemStyle: { color: '#18BFFF' },
            lineStyle: { width: 3 },
            animationDuration: 2800,
            animationEasing: 'cubicInOut'
          }
        ])
        set(agentActivityChartOptions, 'tooltip.formatter', '{b0}<br />{a0}: {c0}')
      }
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

const getAllApi = async () => {
  loading.value = true
  try {
    await Promise.all([fetchDashboardData()])
  } finally {
    loading.value = false
  }
}

getAllApi()
</script>

<template>
  <PanelGroup :statistics="panelStatsData" :is-loading="loading" />
  <ElRow :gutter="20" justify="space-between">
    <ElCol :xl="24" :lg="24" :md="24" :sm="24" :xs="24">
      <ElCard shadow="hover" class="mb-20px">
        <ElSkeleton :loading="loading" animated>
          <Echart :options="energyIncomeChartOptions" :height="300" />
        </ElSkeleton>
      </ElCard>
    </ElCol>
    <ElCol :span="24">
      <ElCard shadow="hover" class="mb-20px">
        <ElSkeleton :loading="loading" animated :rows="4">
          <Echart :options="agentActivityChartOptions" :height="350" />
        </ElSkeleton>
      </ElCard>
    </ElCol>
  </ElRow>
</template>
