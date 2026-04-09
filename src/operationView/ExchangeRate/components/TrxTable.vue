<template>
  <div class="table-wrapper">
    <div class="table-header">
      <h3>TRX 价格数据（近一个月）</h3>
    </div>
    <Table
      v-loading="loading"
      :columns="columns"
      :data="dataList"
      stripe
      border
      :empty-text="'暂无数据'"
      :height="550"
      @register="tableRegister"
    />
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useTable } from '@/hooks/web/useTable'
import { Table, TableColumn } from '@/components/Table'
import axios from 'axios'
import { handleErrorMessage } from '@/utils/messageHelper'

// 定义数据结构
interface TrxPriceData {
  time: number
  date: string
  open: number | string
  high: number | string
  low: number | string
  close: number | string
}

// TRX价格数据API服务
const getTrxPriceData = async () => {
  try {
    // 获取近一个月的数据
    const now = new Date()
    const endTimestamp = now.getTime()
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(now.getMonth() - 1)
    const startTimestamp = oneMonthAgo.getTime()

    const { data } = await axios.get('https://apilist.tronscanapi.com/api/trx/volume', {
      params: {
        start_timestamp: startTimestamp,
        end_timestamp: endTimestamp,
        limit: 100,
        source: 'coinmarketcap'
      }
    })

    if (data.data && Array.isArray(data.data)) {
      // 处理并转换数据
      const processedData = data.data.map((item) => ({
        time: item.time || item.timestamp,
        date: item.date,
        open: item.open || 0,
        high: item.high || 0,
        low: item.low || 0,
        close: item.close || 0
      }))

      // 按时间降序排列
      return {
        list: [...processedData].sort((a, b) => b.time - a.time),
        total: processedData.length
      }
    }

    return {
      list: [],
      total: 0
    }
  } catch (error) {
    handleErrorMessage(error, '获取TRX价格数据失败')
    return {
      list: [],
      total: 0
    }
  }
}

// 使用表格 hook
const { tableRegister, tableMethods, tableState } = useTable({
  fetchDataApi: getTrxPriceData
})

// 从tableState和tableMethods中解构需要的变量和方法
const { loading, dataList } = tableState
// const { refresh } = tableMethods;
// 格式化价格
const formatPrice = (price: number | string | null | undefined): string => {
  if (!price && price !== 0) return '-'
  const numPrice = typeof price === 'string' ? parseFloat(price) : price
  return numPrice.toFixed(4)
}

// 表格列定义
const columns = reactive<TableColumn[]>([
  {
    field: 'time',
    label: '日期',
    formatter: (row: TrxPriceData) => {
      const date = new Date(row.time)
      return date.toISOString().split('T')[0]
    }
  },
  {
    field: 'open',
    label: '开盘价',
    formatter: (row: TrxPriceData) => formatPrice(row.open)
  },
  {
    field: 'high',
    label: '最高价',
    formatter: (row: TrxPriceData) => formatPrice(row.high)
  },
  {
    field: 'low',
    label: '最低价',
    formatter: (row: TrxPriceData) => formatPrice(row.low)
  },
  {
    field: 'close',
    label: '收盘价',
    formatter: (row: TrxPriceData) => formatPrice(row.close)
  }
])

// onMounted(() => {
//   refresh();
// })
</script>

<style scoped>
.table-wrapper {
  width: 100%;
  height: 100%;
  padding: 16px;
  overflow: hidden;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgb(0 0 0 / 10%);
}

.table-header {
  display: flex;
  margin-bottom: 16px;
  justify-content: space-between;
  align-items: center;
}

.table-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}
</style>
