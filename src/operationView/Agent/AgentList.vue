<template>
  <div class="app-container">
    <ContentWrap>
      <SearchTable
        ref="searchTableRef"
        :columns="columns"
        :searchSchema="searchSchema"
        :fetchDataApi="getAgentList"
        @search="handleSearch"
        :show-add-button="false"
      >
        <template #leftToolbar>
          <BaseButton type="primary" @click="handleAddAgent">新增代理</BaseButton>
        </template>
        <template #searchButtons>
          <BaseButton type="primary" @click="handleExport">
            <Icon icon="ep:download" class="mr-5px" />
            导出
          </BaseButton>
        </template>
      </SearchTable>
    </ContentWrap>

    <RechargeDialog
      v-model:visible="rechargeDialogVisible"
      :user="currentAccount"
      @success="handleRechargeSuccess"
    />

    <AgentForm ref="agentFormRef" @success="handleAgentSuccess" @error="handleAgentError" />
  </div>
</template>

<script setup lang="tsx">
import { ref } from 'vue'
import { ElTag, ElMessage, ElMessageBox } from 'element-plus'
import { SearchTable } from '@/components/SearchTable'
import { FormSchema } from '@/components/Form'
import { TableColumn } from '@/components/Table'
import { formatToDateTime } from '@/utils/dateUtil'
import {
  getAgentListApi,
  updateAgentApi,
  exportAgentListApi,
  type AgentItem,
  type UpdateAgentPayload,
  type AgentQueryParams
} from '@/api/agent/list'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import RechargeDialog from './components/RechargeDialog.vue'
import AgentForm from './components/AgentForm.vue'
import { downloadByData } from '@/utils/download'

// 状态管理
const searchTableRef = ref<InstanceType<typeof SearchTable>>()
const agentFormRef = ref<InstanceType<typeof AgentForm>>()
const rechargeDialogVisible = ref(false)
const currentAccount = ref<AgentItem>()

// 导出
const handleExport = async () => {
  try {
    const params = (await searchTableRef.value?.searchMethods.getFormData()) || {}

    // 保存时间范围用于前端过滤
    let dateRange = null
    const exportParams: any = { ...params }

    if (params.dateRange && params.dateRange.length === 2) {
      dateRange = params.dateRange
      // 不传递时间参数给后端
      delete exportParams.dateRange
    }

    const res = await exportAgentListApi(exportParams as AgentQueryParams)

    // 注意：导出接口返回的是文件，无法在前端过滤
    // 如果需要按时间范围导出，需要后端支持或者先获取数据再导出
    if (dateRange) {
      ElMessage.warning('导出功能暂不支持时间范围筛选，将导出全部数据')
    }

    if (res.data instanceof Blob) {
      downloadByData(res.data, '代理列表.xlsx')
      ElMessage.success('导出成功')
    } else {
      console.error('Export failed: Response data is not a Blob', res.data)
      ElMessage.error('导出失败: 文件数据格式错误')
    }
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

// 常量配置
const STATUS_OPTIONS = [
  { label: '全部', value: '' },
  { label: '启用', value: 1 },
  { label: '禁用', value: 2 }
] as const

const STATUS_CONFIG = {
  1: { text: '启用', type: 'success' as const },
  2: { text: '禁用', type: 'danger' as const }
} as const

// API 调用
const getAgentList = async (params?: any) => {
  try {
    // 保存时间范围用于前端过滤
    let dateRange = null
    const apiParams = { ...params }

    if (params?.dateRange && params.dateRange.length === 2) {
      dateRange = params.dateRange
      // 不传递时间参数给后端，在前端过滤
      delete apiParams.dateRange

      console.log('=== 代理列表 - 前端时间范围过滤 ===')
      console.log('时间范围:', dateRange)
    }

    // 如果有时间范围过滤，需要获取全部数据
    if (dateRange) {
      // 设置一个很大的 page_size 来获取所有数据
      apiParams.page_size = 10000
      apiParams.current_page = 1
    }

    console.log('请求参数:', apiParams)
    const res = await getAgentListApi(apiParams)
    const data = (res?.data as any) || {}
    let list = data.list || data.items || []
    const originalTotal = data.totalCount || data.total || 0

    // 前端过滤：根据创建时间范围筛选
    if (dateRange && dateRange.length === 2) {
      const startMs = typeof dateRange[0] === 'string' ? parseInt(dateRange[0], 10) : dateRange[0]
      const endMs = typeof dateRange[1] === 'string' ? parseInt(dateRange[1], 10) : dateRange[1]

      list = list.filter((item: AgentItem) => {
        if (!item.created_at) return false
        // created_at 是秒级时间戳，转换为毫秒
        const itemMs = item.created_at * 1000
        return itemMs >= startMs && itemMs <= endMs
      })

      console.log('过滤前数量:', data.list?.length || 0)
      console.log('过滤后数量:', list.length)
    }

    return {
      list: list,
      total: dateRange ? list.length : originalTotal // 有时间过滤时返回过滤后的总数，否则返回原始总数
    }
  } catch (error) {
    console.error('获取代理列表失败:', error)
    ElMessage.error('获取代理列表失败')
    return { list: [], total: 0 }
  }
}

const updateAgentStatus = async (id: number | string, status: number, row: AgentItem) => {
  try {
    // 发送完整的代理信息，避免后端重置其他字段
    const payload: UpdateAgentPayload = {
      id,
      email: row.email,
      gift_bandwidth: row.gift_bandwidth, // 保持原值
      status
    }
    await updateAgentApi(payload)
    ElMessage.success(status === 1 ? '启用成功' : '禁用成功')
    searchTableRef.value?.reload()
  } catch (error) {
    console.error('更新代理状态失败:', error)
    ElMessage.error('更新代理状态失败')
  }
}

// 处理搜索
const handleSearch = () => {
  // SearchTable 组件会自动处理搜索逻辑
}

// 表单配置
const searchSchema = ref<FormSchema[]>([
  {
    field: 'keyword',
    component: 'Input',
    label: '关键字',
    componentProps: {
      placeholder: '联系方式/代理名称'
    }
  },
  {
    field: 'status',
    component: 'Select',
    label: '状态',
    componentProps: {
      placeholder: '请选择状态',
      clearable: true,
      options: STATUS_OPTIONS
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

// 表格列配置
const columns = ref<TableColumn[]>([
  { field: 'email', label: '联系方式' },
  { field: 'username', label: '代理名称' },
  {
    field: 'bot_num',
    label: '机器人数量',
    formatter: (row: AgentItem) => row.bot_num ?? 0
  },
  {
    field: 'tg_account_num',
    label: '总用户数',
    formatter: (row: AgentItem) => row.tg_account_num ?? 0
  },
  {
    field: 'trx_balance',
    label: 'TRX余额',
    sortable: true,
    sortMethod: (a: any, b: any) => {
      return parseFloat(a.trx_balance) - parseFloat(b.trx_balance)
    }
  },
  {
    field: 'total_trx_amount',
    label: 'TRX收入',
    formatter: (row: AgentItem) => row.total_trx_amount ?? 0
  },
  {
    field: 'total_usdt_amount',
    label: 'USDT收入',
    formatter: (row: AgentItem) => row.total_usdt_amount ?? 0
  },
  {
    field: 'gift_bandwidth',
    label: '是否赠送带宽',
    formatter: (row: AgentItem) => {
      return row.gift_bandwidth ? '赠送' : '不赠送'
    }
  },
  {
    field: 'status',
    label: '状态',
    formatter: (row: AgentItem) => {
      const config = STATUS_CONFIG[row.status as keyof typeof STATUS_CONFIG]
      if (!config) return <ElTag>未知</ElTag>
      return <ElTag type={config.type}>{config.text}</ElTag>
    }
  },
  {
    field: 'created_at',
    label: '创建时间',
    formatter: (row: AgentItem) => (row.created_at ? formatToDateTime(row.created_at) : '-')
  },
  {
    field: 'action',
    label: '操作',
    minWidth: '200px',
    formatter: (row: AgentItem) => renderActionButtons(row)
  }
])

// 渲染操作按钮
const renderActionButtons = (row: AgentItem) => {
  const isEnabled = row.status === 1
  const statusAction = {
    text: isEnabled ? '禁用' : '启用',
    type: (isEnabled ? 'danger' : 'success') as 'danger' | 'success',
    status: isEnabled ? 2 : 1
  }

  return (
    <div class="action-buttons">
      <BaseButton type="primary" onClick={() => handleEditAgent(row)}>
        编辑
      </BaseButton>
      <BaseButton type="primary" onClick={() => handleRecharge(row)}>
        充值
      </BaseButton>
      <BaseButton
        type={statusAction.type}
        onClick={() => handleUpdateStatus(row.id, statusAction.status, statusAction.text, row)}
      >
        {statusAction.text}
      </BaseButton>
    </div>
  )
}

// 事件处理
const handleAddAgent = () => {
  agentFormRef.value?.openDialog('add')
}

const handleEditAgent = (row: AgentItem) => {
  const editData = {
    id: row.id,
    username: row.username,
    email: row.email,
    gift_bandwidth: row.gift_bandwidth ? 1 : 0,
    status: row.status
  }
  agentFormRef.value?.openDialog('edit', editData)
}

const handleRecharge = (row: AgentItem) => {
  currentAccount.value = row
  rechargeDialogVisible.value = true
}

const handleUpdateStatus = async (
  id: number | string,
  status: number,
  actionText: string,
  row: AgentItem
) => {
  try {
    await ElMessageBox.confirm(`确定要${actionText}该代理吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await updateAgentStatus(id, status, row)
  } catch {
    // 用户取消操作
  }
}

const handleRechargeSuccess = (amount: number) => {
  ElMessage.success(`充值成功 ${amount} TRX`)
  searchTableRef.value?.reload()
}

const handleAgentSuccess = () => {
  searchTableRef.value?.reload()
}

const handleAgentError = (error: { type: 'add' | 'edit'; error: any }) => {
  console.error(`代理${error.type === 'add' ? '新增' : '编辑'}失败:`, error.error)
}
</script>

<style scoped>
.app-container {
  padding: 20px;
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-buttons .el-button {
  margin: 0;
}
</style>
