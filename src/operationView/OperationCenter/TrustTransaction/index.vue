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
  getTrustTransactionListApi, // 保留旧接口以便兼容，暂未使用
  exportTrustTransactionApi,
  handRecycleTrustTransactionApi
} from '@/api/trust_transaction'
import type { HostedOrder } from '@/api/trust_transaction/types'
import { v2GetEnergyList } from '@/api/energy_transaction'
import type { V2EnergyItem } from '@/api/energy_transaction/types'
import { ContentWrap } from '@/components/ContentWrap'
import { RouterLink } from 'vue-router'
import { downloadByData } from '@/utils/download'

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
    const res = await exportTrustTransactionApi(exportParams as any)
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
    field: 'resource_type',
    label: '订单类型',
    minWidth: 100,
    slots: {
      default: ({ row }) => {
        // resource_type: 1表示能量，2表示带宽
        const resourceType = Number(row.resource_type)
        const typeMap = {
          1: { text: '能量', type: 'success' },
          2: { text: '带宽', type: 'primary' }
        }
        const typeInfo = typeMap[resourceType] || { text: '未知', type: 'info' }
        return <ElTag type={typeInfo.type}>{typeInfo.text}</ElTag>
      }
    }
  },
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
    formatter: (row) => row.energy_num || '0'
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
    field: 'resource_type',
    component: 'Select',
    label: '订单类型：',
    componentProps: {
      placeholder: '请选择订单类型',
      options: [
        { label: '全部', value: '' },
        { label: '能量', value: 1 },
        { label: '带宽', value: 2 }
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
          <BaseButton type="primary" onClick={() => handleRecycle(row)} disabled={!canRecycle}>
            回收能量
          </BaseButton>
          <BaseButton type="primary" onClick={() => handleResend(row)} disabled={!canResend}>
            补发能量
          </BaseButton>
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

// --- Data Fetching ---
const fetchHostedOrderList = async (params: any): Promise<{ list: any[]; total: number }> => {
  try {
    console.log('[fetchHostedOrderList] 查询参数:', params)

    // 构建新接口参数
    const apiParams: any = {
      current_page: params.currentPage || params.current_page || 1,
      page_size: params.pageSize || params.page_size || 10,
      kind: 8 // 指定托管类型：8-自动托管
    }

    // 处理关键字查询
    if (params.query) {
      apiParams.keyword = params.query
    }

    // 处理订单类型（resource_type映射到kind的资源类型，但这里已经固定kind=8）
    // 注意：托管明细只显示kind=8的订单，resource_type用于其他筛选
    if (params.resource_type) {
      // 这里可能需要根据实际业务逻辑调整
      // 暂时保留参数但不传递给API
    }

    // 处理托管状态（能量交易接口使用status字段）
    if (params.manage_status) {
      // 托管状态映射到订单状态
      // 1-托管中 可能对应 2-已支付 或 3-已发送
      // 2-已取消托管 可能对应 8-已取消
      // 这里需要根据实际业务逻辑调整
      if (params.manage_status === 1) {
        // 托管中：可能是已支付、已发送等状态
        // 暂不映射，显示所有状态
      } else if (params.manage_status === 2) {
        apiParams.status = 8 // 已取消
      }
    }

    // 处理时间范围
    if (params.dateRange && params.dateRange.length === 2) {
      apiParams.start_time = String(params.dateRange[0])
      apiParams.end_time = String(params.dateRange[1])
    }

    // 调用能量交易订单接口
    const response: any = await v2GetEnergyList(apiParams)

    if (response?.data) {
      const data = response.data
      const list = data.list || []
      const total = data.pager?.total || 0

      // 字段映射转换
      const mappedList = list.map((item: V2EnergyItem) => {
        // 计算有效时长
        let energyRentText = '-'
        if (item.expirated_at) {
          try {
            const expiredTime = new Date(item.expirated_at).getTime()
            const now = Date.now()
            const diffMs = expiredTime - now

            if (diffMs > 0) {
              const diffMinutes = Math.floor(diffMs / (1000 * 60))
              const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
              const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

              if (diffDays > 0) {
                energyRentText = `${diffDays}天`
              } else if (diffHours > 0) {
                energyRentText = `${diffHours}小时`
              } else if (diffMinutes > 0) {
                energyRentText = `${diffMinutes}分钟`
              } else {
                energyRentText = '即将过期'
              }
            } else {
              energyRentText = '已过期'
            }
          } catch (e) {
            console.warn('计算有效时长失败:', e)
          }
        } else {
          // kind=8（自动托管）显示"长期有效"
          energyRentText = '长期有效'
        }

        // 判断托管状态
        let manageStatus = 1 // 默认托管中
        if (item.status === 8) {
          manageStatus = 2 // 已取消托管
        }

        // 判断回收状态
        let handleStatus = 2 // 默认未回收
        if (item.recycled_at) {
          handleStatus = 1 // 已回收
        }

        // 判断发放状态
        let delegateStatus = 0 // 默认未发放
        if (item.delegated_at) {
          delegateStatus = 1 // 已发放
        }

        // 计算回收时间（ISO字符串转Unix时间戳秒）
        let recycleTime = 0
        if (item.recycled_at) {
          try {
            recycleTime = Math.floor(new Date(item.recycled_at).getTime() / 1000)
          } catch (e) {
            console.warn('转换回收时间失败:', e)
          }
        }

        return {
          id: item.id,
          manage_record_id: 0,
          order_id: item.id,
          tg_id: item.user_id,
          tg_name: item.tg_user_name || item.tg_first_name || '-',
          tg_bot_id: item.bot_id,
          bot_name: item.bot_name,
          address: item.receive_address,
          from_address: item.energy_address,
          txid: '',
          energy_num: Number(item.energy_amount) || 0,
          energy_rent_time: 0,
          energy_rent_text: energyRentText,
          order_amount: item.amount,
          pay_amount: item.amount,
          pay_unit: item.coin,
          status: item.status,
          manage_status: manageStatus,
          resource_type: 1, // 默认能量
          create_time: item.created_at,
          finish_time: 0,
          describe: item.describe || '-',
          delegate_balance: 0,
          recycle_time: recycleTime,
          recycle_txid: '',
          handle_status: handleStatus,
          delegate_status: delegateStatus
        }
      })

      return {
        list: mappedList,
        total: total
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
