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
import { v2GetDepositList, v2GetDepositDetail } from '@/api/operation/recharge_order'
import type { V2DepositItem } from '@/api/operation/recharge_order_types'
import { ElLink } from 'element-plus'
import { useRouter, useRoute } from 'vue-router'
import { simpleExportToExcel } from '@/utils/excel'
import { handleListMessage, handleErrorMessage, handleSuccessMessage } from '@/utils/messageHelper'
import { getStatusText, getStatusType, ORDER_STATUS_OPTIONS } from '@/utils/orderStatus'
import { getSourceText, SOURCE_TYPE_OPTIONS } from '@/utils/sourceFilter'

const router = useRouter()
const searchTableRef = ref<InstanceType<typeof SearchTable> | null>(null)

// 保存当前搜索参数
const currentSearchParams = ref<any>({})

// 订单详情相关
const dialogVisible = ref(false)
const activeTab = ref('order')
const orderDetail = ref<any>({})
const rechargeDetail = ref<any>({})

// 订单详情schema - 使用后端字段名
const orderDetailSchema = computed(() => {
  const schema: DescriptionsSchema[] = [
    { field: 'id', label: '订单号' },
    {
      field: 'status',
      label: '订单状态',
      slots: {
        default: (row: any) => {
          if (!row) return h('span', '-')
          const tagType = getStatusType(row.status)
          return h(ElTag, { type: tagType as any, size: 'small' }, () => getStatusText(row.status))
        }
      }
    },
    {
      field: 'coin',
      label: '订单类型',
      slots: {
        default: (row: any) => {
          return (
            <>
              <span style={{ color: '#409EFF', cursor: 'pointer' }}>充值{row.coin || '-'}</span>
            </>
          )
        }
      }
    },
    { field: 'user_id', label: 'TG用户ID' },
    { field: 'tg_user_name', label: 'TG用户名' },
    { field: 'tg_first_name', label: 'TG用户昵称' },
    { field: 'bot_id', label: '机器人ID' },
    {
      field: 'bot_user_name',
      label: '机器人名称',
      slots: {
        default: (row: any) => {
          return h('span', row.bot_user_name || row.bot_first_name || '-')
        }
      }
    },
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
          return h('span', formatToDateTime(row.created_at))
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
          return h('span', formatToDateTime(row.paid_at))
        }
      }
    }
  ]
  return schema
})

// 充值详情schema - 使用后端字段名
const rechargeDetailSchema = computed(() => {
  const schema: DescriptionsSchema[] = [
    { field: 'to', label: '收款地址', span: 24 },
    { field: 'from', label: '支付地址', span: 24 },
    {
      field: 'id',
      label: '交易哈希',
      span: 24,
      slots: {
        default: (row: any) => {
          if (!row || !row.id) return h('span', '-')
          return (
            <ElLink
              href={`${import.meta.env.VITE_TRONSCAN_URL}/#/transaction/${row.id}`}
              type="primary"
              target="_blank"
            >
              {row.id}
            </ElLink>
          )
        }
      }
    }
  ]
  return schema
})

// 当前选择的来源
const selectedSource = ref<number | string>('')

// 表格列配置 - 使用后端字段名
const columns = computed(() => {
  const allCols: TableColumn[] = [
    {
      field: 'id',
      label: '订单号',
      minWidth: 180,
      formatter: (row) => row.id || '-'
    },
    {
      field: 'agent_name',
      label: '代理名称',
      minWidth: 120,
      formatter: (row) => row.agent_name || '-'
    },
    {
      field: 'tg_user_name',
      label: 'TG用户名',
      minWidth: 120,
      hideWhen: 2, // H5时隐藏
      slots: {
        default: ({ row }) => {
          if (!row.tg_user_name) return <span>-</span>
          return (
            <ElLink href={`https://t.me/${row.tg_user_name}`} type="primary" target="_blank">
              {row.tg_user_name}
            </ElLink>
          )
        }
      }
    },
    {
      field: 'tg_first_name',
      label: 'TG用户昵称',
      minWidth: 120,
      hideWhen: 2, // H5时隐藏
      formatter: (row) => row.tg_first_name || '-'
    },
    {
      field: 'username',
      label: '用户账号',
      minWidth: 120,
      hideWhen: 1, // 机器人时隐藏
      formatter: (row) => row.username || '-'
    },
    {
      field: 'email',
      label: '用户邮箱',
      minWidth: 150,
      hideWhen: 1, // 机器人时隐藏
      formatter: (row) => row.email || '-'
    },
    {
      field: 'bot_name',
      label: '机器人名称',
      minWidth: 150,
      slots: {
        default: ({ row }) => {
          return (
            <span
              style={{ color: '#409EFF', cursor: 'pointer' }}
              onClick={() => {
                router.push({
                  path: `/agent/bot_list`,
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
      field: 'origin',
      label: '来源',
      width: 100,
      formatter: (row) => getSourceText(row.origin, row.tg_user_name, row.username)
    },
    {
      field: 'coin',
      label: '订单类型',
      width: 120,
      formatter: (row) => (row.coin ? `充值${row.coin}` : '-')
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
      slots: {
        default: ({ row }) => {
          const type = getStatusType(row.status)
          const text = getStatusText(row.status)
          return h(ElTag, { type: type as any }, () => text)
        }
      }
    },
    {
      field: 'receive_address',
      label: '收款地址',
      minWidth: 200,
      showOverflowTooltip: true,
      formatter: (row) => row.receive_address || '-'
    },
    {
      field: 'pay_address',
      label: '支付地址',
      minWidth: 200,
      showOverflowTooltip: true,
      formatter: (row) => row.pay_address || '-'
    },
    {
      field: 'describe',
      label: '备注',
      minWidth: 150,
      showOverflowTooltip: true,
      formatter: (row) => row.describe || '-'
    },
    {
      field: 'created_at',
      label: '创建时间',
      sortable: 'custom',
      minWidth: 160,
      formatter: (row) => (row.created_at ? formatToDateTime(row.created_at) : '-')
    },
    {
      field: 'paid_at',
      label: '完成时间',
      sortable: 'custom',
      minWidth: 160,
      formatter: (row) => (row.paid_at ? formatToDateTime(row.paid_at) : '-')
    },
    {
      field: 'action',
      label: '操作',
      width: 120,
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

  console.log(
    '[运营端充值订单 columns] 过滤后的列数:',
    filteredCols.length,
    '来源:',
    selectedSource.value
  )

  return filteredCols
})

// 搜索表单配置 - 使用后端字段名和共享工具的选项
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
    field: 'status',
    component: 'Select' as const,
    label: '订单状态',
    componentProps: {
      options: ORDER_STATUS_OPTIONS,
      placeholder: '请选择订单状态'
    }
  },
  {
    field: 'keyword',
    component: 'Input' as const,
    label: {
      tips: 'TG用户名/TG用户昵称/机器人名称/代理名称/用户账号/用户邮箱',
      text: '关键词'
    },
    componentProps: {
      placeholder: '请输入关键词'
    }
  },
  {
    field: 'origin',
    component: 'Select' as const,
    label: '来源',
    componentProps: {
      options: SOURCE_TYPE_OPTIONS,
      placeholder: '请选择来源'
    }
  },
  {
    field: 'coin',
    component: 'Select' as const,
    label: '订单类型',
    componentProps: {
      options: [
        { label: '全部', value: '' },
        { label: '充值TRX', value: 'TRX' },
        { label: '充值USDT', value: 'USDT' }
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
  }
]

// API 封装 - 使用新接口 v2，直接使用后端字段名
const fetchRechargeOrderList = async (params: any) => {
  try {
    // 更新选中的来源，用于控制列的显示/隐藏
    selectedSource.value = params?.origin || ''
    console.log(
      '[fetchRechargeOrderList] selectedSource:',
      selectedSource.value,
      'params.origin:',
      params?.origin
    )

    // 保存当前搜索参数（用于导出）
    currentSearchParams.value = params

    console.log('=== 充值订单列表 - 请求参数 ===')
    console.log('原始参数:', JSON.stringify(params, null, 2))

    // 转换参数格式以适配新接口
    const adaptedParams: any = {
      current_page: params.current_page || 1,
      page_size: params.page_size || 10
    }

    // 关键字搜索
    if (params.keyword) {
      adaptedParams.keyword = params.keyword
    }

    // 订单号（保持字符串格式，不转换为数字）
    if (params.order_id) {
      adaptedParams.order_id = params.order_id
    }

    // 订单状态：保持原样，不做转换
    if (params.status) {
      adaptedParams.status = params.status
    }

    // 来源：直接传递数字值
    if (params.origin !== undefined && params.origin !== '') {
      adaptedParams.origin = Number(params.origin)
    }

    // 订单类型：使用 coin 字段
    if (params.coin) {
      adaptedParams.coin = params.coin
    }

    // 收款地址
    if (params.receive_address) {
      adaptedParams.receive_address = params.receive_address
    }

    // 支付地址
    if (params.pay_address) {
      adaptedParams.pay_address = params.pay_address
    }

    // 处理排序参数 - 使用后端字段名
    if (params.order) {
      // 字段名映射：前端 → 后端
      const fieldMap: Record<string, string> = {
        amount: 'amount', // 金额
        created_at: 'created_at', // 创建时间
        paid_at: 'paid_at' // 完成时间
      }

      // 解析排序参数，格式：'field_name ASC' 或 'field_name DESC'
      const [field, direction] = params.order.split(' ')
      const mappedField = fieldMap[field] || field
      adaptedParams.order = `${mappedField} ${direction}`
    }

    // 时间范围（新接口使用字符串格式）
    if (params.start_time) {
      adaptedParams.start_time = params.start_time.toString()
    }
    if (params.end_time) {
      adaptedParams.end_time = params.end_time.toString()
    }

    console.log('转换后参数:', JSON.stringify(adaptedParams, null, 2))

    const response = await v2GetDepositList(adaptedParams)
    const data = response.data || { list: [], pager: { total: 0 } }

    // 直接使用后端返回的数据，不进行字段映射
    const list = data.list || []

    // 添加数据为空提示
    const hasSearchCondition = !!(
      params.order_id ||
      params.status ||
      params.keyword ||
      params.origin ||
      params.coin ||
      params.receive_address ||
      params.pay_address
    )
    handleListMessage(list, hasSearchCondition, '充值订单')

    return {
      list: list,
      total: data.pager?.total || 0
    }
  } catch (error) {
    handleErrorMessage(error, '获取充值订单列表失败')
    return { list: [], total: 0 }
  }
}

// 查看订单详情 - 使用新接口 v2，直接使用后端字段名
const handleViewDetail = async (row: any) => {
  try {
    console.log('=== 充值订单详情 - 请求参数 ===')
    console.log('订单ID:', row.id)

    const response = await v2GetDepositDetail(row.id)
    console.log('=== 充值订单详情 - 响应数据 ===')
    console.log('response', JSON.stringify(response, null, 2))

    const detail = response.data

    // 直接使用后端返回的数据，不进行字段映射
    orderDetail.value = detail

    // 充值详情：使用 pay_transaction 数据
    if (detail.pay_transaction) {
      rechargeDetail.value = detail.pay_transaction
    } else {
      // 如果没有支付交易信息，使用空对象
      rechargeDetail.value = {
        to: detail.receive_address || '-',
        from: '-',
        id: detail.pay_id || '-'
      }
    }

    dialogVisible.value = true
    activeTab.value = 'order'
  } catch (error) {
    handleErrorMessage(error, '获取充值详情失败')
  }
}

// 导出订单 - 直接使用后端字段名
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

    // 转换参数格式以适配新接口
    const adaptedParams: any = {}

    // 关键字搜索
    if (params?.keyword) {
      adaptedParams.keyword = params.keyword
    }

    // 订单号
    if (params?.order_id) {
      adaptedParams.order_id = params.order_id
    }

    // 订单状态
    if (params?.status) {
      adaptedParams.status = params.status
    }

    // 来源：直接传递数字值
    if (params?.origin !== undefined && params?.origin !== '') {
      adaptedParams.origin = Number(params.origin)
    }

    // 订单类型：使用 coin 字段
    if (params?.coin) {
      adaptedParams.coin = params.coin
    }

    // 收款地址
    if (params?.receive_address) {
      adaptedParams.receive_address = params.receive_address
    }

    // 支付地址
    if (params?.pay_address) {
      adaptedParams.pay_address = params.pay_address
    }

    // 时间范围
    if (params?.start_time) {
      adaptedParams.start_time = params.start_time.toString()
    }
    if (params?.end_time) {
      adaptedParams.end_time = params.end_time.toString()
    }

    console.log('导出参数:', adaptedParams)

    // 使用获取列表的接口，传入搜索条件
    const res = await v2GetDepositList(adaptedParams)

    if (res.code === '000000' && res.data && res.data.list) {
      // 将数据转换为 Excel 格式，根据当前来源筛选决定导出哪些字段
      const list = res.data.list.map((item: any) => {
        // 基础字段（始终导出）
        const baseData: any = {
          订单号: item.id || '-',
          代理名称: item.agent_name || '-'
        }

        // 根据来源判断导出哪些字段
        // 如果没有筛选来源，或者来源为机器人(1)，导出TG相关字段
        if (!selectedSource.value || selectedSource.value === 1 || selectedSource.value === '1') {
          baseData['TG用户名'] = item.tg_user_name || '-'
          baseData['TG用户昵称'] = item.tg_first_name || '-'
        }

        // 如果没有筛选来源，或者来源为H5(2)，导出H5相关字段
        if (!selectedSource.value || selectedSource.value === 2 || selectedSource.value === '2') {
          baseData['用户账号'] = item.username || '-'
          baseData['用户邮箱'] = item.email || '-'
        }

        // 其他通用字段
        return {
          ...baseData,
          机器人名称: item.bot_name || '-',
          来源: getSourceText(item.origin, item.tg_user_name, item.username),
          订单类型: item.coin ? `充值${item.coin}` : '-',
          金额: item.amount ? `${item.amount} ${item.coin || ''}` : '-',
          订单状态: getStatusText(item.status),
          收款地址: item.receive_address || '-',
          支付地址: item.pay_address || '-',
          备注: item.describe || '-',
          创建时间: item.created_at ? formatToDateTime(item.created_at) : '-',
          完成时间: item.paid_at ? formatToDateTime(item.paid_at) : '-'
        }
      })

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
  // onSearch 事件会在用户点击搜索时触发，但参数已经在 fetchRechargeOrderList 中保存了
  console.log('搜索参数:', params)
}

onMounted(() => {
  const query = useRoute().query
  setTimeout(() => {
    if (searchTableRef.value) {
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
.app-container {
  padding: 20px;
}
</style>
