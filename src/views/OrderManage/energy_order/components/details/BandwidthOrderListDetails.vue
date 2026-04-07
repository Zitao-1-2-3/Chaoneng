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
    type: Object as () => any | null,
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

// Helper function for formatting date/time
const formatDisplayDateTime = (dateValue: any) => {
  if (!dateValue || dateValue === 0) return '-'
  const timestamp = Number(dateValue)
  if (!isNaN(timestamp) && timestamp > 0) {
    // 如果是秒级时间戳，转换为毫秒
    const dateToFormat = timestamp < 10000000000 ? timestamp * 1000 : timestamp
    try {
      return formatToDateTime(dateToFormat)
    } catch (e) {
      console.error('Error formatting date:', dateValue, e)
      return '日期无效'
    }
  }
  return '-'
}

// 从 orderData.resources 获取带宽订单列表（所有数据）
const allBandwidthList = computed(() => {
  if (!props.orderData?.resources) return []

  // 过滤出带宽类型的资源（code === 2）
  return props.orderData.resources
    .filter((item: any) => item.code === 2)
    .map((item: any) => ({
      to_address: item.target, // target → to_address
      status: getResourceStatus(item), // 根据资源状态计算
      create_time: item.created_at, // created_at → create_time
      end_time: item.recycled_at || item.expirated_at, // recycled_at 或 expirated_at → end_time
      bandwidth_txid: item.delegated_txid, // delegated_txid → bandwidth_txid
      recycle_txid: item.recycled_txid // recycled_txid → recycle_txid
    }))
})

// 当前页显示的数据
const bandwidthList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return allBandwidthList.value.slice(start, end)
})

// 总数据量
const totalCount = computed(() => allBandwidthList.value.length)

// 根据资源状态计算显示状态
const getResourceStatus = (resource: any): number => {
  // 如果有交易hash，状态为已完成
  if (resource.delegated_txid) return 2

  // 否则为待使用
  return 1
}

const bandwidthDetailSchema = computed((): DescriptionsSchema[] => [
  {
    field: 'stock_num',
    label: '租用笔数',
    slots: {
      default: () => h('span', {}, totalCount.value.toString())
    }
  }
])

const bandwidthTableSchema = computed((): TableColumn[] => [
  {
    field: 'to_address',
    label: '地址',
    minWidth: 250,
    showOverflowTooltip: false // 地址全量显示，不截断
  },
  {
    field: 'status',
    label: '状态',
    width: 80,
    slots: {
      default: ({ row }: any) => {
        const statusColorMap: Record<number, 'success' | 'warning' | 'danger' | 'info'> = {
          1: 'success',
          2: 'warning',
          3: 'danger'
        }
        const statusTextMap: Record<number, string> = {
          1: '待使用',
          2: '已完成'
        }
        const tagType = statusColorMap[row.status] || 'info'
        const text = statusTextMap[row.status] || '未知'
        return h(ElTag, { type: tagType, size: 'small' }, () => text)
      }
    }
  },
  {
    field: 'create_time',
    label: '创建时间',
    width: 180,
    formatter: (row: any) => formatDisplayDateTime(row.create_time)
  },
  {
    field: 'end_time',
    label: '完成时间',
    width: 180,
    formatter: (row: any) => formatDisplayDateTime(row.end_time)
  },
  {
    field: 'bandwidth_txid',
    label: '交易hash',
    minWidth: 400,
    showOverflowTooltip: false, // 交易hash全量显示，不截断
    slots: {
      default: ({ row }) => {
        if (isEmpty(row?.bandwidth_txid)) return h('span', '-')
        return h(
          ElLink,
          {
            href: `${import.meta.env.VITE_TRONSCAN_URL}/#/transaction/${row.bandwidth_txid}`,
            type: 'primary',
            target: '_blank'
          },
          () => row.bandwidth_txid
        )
      }
    }
  },
  {
    field: 'recycle_txid',
    label: '回收hash',
    minWidth: 400,
    showOverflowTooltip: false, // 回收hash全量显示，不截断
    slots: {
      default: ({ row }) => {
        if (isEmpty(row?.recycle_txid)) return h('span', '-')
        return h(
          ElLink,
          {
            href: `${import.meta.env.VITE_TRONSCAN_URL}/#/transaction/${row.recycle_txid}`,
            type: 'primary',
            target: '_blank'
          },
          () => row.recycle_txid
        )
      }
    }
  }
])
</script>

<template>
  <div class="bandwidth-order-list">
    <Descriptions
      :schema="bandwidthDetailSchema"
      :data="orderData"
      :column="2"
      border
      class="mb-4"
    />

    <Table
      :columns="bandwidthTableSchema"
      :data="bandwidthList"
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
</template>

<style scoped>
.bandwidth-order-list {
  width: 100%;
}
</style>
