<template>
  <div class="app-container">
    <ContentWrap>
      <SearchTable
        :columns="columns"
        :search-schema="searchSchema"
        :fetch-data-api="fetchRechargeOrderList"
        :showAddButton="false"
        ref="searchTableRef"
        @search="onSearch"
      >
        <!-- 添加导出按钮 -->
        <template #searchButtons>
          <BaseButton type="primary" @click="handleExport">
            <Icon icon="ep:download" class="mr-5px" />
            导出订单
          </BaseButton>
        </template>
      </SearchTable>

      <!-- 详情弹窗 -->
      <Dialog v-model="dialogVisible" :title="'订单详情'">
        <ElTabs v-model="activeTab">
          <ElTabPane label="订单详情" name="order">
            <Descriptions :schema="orderDetailSchema" :data="orderDetail" :column="2" border />
          </ElTabPane>
          <ElTabPane label="充值详情" name="recharge">
            <Descriptions
              :schema="rechargeDetailSchema"
              :data="rechargeDetail"
              :column="2"
              border
            />
          </ElTabPane>
        </ElTabs>
        <template #footer>
          <div class="flex justify-end">
            <ElButton @click="dialogVisible = false">关闭</ElButton>
          </div>
        </template>
      </Dialog>
    </ContentWrap>
  </div>
</template>

<script setup lang="tsx">
import { ref, onMounted, h, computed } from 'vue'
import { formatToDateTime } from '@/utils/dateUtil'
import { ElButton, ElTag, ElMessage, ElTabs, ElTabPane } from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import { Dialog } from '@/components/Dialog'
import { SearchTable } from '@/components/SearchTable'
import { BaseButton } from '@/components/Button'
import { Icon } from '@/components/Icon'
import { Descriptions } from '@/components/Descriptions'
import type { TableColumn } from '@/components/Table'
import type { DescriptionsSchema } from '@/components/Descriptions'
import { v1GetDepositList, v1GetDepositDetail } from '@/api/recharge_order'
import { ElLink } from 'element-plus'
import { useRouter, useRoute } from 'vue-router'
import { simpleExportToExcel } from '@/utils/excel'
import { handleListMessage, handleErrorMessage, handleSuccessMessage } from '@/utils/messageHelper'

const router = useRouter()
const searchTableRef = ref<InstanceType<typeof SearchTable> | null>(null)

// 当前选择的来源
const selectedSource = ref<number | string>('')

// 订单详情相关
const dialogVisible = ref(false)
const activeTab = ref('order')
const orderDetail = ref<any>({})
const rechargeDetail = ref<any>({})

// 订单详情schema
const orderDetailSchema = computed(() => {
  const schema: DescriptionsSchema[] = [
    { field: 'id', label: '订单号' },
    {
      field: 'status',
      label: '订单状态',
      slots: {
        default: (row: any) => {
          if (!row) return h('span', '-')
          return h(ElTag, { type: getStatusType(row.status), size: 'small' }, () => row.statusText)
        }
      }
    },
    {
      field: 'order_type',
      label: '订单类型',
      slots: {
        default: (row: any) => {
          return (
            <>
              <span style={{ color: '#409EFF', cursor: 'pointer' }}>
                充值{row.order_type == 1 ? 'TRX' : 'USDT'}
              </span>
            </>
          )
        }
      }
    },
    { field: 'user_id', label: 'TG用户ID' },
    { field: 'tg_user_name', label: 'TG用户名' },
    { field: 'tg_first_name', label: 'TG用户昵称' },
    {
      field: 'username',
      label: '用户账号',
      slots: {
        default: (row: any) => {
          if (!row || !row.username) return h('span', '-')
          return h('span', row.username)
        }
      }
    },
    {
      field: 'email',
      label: '用户邮箱',
      slots: {
        default: (row: any) => {
          if (!row || !row.email) return h('span', '-')
          return h('span', row.email)
        }
      }
    },
    {
      field: 'origin',
      label: '来源',
      slots: {
        default: (row: any) => {
          if (!row || row.origin === undefined) return h('span', '-')
          return h('span', row.origin === 1 ? '机器人' : row.origin === 2 ? 'H5' : '-')
        }
      }
    },
    { field: 'bot_id', label: '机器人ID' },
    { field: 'bot_name', label: '机器人名称' },
    {
      field: 'amount',
      label: '金额',
      slots: {
        default: (row: any) => {
          if (!row || !row.amount) return h('span', '-')
          return h('span', `${row.amount} ${row.coin || ''}`)
        }
      }
    },
    { field: 'describe', label: '备注' },
    {
      field: 'created_at',
      label: '创建时间',
      span: 24,
      slots: {
        default: (row: any) => {
          if (!row || !row.created_at) return h('span', '-')
          return h('span', formatToDateTime(row.created_at * 1000))
        }
      }
    },
    {
      field: 'paid_at',
      label: '支付时间',
      span: 24,
      slots: {
        default: (row: any) => {
          if (!row || !row.paid_at) return h('span', '-')
          return h('span', formatToDateTime(row.paid_at * 1000))
        }
      }
    },
    {
      field: 'paid_at',
      label: '完成时间',
      span: 24,
      slots: {
        default: (row: any) => {
          if (!row || !row.paid_at) return h('span', '-')
          return h('span', formatToDateTime(row.paid_at * 1000))
        }
      }
    }
  ]
  return schema
})

// 充值详情schema
const rechargeDetailSchema = computed(() => {
  const schema: DescriptionsSchema[] = [
    { field: 'receive_address', label: '收款地址', span: 24 },
    {
      field: 'pay_from',
      label: '支付地址',
      span: 24,
      slots: {
        default: (row: any) => {
          if (!row || !row.pay_from) return h('span', '-')
          return h('span', row.pay_from)
        }
      }
    },
    {
      field: 'pay_to',
      label: '接收地址',
      span: 24,
      slots: {
        default: (row: any) => {
          if (!row || !row.pay_to) return h('span', '-')
          return h('span', row.pay_to)
        }
      }
    },
    {
      field: 'pay_id',
      label: '交易哈希',
      span: 24,
      slots: {
        default: (row: any) => {
          if (!row || !row.pay_id) return h('span', '-')
          return (
            <ElLink
              href={`${import.meta.env.VITE_TRONSCAN_URL}/#/transaction/${row.pay_id}`}
              type="primary"
              target="_blank"
            >
              {row.pay_id}
            </ElLink>
          )
        }
      }
    }
  ]
  return schema
})

// 表格列配置 - 使用 computed 实现动态显示/隐藏
const columns = computed<TableColumn[]>(() => {
  const allCols: any[] = [
    {
      field: 'id',
      label: '订单号',
      minWidth: 180,
      showOverflowTooltip: false,
      formatter: (row) => row.id || '-'
    },
    {
      field: 'tg_user_name',
      label: 'TG用户名',
      hideWhen: 2, // 来源为 H5 时隐藏
      slots: {
        default: ({ row }) => {
          return (
            <span
              style={{ color: '#409EFF', cursor: 'pointer' }}
              onClick={() => {
                router.push({
                  path: `/user_group/user_list`,
                  query: { tg_id: row.user_id }
                })
              }}
            >
              {row.tg_user_name || '-'}
            </span>
          )
        }
      }
    },
    {
      field: 'tg_first_name',
      label: 'TG用户昵称',
      hideWhen: 2, // 来源为 H5 时隐藏
      formatter: (row) => row.tg_first_name || '-'
    },
    {
      field: 'username',
      label: '用户账号',
      hideWhen: 1, // 来源为机器人时隐藏
      formatter: (row) => row.username || '-'
    },
    {
      field: 'email',
      label: '用户邮箱',
      minWidth: 150,
      hideWhen: 1, // 来源为机器人时隐藏
      formatter: (row) => row.email || '-'
    },
    {
      field: 'origin',
      label: '来源',
      width: 100,
      formatter: (row) => {
        // 根据 origin 数字值判断来源
        return row.origin === 1 ? '机器人' : row.origin === 2 ? 'H5' : '-'
      }
    },
    {
      field: 'bot_name',
      label: '机器人名称',
      slots: {
        default: ({ row }) => {
          return (
            <span
              style={{ color: '#409EFF', cursor: 'pointer' }}
              onClick={() => {
                router.push({
                  path: `/bot_manage/bot_list`,
                  query: { tg_bot_id: row.bot_id }
                })
              }}
            >
              {row.bot_name || '-'}
            </span>
          )
        }
      }
    },
    {
      field: 'order_type',
      label: '订单类型',
      formatter: (row) => (row.order_type == 1 ? '充值TRX' : '充值USDT')
    },
    {
      field: 'amount',
      label: '金额',
      sortable: 'custom',
      minWidth: 120,
      formatter: (row) => (row.amount ? `${row.amount} ${row.coin || 'TRX'}` : '-')
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
      field: 'receive_address',
      label: '收款地址',
      minWidth: 150,
      formatter: (row) => row.receive_address || '-'
    },
    {
      field: 'pay_address',
      label: '支付地址',
      minWidth: 150,
      formatter: (row) => row.pay_address || '-'
    },
    {
      field: 'describe',
      label: '备注',
      formatter: (row) => row.describe || '-'
    },
    {
      field: 'created_at',
      label: '创建时间',
      sortable: 'custom',
      minWidth: 160,
      showOverflowTooltip: false,
      formatter: (row) => (row.created_at ? formatToDateTime(row.created_at * 1000) : '-')
    },
    {
      field: 'paid_at',
      label: '完成时间',
      sortable: 'custom',
      minWidth: 160,
      showOverflowTooltip: false,
      formatter: (row) => (row.paid_at ? formatToDateTime(row.paid_at * 1000) : '-')
    },
    {
      field: 'action',
      label: '操作',
      minWidth: 120,
      fixed: 'right',
      slots: {
        default: ({ row }) => {
          return (
            <BaseButton type="primary" onClick={() => handleViewDetail(row)}>
              充值详情
            </BaseButton>
          )
        }
      }
    }
  ]

  // 根据来源过滤列
  const filteredCols = allCols.filter((col) => {
    if (!col.hideWhen) return true
    return selectedSource.value !== col.hideWhen
  })

  console.log('[columns] 过滤后的列数:', filteredCols.length, '来源:', selectedSource.value)

  return filteredCols
})

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
    field: 'source',
    component: 'Select' as const,
    label: '来源',
    componentProps: {
      options: [
        { label: '全部', value: '' },
        { label: 'H5', value: 2 },
        { label: '机器人', value: 1 }
      ],
      placeholder: '请选择来源'
    }
  },
  {
    field: 'status',
    component: 'Select' as const,
    label: '订单状态',
    componentProps: {
      options: [
        { label: '全部', value: '' },
        { label: '新订单', value: 1 },
        { label: '已支付', value: 2 },
        { label: '已发送', value: 3 },
        { label: '已回收', value: 4 },
        { label: '已完成', value: 5 },
        { label: '已失败', value: 6 },
        { label: '已退款', value: 7 },
        { label: '已取消', value: 8 },
        { label: '已中止', value: 9 }
      ],
      placeholder: '请选择订单状态'
    }
  },
  {
    field: 'query',
    component: 'Input' as const,
    label: {
      text: '关键词',
      tips: '支持TG用户名/TG用户昵称/机器人名称/用户账号/用户邮箱查询'
    },
    componentProps: {
      placeholder: '请输入关键字搜索'
    }
  },
  {
    field: 'order_type',
    component: 'Select' as const,
    label: '订单类型',
    componentProps: {
      options: [
        { label: '全部', value: '' },
        { label: '充值TRX', value: 1 },
        { label: '充值USDT', value: 2 }
      ],
      placeholder: '请选择订单类型'
    }
  },
  {
    field: 'receive_address',
    component: 'Input' as const,
    label: '收款地址',
    componentProps: {
      placeholder: '请输入收款地址'
    }
  },
  {
    field: 'pay_address',
    component: 'Input' as const,
    label: '支付地址',
    componentProps: {
      placeholder: '请输入支付地址'
    }
  },
  {
    field: 'dateRange',
    component: 'DatePicker' as const,
    label: '创建时间',
    componentProps: {
      type: 'datetimerange',
      valueFormat: 'x',
      startPlaceholder: '开始日期',
      endPlaceholder: '结束日期'
    }
  }
]

// 获取订单状态显示类型
const getStatusType = (status: number): 'success' | 'warning' | 'info' | 'danger' | 'primary' => {
  const statusMap: Record<number, 'success' | 'warning' | 'info' | 'danger' | 'primary'> = {
    1: 'info', // 新订单
    2: 'primary', // 已支付
    3: 'warning', // 已发送
    4: 'warning', // 已回收
    5: 'success', // 已完成
    6: 'danger', // 已失败
    7: 'warning', // 已退款
    8: 'info', // 已取消
    9: 'danger' // 已中止
  }
  return statusMap[status] || 'info'
}

// 获取订单状态文本
const getStatusText = (status: number): string => {
  const statusMap = {
    1: '新订单',
    2: '已支付',
    3: '已发送',
    4: '已回收',
    5: '已完成',
    6: '已失败',
    7: '已退款',
    8: '已取消',
    9: '已中止'
  }
  return statusMap[status] || '-'
}

// API 封装
const fetchRechargeOrderList = async (params: any) => {
  try {
    // 更新选中的来源，用于控制列的显示/隐藏
    selectedSource.value = params.source || ''
    console.log(
      '[fetchRechargeOrderList] selectedSource:',
      selectedSource.value,
      'params.source:',
      params.source
    )

    // 处理排序参数
    const adaptedParams: any = {}

    // 映射参数字段
    if (params.order_id) adaptedParams.order_id = params.order_id
    if (params.source !== undefined && params.source !== '') {
      adaptedParams.origin = Number(params.source) // source → origin (数字类型)
    }
    if (params.status) adaptedParams.status = params.status
    if (params.query) adaptedParams.keyword = params.query // query → keyword
    if (params.order_type) {
      // order_type → coin (1=TRX, 2=USDT)
      adaptedParams.coin = params.order_type == 1 ? 'TRX' : 'USDT'
    }
    if (params.receive_address) adaptedParams.receive_address = params.receive_address
    if (params.pay_address) adaptedParams.pay_address = params.pay_address

    // 分页参数 - 使用后端格式
    if (params.current_page) adaptedParams.current_page = params.current_page
    if (params.page_size) adaptedParams.page_size = params.page_size

    // 处理排序参数 - 字段名映射
    if (params.order) {
      // 字段名映射：前端 → 后端（已使用API原始字段，无需映射）
      const fieldMap: Record<string, string> = {}

      // 解析排序参数，格式：'field_name ASC' 或 'field_name DESC'
      const [field, direction] = params.order.split(' ')
      const mappedField = fieldMap[field] || field
      adaptedParams.order = `${mappedField} ${direction}`
    }

    // 处理时间范围（转换为秒数）
    if (params.dateRange && params.dateRange.length === 2) {
      adaptedParams.start_time = Math.floor(params.dateRange[0] / 1000).toString()
      adaptedParams.end_time = Math.floor(params.dateRange[1] / 1000).toString()
    }

    const response = await v1GetDepositList(adaptedParams)

    // 直接使用API原始字段，只做必要的补充
    const list = (response.data?.list || []).map((item: any) => ({
      ...item, // 保留所有原始字段
      // 补充计算字段
      order_type: item.coin === 'TRX' ? 1 : 2 // 根据币种计算订单类型
    }))

    // 添加数据为空提示
    const hasSearchCondition = !!(
      params.order_id ||
      params.source ||
      params.status ||
      params.query ||
      params.order_type ||
      params.receive_address ||
      params.pay_address ||
      params.dateRange
    )
    handleListMessage(list, hasSearchCondition, '充值订单')

    return {
      list,
      total: response.data?.pager?.total || 0
    }
  } catch (error) {
    handleErrorMessage(error, '获取充值订单列表失败')
    return { list: [], total: 0 }
  }
}

const handleViewDetail = async (row: any) => {
  try {
    const response = await v1GetDepositDetail(row.id)
    console.log('response', response)

    const detail = response.data || {}

    // 使用API原始字段，只补充必要的计算字段
    orderDetail.value = {
      ...detail, // 保留所有原始字段
      order_type: detail.coin === 'TRX' ? 1 : 2, // 计算订单类型
      statusText: getStatusText(detail.status),
      // 补充列表中的字段（如果详情接口没有返回）
      tg_user_name: detail.tg_user_name || row.tg_user_name || '',
      tg_first_name: detail.tg_first_name || row.tg_first_name || '-',
      bot_name: detail.bot_name || row.bot_name || ''
    }

    // 充值详情：从 pay_transaction 对象中提取地址信息
    rechargeDetail.value = {
      ...detail,
      pay_from: detail.pay_transaction?.from || '-', // 支付地址（发送方）
      pay_to: detail.pay_transaction?.to || '-' // 接收地址（接收方）
    }

    console.log('orderDetail.value:', orderDetail.value)
    console.log('rechargeDetail.value:', rechargeDetail.value)

    dialogVisible.value = true
    activeTab.value = 'order'
  } catch (error) {
    handleErrorMessage(error, '获取充值详情失败')
  }
}

// 导出订单
const handleExport = async () => {
  try {
    // 获取当前搜索条件
    const params = await searchTableRef.value?.searchMethods.getFormData()

    // 构建查询参数（复用 fetchRechargeOrderList 的逻辑）
    const adaptedParams: any = {}
    if (params?.order_id) adaptedParams.order_id = params.order_id
    if (params?.source !== undefined && params?.source !== '') {
      adaptedParams.origin = Number(params.source) // source → origin (数字类型)
    }
    if (params?.status) adaptedParams.status = params.status
    if (params?.query) adaptedParams.keyword = params.query
    if (params?.order_type) {
      adaptedParams.coin = params.order_type == 1 ? 'TRX' : 'USDT'
    }
    if (params?.receive_address) adaptedParams.receive_address = params.receive_address
    if (params?.pay_address) adaptedParams.pay_address = params.pay_address
    if (params?.dateRange && params.dateRange.length === 2) {
      adaptedParams.start_time = Math.floor(params.dateRange[0] / 1000).toString()
      adaptedParams.end_time = Math.floor(params.dateRange[1] / 1000).toString()
    }

    // 使用获取列表的接口，传入搜索条件
    const res = await v1GetDepositList(adaptedParams)

    if (res.code === '000000' && res.data && res.data.list) {
      // 将数据转换为 Excel 格式，列名与列表显示一致
      const list = res.data.list.map((item: any) => ({
        订单号: item.id || '-',
        TG用户名: item.tg_user_name || '-',
        TG用户昵称: item.tg_first_name || '-',
        用户账号: item.username || '-',
        用户邮箱: item.email || '-',
        来源: item.origin === 1 ? '机器人' : item.origin === 2 ? 'H5' : '-',
        机器人名称: item.bot_name || '-',
        订单类型: item.coin === 'TRX' ? '充值TRX' : '充值USDT',
        金额: `${item.amount} ${item.coin}`,
        订单状态: getStatusText(item.status),
        收款地址: item.receive_address || '-',
        支付地址: item.pay_address || '-',
        备注: item.describe || '-',
        创建时间: item.created_at ? formatToDateTime(item.created_at * 1000) : '-',
        完成时间: item.paid_at ? formatToDateTime(item.paid_at * 1000) : '-'
      }))

      // 导出为 Excel
      simpleExportToExcel(list, '充值订单列表')
      handleSuccessMessage('订单导出成功')
    } else {
      ElMessage.error('导出失败：数据格式错误')
    }
  } catch (error) {
    handleErrorMessage(error, '订单导出失败')
  }
}

const onSearch = (params: any) => {
  console.log('搜索参数:', params)
  // 更新选中的来源，用于控制列的显示/隐藏
  selectedSource.value = params.source || ''
}

onMounted(() => {
  const query = useRoute().query
  // 只有当有 order_num 参数时才设置搜索参数并刷新
  if (query.order_num) {
    setTimeout(() => {
      if (searchTableRef.value) {
        searchTableRef.value.setSearchParams({
          order_id: query.order_num
        })
        console.log('手动触发数据刷新')
        searchTableRef.value.reload()
      }
    }, 100)
  }
})
</script>

<style scoped></style>
