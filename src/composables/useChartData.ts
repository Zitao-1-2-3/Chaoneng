/**
 * 图表数据处理 Composable
 * 用于数据统计页面的图表数据转换
 */

import { computed, type Ref } from 'vue'
import type { EChartsOption } from 'echarts'
import { parseNum } from '@/utils/numberFormat'

/**
 * 图表数据项接口
 */
interface ChartDataItem {
  date: string // 日期
  value: number // 数值
}

/**
 * 使用图表数据处理
 * @param dailyData 每日数据数组
 * @param title 图表标题
 * @param unit 数值单位
 * @returns 图表配置对象
 */
export function useChartData(dailyData: Ref<ChartDataItem[]>, title: string, unit: string = '') {
  /**
   * 图表配置
   */
  const chartOption = computed<EChartsOption>(() => {
    const dates = dailyData.value.map((item) => item.date)
    const values = dailyData.value.map((item) => item.value)

    return {
      title: {
        text: title,
        left: 'center',
        textStyle: {
          fontSize: 14,
          fontWeight: 'normal'
        }
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const param = params[0]
          return `${param.name}<br/>${param.seriesName}: ${param.value}${unit}`
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dates,
        axisLabel: {
          rotate: 45,
          fontSize: 10
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: `{value}${unit}`
        }
      },
      series: [
        {
          name: title,
          type: 'line',
          smooth: true,
          data: values,
          areaStyle: {
            opacity: 0.3
          },
          lineStyle: {
            width: 2
          },
          itemStyle: {
            borderWidth: 2
          }
        }
      ]
    }
  })

  return {
    chartOption
  }
}

/**
 * 转换能量收入图表数据
 * @param rawData 原始数据数组 (后端返回的 daily_energy_in 数组)
 * @returns 图表数据数组
 */
export function transformEnergyIncomeData(
  rawData: Array<{ date: string; value: string | number }> | undefined
): ChartDataItem[] {
  if (!rawData || !Array.isArray(rawData)) return []

  return rawData.map((item) => ({
    date: item.date || '',
    value: parseNum(item.value)
  }))
}

/**
 * 转换代理活跃数图表数据
 * @param rawData 原始数据数组 (后端返回的 daily_active_agent 数组)
 * @returns 图表数据数组
 */
export function transformActiveAgentData(
  rawData: Array<{ date: string; value: string | number }> | undefined
): ChartDataItem[] {
  if (!rawData || !Array.isArray(rawData)) return []

  return rawData.map((item) => ({
    date: item.date || '',
    value: parseNum(item.value)
  }))
}

/**
 * 创建默认的空图表数据
 * @param days 天数
 * @returns 空图表数据数组
 */
export function createEmptyChartData(days: number = 7): ChartDataItem[] {
  const data: ChartDataItem[] = []
  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    data.push({
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      value: 0
    })
  }

  return data
}
