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
import { ref, reactive, h } from 'vue'
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
import { useSearchTable } from '@/hooks/web/useSearchTable'
import { downloadByData } from '@/utils/download'
import { handleListMessage, handleErrorMessage, handleSuccessMessage } from '@/utils/messageHelper'

const { t } = useI18n()
const { required } = useValidator()
const orderDetailRef = ref()

// 导出
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
    if (params?.query) {
      apiParams.keyword = params.query
    }

    // 处理订单类型
    if (params?.order_type) {
      apiParams.kind = params.order_type
    }

    // 处理收款钱包地址
    if (params?.bot_address) {
      apiParams.receive_address = params.bot_address
    }

    // 处理能量接收地址
    if (params?.receive_address) {
      apiParams.energy_address = params.receive_address
    }

    // 处理状态
    if (params?.status) {
      apiParams.status = params.status
    }

    console.log('导出参数:', apiParams)

    // 使用获取列表的接口，传入搜索条件
    const res = await v2GetEnergyList(apiParams)

    if (res.code === '000000' && res.data && res.data.list) {
      // 订单类型映射
      const typeTextMap: Record<number, string> = {
        4: '按时间',
        5: '按笔数',
        6: '福利',
        7: '闪租',
        8: '托管',
        9: '批量下单',
        10: '激活'
      }

      // 将数据转换为 CSV 格式
      const list = res.data.list.map((item: any) => ({
        订单号: item.id,
        代理名称: item.agent_name || '-',
        订单类型: typeTextMap[item.kind] || '-',
        交易金额: `${item.amount} ${item.coin}`,
        应发放能量: formatToWan(item.energy_amount),
        实际发放能量: formatToWan(item.energy_actual_amount),
        收款钱包地址: item.receive_address || '-',
        能量接收地址: item.energy_address || '-',
        笔数: item.energy_count || '-',
        订单状态: orderStatusMap[item.status] || '-',
        备注: item.describe || '-',
        创建时间: item.created_at ? formatToDateTime(item.created_at * 1000) : '-',
        回收时间: item.recycled_at ? formatToDateTime(new Date(item.recycled_at).getTime()) : '-'
      }))

      // 转换为 CSV
      const headers = Object.keys(list[0] || {})
      const csvContent = [
        headers.join(','),
        ...list.map((row: any) => headers.map((header) => `"${row[header] || ''}"`).join(','))
      ].join('\n')

      // 创建 Blob 并下载
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
      downloadByData(blob, '能量订单列表.csv')
      handleSuccessMessage('订单导出成功')
    } else {
      ElMessage.error('导出失败：数据格式错误')
    }
  } catch (error) {
    handleErrorMessage(error, '订单导出失败')
  }
}

// 定义 ElTag 允许的类型
type ElTagType = 'success' | 'warning' | 'info' | 'primary' | 'danger'

// --- 状态映射 (合并发放状态和回收状态) ---

// 订单状态 (合并后的状态)
const orderStatusMap: Record<number, string> = {
  1: '新订单',
  2: '已支付',
  3: '已发送',
  4: '已回收',
  5: '已完成',
  6: '失败订单',
  7: '已退款',
  8: '已取消',
  9: '中止订单'
}
const orderStatusColorMap: Record<number, ElTagType> = {
  1: 'info',
  2: 'warning',
  3: 'primary',
  4: 'primary',
  5: 'success',
  6: 'danger',
  7: 'info',
  8: 'info',
  9: 'danger'
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
  {
    field: 'order_num',
    label: '订单ID',
    minWidth: 180,
    formatter: (row) => row.order_num || '-'
  },
  {
    field: 'username',
    label: '代理名称',
    width: 120,
    formatter: (row) => row.username || '-'
  },
  {
    field: 'order_type',
    label: '订单类型',
    width: 120,
    slots: {
      default: ({ row }) => {
        const type = Number(row.order_type)
        const typeMap: Record<number, string> = {
          4: '按时间',
          5: '按笔数',
          6: '福利',
          7: '闪租',
          8: '托管',
          9: '批量下单',
          10: '激活'
        }
        const typeColorMap: Record<number, ElTagType> = {
          4: 'info',
          5: 'primary',
          6: 'success',
          7: 'danger',
          8: 'warning',
          9: 'warning',
          10: 'primary'
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
    formatter: (row) => {
      const amount = row.order_amount ?? ''
      const unit = row.pay_unit ?? ''
      return amount || unit ? `${amount} ${unit}`.trim() : '-'
    }
  },
  {
    field: 'energy_num',
    label: '应发放能量',
    width: 100,
    formatter: (row) => formatToWan(row.energy_num) || '-'
  },
  {
    field: 'delegate_energy_num',
    label: '实际发放能量',
    width: 110,
    formatter: (row) => formatToWan(row.delegate_energy_num) || '-'
  },
  {
    field: 'bot_address',
    label: '收款钱包地址',
    minWidth: 200,
    formatter: (row) => row.bot_address || '-'
  },
  {
    field: 'receive_address',
    label: '能量接收地址',
    minWidth: 200,
    formatter: (row) => row.receive_address || '-'
  },
  {
    field: 'stroke_num',
    label: '笔数',
    width: 100,
    formatter: (row) => (row.stroke_num == 0 ? '-' : row.stroke_num)
  },
  {
    field: 'energy_rent_text',
    label: '有效时长',
    width: 100,
    formatter: (row) => row.energy_rent_text || '-'
  },
  {
    field: 'recycle_time',
    label: '回收时间',
    sortable: 'custom',
    width: 160,
    formatter: (row) => (row.recycle_time ? formatToDateTime(row.recycle_time * 1000) : '-')
  },
  {
    field: 'status',
    label: '状态',
    width: 100,
    slots: {
      default: ({ row }) => renderStatusTag(row.status, orderStatusMap, orderStatusColorMap)
    }
  },
  {
    field: 'create_time',
    label: '创建时间',
    sortable: 'custom',
    width: 160,
    formatter: (row) => (row.create_time ? formatToDateTime(row.create_time * 1000) : '-')
  },
  {
    field: 'describe',
    label: '描述',
    width: 160,
    formatter: (row) => row.describe || '-'
  }
]

// 操作列配置
const actionColumn = {
  field: 'action',
  label: '操作',
  minWidth: 200,
  fixed: 'right' as const,
  slots: {
    default: (data: any) => {
      const row = data.row
      // 判断逻辑：有 delegated_at 且 recycled_at 为 null 时，显示可点击的"停止代理"
      // 其他情况显示灰色禁用的"停止代理"
      const canStop = row.delegated_at && !row.recycled_at

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

// 搜索表单配置 (更新后)
const searchSchema = [
  {
    field: 'query', // Updated field name
    component: 'Input' as const,
    label: '关键字：', // Updated label
    componentProps: {
      placeholder: '请输入订单ID/代理名称', // Updated placeholder
      clearable: true
    }
  },
  {
    field: 'bot_address',
    component: 'Input' as const,
    label: '收款钱包地址:', // Updated label
    componentProps: {
      placeholder: '请输入收款钱包地址', // Updated placeholder
      clearable: true
    }
  },
  {
    field: 'receive_address',
    component: 'Input' as const,
    label: '能量接收地址:', // Updated label
    componentProps: {
      placeholder: '请输入能量接收地址', // Updated placeholder
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
      options: [
        { label: '全部', value: '' },
        ...Object.entries(orderStatusMap).map(([value, label]) => ({
          label: label,
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
        { label: '按笔数', value: 5 },
        { label: '按时间', value: 4 },
        { label: '批量下单', value: 9 },
        { label: '闪租', value: 7 },
        { label: '激活', value: 10 },
        { label: '福利', value: 6 },
        { label: '托管', value: 8 }
      ]
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
// 获取能量交易列表
const fetchDataWrapper = async (params: any = {}) => {
  try {
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
    if (params.query) {
      apiParams.keyword = params.query
    }

    // 处理订单类型 (order_type → kind)
    if (params.order_type) {
      apiParams.kind = params.order_type
    }

    // 处理收款钱包地址 (bot_address → receive_address)
    if (params.bot_address) {
      apiParams.receive_address = params.bot_address
    }

    // 处理能量接收地址 (receive_address → energy_address)
    if (params.receive_address) {
      apiParams.energy_address = params.receive_address
    }

    // 处理发放状态 (delegate_status → status)
    if (params.status) {
      apiParams.status = params.status
    }

    // 处理排序参数 - 字段名映射
    if (params.order) {
      const fieldMapping: Record<string, string> = {
        create_time: 'created_at',
        recycle_time: 'recycled_at'
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

    if (response && response.data) {
      const data = response.data
      const list = data.list || []
      const total = data.pager?.total || 0

      // 字段映射转换
      const mappedList = list.map((item: V2EnergyItem) => {
        // 根据订单类型（kind）计算有效时长文本
        let energyRentText = '-'

        switch (item.kind) {
          case 4: // 时间能量（闪租能量，1小时有效）
            energyRentText = '1小时'
            break

          case 5: // 笔数能量（长期有效）
            energyRentText = '一天'
            break

          case 6: // 福利能量（打折的时间能量，有购买限制）
            energyRentText = '1小时'
            break

          case 7: // 快速能量（快速租用，1小时有效）
            energyRentText = '1小时'
            break

          case 8: // 自动托管（一次发放两笔）
            energyRentText = '一天'
            break

          case 9: // 批量能量（带自动激活）
            energyRentText = '1小时'
            break

          default:
            // 其他订单类型不显示有效期
            energyRentText = '-'
            break
        }

        // 计算回收时间（转换为时间戳秒）
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
          order_num: item.id, // 订单ID
          username: item.agent_name, // 代理名称
          order_type: item.kind, // 订单类型
          order_amount: item.amount, // 交易金额
          pay_unit: item.coin, // 支付单位
          energy_num: item.energy_amount, // 应发放能量
          delegate_energy_num: item.energy_actual_amount, // 实际发放能量
          bot_address: item.receive_address, // 收款钱包地址
          receive_address: item.energy_address, // 能量接收地址
          stroke_num: item.energy_count, // 笔数
          energy_rent_text: energyRentText, // 有效时长
          recycle_time: recycleTime, // 回收时间（时间戳秒）
          delegated_at: item.delegated_at, // 委托时间（ISO格式，用于判断是否已发送）
          recycled_at: item.recycled_at, // 回收时间（ISO格式，用于判断是否已回收）
          status: item.status, // 订单状态
          create_time: item.created_at, // 创建时间（时间戳秒）
          describe: item.describe // 描述
        }
      })

      totalCount.value = total

      console.log('[fetchDataWrapper] 返回数据:', { total, count: mappedList.length })

      // 添加数据为空提示
      const hasSearchCondition = !!(
        params.query ||
        params.bot_address ||
        params.receive_address ||
        params.status ||
        params.order_type ||
        params.dateRange
      )
      handleListMessage(mappedList, hasSearchCondition, '能量订单')

      return {
        list: mappedList,
        total: total
      }
    } else {
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
const handleDataLoaded = ({ data, total, success }) => {
  if (!success) {
    ElMessage.error('加载数据失败')
  }
}

// 数据加载错误回调
const handleLoadError = () => {
  ElMessage.error('加载数据失败')
}

const handleStop = async (row) => {
  try {
    await v2RecycleOrder(row.order_num)
    handleSuccessMessage('停止代理成功')
    searchTableRef.value?.reload()
  } catch (error) {
    handleErrorMessage(error, '停止代理失败')
  }
}

const handleStart = async (row) => {
  try {
    await v2RecycleOrder(row.order_num)
    ElMessage.success('启动代理成功')
    searchTableRef.value?.reload()
  } catch (error) {
    console.error('启动代理失败:', error)
    ElMessage.error('启动代理失败')
  }
}

const route = useRoute()
const { searchTableRef } = useSearchTable({
  searchSchema,
  tableColumns: columns,
  fetchDataApi: fetchDataWrapper,
  fetchDelApi: fetchEnergyTransactionDelete,
  actionColumn,
  immediate: false // 由ready事件控制首次加载
})

function onSearchTableReady(instance) {
  const query = route.query
  instance.setSearchParams({ query: query.query })
  instance.reload()
}

// 搜索事件处理
const onSearch = (params: any) => {
  // onSearch 事件会在用户点击搜索时触发，但参数已经在 fetchDataWrapper 中保存了
  console.log('搜索参数:', params)
}
</script>
