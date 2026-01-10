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

      <!-- 补发TRX弹窗 -->
      <ResendTrx ref="resendTrxRef" @success="handleResendSuccess" />
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
import ResendTrx from './components/ResendTrx.vue'
import { getExchangeOrderListApi, exportExchangeOrderApi } from '@/api/exchange_transaction' // 新增导入
import type {
  ExchangeOrderListItem,
  ExchangeOrderListParams,
  ExchangeOrderListResult
} from '@/api/exchange_transaction/types'
import { BaseButton } from '@/components/Button'
import { ContentWrap } from '@/components/ContentWrap'
import { downloadByData } from '@/utils/download'
// 引用
const searchTableRef = ref<SearchTableExpose>()
const orderDetailRef = ref()
const resendTrxRef = ref()
const totalCount = ref(0)

// 导出
const handleExport = async () => {
  try {
    const params = (await searchTableRef.value?.searchMethods.getFormData()) || {}
    // 处理时间范围
    const exportParams = { ...params } as any
    if (params.dateRange && params.dateRange.length === 2) {
      exportParams.start_time = params.dateRange[0]
      exportParams.end_time = params.dateRange[1]
      delete exportParams.dateRange
    }
    const res = await exportExchangeOrderApi(exportParams as ExchangeOrderListParams)
    if (res.data instanceof Blob) {
      downloadByData(res.data, '闪兑订单列表.xlsx')
      ElMessage.success('导出成功')
    } else {
      console.error('Export failed: Response data is not a Blob', res.data)
      ElMessage.error('导出失败: 文件数据格式错误')
    }
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

// 表格列配置 (根据截图更新)
const columns = reactive<TableColumn[]>([
  {
    field: 'finish_time', // 使用完成时间作为日期
    label: '日期',
    minWidth: 120,
    formatter: (row) => (row.finish_time ? formatToDate(row.finish_time * 1000) : '-') // 格式化为 YYYY-MM-DD
  },
  { field: 'order_id', label: '订单ID', minWidth: 180 },
  { field: 'username', label: '代理名称', minWidth: 150 }, // 映射到 username (根据实际情况调整)
  // {
  //   field: 'order_type', // 保持字段，但修改 formatter
  //   label: '交易类型',
  //   minWidth: 100,
  //   formatter: () => '闪兑' // 固定显示为"闪兑"
  // },
  {
    field: 'order_amount',
    label: '支付金额',
    minWidth: 120,
    formatter: (row) => `${row.order_amount || ''}${row.pay_unit || ''}`.trim() // 格式如 20USDT
  },
  {
    field: 'trx_price',
    label: '兑换汇率',
    minWidth: 120,
    formatter: (row) => row.trx_price || '-' // 显示价格，如 0.28114
  },
  {
    field: 'real_price',
    label: '实时汇率',
    minWidth: 100,
    formatter: (row) => row.real_price || '-' // 显示价格，如 0.255
  },
  {
    field: 'exchange_amount', // 对应截图的 "支出TRX数量"
    label: '支出数量',
    minWidth: 150,
    formatter: (row) => `${row.exchange_amount || ''}${row.exchange_unit || ''}`.trim() // 格式如 71.13957TRX
  },
  {
    field: 'order_type',
    label: '交易类型',
    minWidth: 140,
    slots: {
      default: ({ row }: { row: ExchangeOrderListItem }) => {
        const orderTypeMap: Record<number, { label: string; color: string }> = {
          1: { label: 'USDT  → TRX', color: '#67C23A' }, // 绿色
          2: { label: 'TRX  → USDT', color: '#409EFF' } // 蓝色
        }
        const typeInfo = orderTypeMap[row.order_type] || { label: '未知', color: '#909399' }
        return <span style={{ color: typeInfo.color, fontWeight: '500' }}>{typeInfo.label}</span>
      }
    }
  },
  {
    field: 'plate_profit',
    label: '平台利润',
    minWidth: 120,
    formatter: (row) => (row.plate_profit ? `${row.plate_profit}TRX`.trim() : '-') // 格式如 3.55698TRX
  },

  {
    field: 'agent_out_amount', // 对应截图的 "代理扣款"
    label: '代理扣款',
    minWidth: 150,
    formatter: (row) => (row.agent_out_amount ? `${row.agent_out_amount}TRX`.trim() : '-') // 格式如 74.69655TRX
  },
  {
    field: 'status',
    label: '交易状态',
    minWidth: 100,
    slots: {
      default: ({ row }: { row: ExchangeOrderListItem }) => {
        let type: 'success' | 'warning' | 'info' | 'danger' = 'info'
        let label = '未知'
        switch (row.status) {
          case 1:
            type = 'success'
            label = '成功'
            break // 匹配截图 "成功"
          case 2:
            type = 'danger'
            label = '失败'
            break
          case 3:
            type = 'warning'
            label = '待支付'
            break
          // 可以根据需要添加其他状态
        }
        // 使用 BaseButton 或仅文本模仿截图中的链接样式
        // 这里暂时还用 ElTag
        return <ElTag type={type}>{label}</ElTag>
      }
    }
  },
  {
    field: 'finish_time', // 重复 finish_time 用于显示完整时间
    label: '完成时间',
    minWidth: 160,
    formatter: (row) => (row.finish_time ? formatToDateTime(row.finish_time * 1000) : '-') // 格式化为 YYYY-MM-DD HH:mm:ss
  },
  {
    field: 'describe',
    label: '描述',
    width: 160
  }
  // 移除 describe 列
])

// 搜索表单配置 (根据截图更新)
const searchSchema = reactive<FormSchema[]>([
  {
    field: 'query',
    component: 'Input',
    label: '关键字:',
    componentProps: { placeholder: '请输入类型' } // 匹配截图 placeholder
  },
  {
    field: 'status',
    component: 'Select',
    label: '状态:',
    componentProps: {
      placeholder: '全部', // 匹配截图 placeholder
      options: [
        { label: '全部', value: '' }, // 空字符串代表全部
        { label: '成功', value: 1 },
        { label: '失败', value: 2 },
        { label: '待支付', value: 3 }
        // 可以根据需要添加其他状态选项
      ],
      clearable: true
    }
  },
  {
    field: 'dateRange',
    component: 'DatePicker',
    label: '创建时间',
    componentProps: {
      type: 'datetimerange',
      valueFormat: 'x',
      startPlaceholder: '开始日期',
      endPlaceholder: '结束日期'
    }
  }
])

// 操作列配置
const actionColumn = {
  field: 'action',
  label: '操作',
  minWidth: 120,
  fixed: 'right' as const,
  slots: {
    default: ({ row }: { row: ExchangeOrderListItem }) => {
      return (
        <>
          <BaseButton type="primary" onClick={() => handleDetail(row)}>
            详情
          </BaseButton>
          {/* <BaseButton
            type="primary"
            onClick={() => handleResend(row)}
            disabled={row.status !== 1 && row.status !== 2}
          >
            补发TRX
          </BaseButton> */}
        </>
      )
    }
  }
}

// 处理详情查看
const handleDetail = (row: ExchangeOrderListItem) => {
  orderDetailRef.value?.open(row.id)
}

// 处理补发TRX
const handleResend = (row: ExchangeOrderListItem) => {
  resendTrxRef.value?.open(row)
}

// 处理补发成功
const handleResendSuccess = () => {
  searchTableRef.value?.tableMethods.getList()
}

// 请求闪兑明细列表数据
const fetchExchangeTransactionList = async (params: any) => {
  try {
    // 处理时间范围
    const queryParams: any = { ...params }
    if (params.dateRange && params.dateRange.length === 2) {
      queryParams.start_time = params.dateRange[0]
      queryParams.end_time = params.dateRange[1]
      delete queryParams.dateRange
    }

    const res = (await getExchangeOrderListApi(queryParams as ExchangeOrderListParams)) as any

    if (res?.data) {
      totalCount.value = res.data.total || 0
      return {
        list: res.data.list || [],
        totalCount: res.data.totalCount || 0
      }
    } else {
      ElMessage.error(res?.message || '获取列表失败')
      totalCount.value = 0
      return { list: [], totalCount: 0 }
    }
  } catch (error) {
    console.error('获取闪兑订单列表出错:', error)
    ElMessage.error('获取闪兑订单列表失败')
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
  if (data?.length === 0 && success) {
    ElMessage.info('未查询到符合条件的数据')
  }
}

// 数据加载错误回调
const handleLoadError = () => {
  ElMessage.error('加载数据失败，请稍后重试')
}

// 页面加载
onMounted(() => {
  console.log('闪兑订单页面已加载')
})
</script>

<style scoped>
.exchange-transaction-container {
  height: 100%;
  padding: 16px;
}
</style>
