<script setup lang="ts">
import { ref, computed, watch, h, onMounted } from 'vue'
import { ElTag, ElLink, ElTable, ElTableColumn } from 'element-plus'
import { Descriptions } from '@/components/Descriptions'
import type { DescriptionsSchema } from '@/components/Descriptions'
import { Table } from '@/components/Table'
import type { TableColumn } from '@/components/Table'
import { formatToDateTime } from '@/utils/dateUtil'
import { getByCountDetailApi } from '@/api/energy_order'
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

const countOrderDetails = ref<any[]>([])
const countOrderLoading = ref(false)
const countCurrentPage = ref(1)
const countPageSize = ref(10)
const apiTotalCount = ref(0)

const byCountDetailSchema = computed((): DescriptionsSchema[] => [
  { field: 'stroke_num', label: '租用笔数' },
  // {
  //   field: 'order_amount',
  //   label: '订单金额',
  //   slots: {
  //     default: (data: any) => h('span', {}, `${data.order_amount ?? '-'} ${data.pay_unit ?? ''}`)
  //   }
  // }
  {
    field: 'stroke_ext.price_trx',
    label: '能量TRX价格',
    slots: {
      default: (data: any) => h('span', {}, `${data.stroke_ext.price_trx + ' TRX'}`)
    }
  },
  {
    field: 'stroke_ext.price_usdt',
    label: '能量USDT价格',
    slots: {
      default: (data: any) => h('span', {}, `${data.stroke_ext.price_usdt + ' USDT'}`)
    }
  }
])

const countOrderTableSchema = computed((): TableColumn[] => [
  { type: 'index', label: '序号', width: 60, align: 'center', field: 'index' },
  { field: 'to_address', label: '地址', minWidth: 180 },
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
    formatter: (row) => (row.create_time ? formatToDateTime(row.create_time * 1000) : '-')
  },
  {
    field: 'end_time',
    label: '完成时间',
    formatter: (row) => (row.end_time ? formatToDateTime(row.end_time * 1000) : '-')
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

const getCountStatusText = (status: number): string => {
  const statusMap: Record<number, string> = {
    1: '待使用',
    2: '已使用',
    3: '已过期'
  }
  return statusMap[status] ?? '未知'
}

const getCountStatusTagType = (status: number): 'success' | 'warning' | 'info' | 'danger' => {
  const typeMap: Record<number, 'success' | 'warning' | 'info' | 'danger'> = {
    1: 'success', // 待使用
    2: 'warning', // 已使用
    3: 'danger' // 已过期
  }
  return typeMap[status] ?? 'info'
}

const fetchCountOrderDetails = async () => {
  if (!props.orderId) {
    countOrderDetails.value = []
    apiTotalCount.value = 0
    return
  }
  countOrderLoading.value = true
  countOrderDetails.value = []
  try {
    const params = {
      currentPage: countCurrentPage.value,
      pageSize: countPageSize.value
    }
    const response = await getByCountDetailApi(props.orderId, params)
    const apiData = response?.data
    countOrderDetails.value = apiData?.list || []
    apiTotalCount.value = apiData?.totalCount || 0
    if (!Array.isArray(countOrderDetails.value)) {
      console.warn('按次数下单详情 API (分页) 未返回预期的数组格式', response)
      countOrderDetails.value = []
      apiTotalCount.value = 0
    }
  } catch (error) {
    console.error('获取按次数下单详情失败 (分页):', error)
    countOrderDetails.value = []
    apiTotalCount.value = 0
  } finally {
    countOrderLoading.value = false
  }
}

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

onMounted(() => {
  fetchCountOrderDetails()
})

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
</script>

<template>
  <div>
    <Descriptions :schema="byCountDetailSchema" :data="orderData" :column="2" border />
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
