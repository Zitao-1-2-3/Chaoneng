<template>
  <div class="app-container">
    <ContentWrap>
      <SearchTable
        :columns="columns"
        :search-schema="searchSchema"
        :action-column="actionColumn"
        :fetch-data-api="fetchHostedOrderList"
        :showAddButton="false"
        ref="searchTableRef"
        @search="onSearch"
      >
        <template #searchButtons>
          <BaseButton type="primary" @click="handleExport">
            <Icon icon="ep:download" class="mr-5px" />
            导出订单
          </BaseButton>
        </template>
      </SearchTable>

      <!-- 托管详情弹窗 -->
      <Dialog v-model="dialogVisible" :title="'托管详情'">
        <Descriptions :schema="hostedDetailSchema" :data="orderDetail" :column="2" border />
        <template #footer>
          <div class="flex justify-end">
            <ElButton @click="dialogVisible = false">关闭</ElButton>
          </div>
        </template>
      </Dialog>

      <!-- 交易详情弹窗 -->
      <Dialog v-model="transactionDialogVisible" :title="'交易详情'">
        <Descriptions
          :schema="transactionDetailSchema"
          :data="transactionDetail"
          :column="2"
          border
        />
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
import { useRouter, useRoute } from 'vue-router'
import { ElButton, ElTag, ElMessage, ElLink } from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import { Dialog } from '@/components/Dialog'
import { SearchTable } from '@/components/SearchTable'
import { BaseButton } from '@/components/Button'
import { Descriptions } from '@/components/Descriptions'
import type { TableColumn } from '@/components/Table'
import type { DescriptionsSchema } from '@/components/Descriptions'
import {
  getHostedOrderListApi,
  getHostedOrderDetailApi,
  exportHostedOrderApi
} from '@/api/hosted_order'
import formatEnergyNum from '@/views/OrderManage/helpers/formatEnergyNum'
import { Icon } from '@/components/Icon'
import { downloadByData } from '@/utils/download'

const router = useRouter()
const searchTableRef = ref<InstanceType<typeof SearchTable> | null>(null)

// 订单详情相关
const dialogVisible = ref(false)
const orderDetail = ref<any>({})

// 交易详情相关
const transactionDialogVisible = ref(false)
const transactionDetail = ref<any>({})

// 托管详情Schema
const hostedDetailSchema = computed(() => {
  const resourceType = orderDetail.value?.resource_type
  const isEnergy = resourceType === 1
  const isBandwidth = resourceType === 2

  const schema: DescriptionsSchema[] = [
    { field: 'order_id', label: '订单号' },
    { field: 'tg_name', label: 'TG用户名' },
    { field: 'nickname', label: 'TG用户昵称' },
    { field: 'tg_bot_id', label: '机器人ID' },
    { field: 'bot_name', label: '机器人名称' },
    {
      field: 'resource_type',
      label: '订单类型',
      slots: {
        default: (row: any) => {
          if (!row || row.resource_type === undefined) return h('span', '-')
          const typeText =
            row.resource_type === 1 ? '能量' : row.resource_type === 2 ? '带宽' : '未知'
          const typeColor =
            row.resource_type === 1 ? 'success' : row.resource_type === 2 ? 'warning' : 'info'
          return h(ElTag, { type: typeColor, size: 'small' }, () => typeText)
        }
      }
    },
    {
      field: 'order_amount',
      label: '订单金额',
      slots: {
        default: (row: any) => {
          if (!row || !row.order_amount) return h('span', '-')
          return h('span', row.order_amount + row.pay_unit)
        }
      }
    },
    {
      field: 'status',
      label: '订单状态',
      slots: {
        default: (row: any) => {
          if (!row) return h('span', '-')
          return h(
            ElTag,
            { type: getStatusType(row.status), size: 'small' },
            () => row.statusText || getStatusText(row.status)
          )
        }
      }
    },
    {
      field: 'pay_amount',
      label: '支付金额',
      slots: {
        default: (row: any) => {
          if (!row || !row.pay_amount) return h('span', '-')
          return h('span', row.pay_amount + row.pay_unit)
        }
      }
    },
    {
      field: 'payType',
      label: '支付类型',
      slots: {
        default: (row: any) => {
          return h('span', row.pay_type == 2 ? '波场钱包转账' : '余额支付')
        }
      }
    },
    {
      field: 'energy_num',
      label: isEnergy ? '能量数量' : isBandwidth ? '带宽数量' : '数量',
      slots: {
        default: (row: any) => {
          return h('span', formatEnergyNum(row.energy_num))
        }
      }
    },
    {
      field: 'energy_rent_text',
      label: isEnergy ? '能量有效期' : isBandwidth ? '带宽有效期' : '有效期'
    },
    { field: 'stroke_num', label: '笔数' },
    {
      field: 'txid',
      label: '交易hash',
      span: 24,
      slots: {
        default: (row: any) => {
          if (!row || !row.txid) return h('span', '-')
          return h(
            ElLink,
            {
              href: `${import.meta.env.VITE_TRONSCAN_URL}/#/transaction/${row.txid}`,
              type: 'primary',
              target: '_blank'
            },
            () => row.txid
          )
        }
      }
    },
    { field: 'address', label: '钱包地址', span: 24 },
    {
      field: 'create_time',
      label: '创建时间',
      slots: {
        default: (row: any) => {
          if (!row || !row.create_time) return h('span', '-')
          return h('span', formatToDateTime(row.create_time))
        }
      }
    },
    {
      field: 'finish_time',
      label: '完成时间',
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

// 交易详情schema
const transactionDetailSchema = computed(() => {
  const resourceType = transactionDetail.value?.resource_type
  const isEnergy = resourceType === 1
  const isBandwidth = resourceType === 2

  const schema: DescriptionsSchema[] = [
    {
      field: 'txid',
      label: '交易hash',
      span: 24,
      slots: {
        default: (row: any) => {
          if (!row || !row.txid) return h('span', '-')
          return h(
            ElLink,
            {
              href: `${import.meta.env.VITE_TRONSCAN_URL}/#/transaction/${row.txid}`,
              type: 'primary',
              target: '_blank'
            },
            () => row.txid
          )
        }
      }
    },
    { field: 'address', label: '接收地址', span: 24 },
    {
      field: 'status',
      label: '交易状态',
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
      field: 'energy_num',
      label: isEnergy ? '能量数' : isBandwidth ? '带宽数' : '数量',
      slots: {
        default: (row: any) => {
          const energy_num = row.energy_num
          return h('span', formatEnergyNum(energy_num))
        }
      }
    },
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

// 表格列配置
const columns: TableColumn[] = [
  {
    field: 'order_id',
    label: '订单号'
  },
  {
    field: 'tg_name',
    label: 'TG用户名',
    slots: {
      default: ({ row }) => {
        return h(
          ElLink,
          {
            type: 'primary',
            onClick: () => navigateToUserList(row.tg_id)
          },
          () => row.tg_name
        )
      }
    }
  },
  {
    field: 'nickname',
    label: 'TG用户昵称'
  },
  {
    field: 'bot_name',
    label: '机器人名称',
    slots: {
      default: ({ row }) => {
        return h(
          ElLink,
          {
            type: 'primary',
            onClick: () => navigateToBotList(row.tg_bot_id)
          },
          () => row.bot_name
        )
      }
    }
  },
  {
    field: 'resource_type',
    label: '订单类型',
    slots: {
      default: ({ row }) => {
        if (!row || row.resource_type === undefined) return h('span', '-')
        const typeText =
          row.resource_type === 1 ? '能量' : row.resource_type === 2 ? '带宽' : '未知'
        const typeColor =
          row.resource_type === 1 ? 'success' : row.resource_type === 2 ? 'warning' : 'info'
        return h(ElTag, { type: typeColor, size: 'small' }, () => typeText)
      }
    }
  },
  {
    field: 'pay_amount',
    label: '支付金额',
    formatter: (row) => (row.pay_amount != 0 ? `${row.pay_amount} ${row.pay_unit}` : '-')
  },
  {
    field: 'energy_num',
    label: '数量',
    formatter: (row) => formatEnergyNum(row.energy_num)
  },
  {
    field: 'energy_rent_text',
    label: '有效期'
  },
  {
    field: 'status',
    label: '订单状态',
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
    label: '备注'
  },
  {
    field: 'create_time',
    label: '创建时间',
    width: 180,
    formatter: (row) => (row.create_time ? formatToDateTime(row.create_time) : '-')
  },
  {
    field: 'finish_time',
    label: '完成时间',
    width: 180,
    formatter: (row) => (row.finish_time ? formatToDateTime(row.finish_time) : '-')
  }
]

const actionColumn: TableColumn = {
  field: 'action',
  label: '操作',
  minWidth: 180,
  fixed: 'right',
  slots: {
    default: ({ row }) => {
      return (
        <div>
          <BaseButton type="primary" onClick={() => handleViewDetail(row)}>
            托管详情
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
    label: {
      text: '关键词',
      tips: 'TG用户名/TG昵称/机器人名称'
    },
    componentProps: {
      placeholder: '请输入关键字'
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
  }
]

// 获取订单状态显示类型
const getStatusType = (status: number): 'success' | 'warning' | 'info' | 'danger' | 'primary' => {
  const statusMap: Record<number, 'success' | 'warning' | 'info' | 'danger' | 'primary'> = {
    1: 'success',
    2: 'warning',
    3: 'danger'
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

// 跳转到用户列表
const navigateToUserList = (userId: string) => {
  router.push({
    path: '/user_group/user_list',
    query: { tg_id: userId }
  })
}

// 跳转到机器人列表
const navigateToBotList = (tgUserId: string) => {
  router.push({
    path: '/bot_manage/bot_list',
    query: { tg_bot_id: tgUserId }
  })
}

// API 封装
const fetchHostedOrderList = async (params: any) => {
  try {
    const response = await getHostedOrderListApi(params)
    return response.data
  } catch (error) {
    console.error('获取托管订单列表失败:', error)
    return { list: [], total: 0 }
  }
}

// 查看托管详情
const handleViewDetail = async (row: any) => {
  try {
    const response = await getHostedOrderDetailApi(row.id)
    orderDetail.value = response.data
    dialogVisible.value = true
  } catch (error) {
    console.error('获取托管详情失败:', error)
    ElMessage.error('获取托管详情失败')
  }
}

// 查看交易详情
const handleTransactionDetail = async (row: any) => {
  try {
    // 尝试从API获取交易详情
    const response = await getHostedOrderDetailApi(row.id)
    if (response.data) {
      transactionDetail.value = response.data
      transactionDialogVisible.value = true
      return
    }
    transactionDialogVisible.value = true
  } catch (error) {
    console.error('获取交易详情失败:', error)
    ElMessage.error('获取交易详情失败')
  }
}

// 导出订单
const handleExport = async () => {
  try {
    const params = await searchTableRef.value?.searchMethods.getFormData()
    const res = await exportHostedOrderApi(params)

    if (res.data instanceof Blob) {
      downloadByData(res.data, '托管订单列表.xlsx')

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
