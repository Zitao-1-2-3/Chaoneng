<script setup lang="ts">
import { computed, h, ref } from 'vue'
import { ElTag, ElLink } from 'element-plus'
import { Descriptions } from '@/components/Descriptions'
import type { DescriptionsSchema } from '@/components/Descriptions'
import { Table } from '@/components/Table'
import type { TableColumn } from '@/components/Table'
import { formatToDateTime } from '@/utils/dateUtil'
import isEmpty from 'lodash-es/isEmpty'

const props = defineProps({
  orderData: {
    type: Object,
    default: () => ({})
  },
  orderId: {
    type: [String, Number],
    required: true
  }
})

// 分页状态
const currentPage = ref(1)
const pageSize = ref(10)

// 从 orderData.resources 获取按笔数订单列表（所有数据）
const allCountOrderDetails = computed(() => {
  if (!props.orderData?.resources) return []

  // 过滤出能量类型的资源（code === 1）
  return props.orderData.resources
    .filter((item: any) => item.code === 1)
    .map((item: any) => ({
      to_address: item.target, // target → to_address
      status: getResourceStatus(item), // 根据资源状态计算
      create_time: item.created_at, // created_at → create_time（秒级时间戳）
      end_time: item.recycled_at || item.expirated_at, // recycled_at 或 expirated_at → end_time
      energy_txid: item.delegated_txid // delegated_txid → energy_txid
    }))
})

// 当前页显示的数据
const countOrderDetails = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return allCountOrderDetails.value.slice(start, end)
})

// 总数据量
const totalCount = computed(() => allCountOrderDetails.value.length)

// 根据资源状态计算显示状态
const getResourceStatus = (resource: any): number => {
  // 如果有交易hash，状态为已完成
  if (resource.delegated_txid) return 2

  // 否则为待使用
  return 1
}

const byCountDetailSchema = computed((): DescriptionsSchema[] => [
  {
    field: 'stroke_num',
    label: '租用笔数',
    slots: {
      default: () => h('span', {}, totalCount.value.toString())
    }
  },
  {
    field: 'price_trx',
    label: '能量TRX价格',
    slots: {
      default: (data: any) => {
        // 尝试从多个可能的字段获取价格
        const price = data.price_trx || data.stroke_ext?.price_trx || data.cost || '-'
        return h('span', {}, price.toString())
      }
    }
  },
  {
    field: 'price_usdt',
    label: '能量USDT价格',
    slots: {
      default: (data: any) => {
        // 尝试从多个可能的字段获取价格
        const price = data.price_usdt || data.stroke_ext?.price_usdt || '-'
        return h('span', {}, price.toString())
      }
    }
  }
])

const countOrderTableSchema = computed((): TableColumn[] => [
  {
    field: 'to_address',
    label: '地址',
    minWidth: 250,
    showOverflowTooltip: false // 地址全量显示，不截断
  },
  {
    field: 'status',
    label: '状态',
    width: 100,
    align: 'center',
    slots: {
      default: ({ row }) => {
        const status = Number(row.status)
        if (isNaN(status)) return h(ElTag, { type: 'info', size: 'small' }, () => '未知')
        return h(ElTag, { type: getCountStatusTagType(status), size: 'small' }, () =>
          getCountStatusText(status)
        )
      }
    }
  },
  {
    field: 'create_time',
    label: '创建时间',
    width: 180,
    formatter: (row) => (row.create_time ? formatToDateTime(row.create_time * 1000) : '-')
  },
  {
    field: 'end_time',
    label: '完成时间',
    width: 180,
    formatter: (row) => (row.end_time ? formatToDateTime(row.end_time * 1000) : '-')
  },
  {
    field: 'energy_txid',
    label: '交易hash',
    minWidth: 400,
    showOverflowTooltip: false, // 交易hash全量显示，不截断
    slots: {
      default: ({ row }) => {
        if (isEmpty(row?.energy_txid)) return h('span', '-')
        return h(
          ElLink,
          {
            href: `${import.meta.env.VITE_TRONSCAN_URL}/#/transaction/${row.energy_txid}`,
            type: 'primary',
            target: '_blank'
          },
          () => row.energy_txid
        )
      }
    }
  }
])

const getCountStatusText = (status: number): string => {
  const statusMap: Record<number, string> = {
    1: '待使用',
    2: '已完成'
  }
  return statusMap[status] ?? '未知'
}

const getCountStatusTagType = (status: number): 'success' | 'warning' | 'info' | 'danger' => {
  const typeMap: Record<number, 'success' | 'warning' | 'info' | 'danger'> = {
    1: 'success', // 待使用
    2: 'warning' // 已完成
  }
  return typeMap[status] ?? 'info'
}
</script>

<template>
  <div>
    <Descriptions :schema="byCountDetailSchema" :data="orderData" :column="2" border />
    <div class="mt-20px">
      <Table
        :columns="countOrderTableSchema"
        :data="countOrderDetails"
        :border="true"
        :showOverflowTooltip="true"
        :pagination="{
          total: totalCount,
          currentPage: currentPage,
          pageSize: pageSize,
          layout: 'total, sizes, prev, pager, next, jumper'
        }"
        @update:current-page="(page) => (currentPage = page)"
        @update:page-size="
          (size) => {
            pageSize = size
            currentPage = 1
          }
        "
      />
    </div>
  </div>
</template>
