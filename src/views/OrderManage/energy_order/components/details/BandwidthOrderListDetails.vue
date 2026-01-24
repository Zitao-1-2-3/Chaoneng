<script setup lang="ts">
import { ref, computed, watch, h, onMounted } from 'vue'
import { ElTag, ElLink } from 'element-plus'
import { Descriptions } from '@/components/Descriptions'
import type { DescriptionsSchema } from '@/components/Descriptions'
import { Table } from '@/components/Table'
import type { TableColumn } from '@/components/Table'
import { formatToDateTime } from '@/utils/dateUtil'
import { getBandwidthOrderListApi } from '@/api/energy_order'
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

// Helper function for formatting date/time
const formatDisplayDateTime = (dateValue) => {
  if (!dateValue || dateValue === 0) return '-'
  const timestamp = Number(dateValue)
  if (!isNaN(timestamp) && timestamp > 0) {
    const dateToFormat = timestamp * 1000
    try {
      return formatToDateTime(dateToFormat)
    } catch (e) {
      console.error('Error formatting date:', dateValue, e)
      return '日期无效'
    }
  }
  return '-'
}

// 带宽订单列表
const bandwidthList = ref<any[]>([])
const bandwidthLoading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const apiTotalCount = ref(0)

const bandwidthDetailSchema = computed((): DescriptionsSchema[] => [
  {
    field: 'stock_num',
    label: '租用笔数',
    slots: {
      default: () => h('span', {}, bandwidthList.value.length.toString())
    }
  }
])

const bandwidthTableSchema = computed((): TableColumn[] => [
  { type: 'index', label: '序号', width: 60, align: 'center', field: 'index' },
  { field: 'to_address', label: '地址', minWidth: 180 },
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
          2: '已使用',
          3: '已过期'
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
    width: 160,
    formatter: (row: any) => formatDisplayDateTime(row.create_time)
  },
  {
    field: 'end_time',
    label: '完成时间',
    width: 160,
    formatter: (row: any) => formatDisplayDateTime(row.end_time)
  },
  {
    field: 'bandwidth_txid',
    label: '交易hash',
    minWidth: 280,
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
    width: 280,
    type: 'link',
    showOverflowTooltip: true,
    url: (row) => `${import.meta.env.VITE_TRONSCAN_URL}/#/transaction/${row.recycle_txid}`
  }
])

// 获取带宽订单列表（使用 /v1/order/bandwidth_order/list）
const fetchBandwidthList = async () => {
  if (!props.orderId) {
    return
  }
  bandwidthLoading.value = true
  try {
    const response = await getBandwidthOrderListApi({
      order_id: props.orderId,
      currentPage: currentPage.value,
      pageSize: pageSize.value
    })
    if (response && (response as any).data) {
      const data = (response as any).data
      bandwidthList.value = data.list || []
      apiTotalCount.value = data.totalCount || data.total || 0
    } else {
      bandwidthList.value = []
      apiTotalCount.value = 0
    }
  } catch (e) {
    bandwidthList.value = []
    apiTotalCount.value = 0
  } finally {
    bandwidthLoading.value = false
  }
}

watch([currentPage, pageSize], () => {
  fetchBandwidthList()
})

watch(
  () => props.orderId,
  (newId) => {
    if (newId) {
      currentPage.value = 1
      fetchBandwidthList()
    }
  },
  { immediate: true }
)

onMounted(() => {
  if (props.orderId) fetchBandwidthList()
})
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
      :loading="bandwidthLoading"
      :pagination="{
        total: apiTotalCount,
        currentPage: currentPage,
        pageSize: pageSize,
        layout: 'total, sizes, prev, pager, next, jumper'
      }"
      @page-change="
        (page, size) => {
          currentPage = page
          pageSize = size
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
