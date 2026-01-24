<script setup lang="ts">
import { ref, computed, watch, h, onMounted } from 'vue'
import { ElTag, ElLink } from 'element-plus'
import { Descriptions } from '@/components/Descriptions'
import type { DescriptionsSchema } from '@/components/Descriptions'
import { Table } from '@/components/Table'
import type { TableColumn } from '@/components/Table'
import { formatToDateTime } from '@/utils/dateUtil'
import { getByCountDetailApi } from '@/api/energy_order'
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

// 带宽按笔数详情列表
const bandwidthCountDetails = ref<any[]>([])
const bandwidthCountLoading = ref(false)
const bandwidthCurrentPage = ref(1)
const bandwidthPageSize = ref(10)
const apiTotalCount = ref(0)

// 带宽按笔数特定的描述信息 Schema
const bandwidthCountDetailSchema = computed((): DescriptionsSchema[] => [
  {
    field: 'stock_num',
    label: '租用笔数',
    slots: {
      default: () => h('span', {}, bandwidthCountDetails.value.length.toString())
    }
  }
])

// 带宽按笔数详情表格 Schema
const bandwidthCountTableSchema = computed((): TableColumn[] => [
  { type: 'index', label: '序号', width: 60, align: 'center', field: 'index' },
  { field: 'to_address', label: '地址', minWidth: 180 },
  {
    field: 'status',
    label: '状态',
    width: 80,
    slots: {
      default: ({ row }: any) => {
        const statusColorMap: Record<number, 'success' | 'warning' | 'danger' | 'info'> = {
          1: 'success', // 已完成
          2: 'warning', // 进行中
          3: 'danger' // 失败
        }
        const statusTextMap: Record<number, string> = {
          1: '已完成',
          2: '进行中',
          3: '失败'
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
    field: 'energy_txid',
    label: '交易hash',
    minWidth: 280,
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

// 获取带宽按笔数详情
const fetchBandwidthCountDetails = async () => {
  if (!props.orderId) {
    return
  }

  bandwidthCountLoading.value = true
  try {
    const response = await getByCountDetailApi(props.orderId, {
      currentPage: bandwidthCurrentPage.value,
      pageSize: bandwidthPageSize.value
    })

    if (response && response.code === '000000' && response.data) {
      bandwidthCountDetails.value = response.data.list || []
      apiTotalCount.value = response.data.totalCount || 0
    } else {
      bandwidthCountDetails.value = []
      apiTotalCount.value = 0
    }
  } catch (error) {
    bandwidthCountDetails.value = []
    apiTotalCount.value = 0
  } finally {
    bandwidthCountLoading.value = false
  }
}

// 监听分页变化
watch([bandwidthCurrentPage, bandwidthPageSize], () => {
  fetchBandwidthCountDetails()
})

// 监听 orderId 变化
watch(
  () => props.orderId,
  (newOrderId) => {
    if (newOrderId) {
      bandwidthCurrentPage.value = 1 // 重置到第一页
      fetchBandwidthCountDetails()
    }
  },
  { immediate: true }
)

// 初始化时获取数据
onMounted(() => {
  if (props.orderId) {
    fetchBandwidthCountDetails()
  }
})
</script>

<template>
  <div class="bandwidth-count-details">
    <!-- 带宽按笔数详情描述 -->
    <Descriptions
      :schema="bandwidthCountDetailSchema"
      :data="orderData"
      :column="2"
      border
      class="mb-4"
    />

    <!-- 带宽按笔数详情表格 -->
    <Table
      :columns="bandwidthCountTableSchema"
      :data="bandwidthCountDetails"
      :loading="bandwidthCountLoading"
      :pagination="{
        total: apiTotalCount,
        currentPage: bandwidthCurrentPage,
        pageSize: bandwidthPageSize,
        layout: 'total, sizes, prev, pager, next, jumper'
      }"
      @page-change="
        (page, size) => {
          bandwidthCurrentPage = page
          bandwidthPageSize = size
        }
      "
    />
  </div>
</template>

<style scoped>
.bandwidth-count-details {
  width: 100%;
}
</style>
