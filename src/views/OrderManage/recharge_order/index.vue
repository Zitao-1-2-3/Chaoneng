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
        <!-- 自定义搜索按钮 -->
        <!-- <template #searchButtons>
          <BaseButton @click="handleExport" disabled>导出订单</BaseButton>
        </template> -->
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
import { Descriptions } from '@/components/Descriptions'
import { useI18n } from '@/hooks/web/useI18n'
import type { TableColumn } from '@/components/Table'
import type { DescriptionsSchema } from '@/components/Descriptions'
import {
  getRechargeOrderListApi,
  getRechargeOrderDetailApi,
  exportRechargeOrderApi
} from '@/api/recharge_order'
import { ElLink } from 'element-plus'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
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
    // { field: 'pay_unit', label: '支付单位' },
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
    // { field: 'number', label: '区块号', span: 24 },
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
    label: '订单号'
    // minWidth: 150
  },
  {
    field: 'tg_name',
    label: 'TG用户名',
    // minWidth: 150,
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
    // width: 150
  },
  {
    field: 'bot_name',
    label: '机器人名称',
    // width: 150,
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
    // width: 150,
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
    // width: 150,
    formatter: (row) =>
      row.pay_mount && row.pay_mount !== '0' ? `${row.pay_mount} ${row.pay_unit || ''}` : '-'
  },
  {
    field: 'status',
    label: '订单状态',
    // width: 150,
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
    minWidth: 120,
    formatter: (row) => (row.create_time ? formatToDateTime(row.create_time) : '-')
  },
  // {
  //   field: 'pay_time',
  //   label: '支付时间',
  //   // minWidth: 180,
  //   formatter: (row) => (row.pay_time ? formatToDateTime(row.pay_time) : '-')
  // },
  {
    field: 'finish_time',
    label: '完成时间',
    sortable: 'custom',
    minWidth: 120,
    formatter: (row) => (row.finish_time ? formatToDateTime(row.finish_time) : '-')
  },
  {
    field: 'action',
    label: '操作',
    // width: 100,
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
        { label: '已完成', value: 1 },
        { label: '待支付', value: 2 },
        { label: '已取消', value: 3 }
      ],
      placeholder: '请选择订单状态'
    }
  },
  {
    field: 'query',
    component: 'Input' as const,
    label: {
      tips: 'TG用户名/TG用户昵称/机器人名称/订单类型',
      text: '关键词'
    },
    componentProps: {
      placeholder: '请输入关键词'
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
    1: 'success', //  已完成
    2: 'warning', // 待支付
    3: 'danger' // 已取消
  }
  return statusMap[status] || 'info'
}

// 获取订单状态文本
const getStatusText = (status: number): string => {
  const statusMap = {
    1: '已完成',
    2: '待支付',
    3: '已取消'
  }
  return statusMap[status] || '-'
}

// API 封装
const fetchRechargeOrderList = async (params: any) => {
  try {
    // 处理排序参数
    const adaptedParams = { ...params }

    // 如果有排序参数，转换为接口需要的格式
    if (params.sort && params.order) {
      adaptedParams.sort_by = params.sort
      adaptedParams.order = params.order === 'ascending' ? 'asc' : 'desc'
      delete adaptedParams.sort
    }

    const response = await getRechargeOrderListApi(adaptedParams)
    return response.data
  } catch (error) {
    console.error('获取充值订单列表失败:', error)
    return { list: [], total: 0 }
  }
}

// 查看订单详情
const handleViewDetail = async (row: any) => {
  try {
    const response = await getRechargeOrderDetailApi(row.id)
    console.log('response', response)
    orderDetail.value = response.data.order_info || {}
    rechargeDetail.value = response.data.recharge_info || {}

    // 添加订单状态文本
    if (orderDetail.value.status) {
      orderDetail.value.statusText = getStatusText(orderDetail.value.status)
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
    // 获取当前搜索条件
    const searchParams = searchTableRef.value
      ? (searchTableRef.value.$attrs as any).params || {}
      : {}
    await exportRechargeOrderApi(searchParams)
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出订单失败:', error)
    ElMessage.error('导出订单失败')
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
