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

// 导出
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
    if (params?.query) {
      apiParams.keyword = params.query
    }

    // 处理来源
    if (params?.source) {
      apiParams.source = params.source
    }

    // 处理交易类型查询
    if (params?.coin) {
      apiParams.keyword = params.coin
    }

    // 处理状态
    if (params?.status) {
      apiParams.status = params.status
    }

    console.log('导出参数:', apiParams)

    // 使用获取列表的接口，传入搜索条件
    const res = await v2GetExchangeList(apiParams)

    if (res.code === '000000' && res.data && res.data.list) {
      // 将数据转换为导出格式，字段顺序与表格列一致
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

        return {
          日期: item.paid_at ? formatToDate(item.paid_at * 1000) : '-',
          订单ID: item.id,
          代理名称: item.agent_name || '-',
          // 用户账号: item.account || '-',
          // 用户邮箱: item.email || '-',
          // 来源: item.source || '-',
          支付金额: `${item.amount} ${item.in_coin}`,
          兑换汇率: item.actual_rate || '-',
          实时汇率: item.real_rate || '-',
          支出金额: `${item.out_amount} ${item.out_coin}`,
          交易类型: item.in_coin === 'USDT' ? 'USDT → TRX' : 'TRX → USDT',
          平台利润: item.plate_profit ? `${item.plate_profit}TRX` : '-',
          代理扣款: item.amount ? `${item.amount}TRX` : '-',
          交易状态: statusText,
          完成时间: item.paid_at ? formatToDateTime(item.paid_at * 1000) : '-',
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

// 表格列配置 (根据截图更新)
const columns = reactive<TableColumn[]>([
  {
    field: 'finish_time',
    label: '日期',
    minWidth: 120,
    formatter: (row) => (row.finish_time ? formatToDate(row.finish_time * 1000) : '-')
  },
  {
    field: 'order_id',
    label: '订单ID',
    minWidth: 180,
    formatter: (row) => row.order_id || '-'
  },
  {
    field: 'username',
    label: '代理名称',
    minWidth: 150,
    formatter: (row) => row.username || '-'
  },
  // {
  //   field: 'account',
  //   label: '用户账号',
  //   minWidth: 120,
  //   formatter: (row) => row.account || '-'
  // },
  // {
  //   field: 'email',
  //   label: '用户邮箱',
  //   minWidth: 150,
  //   formatter: (row) => row.email || '-'
  // },
  // {
  //   field: 'source',
  //   label: '来源',
  //   width: 100,
  //   formatter: (row) => row.source || '-'
  // },
  {
    field: 'order_amount',
    label: '支付金额',
    minWidth: 120,
    formatter: (row) => {
      const amount = row.order_amount || ''
      const unit = row.pay_unit || ''
      return amount || unit ? `${amount}${unit}`.trim() : '-'
    }
  },
  {
    field: 'trx_price',
    label: '兑换汇率',
    minWidth: 120,
    formatter: (row) => row.trx_price || '-'
  },
  {
    field: 'real_price',
    label: '实时汇率',
    minWidth: 100,
    formatter: (row) => row.real_price || '-'
  },
  {
    field: 'exchange_amount',
    label: '支出数量',
    minWidth: 150,
    formatter: (row) => {
      const amount = row.exchange_amount || ''
      const unit = row.exchange_unit || ''
      return amount || unit ? `${amount}${unit}`.trim() : '-'
    }
  },
  {
    field: 'order_type',
    label: '交易类型',
    minWidth: 140,
    slots: {
      default: ({ row }: { row: ExchangeOrderListItem }) => {
        const orderTypeMap: Record<number, { label: string; color: string }> = {
          1: { label: 'USDT  → TRX', color: '#67C23A' },
          2: { label: 'TRX  → USDT', color: '#409EFF' }
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
    formatter: (row) => (row.plate_profit ? `${row.plate_profit}TRX`.trim() : '-')
  },
  {
    field: 'agent_out_amount',
    label: '代理扣款',
    minWidth: 150,
    formatter: (row) => {
      if (!row.agent_out_amount) return '-'
      // 去掉负号，因为"代理扣款"本身就表示支出
      const amount = Math.abs(Number(row.agent_out_amount))
      return `${amount}TRX`
    }
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
          case 5:
            type = 'success'
            label = '已完成'
            break
          case 6:
            type = 'danger'
            label = '失败订单'
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
            label = '支付中'
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
            label = '已过期'
            break
        }
        return <ElTag type={type}>{label}</ElTag>
      }
    }
  },
  {
    field: 'finish_time',
    label: '完成时间',
    sortable: 'custom',
    minWidth: 160,
    formatter: (row) => (row.finish_time ? formatToDateTime(row.finish_time * 1000) : '-')
  },
  {
    field: 'describe',
    label: '描述',
    width: 160,
    formatter: (row) => row.describe || '-'
  }
])

// 搜索表单配置 (根据截图更新)
const searchSchema = reactive<FormSchema[]>([
  {
    field: 'query',
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
  // {
  //   field: 'source',
  //   component: 'Select',
  //   label: '来源',
  //   componentProps: {
  //     placeholder: '请选择来源',
  //     clearable: true,
  //     options: [
  //       { label: '全部', value: '' },
  //       { label: 'H5', value: 'H5' },
  //       { label: '机器人', value: '机器人' }
  //     ]
  //   }
  // },
  {
    field: 'coin',
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
      placeholder: '全部', // 匹配截图 placeholder
      options: [
        { label: '全部', value: '' },
        { label: '已完成', value: 5 },
        { label: '失败订单', value: 6 },
        { label: '已取消', value: 8 }
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

// 请求闪兑明细列表数据
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
    if (params.query) {
      apiParams.keyword = params.query
    }

    // 处理来源
    if (params.source) {
      apiParams.source = params.source
    }

    // 处理交易类型查询
    if (params.coin) {
      apiParams.keyword = params.coin
    }

    // 处理状态
    if (params.status) {
      apiParams.status = params.status
    }

    // 处理排序参数 - 字段名映射
    if (params.order) {
      const fieldMapping: Record<string, string> = {
        finish_time: 'paid_at'
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

      // 字段映射转换
      const mappedList = list.map((item: V2ExchangeItem) => {
        // 判断订单类型：kind=3 表示兑换
        // 根据 in_coin 和 out_coin 判断兑换方向
        let orderType = 1 // 默认 USDT → TRX
        if (item.in_coin === 'TRX' && item.out_coin === 'USDT') {
          orderType = 2 // TRX → USDT
        } else if (item.in_coin === 'USDT' && item.out_coin === 'TRX') {
          orderType = 1 // USDT → TRX
        }

        return {
          id: item.id, // 订单ID（保持字符串类型）
          order_id: item.id, // 订单号
          username: item.agent_name || '', // 代理名称
          account: item.account || '-', // 用户账号
          email: item.email || '-', // 用户邮箱
          source: item.source || '-', // 来源
          order_amount: String(item.amount), // 支付金额
          trx_price: String(item.actual_rate || 0), // 对话汇率（实际成交汇率）
          real_price: String(item.real_rate || 0), // 实时汇率
          user_id: item.user_id,
          order_type: orderType, // 订单类型：1-USDT→TRX, 2-TRX→USDT
          pay_unit: item.in_coin || item.coin, // 支付单位（输入币种）
          exchange_amount: String(item.out_amount || 0), // 支出数量（使用out_amount字段）
          agent_out_amount: String(item.agent_cost || 0), // 代理扣款（使用agent_cost字段）
          plate_profit: String(item.plate_profit || 0), // 平台利润
          agent_profit: String(item.agent_profit || 0), // 代理利润
          exchange_unit: item.out_coin || (item.coin === 'TRX' ? 'USDT' : 'TRX'), // 兑换单位（输出币种）
          receive_address: item.receive_address, // 接收地址
          status: item.status, // 状态
          create_time: item.created_at, // 创建时间（Unix时间戳-秒）
          finish_time: item.paid_at || item.completed_at || 0, // 完成时间（Unix时间戳-秒）
          describe: item.describe || '', // 描述
          in_txid: item.pay_id || '', // 支付交易hash
          out_txid: '' // 新接口没有返回
        }
      })

      totalCount.value = total

      console.log('[fetchExchangeTransactionList] 返回数据:', { total, count: mappedList.length })

      // 添加数据为空提示
      const hasSearchCondition = !!(
        params.query ||
        params.source ||
        params.coin ||
        params.status ||
        params.dateRange
      )
      handleListMessage(mappedList, hasSearchCondition, '闪兑订单')

      return {
        list: mappedList,
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
