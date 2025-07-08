<template>
  <Dialog v-model="visible" title="查看详情">
    <div v-if="loading" class="flex justify-center items-center min-h-[200px]">
      <Icon icon="ep:loading" class="is-loading" :size="26" />
    </div>
    <Descriptions
      v-if="orderDetail && !loading"
      :schema="detailSchema"
      :data="orderDetail"
      :column="3"
      border
    />
    <div v-else-if="!loading" class="text-center p-5">无法加载订单详情数据。</div>
    <template #footer>
      <div class="flex justify-end">
        <ElButton type="primary" @click="visible = false">确定</ElButton>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { ElButton, ElMessage, ElTag, ElLink } from 'element-plus'
import { Dialog } from '@/components/Dialog'
import { Descriptions } from '@/components/Descriptions'
import type { DescriptionsSchema } from '@/components/Descriptions'
import { getExchangeOrderDetailApi } from '@/api/exchange_transaction'
import type { ExchangeOrderDetailData } from '@/api/exchange_transaction/types'
import { formatToDateTime } from '@/utils/dateUtil'
import Icon from '@/components/Icon/src/Icon.vue'

const visible = ref(false)
const loading = ref(false)

type OrderDetailType = Partial<
  ExchangeOrderDetailData & {
    user_id?: number
    username?: string
    trx_price?: string | number
    exchange_amount?: string | number
    exchange_unit?: string
    plate_profit?: string | number
    real_price?: string | number
    resend_amount?: string | number
    resend_unit?: string
    receive_address?: string
    resend_time?: number
    status?: number
    agent_out_amount?: string | number
    finish_time?: number
    describe?: string
    pay_unit?: string
    order_type?: number
  }
>

const orderDetail = ref<OrderDetailType | null>(null)

const getStatusText = (status: number | undefined) => {
  switch (status) {
    case 1:
      return '成功'
    case 2:
      return '失败'
    case 3:
      return '待支付'
    default:
      return '未知'
  }
}

const getStatusType = (status: number | undefined): 'success' | 'warning' | 'info' | 'danger' => {
  switch (status) {
    case 1:
      return 'success'
    case 2:
      return 'danger'
    case 3:
      return 'warning'
    default:
      return 'info'
  }
}

const formatAmount = (amount: string | number | undefined, unit: string | undefined) => {
  const amountStr = amount ?? '-'
  return amountStr !== '-' && unit ? `${amountStr}${unit}` : amountStr.toString()
}

// const formatRate = (rate: string | number | undefined) => {
//   return rate !== undefined && rate !== null ? `$${rate}` : '-'
// }

const formatNullableDateTime = (timestamp: number | undefined) => {
  return timestamp && !isNaN(timestamp) ? formatToDateTime(timestamp * 1000) : '-'
}

const detailSchema = computed<DescriptionsSchema[]>(() => [
  { label: '订单ID', field: 'order_id', span: 8 },
  {
    label: '代理名称',
    field: 'username',
    span: 8,
    slots: { default: (data) => data.username ?? '-' }
  },

  {
    label: '交易类型',
    field: 'order_type',
    span: 8,
    slots: { default: () => h('span', { class: 'text-blue-500' }, '闪兑') }
  },
  {
    label: '支付金额',
    field: 'order_amount',
    span: 8,
    slots: { default: (data) => formatAmount(data.order_amount, data.pay_unit) }
  },
  {
    label: '兑换汇率',
    field: 'trx_price',
    span: 8
  },

  {
    label: '支出TRX数量',
    field: 'exchange_amount',
    span: 8,
    slots: { default: (data) => formatAmount(data.exchange_amount, data.exchange_unit) }
  },
  {
    label: '平台利润',
    field: 'plate_profit',
    span: 8,
    slots: { default: (data) => formatAmount(data.plate_profit, data.exchange_unit) }
  },
  {
    label: '实时汇率',
    field: 'real_price',
    span: 8
  },

  // { label: '补发TRX', field: 'resend_amount', span: 8, slots: { default: (data) => formatAmount(data.resend_amount, data.resend_unit ?? data.exchange_unit) } },
  {
    label: '系统转出TRX',
    field: 'out_from_address',
    span: 16,
    slots: { default: (data) => data.out_from_address || '-' }
  },
  {
    label: '用户接收TRX',
    field: 'in_from_address',
    span: 16,
    slots: { default: (data) => data.in_from_address || '-' }
  },
  {
    label: '代理收用户U',
    field: 'in_to_address',
    span: 16,
    slots: { default: (data) => data.in_to_address || '-' }
  },
  {
    label: '系统发放TRX hash',
    field: 'out_txid',
    span: 16,
    slots: {
      default: (data) =>
        h(
          ElLink,
          {
            type: 'primary',
            href: `${import.meta.env.VITE_TRONSCAN_URL}/#/transaction/${data.out_txid}`,
            target: '_blank'
          },
          () => data.out_txid || '-'
        )
    }
  },
  {
    label: '用户转USDT hash',
    field: 'in_txid',
    span: 16,
    slots: {
      default: (data) =>
        h(
          ElLink,
          {
            type: 'primary',
            href: `${import.meta.env.VITE_TRONSCAN_URL}/#/transaction/${data.in_txid}`,
            target: '_blank'
          },
          () => data.in_txid || '-'
        )
    }
  },

  // { label: '补发时间', field: 'resend_time', span: 8, slots: { default: (data) => formatNullableDateTime(data.resend_time) } },
  {
    label: '订单状态',
    field: 'status',
    span: 8,
    slots: {
      default: (data) =>
        h(ElTag, { type: getStatusType(data.status) }, () => getStatusText(data.status))
    }
  },
  {
    label: '代理扣款',
    field: 'agent_out_amount',
    span: 8,
    slots: { default: (data) => formatAmount(data.agent_out_amount, data.exchange_unit) }
  },

  // {
  //   label: '操作人',
  //   field: 'username',
  //   span: 8,
  //   slots: { default: (data) => data.username ?? '-' }
  // },
  {
    label: '完成时间',
    field: 'finish_time',
    span: 8,
    slots: { default: (data) => formatNullableDateTime(data.finish_time) }
  },
  { label: '备注', field: 'describe', span: 24, slots: { default: (data) => data.describe ?? '-' } }
])

const open = async (orderIdValue: number | string) => {
  const id = typeof orderIdValue === 'string' ? parseInt(orderIdValue, 10) : orderIdValue
  if (isNaN(id)) {
    ElMessage.error('无效的订单ID')
    return
  }

  visible.value = true
  loading.value = true
  orderDetail.value = null

  try {
    const res = await getExchangeOrderDetailApi(id)
    const responseData = (res as any)?.data
    const responseCode = (res as any)?.code
    const responseMessage = (res as any)?.message

    if (responseCode === '000000' && responseData) {
      orderDetail.value = responseData as OrderDetailType
    } else {
      ElMessage.error(responseMessage || '获取订单详情失败')
    }
  } catch (error) {
    console.error('获取订单详情出错:', error)
    ElMessage.error('获取订单详情失败')
  } finally {
    loading.value = false
  }
}

defineExpose({ open })
</script>

<style scoped>
.text-blue-500 {
  color: #3b82f6;
}

.is-loading {
  animation: rotating 2s linear infinite;
}

@keyframes rotating {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

:deep(.el-descriptions__label) {
  /* min-width: 80px; */
}

:deep(.el-descriptions__content) {
  word-break: break-all;
}
</style>
