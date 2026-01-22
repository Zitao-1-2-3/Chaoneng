<template>
  <div class="app-container">
    <ContentWrap>
      <SearchTable
        ref="searchTableRef"
        :columns="columns"
        :searchSchema="searchSchema"
        :fetchDataApi="getAgentList"
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
  updateAgentStatusApi,
  exportAgentListApi, // 新增导入
  type AgentItem,
  type UpdateAgentStatusPayload,
  type AgentListParams // 新增导入
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
    // 处理时间范围
    const exportParams: any = { ...params }
    if (params.dateRange && params.dateRange.length === 2) {
      exportParams.start_time = params.dateRange[0]
      exportParams.end_time = params.dateRange[1]
      delete exportParams.dateRange
    }
    const res = await exportAgentListApi(exportParams as AgentListParams)
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
    // 处理时间范围
    const apiParams = { ...params }
    if (params?.dateRange && params.dateRange.length === 2) {
      apiParams.start_time = params.dateRange[0]
      apiParams.end_time = params.dateRange[1]
      delete apiParams.dateRange
    }
    const res = await getAgentListApi(apiParams)
    const data = (res?.data as any) || {}
    return {
      list: data.list || data.items || [],
      total: data.totalCount || data.total || 0
    }
  } catch (error) {
    console.error('获取代理列表失败:', error)
    ElMessage.error('获取代理列表失败')
    return { list: [], total: 0 }
  }
}

const updateAgentStatus = async (id: number | string, status: number) => {
  try {
    const payload: UpdateAgentStatusPayload = { id, status }
    await updateAgentStatusApi(payload)
    ElMessage.success(status === 1 ? '启用成功' : '禁用成功')
    searchTableRef.value?.reload()
  } catch (error) {
    console.error('更新代理状态失败:', error)
    ElMessage.error('更新代理状态失败')
  }
}

// 表单配置
const searchSchema = ref<FormSchema[]>([
  {
    field: 'query',
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
  { field: 'bot_num', label: '机器人数量' },
  { field: 'tg_account_num', label: '总用户数' },
  {
    field: 'trx_mount',
    label: 'TRX余额',
    sortable: true,
    sortMethod: (a: any, b: any) => {
      // 确保将值转换为浮点数进行比较
      return parseFloat(a.trx_mount) - parseFloat(b.trx_mount)
    }
  },
  { field: 'total_trx_amount', label: 'TRX收入' },
  { field: 'total_usdt_amount', label: 'USDT收入' },
  {
    field: 'gift_bandwidth',
    label: '是否赠送带宽',
    formatter: (row: AgentItem) => {
      return row.gift_bandwidth === 1 ? '赠送' : '不赠送'
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
    field: 'create_time',
    label: '创建时间',
    formatter: (row: AgentItem) => (row.create_time ? formatToDateTime(row.create_time) : '-')
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
        onClick={() => handleUpdateStatus(row.id, statusAction.status, statusAction.text)}
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
  agentFormRef.value?.openDialog('edit', {
    id: row.id,
    username: row.user_name,
    email: row.email,
    status: row.status
  })
}

const handleRecharge = (row: AgentItem) => {
  currentAccount.value = row
  rechargeDialogVisible.value = true
}

const handleUpdateStatus = async (id: number | string, status: number, actionText: string) => {
  try {
    await ElMessageBox.confirm(`确定要${actionText}该代理吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await updateAgentStatus(id, status)
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
