<template>
  <div class="trust-transaction-container">
    <ContentWrap>
      <SearchTable
        ref="searchTableRef"
        :columns="columns"
        :search-schema="searchSchema"
        :fetch-data-api="fetchHostedOrderList"
        :action-column="actionColumn"
        :table-props="{
          rowKey: 'id',
          highlightCurrentRow: false,
          reserveSelection: false
        }"
        :show-add-button="false"
        @search="onSearch"
        :search-props="{
          layout: 'inline',
          buttonPosition: 'center'
        }"
      >
        <template #searchButtons>
          <BaseButton type="primary" @click="handleExport">
            <Icon icon="ep:download" class="mr-5px" />
            导出
          </BaseButton>
        </template>
      </SearchTable>

      <!-- 回收能量弹窗 -->
      <RetrieveAsset ref="retrieveEnergyRef" @success="handleRecycleSuccess" />

      <!-- 补发能量弹窗 -->
      <ResendEnergy ref="resendEnergyRef" @success="handleResendSuccess" />

      <!-- 订单详情弹窗 -->
      <TrustTransactionDetail ref="detailRef" />
    </ContentWrap>
  </div>
</template>

<script setup lang="tsx">
import { ref, reactive, onMounted } from 'vue'
import { ElTag, ElMessage } from 'element-plus'
import { SearchTable } from '@/components/SearchTable'
import type { SearchTableExpose } from '@/components/SearchTable/src/types'
import type { TableColumn } from '@/components/Table/src/types'
import { FormSchema } from '@/components/Form'
import { formatToDateTime } from '@/utils/dateUtil'
import RetrieveAsset from './components/RetrieveAsset.vue'
import ResendEnergy from './components/ResendEnergy.vue'
import TrustTransactionDetail from './components/TrustTransactionDetail.vue'
import { BaseButton } from '@/components/Button'
import {
  getTrustTransactionListApi,
  exportTrustTransactionApi,
  handRecycleTrustTransactionApi
} from '@/api/trust_transaction' // 新增导入
import type { HostedOrder, TrustTransactionQueryParams } from '@/api/trust_transaction/types' // 新增导入
import { ContentWrap } from '@/components/ContentWrap'
import { formatToWan } from '@/utils'
import { useRouter, RouterLink } from 'vue-router'
import { downloadByData } from '@/utils/download'

const router = useRouter()

// Refs
const searchTableRef = ref<SearchTableExpose>()
const retrieveEnergyRef = ref()
const resendEnergyRef = ref()
const detailRef = ref()

// 导出
const handleExport = async () => {
  try {
    const params = await searchTableRef.value?.searchMethods.getFormData()
    // 处理时间范围
    const exportParams = { ...params } as any
    if (params.dateRange && params.dateRange.length === 2) {
      exportParams.start_time = params.dateRange[0]
      exportParams.end_time = params.dateRange[1]
      delete exportParams.dateRange
    }
    const res = await exportTrustTransactionApi(exportParams as TrustTransactionQueryParams)
    if (res.data instanceof Blob) {
      downloadByData(res.data, '托管订单列表.xlsx')

      ElMessage.success('订单导出成功')
    } else {
      console.error('Export failed: Response data is not a Blob', res.data)
      ElMessage.error('导出失败: 文件数据格式错误')
    }
  } catch (error) {
    console.error('订单导出失败:', error)
    const errorMsg =
      (error as any)?.response?.data?.message || (error as Error)?.message || '订单导出失败'
    ElMessage.error(errorMsg)
  }
}

// --- Helper Functions ---
const getManageStatus = (status: number) => {
  switch (status) {
    case 1:
      return { text: '托管中', type: 'primary' as const }
    case 2:
      return { text: '已取消托管', type: 'info' as const }
    default:
      return { text: '未知', type: 'info' as const }
  }
}

const getDelegateStatusText = (status: number) => {
  switch (status) {
    case 1:
      return '已发放'
    default:
      return '-'
  }
}
const getHandleStatusText = (status: number) => {
  switch (status) {
    case 0:
      return '-'
    case 1:
      return '已回收'
    case 2:
      return '未回收'
    case 3:
      return '回收失败'
    default:
      return '-'
  }
}

const getRecycleStatusText = (recycleTime: number) => {
  if (recycleTime === 0) {
    return '-'
  }
  return recycleTime > 0 ? '已回收' : '待回收'
}

// --- Table Columns Configuration ---
const columns = reactive<TableColumn[]>([
  { field: 'order_id', label: '订单ID', minWidth: 150 },
  { field: 'tg_name', label: 'TG用户名称', minWidth: 120 },
  {
    field: 'tg_bot_id',
    label: '机器人ID',
    minWidth: 120,
    slots: {
      default: ({ row }) => {
        return (
          <RouterLink
            class="text-blue-500"
            to={{ path: '/agent/bot_list', query: { id: row.tg_bot_id } }}
          >
            {row.tg_bot_id}
          </RouterLink>
        )
      }
    }
  },
  { field: 'bot_name', label: '机器人名称', minWidth: 120 },
  {
    field: 'manage_status',
    label: '托管状态',
    minWidth: 100,
    slots: {
      default: ({ row }) => {
        const statusInfo = getManageStatus(row.manage_status)
        return <ElTag type={statusInfo.type}>{statusInfo.text}</ElTag>
      }
    }
  },
  { field: 'address', label: '能量接收地址', minWidth: 260 },
  {
    field: 'energy_num',
    label: '能量数量',
    minWidth: 100,
    formatter: (row) => formatToWan(row.energy_num)
  },
  { field: 'energy_rent_text', label: '能量有效期', minWidth: 100 },
  {
    field: 'pay_amount',
    label: '扣款金额',
    minWidth: 100,
    formatter: (row) => `${row.pay_amount || '0'}${row.pay_unit || ''}`
  },
  {
    field: 'delegate_status',
    label: '发放状态',
    minWidth: 100,
    slots: {
      default: ({ row }) => {
        const status = row.delegate_status
        const text = getDelegateStatusText(status)
        let tagType: 'primary' | 'info' | 'success' | 'warning' | 'danger' = 'info'

        if (status === 1) {
          tagType = 'success'
        }

        return <ElTag type={tagType}>{text}</ElTag>
      }
    }
  },
  {
    field: 'handle_status',
    label: '回收状态',
    minWidth: 100,
    slots: {
      default: ({ row }) => {
        const handle_status = row.handle_status
        const text = getHandleStatusText(handle_status)
        let tagType = {
          '0': 'info',
          '1': 'success',
          '2': 'warning',
          '3': 'danger'
        }

        return <ElTag type={tagType[handle_status]}>{text}</ElTag>
      }
    }
  },
  {
    field: 'create_time',
    label: '创建时间',
    minWidth: 160,
    formatter: (row) => (row.create_time ? formatToDateTime(row.create_time) : '-')
  },
  {
    field: 'describe',
    label: '描述',
    minWidth: 160,
    formatter: (row) => row.describe || '-'
  }
])

// --- Search Schema Configuration ---
const searchSchema = reactive<FormSchema[]>([
  {
    field: 'query',
    component: 'Input',
    label: {
      tips: '机器人订单ID / TG用户名称 / 机器人名称 / 能量接收地址',
      text: '关键字'
    },
    componentProps: {
      placeholder: '请输入关键字'
    }
  },
  {
    field: 'manage_status',
    component: 'Select',
    label: '托管状态：',
    componentProps: {
      placeholder: '请选择托管状态',
      options: [
        { label: '全部', value: '' },
        { label: '托管中', value: 1 },
        { label: '已取消托管', value: 2 }
      ],
      clearable: true
    }
  },
  {
    field: 'dateRange',
    component: 'DatePicker',
    label: '创建时间',
    componentProps: {
      type: 'datetimerange',
      valueFormat: 'x',
      startPlaceholder: '开始日期',
      endPlaceholder: '结束日期'
    }
  }
])

// --- Action Column Configuration ---
const actionColumn: TableColumn = {
  field: 'action',
  label: '操作',
  minWidth: 240,
  fixed: 'right' as const,
  slots: {
    default: ({ row }) => {
      const canRecycle = row.manage_status === 1 && row.recycle_time === 0
      const canResend = row.manage_status === 1

      return (
        <>
          {/* <BaseButton type="primary" onClick={() => handleRecycle(row)} disabled>
            回收能量
          </BaseButton>
          <BaseButton type="primary" onClick={() => handleResend(row)} disabled>
            补发能量
          </BaseButton> */}
          <BaseButton type="primary" onClick={() => handleRecycleTrust(row)}>
            回收与重置
          </BaseButton>
          <BaseButton type="primary" onClick={() => handleDetail(row)}>
            详情
          </BaseButton>
        </>
      )
    }
  }
}

// --- Data Fetching (Simplified) ---
const fetchHostedOrderList = async (params: any): Promise<{ list: any[]; total: number }> => {
  try {
    console.log('搜索参数:', params)

    // 处理dateRange
    const apiParams = { ...params }
    if (params.dateRange && params.dateRange.length === 2) {
      apiParams.start_time = params.dateRange[0]
      apiParams.end_time = params.dateRange[1]
      delete apiParams.dateRange
    }

    console.log('调用API参数:', apiParams)

    // 使用非类型化的方式调用 API
    const response: any = await getTrustTransactionListApi(apiParams)
    console.log('API返回数据:', response)

    // 后端返回的结构是
    // {
    //   "list": [...],
    //   "pager": { "current_page": 1, "page_size": 10, "totalCount": 37 },
    //   "totalCount": 37
    // }

    if (response?.data) {
      const data = response.data
      return {
        // 数据列表在 data.list 中
        list: data.list || [],
        // 总数可能在 data.totalCount 或 data.pager.totalCount 中
        total: data.totalCount || data.pager?.totalCount || 0
      }
    } else {
      console.warn('API 返回格式异常', response)
      return { list: [], total: 0 }
    }
  } catch (error) {
    console.error('获取托管订单失败:', error)
    ElMessage.error('获取托管订单列表失败')
    return { list: [], total: 0 }
  }
}

// --- Event Handlers ---
const handleRecycle = (row: HostedOrder) => {
  retrieveEnergyRef.value?.open(row)
}

const handleResend = (row: HostedOrder) => {
  resendEnergyRef.value?.open(row)
}

const handleRecycleTrust = async (row: HostedOrder) => {
  const res = await handRecycleTrustTransactionApi({
    id: row.id
  })
  if (res.code === '000000') {
    ElMessage.success('操作成功')
    searchTableRef.value?.tableMethods.getList()
  }
}

const handleDetail = (row: HostedOrder) => {
  console.log('查看详情:', row)
  detailRef.value?.open(row)
}

const handleRecycleSuccess = () => {
  ElMessage.success('回收操作成功')
  searchTableRef.value?.tableMethods.getList()
}

const handleResendSuccess = () => {
  ElMessage.success('补发操作成功')
  searchTableRef.value?.tableMethods.getList()
}

const onSearch = (params: any) => {
  console.log('Search triggered with params:', params)
}

// --- Lifecycle Hooks ---
onMounted(() => {
  console.log('托管订单列表页面已加载')
})
</script>

<style scoped>
.trust-transaction-container {
  height: 100%;
  padding: 16px;
}
</style>
