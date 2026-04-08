<template>
  <div class="chart-wrapper">
    <div class="chart-header">
      <h3>TRX 交易量趋势图</h3>
      <div class="chart-filters">
        <div class="quick-filters">
          <el-radio-group v-model="timeRange" size="small" @change="handleTimeRangeChange">
            <el-radio-button label="1month">近一个月</el-radio-button>
            <el-radio-button label="3months">近三个月</el-radio-button>
            <el-radio-button label="1year">近一年</el-radio-button>
            <el-radio-button label="all">全部</el-radio-button>
          </el-radio-group>
        </div>
        <div class="date-picker">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期(UTC)"
            end-placeholder="结束日期(UTC)"
            size="small"
            :clearable="false"
            value-format="YYYY-MM-DD"
            format="YYYY-MM-DD"
            :disabledDate="disableFutureDates"
            @change="handleDateRangeChange"
          />
        </div>
      </div>
    </div>
    <ElCard shadow="hover">
      <div class="current-price-panel" v-if="currentPrice">
        <div class="price-display">
          <div class="price-main">
            <span class="price-label">当前价格</span>
            <span class="price-value" :class="{ 'price-flash': priceFlashing }">
              ${{ currentPrice.toFixed(6) }}
            </span>
            <div class="price-update-time">更新时间: {{ formatUpdateTime(lastUpdateTime) }}</div>
          </div>
          <div class="price-compare">
            <span :class="['price-change', priceChangeClass]">
              <i
                :class="
                  priceChangeClass === 'price-up'
                    ? 'el-icon-caret-top'
                    : priceChangeClass === 'price-down'
                      ? 'el-icon-caret-bottom'
                      : 'el-icon-minus'
                "
              ></i>
              {{ priceChangePercent > 0 ? '+' : '' }}{{ priceChangePercent.toFixed(2) }}%
            </span>
            <div class="price-vs-yesterday" v-if="yesterdayClosePrice !== null"
              >较昨日收盘: ${{ yesterdayClosePrice.toFixed(6) }}</div
            >
          </div>
        </div>
      </div>
      <ElSkeleton :loading="isLoading" animated :rows="4">
        <div v-if="!chartData || (chartData.length === 0 && !isLoading)" class="no-data">
          <el-empty description="暂无数据" />
        </div>
        <Echart
          v-else
          :options="chartOptions"
          :height="350"
          ref="chartRef"
          @init="handleChartInit"
        />
      </ElSkeleton>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Echart } from '@/components/Echart'
import { ElCard, ElSkeleton, ElRadioGroup, ElRadioButton, ElDatePicker } from 'element-plus'
import type { EChartsOption } from 'echarts'
import * as echarts from 'echarts/core'
import { DataZoomComponent } from 'echarts/components'
import axios from 'axios'
import { formatToDate } from '@/utils/dateUtil'

// 注册DataZoom组件
echarts.use([DataZoomComponent])

// 定义图表实例类型
type EChartsInstance = echarts.ECharts

interface TrxVolumeData {
  volume: number
  timestamp: number
  time?: number
  date: string
  open: number | string
  high: number | string
  low: number | string
  close: number | string
  [key: string]: any
}

const props = defineProps({
  loading: {
    type: Boolean,
    default: false
  }
})

// 组件自身的加载状态
const localLoading = ref(false)

// 计算当前加载状态（组合外部和内部的加载状态）
const isLoading = computed(() => {
  return props.loading || localLoading.value
})

// 时间范围选择
const timeRange = ref('1month') // 默认显示近一个月数据

// 日期范围选择器的值
const dateRange = ref<[Date, Date]>([
  new Date(new Date().setMonth(new Date().getMonth() - 1)), // 默认一个月前
  new Date() // 当前日期
])

// 存储原始数据和筛选后的数据
const chartData = ref<TrxVolumeData[]>([])

// 添加当前价格相关的状态
const currentPrice = ref<number | null>(null)
const yesterdayClosePrice = ref<number | null>(null)
const priceChangePercent = ref<number>(0)
const lastUpdateTime = ref<number>(0)
const isRefreshingPrice = ref<boolean>(false)
const priceFlashing = ref<boolean>(false)
let pricePollingInterval: number | null = null
let previousPrice: number | null = null

// 计算价格变化的样式类
const priceChangeClass = computed(() => {
  if (priceChangePercent.value > 0) return 'price-up'
  if (priceChangePercent.value < 0) return 'price-down'
  return 'price-unchanged'
})

// 格式化更新时间
const formatUpdateTime = (timestamp: number) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const seconds = date.getSeconds().toString().padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

// 时间处理工具函数
const timeUtils = {
  // 获取昨天的日期对象
  getYesterday() {
    const now = new Date()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    return yesterday
  },

  // 获取UTC时间戳 - 调整为API预期的时间格式
  getUTCTimestamp(date: Date, isEndOfDay = false) {
    // 注意: 根据API返回样例分析，API使用的时间戳格式为当天结束时间点
    // 例如: 1742515199999 = 2025-03-20 23:59:59.999 (对应3-20这一天)
    // 例如: 1742601599999 = 2025-03-21 23:59:59.999 (对应3-21这一天)

    if (isEndOfDay) {
      // 结束时间设为第二天的00:00:00.001，确保包含当天最后一秒的数据
      const nextDay = new Date(date)
      nextDay.setDate(nextDay.getDate() + 1)
      return Date.UTC(
        nextDay.getUTCFullYear(),
        nextDay.getUTCMonth(),
        nextDay.getUTCDate(),
        0,
        0,
        0,
        1
      )
    } else {
      // 起始时间保持为当天的23:59:59.999
      return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999)
    }
  },

  // 创建日期范围（起始时间戳和结束时间戳）
  createDateRange(startDate: Date, endDate: Date) {
    // 注意：startDate不需要往前推一天了，因为API返回的是当天日期对应当天23:59:59的数据
    return {
      startTimestamp: this.getUTCTimestamp(startDate, false),
      endTimestamp: this.getUTCTimestamp(endDate, true)
    }
  },

  // 根据特定时间范围创建时间戳范围
  getRangeByType(rangeType: string) {
    const yesterday = this.getYesterday()

    let startDate: Date

    if (rangeType === '1month') {
      startDate = new Date(yesterday)
      startDate.setMonth(startDate.getMonth() - 1)
    } else if (rangeType === '3months') {
      startDate = new Date(yesterday)
      startDate.setMonth(startDate.getMonth() - 3)
    } else if (rangeType === '1year') {
      startDate = new Date(yesterday)
      startDate.setFullYear(startDate.getFullYear() - 1)
    } else if (rangeType === 'all') {
      // TRX 发行时间附近
      startDate = new Date(1507564800000)
    } else {
      // 默认一个月
      startDate = new Date(yesterday)
      startDate.setMonth(startDate.getMonth() - 1)
    }

    return this.createDateRange(startDate, yesterday)
  },

  // 检查日期是否不可选（今天或之后的日期）
  isDateDisabled(date: Date) {
    const yesterday = this.getYesterday()
    const yesterdayEnd = new Date(yesterday)
    yesterdayEnd.setHours(23, 59, 59, 999)

    // 禁用今天及以后的日期
    return date >= yesterdayEnd
  },

  // 获取日期的简单格式 YYYY-MM-DD
  getSimpleDate(timestamp: number) {
    const date = new Date(timestamp)
    return date.toISOString().split('T')[0]
  }
}

// 处理时间范围选择
const handleTimeRangeChange = (value: string) => {
  if (value === 'custom' && dateRange.value && dateRange.value.length === 2) {
    // 自定义时间范围，使用dateRange的值
    const { startTimestamp, endTimestamp } = timeUtils.createDateRange(
      new Date(dateRange.value[0]),
      new Date(dateRange.value[1])
    )

    fetchData(startTimestamp, endTimestamp)
    return
  }

  // 使用预设的时间范围
  const { startTimestamp, endTimestamp } = timeUtils.getRangeByType(value)

  // 更新日期选择器的值
  dateRange.value = [new Date(startTimestamp), timeUtils.getYesterday()]

  // 获取指定时间范围的数据
  fetchData(startTimestamp, endTimestamp)
}

// 处理日期范围变化
const handleDateRangeChange = (value: [Date, Date]) => {
  if (!value || value.length !== 2) return

  // 设置为自定义模式
  timeRange.value = 'custom'

  // 创建日期范围
  const { startTimestamp, endTimestamp } = timeUtils.createDateRange(
    new Date(value[0]),
    new Date(value[1])
  )

  // 根据选择的日期范围获取数据
  fetchData(startTimestamp, endTimestamp)
}

// 数据处理函数 - 确保数据格式一致
const processApiData = (data: any[]) => {
  // 直接返回API数据，无需额外处理
  return data
}

// 获取数据
const fetchData = async (startTimestamp: number, endTimestamp: number) => {
  localLoading.value = true
  // 在请求开始前设置chartData为空数组，避免旧数据显示导致问题
  chartData.value = []

  try {
    // 确保时间范围足够大，以获取足够的数据点，使图表更美观
    const dayDiff = Math.floor((endTimestamp - startTimestamp) / (24 * 60 * 60 * 1000)) + 1
    const MIN_DAYS = 3 // 确保至少有3天的数据
    const DAY_IN_MS = 86400000 // 一天的毫秒数

    let adjustedStartTimestamp = startTimestamp

    if (dayDiff < MIN_DAYS) {
      // 往前扩展天数
      const daysToAdd = MIN_DAYS - dayDiff
      // 往前推daysToAdd天，确保有足够的数据点
      adjustedStartTimestamp = startTimestamp - daysToAdd * DAY_IN_MS
    }

    // 发起API请求，使用调整后的时间范围
    const { data } = await axios.get('https://apilist.tronscanapi.com/api/trx/volume', {
      params: {
        start_timestamp: adjustedStartTimestamp,
        end_timestamp: endTimestamp,
        limit: 2700, // 足够了，不需要太多
        source: 'coinmarketcap'
      }
    })

    // 确保data和data.data存在并且是数组
    if (data && data.data && Array.isArray(data.data)) {
      // 如果数据不为空，处理数据
      if (data.data.length > 0) {
        // 筛选出与原始请求范围（未调整前）相匹配的数据
        const filteredData = data.data.filter((item: any) => {
          const itemTimestamp = item.time
          // 时间戳在原始请求范围内
          return itemTimestamp >= startTimestamp && itemTimestamp < endTimestamp
        })

        if (filteredData.length > 0) {
          // 将筛选后的数据按照时间升序排序
          filteredData.sort((a: any, b: any) => (a.time || 0) - (b.time || 0))

          // 使用筛选后的数据
          chartData.value = filteredData
        } else {
          // 如果筛选后没有数据，则使用所有数据（扩展的日期范围）
          data.data.sort((a: any, b: any) => (a.time || 0) - (b.time || 0))
          chartData.value = data.data
        }

        // 获取最新的数据作为昨日收盘价
        updateYesterdayClosePrice()
      } else {
        chartData.value = []
      }
    } else {
      chartData.value = []
    }
  } catch (error) {
    console.error('获取数据失败:', error)
    chartData.value = []
  } finally {
    localLoading.value = false
  }
}

// 闪烁动画
const flashPrice = () => {
  if (!previousPrice || !currentPrice.value) return

  // 价格有变化才闪烁
  if (previousPrice !== currentPrice.value) {
    priceFlashing.value = true

    // 1.5秒后停止闪烁
    setTimeout(() => {
      priceFlashing.value = false
    }, 1500)
  }
}

// 获取当前TRX价格
const fetchCurrentPrice = async () => {
  isRefreshingPrice.value = true

  try {
    // 保存之前的价格，用于比较变化
    previousPrice = currentPrice.value

    const response = await axios.get('https://apilist.tronscanapi.com/api/token/price', {
      params: {
        token: 'trx'
      }
    })

    if (response.data && response.data.price_in_usd) {
      currentPrice.value = parseFloat(response.data.price_in_usd)
      lastUpdateTime.value = Date.now()

      // 如果已有昨日收盘价，计算涨跌幅
      if (yesterdayClosePrice.value) {
        calculatePriceChange()
      } else {
        // 否则获取昨日收盘价
        fetchYesterdayClosePrice()
      }

      // 价格更新后触发闪烁效果
      flashPrice()

      console.log('当前TRX价格更新:', currentPrice.value, '之前价格:', previousPrice)
    }
  } catch (error) {
    console.error('获取当前TRX价格失败:', error)
  } finally {
    isRefreshingPrice.value = false
  }
}

// 更新昨日收盘价并重新计算涨跌幅
const updateYesterdayClosePrice = () => {
  if (chartData.value && chartData.value.length > 0) {
    // 获取数据中最新的一条记录的收盘价
    const latestData = chartData.value[chartData.value.length - 1]
    const closePrice =
      typeof latestData.close === 'string' ? parseFloat(latestData.close) : latestData.close || 0

    // 更新昨日收盘价
    yesterdayClosePrice.value = closePrice

    // 如果当前价格已有值，则重新计算涨跌幅
    if (currentPrice.value !== null) {
      calculatePriceChange()
    }

    console.log('更新昨日收盘价:', yesterdayClosePrice.value)
  }
}

// 修改获取昨日收盘价函数，加强健壮性
const fetchYesterdayClosePrice = async () => {
  // 如果chartData已有数据，直接使用
  if (chartData.value && chartData.value.length > 0) {
    updateYesterdayClosePrice()
    return
  }

  // 如果没有chartData，请求昨天的数据
  try {
    const yesterday = timeUtils.getYesterday()
    const { startTimestamp, endTimestamp } = timeUtils.createDateRange(yesterday, yesterday)

    console.log('获取昨日收盘价...', timeUtils.getSimpleDate(startTimestamp))

    const response = await axios.get('https://apilist.tronscanapi.com/api/trx/volume', {
      params: {
        start_timestamp: startTimestamp,
        end_timestamp: endTimestamp,
        limit: 1,
        source: 'coinmarketcap'
      }
    })

    if (response.data && response.data.data && response.data.data.length > 0) {
      const closePrice = response.data.data[0].close
      yesterdayClosePrice.value =
        typeof closePrice === 'string' ? parseFloat(closePrice) : closePrice || 0

      console.log('从API获取的昨日收盘价:', yesterdayClosePrice.value)

      // 如果当前价格已有值，重新计算涨跌幅
      if (currentPrice.value !== null) {
        calculatePriceChange()
      }
    } else {
      console.warn('未能获取到昨日收盘价数据')
    }
  } catch (error) {
    console.error('获取昨日收盘价失败:', error)
  }
}

// 计算价格变化百分比
const calculatePriceChange = () => {
  if (
    currentPrice.value !== null &&
    yesterdayClosePrice.value !== null &&
    yesterdayClosePrice.value > 0
  ) {
    priceChangePercent.value =
      ((currentPrice.value - yesterdayClosePrice.value) / yesterdayClosePrice.value) * 100
  }
}

// 启动价格轮询
const startPricePolling = () => {
  // 立即获取一次当前价格
  fetchCurrentPrice()

  // 设置5分钟轮询
  pricePollingInterval = window.setInterval(
    () => {
      fetchCurrentPrice()
    },
    5 * 60 * 1000
  ) // 5分钟 = 300,000毫秒
}

// 停止价格轮询
const stopPricePolling = () => {
  if (pricePollingInterval !== null) {
    clearInterval(pricePollingInterval)
    pricePollingInterval = null
  }
}

// 格式化价格
const formatPrice = (price: number | string) => {
  if (!price) return '-'
  const numPrice = typeof price === 'string' ? parseFloat(price) : price
  return numPrice.toFixed(6)
}

// 格式化交易量
const formatVolume = (volume: number | string) => {
  if (!volume) return '-'
  const numVolume = typeof volume === 'string' ? parseFloat(volume) : volume

  if (numVolume >= 1000000000) {
    return (numVolume / 1000000000).toFixed(2) + 'B'
  } else if (numVolume >= 1000000) {
    return (numVolume / 1000000).toFixed(2) + 'M'
  } else if (numVolume >= 1000) {
    return (numVolume / 1000).toFixed(2) + 'K'
  }
  return numVolume.toString()
}

// 提取的日期数据
const dates = computed(() => {
  if (!chartData.value || chartData.value.length === 0) return []

  return chartData.value.map((item) => {
    // 从时间戳创建日期 - 注意API时间戳是当天的结束时间
    // 确保time是数字
    const timeValue = typeof item.time === 'number' ? item.time : 0
    const date = new Date(timeValue)

    // 日期应该对应当天，不需要-1
    // 使用工具类函数格式化，返回当天日期 YYYY-MM-DD 格式
    return formatToDate(date.getTime())
  })
})

// 提取的价格数据
const closePrices = computed(() => {
  if (!chartData.value || chartData.value.length === 0) return []

  return chartData.value.map((item) => {
    return typeof item.close === 'string' ? parseFloat(item.close) : item.close || 0
  })
})

// 计算默认的区域选择范围
const calculateDefaultZoomRange = computed(() => {
  if (!chartData.value || chartData.value.length <= 15) {
    // 数据少于15条，显示全部
    return { start: 0, end: 100 }
  } else if (chartData.value.length <= 30) {
    // 数据少于30条，显示全部
    return { start: 0, end: 100 }
  } else if (chartData.value.length <= 60) {
    // 数据在30-60条之间，显示最近的75%
    return { start: 25, end: 100 }
  } else {
    // 数据较多，显示最近的50%
    return { start: 80, end: 100 }
  }
})

// 初始化图表选项
const chartOptions = computed<EChartsOption>(() => {
  if (!chartData.value || chartData.value.length === 0) {
    return {
      title: {
        text: '暂无数据',
        left: 'center',
        top: 'center'
      }
    } as EChartsOption
  }

  const zoomRange = calculateDefaultZoomRange.value

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      },
      formatter: function (params: any) {
        if (params && params.length > 0) {
          const dataIndex = params[0].dataIndex
          if (!chartData.value || !chartData.value[dataIndex]) return ''

          const data = chartData.value[dataIndex]
          // 处理时间显示 - API返回的时间戳是当天的结束时间
          const timestamp = data.timestamp || data.time || 0
          const dateObj = new Date(timestamp)
          // 格式化为YYYY-MM-DD，日期对应当天
          const formattedDate = dateObj.toISOString().split('T')[0]

          let priceChange = '0.00%'
          const closePrice =
            typeof data.close === 'string' ? parseFloat(data.close) : data.close || 0
          const openPrice = typeof data.open === 'string' ? parseFloat(data.open) : data.open || 0

          if (openPrice > 0) {
            priceChange = (((closePrice - openPrice) / openPrice) * 100).toFixed(2) + '%'
          }

          return `
            <div style="font-weight:bold;margin-bottom:5px;">${formattedDate}</div>
            <div>收盘价: ${formatPrice(data.close)}</div>
          `
        }
        return ''
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '13%', // 增加底部空间以容纳区域选择器
      containLabel: true
    },
    // 添加dataZoom组件，实现区域选择功能
    dataZoom: [
      {
        type: 'slider', // 滑动条型数据区域缩放组件
        show: true,
        xAxisIndex: [0],
        start: zoomRange.start,
        end: zoomRange.end,
        height: 30,
        bottom: 10,
        borderColor: 'rgba(255, 82, 0, 0.2)',
        dataBackground: {
          lineStyle: {
            color: '#ff5200',
            opacity: 0.5
          },
          areaStyle: {
            color: 'rgba(255, 82, 0, 0.2)'
          }
        },
        fillerColor: 'rgba(255, 82, 0, 0.1)',
        handleStyle: {
          color: '#ff5200',
          borderColor: '#ff5200'
        },
        textStyle: {
          color: '#666'
        },
        brushSelect: true, // 允许框选
        emphasis: {
          handleStyle: {
            borderWidth: 2,
            color: '#ff7a4d'
          }
        }
      },
      {
        type: 'inside', // 内置型数据区域缩放组件（通过鼠标滚轮或触摸板）
        xAxisIndex: [0],
        start: zoomRange.start,
        end: zoomRange.end,
        zoomOnMouseWheel: true,
        moveOnMouseMove: true
      }
    ],
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates.value,
      axisLabel: {
        rotate: 45,
        interval: 'auto',
        formatter: function (value: string) {
          // 简化显示，只保留月-日
          const parts = value.split('-')
          if (parts.length === 3) {
            return `${parts[1]}-${parts[2]}`
          }
          return value
        }
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: function (value: number) {
          return formatPrice(value)
        }
      },
      scale: true, // 设置成true可以使y轴自适应数据范围
      splitLine: {
        lineStyle: {
          type: 'dashed'
        }
      }
    },
    series: [
      {
        name: '收盘价',
        type: 'line',
        smooth: true, // 设置为平滑的曲线
        symbol: 'circle',
        symbolSize: 5,
        data: closePrices.value,
        itemStyle: {
          color: '#ff5200'
        },
        lineStyle: {
          width: 1.5, // 稍微加粗线条
          color: '#ff5200',
          type: 'solid'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(255, 82, 0, 0.3)' },
              { offset: 1, color: 'rgba(255, 82, 0, 0.05)' }
            ]
          }
        },
        markPoint: {
          symbol: 'pin',
          symbolSize: 40,
          data: [
            { type: 'max', name: '最大值' },
            { type: 'min', name: '最小值' }
          ]
        },
        animationDuration: 2000,
        animationEasing: 'cubicInOut'
      }
    ]
  } as EChartsOption
})

// 添加图表实例引用
const chartRef = ref(null)
const chartInstance = ref<EChartsInstance | null>(null)
// 加载所有图表数据
const loadAllData = async () => {
  try {
    localLoading.value = true
    console.log('开始加载图表数据...')

    // 获取当前时间范围的数据
    const { startTimestamp, endTimestamp } = timeUtils.getRangeByType(timeRange.value)
    await fetchData(startTimestamp, endTimestamp)

    // 如果图表已经初始化，则更新图表
    if (chartInstance.value) {
      // 应用完整的图表配置
      chartInstance.value.setOption(chartOptions.value)

      console.log('图表数据已更新并渲染')
    }
  } catch (error) {
    console.error('加载图表数据失败:', error)
  } finally {
    localLoading.value = false
  }
}

// 添加handleChartInit函数
const handleChartInit = (chart: any) => {
  console.log('图表已初始化')
  chartInstance.value = chart

  // 设置事件监听
  chart.on('rendered', () => {
    console.log('图表渲染完成')
  })

  // 如果数据已加载，则设置初始视图
  if (chartData.value && chartData.value.length > 0) {
    chart.setOption(chartOptions.value, true)
  }
}

// 禁用今天和未来日期，只允许选择今天之前的日期
const disableFutureDates = (time: Date) => {
  return timeUtils.isDateDisabled(time)
}

// 初始化
onMounted(async () => {
  console.log('TrxChart组件已挂载，准备加载数据...')

  // 初始加载所有数据
  await loadAllData()

  // 获取当前TRX价格
  fetchCurrentPrice()

  // 设置5分钟轮询更新价格
  pricePollingInterval = window.setInterval(
    () => {
      fetchCurrentPrice()
    },
    5 * 60 * 1000
  )

  // 监听窗口大小变化，自动调整图表大小
  window.addEventListener('resize', () => {
    if (chartInstance.value) {
      chartInstance.value.resize()
    }
  })
})

// 在组件卸载时清理资源
onUnmounted(() => {
  // 停止价格轮询
  if (pricePollingInterval !== null) {
    clearInterval(pricePollingInterval)
    pricePollingInterval = null
  }

  // 移除窗口大小变化监听
  window.removeEventListener('resize', () => {
    if (chartInstance.value) {
      chartInstance.value.resize()
    }
  })

  // 释放图表实例
  if (chartInstance.value) {
    chartInstance.value.dispose()
    chartInstance.value = null
  }
})
</script>

<style scoped>
.chart-wrapper {
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 8px;
}

.chart-header {
  margin-bottom: 16px;
}

.chart-header h3 {
  margin: 0;
  margin-bottom: 12px;
  font-size: 18px;
  color: #333;
}

.chart-filters {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;
}

.quick-filters {
  flex: 1;
}

.date-picker {
  min-width: 300px;
}

@media (width <= 768px) {
  .chart-filters {
    flex-direction: column;
    align-items: flex-start;
  }

  .date-picker {
    width: 100%;
  }
}

.current-price-panel {
  display: flex;
  width: 20%;
  padding: 12px 16px;
  margin-bottom: 16px;
  background-color: #f9f9f9;
  border-left: 4px solid #ff5200;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgb(0 0 0 / 5%);
  justify-content: space-between;
  align-items: center;
}

.price-display {
  display: flex;
  align-items: center;
  gap: 20px;
}

.price-main {
  display: flex;
  flex-direction: column;
}

.price-label {
  margin-bottom: 4px;
  font-size: 14px;
  color: #666;
}

.price-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  transition: all 0.5s;
}

.price-flash {
  animation: priceFlash 1.5s ease;
}

@keyframes priceFlash {
  0% {
    color: #333;
    background-color: transparent;
  }

  30% {
    padding: 2px 8px;
    color: #fff;
    background-color: #ff5200;
    border-radius: 4px;
  }

  100% {
    color: #333;
    background-color: transparent;
  }
}

.price-compare {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.price-change {
  display: inline-flex;
  padding: 4px 10px;
  font-size: 16px;
  font-weight: bold;
  border-radius: 4px;
  align-items: center;
  gap: 6px;
}

.price-vs-yesterday {
  font-size: 12px;
  color: #666;
}

.price-up {
  color: #41b883;
  background-color: rgb(65 184 131 / 10%);
}

.price-down {
  color: #e74c3c;
  background-color: rgb(231 76 60 / 10%);
}

.price-unchanged {
  color: #7f8c8d;
  background-color: rgb(127 140 141 / 10%);
}

.price-update {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.price-update-time {
  font-size: 12px;
  color: #999;
}

.refresh-btn {
  display: flex;
  padding: 2px 8px;
  font-size: 12px;
  color: #666;
  align-items: center;
  gap: 4px;
}

.refresh-btn:hover {
  color: #ff5200;
}

@media (width <= 768px) {
  .current-price-panel {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .price-update {
    align-items: flex-start;
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
  }
}

.chart-controls {
  display: flex;
  margin: 10px 0;
  justify-content: flex-end;
  gap: 10px;
}

.refresh-chart-btn,
.fullscreen-btn {
  display: flex;
  align-items: center;
  gap: 5px;
}

.fullscreen {
  position: fixed !important;
  top: 0;
  left: 0;
  z-index: 9999;
  width: 100vw !important;
  height: 100vh !important;
  padding: 20px;
  margin: 0;
  overflow: auto;
  background-color: rgb(255 255 255 / 98%);
  border-radius: 0;
}
</style>
