<template>
  <Dialog v-model="dialogVisible" title="订单详情">
    <Descriptions
      v-if="currentRowData"
      :schema="detailSchema"
      :data="currentRowData"
      :collapse="false"
      :column="2"
      border
    />
    <template #footer>
      <BaseButton @click="close">关闭</BaseButton>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { ElTag, ElLink } from 'element-plus'
import { Dialog } from '@/components/Dialog'
import { Descriptions } from '@/components/Descriptions'
import type { DescriptionsSchema } from '@/components/Descriptions'
import { BaseButton } from '@/components/Button'
import { formatToDateTime } from '@/utils/dateUtil'
import { formatToWan } from '@/utils'
import type { HostedOrder } from '@/api/trust_transaction/types'

const dialogVisible = ref(false)
const currentRowData = ref<HostedOrder | null>(null)

// --- Helper Functions (Copied from index.vue for consistency) ---
const getManageStatus = (status: number) => {
  switch (status) {
    case 1:
      return { text: '托管中', type: 'primary' as const }
    case 2:
      return { text: '已取消托管', type: 'info' as const }
    default:
      return { text: '未知', type: 'info' as const }
  }
}

const getHandleStatusText = (status: number) => {
  switch (status) {
    case 1:
      return '已代理'
    case 2:
      return '未代理'
    case 3:
      return '已补发'
    default:
      return '-'
  }
}

const getRecycleStatusText = (recycleTime: number) => {
  // Assuming recycle_time is a timestamp in seconds
  return recycleTime > 0 ? `已回收 (${formatToDateTime(recycleTime * 1000)})` : '待回收'
}

// Note: use project-wide formatter `formatToWan` from `src/utils`

// --- Descriptions Schema Definition ---
const detailSchema = computed<DescriptionsSchema[]>(() => {
  // 根据当前数据确定资源类型名称
  const data = currentRowData.value
  const resourceType = Number(data?.resource_type)
  const resourceName = resourceType === 2 ? '带宽' : '能量'

  return [
    { field: 'order_id', label: '订单ID' },
    { field: 'username', label: 'TG用户名', slots: { default: (data) => data.username || '-' } },
    { field: 'tg_id', label: 'TG用户ID' },
    { field: 'bot_name', label: '机器人名称', slots: { default: (data) => data.bot_name || '-' } },
    { field: 'tg_bot_id', label: '机器人ID' },
    {
      field: 'resource_type',
      label: '订单类型',
      slots: {
        default: (data) => {
          // resource_type: 1表示能量，2表示带宽
          const resourceType = Number(data?.resource_type || data.resource_type)
          const typeMap = {
            1: { text: '能量', type: 'success' },
            2: { text: '带宽', type: 'primary' }
          }
          const typeInfo = typeMap[resourceType] || { text: '未知', type: 'info' }
          return h(ElTag, { type: typeInfo.type }, () => typeInfo.text)
        }
      }
    },
    {
      field: 'manage_status',
      label: '托管状态',
      slots: {
        default: (data) => {
          const statusInfo = getManageStatus(data.manage_status)
          return h(ElTag, { type: statusInfo.type }, () => statusInfo.text)
        }
      }
    },
    {
      field: 'energy_num',
      label: `${resourceName}数量`,
      slots: {
        default: (data) => {
          const v = data?.energy_num
          if (v === null || v === undefined || v === '') return '0'
          return Number(v) >= 10000 ? formatToWan(v as any) : `${v}`
        }
      }
    },
    {
      field: 'energy_rent_text',
      label: `${resourceName}有效期`
    },
    {
      field: 'order_amount',
      label: '订单金额',
      slots: { default: (data) => `${data.order_amount || '0'}${data.pay_unit || ''}` }
    },
    {
      field: 'pay_amount',
      label: '扣款金额',
      slots: { default: (data) => `${data.pay_amount || '0'}${data.pay_unit || ''}` }
    },
    {
      field: 'delegate_status',
      label: '补充状态',
      slots: { default: (data) => getHandleStatusText(data.delegate_status) }
    },
    {
      field: 'describe',
      label: '描述',
      slots: { default: (data) => data.describe || '-' }
    },
    {
      field: 'create_time',
      label: '创建时间',
      slots: {
        default: (data) => (data.create_time ? formatToDateTime(data.create_time * 1000) : '-')
      }
    },
    {
      field: 'recycle_time',
      label: '回收时间',
      slots: {
        default: (data) => (data.recycle_time ? formatToDateTime(data.recycle_time * 1000) : '-')
      }
    },
    {
      field: 'finish_time',
      label: '完成时间',
      slots: {
        default: (data) => (data.finish_time ? formatToDateTime(data.finish_time * 1000) : '-')
      }
    },
    {
      field: 'recycle_time',
      label: '回收状态',
      slots: { default: (data) => getRecycleStatusText(data.recycle_time) }
    },
    {
      field: 'recycle_txid',
      label: '回收hash',
      span: 24,
      slots: {
        default: (data) =>
          h(
            ElLink,
            {
              type: 'primary',
              href: `${import.meta.env.VITE_TRONSCAN_URL}/#/transaction/${data.recycle_txid}`,
              target: '_blank'
            },
            () => data.recycle_txid || '-'
          )
      }
    },
    {
      field: 'address',
      label: `${resourceName}接收地址`,
      span: 24,
      slots: { default: (data) => data.address }
    },
    {
      field: 'txid',
      label: '交易hash',
      span: 24,
      slots: {
        default: (data) =>
          h(
            ElLink,
            {
              type: 'primary',
              href: `${import.meta.env.VITE_TRONSCAN_URL}/#/transaction/${data.txid}`,
              target: '_blank'
            },
            () => data.txid || '-'
          )
      }
    }
  ]
})

// --- Methods ---
const open = (rowData: HostedOrder) => {
  console.log('Opening detail modal with data:', rowData)
  currentRowData.value = rowData
  dialogVisible.value = true
}

const close = () => {
  dialogVisible.value = false
  currentRowData.value = null // 关闭时清除数据
}

defineExpose({
  open
})
</script>

<style scoped>
/* 如果需要，可以添加特定的样式 */
</style>
