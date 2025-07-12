<script setup lang="ts">
import { computed, h } from 'vue'
import { ElLink, ElTag } from 'element-plus'
import { Descriptions } from '@/components/Descriptions'
import type { DescriptionsSchema } from '@/components/Descriptions'
import isEmpty from 'lodash-es/isEmpty'
// 导入主订单类型
import type { EnergyTransactionOrder } from '@/api/energy_transaction'
import { formatToDateTime } from '@/utils/dateUtil'
import { formatToWan } from '@/utils'

const props = defineProps({
  orderData: {
    // 修改：明确 orderData 的类型
    type: Object as () => EnergyTransactionOrder | null,
    default: () => null
  }
})

// 福利详情 schema - 根据 EnergyTransactionOrder 调整
const flashRentDetailSchema = computed((): DescriptionsSchema[] => [
  { field: 'stroke_num', label: '福利笔数' }, // Assuming 'stroke_num' applies
  {
    field: 'txid', // Ensure 'txid' is in getEnergyOrderDetailApi response
    label: '交易hash',
    span: 24,
    slots: {
      default: (data: any) => {
        if (!data || !data.txid) return h('span', '-')
        return h(
          ElLink,
          {
            href: `${import.meta.env.VITE_TRONSCAN_URL}/#/transaction/${data.txid}`,
            type: 'primary',
            target: '_blank'
          },
          () => data.txid
        )
      }
    }
  },
  { field: 'from_address', label: '发放能量地址', span: 24 }, // Ensure 'from_address' is present
  { field: 'receive_address', label: '接收地址', span: 24 }, // Ensure 'receive_address' is present
  {
    field: 'recycle_txid', // Ensure 'txid' is in getEnergyOrderDetailApi response
    label: '回收hash',
    span: 24,
    slots: {
      default: (data: any) => {
        if (!data || !data.recycle_txid) return h('span', '-')
        return h(
          ElLink,
          {
            href: `${import.meta.env.VITE_TRONSCAN_URL}/#/transaction/${data.recycle_txid}`,
            type: 'primary',
            target: '_blank'
          },
          () => data.recycle_txid
        )
      }
    }
  },
  {
    field: 'status', // Use the order status field from getEnergyOrderDetailApi response
    label: '订单状态', // Label changed to reflect it's order status now
    slots: {
      default: (data: any) => {
        if (data?.status === undefined) return h('span', '-')

        // Use the same status mapping as the main table/order detail dialog
        const statusColorMap: Record<number, 'success' | 'warning' | 'danger' | 'info'> = {
          1: 'success', // 已完成
          2: 'warning', // 已支付
          3: 'danger' // 支付失败
        }
        const statusTextMap: Record<number, string> = {
          1: '已完成',
          2: '已支付',
          3: '支付失败'
        }
        const numericStatus =
          typeof data.status === 'string' ? parseInt(data.status, 10) : data.status
        if (isNaN(numericStatus)) {
          return h(ElTag, { type: 'info', size: 'small' }, () => String(data.status || '未知'))
        }
        const type = statusColorMap[numericStatus] || 'info'
        const text = statusTextMap[numericStatus] || '-'
        return h(ElTag, { type: type, size: 'small' }, () => text)
      }
    }
  },
  {
    field: 'energy_num',
    label: '能量数量',
    slots: {
      default: (data: any) => h('span', {}, formatToWan(data.energy_num))
    }
  }, // Ensure 'energy_num' is present
  {
    field: 'create_time',
    label: '创建时间',
    span: 24,
    slots: {
      default: (data: any) =>
        h('span', {}, data.create_time ? formatToDateTime(data.create_time) : '-')
    }
  },
  {
    field: 'finish_time',
    label: '完成时间',
    span: 24,
    slots: {
      default: (data: any) =>
        h('span', {}, data.finish_time ? formatToDateTime(data.finish_time) : '-')
    }
  }
])
</script>

<template>
  <Descriptions
    v-if="orderData"
    :schema="flashRentDetailSchema"
    :data="orderData"
    :column="2"
    border
  />
  <div v-else>加载中...</div>
</template>

<style scoped>
/* Add component-specific styles if needed */
</style>
