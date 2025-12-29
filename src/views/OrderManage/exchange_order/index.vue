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
import { useRoute, useRouter } from 'vue-router'
import { ElButton, ElTag, ElMessage, ElTabs, ElTabPane, ElLink, ElEmpty } from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import { Dialog } from '@/components/Dialog'
import { SearchTable } from '@/components/SearchTable'
import { BaseButton } from '@/components/Button'
import { Descriptions } from '@/components/Descriptions'
// import { useI18n } from '@/hooks/web/useI18n'
import type { TableColumn } from '@/components/Table'
import type { DescriptionsSchema } from '@/components/Descriptions'
import {
  getExchangeOrderListApi,
  getExchangeOrderDetailApi,
  exportExchangeOrderApi,
  getTransactionDetailApi
} from '@/api/exchange_order'
import { Icon } from '@/components/Icon'
import { downloadByData } from '@/utils/download'
import { ExchangeOrderListItem } from '@/api/exchange_transaction'

// const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const searchTableRef = ref<InstanceType<typeof SearchTable> | null>(null)

// 订单详情相关
const dialogVisible = ref(false)
const orderDetail = ref<any>({})

// 交易详情相关
const transactionDialogVisible = ref(false)
const transactionDetail = ref<any>({})
const activeTransactionTab = ref('in')

// 兑换详情Schema
const exchangeDetailSchema = computed(() => {
  const schema: DescriptionsSchema[] = [
    { field: 'order_id', label: '订单号' },
    { field: 'tg_bot_id', label: '机器人ID' },
    // { field: 'tg_name', label: 'TG用户名' },
    {
      field: 'order_amount',
      label: '支付金额',
      slots: {
        default: (row: any) => {
          if (!row || !row.order_amount) return h('span', '-')
          return h('span', row.order_amount + row.pay_unit)
        }
      }
    },
    { field: 'trx_price', label: '兑换汇率' },
    {
      field: 'create_time',
      label: '创建时间',
      slots: {
        default: (row: any) => {
          if (!row || !row.create_time) return h('span', '-')
          return h('span', formatToDateTime(row.create_time * 1000))
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
    { field: 'bot_name', label: '机器人名称' },
    // { field: 'nickname', label: 'TG用户昵称' },
    {
      field: 'exchange_amount',
      label: '兑换金额',
      slots: {
        default: (row: any) => {
          if (!row) return h('span', '-')
          return h('span', `${row.exchange_amount} ${row.exchange_unit}`)
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
      field: 'pay_time',
      label: '支付时间',
      slots: {
        default: (row: any) => {
          if (!row || !row.pay_time) return h('span', '-')
          return h('span', formatToDateTime(row.pay_time * 1000))
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
  // {
  //   field: 'in_number',
  //   label: '区块号',
  //   span: 24,
  //   slots: {
  //     default: (row: any) => {
  //       return h(
  //         ElLink,
  //         {
  //           href: `${import.meta.env.VITE_TRONSCAN_URL}/#/block/${row.in_number}`,
  //           type: 'primary',
  //           target: '_blank'
  //         },
  //         () => row.in_number
  //       )
  //     }
  //   }
  // },
  {
    field: 'order_amount',
    label: '数量',
    formatter: (row) => {
      return row.order_amount
    }
  },
  {
    field: 'in_time',
    label: '转入时间',
    slots: {
      default: (row: any) => {
        console.log('row', row)
        return h('span', formatToDateTime(row.in_time * 1000))
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
  { field: 'out_to_address', label: '接收人', span: 24 },
  { field: 'out_from_address', label: '发送人', span: 24 },
  {
    field: 'user_get_amount',
    label: '数量',
    formatter: (row) => {
      if (!row.user_get_amount) return '0'
      return row.user_get_amount
    }
  },
  // {
  //   field: 'out_number',
  //   label: '区块号',
  //   formatter: (row) => {
  //     if (!row.out_number) return '0'
  //     return row.out_number
  //   }
  // },
  {
    field: 'out_time',
    label: '转出时间',
    slots: {
      default: (row: any) => {
        return h('span', formatToDateTime(row.out_time * 1000))
      }
    }
  }
])

// 表格列配置
const columns: TableColumn[] = [
  {
    field: 'order_id',
    label: '订单号'
  },
  // {
  //   field: 'tg_name',
  //   label: 'TG用户名',
  //   width: 120,
  //   slots: {
  //     default: ({ row }) => {
  //       return h(
  //         ElLink,
  //         {
  //           type: 'primary',
  //           onClick: () => navigateToUserList(row.tg_bot_id)
  //         },
  //         () => row.tg_name
  //       )
  //     }
  //   }
  // },
  // {
  //   field: 'nickname',
  //   label: 'TG用户昵称',
  //   width: 120
  // },
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
    field: 'order_amount',
    label: '支付金额',
    formatter: (row) => (row.order_amount ? `${row.order_amount} ${row.pay_unit}` : '-')
  },
  {
    field: 'exchange_amount',
    label: '兑换金额',
    formatter: (row) => (row.exchange_amount ? `${row.exchange_amount} ${row.exchange_unit}` : '-')
  },
  {
    field: 'trx_price',
    label: '兑换汇率'
  },
  {
    field: 'order_type',
    label: '订单类型',
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
    formatter: (row) => (row.create_time ? formatToDateTime(row.create_time * 1000) : '-')
  },
  {
    field: 'pay_time',
    label: '支付时间',
    formatter: (row) => (row.pay_time ? formatToDateTime(row.pay_time * 1000) : '-')
  }
  // {
  //   field: 'finish_time',
  //   label: '完成时间',
  //   width: 180,
  //   formatter: (row) => (row.finish_time ? formatToDateTime(row.finish_time * 1000) : '-')
  // },
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
        { label: '已完成', value: 1 },
        { label: '失败', value: 2 },
        { label: '待支付', value: 3 }
      ],
      placeholder: '请选择订单状态'
    }
  }
]

// 获取订单状态显示类型
const getStatusType = (status: number): 'success' | 'warning' | 'info' | 'danger' | 'primary' => {
  const statusMap: Record<number, 'success' | 'warning' | 'info' | 'danger' | 'primary'> = {
    1: 'success',
    2: 'danger',
    3: 'warning'
  }
  return statusMap[status] || 'info'
}

// 获取订单状态文本
const getStatusText = (status: number): string => {
  const statusMap = {
    1: '已完成',
    2: '失败',
    3: '待支付'
  }
  return statusMap[status] || '-'
}

// 跳转到用户列表
// const navigateToUserList = (userId: string) => {
//   router.push({
//     path: '/user/list',
//     query: { userId }
//   })
// }

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
    const response = await getExchangeOrderListApi(params)
    return response.data
  } catch (error) {
    console.error('获取兑换订单列表失败:', error)
    return { list: [], total: 0 }
  }
}

// 查看兑换详情
const handleViewDetail = async (row: any) => {
  try {
    const response = await getExchangeOrderDetailApi(row.id)
    orderDetail.value = response.data
    dialogVisible.value = true
  } catch (error) {
    console.error('获取兑换详情失败:', error)
    ElMessage.error('获取兑换详情失败')
  }
}

// 查看交易详情
const handleTransactionDetail = async (row: any) => {
  try {
    const response = await getTransactionDetailApi(row.id)
    if (response.data) {
      transactionDetail.value = response.data
      console.log('transactionDetail.value', transactionDetail.value)
      // 设置默认活动标签页
      if (response.data.in_txid && response.data.out_txid) {
        activeTransactionTab.value = 'in' // 如果都有，默认显示转入
      } else if (response.data.in_txid) {
        activeTransactionTab.value = 'in' // 只有转入
      } else if (response.data.out_txid) {
        activeTransactionTab.value = 'out' // 只有转出
      } else {
        // 没有任何交易数据
        ElMessage.info('暂无交易数据')
      }

      transactionDialogVisible.value = true
    } else {
      ElMessage.info('暂无交易数据')
      transactionDetail.value = { order_id: row.order_id } // 至少保留订单号
      transactionDialogVisible.value = true
    }
  } catch (error) {
    console.error('获取交易详情失败:', error)
    ElMessage.error('获取交易详情失败')
  }
}

// 导出订单
const handleExport = async () => {
  try {
    const params = await searchTableRef.value?.searchMethods.getFormData()
    const res = await exportExchangeOrderApi(params)

    if (res.data instanceof Blob) {
      downloadByData(res.data, '闪兑订单列表.xlsx')

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
