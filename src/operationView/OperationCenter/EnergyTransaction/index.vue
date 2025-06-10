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
          rowKey: 'order_num',
          highlightCurrentRow: false,
          reserveSelection: false
        }"
        :show-add-button="false"
        ref="searchTableRef"
        @add="handleAdd"
        @loaded="handleDataLoaded"
        @error="handleLoadError"
        :search-props="{
          layout: 'inline',
          buttonPosition: 'center'
        }"
        :pagination="{
          total: totalCount
        }"
        @ready="onSearchTableReady"
      />

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
    <!-- 添加回收组件 -->
    <RecycleEnergy ref="recycleEnergyRef" @success="handleRecycleSuccess" />
    <!-- 添加补发组件 -->
    <ResendEnergy ref="resendEnergyRef" @success="handleResendSuccess" />
    <!-- 添加详情组件 -->
    <OrderDetail ref="orderDetailRef" />
  </div>
</template>

<script setup lang="tsx">
import { ref, reactive, onMounted, nextTick, h } from 'vue'
import { ElButton, ElMessage, ElMessageBox, ElTag } from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import { Dialog } from '@/components/Dialog'
import { Form, FormSchema } from '@/components/Form'
import { SearchTable } from '@/components/SearchTable'
import { useForm } from '@/hooks/web/useForm'
import { useI18n } from '@/hooks/web/useI18n'
import { useValidator } from '@/hooks/web/useValidator'
import { BaseButton } from '@/components/Button'
import RecycleEnergy from './components/RecycleEnergy.vue'
import ResendEnergy from './components/ResendEnergy.vue'
import OrderDetail from './components/OrderDetail.vue'
import {
  getEnergyTransactionListApi,
  getEnergyTransactionDetailApi,
  updateEnergyTransactionStatusApi,
  EnergyTransactionOrder,
  EnergyTransactionQueryParams,
  EnergyTransactionResponse
} from '@/api/energy_transaction'
import { Tips } from '@/components/Tips'
import { formatToDateTime } from '@/utils/dateUtil'
import { useRoute } from 'vue-router'
import { formatToWan } from '@/utils'
import { useSearchTable } from '@/hooks/web/useSearchTable'

const { t } = useI18n()
const { required } = useValidator()
const recycleEnergyRef = ref()
const resendEnergyRef = ref()
const orderDetailRef = ref()
const isLoaded = ref(false)

// 定义 ElTag 允许的类型
type ElTagType = 'success' | 'warning' | 'info' | 'primary' | 'danger'

// --- 状态映射 (根据 Go Struct 更新) ---

// 发放状态 (delegate_status: 1已发放 2待补发 3已补发)
const issueStatusMap: Record<number, string> = {
  1: '已发放', // Updated
  2: '待补发', // Updated
  3: '已补发' // Updated
}
const issueStatusColorMap: Record<number, ElTagType> = {
  1: 'success',
  2: 'warning',
  3: 'primary' // Or maybe success?
  // 3: 'danger',
}

// 回收状态 (handle_status: 1已处理 2未处理 3处理失败)
const recycleStatusMap: Record<number, string> = {
  1: '已回收', // Updated
  2: '未回收', // Updated
  3: '回收失败' // Updated
  // 0: '未回收', // 这个看起来不适用于 handle_status
  // ... 其他可能的状态?
}
const recycleStatusColorMap: Record<number, ElTagType> = {
  1: 'success',
  2: 'warning',
  3: 'danger'
  // ... 其他可能的状态?
}

// 渲染状态标签的辅助函数
const renderStatusTag = (
  status: number | string | undefined | null,
  map: Record<number, string>,
  colorMap: Record<number, ElTagType>
) => {
  // 新增：如果 status 是 0，直接返回 '-' 标签
  if (status == 0) {
    return h('span', null, '-')
  }
  const numStatus = Number(status)
  // 检查 NaN (现在排除了 0 的情况)
  if (isNaN(numStatus)) return h('span', null, '无效')
  const text = map[numStatus] || '未知'
  // 确保 tagType 是 ElTagType，提供默认值 'info'
  const tagType: ElTagType = colorMap[numStatus] || 'info'
  return h(ElTag, { type: tagType, size: 'small' }, () => text)
}

// --- 表格列配置 (根据 Go Struct 更新字段名) ---
const columns = [
  { field: 'order_num', label: '订单ID', minWidth: 180 },
  { field: 'username', label: '代理名称', width: 120 }, // Kept field: username - Check if correct
  {
    field: 'order_type',
    label: '订单类型',
    width: 100,
    slots: {
      default: ({ row }) => {
        const type = Number(row.order_type)
        const typeMap: Record<number, string> = {
          1: '按笔数',
          2: '按时间',
          3: '批量下单',
          4: '闪租',
          5: '激活'
        }
        const typeColorMap: Record<number, ElTagType> = {
          1: 'primary',
          2: 'success',
          3: 'warning',
          4: 'danger',
          5: 'info'
        }
        const text = typeMap[type] || '未知类型'
        const tagType = typeColorMap[type] || 'info'
        return h(ElTag, { type: tagType, size: 'small' }, () => text)
      }
    }
  },
  {
    field: 'order_amount',
    label: '交易金额',
    width: 100,
    formatter: (row) => `${row.order_amount ?? '-'} ${row.pay_unit ?? ''}`
  },
  {
    field: 'energy_num',
    label: '应发放能量',
    width: 100,
    formatter: (row) => `${formatToWan(row.energy_num) ?? '-'}`
  },
  {
    field: 'delegate_energy_num',
    label: '实际发放能量',
    width: 110,
    formatter: (row) => `${formatToWan(row.delegate_energy_num) ?? '-'}`
  },
  { field: 'receive_address', label: '接收地址', minWidth: 200 },
  {
    field: 'stroke_num',
    label: '笔数',
    width: 100,
    formatter: (row) => (row.stroke_num == 0 ? '-' : row.stroke_num)
  },
  { field: 'energy_rent_text', label: '有效时长', width: 100 },
  {
    field: 'recycle_time',
    label: '回收时间',
    width: 160,
    formatter: (row) => (row.recycle_time ? formatToDateTime(row.recycle_time * 1000) : '-')
  },
  {
    field: 'delegate_status', // Updated field: delegate_status
    label: '发放状态',
    width: 100,
    slots: {
      default: ({ row }) =>
        renderStatusTag(row.delegate_status, issueStatusMap, issueStatusColorMap) // Use delegate_status
    }
  },
  {
    field: 'handle_status', // Updated field: handle_status
    label: '回收状态', // Note: field means "处理状态"
    width: 100,
    slots: {
      default: ({ row }) =>
        renderStatusTag(row.handle_status, recycleStatusMap, recycleStatusColorMap) // Use handle_status
    }
  },
  {
    field: 'create_time',
    label: '创建时间',
    width: 160,
    formatter: (row) => (row.create_time ? formatToDateTime(row.create_time * 1000) : '-')
  },
  {
    field: 'describe',
    label: '描述',
    width: 160
  }
]

// 操作列配置
const actionColumn = {
  field: 'action',
  label: '操作',
  minWidth: 120,
  fixed: 'right' as const,
  slots: {
    default: (data: any) => {
      const row = data.row
      return (
        <>
          {/* <BaseButton type="warning" disabled onClick={() => handleRecycle(row)}>
            回收
          </BaseButton>
          <BaseButton type="success" disabled onClick={() => handleResend(row)}>
            补发
          </BaseButton> */}
          <BaseButton type="primary" onClick={() => handleDetail(row)}>
            详情
          </BaseButton>
        </>
      )
    }
  }
}

// 搜索表单配置 (更新后)
const searchSchema = [
  {
    field: 'query', // Updated field name
    component: 'Input' as const,
    label: '关键字：', // Updated label
    componentProps: {
      placeholder: '请输入订单ID/代理ID/代理名称', // Updated placeholder
      clearable: true
    }
  },
  {
    field: 'delegate_status', // Updated field name to match status map
    component: 'Select' as const,
    label: '发放状态：', // Updated label
    componentProps: {
      placeholder: '请选择发放状态', // Updated placeholder
      clearable: true,
      options: [
        { label: '全部', value: '' }, // Add "All" option
        // Dynamically generate options from issueStatusMap
        ...Object.entries(issueStatusMap).map(([value, label]) => ({
          label: label,
          // Convert value back to number for the option's value
          value: Number(value)
        }))
      ]
    }
  },
  {
    field: 'order_type',
    component: 'Select' as const,
    label: '订单类型：',
    componentProps: {
      placeholder: '请选择订单类型',
      options: [
        { label: '全部', value: '' },
        { label: '按笔数', value: 1 },
        { label: '按时间', value: 2 },
        { label: '批量下单', value: 3 },
        { label: '闪租', value: 4 },
        { label: '激活', value: 5 }
      ]
    }
  }
  // Removed order_type and original status fields
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

// 回收操作
const handleRecycle = (row) => {
  if (recycleEnergyRef.value) {
    recycleEnergyRef.value.open(row)
  }
}

// 补发操作
const handleResend = (row) => {
  if (resendEnergyRef.value) {
    resendEnergyRef.value.open(row)
  }
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

    const formData = await formMethods.getFormData()

    try {
      // 这里应该调用真实的API，但是目前API文件中没有添加能量交易的API
      // 暂时用updateEnergyTransactionStatusApi代替
      await updateEnergyTransactionStatusApi({
        id: '123', // 这里应该是真实的ID
        issueStatus: 1
      })
      ElMessage.success(dialogType.value === 'add' ? '添加成功' : '编辑成功')
      dialogVisible.value = false

      // 刷新表格数据
      searchTableRef.value?.reload()
    } catch (error) {
      console.error('提交失败:', error)
      ElMessage.error('操作失败，请重试')
    }
  })
}

const totalCount = ref(0)
// 获取能量交易列表
const fetchDataWrapper = async (params: any = {}) => {
  try {
    // 直接将 params 传递给 API
    const response = await getEnergyTransactionListApi(params)

    if (response && response.data) {
      // 根据API的返回结构，正确处理数据
      const data = response.data as any

      // 尝试获取列表和总数，提供默认值
      const resultList = data.list || []
      // 后端可能返回 total 或 totalCount
      const resultTotal =
        data.total !== undefined ? data.total : data.totalCount !== undefined ? data.totalCount : 0

      totalCount.value = resultTotal

      return {
        list: resultList,
        // 将 total 或 totalCount 传递给 SearchTable, SearchTable 内部通常期望 total
        total: resultTotal
      }
    } else {
      totalCount.value = 0
      return { list: [], total: 0 }
    }
  } catch (error) {
    console.error('获取能量交易列表失败:', error)
    totalCount.value = 0 // 发生错误时重置
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
const handleDataLoaded = ({ data, total, success }) => {
  nextTick(() => {
    isLoaded.value = true
  })
  if (!success) {
    ElMessage.error('加载数据失败')
  } else if (data?.length === 0 && total === 0) {
    ElMessage.info('未查询到符合条件的数据')
  }
}

// 数据加载错误回调
const handleLoadError = () => {
  ElMessage.error('加载数据失败，请稍后重试')
}

// 回收成功回调
const handleRecycleSuccess = () => {
  if (searchTableRef.value) {
    searchTableRef.value.reload()
  }
}

// 补发成功回调
const handleResendSuccess = () => {
  if (searchTableRef.value) {
    searchTableRef.value.reload()
  }
}

const route = useRoute()
const { searchTableRef, searchTableInstance, handleReady } = useSearchTable({
  searchSchema,
  tableColumns: columns,
  fetchDataApi: fetchDataWrapper,
  fetchDelApi: fetchEnergyTransactionDelete,
  actionColumn,
  immediate: false // 由ready事件控制首次加载
})

// 手动触发加载
// 移除setTimeout，改为ready事件
function onSearchTableReady(instance) {
  const query = route.query
  instance.setSearchParams({ query: query.query })
  instance.reload()
}
</script>
