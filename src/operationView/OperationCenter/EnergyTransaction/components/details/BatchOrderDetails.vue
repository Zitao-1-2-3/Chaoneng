<script setup lang="tsx">
import { ref, computed, watch, h, onMounted } from 'vue'
import { ElTag, ElLink, ElButton, ElTable, ElTableColumn, ElMessage } from 'element-plus'
import { Dialog } from '@/components/Dialog'
import { Descriptions } from '@/components/Descriptions'
import type { DescriptionsSchema } from '@/components/Descriptions'
import { Table } from '@/components/Table'
import type { TableColumn } from '@/components/Table'
import { formatToDateTime } from '@/utils/dateUtil'
import { getBatchActiveListApi } from '@/api/energy_transaction'
import isEmpty from 'lodash-es/isEmpty'
import { formatToWan } from '@/utils'
// Helper function for creating TronScan links (kept in case needed later)
const renderTxidLink = (txid: string | null | undefined, label = '交易hash') => {
  if (isEmpty(txid)) return h('span', '-')
  return h(
    ElLink,
    {
      href: `${import.meta.env.VITE_TRONSCAN_URL}/#/transaction/${txid}`,
      type: 'primary',
      target: '_blank'
    },
    () => txid
  )
}

const props = defineProps({
  orderData: {
    type: Object as () => any | null,
    default: () => null
  }
})

// --- Component State ---
const batchOrderItems = ref<any[]>([])
const batchOrderLoading = ref(false)
const batchOrderCurrentPage = ref(1)
const batchOrderPageSize = ref(10)
const batchOrderTotal = ref(0)
const batchItemDialogVisible = ref(false)
const selectedBatchItem = ref<any>(null)

// --- Status Maps (Define based on potential values) ---
const statusMap: Record<number, string> = { 1: '已完成' }
const statusColorMap: Record<number, string> = { 1: 'success' }
const activeStatusMap: Record<number, string> = { 1: '未激活', 2: '已激活' }
const activeStatusColorMap: Record<number, string> = { 1: 'warning', 2: 'success' }
const handleStatusMap: Record<number, string> = { 1: '成功', 2: '失败' }
const handleStatusColorMap: Record<number, string> = { 1: 'success', 2: 'danger' }
const delegateStatusMap: Record<number, string> = { 1: '已委托', 2: '未委托' }
const delegateStatusColorMap: Record<number, string> = { 1: 'success', 2: 'info' }

const getStatusTag = (field: string, value: number) => {
  let text = '-'
  let type: any = 'info' // Use string type for broader compatibility
  const numValue = Number(value)
  if (isNaN(numValue)) return h(ElTag, { type, size: 'small' }, () => text)

  switch (field) {
    case 'status': // Assuming 'status' is the field for 交易状态
      text = statusMap[numValue] || text
      type = statusColorMap[numValue] || type
      break
    // Add cases for other status fields if needed
  }
  return h(ElTag, { type, size: 'small' }, () => text)
}

// --- Fetch Batch Order Items ---
const fetchBatchOrderItems = async () => {
  if (!props.orderData?.id) {
    batchOrderItems.value = []
    batchOrderTotal.value = 0
    console.warn('BatchOrderDetails: orderData or orderData.id is missing.')
    return
  }
  batchOrderLoading.value = true
  try {
    const params = {
      current_page: batchOrderCurrentPage.value,
      page_size: batchOrderPageSize.value
    }

    // Call API with order_id as first argument and params as second
    // Cast params to 'any' to bypass the PageParams type check
    const response: any = await getBatchActiveListApi(props.orderData.id, params as any)
    console.log('BatchOrderDetails API response:', response)

    // Treat response as 'any' to access properties directly
    if (response && response.code === '000000' && response.data) {
      const data: any = response.data
      // Backend might return list/total or list/totalCount
      const list = data.list || []
      const total =
        data.total !== undefined ? data.total : data.totalCount !== undefined ? data.totalCount : 0

      batchOrderItems.value = Array.isArray(list) ? list : []
      batchOrderTotal.value = Number(total) || 0

      if (!Array.isArray(list)) {
        console.warn('getBatchActiveListApi response.data.list is not an array', response)
      }
    } else {
      // Access msg directly from 'any' type response
      const errorMessage = response?.msg || '获取批量下单列表失败'
      console.error('Failed to fetch batch list:', errorMessage, response)
      ElMessage.error(errorMessage)
      batchOrderItems.value = []
      batchOrderTotal.value = 0
    }
  } catch (error: any) {
    console.error('Error during fetchBatchOrderItems:', error)
    ElMessage.error(error?.message || '获取批量下单列表请求失败')
    batchOrderItems.value = []
    batchOrderTotal.value = 0
  } finally {
    batchOrderLoading.value = false
  }
}

// --- Pagination Handlers (no changes needed) ---
const handleBatchOrderPageChange = (newPage: number) => {
  if (batchOrderCurrentPage.value !== newPage) {
    batchOrderCurrentPage.value = newPage
    fetchBatchOrderItems()
  }
}

const handleBatchOrderSizeChange = (newSize: number) => {
  if (batchOrderPageSize.value !== newSize) {
    batchOrderPageSize.value = newSize
    if (batchOrderCurrentPage.value !== 1) {
      batchOrderCurrentPage.value = 1
    }
    fetchBatchOrderItems()
  }
}

// Placeholder for the action button handler
const handleViewDetail = (row: any) => {
  selectedBatchItem.value = row // Store selected row data
  batchItemDialogVisible.value = true // Open the dialog
}

// --- Table Columns Definition (Aligned with Screenshot) ---
const batchOrderTableColumns = ref<TableColumn[]>([
  { type: 'index', label: '序号', width: 60, align: 'center', field: 'index' },
  {
    prop: 'to_address',
    field: 'to_address',
    label: '地址',
    minWidth: 180
  },
  {
    prop: 'energy_price',
    field: 'energy_price',
    label: '能量单价',
    width: 100,
    formatter: (row) => row.energy_price ?? '-' // From sample data
  },
  {
    // !! 需要确认此字段 !! 使用 addr_energy_num 作为占位符 (from sample data)
    prop: 'addr_energy_num',
    field: 'addr_energy_num',
    label: '能量数',
    width: 100,
    formatter: (row) => (row.addr_energy_num == 0 ? '-' : formatToWan(row.addr_energy_num)) // From sample data
  },
  {
    prop: 'active_price',
    field: 'active_price',
    label: '激活单价',
    width: 100,
    formatter: (row) => (row.active_price == 0 ? '-' : row.active_price) // From sample data
  },
  {
    // !! 需要确认此字段 !! 使用 status 作为占位符 (from sample data)
    prop: 'status',
    field: 'status',
    label: '交易状态',
    width: 100,
    align: 'center',
    slots: { default: ({ row }) => getStatusTag('status', row.status) }
  },
  {
    prop: 'handle_status',
    field: 'handle_status',
    label: '回收状态',
    width: 100,
    align: 'center',
    formatter: (row) => {
      if (row.handle_status === 1) {
        return h(ElTag, { type: 'success', size: 'small' }, () => '已处理')
      } else if (row.handle_status === 2) {
        return h(ElTag, { type: 'info', size: 'small' }, () => '未处理')
      } else if (row.handle_status === 3) {
        return h(ElTag, { type: 'danger', size: 'small' }, () => '处理失败')
      }
      return h(ElTag, { type: 'info', size: 'small' }, () => '-')
    }
  },
  {
    prop: 'order_amount',
    field: 'order_amount',
    label: '扣款金额',
    width: 100,
    formatter: (row) => row.order_amount ?? '-' // From sample data
  },
  {
    // !! 需要确认此字段 !! 使用 create_time 作为占位符 (from sample data)
    prop: 'create_time',
    field: 'create_time',
    label: '激活时间',
    width: 160,
    formatter: (row) => (row.create_time == 0 ? '-' : formatToDateTime(row.create_time))
  },
  {
    prop: 'finish_time',
    field: 'finish_time',
    label: '完成时间',
    width: 160,
    formatter: (row) => (row.finish_time == 0 ? '-' : formatToDateTime(row.finish_time)) // From sample data
  },
  {
    prop: 'action',
    field: 'action',
    label: '操作',
    width: 120,
    align: 'center',
    fixed: 'right',
    slots: {
      default: ({ row }) => {
        return h(
          ElButton,
          { link: true, type: 'primary', size: 'small', onClick: () => handleViewDetail(row) },
          () => '交易详情'
        )
      }
    }
  }
])

// --- Updated Schema for the Detail Dialog (Based on reference file) ---
const batchItemDetailSchema = computed((): DescriptionsSchema[] => [
  {
    field: 'txid', // Field from reference
    label: '激活交易hash', // Label from reference
    span: 24,
    slots: { default: (data) => renderTxidLink(data?.txid) } // Use link renderer
  },
  {
    field: 'energy_txid', // Field from reference
    label: '能量交易hash', // Label from reference
    span: 24,
    slots: { default: (data) => renderTxidLink(data?.energy_txid) } // Use link renderer
  },
  {
    field: 'recycle_txid', // Field from reference
    label: '回收hash', // Label from reference
    span: 24,
    slots: { default: (data) => renderTxidLink(data?.recycle_txid) } // Use link renderer
  },
  {
    field: 'from_address', // Field from reference
    label: '发起地址',
    span: 24
  },
  {
    field: 'to_address', // Field from reference
    label: '接收地址',
    span: 24
  },
  {
    field: 'status', // Field from reference
    label: '交易状态',
    span: 24,
    slots: { default: (data) => getStatusTag('status', data?.status) } // Use status tag renderer
  },
  {
    field: 'handle_status', // Field from reference
    label: '回收状态',
    span: 24,
    slots: {
      default: (data) => {
        if (data?.handle_status === 1) {
          return h(ElTag, { type: 'success', size: 'small' }, () => '已处理')
        } else if (data?.handle_status === 2) {
          return h(ElTag, { type: 'info', size: 'small' }, () => '未处理')
        } else if (data?.handle_status === 3) {
          return h(ElTag, { type: 'danger', size: 'small' }, () => '处理失败')
        }
        return h(ElTag, { type: 'info', size: 'small' }, () => '-')
      }
    } // Use status tag renderer
  },
  {
    field: 'finish_time', // Field from reference
    label: '完成时间',
    span: 24,
    slots: {
      // Use slot and h() for consistency
      default: (data) => {
        return h('span', data?.finish_time == 0 ? '-' : formatToDateTime(data?.finish_time))
      }
    }
    // formatter: (data) => formatToDateTime(data?.finish_time) // Removed formatter
  }
])

// --- Watchers and Lifecycle Hooks ---
watch(
  () => props.orderData,
  (newData, oldData) => {
    if (newData && newData.id && newData.id !== oldData?.id) {
      if (batchOrderCurrentPage.value !== 1) {
        batchOrderCurrentPage.value = 1
      }
      fetchBatchOrderItems()
    } else if (!newData || !newData.id) {
      batchOrderItems.value = []
      batchOrderTotal.value = 0
    }
  },
  { immediate: true }
)

onMounted(() => {
  if (props.orderData?.id) {
    fetchBatchOrderItems()
  }
})
</script>

<template>
  <div>
    <!-- 先显示顶层批量信息 -->
    <!-- <Descriptions :schema="batchOrderSchema" :data="orderData" :column="3" border /> -->

    <!-- 显示子项表格 -->
    <div class="mt-20px">
      <Table
        :columns="batchOrderTableColumns"
        :data="batchOrderItems"
        :loading="batchOrderLoading"
        :border="true"
        :showOverflowTooltip="true"
        :pagination="{
          total: batchOrderTotal,
          currentPage: batchOrderCurrentPage,
          pageSize: batchOrderPageSize
        }"
        @update:current-page="handleBatchOrderPageChange"
        @update:page-size="handleBatchOrderSizeChange"
        :style="{ width: '100%' }"
      />
    </div>

    <!-- Add Batch Item Detail Dialog -->
    <Dialog v-model="batchItemDialogVisible" title="交易详情">
      <Descriptions
        v-if="selectedBatchItem"
        :schema="batchItemDetailSchema"
        :data="selectedBatchItem"
        :column="1"
        border
      />
      <!-- Fallback if data is missing -->
      <div v-else>加载详情中...</div>
      <template #footer>
        <ElButton @click="batchItemDialogVisible = false">关闭</ElButton>
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
/* Add component-specific styles if needed */
.mt-20px {
  /* Ensure margin is defined if class is used */
  margin-top: 20px;
}
</style>
