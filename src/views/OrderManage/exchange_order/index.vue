<template>
  <div class="app-container">
    <ContentWrap>
      <SearchTable
        :columns="columns"
        :search-schema="searchSchema"
        :action-column="actionColumn"
        :fetch-data-api="fetchExchangeOrderList"
        :showAddButton="false"
        ref="searchTableRef"
        @search="onSearch"
      >
        <template #searchButtons>
          <BaseButton @click="handleExport" type="primary">
            <Icon icon="ep:download" class="mr-5px" />
            导出订单
          </BaseButton>
        </template>
      </SearchTable>

      <!-- 兑换详情弹窗 -->
      <Dialog v-model="dialogVisible" :title="'兑换详情'">
        <Descriptions
          :schema="exchangeDetailSchema"
          :data="orderDetail"
          :column="2"
          title="兑换详情"
        />
        <template #footer>
          <div class="flex justify-end">
            <ElButton @click="dialogVisible = false">关闭</ElButton>
          </div>
        </template>
      </Dialog>

      <!-- 交易详情弹窗 - 综合版 -->
      <Dialog v-model="transactionDialogVisible" :title="'交易详情'">
        <ElTabs v-model="activeTransactionTab" class="transaction-tabs">
          <ElTabPane
            name="in"
            :label="transactionDetail?.order_type === 1 ? '用户转USDT hash' : '用户转TRX hash'"
          >
            <Descriptions
              :schema="transactionInSchema"
              :data="transactionDetail"
              :column="1"
              border
            />
          </ElTabPane>
          <ElTabPane
            name="out"
            :label="transactionDetail?.order_type === 1 ? '系统发放TRX hash' : '系统发放USDT hash'"
          >
            <Descriptions
              :schema="transactionOutSchema"
              :data="transactionDetail"
              :column="1"
              border
            />
          </ElTabPane>
        </ElTabs>
        <div
          v-if="!transactionDetail.in_txid && !transactionDetail.out_txid"
          class="empty-transaction"
        >
          <ElEmpty description="暂无交易数据" />
        </div>
        <template #footer>
          <div class="flex justify-end">
            <ElButton @click="transactionDialogVisible = false">关闭</ElButton>
          </div>
        </template>
      </Dialog>
    </ContentWrap>
  </div>
</template>

<script setup lang="tsx">
import { ref, onMounted, h, computed } from 'vue'
import { formatToDateTime } from '@/utils/dateUtil'
import { useRouter } from 'vue-router'
import { ElButton, ElTag, ElMessage, ElTabs, ElTabPane, ElLink, ElEmpty } from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import { Dialog } from '@/components/Dialog'
import { SearchTable } from '@/components/SearchTable'
import { BaseButton } from '@/components/Button'
import { Descriptions } from '@/components/Descriptions'
import type { TableColumn } from '@/components/Table'
import type { DescriptionsSchema } from '@/components/Descriptions'
import { v1GetExchangeOrderList, v1GetExchangeOrderDetail } from '@/api/exchange_order'
import { Icon } from '@/components/Icon'
import { simpleExportToExcel } from '@/utils/excel'
import { ExchangeOrderListItem } from '@/api/exchange_transaction'
import { handleListMessage, handleErrorMessage, handleSuccessMessage } from '@/utils/messageHelper'

// const { t } = useI18n()
const router = useRouter()
const searchTableRef = ref<InstanceType<typeof SearchTable> | null>(null)

// 订单详情相关
const dialogVisible = ref(false)
const orderDetail = ref<any>({})

// 交易详情相关
const transactionDialogVisible = ref(false)
const transactionDetail = ref<any>({})
const activeTransactionTab = ref('in')

// 保存当前搜索参数
const currentSearchParams = ref<any>({})

// 兑换详情Schema
const exchangeDetailSchema = computed(() => {
  const schema: DescriptionsSchema[] = [
    { field: 'id', label: '订单号' },
    { field: 'bot_id', label: '机器人ID' },
    {
      field: 'amount',
      label: '支付金额',
      slots: {
        default: (row: any) => {
          if (!row || !row.amount) return h('span', '-')
          return h('span', row.amount + row.coin)
        }
      }
    },
    {
      field: 'exchange',
      label: '兑换汇率',
      slots: {
        default: (row: any) => {
          return h('span', row.exchange?.actual_rate || '-')
        }
      }
    },
    {
      field: 'created_at',
      label: '创建时间',
      slots: {
        default: (row: any) => {
          if (!row || !row.created_at) return h('span', '-')
          return h('span', formatToDateTime(row.created_at))
        }
      }
    },
    {
      field: 'order_type',
      label: '订单类型',
      slots: {
        default: (row: any) => {
          if (!row) return h('span', '-')
          return h('span', row.order_type === 1 ? '兑换TRX' : '兑换USDT')
        }
      }
    },
    { field: 'bot_user_name', label: '机器人名称' },
    {
      field: 'exchange',
      label: '兑换金额',
      slots: {
        default: (row: any) => {
          if (!row || !row.exchange) return h('span', '-')
          return h('span', `${row.exchange.out_amount} ${row.exchange.out_coin}`)
        }
      }
    },
    {
      field: 'status',
      label: '订单状态',
      slots: {
        default: (row: any) => {
          if (!row) return h('span', '-')
          return h(ElTag, { type: getStatusType(row.status), size: 'small' }, () =>
            getStatusText(row.status)
          )
        }
      }
    },
    {
      field: 'paid_at',
      label: '支付时间',
      slots: {
        default: (row: any) => {
          if (!row || !row.paid_at) return h('span', '-')
          return h('span', formatToDateTime(row.paid_at))
        }
      }
    }
  ]
  return schema
})

// 转入详情Schema
const transactionInSchema = computed<DescriptionsSchema[]>(() => [
  {
    field: 'in_txid',
    label: '交易Hash',
    span: 24,
    slots: {
      default: (row: any) => {
        if (!row || !row.in_txid) return h('span', '-')
        return h(
          ElLink,
          {
            href: `${import.meta.env.VITE_TRONSCAN_URL}/#/transaction/${row.in_txid}`,
            type: 'primary',
            target: '_blank'
          },
          () => row.in_txid
        )
      }
    }
  },
  { field: 'in_to_address', label: '接收人', span: 24 },
  { field: 'in_from_address', label: '发送人', span: 24 },
  {
    field: 'order_amount',
    label: '金额',
    slots: {
      default: (row: any) => {
        if (!row || !row.order_amount) return h('span', '-')
        const unit = row.order_type === 1 ? 'USDT' : 'TRX'
        return h('span', `${row.order_amount}（${unit}）`)
      }
    }
  },
  {
    field: 'in_time',
    label: '转入时间',
    slots: {
      default: (row: any) => {
        console.log('row', row)
        return h('span', formatToDateTime(row.in_time))
      }
    }
  }
])

// 转出详情Schema
const transactionOutSchema = computed<DescriptionsSchema[]>(() => [
  {
    field: 'out_txid',
    label: '交易Hash',
    span: 24,
    slots: {
      default: (row: any) => {
        if (!row || !row.out_txid) return h('span', '-')
        return h(
          ElLink,
          {
            href: `${import.meta.env.VITE_TRONSCAN_URL}/#/transaction/${row.out_txid}`,
            type: 'primary',
            target: '_blank'
          },
          () => row.out_txid
        )
      }
    }
  },
  {
    field: 'out_to_address',
    label: '接收人',
    span: 24,
    slots: {
      default: (row: any) => {
        if (!row || !row.out_txid) return h('span', '-')
        return h('span', row.out_to_address || '-')
      }
    }
  },
  {
    field: 'out_from_address',
    label: '发送人',
    span: 24,
    slots: {
      default: (row: any) => {
        if (!row || !row.out_txid) return h('span', '-')
        return h('span', row.out_from_address || '-')
      }
    }
  },
  {
    field: 'user_get_amount',
    label: '金额',
    slots: {
      default: (row: any) => {
        if (!row || !row.user_get_amount) return h('span', '-')
        const unit = row.order_type === 1 ? 'TRX' : 'USDT'
        return h('span', `${row.user_get_amount}（${unit}）`)
      }
    }
  },
  {
    field: 'out_time',
    label: '转出时间',
    slots: {
      default: (row: any) => {
        if (!row || !row.out_txid) return h('span', '-')
        return h('span', formatToDateTime(row.out_time))
      }
    }
  }
])

// 表格列配置
const columns: TableColumn[] = [
  {
    field: 'id',
    label: '订单号',
    minWidth: 180,
    showOverflowTooltip: false,
    formatter: (row) => row.id || '-'
  },
  {
    field: 'bot_name',
    label: '机器人名称',
    width: 150,
    showOverflowTooltip: false,
    slots: {
      default: ({ row }) => {
        return h(
          ElLink,
          {
            type: 'primary',
            onClick: () => navigateToBotList(row.bot_id)
          },
          () => row.bot_name || '-'
        )
      }
    }
  },
  {
    field: 'amount',
    label: '支付金额',
    width: 120,
    showOverflowTooltip: false,
    formatter: (row) => {
      if (!row.amount) return '-'
      const unit = row.in_coin || 'TRX'
      return `${row.amount} ${unit}`
    }
  },
  {
    field: 'out_amount',
    label: '兑换金额',
    width: 120,
    showOverflowTooltip: false,
    formatter: (row) => (row.out_amount ? `${row.out_amount} ${row.out_coin || ''}` : '-')
  },
  {
    field: 'actual_rate',
    label: '兑换汇率',
    width: 100,
    showOverflowTooltip: false,
    formatter: (row) => row.actual_rate || '-'
  },
  {
    field: 'order_type',
    label: '订单类型',
    width: 140,
    showOverflowTooltip: false,
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
    field: 'status',
    label: '订单状态',
    width: 100,
    showOverflowTooltip: false,
    slots: {
      default: ({ row }) => {
        const type = getStatusType(row.status)
        const text = getStatusText(row.status)
        return h(ElTag, { type }, () => text)
      }
    }
  },
  {
    field: 'describe',
    label: '备注',
    minWidth: 120,
    showOverflowTooltip: false,
    formatter: (row) => row.describe || '-'
  },
  {
    field: 'created_at',
    label: '创建时间',
    sortable: 'custom',
    width: 180,
    showOverflowTooltip: false,
    formatter: (row) => (row.created_at ? formatToDateTime(row.created_at) : '-')
  },
  {
    field: 'paid_at',
    label: '支付时间',
    sortable: 'custom',
    width: 180,
    showOverflowTooltip: false,
    formatter: (row) => (row.paid_at ? formatToDateTime(row.paid_at) : '-')
  }
]

const actionColumn: TableColumn = {
  field: 'action',
  label: '操作',
  width: 240,
  fixed: 'right',
  slots: {
    default: ({ row }) => {
      return (
        <div>
          <BaseButton type="primary" onClick={() => handleViewDetail(row)}>
            兑换详情
          </BaseButton>
          <BaseButton type="success" onClick={() => handleTransactionDetail(row)}>
            交易详情
          </BaseButton>
        </div>
      )
    }
  }
}

// 搜索表单配置
const searchSchema = [
  {
    field: 'order_id',
    component: 'Input' as const,
    label: '订单号',
    componentProps: {
      placeholder: '请输入订单号'
    }
  },
  {
    field: 'query',
    component: 'Input' as const,
    label: '关键字',
    componentProps: {
      placeholder: '请输入机器人名称'
    }
  },
  {
    field: 'status',
    component: 'Select' as const,
    label: '订单状态',
    componentProps: {
      options: [
        { label: '全部', value: '' },
        { label: '已支付', value: 2 },
        { label: '已完成', value: 5 },
        { label: '已失败', value: 6 },
        { label: '已中止', value: 9 }
      ],
      placeholder: '请选择订单状态'
    }
  }
]

// 获取订单状态显示类型
const getStatusType = (status: number): 'success' | 'warning' | 'info' | 'danger' | 'primary' => {
  const statusMap: Record<number, 'success' | 'warning' | 'info' | 'danger' | 'primary'> = {
    1: 'info', // 新订单
    5: 'success', // 已完成
    6: 'danger', // 已失败
    9: 'danger' // 已中止
  }
  return statusMap[status] || 'info'
}

// 获取订单状态文本
const getStatusText = (status: number): string => {
  const statusMap = {
    1: '新订单',
    5: '已完成',
    6: '已失败',
    9: '已中止'
  }
  return statusMap[status] || '-'
}

// 跳转到机器人列表
const navigateToBotList = (botId: string) => {
  router.push({
    path: '/bot_manage/bot_list',
    query: {
      tg_bot_id: botId
    }
  })
}

// API 封装
const fetchExchangeOrderList = async (params: any) => {
  try {
    // 保存当前搜索参数（用于导出）
    currentSearchParams.value = params

    // 映射参数字段
    const adaptedParams: any = {}

    if (params.order_id) adaptedParams.order_id = params.order_id
    if (params.source) adaptedParams.source = params.source
    if (params.status) adaptedParams.status = params.status
    if (params.query) adaptedParams.keyword = params.query // query → keyword

    // 分页参数
    adaptedParams.current_page = params.current_page || 1
    adaptedParams.page_size = params.page_size || 10

    // 处理排序参数 - 字段名映射
    if (params.order) {
      const fieldMapping: Record<string, string> = {
        create_time: 'created_at',
        pay_time: 'paid_at'
      }

      // 解析排序参数，格式：column ASC 或 column DESC
      const orderParts = params.order.split(' ')
      if (orderParts.length === 2) {
        const [field, direction] = orderParts
        const mappedField = fieldMapping[field] || field
        adaptedParams.order = `${mappedField} ${direction}`
      }
    }

    // 处理时间范围
    if (params.dateRange && params.dateRange.length === 2) {
      adaptedParams.start_time = new Date(params.dateRange[0]).toISOString()
      adaptedParams.end_time = new Date(params.dateRange[1]).toISOString()
    }

    // 使用新接口 v1GetExchangeOrderList
    const response = await v1GetExchangeOrderList(adaptedParams)

    // 简化映射：直接使用API字段，只做必要转换
    const list = (response.data?.list || []).map((item: any) => ({
      ...item, // 保留所有原始字段
      order_type: item.in_coin === 'USDT' ? 1 : 2, // 计算订单类型：USDT→TRX=1, TRX→USDT=2
      created_at: item.created_at * 1000, // 秒转毫秒
      paid_at: item.paid_at ? item.paid_at * 1000 : null // 秒转毫秒
    }))

    const total = response.data?.pager?.total || 0

    // 添加数据为空提示
    const hasSearchCondition = !!(
      params.order_id ||
      params.source ||
      params.status ||
      params.query ||
      params.dateRange
    )
    handleListMessage(list, hasSearchCondition, '兑换订单')

    return {
      list,
      total
    }
  } catch (error) {
    handleErrorMessage(error, '获取兑换订单列表失败')
    return { list: [], total: 0 }
  }
}

// 查看兑换详情
const handleViewDetail = async (row: any) => {
  try {
    const response = await v1GetExchangeOrderDetail(row.id)

    if (response && response.data) {
      // 直接使用API返回的数据，只添加必要的计算字段
      orderDetail.value = {
        ...response.data,
        order_type: response.data.exchange?.in_coin === 'USDT' ? 1 : 2,
        created_at: response.data.created_at * 1000,
        paid_at: response.data.paid_at ? response.data.paid_at * 1000 : null
      }
      dialogVisible.value = true
    } else {
      ElMessage.warning('数据格式错误')
    }
  } catch (error) {
    handleErrorMessage(error, '获取闪兑详情失败')
  }
}

// 查看交易详情
const handleTransactionDetail = async (row: any) => {
  try {
    const response = await v1GetExchangeOrderDetail(row.id)

    if (response.data) {
      const detail = response.data
      // 直接使用API返回的数据，只做时间转换
      transactionDetail.value = {
        order_id: detail.id,
        order_type: detail.exchange?.in_coin === 'USDT' ? 1 : 2,
        // 转入交易信息（直接使用pay_transaction）
        in_txid: detail.pay_transaction?.id || '',
        in_to_address: detail.pay_transaction?.to || '',
        in_from_address: detail.pay_transaction?.from || '',
        in_time: detail.pay_transaction?.time ? detail.pay_transaction.time * 1000 : 0,
        order_amount: detail.amount,
        // 转出交易信息（直接使用deliver_transaction）
        out_txid: detail.deliver_transaction?.id || '',
        out_to_address: detail.deliver_transaction?.to || '',
        out_from_address: detail.deliver_transaction?.from || '',
        out_time: detail.deliver_transaction?.time ? detail.deliver_transaction.time * 1000 : 0,
        user_get_amount: detail.deliver_transaction?.amount || '0'
      }

      console.log('transactionDetail.value', transactionDetail.value)

      // 设置默认活动标签页
      if (transactionDetail.value.in_txid && transactionDetail.value.out_txid) {
        activeTransactionTab.value = 'in'
      } else if (transactionDetail.value.in_txid) {
        activeTransactionTab.value = 'in'
      } else if (transactionDetail.value.out_txid) {
        activeTransactionTab.value = 'out'
      } else {
        ElMessage.info('暂无交易数据')
      }

      transactionDialogVisible.value = true
    } else {
      ElMessage.info('暂无交易数据')
      transactionDetail.value = { order_id: row.id }
      transactionDialogVisible.value = true
    }
  } catch (error) {
    handleErrorMessage(error, '获取交易详情失败')
  }
}

// 导出订单
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

    // 映射参数字段
    const adaptedParams: any = {}

    if (params?.order_id) adaptedParams.order_id = params.order_id
    if (params?.source) adaptedParams.source = params.source
    if (params?.status) adaptedParams.status = params.status
    if (params?.query) adaptedParams.keyword = params.query

    // 处理时间范围
    if (params?.dateRange && params.dateRange.length === 2) {
      adaptedParams.start_time = new Date(params.dateRange[0]).toISOString()
      adaptedParams.end_time = new Date(params.dateRange[1]).toISOString()
    }

    console.log('导出参数:', adaptedParams)

    // 使用获取列表的接口，传入搜索条件
    const res = await v1GetExchangeOrderList(adaptedParams)

    if (res.code === '000000' && res.data && res.data.list) {
      // 将数据转换为 Excel 格式，列名与列表显示一致
      const list = res.data.list.map((item: any) => ({
        订单号: item.id,
        机器人名称: item.bot_name,
        // 用户账号: item.user_account || '-',
        // 用户邮箱: item.user_email || '-',
        // 来源: item.source === 'h5' ? 'H5' : item.source === 'bot' ? '机器人' : item.source || '-',
        订单类型: item.in_coin === 'USDT' ? 'USDT → TRX' : 'TRX → USDT',
        支付金额: `${item.amount} ${item.in_coin}`,
        兑换金额: `${item.out_amount} ${item.out_coin}`,
        兑换汇率: item.actual_rate || '-',
        订单状态: getStatusText(item.status),
        备注: item.describe || '-',
        创建时间: item.created_at ? formatToDateTime(item.created_at * 1000) : '-',
        支付时间: item.paid_at ? formatToDateTime(item.paid_at * 1000) : '-',
        _timestamp: item.paid_at || item.created_at || 0 // 用于排序的时间戳
      }))

      // 按时间倒序排序（最新的在前）
      list.sort((a, b) => b._timestamp - a._timestamp)

      // 移除排序用的时间戳字段
      const exportList = list.map(({ _timestamp, ...rest }) => rest)

      // 导出为 Excel
      simpleExportToExcel(exportList, '兑换订单列表')
      handleSuccessMessage('订单导出成功')
    } else {
      ElMessage.error('导出失败：数据格式错误')
    }
  } catch (error) {
    handleErrorMessage(error, '订单导出失败')
  }
}

const onSearch = (params: any) => {
  // onSearch 事件会在用户点击搜索时触发，但参数已经在 fetchExchangeOrderList 中保存了
  console.log('搜索参数:', params)
}

onMounted(() => {
  // 从路由获取查询参数
  const route = useRouter().currentRoute.value
  const query = route.query
  setTimeout(() => {
    if (searchTableRef.value && query.order_num) {
      searchTableRef.value.setSearchParams({
        order_id: query.order_num
      })
      console.log('手动触发数据刷新')
      searchTableRef.value.reload()
    }
  }, 100)
})
</script>

<style scoped>
.transaction-tabs {
  margin-bottom: 20px;
}

.empty-transaction {
  display: flex;
  padding: 30px 0;
  justify-content: center;
}

/* 交易哈希长文本处理 */
:deep(.el-descriptions-item__content) {
  word-break: break-all;
}
</style>
