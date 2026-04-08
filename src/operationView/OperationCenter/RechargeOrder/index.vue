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
import {
  v2GetDepositList,
  v2GetDepositDetail,
  exportRechargeOrderApi
} from '@/api/operation/recharge_order'
import type { V2DepositItem } from '@/api/operation/recharge_order_types'
import { ElLink } from 'element-plus'
import { useRouter, useRoute } from 'vue-router'
import { downloadByData } from '@/utils/download'

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
          if (!row || !row.pay_mount) return h('span', '-')
          return h('span', `${row.pay_mount} ${row.pay_unit || ''}`)
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
    minWidth: 180
  },
  {
    field: 'user_name',
    label: '代理名称',
    minWidth: 120
  },
  {
    field: 'tg_name',
    label: 'TG用户名',
    minWidth: 120,
    slots: {
      default: ({ row }) => {
        if (!row.tg_name) return <span>-</span>
        return (
          <ElLink href={`https://t.me/${row.tg_name}`} type="primary" target="_blank">
            {row.tg_name}
          </ElLink>
        )
      }
    }
  },
  {
    field: 'tg_nickname',
    label: 'TG用户昵称',
    minWidth: 120
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
    width: 120,
    formatter: (row) => (row.order_type == 1 ? '充值TRX' : '充值USDT')
  },
  {
    field: 'in_mount',
    label: '充值金额',
    minWidth: 120,
    formatter: (row) => (row.in_mount ? `${row.in_mount} ${row.in_unit || 'TRX'}` : '-')
  },
  {
    field: 'pay_mount',
    label: '支付金额',
    minWidth: 120,
    formatter: (row) =>
      row.pay_mount && row.pay_mount !== '0' ? `${row.pay_mount} ${row.pay_unit || ''}` : '-'
  },
  {
    field: 'status',
    label: '订单状态',
    width: 100,
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
    minWidth: 200,
    showOverflowTooltip: true
  },
  {
    field: 'pay_address',
    label: '支付地址',
    minWidth: 200,
    showOverflowTooltip: true
  },
  {
    field: 'describe',
    label: '备注',
    minWidth: 150,
    showOverflowTooltip: true
  },
  {
    field: 'create_time',
    label: '创建时间',
    minWidth: 160,
    formatter: (row) => (row.create_time ? formatToDateTime(row.create_time) : '-')
  },
  {
    field: 'finish_time',
    label: '完成时间',
    minWidth: 160,
    formatter: (row) => (row.finish_time ? formatToDateTime(row.finish_time) : '-')
  },
  {
    field: 'action',
    label: '操作',
    width: 100,
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
      tips: 'TG用户名/TG用户昵称/机器人名称/代理名称',
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
  }
]

// 获取订单状态显示类型
const getStatusType = (status: number): 'success' | 'warning' | 'info' | 'danger' | 'primary' => {
  const statusMap: Record<number, 'success' | 'warning' | 'info' | 'danger' | 'primary'> = {
    1: 'info', // 新订单
    2: 'primary', // 已支付
    3: 'primary', // 已发送
    4: 'primary', // 已回收
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

// API 封装 - 使用新接口 v2
const fetchRechargeOrderList = async (params: any) => {
  try {
    console.log('=== 充值订单列表 - 请求参数 ===')
    console.log('原始参数:', JSON.stringify(params, null, 2))

    // 转换参数格式以适配新接口
    const adaptedParams: any = {
      current_page: params.current_page || params.currentPage || 1,
      page_size: params.page_size || params.pageSize || 10
    }

    // 关键字搜索
    if (params.query) {
      adaptedParams.keyword = params.query
    }

    // 订单号（保持字符串格式，不转换为数字）
    if (params.order_id) {
      adaptedParams.order_id = params.order_id
    }

    // 订单状态：保持原样，不做转换
    if (params.status) {
      adaptedParams.status = params.status
    }

    // 订单类型：暂时搁置，等待后端确认如何处理
    // TODO: 确认后端是否支持按 coin 或其他字段筛选订单类型
    // if (params.order_type) {
    //   // 待确认：可能需要转换为 kind 或其他参数
    // }

    // 收款地址
    if (params.receive_address) {
      adaptedParams.receive_address = params.receive_address
    }

    // 支付地址
    if (params.pay_address) {
      adaptedParams.pay_address = params.pay_address
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

    // 转换数据格式以适配页面显示
    const list = (data.list || []).map((item: V2DepositItem) => ({
      id: item.id,
      order_id: item.id, // 新接口使用 id 作为订单号
      user_name: item.agent_name, // 代理名称
      tg_id: item.user_id?.toString() || '', // TG用户ID
      tg_name: item.tg_user_name, // TG用户名
      tg_nickname: item.tg_first_name, // TG用户昵称
      bot_id: item.bot_id, // 机器人ID
      bot_name: item.bot_name, // 机器人名称
      order_type: item.coin === 'TRX' ? 1 : 2, // 订单类型: TRX=1, USDT=2
      in_mount: item.amount, // 充值金额
      in_unit: item.coin, // 充值单位
      pay_mount: item.amount, // 支付金额（新接口没有单独的支付金额字段）
      pay_unit: item.coin, // 支付单位
      status: item.status, // 订单状态（保持原样）
      receive_address: item.receive_address, // 收款地址
      pay_address: item.pay_address, // 支付地址
      describe: item.describe, // 备注
      create_time: item.created_at, // 创建时间（Unix时间戳）
      pay_time: item.paid_at, // 支付时间（Unix时间戳）
      finish_time: item.paid_at // 完成时间（使用 paid_at 字段）
    }))

    return {
      list: list,
      total: data.pager?.total || 0
    }
  } catch (error) {
    console.error('获取充值订单列表失败:', error)
    return { list: [], total: 0 }
  }
}

// 查看订单详情 - 使用新接口 v2
const handleViewDetail = async (row: any) => {
  try {
    console.log('=== 充值订单详情 - 请求参数 ===')
    console.log('订单ID:', row.id)

    const response = await v2GetDepositDetail(row.id)
    console.log('=== 充值订单详情 - 响应数据 ===')
    console.log('response', JSON.stringify(response, null, 2))

    const detail = response.data

    // 转换订单详情数据以适配页面显示
    orderDetail.value = {
      order_num: detail.id, // 订单号
      status: detail.status, // 订单状态
      statusText: getStatusText(detail.status), // 订单状态文本
      order_type: detail.coin === 'TRX' ? 1 : 2, // 订单类型: TRX=1, USDT=2
      tg_id: detail.user_id?.toString() || '', // TG用户ID
      tg_name: detail.tg_user_name, // TG用户名
      tg_nickname: detail.tg_first_name, // TG用户昵称
      bot_id: detail.bot_id, // 机器人ID
      bot_name: detail.bot_name, // 机器人名称
      in_mount: detail.amount, // 充值金额
      in_unit: detail.coin, // 充值单位
      pay_mount: detail.amount, // 支付金额（新接口没有单独的支付金额字段）
      pay_unit: detail.coin, // 支付单位
      describe: detail.describe, // 备注
      create_time: detail.created_at, // 创建时间（Unix时间戳）
      pay_time: detail.paid_at, // 支付时间（Unix时间戳）
      finish_time: detail.paid_at // 完成时间（使用 paid_at 字段）
    }

    // 转换充值详情数据以适配页面显示
    if (detail.pay_transaction) {
      rechargeDetail.value = {
        to_address: detail.pay_transaction.to, // 收款地址
        owner_address: detail.pay_transaction.from, // 支付地址
        hash: detail.pay_transaction.id // 交易哈希
      }
    } else {
      // 如果没有支付交易信息，使用订单中的地址信息
      rechargeDetail.value = {
        to_address: detail.receive_address, // 收款地址
        owner_address: '', // 支付地址（无支付交易信息时为空）
        hash: detail.pay_id || '' // 使用 pay_id 作为交易哈希
      }
    }

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
    const params = (await searchTableRef.value?.searchMethods.getFormData()) || {}
    const res = await exportRechargeOrderApi(params as any)
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
