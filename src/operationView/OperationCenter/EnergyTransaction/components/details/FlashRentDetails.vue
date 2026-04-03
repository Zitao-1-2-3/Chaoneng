<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { ElTag } from 'element-plus'
import { Descriptions } from '@/components/Descriptions'
import type { DescriptionsSchema } from '@/components/Descriptions'
import { Table } from '@/components/Table'
import type { TableColumn } from '@/components/Table'
import { formatToDateTime } from '@/utils/dateUtil'

const props = defineProps({
  orderData: {
    type: Object as () => any | null,
    default: () => null
  }
})

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)

// 闪租汇总信息 schema
const flashRentSummarySchema = computed((): DescriptionsSchema[] => [
  {
    field: 'summary.energy_count',
    label: '租用笔数',
    slots: {
      default: (data) => h('span', `${data?.summary?.energy_count ?? 0} 笔`)
    }
  },
  {
    field: 'flash_price',
    label: '笔数单价',
    slots: {
      default: (data) => h('span', `${data?.flash_price ?? '-'} ${data?.pay_unit ?? 'TRX'}`)
    }
  }
])

// 资源列表表格列
const resourceTableSchema = computed((): TableColumn[] => [
  { type: 'index', label: '序号', align: 'center', field: 'index' },
  {
    field: 'target',
    label: '地址',
    minWidth: 180
  },
  {
    field: 'code',
    label: '状态',
    align: 'center',
    slots: {
      default: ({ row }) => {
        const statusMap: Record<number, string> = {
          1: '已使用',
          2: '未使用',
          3: '已过期'
        }
        const statusColorMap: Record<
          number,
          'success' | 'warning' | 'info' | 'danger' | 'primary'
        > = {
          1: 'success',
          2: 'warning',
          3: 'danger'
        }
        const status = Number(row.code)
        const text = statusMap[status] || '未知'
        const type = statusColorMap[status] || 'info'
        return h(ElTag, { type, size: 'small' }, () => text)
      }
    }
  },
  {
    field: 'delegated_at',
    label: '创建时间',
    formatter: (row) =>
      row.delegated_at ? formatToDateTime(new Date(row.delegated_at).getTime()) : '-'
  },
  {
    field: 'expirated_at',
    label: '完成时间',
    formatter: (row) =>
      row.expirated_at ? formatToDateTime(new Date(row.expirated_at).getTime()) : '-'
  },
  {
    field: 'delegated_txid',
    label: '交易hash',
    width: 280,
    type: 'link',
    showOverflowTooltip: true,
    url: (row) =>
      row.delegated_txid
        ? `${import.meta.env.VITE_TRONSCAN_URL}/#/transaction/${row.delegated_txid}`
        : ''
  },
  {
    field: 'recycled_txid',
    label: '回收hash',
    width: 280,
    type: 'link',
    showOverflowTooltip: true,
    url: (row) =>
      row.recycled_txid
        ? `${import.meta.env.VITE_TRONSCAN_URL}/#/transaction/${row.recycled_txid}`
        : ''
  }
])

// 获取资源列表数据（完整列表）
const fullResourceList = computed(() => {
  return props.orderData?.resources || []
})

// 获取当前页的资源列表数据
const paginatedResourceList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return fullResourceList.value.slice(start, end)
})

// 总数
const totalCount = computed(() => {
  return fullResourceList.value.length
})

// 分页处理
const handlePageChange = (page: number) => {
  currentPage.value = page
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}
</script>

<template>
  <div v-if="orderData">
    <!-- 汇总信息 -->
    <Descriptions :schema="flashRentSummarySchema" :data="orderData" :column="2" border />

    <!-- 资源列表 -->
    <div class="mt-20px">
      <Table
        :columns="resourceTableSchema"
        :data="paginatedResourceList"
        :border="true"
        :showOverflowTooltip="true"
        :pagination="{
          total: totalCount,
          currentPage: currentPage,
          pageSize: pageSize
        }"
        @update:current-page="handlePageChange"
        @update:page-size="handleSizeChange"
      />
    </div>
  </div>
  <div v-else>加载中...</div>
</template>

<style scoped>
/* Add component-specific styles if needed */
</style>
