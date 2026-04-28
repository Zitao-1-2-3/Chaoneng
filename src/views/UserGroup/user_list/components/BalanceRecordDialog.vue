<template>
  <Dialog v-model="dialogVisible" title="余额日志">
    <!-- 筛选区域 -->
    <Search :schema="searchSchema" @search="handleSearch" @reset="handleReset" class="mb-4" />

    <!-- 表格区域 -->
    <Table
      :columns="tableColumns"
      :data="recordList"
      :loading="loading"
      :pagination="pagination"
      @update:currentPage="handleCurrentPageChange"
      @update:pageSize="handlePageSizeChange"
      max-height="500px"
    />

    <!-- 弹窗底部按钮 -->
    <template #footer>
      <div class="flex justify-end">
        <ElButton @click="closeDialog">关闭</ElButton>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive, h, onMounted } from 'vue'
import { ElButton, ElMessage, ElTag } from 'element-plus'
import { Dialog } from '@/components/Dialog'
import { Table, TableColumn } from '@/components/Table'
import { Search } from '@/components/Search'
import type { FormSchema } from '@/components/Form'
import {
  getUserBalanceRecordsApi,
  v1GetUserBillList,
  type UserBalanceRecordParams
} from '@/api/tgUser/index'
import { formatToDateTime } from '@/utils/dateUtil'

// ----------- Props and Emits -----------
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  accountId: {
    type: [Number, String],
    required: true
  }
})

const emit = defineEmits(['update:visible'])

// ----------- Dialog Visibility -----------
const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const closeDialog = () => {
  dialogVisible.value = false
}

// ----------- State -----------
const loading = ref(false)
const recordList = ref<any[]>([])
const searchParams = ref<Recordable>({})
const pagination = reactive({
  currentPage: 1,
  pageSize: 10, // 你可以设置一个默认的 pageSize
  total: 0
})

// ----------- Search Schema -----------
const searchSchema = reactive<FormSchema[]>([
  {
    field: 'unit',
    label: '余额类型',
    component: 'Select',
    componentProps: {
      options: [
        { label: '全部', value: '' },
        { label: 'TRX', value: 'TRX' },
        { label: 'USDT', value: 'USDT' }
      ],
      placeholder: '请选择余额类型'
    }
  },
  {
    field: 'change_type',
    label: '变更类型',
    component: 'Select',
    componentProps: {
      options: [
        { label: '全部', value: '' },
        { label: '收入', value: 'in' },
        { label: '支出', value: 'out' }
      ],
      placeholder: '请选择变更类型'
    }
  }
])

// ----------- Table Columns -----------
const tableColumns = ref<TableColumn[]>([
  {
    field: 'unit',
    label: '余额类型',
    width: 100
  },
  {
    field: 'change_type',
    label: '变更类型',
    width: 100,
    formatter: (row) => {
      if (row?.change_type === 'in') return h(ElTag, { type: 'success' }, () => '收入')
      if (row?.change_type === 'out') return h(ElTag, { type: 'danger' }, () => '支出')
      return row?.change_type
    }
  },
  {
    field: 'amount',
    label: '金额',
    width: 120,
    formatter: (row) => {
      const amountStr = row.amount || '0'
      if (row.change_type === 'in') {
        return h('span', { style: 'color: var(--el-color-success); font-weight: bold;' }, amountStr)
      } else if (row.change_type === 'out') {
        return h('span', { style: 'color: var(--el-color-danger); font-weight: bold;' }, amountStr)
      }
      return amountStr
    }
  },
  {
    field: 'after_amount',
    label: '剩余金额',
    width: 150
  },
  {
    field: 'describe',
    label: '备注',
    minWidth: 180
  },
  {
    field: 'create_time',
    label: '创建时间',
    width: 180,
    formatter: (row) => {
      return row.create_time ? formatToDateTime(row.create_time * 1000) : '-'
    }
  }
])

// ----------- Data Fetching (后端筛选 + 分页) -----------
const fetchData = async () => {
  if (!props.accountId) {
    recordList.value = []
    pagination.total = 0
    return
  }

  loading.value = true

  // --- 准备 API 参数 (包含分页和筛选) - 使用新接口 v1GetUserBillList ---
  const apiParams: any = {
    current_page: pagination.currentPage,
    page_size: pagination.pageSize,
    user_id: Number(props.accountId)
  }

  // 字段映射：unit -> coin
  if (searchParams.value?.unit) {
    apiParams.coin = searchParams.value.unit
  }

  // 注意：新接口没有 change_type 参数，如果需要筛选收入/支出，需要在前端根据 amount 正负判断
  // 暂时保留筛选逻辑，但不传递给后端

  try {
    // 使用新接口 v1GetUserBillList
    const res = await v1GetUserBillList(apiParams)

    // 使用 API 返回的数据和总数
    if (res && res.code === '000000' && res.data) {
      let list: any[] = res.data.list || []

      // 字段映射并处理数据
      list = list.map((item: any) => ({
        unit: item.coin, // coin -> unit
        change_type: parseFloat(item.amount) >= 0 ? 'in' : 'out', // 根据金额正负判断收入/支出
        amount: Math.abs(parseFloat(item.amount)).toString(), // 取绝对值
        after_amount: item.balance, // balance -> after_amount
        describe: item.describe,
        create_time: item.created_at, // created_at -> create_time
        order_id: item.order_id,
        kind: item.kind
      }))

      // 前端筛选 change_type（如果有选择）
      if (searchParams.value?.change_type) {
        list = list.filter((item: any) => item.change_type === searchParams.value.change_type)
      }

      recordList.value = list
      pagination.total = res.data.pager?.total || 0
    } else {
      recordList.value = []
      pagination.total = 0
    }
  } catch (error) {
    console.error('Error fetching balance records (global handler should show message):', error)
    recordList.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

// ----------- Event Handlers -----------
const handleSearch = (data: Recordable) => {
  searchParams.value = data
  pagination.currentPage = 1 // 搜索时重置到第一页
  fetchData()
}

const handleReset = (data: Recordable) => {
  searchParams.value = data // 当从 watch 调用时，data 是 {}
  pagination.currentPage = 1 // 重置时也回到第一页
  fetchData()
}

// 处理页码变化
const handleCurrentPageChange = (page: number) => {
  pagination.currentPage = page
  fetchData()
}

// 处理每页条数变化
const handlePageSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.currentPage = 1 // 切换每页条数时，通常重置到第一页
  fetchData()
}

// ----------- Lifecycle Hooks -----------
onMounted(() => {
  handleReset({})
})

// ----------- Watchers -----------
// 监听 visible 变化，处理打开和关闭
watch(
  () => props.visible,
  (isVisible, wasVisible) => {
    if (isVisible && !wasVisible) {
      // 弹窗从不可见变为可见时加载数据
      if (props.accountId) {
        handleReset({})
      }
    } else if (!isVisible && wasVisible) {
      // 弹窗从可见变为不可见时执行清理
      recordList.value = []
      searchParams.value = {}
      pagination.currentPage = 1
      pagination.pageSize = 10
      pagination.total = 0
    }
  }
)
</script>

<style scoped>
/* Styles if needed */
</style>
