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
import { handleListMessage, handleErrorMessage, handleSuccessMessage } from '@/utils/messageHelper'

// 状态管理
const searchTableRef = ref<InstanceType<typeof SearchTable>>()
const agentFormRef = ref<InstanceType<typeof AgentForm>>()
const rechargeDialogVisible = ref(false)
const currentAccount = ref<AgentItem>()

// 导出
const handleExport = async () => {
  try {
    const params = (await searchTableRef.value?.searchMethods.getFormData()) || {}

    // 构建导出参数，只包含搜索条件，不包含分页信息
    const exportParams: any = {}

    // 搜索条件
    if (params.keyword) exportParams.keyword = params.keyword
    if (params.status) exportParams.status = params.status

    // 处理时间范围 - 转换为 Unix 时间戳（秒级，字符串格式）
    if (params.dateRange && params.dateRange.length === 2) {
      exportParams.start_time = String(Math.floor(new Date(params.dateRange[0]).getTime() / 1000))
      exportParams.end_time = String(Math.floor(new Date(params.dateRange[1]).getTime() / 1000))
    }

    console.log('导出参数:', exportParams)

    // 使用获取列表的接口进行导出
    const res = await getAgentListApi(exportParams)

    if (res.code === '000000' && res.data) {
      const list = (res.data.list || []).map((item: any) => ({
        联系方式: item.email || '-',
        代理名称: item.username || '-',
        机器人数量: item.bot_count ?? 0,
        总用户数: item.user_count ?? 0,
        TRX余额: item.trx_balance || '-',
        TRX收入: item.trx_income ?? '0',
        USDT收入: item.usdt_income ?? '0',
        是否赠送带宽: item.gift_bandwidth ? '赠送' : '不赠送',
        状态: item.status === 1 ? '启用' : item.status === 2 ? '禁用' : '未知',
        创建时间: item.created_at ? formatToDateTime(item.created_at * 1000) : '-'
      }))

      // 转换为 CSV
      const headers = Object.keys(list[0] || {})
      const csvContent = [
        headers.join(','),
        ...list.map((row: any) => headers.map((header) => `"${row[header] || ''}"`).join(','))
      ].join('\n')

      // 创建 Blob 并下载
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
      downloadByData(blob, '代理列表.csv')
      handleSuccessMessage('导出成功')
    } else {
      ElMessage.error('导出失败：数据格式错误')
    }
  } catch (error) {
    handleErrorMessage(error, '导出失败')
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
    const apiParams: any = { ...params }

    // 处理时间范围 - 转换为 Unix 时间戳（秒级，字符串格式）
    if (params?.dateRange && params.dateRange.length === 2) {
      apiParams.start_time = String(Math.floor(new Date(params.dateRange[0]).getTime() / 1000))
      apiParams.end_time = String(Math.floor(new Date(params.dateRange[1]).getTime() / 1000))
      delete apiParams.dateRange // 删除前端的 dateRange 字段
    }

    // 处理排序参数 - 字段名映射
    if (params?.order) {
      const fieldMapping: Record<string, string> = {
        trx_balance: 'trx_balance',
        created_at: 'created_at'
      }

      // 解析排序参数，格式：column ASC 或 column DESC
      const orderParts = params.order.split(' ')
      if (orderParts.length === 2) {
        const [field, direction] = orderParts
        const mappedField = fieldMapping[field] || field
        apiParams.order = `${mappedField} ${direction}`
      }
    }

    console.log('请求参数:', apiParams)
    const res = await getAgentListApi(apiParams)
    const data = (res?.data as any) || {}
    const list = data.list || data.items || []
    const total = data.totalCount || data.total || 0

    // 添加数据为空提示
    const hasSearchCondition = !!(params?.keyword || params?.status || params?.dateRange)
    handleListMessage(list, hasSearchCondition, '代理')

    return {
      list: list,
      total: total
    }
  } catch (error) {
    handleErrorMessage(error, '获取代理列表失败')
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
    handleSuccessMessage(status === 1 ? '启用成功' : '禁用成功')
    searchTableRef.value?.reload()
  } catch (error) {
    handleErrorMessage(error, '更新代理状态失败')
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
  {
    field: 'email',
    label: '联系方式',
    formatter: (row: AgentItem) => row.email || '-'
  },
  {
    field: 'username',
    label: '代理名称',
    formatter: (row: AgentItem) => row.username || '-'
  },
  {
    field: 'bot_count',
    label: '机器人数量',
    formatter: (row: AgentItem) => row.bot_count ?? 0
  },
  {
    field: 'user_count',
    label: '总用户数',
    formatter: (row: AgentItem) => row.user_count ?? 0
  },
  {
    field: 'trx_balance',
    label: 'TRX余额',
    sortable: 'custom',
    formatter: (row: AgentItem) => row.trx_balance || '-'
  },
  {
    field: 'trx_income',
    label: 'TRX收入',
    formatter: (row: AgentItem) => row.trx_income ?? '0'
  },
  {
    field: 'usdt_income',
    label: 'USDT收入',
    formatter: (row: AgentItem) => row.usdt_income ?? '0'
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
    sortable: 'custom',
    formatter: (row: AgentItem) => (row.created_at ? formatToDateTime(row.created_at * 1000) : '-')
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
