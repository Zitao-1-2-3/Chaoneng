<template>
  <div class="app-container">
    <ContentWrap>
      <SearchTable
        ref="searchTableRef"
        :columns="columns"
        :searchSchema="searchSchema"
        :fetchDataApi="getAgentList"
        @search="handleSearch"
        @selection-change="handleSelectionChange"
        :show-add-button="false"
      >
        <template #leftToolbar>
          <BaseButton type="primary" @click="handleAddAgent">新增代理</BaseButton>
          <template v-if="!isBatchEditMode">
            <BaseButton type="warning" @click="handleBatchEdit">批量修改</BaseButton>
          </template>
          <template v-else>
            <BaseButton type="success" @click="handleBatchSave">保存</BaseButton>
            <BaseButton @click="handleBatchCancel">取消</BaseButton>
          </template>
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
import { ref, nextTick, reactive, computed } from 'vue'
import {
  ElMessage,
  ElSelect,
  ElOption,
  ElSwitch,
  ElAutocomplete,
  ElForm,
  ElFormItem
} from 'element-plus'
import { SearchTable } from '@/components/SearchTable'
import { FormSchema } from '@/components/Form'
import { TableColumn } from '@/components/Table'
import { formatToDateTime } from '@/utils/dateUtil'
import {
  getAgentListApi,
  updateAgentApi,
  batchUpdateAgentApi,
  type AgentItem,
  type UpdateAgentPayload
} from '@/api/agent/list'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import RechargeDialog from './components/RechargeDialog.vue'
import AgentForm from './components/AgentForm.vue'
import { simpleExportToExcel } from '@/utils/excel'
import { handleListMessage, handleErrorMessage, handleSuccessMessage } from '@/utils/messageHelper'

// 状态管理
const searchTableRef = ref<InstanceType<typeof SearchTable>>()
const agentFormRef = ref<InstanceType<typeof AgentForm>>()
const rechargeDialogVisible = ref(false)
const currentAccount = ref<AgentItem>()

// 批量修改状态
const isBatchEditMode = ref(false)
const selectedAgentIds = ref<number[]>([])
const batchPriceId = ref<number>(0) // 0 表示未选择

// 联系方式编辑状态
const editingEmailId = ref<number | null>(null)
const editingEmailValue = ref('')
const emailFormData = reactive({ email: '' })
const emailFormRef = ref()
let autoExitTimer: ReturnType<typeof setTimeout> | null = null

// 邮箱验证规则
const emailRules = {
  email: [
    {
      validator: (_rule: any, value: any, callback: any) => {
        if (!value) {
          callback()
          return
        }
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
        if (!emailRegex.test(value)) {
          callback(new Error('请输入正确的邮箱格式'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 常用邮箱后缀
const EMAIL_SUFFIXES = [
  '@qq.com',
  '@gmail.com',
  '@163.com',
  '@126.com',
  '@sina.com',
  '@outlook.com',
  '@hotmail.com',
  '@yahoo.com'
]

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
        代理等级: getAgentLevelText(item.price_id),
        机器人数量: item.bot_count ?? 0,
        总用户数: item.user_count ?? 0,
        TRX余额: item.trx_balance || '-',
        TRX收入: item.trx_income ?? '0',
        USDT收入: item.usdt_income ?? '0',
        是否赠送带宽: item.gift_bandwidth ? '赠送' : '不赠送',
        状态: item.status === 1 ? '启用' : item.status === 2 ? '禁用' : '未知',
        创建时间: item.created_at ? formatToDateTime(item.created_at * 1000) : '-'
      }))

      // 导出为 Excel
      simpleExportToExcel(list, '代理列表')
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

// 代理等级选项（用于批量修改表头下拉框）
const BATCH_AGENT_LEVEL_OPTIONS = [
  { label: '选择等级', value: 0 },
  { label: '一级代理', value: 1 },
  { label: '二级代理', value: 2 },
  { label: '三级代理', value: 3 }
]

// 代理等级选项（用于表格单元格下拉框）
const AGENT_LEVEL_OPTIONS = [
  { label: '一级代理', value: 1 },
  { label: '二级代理', value: 2 },
  { label: '三级代理', value: 3 }
]

// 代理等级映射
const AGENT_LEVEL_MAP: Record<number, string> = {
  1: '一级代理',
  2: '二级代理',
  3: '三级代理'
}

// 辅助函数：构建更新代理的 payload
const buildUpdatePayload = (
  id: number | string,
  row: AgentItem,
  updates: Partial<UpdateAgentPayload>
): UpdateAgentPayload => ({
  id,
  email: row.email || undefined,
  gift_bandwidth: row.gift_bandwidth,
  status: row.status,
  price_id: row.price_id,
  ...updates
})

// 辅助函数：重置批量修改状态
const resetBatchEditState = () => {
  isBatchEditMode.value = false
  selectedAgentIds.value = []
  batchPriceId.value = 0
}

// 辅助函数：获取代理等级文本
const getAgentLevelText = (priceId?: number): string => {
  return priceId ? AGENT_LEVEL_MAP[priceId] || '未设置' : '未设置'
}

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
    await updateAgentApi(buildUpdatePayload(id, row, { status }))
    handleSuccessMessage(status === 1 ? '启用成功' : '禁用成功')
    searchTableRef.value?.reload()
  } catch (error) {
    handleErrorMessage(error, '更新代理状态失败')
  }
}

// 更新代理等级
const updateAgentLevel = async (id: number | string, priceId: number, row: AgentItem) => {
  try {
    await updateAgentApi(buildUpdatePayload(id, row, { price_id: priceId }))
    handleSuccessMessage('代理等级更新成功')
    searchTableRef.value?.reload()
  } catch (error) {
    handleErrorMessage(error, '更新代理等级失败')
  }
}

// 更新是否赠送带宽
const updateGiftBandwidth = async (id: number | string, giftBandwidth: boolean, row: AgentItem) => {
  try {
    await updateAgentApi(buildUpdatePayload(id, row, { gift_bandwidth: giftBandwidth }))
    handleSuccessMessage(giftBandwidth ? '已开启赠送带宽' : '已关闭赠送带宽')
    searchTableRef.value?.reload()
  } catch (error) {
    handleErrorMessage(error, '更新赠送带宽状态失败')
    searchTableRef.value?.reload()
  }
}

// 联系方式编辑相关函数
const handleEmailDoubleClick = (row: AgentItem) => {
  // 清除之前的定时器
  if (autoExitTimer) {
    clearTimeout(autoExitTimer)
    autoExitTimer = null
  }

  editingEmailId.value = row.id
  editingEmailValue.value = row.email || ''
  emailFormData.email = row.email || ''

  // 下一帧自动聚焦到输入框
  nextTick(() => {
    const autocomplete = document.querySelector(
      '.email-edit-wrapper .el-autocomplete input'
    ) as HTMLInputElement
    if (autocomplete) {
      autocomplete.focus()
      // 将光标移到末尾
      autocomplete.setSelectionRange(autocomplete.value.length, autocomplete.value.length)
    }
  })
}

// el-autocomplete 的查询建议函数
const queryEmailSuggestions = (queryString: string, cb: (suggestions: any[]) => void) => {
  if (!queryString) {
    cb([])
    return
  }

  // 如果已经包含 @，只返回当前输入
  if (queryString.includes('@')) {
    cb([{ value: queryString }])
    return
  }

  // 根据输入的前缀生成建议列表
  const suggestions = EMAIL_SUFFIXES.map((suffix) => ({
    value: queryString + suffix
  }))

  cb(suggestions)
}

// 处理选择建议
const handleSelectSuggestion = (item: { value: string }) => {
  editingEmailValue.value = item.value
  emailFormData.email = item.value
}

// 输入时更新值
const handleEmailInput = (value: string) => {
  editingEmailValue.value = value
  emailFormData.email = value

  // 清除自动退出定时器(用户正在输入)
  if (autoExitTimer) {
    clearTimeout(autoExitTimer)
    autoExitTimer = null
  }

  // 检查邮箱格式
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  const isValidEmail = !value || emailRegex.test(value)

  // 如果格式错误，启动5秒自动退出定时器
  if (!isValidEmail) {
    autoExitTimer = setTimeout(() => {
      editingEmailId.value = null
      autoExitTimer = null
    }, 5000)
  }
}

const handleEmailBlur = async (row: AgentItem) => {
  // 延迟关闭,以便点击建议时能触发
  setTimeout(async () => {
    // 验证表单
    try {
      await emailFormRef.value?.validate()
    } catch (error) {
      // 验证失败,不保存
      return
    }

    // 如果值没有变化,直接取消编辑
    if (emailFormData.email === (row.email || '')) {
      editingEmailId.value = null
      return
    }

    // 更新邮箱
    try {
      await updateAgentApi(
        buildUpdatePayload(row.id, row, { email: emailFormData.email || undefined })
      )
      handleSuccessMessage('联系方式更新成功')
      editingEmailId.value = null
      searchTableRef.value?.reload()
    } catch (error) {
      handleErrorMessage(error, '更新联系方式失败')
      editingEmailId.value = null
    }
  }, 200)
}

// 处理搜索
const handleSearch = () => {
  // SearchTable 组件会自动处理搜索逻辑
}

// 处理表格选择变化
const handleSelectionChange = (selection: AgentItem[]) => {
  selectedAgentIds.value = selection.map((item) => item.id)
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
const columns = computed<TableColumn[]>(() => [
  // 批量修改模式下的复选框列
  {
    field: 'selection',
    label: '',
    type: 'selection',
    width: '55px',
    align: 'center',
    headerAlign: 'center',
    hidden: !isBatchEditMode.value
  },
  {
    field: 'email',
    label: '联系方式',
    minWidth: '200px',
    formatter: (row: AgentItem) => {
      const isEditing = editingEmailId.value === row.id
      if (isEditing) {
        return (
          <div class="email-edit-wrapper">
            <ElForm ref={emailFormRef} model={emailFormData} rules={emailRules}>
              <ElFormItem prop="email">
                <ElAutocomplete
                  modelValue={emailFormData.email}
                  onInput={(val: string) => handleEmailInput(val)}
                  fetchSuggestions={queryEmailSuggestions}
                  clearable
                  onSelect={handleSelectSuggestion}
                  onBlur={() => handleEmailBlur(row)}
                  style="width: 100%"
                >
                  {{
                    default: ({ item }: { item: { value: string } }) => (
                      <div class="suggestion-item">{item.value}</div>
                    )
                  }}
                </ElAutocomplete>
              </ElFormItem>
            </ElForm>
          </div>
        )
      }
      return (
        <div class="email-display" onDblclick={() => handleEmailDoubleClick(row)}>
          {row.email || '-'}
        </div>
      )
    }
  },
  {
    field: 'username',
    label: '代理名称',
    formatter: (row: AgentItem) => row.username || '-'
  },
  {
    field: 'price_id',
    label: '代理等级',
    minWidth: '150px',
    slots: {
      header: () => {
        // 批量修改模式下，表头只显示下拉选择框
        if (isBatchEditMode.value) {
          return (
            <div
              style="display: flex; align-items: center; justify-content: center;"
              onClick={(e: Event) => {
                // 只阻止点击 div 本身时的排序，不阻止下拉框的点击
                if ((e.target as HTMLElement).tagName === 'DIV') {
                  e.stopPropagation()
                }
              }}
            >
              <ElSelect
                modelValue={batchPriceId.value}
                onChange={(value: number) => handleBatchPriceLevelChange(value)}
                size="small"
                placeholder="选择等级"
                style="width: 100px"
              >
                {BATCH_AGENT_LEVEL_OPTIONS.map((option) => (
                  <ElOption key={option.value} label={option.label} value={option.value} />
                ))}
              </ElSelect>
            </div>
          )
        }
        return <span>代理等级</span>
      }
    },
    formatter: (row: AgentItem) => {
      // 批量修改模式下，单元格只显示文本
      if (isBatchEditMode.value) {
        return getAgentLevelText(row.price_id)
      }
      // 正常模式下，显示下拉选择框
      return (
        <ElSelect
          modelValue={row.price_id || 1}
          onChange={(value: number) => updateAgentLevel(row.id, value, row)}
          size="small"
          style="width: 120px"
        >
          {AGENT_LEVEL_OPTIONS.map((option) => (
            <ElOption key={option.value} label={option.label} value={option.value} />
          ))}
        </ElSelect>
      )
    }
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
    minWidth: '120px',
    formatter: (row: AgentItem) => {
      return (
        <ElSwitch
          modelValue={row.gift_bandwidth}
          onChange={(value: boolean) => updateGiftBandwidth(row.id, value, row)}
          activeText="赠送"
          inactiveText="不赠送"
          inline-prompt
        />
      )
    }
  },
  {
    field: 'status',
    label: '状态',
    minWidth: '100px',
    formatter: (row: AgentItem) => {
      return (
        <ElSwitch
          modelValue={row.status === 1}
          onChange={(value: boolean) => updateAgentStatus(row.id, value ? 1 : 2, row)}
          activeText="启用"
          inactiveText="禁用"
          inline-prompt
        />
      )
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
    fixed: 'right',
    formatter: (row: AgentItem) => renderActionButtons(row)
  }
])

// 渲染操作按钮
const renderActionButtons = (row: AgentItem) => {
  return (
    <div class="action-buttons">
      <BaseButton type="primary" onClick={() => handleEditAgent(row)}>
        修改密码
      </BaseButton>
      <BaseButton type="primary" onClick={() => handleRecharge(row)}>
        充值
      </BaseButton>
    </div>
  )
}

// 事件处理
const handleAddAgent = () => {
  agentFormRef.value?.openDialog('add')
}

const handleBatchEdit = () => {
  resetBatchEditState()
  isBatchEditMode.value = true
}

const handleBatchSave = async () => {
  if (!selectedAgentIds.value.length) {
    ElMessage.warning('请先选择要修改的代理')
    return
  }

  if (batchPriceId.value === 0) {
    ElMessage.warning('请选择要修改的代理等级')
    return
  }

  try {
    await batchUpdateAgentApi({
      ids: selectedAgentIds.value,
      price_id: batchPriceId.value
    })
    handleSuccessMessage(`成功修改 ${selectedAgentIds.value.length} 个代理的等级`)
    resetBatchEditState()
    searchTableRef.value?.reload()
  } catch (error) {
    handleErrorMessage(error, '批量修改代理等级失败')
  }
}

const handleBatchCancel = () => {
  resetBatchEditState()
}

// 批量修改代理等级（只保存选择）
const handleBatchPriceLevelChange = (priceId: number) => {
  batchPriceId.value = priceId
}

const handleEditAgent = (row: AgentItem) => {
  const editData = {
    id: row.id,
    username: row.username,
    email: row.email || undefined,
    status: row.status,
    gift_bandwidth: row.gift_bandwidth ? 1 : 0, // 保留用于编辑时保持原值
    price_id: row.price_id // 保留用于编辑时保持原值
  }
  agentFormRef.value?.openDialog('edit', editData)
}

const handleRecharge = (row: AgentItem) => {
  currentAccount.value = row
  rechargeDialogVisible.value = true
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

/* 联系方式编辑样式 */
.email-display {
  padding: 4px 8px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.email-display:hover {
  background-color: #f5f7fa;
}

.email-edit-wrapper {
  width: 100%;
}

.email-edit-wrapper .el-form {
  margin: 0;
}

.email-edit-wrapper .el-form-item {
  margin-bottom: 0;
}

.email-edit-wrapper .el-autocomplete {
  width: 100%;
}

.suggestion-item {
  padding: 4px 0;
  font-size: 14px;
}
</style>
