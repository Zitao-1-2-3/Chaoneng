<template>
  <div class="app-container">
    <ContentWrap>
      <!-- 使用优化后的SearchTable组件 -->
      <SearchTable
        :columns="columns"
        :search-schema="searchSchema"
        :fetch-data-api="fetchDataWrapper"
        :fetch-del-api="fetchEnergyTransactionDelete"
        :action-column="actionColumn"
        :table-props="{
          rowKey: 'id',
          highlightCurrentRow: false,
          reserveSelection: false
        }"
        :show-add-button="false"
        ref="searchTableRef"
        @add="handleAdd"
        @loaded="handleDataLoaded"
        @error="handleLoadError"
        @search="onSearch"
        :search-props="{
          layout: 'inline',
          buttonPosition: 'center'
        }"
        :pagination="{
          total: totalCount
        }"
        @ready="onSearchTableReady"
      >
        <template #searchButtons>
          <BaseButton type="primary" @click="handleExport">
            <Icon icon="ep:download" class="mr-5px" />
            导出
          </BaseButton>
        </template>
      </SearchTable>

      <!-- 详情弹窗 -->
      <Dialog v-model="dialogVisible" title="添加能量交易">
        <Form :isCol="false" :schema="formSchema" @register="formRegister" />
        <template #footer>
          <div class="flex justify-end">
            <ElButton @click="dialogVisible = false">
              {{ t('common.cancel') }}
            </ElButton>
            <ElButton type="primary" @click="handleSubmit">提交</ElButton>
          </div>
        </template>
      </Dialog>
    </ContentWrap>
    <!-- 添加详情组件 -->
    <OrderDetail ref="orderDetailRef" />
  </div>
</template>

<script setup lang="tsx">
import { ref, reactive, h, computed } from 'vue'
import { ElButton, ElMessage, ElTag } from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import { Dialog } from '@/components/Dialog'
import { Form, FormSchema } from '@/components/Form'
import { SearchTable } from '@/components/SearchTable'
import { useForm } from '@/hooks/web/useForm'
import { useI18n } from '@/hooks/web/useI18n'
import { useValidator } from '@/hooks/web/useValidator'
import { BaseButton } from '@/components/Button'
import OrderDetail from './components/OrderDetail.vue'
import {
  updateEnergyTransactionStatusApi,
  v2GetEnergyList,
  v2RecycleOrder
} from '@/api/energy_transaction'
import type { V2EnergyItem } from '@/api/energy_transaction/types'
import { formatToDateTime } from '@/utils/dateUtil'
import { useRoute } from 'vue-router'
import { formatToWan } from '@/utils'
import { simpleExportToExcel } from '@/utils/excel'
import { handleListMessage, handleErrorMessage, handleSuccessMessage } from '@/utils/messageHelper'
import { getStatusText, getStatusType, ORDER_STATUS_OPTIONS } from '@/utils/orderStatus'
import { getSourceText, SOURCE_TYPE_OPTIONS } from '@/utils/sourceFilter'
import {
  getEnergyOrderKindText,
  ENERGY_ORDER_KIND_OPTIONS,
  calculateEnergyRentText,
  formatEnergyAmount
} from '@/utils/energyOrder'

const { t } = useI18n()
const { required } = useValidator()
const orderDetailRef = ref()

// 定义 ElTag 允许的类型
type ElTagType = 'success' | 'warning' | 'info' | 'primary' | 'danger'

// 当前选择的来源
const selectedSource = ref<number | string>('')

// 导出 - 直接使用后端字段名
const handleExport = async () => {
  try {
    // 尝试获取当前搜索条件，如果失败则使用保存的参数
    let params
    try {
      params = await searchTableRef.value?.searchMethods?.getFormData()
    } catch (e) {
      // 如果 getFormData 不可用，使用保存的搜索参数
      params = currentSearchParams.value
    }

    // 构建新接口参数
    const apiParams: any = {}

    // 处理时间范围（毫秒转秒）
    if (params?.dateRange && params.dateRange.length === 2) {
      apiParams.start_time = String(Math.floor(params.dateRange[0] / 1000))
      apiParams.end_time = String(Math.floor(params.dateRange[1] / 1000))
    }

    // 处理关键字查询
    if (params?.keyword) {
      apiParams.keyword = params.keyword
    }

    // 处理来源
    if (params?.origin !== undefined && params?.origin !== '') {
      apiParams.origin = Number(params.origin)
    }

    // 处理订单类型
    if (params?.kind) {
      apiParams.kind = params.kind
    }

    // 处理收款钱包地址
    if (params?.receive_address) {
      apiParams.receive_address = params.receive_address
    }

    // 处理能量接收地址
    if (params?.energy_address) {
      apiParams.energy_address = params.energy_address
    }

    // 处理状态
    if (params?.status) {
      apiParams.status = params.status
    }

    console.log('导出参数:', apiParams)

    // 使用获取列表的接口，传入搜索条件
    const res = await v2GetEnergyList(apiParams)

    if (res.code === '000000' && res.data && res.data.list) {
      // 将数据转换为 Excel 格式，直接使用后端字段名
      const list = res.data.list.map((item: any) => ({
        订单号: item.id || '-',
        代理名称: item.agent_name || '-',
        用户账号: item.username || '-',
        用户邮箱: item.email || '-',
        来源: getSourceText(item.origin, item.tg_user_name, item.username),
        订单类型: getEnergyOrderKindText(item.kind),
        交易金额: `${item.amount || '-'} ${item.coin || ''}`.trim(),
        应发放能量: formatEnergyAmount(item.energy_amount),
        实际发放能量: formatEnergyAmount(item.energy_actual_amount),
        收款钱包地址: item.receive_address || '-',
        能量接收地址: item.energy_address || '-',
        笔数: item.energy_count || '-',
        订单状态: getStatusText(item.status),
        备注: item.describe || '-',
        创建时间: item.created_at ? formatToDateTime(item.created_at) : '-',
        回收时间: item.recycled_at ? formatToDateTime(new Date(item.recycled_at).getTime()) : '-'
      }))

      // 导出为 Excel
      simpleExportToExcel(list, '能量订单列表')
      handleSuccessMessage('订单导出成功')
    } else {
      ElMessage.error('导出失败：数据格式错误')
    }
  } catch (error) {
    handleErrorMessage(error, '订单导出失败')
  }
}

// 停止代理 - 使用后端字段名
const handleStop = async (row) => {
  try {
    await v2RecycleOrder(row.id)
    handleSuccessMessage('停止代理成功')
    searchTableRef.value?.reload()
  } catch (error) {
    handleErrorMessage(error, '停止代理失败')
  }
}

// --- 表格列配置 - 使用后端字段名 ---
const columns = computed(() => {
  const allCols = [
    {
      field: 'id',
      label: '订单ID',
      minWidth: 180,
      formatter: (row) => row.id || '-'
    },
    {
      field: 'agent_name',
      label: '代理名称',
      width: 120,
      formatter: (row) => row.agent_name || '-'
    },
    {
      field: 'tg_user_name',
      label: 'TG用户名',
      width: 120,
      hideWhen: 2, // H5时隐藏
      formatter: (row) => row.tg_user_name || '-'
    },
    {
      field: 'tg_first_name',
      label: 'TG用户昵称',
      width: 120,
      hideWhen: 2, // H5时隐藏
      formatter: (row) => row.tg_first_name || '-'
    },
    {
      field: 'username',
      label: '用户账号',
      width: 120,
      hideWhen: 1, // 来源为机器人(1)时隐藏
      formatter: (row) => row.username || '-'
    },
    {
      field: 'email',
      label: '用户邮箱',
      minWidth: 150,
      hideWhen: 1, // 来源为机器人(1)时隐藏
      formatter: (row) => row.email || '-'
    },
    {
      field: 'origin',
      label: '来源',
      width: 100,
      formatter: (row) => getSourceText(row.origin, row.tg_user_name, row.username)
    },
    {
      field: 'kind',
      label: '订单类型',
      width: 120,
      formatter: (row) => getEnergyOrderKindText(row.kind)
    },
    {
      field: 'amount',
      label: '交易金额',
      width: 100,
      formatter: (row) => {
        const amount = row.amount ?? ''
        const unit = row.coin ?? ''
        return amount || unit ? `${amount} ${unit}`.trim() : '-'
      }
    },
    {
      field: 'energy_amount',
      label: '应发放能量',
      width: 100,
      formatter: (row) => formatToWan(row.energy_amount) || '-'
    },
    {
      field: 'energy_actual_amount',
      label: '实际发放能量',
      width: 110,
      formatter: (row) => formatToWan(row.energy_actual_amount) || '-'
    },
    {
      field: 'receive_address',
      label: '收款钱包地址',
      minWidth: 200,
      formatter: (row) => row.receive_address || '-'
    },
    {
      field: 'energy_address',
      label: '能量接收地址',
      minWidth: 200,
      formatter: (row) => row.energy_address || '-'
    },
    {
      field: 'energy_count',
      label: '笔数',
      width: 100,
      formatter: (row) => (row.energy_count == 0 ? '-' : row.energy_count)
    },
    {
      field: 'energy_rent_text',
      label: '有效时长',
      width: 100,
      formatter: (row) => calculateEnergyRentText(row.kind, row.delegated_at, row.recycled_at)
    },
    {
      field: 'recycled_at',
      label: '回收时间',
      sortable: 'custom',
      width: 160,
      formatter: (row) => {
        if (!row.recycled_at) return '-'
        try {
          return formatToDateTime(new Date(row.recycled_at).getTime())
        } catch (e) {
          return '-'
        }
      }
    },
    {
      field: 'status',
      label: '状态',
      width: 100,
      slots: {
        default: ({ row }) => {
          const type = getStatusType(row.status)
          const text = getStatusText(row.status)
          return h(ElTag, { type: type as any, size: 'small' }, () => text)
        }
      }
    },
    {
      field: 'created_at',
      label: '创建时间',
      sortable: 'custom',
      width: 160,
      formatter: (row) => (row.created_at ? formatToDateTime(row.created_at) : '-')
    },
    {
      field: 'describe',
      label: '描述',
      width: 160,
      formatter: (row) => row.describe || '-'
    }
  ]

  // 根据来源过滤列
  const filteredCols = allCols.filter((col) => {
    if (!col.hideWhen) return true
    return selectedSource.value !== col.hideWhen
  })

  console.log(
    '[运营端能量交易订单 columns] 过滤后的列数:',
    filteredCols.length,
    '来源:',
    selectedSource.value
  )

  return filteredCols
})

// 操作列配置 - 使用后端字段名
const actionColumn = {
  field: 'action',
  label: '操作',
  minWidth: 200,
  fixed: 'right' as const,
  slots: {
    default: (data: any) => {
      const row = data.row
      // 只有 status=3 时才可点击停止代理按钮
      const canStop = row.status === 3

      return (
        <>
          {canStop ? (
            <BaseButton type="danger" onClick={() => handleStop(row)}>
              停止代理
            </BaseButton>
          ) : (
            <BaseButton type="info" disabled>
              停止代理
            </BaseButton>
          )}
          <BaseButton type="primary" onClick={() => handleDetail(row)}>
            详情
          </BaseButton>
        </>
      )
    }
  }
}

// 搜索表单配置 - 使用后端字段名
const searchSchema = [
  {
    field: 'keyword',
    component: 'Input' as const,
    label: {
      tips: 'TG用户ID/TG用户名/TG用户昵称/机器人名称/代理名称/用户账号/用户邮箱',
      text: '关键词'
    },
    componentProps: {
      placeholder: '请输入关键词',
      clearable: true
    }
  },
  {
    field: 'origin',
    component: 'Select' as const,
    label: '来源',
    componentProps: {
      placeholder: '请选择来源',
      clearable: true,
      options: SOURCE_TYPE_OPTIONS
    }
  },
  {
    field: 'receive_address',
    component: 'Input' as const,
    label: '收款钱包地址:',
    componentProps: {
      placeholder: '请输入收款钱包地址',
      clearable: true
    }
  },
  {
    field: 'energy_address',
    component: 'Input' as const,
    label: '能量接收地址:',
    componentProps: {
      placeholder: '请输入能量接收地址',
      clearable: true
    }
  },
  {
    field: 'status',
    component: 'Select' as const,
    label: '状态：',
    componentProps: {
      placeholder: '请选择状态',
      clearable: true,
      options: ORDER_STATUS_OPTIONS
    }
  },
  {
    field: 'kind',
    component: 'Select' as const,
    label: '订单类型：',
    componentProps: {
      placeholder: '请选择订单类型',
      options: ENERGY_ORDER_KIND_OPTIONS
    }
  },
  {
    field: 'dateRange',
    component: 'DatePicker' as const,
    label: '创建时间',
    componentProps: {
      type: 'datetimerange',
      valueFormat: 'x',
      startPlaceholder: '开始日期',
      endPlaceholder: '结束日期'
    }
  }
]

// 表单配置
const formSchema = reactive<FormSchema[]>([
  {
    field: 'agentId',
    component: 'Input' as const,
    label: '代理ID：',
    componentProps: {
      placeholder: '请输入代理ID'
    },
    formItemProps: {
      rules: [required()]
    }
  },
  {
    field: 'orderType',
    component: 'Select' as const,
    label: '订单类型：',
    componentProps: {
      placeholder: '请选择订单类型',
      options: [
        { label: '能量购买', value: 1 },
        { label: '能量租赁', value: 2 },
        { label: '能量转让', value: 3 }
      ]
    },
    formItemProps: {
      rules: [required()]
    }
  },
  {
    field: 'transactionAmount',
    component: 'InputNumber' as const,
    label: '交易金额：',
    componentProps: {
      placeholder: '请输入交易金额',
      min: 0,
      precision: 2,
      slots: {
        suffix: () => {
          return <span>TRX</span>
        }
      }
    },
    formItemProps: {
      rules: [required()]
    }
  },
  {
    field: 'energyToBeIssued',
    component: 'InputNumber' as const,
    label: '应发放能量：',
    componentProps: {
      placeholder: '请输入应发放能量',
      min: 0,
      slots: {
        suffix: () => {
          return <span>Energy</span>
        }
      }
    },
    formItemProps: {
      rules: [required()]
    }
  },
  {
    field: 'receivingAddress',
    component: 'Input' as const,
    label: '接收地址：',
    componentProps: {
      placeholder: '请输入接收地址'
    },
    formItemProps: {
      rules: [required()]
    }
  },
  {
    field: 'validDuration',
    component: 'InputNumber' as const,
    label: '有效时长：',
    componentProps: {
      placeholder: '请输入有效时长',
      min: 1,
      slots: {
        suffix: () => {
          return <span>天</span>
        }
      }
    },
    formItemProps: {
      rules: [required()]
    }
  },
  {
    field: 'describe',
    component: 'Input' as const,
    label: '备注：',
    componentProps: {
      placeholder: '请输入备注',
      type: 'textarea',
      rows: 3,
      maxlength: 100,
      showWordLimit: true
    }
  }
]) as FormSchema[]

// 表单Hook
const { formRegister, formMethods } = useForm()

// 弹窗相关
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')

// 添加
const handleAdd = () => {
  dialogType.value = 'add'
  dialogVisible.value = true
  // 重置表单
  formMethods.setValues({
    agentId: '',
    orderType: '',
    transactionAmount: 0,
    energyToBeIssued: 0,
    receivingAddress: '',
    validDuration: 30,
    remark: ''
  })
}

// 详情操作
const handleDetail = (row) => {
  if (orderDetailRef.value) {
    orderDetailRef.value.open(row)
  }
}

// 提交表单
const handleSubmit = async () => {
  const elForm = await formMethods.getElFormExpose()

  await elForm?.validate(async (valid) => {
    if (!valid) return

    try {
      // TODO: 这里应该调用真实的API，目前暂时用updateEnergyTransactionStatusApi代替
      await updateEnergyTransactionStatusApi({
        id: '123', // 这里应该是真实的ID
        issueStatus: 1
      })
      ElMessage.success(dialogType.value === 'add' ? '添加成功' : '编辑成功')
      dialogVisible.value = false
      searchTableRef.value?.reload()
    } catch (error) {
      console.error('提交失败:', error)
      ElMessage.error('操作失败，请重试')
    }
  })
}

const totalCount = ref(0)

// 保存当前搜索参数
const currentSearchParams = ref<any>({})

// 获取能量交易列表 - 直接使用后端字段名
const fetchDataWrapper = async (params: any = {}) => {
  try {
    // 更新选中的来源，用于控制列的显示/隐藏
    selectedSource.value = params.origin || ''
    console.log(
      '[fetchDataWrapper] selectedSource:',
      selectedSource.value,
      'params.origin:',
      params.origin
    )

    // 保存当前搜索参数（用于导出）
    currentSearchParams.value = params

    console.log('[fetchDataWrapper] 原始查询参数:', params)

    // 构建新接口参数
    const apiParams: any = {
      current_page: params.current_page || 1,
      page_size: params.page_size || 10
    }

    // 处理时间范围（毫秒转秒）
    if (params.dateRange && params.dateRange.length === 2) {
      apiParams.start_time = String(Math.floor(params.dateRange[0] / 1000))
      apiParams.end_time = String(Math.floor(params.dateRange[1] / 1000))
    }

    // 处理关键字查询
    if (params.keyword) {
      apiParams.keyword = params.keyword
    }

    // 处理来源
    if (params.origin !== undefined && params.origin !== '') {
      apiParams.origin = Number(params.origin)
    }

    // 处理订单类型
    if (params.kind) {
      apiParams.kind = params.kind
    }

    // 处理收款钱包地址
    if (params.receive_address) {
      apiParams.receive_address = params.receive_address
    }

    // 处理能量接收地址
    if (params.energy_address) {
      apiParams.energy_address = params.energy_address
    }

    // 处理状态
    if (params.status) {
      apiParams.status = params.status
    }

    // 处理排序参数 - 使用后端字段名
    if (params.order) {
      const fieldMapping: Record<string, string> = {
        created_at: 'created_at',
        recycled_at: 'recycled_at'
      }

      // 解析排序参数，格式：column ASC 或 column DESC
      const orderParts = params.order.split(' ')
      if (orderParts.length === 2) {
        const [field, direction] = orderParts
        const mappedField = fieldMapping[field] || field
        apiParams.order = `${mappedField} ${direction}`
      }
    }

    console.log('[fetchDataWrapper] 调用新接口参数:', apiParams)

    // 调用新接口
    const response = await v2GetEnergyList(apiParams)

    console.log('[fetchDataWrapper] API响应:', response)

    // 检查响应码是否成功
    if (response && response.code === '000000' && response.data) {
      const data = response.data
      const list = data.list || []
      const total = data.pager?.total || 0

      // 直接使用后端返回的数据，不进行字段映射
      totalCount.value = total

      console.log('[fetchDataWrapper] 返回数据:', { total, count: list.length })

      // 添加数据为空提示
      const hasSearchCondition = !!(
        params.keyword ||
        params.origin ||
        params.receive_address ||
        params.energy_address ||
        params.status ||
        params.kind ||
        params.dateRange
      )
      handleListMessage(list, hasSearchCondition, '能量订单')

      return {
        list: list,
        total: total
      }
    } else {
      // 处理错误响应
      console.error('[fetchDataWrapper] API返回错误:', {
        code: response?.code,
        data: response?.data
      })
      ElMessage.error('获取数据失败')
      totalCount.value = 0
      return { list: [], total: 0 }
    }
  } catch (error) {
    console.error('获取能量交易列表失败:', error)
    totalCount.value = 0
    return { list: [], total: 0 }
  }
}

// 删除API - 无参数版本，适应SearchTable组件的定义
const fetchEnergyTransactionDelete = async () => {
  try {
    // 由于组件要求fetchDelApi不接收参数，我们需要从currentRow获取行数据
    if (searchTableRef.value?.currentRow) {
      const row = searchTableRef.value.currentRow
      await updateEnergyTransactionStatusApi({
        id: row.id,
        issueStatus: 0 // 假设状态0表示已删除
      })
      return true
    }
    return false
  } catch (error) {
    console.error('删除失败:', error)
    return false
  }
}

// 数据加载完成回调
const handleDataLoaded = ({ success }) => {
  if (!success) {
    ElMessage.error('加载数据失败')
  }
}

// 数据加载错误回调
const handleLoadError = () => {
  ElMessage.error('加载数据失败')
}

const route = useRoute()
const searchTableRef = ref()

function onSearchTableReady(instance) {
  const query = route.query
  instance.setSearchParams({ keyword: query.query })
  instance.reload()
}

// 搜索事件处理
const onSearch = (params: any) => {
  // onSearch 事件会在用户点击搜索时触发，但参数已经在 fetchDataWrapper 中保存了
  console.log('搜索参数:', params)
}
</script>
