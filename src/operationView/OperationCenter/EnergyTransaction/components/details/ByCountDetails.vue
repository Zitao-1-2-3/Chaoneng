<script setup lang="ts">
import { ref, computed, watch, h, onMounted } from 'vue'
import { ElTag, ElTable, ElTableColumn, ElMessage } from 'element-plus'
import { Descriptions } from '@/components/Descriptions'
import type { DescriptionsSchema } from '@/components/Descriptions'
import { Table } from '@/components/Table'
import type { TableColumn } from '@/components/Table'
import { formatToDateTime } from '@/utils/dateUtil'
// 修改：导入真实的（占位的）API 函数
import { getEnergyCountListApi } from '@/api/energy_transaction'
import isEmpty from 'lodash-es/isEmpty'
// import { getByCountDetailApi } from '@/api/energy_order' // Reverted

// Helper function for formatting date/time
const formatDisplayDateTime = (dateValue) => {
  // Reference file multiplies by 1000, assuming seconds timestamp
  if (!dateValue || dateValue === 0) return '-'
  const timestamp = Number(dateValue)
  if (!isNaN(timestamp) && timestamp > 0) {
    // Assuming seconds timestamp based on reference file
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

// 修改：明确子列表类型
const countOrderDetails = ref<any[]>([])
const countOrderLoading = ref(false)
const countCurrentPage = ref(1)
const countPageSize = ref(10)
const apiTotalCount = ref(0)

// 按笔数特定的描述信息 Schema (保持不变，仍需确认字段)
const byCountDetailSchema = computed((): DescriptionsSchema[] => [
  {
    field: 'stock_num',
    label: '租用笔数',
    slots: {
      default: (data) => h('span', `${data?.stroke_num ?? '-'} 笔`)
    }
  },
  {
    field: 'stroke_ext.price_trx',
    label: '笔数单价',
    slots: {
      default: (data) => h('span', `${data?.stroke_ext?.price_trx ?? '-'} TRX`)
    }
  }
])

// 子列表表格列 Schema (移除 width 属性)
const countOrderTableSchema = computed((): TableColumn[] => [
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
        return h(ElTag, { type: getCountStatusTagType(status), size: 'small' }, () =>
          getCountStatusText(status)
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
    field: 'energy_txid',
    label: '交易hash',
    width: 280,
    type: 'link',
    showOverflowTooltip: true,
    url: (row) => `${import.meta.env.VITE_TRONSCAN_URL}/#/transaction/${row.energy_txid}`
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

// 状态文本辅助函数 (保持不变，仍需确认状态值)
const getCountStatusText = (status: number): string => {
  const statusMap: Record<number, string> = { 1: '待使用', 2: '已使用', 3: '已过期' }
  return statusMap[status] ?? '未知'
}

// 状态标签类型辅助函数 (保持不变，仍需确认状态值)
const getCountStatusTagType = (status: number): 'success' | 'warning' | 'info' | 'danger' => {
  const typeMap: Record<number, 'success' | 'warning' | 'info' | 'danger'> = {
    1: 'success',
    2: 'warning',
    3: 'danger'
  }
  return typeMap[status] ?? 'info'
}

// 修改：调用真实的（占位的）API 函数
const fetchCountOrderDetails = async () => {
  if (!props.orderId) {
    countOrderDetails.value = []
    apiTotalCount.value = 0
    console.warn('ByCountDetails (operationView): orderId prop is missing.')
    return
  }
  countOrderLoading.value = true
  countOrderDetails.value = []
  try {
    // !! Use current_page and page_size !!
    const params = {
      current_page: countCurrentPage.value,
      page_size: countPageSize.value
    }
    // !! Using getEnergyCountListApi !!
    const response: any = await getEnergyCountListApi(props.orderId, params as any) // Use 'any' for params type
    console.log('ByCountDetails (operationView) API response:', response)

    // Process response (assuming same structure as before)
    if (response && response.code === '000000' && response.data) {
      const data: any = response.data // Treat data as any
      if (Array.isArray(data.list)) {
        countOrderDetails.value = data.list
        apiTotalCount.value = data.totalCount
        if (countOrderDetails.value.length === 0 && countCurrentPage.value > 1) {
          // 处理边缘情况：如果当前页没有数据，但不是第一页，回到上一页
          countCurrentPage.value--
          fetchCountOrderDetails()
        }
      } else {
        countOrderDetails.value = []
        apiTotalCount.value = 0
      }
    } else {
      const errorMessage = response?.msg || '获取按笔数列表失败'
      ElMessage.error(errorMessage)
      countOrderDetails.value = []
      apiTotalCount.value = 0
    }
  } catch (error: any) {
    ElMessage.error(error?.message || '请求失败，请稍后重试')
    countOrderDetails.value = []
    apiTotalCount.value = 0
  } finally {
    countOrderLoading.value = false
  }
}

// 分页处理 (保持不变)
const handleCountPageChange = (page: number) => {
  if (countCurrentPage.value !== page) {
    countCurrentPage.value = page
    fetchCountOrderDetails()
  }
}

const handleCountSizeChange = (size: number) => {
  if (countPageSize.value !== size) {
    countPageSize.value = size
    if (countCurrentPage.value !== 1) {
      countCurrentPage.value = 1
    }
    fetchCountOrderDetails()
  }
}

// watch 和 onMounted (保持不变)
watch(
  () => props.orderId,
  (newId, oldId) => {
    if (newId !== oldId && newId) {
      if (countCurrentPage.value !== 1) {
        countCurrentPage.value = 1
      }
      fetchCountOrderDetails()
    }
  }
)

onMounted(() => {
  fetchCountOrderDetails()
})
</script>

<template>
  <div>
    <!-- 先显示描述信息 -->
    <Descriptions :schema="byCountDetailSchema" :data="orderData" :column="2" border />

    <!-- 如果有子列表，显示表格 -->
    <div class="mt-20px">
      <Table
        :columns="countOrderTableSchema"
        :data="countOrderDetails"
        :loading="countOrderLoading"
        :border="true"
        :showOverflowTooltip="true"
        :pagination="{
          total: apiTotalCount,
          currentPage: countCurrentPage,
          pageSize: countPageSize
        }"
        @update:current-page="handleCountPageChange"
        @update:page-size="handleCountSizeChange"
      />
    </div>
  </div>
</template>

<style scoped>
/* Add component-specific styles if needed */
</style>
