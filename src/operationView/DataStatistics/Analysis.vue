<script setup lang="ts">
import PanelGroup from './components/PanelGroup.vue'
import { ElRow, ElCol, ElCard, ElSkeleton } from 'element-plus'
import { Echart } from '@/components/Echart'
import { pieOptions, barOptions, lineOptions } from './echarts-data'
import { ref, reactive, onMounted } from 'vue'
import { v2GetStats } from '@/api/statistics'
import type { V2StatsData } from '@/api/statistics/types'
import { set } from 'lodash-es'
import { EChartsOption } from 'echarts'
import { useI18n } from '@/hooks/web/useI18n'
import { handleErrorMessage } from '@/utils/messageHelper'

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

// 使用后端返回的数据结构
const panelStatsData = reactive<Partial<V2StatsData>>({})

// --- Chart Options ---
const pieOptionsData = reactive<EChartsOption>(pieOptions) as EChartsOption
const energyIncomeChartOptions = reactive<EChartsOption>(barOptions) as EChartsOption
const agentActivityChartOptions = reactive<EChartsOption>(lineOptions) as EChartsOption

const fetchDashboardData = async () => {
  try {
    console.log('[fetchDashboardData] 调用新接口获取统计数据')

    // 调用新接口
    const res = await v2GetStats()
    console.log('[fetchDashboardData] API完整返回:', res)
    console.log('[fetchDashboardData] res.data:', res?.data)
    console.log('[fetchDashboardData] res.data.data:', res?.data?.data)

    // 尝试获取数据，可能在res.data.data或res.data中
    let responseData: V2StatsData | null = null

    if (res?.data?.data) {
      responseData = res.data.data
      console.log('[fetchDashboardData] 从res.data.data获取数据')
    } else if (res?.data && typeof res.data === 'object' && 'today_energy_in' in res.data) {
      responseData = res.data as any
      console.log('[fetchDashboardData] 从res.data获取数据')
    }

    console.log('[fetchDashboardData] 最终解析的数据:', responseData)

    if (responseData) {
      // 直接使用后端返回的数据,不进行字段映射
      Object.assign(panelStatsData, responseData)

      // 处理能量收入图表数据
      if (responseData.daily_energy_in && responseData.daily_energy_in.length > 0) {
        const dailyData = responseData.daily_energy_in.filter((item) => item && item.date).reverse()
        const dates = dailyData.map((v) => v.date)
        const incomeValues = dailyData.map((v) => parseNum(v.energy_in))
        set(energyIncomeChartOptions, 'title.text', '能量收入')
        set(energyIncomeChartOptions, 'xAxis.data', dates)
        set(energyIncomeChartOptions, 'yAxis.name', 'TRX')
        set(energyIncomeChartOptions, 'series', [
          { name: '能量收入', data: incomeValues, type: 'bar' }
        ])
        set(energyIncomeChartOptions, 'tooltip.formatter', '{b0}<br />{a0}: {c0} TRX')
      }

      // 处理代理活跃数图表数据
      if (responseData.daily_active_agent && responseData.daily_active_agent.length > 0) {
        const weeklyData = [...responseData.daily_active_agent].reverse()
        const dates = weeklyData.map((v) => formatDateLabel(v.date))
        const numValues = weeklyData.map((v) => v.active_agent)
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
    handleErrorMessage(error, '获取统计数据失败')
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

// 使用onMounted确保组件挂载后再获取数据
onMounted(() => {
  console.log('[onMounted] 组件已挂载，开始获取数据')
  getAllApi()
})
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
