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
import { v1GetDepositList, v1GetDepositDetail, exportRechargeOrderApi } from '@/api/recharge_order'
import { ElLink } from 'element-plus'
import { useRouter, useRoute } from 'vue-router'
import { downloadByData } from '@/utils/download'
import { handleListMessage, handleErrorMessage } from '@/utils/messageHelper'

const router = useRouter()
const searchTableRef = ref<InstanceType<typeof SearchTable> | null>(null)

// 订单详情相关
const dialogVisible = ref(false)
const activeTab = ref('order')
const orderDetail = ref<any>({})
const rechargeDetail = ref<any>({})

// 订单详情schema
const orderDetailSchema = computed(() => {
  const schema: DescriptionsSchema[] = [
    { field: 'order_num', label: '订单号' },
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
    { field: 'tg_id', label: 'TG用户ID' },
    { field: 'tg_name', label: 'TG用户名' },
    { field: 'tg_nickname', label: 'TG用户昵称' },
    { field: 'bot_id', label: '机器人ID' },
    { field: 'bot_name', label: '机器人名称' },
    {
      field: 'in_mount',
      label: '充值金额',
      slots: {
        default: (row: any) => {
          if (!row || !row.in_mount) return h('span', '-')
          return h('span', `${row.in_mount} ${row.in_unit || ''}`)
        }
      }
    },
    {
      field: 'pay_mount',
      label: '支付金额',
      slots: {
        default: (row: any) => {
          // 如果没有支付地址，说明用户还没支付，不显示支付金额
          if (!row || !row.pay_address) return h('span', '-')
          // 如果有支付地址，显示充值金额
          if (!row.in_mount) return h('span', '-')
          return h('span', `${row.in_mount} ${row.in_unit || ''}`)
        }
      }
    },
    { field: 'describe', label: '备注', span: 24 },
    {
      field: 'create_time',
      label: '创建时间',
      span: 24,
      slots: {
        default: (row: any) => {
          if (!row || !row.create_time) return h('span', '-')
          return h('span', formatToDateTime(row.create_time))
        }
      }
    },
    {
      field: 'pay_time',
      label: '支付时间',
      span: 24,
      slots: {
        default: (row: any) => {
          if (!row || !row.pay_time) return h('span', '-')
          return h('span', formatToDateTime(row.pay_time))
        }
      }
    },
    {
      field: 'finish_time',
      label: '完成时间',
      span: 24,
      slots: {
        default: (row: any) => {
          if (!row || !row.finish_time) return h('span', '-')
          return h('span', formatToDateTime(row.finish_time))
        }
      }
    }
  ]
  return schema
})

// 充值详情schema
const rechargeDetailSchema = computed(() => {
  const schema: DescriptionsSchema[] = [
    { field: 'to_address', label: '收款地址', span: 24 },
    { field: 'owner_address', label: '支付地址', span: 24 },
    {
      field: 'hash',
      label: '交易哈希',
      span: 24,
      slots: {
        default: (row: any) => {
          if (!row || !row.hash) return h('span', '-')
          return (
            <ElLink
              href={`${import.meta.env.VITE_TRONSCAN_URL}/#/transaction/${row.hash}`}
              type="primary"
              target="_blank"
            >
              {row.hash}
            </ElLink>
          )
        }
      }
    }
  ]
  return schema
})

// 表格列配置
const columns: TableColumn[] = [
  {
    field: 'order_id',
    label: '订单号',
    minWidth: 180,
    showOverflowTooltip: false
  },
  {
    field: 'tg_name',
    label: 'TG用户名',
    slots: {
      default: ({ row }) => {
        return (
          <span
            style={{ color: '#409EFF', cursor: 'pointer' }}
            onClick={() => {
              router.push({
                path: `/user_group/user_list`,
                query: { tg_id: row.tg_id }
              })
            }}
          >
            {row.tg_name || '-'}
          </span>
        )
      }
    }
  },
  {
    field: 'tg_nickname',
    label: 'TG用户昵称'
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
                query: { name: row.bot_name }
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
    field: 'in_mount',
    label: '充值金额',
    sortable: 'custom',
    minWidth: 120,
    formatter: (row) => (row.in_mount ? `${row.in_mount} ${row.in_unit || 'TRX'}` : '-')
  },
  {
    field: 'pay_mount',
    label: '支付金额',
    formatter: (row) => {
      // 如果pay_address为空，说明用户还没支付，不显示支付金额
      if (!row.pay_address) return '-'
      // 如果pay_address有值，显示充值金额
      return row.in_mount ? `${row.in_mount} ${row.in_unit || 'TRX'}` : '-'
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
    field: 'receive_address',
    label: '收款地址',
    minWidth: 150
  },
  {
    field: 'pay_address',
    label: '支付地址',
    minWidth: 150
  },
  {
    field: 'describe',
    label: '备注'
  },
  {
    field: 'create_time',
    label: '创建时间',
    sortable: 'custom',
    minWidth: 160,
    showOverflowTooltip: false,
    formatter: (row) => (row.create_time ? formatToDateTime(row.create_time) : '-')
  },
  {
    field: 'finish_time',
    label: '完成时间',
    sortable: 'custom',
    minWidth: 160,
    showOverflowTooltip: false,
    formatter: (row) => (row.finish_time ? formatToDateTime(row.finish_time) : '-')
  },
  {
    field: 'action',
    label: '操作',
    minWidth: 120,
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
        { label: '失败订单', value: 6 },
        { label: '已退款', value: 7 },
        { label: '已取消', value: 8 },
        { label: '中止订单', value: 9 }
      ],
      placeholder: '请选择订单状态'
    }
  },
  {
    field: 'query',
    component: 'Input' as const,
    label: {
      tips: 'TG用户名/TG用户昵称/机器人名称',
      text: '关键词'
    },
    componentProps: {
      placeholder: '请输入关键词'
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
    6: 'danger', // 失败订单
    7: 'warning', // 已退款
    8: 'info', // 已取消
    9: 'danger' // 中止订单
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
    6: '失败订单',
    7: '已退款',
    8: '已取消',
    9: '中止订单'
  }
  return statusMap[status] || '-'
}

// API 封装
const fetchRechargeOrderList = async (params: any) => {
  try {
    // 处理排序参数
    const adaptedParams: any = {}

    // 映射参数字段
    if (params.order_id) adaptedParams.order_id = params.order_id
    if (params.status) adaptedParams.status = params.status
    if (params.query) adaptedParams.keyword = params.query // query → keyword
    if (params.order_type) {
      // order_type → coin (1=TRX, 2=USDT)
      adaptedParams.coin = params.order_type == 1 ? 'TRX' : 'USDT'
    }
    if (params.receive_address) adaptedParams.receive_address = params.receive_address
    if (params.pay_address) adaptedParams.pay_address = params.pay_address
    if (params.currentPage) adaptedParams.current_page = params.currentPage
    if (params.pageSize) adaptedParams.page_size = params.pageSize

    // 处理时间范围（转换为秒数）
    if (params.dateRange && params.dateRange.length === 2) {
      adaptedParams.start_time = Math.floor(params.dateRange[0] / 1000).toString()
      adaptedParams.end_time = Math.floor(params.dateRange[1] / 1000).toString()
    }

    const response = await v1GetDepositList(adaptedParams)

    // 映射返回数据字段
    const list = (response.data?.list || []).map((item: any) => ({
      id: item.id,
      order_id: item.id, // id → order_id
      tg_name: item.tg_user_name, // tg_user_name → tg_name
      tg_nickname: item.tg_first_name, // tg_first_name → tg_nickname
      tg_id: item.user_id, // user_id → tg_id
      bot_name: item.bot_name,
      bot_id: item.bot_id,
      order_type: item.coin === 'TRX' ? 1 : 2, // 根据币种判断订单类型：TRX=1, USDT=2
      in_mount: item.amount, // amount → in_mount
      in_unit: item.coin, // coin → in_unit
      pay_mount: item.cost && item.cost !== '0' ? item.cost : '0', // cost → pay_mount
      pay_unit: item.cost && item.cost !== '0' ? 'USDT' : '', // 支付单位默认为USDT
      status: item.status,
      receive_address: item.receive_address,
      pay_address: item.pay_address,
      describe: item.describe,
      create_time: item.created_at, // created_at → create_time
      finish_time: item.paid_at // paid_at → finish_time
    }))

    // 添加数据为空提示
    const hasSearchCondition = !!(
      params.order_id ||
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

    // 映射订单详情字段
    orderDetail.value = {
      order_num: detail.id, // id → order_num
      status: detail.status,
      statusText: getStatusText(detail.status),
      order_type: detail.coin === 'TRX' ? 1 : 2, // 根据币种判断订单类型
      tg_id: detail.user_id, // user_id → tg_id
      tg_name: detail.tg_user_name || row.tg_name || '', // 优先使用详情接口返回的，否则使用列表中的
      tg_nickname: detail.tg_first_name || row.tg_nickname || '-', // 优先使用详情接口返回的，否则使用列表中的，都没有显示'-'
      bot_id: detail.bot_id,
      bot_name: detail.bot_name || row.bot_name || '', // 优先使用详情接口返回的，否则使用列表中的
      in_mount: detail.amount, // amount → in_mount
      in_unit: detail.coin, // coin → in_unit
      pay_mount: detail.cost, // cost → pay_mount
      pay_unit: detail.cost && detail.cost !== '0' ? 'USDT' : '', // 支付单位
      pay_address: row.pay_address || '', // 从列表数据中获取支付地址
      describe: detail.describe,
      create_time: detail.created_at, // created_at → create_time
      pay_time: detail.paid_at, // paid_at → pay_time
      finish_time: detail.paid_at // paid_at → finish_time
    }

    // 映射充值详情字段
    rechargeDetail.value = {
      to_address: detail.receive_address, // receive_address → to_address
      owner_address: row.pay_address || '', // 从列表数据中获取支付地址
      hash: detail.pay_id // pay_id → hash
    }

    console.log('orderDetail.value:', orderDetail.value)
    console.log('row data:', row)

    dialogVisible.value = true
    activeTab.value = 'order'
  } catch (error) {
    console.error('获取订单详情失败:', error)
    ElMessage.error('获取订单详情失败')
  }
}

// 导出订单
const handleExport = async () => {
  try {
    const params = await searchTableRef.value?.searchMethods.getFormData()
    if (!params) {
      ElMessage.warning('无法获取搜索参数')
      return
    }
    // 处理时间范围
    const exportParams = { ...params }
    if (params.dateRange && params.dateRange.length === 2) {
      exportParams.start_time = params.dateRange[0]
      exportParams.end_time = params.dateRange[1]
      delete exportParams.dateRange
    }
    const res = await exportRechargeOrderApi(exportParams)
    if (res.data instanceof Blob) {
      downloadByData(res.data, '充值订单列表.xlsx')
      ElMessage.success('订单导出成功')
    } else {
      console.error('Export failed: Response data is not a Blob', res.data)
      ElMessage.error('导出失败: 文件数据格式错误')
    }
  } catch (error) {
    console.error('订单导出失败:', error)
    const errorMsg =
      (error as any)?.response?.data?.message || (error as Error)?.message || '订单导出失败'
    ElMessage.error(errorMsg)
  }
}

const onSearch = (params: any) => {
  console.log('搜索参数:', params)
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

<style scoped>
.app-container {
  padding: 20px;
}
</style>
