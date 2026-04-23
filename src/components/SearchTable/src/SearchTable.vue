<template>
  <div class="search-table-container">
    <!-- 搜索表单 -->
    <Search
      v-if="searchSchema && searchSchema.length > 0"
      :schema="searchSchema"
      @search="handleSearch"
      @reset="handleReset"
      @register="searchRegister"
      v-bind="searchProps"
    >
      <!-- 添加自定义按钮插槽 -->
      <template #actionButtons>
        <slot name="searchButtons"></slot>
      </template>
    </Search>

    <!-- 工具栏 -->
    <div class="mb-10px">
      <slot name="toolbar">
        <slot name="leftToolbar"></slot>
        <BaseButton v-if="showAddButton && hasAddPermission" type="primary" @click="$emit('add')">
          新增
        </BaseButton>
        <slot name="rightToolbar"></slot>
      </slot>
    </div>

    <!-- 表格 -->
    <Table
      :pageSize="unref(tableState.pageSize)"
      :currentPage="unref(tableState.currentPage)"
      @update:pageSize="handlePageSizeChange"
      @update:currentPage="handlePageChange"
      :show-overflow-tooltip="true"
      :data="dataList"
      :loading="loading"
      :pagination="{
        total: unref(tableState.total),
        currentPage: unref(tableState.currentPage),
        pageSize: unref(tableState.pageSize),
        ...(pagination || {})
      }"
      @register="tableRegister"
      :scrollbar-always-on="true"
      @sort-change="handleSortChange"
      @selection-change="handleSelectionChange"
      v-bind="tableProps"
    >
      <template v-for="item in slotKeys" :key="item" #[item]="data">
        <slot :name="item" v-bind="data"></slot>
      </template>
    </Table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, useSlots, PropType, watch, unref } from 'vue'
import { useSearchTable } from '@/hooks/web/useSearchTable'
import { useI18n } from '@/hooks/web/useI18n'
import { Search } from '@/components/Search'
import { Table } from '@/components/Table'
import { BaseButton } from '@/components/Button'
import { FormSchema } from '@/components/Form'
import { TableColumn } from '@/components/Table'
import { ElAlert, ElEmpty, ElButton } from 'element-plus'

const { t } = useI18n()
const slots = useSlots()

const props = defineProps({
  // 表格列配置
  columns: {
    type: Array as PropType<TableColumn[]>,
    required: true
  },
  // 搜索表单配置
  searchSchema: {
    type: Array as PropType<FormSchema[]>,
    default: () => []
  },
  // 数据加载API
  fetchDataApi: {
    type: Function as PropType<
      (params?: any) => Promise<{
        list: any[]
        total?: number
      }>
    >,
    required: true
  },
  // 删除API
  fetchDelApi: {
    type: Function as PropType<() => Promise<boolean>>,
    default: undefined
  },
  // 是否立即加载数据
  immediate: {
    type: Boolean,
    default: true
  },
  // 是否显示添加按钮
  showAddButton: {
    type: Boolean,
    default: true
  },
  // 默认查询参数
  defaultParams: {
    type: Object,
    default: () => ({})
  },
  // 分页配置
  pagination: {
    type: Object,
    default: () => ({})
  },
  // Search组件额外属性
  searchProps: {
    type: Object,
    default: () => ({})
  },
  // Table组件额外属性
  tableProps: {
    type: Object,
    default: () => ({})
  },
  // 操作列配置
  actionColumn: {
    type: Object as PropType<TableColumn>,
    default: undefined
  }
})

const emit = defineEmits([
  'add',
  'search',
  'reset',
  'delete',
  'update:searchParams',
  'error',
  'loaded',
  'ready',
  'selection-change'
])

// 使用hook
const {
  searchRegister,
  tableRegister,
  searchMethods,
  tableMethods,
  tableState,
  search,
  reset,
  currentRow,
  handleDelete,
  searchParams,
  setSearchParams,
  loading,
  dataList,
  total,
  hasAddPermission
} = useSearchTable({
  searchSchema: props.searchSchema,
  tableColumns: props.columns,
  fetchDataApi: props.fetchDataApi,
  fetchDelApi: props.fetchDelApi,
  immediate: props.immediate,
  defaultParams: props.defaultParams,
  actionColumn: props.actionColumn
})
console.log('tableState', tableState)

const handlePageChange = (page: number) => {
  tableState.currentPage.value = page
  tableMethods.getList()
}

const handlePageSizeChange = (size: number) => {
  tableState.pageSize.value = size
  tableMethods.getList()
}

// 搜索
const handleSearch = async () => {
  const params = await search()
  emit('search', params)
  emit('update:searchParams', params)
}

// 重置
const handleReset = async () => {
  const params = await reset()
  emit('reset', params)
  emit('update:searchParams', params)
}

// 删除
const doDelete = async (row: Recordable) => {
  const result = await handleDelete(row)
  emit('delete', row, result)
  return result
}

// 重新加载
const reload = async () => {
  await tableMethods.getList()
}

// 计算所有插槽名
const slotKeys = computed(() => {
  const slotNames = Object.keys(slots)
  const excludeSlots = ['toolbar', 'empty']
  return slotNames.filter((key) => !excludeSlots.includes(key))
})

// 监听 columns 变化，动态更新表格列
watch(
  () => props.columns,
  (newColumns) => {
    console.log('[SearchTable] columns 变化，更新表格列:', newColumns.length)
    if (tableMethods) {
      tableMethods.setProps({ columns: newColumns })
    }
  },
  { deep: true }
)

// 监听加载完成
watch(
  () => loading.value,
  (newVal, oldVal) => {
    if (oldVal === true && newVal === false) {
      emit('loaded', {
        data: dataList,
        total: total,
        success: true
      })
    }
  }
)

onMounted(() => {
  // 触发ready事件，暴露核心方法
  emit('ready', {
    setSearchParams,
    reload: tableMethods.getList,
    search: handleSearch,
    reset: handleReset,
    delete: doDelete,
    currentRow,
    tableMethods,
    searchMethods,
    tableState,
    searchParams
  })
})

// 暴露方法
defineExpose({
  reload: tableMethods.getList,
  reset: handleReset,
  search: handleSearch,
  delete: doDelete,
  currentRow,
  getElTableExpose: tableMethods.getElTableExpose,
  tableMethods,
  searchMethods,
  tableState,
  searchParams,
  setSearchParams
})

const handleSortChange = (data: { column: any; prop: string; order: string }) => {
  // 将排序信息保存到搜索参数中
  // Element Plus 的 order 值：'ascending' | 'descending' | null

  if (data.order && data.prop) {
    // 保存排序字段和方向
    searchParams.value.sort = data.prop
    searchParams.value.order = data.order
  } else {
    // 清除排序
    delete searchParams.value.sort
    delete searchParams.value.order
  }

  // 重新加载数据
  tableMethods.getList()
}

// 处理表格选择变化
const handleSelectionChange = (selection: any[]) => {
  emit('selection-change', selection)
}
</script>

<style scoped>
.search-table-container {
  width: 100%;
}

.empty-data {
  display: flex;
  margin-top: 20px;
  justify-content: center;
}
</style>
