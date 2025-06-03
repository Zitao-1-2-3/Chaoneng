<template>
  <div class="app-container">
    <ContentWrap>
      <!-- 使用SearchTable组件 -->
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
      </SearchTable>
    </ContentWrap>
    <RechargeDialog
      v-model:visible="rechargeDialogVisible"
      :user="currentAccount"
      @success="handleRechargeSuccess"
    />
    <!-- 新增/编辑代理弹窗 -->
    <AgentForm ref="agentFormRef" @success="handleAgentFormSuccess" @error="handleAgentFormError" />
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
  AgentItem,
  UpdateAgentStatusPayload
} from '@/api/agent/list'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import RechargeDialog from './components/RechargeDialog.vue'
import AgentForm from './components/AgentForm.vue'

const searchTableRef = ref<InstanceType<typeof SearchTable>>()
const agentFormRef = ref<InstanceType<typeof AgentForm>>()

const rechargeDialogVisible = ref(false)
const currentAccount = ref<AgentItem>()

// --- API 调用封装 ---

// 获取代理列表API封装
const getAgentList = async (params?: any): Promise<{ list: AgentItem[]; total?: number }> => {
  try {
    const res = await getAgentListApi(params)
    if (res && res.data) {
      const list = (res.data as any).list || (res.data as any).items || []
      const total = (res.data as any).total || (res.data as any).count || 0
      return { list, total }
    }
    return { list: [], total: 0 }
  } catch (error) {
    console.error('获取代理列表失败:', error)
    ElMessage.error('获取代理列表失败')
    return { list: [], total: 0 }
  }
}

// 更新代理状态API封装
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

// --- SearchTable 配置 ---

// 搜索表单配置
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
      options: [
        { label: '全部', value: '' },
        { label: '启用', value: 1 },
        { label: '禁用', value: 2 }
      ]
    }
  }
])

// 表格列配置
const columns = ref<TableColumn[]>([
  {
    field: 'email',
    label: '联系方式'
  },
  {
    field: 'username',
    label: '代理名称'
  },
  {
    field: 'bot_num',
    label: '机器人数量'
  },
  {
    field: 'tg_account_num',
    label: '总用户数'
  },
  {
    field: 'trx_mount',
    label: 'TRX余额'
  },
  {
    field: 'total_trx_amount',
    label: 'TRX收入'
  },
  {
    field: 'total_usdt_amount',
    label: 'USDT收入'
  },
  {
    field: 'status',
    label: '状态',
    formatter: (row: AgentItem) => {
      const status = row.status
      const isEnabled = status === 1
      const text = isEnabled ? '启用' : '禁用'
      const type: 'success' | 'danger' = isEnabled ? 'success' : 'danger'
      return <ElTag type={type}>{text}</ElTag>
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
    formatter: (row: AgentItem) => {
      const isEnabled = row.status === 1
      const targetStatus = isEnabled ? 2 : 1
      const buttonText = isEnabled ? '禁用' : '启用'
      const buttonType = isEnabled ? 'danger' : 'success'
      const actionText = isEnabled ? '禁用' : '启用'

      return (
        <>
          <BaseButton type="primary" class="mr-1" onClick={() => handleEditAgent(row)}>
            编辑
          </BaseButton>
          <BaseButton
            type="primary"
            class="mr-1"
            onClick={() => {
              currentAccount.value = row
              rechargeDialogVisible.value = true
            }}
          >
            充值
          </BaseButton>
          <BaseButton
            type={buttonType}
            onClick={() => handleUpdateStatus(row.id, targetStatus, actionText)}
          >
            {buttonText}
          </BaseButton>
        </>
      )
    }
  }
])

// --- 事件处理 ---

// 处理搜索
const handleSearch = (params: any) => {
  console.log('搜索参数:', params)
}

// 处理状态更新按钮点击
const handleUpdateStatus = (id: number | string, status: number, actionText: string) => {
  ElMessageBox.confirm(`确定要${actionText}该代理吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      await updateAgentStatus(id, status)
    })
    .catch(() => {
      ElMessage.info('操作已取消')
    })
}

// 处理充值成功
const handleRechargeSuccess = (amount: number) => {
  ElMessage.success(`充值成功 ${amount} TRX`)
  searchTableRef.value?.reload()
}

// AgentForm 成功事件处理
const handleAgentFormSuccess = (result: { type: 'add' | 'edit'; data: any }) => {
  console.log(`代理${result.type === 'add' ? '新增' : '编辑'}成功:`, result.data)
  searchTableRef.value?.reload() // 操作成功后刷新列表
}

// AgentForm 错误事件处理
const handleAgentFormError = (error: { type: 'add' | 'edit'; error: any }) => {
  console.error(`代理${error.type === 'add' ? '新增' : '编辑'}失败:`, error.error)
  // 错误消息已经在 AgentForm 中显示，这里可以添加额外的错误处理逻辑
}

// 新增代理按钮点击处理
const handleAddAgent = () => {
  agentFormRef.value?.openDialog('add')
}

// 编辑代理按钮点击处理
const handleEditAgent = (row: AgentItem) => {
  // 直接传递行数据，AgentForm 内部会处理密码等字段的显示逻辑
  agentFormRef.value?.openDialog('edit', row as any)
}
</script>

<style scoped>
.app-container {
  padding: 20px;
}

.mr-1 {
  margin-right: 5px;
}
</style>
