<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { ElTag, ElTooltip } from 'element-plus'
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

// 汇总信息 schema
const summarySchema = computed((): DescriptionsSchema[] => [
  {
    field: 'summary.energy_count',
    label: '能量笔数',
    slots: {
      default: (data) => h('span', `${data?.summary?.energy_count ?? 0} 笔`)
    }
  },
  {
    field: 'summary.used_count',
    label: '已使用笔数',
    slots: {
      default: (data) => h('span', `${data?.summary?.used_count ?? 0} 笔`)
    }
  }
])

// 资源列表表格列
const resourceTableSchema = computed((): TableColumn[] => [
  {
    field: 'code',
    label: '类型',
    align: 'center',
    width: 100,
    slots: {
      default: ({ row }) => {
        const typeMap: Record<number, string> = {
          1: '能量',
          2: '带宽'
        }
        const typeColorMap: Record<number, 'success' | 'warning' | 'info' | 'danger' | 'primary'> =
          {
            1: 'primary',
            2: 'success'
          }
        const type = Number(row.code)
        const text = typeMap[type] || '未知'
        const tagType = typeColorMap[type] || 'info'
        return h(ElTag, { type: tagType, size: 'small' }, () => text)
      }
    }
  },
  {
    field: 'amount',
    label: '数量',
    align: 'center',
    width: 120,
    formatter: (row) => (row.amount ? row.amount.toLocaleString() : '0')
  },
  {
    field: 'target',
    label: '接收地址',
    minWidth: 180,
    showOverflowTooltip: false
  },
  {
    field: 'delegated_txid',
    label: '发送hash',
    width: 120,
    align: 'center',
    slots: {
      default: ({ row }) => {
        if (!row.delegated_txid) return h('span', '-')
        return h(
          ElTooltip,
          {
            content: row.delegated_txid,
            placement: 'top'
          },
          {
            default: () =>
              h(
                'a',
                {
                  href: `${import.meta.env.VITE_TRONSCAN_URL}/#/transaction/${row.delegated_txid}`,
                  target: '_blank',
                  style: 'color: #409eff; cursor: pointer; text-decoration: none;'
                },
                '点击跳转'
              )
          }
        )
      }
    }
  },
  {
    field: 'recycled_txid',
    label: '回收hash',
    width: 120,
    align: 'center',
    slots: {
      default: ({ row }) => {
        if (!row.recycled_txid) return h('span', '-')
        return h(
          ElTooltip,
          {
            content: row.recycled_txid,
            placement: 'top'
          },
          {
            default: () =>
              h(
                'a',
                {
                  href: `${import.meta.env.VITE_TRONSCAN_URL}/#/transaction/${row.recycled_txid}`,
                  target: '_blank',
                  style: 'color: #409eff; cursor: pointer; text-decoration: none;'
                },
                '点击跳转'
              )
          }
        )
      }
    }
  },
  {
    field: 'delegated_at',
    label: '发放时间',
    width: 160,
    formatter: (row) =>
      row.delegated_at ? formatToDateTime(new Date(row.delegated_at).getTime()) : '-'
  },
  {
    field: 'recycled_at',
    label: '回收时间',
    width: 160,
    formatter: (row) =>
      row.recycled_at ? formatToDateTime(new Date(row.recycled_at).getTime()) : '-'
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
    <Descriptions :schema="summarySchema" :data="orderData" :column="2" border />

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
