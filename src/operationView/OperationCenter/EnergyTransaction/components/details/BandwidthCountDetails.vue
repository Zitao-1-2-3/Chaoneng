<script setup lang="ts">
import { ref, computed, watch, h, onMounted } from 'vue'
import { ElTag, ElTable, ElTableColumn, ElMessage } from 'element-plus'
import { Descriptions } from '@/components/Descriptions'
import type { DescriptionsSchema } from '@/components/Descriptions'
import { Table } from '@/components/Table'
import type { TableColumn } from '@/components/Table'
import { formatToDateTime } from '@/utils/dateUtil'
// 导入带宽相关的API函数
import { getBandwidthCountListApi } from '@/api/energy_transaction'
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
      default: (data) => {
        // 当订单类型为7、8、9时，租用笔数显示为列表长度
        const orderType = Number(data?.order_type)
        if (orderType === 7 || orderType === 8 || orderType === 9) {
          return h('span', `${bandwidthCountDetails.value.length} 笔`)
        }
        return h('span', `${data?.stroke_num ?? '-'} 笔`)
      }
    }
  },
  {
    field: 'stroke_ext.price_trx',
    label: '笔数单价',
    slots: {
      default: (data) => {
        // 当订单类型为7、8、9时，笔数单价固定为0TRX
        const orderType = Number(data?.order_type)
        if (orderType === 7 || orderType === 8 || orderType === 9) {
          return h('span', '0 TRX')
        }
        return h('span', `${data?.stroke_ext?.price_trx ?? '-'} TRX`)
      }
    }
  }
])

// 子列表表格列 Schema
const bandwidthCountTableSchema = computed((): TableColumn[] => [
  { type: 'index', label: '序号', align: 'center', field: 'index' },
  {
    prop: 'to_address',
    field: 'to_address',
    label: '地址',
    minWidth: 180
  },
  {
    prop: 'status',
    field: 'status',
    label: '状态',
    align: 'center',
    slots: {
      default: ({ row }) => {
        const status = Number(row.status)
        if (isNaN(status)) return h(ElTag, { type: 'info', size: 'small' }, () => '未知')
        return h(ElTag, { type: getBandwidthStatusTagType(status), size: 'small' }, () =>
          getBandwidthStatusText(status)
        )
      }
    }
  },
  {
    prop: 'create_time',
    field: 'create_time',
    label: '创建时间',
    formatter: (row) => formatDisplayDateTime(row.create_time)
  },
  {
    prop: 'end_time',
    field: 'end_time',
    label: '完成时间',
    formatter: (row) => formatDisplayDateTime(row.end_time)
  },
  {
    field: 'bandwidth_txid',
    label: '交易hash',
    width: 280,
    type: 'link',
    showOverflowTooltip: true,
    url: (row) => `${import.meta.env.VITE_TRONSCAN_URL}/#/transaction/${row.bandwidth_txid}`
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

// 状态文本辅助函数
const getBandwidthStatusText = (status: number): string => {
  const statusMap: Record<number, string> = { 1: '待使用', 2: '已使用', 3: '已过期' }
  return statusMap[status] ?? '未知'
}

// 状态标签类型辅助函数
const getBandwidthStatusTagType = (status: number): 'success' | 'warning' | 'info' | 'danger' => {
  const typeMap: Record<number, 'success' | 'warning' | 'info' | 'danger'> = {
    1: 'success',
    2: 'warning',
    3: 'danger'
  }
  return typeMap[status] ?? 'info'
}

// 获取带宽按笔数详情
const fetchBandwidthCountDetails = async () => {
  if (!props.orderId) {
    bandwidthCountDetails.value = []
    apiTotalCount.value = 0
    console.warn('BandwidthCountDetails: orderId prop is missing.')
    return
  }
  bandwidthCountLoading.value = true
  bandwidthCountDetails.value = []
  try {
    const params = {
      current_page: bandwidthCurrentPage.value,
      page_size: bandwidthPageSize.value
    }
    const response: any = await getBandwidthCountListApi(props.orderId, params as any)
    console.log('BandwidthCountDetails API response:', response)

    if (response && response.code === '000000' && response.data) {
      const data: any = response.data
      if (Array.isArray(data.list)) {
        bandwidthCountDetails.value = data.list
        apiTotalCount.value = data.totalCount
        if (bandwidthCountDetails.value.length === 0 && bandwidthCurrentPage.value > 1) {
          bandwidthCurrentPage.value--
          fetchBandwidthCountDetails()
        }
      } else {
        bandwidthCountDetails.value = []
        apiTotalCount.value = 0
      }
    } else {
      const errorMessage = response?.msg || '获取带宽按笔数列表失败'
      ElMessage.error(errorMessage)
      bandwidthCountDetails.value = []
      apiTotalCount.value = 0
    }
  } catch (error: any) {
    ElMessage.error(error?.message || '请求失败，请稍后重试')
    bandwidthCountDetails.value = []
    apiTotalCount.value = 0
  } finally {
    bandwidthCountLoading.value = false
  }
}

// 分页处理
const handleBandwidthPageChange = (page: number) => {
  if (bandwidthCurrentPage.value !== page) {
    bandwidthCurrentPage.value = page
    fetchBandwidthCountDetails()
  }
}

const handleBandwidthSizeChange = (size: number) => {
  if (bandwidthPageSize.value !== size) {
    bandwidthPageSize.value = size
    if (bandwidthCurrentPage.value !== 1) {
      bandwidthCurrentPage.value = 1
    }
    fetchBandwidthCountDetails()
  }
}

watch(
  () => props.orderId,
  (newId, oldId) => {
    if (newId !== oldId && newId) {
      if (bandwidthCurrentPage.value !== 1) {
        bandwidthCurrentPage.value = 1
      }
      fetchBandwidthCountDetails()
    }
  }
)

onMounted(() => {
  fetchBandwidthCountDetails()
})
</script>

<template>
  <div>
    <!-- 先显示描述信息 -->
    <Descriptions :schema="bandwidthCountDetailSchema" :data="orderData" :column="2" border />

    <!-- 如果有子列表，显示表格 -->
    <div class="mt-20px">
      <Table
        :columns="bandwidthCountTableSchema"
        :data="bandwidthCountDetails"
        :loading="bandwidthCountLoading"
        :border="true"
        :showOverflowTooltip="true"
        :pagination="{
          total: apiTotalCount,
          currentPage: bandwidthCurrentPage,
          pageSize: bandwidthPageSize
        }"
        @update:current-page="handleBandwidthPageChange"
        @update:page-size="handleBandwidthSizeChange"
      />
    </div>
  </div>
</template>

<style scoped>
/* Add component-specific styles if needed */
</style>
