<script setup lang="ts">
import PanelGroup from './components/PanelGroup.vue'
import { ElRow, ElCol, ElCard, ElSkeleton } from 'element-plus'
import { Echart } from '@/components/Echart'
import { pieOptions, barOptions, lineOptions } from './echarts-data'
import { ref, reactive, onMounted } from 'vue'
import { getDailyStatisticsApi, v2GetStats } from '@/api/statistics' // 保留旧接口以便兼容
import type { V2StatsData } from '@/api/statistics/types'
import { set } from 'lodash-es'
import { EChartsOption } from 'echarts'
import { useI18n } from '@/hooks/web/useI18n'
import { handleErrorMessage } from '@/utils/messageHelper'

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
      // 字段映射转换
      const mappedData: Partial<ApiStatisticsData> = {
        day_energy_income: responseData.today_energy_in,
        total_energy_income: responseData.total_energy_in,
        day_flash_change_cost: responseData.today_exchange_out,
        total_flash_change_cost: responseData.total_exchange_out,
        day_flash_change_income: responseData.today_exchange_in,
        total_flash_change_income: responseData.total_exchange_in,
        day_profit: responseData.today_profit,
        total_profit: responseData.total_profit,
        day_user_num: responseData.today_agent_add,
        total_user_num: responseData.total_agent_add,
        day_bot_income: responseData.today_bot_in,
        total_bot_income: responseData.total_bot_in,
        day_bot_num: responseData.today_bot_add,
        total_bot_num: responseData.total_bot_add,
        day_active_income: responseData.today_active_in,
        total_active_income: responseData.total_active_in,
        day_bandwidth_cost: responseData.today_bandwidth_out,
        total_bandwidth_cost: responseData.total_bandwidth_out,
        // 映射每日能量收入数据
        day_total:
          responseData.daily_energy_in?.map((item) => ({
            day: item.date,
            energy_income: item.energy_in
          })) || [],
        // 映射每日活跃代理数据
        last_week_user_num:
          responseData.daily_active_agent?.map((item) => ({
            day: item.date,
            num: item.active_agent
          })) || []
      }

      console.log('[fetchDashboardData] 映射后的数据:', mappedData)
      Object.assign(panelStatsData, mappedData)

      if (mappedData.day_total && mappedData.day_total.length > 0) {
        const dailyData = mappedData.day_total.filter((item) => item && item.day).reverse()
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

      if (mappedData.last_week_user_num && mappedData.last_week_user_num.length > 0) {
        const weeklyData = [...mappedData.last_week_user_num].reverse()
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
