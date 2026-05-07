<template>
  <div class="exchange-transaction-container">
    <ContentWrap>
      <SearchTable
        ref="searchTableRef"
        :columns="columns"
        :search-schema="searchSchema"
        :fetch-data-api="fetchExchangeTransactionList"
        :action-column="actionColumn"
        :table-props="{
          rowKey: 'id',
          highlightCurrentRow: false,
          reserveSelection: false
        }"
        :show-add-button="false"
        @loaded="handleDataLoaded"
        @error="handleLoadError"
        @search="onSearch"
        :search-props="{
          layout: 'inline',
          buttonPosition: 'center'
        }"
      >
        <template #searchButtons>
          <BaseButton type="primary" @click="handleExport">
            <Icon icon="ep:download" class="mr-5px" />
            导出
          </BaseButton>
        </template>
      </SearchTable>

      <!-- 订单详情弹窗 -->
      <OrderDetail ref="orderDetailRef" />
    </ContentWrap>
  </div>
</template>

<script setup lang="tsx">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElTag, ElMessage } from 'element-plus'
import { SearchTable } from '@/components/SearchTable'
import type { SearchTableExpose } from '@/components/SearchTable/src/types'
import type { TableColumn } from '@/components/Table/src/types'
import { FormSchema } from '@/components/Form'
import { formatToDateTime, formatToDate } from '@/utils/dateUtil'
import OrderDetail from './components/OrderDetail.vue'
import { v2GetExchangeList } from '@/api/exchange_transaction'
import type { ExchangeOrderListItem, V2ExchangeItem } from '@/api/exchange_transaction/types'
import { BaseButton } from '@/components/Button'
import { ContentWrap } from '@/components/ContentWrap'
import { simpleExportToExcel } from '@/utils/excel'
import { handleListMessage, handleErrorMessage, handleSuccessMessage } from '@/utils/messageHelper'
// 引用
const searchTableRef = ref<SearchTableExpose>()
const orderDetailRef = ref()
const totalCount = ref(0)

// 保存当前搜索参数
const currentSearchParams = ref<any>({})

// 导出 - 直接使用后端字段名
const handleExport = async () => {
  try {
    // 尝试获取当前搜索条件，如果失败则使用保存的参数
    let params
    try {
      params = await searchTableRef.value?.searchMethods?.getFormData()
    } catch (e) {
      // 如果 getFormData 不可用，使用保存的搜索参数
      params = currentSearchParams.value
    }

    // 构建新接口参数
    const apiParams: any = {}

    // 处理时间范围 - 转换为秒级时间戳
    if (params?.dateRange && params.dateRange.length === 2) {
      apiParams.start_time = String(Math.floor(params.dateRange[0] / 1000))
      apiParams.end_time = String(Math.floor(params.dateRange[1] / 1000))
    }

    // 处理关键词查询
    if (params?.keyword) {
      apiParams.keyword = params.keyword
    }

    // 处理交易类型查询
    if (params?.in_coin) {
      apiParams.in_coin = params.in_coin
    }

    // 处理状态
    if (params?.status) {
      apiParams.status = params.status
    }

    console.log('导出参数:', apiParams)

    // 使用获取列表的接口，传入搜索条件
    const res = await v2GetExchangeList(apiParams)

    if (res.code === '000000' && res.data && res.data.list) {
      // 将数据转换为导出格式，直接使用后端字段名
      const list = res.data.list.map((item: any) => {
        // 状态映射
        let statusText = '未知'
        switch (item.status) {
          case 1:
            statusText = '待支付'
            break
          case 2:
            statusText = '支付中'
            break
          case 3:
            statusText = '处理中'
            break
          case 4:
            statusText = '待确认'
            break
          case 5:
            statusText = '已完成'
            break
          case 6:
            statusText = '失败订单'
            break
          case 7:
            statusText = '退款中'
            break
          case 8:
            statusText = '已取消'
            break
          case 9:
            statusText = '已过期'
            break
        }

        // 交易类型判断
        let transactionType = '未知'
        if (item.in_coin === 'USDT' && item.out_coin === 'TRX') {
          transactionType = 'USDT → TRX'
        } else if (item.in_coin === 'TRX' && item.out_coin === 'USDT') {
          transactionType = 'TRX → USDT'
        }

        return {
          订单ID: item.id || '-',
          代理名称: item.agent_name || '-',
          支付金额: `${item.amount || ''} ${item.in_coin || ''}`.trim(),
          兑换汇率: item.actual_rate || '-',
          实时汇率: item.real_rate || '-',
          支出金额: `${item.out_amount || ''} ${item.out_coin || ''}`.trim(),
          交易类型: transactionType,
          平台利润: item.plate_profit ? `${item.plate_profit}TRX` : '-',
          代理扣款: item.agent_cost ? `${item.agent_cost}TRX` : '-',
          交易状态: statusText,
          完成时间: item.paid_at ? formatToDateTime(item.paid_at) : '-',
          描述: item.describe || '-',
          _timestamp: item.paid_at || 0 // 用于排序的时间戳
        }
      })

      // 按时间倒序排序（最新的在前）
      list.sort((a, b) => b._timestamp - a._timestamp)

      // 移除排序用的时间戳字段
      const exportList = list.map(({ _timestamp, ...rest }) => rest)

      // 导出为 Excel
      simpleExportToExcel(exportList, '闪兑订单列表')
      handleSuccessMessage('导出成功')
    } else {
      ElMessage.error('导出失败：数据格式错误')
    }
  } catch (error) {
    handleErrorMessage(error, '导出失败')
  }
}

// 表格列配置 - 使用后端字段名
const columns = reactive<TableColumn[]>([
  {
    field: 'id',
    label: '订单ID',
    minWidth: 180,
    formatter: (row) => row.id || '-'
  },
  {
    field: 'agent_name',
    label: '代理名称',
    minWidth: 150,
    formatter: (row) => row.agent_name || '-'
  },
  {
    field: 'amount',
    label: '支付金额',
    minWidth: 120,
    formatter: (row) => {
      const amount = row.amount || ''
      const unit = row.in_coin || row.coin || ''
      return amount || unit ? `${amount}${unit}`.trim() : '-'
    }
  },
  {
    field: 'actual_rate',
    label: '兑换汇率',
    minWidth: 120,
    formatter: (row) => row.actual_rate || '-'
  },
  {
    field: 'real_rate',
    label: '实时汇率',
    minWidth: 100,
    formatter: (row) => row.real_rate || '-'
  },
  {
    field: 'out_amount',
    label: '支出数量',
    minWidth: 150,
    formatter: (row) => {
      const amount = row.out_amount || ''
      const unit = row.out_coin || ''
      return amount || unit ? `${amount}${unit}`.trim() : '-'
    }
  },
  {
    field: 'in_coin',
    label: '交易类型',
    minWidth: 140,
    slots: {
      default: ({ row }: { row: V2ExchangeItem }) => {
        // 根据 in_coin 和 out_coin 判断交易类型
        let label = '未知'
        let color = '#909399'

        if (row.in_coin === 'USDT' && row.out_coin === 'TRX') {
          label = 'USDT  → TRX'
          color = '#67C23A'
        } else if (row.in_coin === 'TRX' && row.out_coin === 'USDT') {
          label = 'TRX  → USDT'
          color = '#409EFF'
        }

        return <span style={{ color: color, fontWeight: '500' }}>{label}</span>
      }
    }
  },
  {
    field: 'plate_profit',
    label: '平台利润',
    minWidth: 120,
    formatter: (row) => (row.plate_profit ? `${row.plate_profit}TRX`.trim() : '-')
  },
  {
    field: 'agent_cost',
    label: '代理扣款',
    minWidth: 150,
    formatter: (row) => {
      if (!row.agent_cost) return '-'
      // 去掉负号，因为"代理扣款"本身就表示支出
      const amount = Math.abs(Number(row.agent_cost))
      return `${amount}TRX`
    }
  },
  {
    field: 'status',
    label: '交易状态',
    minWidth: 100,
    slots: {
      default: ({ row }: { row: V2ExchangeItem }) => {
        let type: 'success' | 'warning' | 'info' | 'danger' = 'info'
        let label = '未知'
        switch (row.status) {
          case 5:
            type = 'success'
            label = '已完成'
            break
          case 6:
            type = 'danger'
            label = '已失败'
            break
          case 8:
            type = 'warning'
            label = '已取消'
            break
          case 1:
            type = 'info'
            label = '待支付'
            break
          case 2:
            type = 'warning'
            label = '已支付'
            break
          case 3:
            type = 'info'
            label = '处理中'
            break
          case 4:
            type = 'warning'
            label = '待确认'
            break
          case 7:
            type = 'info'
            label = '退款中'
            break
          case 9:
            type = 'danger'
            label = '已中止'
            break
        }
        return <ElTag type={type}>{label}</ElTag>
      }
    }
  },
  {
    field: 'paid_at',
    label: '完成时间',
    sortable: 'custom',
    minWidth: 160,
    formatter: (row) => (row.paid_at ? formatToDateTime(row.paid_at) : '-')
  },
  {
    field: 'describe',
    label: '描述',
    width: 160,
    formatter: (row) => row.describe || '-'
  }
])

// 搜索表单配置 - 使用后端字段名
const searchSchema = reactive<FormSchema[]>([
  {
    field: 'keyword',
    component: 'Input',
    label: {
      tips: 'TG用户ID/TG用户名/TG用户昵称/机器人名称/代理名称/用户账号/用户邮箱',
      text: '关键词'
    },
    componentProps: {
      placeholder: '请输入关键词',
      clearable: true
    }
  },
  {
    field: 'in_coin',
    component: 'Select',
    label: '交易类型:',
    componentProps: {
      placeholder: '全部',
      options: [
        { label: '全部', value: '' },
        { label: 'USDT → TRX', value: 'USDT' },
        { label: 'TRX → USDT', value: 'TRX' }
      ],
      clearable: true
    }
  },
  {
    field: 'status',
    component: 'Select',
    label: '交易状态:',
    componentProps: {
      placeholder: '全部',
      options: [
        { label: '全部', value: '' },
        { label: '已支付', value: 2 },
        { label: '已完成', value: 5 },
        { label: '已失败', value: 6 },
        { label: '已中止', value: 9 }
      ],
      clearable: true
    }
  },
  {
    field: 'dateRange',
    component: 'DatePicker',
    label: '创建时间',
    componentProps: {
      type: 'daterange',
      valueFormat: 'x',
      startPlaceholder: '开始日期',
      endPlaceholder: '结束日期'
    }
  }
])

// 操作列配置 - 使用后端字段名
const actionColumn = {
  field: 'action',
  label: '操作',
  minWidth: 120,
  fixed: 'right' as const,
  slots: {
    default: ({ row }: { row: V2ExchangeItem }) => {
      return (
        <>
          <BaseButton type="primary" onClick={() => handleDetail(row)}>
            详情
          </BaseButton>
        </>
      )
    }
  }
}

// 处理详情查看 - 使用后端字段名
const handleDetail = (row: V2ExchangeItem) => {
  orderDetailRef.value?.open(row.id, row) // 传递完整的行数据
}

// 请求闪兑明细列表数据 - 直接使用后端字段名
const fetchExchangeTransactionList = async (params: any) => {
  try {
    // 保存当前搜索参数（用于导出）
    currentSearchParams.value = params

    console.log('[fetchExchangeTransactionList] 原始查询参数:', params)

    // 构建新接口参数
    const apiParams: any = {
      current_page: params.current_page || 1,
      page_size: params.page_size || 10
    }

    // 处理时间范围 - 转换为秒级时间戳
    if (params.dateRange && params.dateRange.length === 2) {
      apiParams.start_time = String(Math.floor(params.dateRange[0] / 1000))
      apiParams.end_time = String(Math.floor(params.dateRange[1] / 1000))
    }

    // 处理关键词查询
    if (params.keyword) {
      apiParams.keyword = params.keyword
    }

    // 处理交易类型查询（使用 in_coin）
    if (params.in_coin) {
      apiParams.in_coin = params.in_coin
    }

    // 处理状态
    if (params.status) {
      apiParams.status = params.status
    }

    // 处理排序参数 - 使用后端字段名
    if (params.order) {
      const fieldMapping: Record<string, string> = {
        paid_at: 'paid_at'
      }

      // 解析排序参数，格式：column ASC 或 column DESC
      const orderParts = params.order.split(' ')
      if (orderParts.length === 2) {
        const [field, direction] = orderParts
        const mappedField = fieldMapping[field] || field
        apiParams.order = `${mappedField} ${direction}`
      }
    }

    console.log('[fetchExchangeTransactionList] 调用新接口参数:', apiParams)

    // 调用新接口
    const res = await v2GetExchangeList(apiParams)

    if (res?.data) {
      const data = res.data
      const list = data.list || []
      const total = data.pager?.total || 0

      // 直接使用后端返回的数据，不进行字段映射
      totalCount.value = total

      console.log('[fetchExchangeTransactionList] 返回数据:', { total, count: list.length })

      // 添加数据为空提示
      const hasSearchCondition = !!(
        params.keyword ||
        params.in_coin ||
        params.status ||
        params.dateRange
      )
      handleListMessage(list, hasSearchCondition, '闪兑订单')

      return {
        list: list,
        totalCount: total
      }
    } else {
      totalCount.value = 0
      return { list: [], totalCount: 0 }
    }
  } catch (error) {
    handleErrorMessage(error, '获取闪兑订单列表失败')
    totalCount.value = 0
    return { list: [], totalCount: 0 }
  }
}

// 数据加载完成回调
const handleDataLoaded = ({ data, total, success }: any) => {
  console.log('数据加载完成:', {
    总条数: total,
    成功: success,
    数据: data,
    条数: data?.length || 0
  })
  nextTick(() => {
    totalCount.value = total || 0
  })
}

// 数据加载错误回调
const handleLoadError = () => {
  ElMessage.error('加载数据失败')
}

// 页面加载
onMounted(() => {
  console.log('闪兑订单页面已加载')
})

// 搜索事件处理
const onSearch = (params: any) => {
  // onSearch 事件会在用户点击搜索时触发，但参数已经在 fetchExchangeTransactionList 中保存了
  console.log('搜索参数:', params)
}
</script>

<style scoped>
.exchange-transaction-container {
  height: 100%;
  padding: 16px;
}
</style>
