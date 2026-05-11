<template>
  <div class="app-container">
    <ContentWrap>
      <SearchTable
        :columns="columns"
        :search-schema="searchSchema"
        :fetch-data-api="fetchDataWrapper"
        :table-props="{
          rowKey: 'id',
          highlightCurrentRow: false,
          reserveSelection: false
        }"
        :show-add-button="false"
        ref="searchTableRef"
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
      >
        <template #searchButtons>
          <BaseButton type="primary" @click="handleExport">
            <Icon icon="ep:download" class="mr-5px" />
            导出
          </BaseButton>
        </template>
      </SearchTable>

      <OrderDetail ref="orderDetailRef" />
    </ContentWrap>
  </div>
</template>

<script setup lang="tsx">
import { ref, computed } from 'vue'
import { ContentWrap } from '@/components/ContentWrap'
import { SearchTable } from '@/components/SearchTable'
import { BaseButton } from '@/components/Button'
import OrderDetail from './components/OrderDetail.vue'
import { v2GetEnergyList, v2RecycleOrder } from '@/api/energy_transaction'
import { useRoute } from 'vue-router'
import { simpleExportToExcel } from '@/utils/excel'
import { handleListMessage, handleErrorMessage, handleSuccessMessage } from '@/utils/messageHelper'
import { ORDER_STATUS_OPTIONS } from '@/utils/orderStatus'
import { SOURCE_TYPE_OPTIONS } from '@/utils/sourceFilter'
import { ENERGY_ORDER_KIND_OPTIONS } from '@/utils/energyOrder'
import { getFilteredColumns } from './columns'
import {
  transformSearchParamsToApiParams,
  transformOrderToExportData,
  sortOrdersByCreatedTime,
  hasSearchCondition,
  canStopOrder,
  STOP_POLLING_CONFIG
} from './utils'
import type { EnergyOrder, SearchFormParams, EnergyListParams } from './types'

const searchTableRef = ref()
const orderDetailRef = ref()
const route = useRoute()

const selectedSource = ref<number | string>('')
const totalCount = ref(0)
const stoppingOrders = ref<Set<string>>(new Set())
const stoppedOrders = ref<Set<string>>(new Set())

const columns = computed(() => [...getFilteredColumns(selectedSource.value), actionColumn])

const actionColumn = {
  field: 'action',
  label: '操作',
  minWidth: 200,
  fixed: 'right' as const,
  slots: {
    default: (data: { row: EnergyOrder }) => {
      const row = data.row
      const canStop = canStopOrder(row, stoppingOrders.value, stoppedOrders.value)
      const isStopping = stoppingOrders.value.has(row.id)

      return (
        <>
          {canStop ? (
            <BaseButton type="danger" onClick={() => handleStop(row)}>
              停止代理
            </BaseButton>
          ) : (
            <BaseButton type="info" disabled>
              {isStopping ? '停止中...' : '停止代理'}
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
    label: '收款钱包地址',
    componentProps: {
      placeholder: '请输入收款钱包地址',
      clearable: true
    }
  },
  {
    field: 'energy_address',
    component: 'Input' as const,
    label: '能量接收地址',
    componentProps: {
      placeholder: '请输入能量接收地址',
      clearable: true
    }
  },
  {
    field: 'status',
    component: 'Select' as const,
    label: '状态',
    componentProps: {
      placeholder: '请选择状态',
      clearable: true,
      options: ORDER_STATUS_OPTIONS
    }
  },
  {
    field: 'kind',
    component: 'Select' as const,
    label: '订单类型',
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

const fetchDataWrapper = async (
  params: SearchFormParams & { current_page?: number; page_size?: number; order?: string }
) => {
  try {
    selectedSource.value = params.origin || ''

    const apiParams: EnergyListParams = {
      current_page: params.current_page || 1,
      page_size: params.page_size || 10,
      ...transformSearchParamsToApiParams(params)
    }

    if (params.order) {
      const fieldMapping: Record<string, string> = {
        created_at: 'created_at',
        recycled_at: 'recycled_at'
      }

      const orderParts = params.order.split(' ')
      if (orderParts.length === 2) {
        const [field, direction] = orderParts
        const mappedField = fieldMapping[field] || field
        apiParams.order = `${mappedField} ${direction}`
      }
    }

    const response = await v2GetEnergyList(apiParams)

    if (response?.code === '000000' && response.data) {
      const data = response.data
      const list = data.list || []
      const total = data.pager?.total || 0

      totalCount.value = total
      handleListMessage(list, hasSearchCondition(params), '能量订单')

      return { list, total }
    } else {
      handleErrorMessage('获取数据失败')
      totalCount.value = 0
      return { list: [], total: 0 }
    }
  } catch (error) {
    handleErrorMessage(error, '获取能量交易列表失败')
    totalCount.value = 0
    return { list: [], total: 0 }
  }
}

const handleExport = async () => {
  try {
    const params = await searchTableRef.value?.searchMethods?.getFormData()
    const apiParams = transformSearchParamsToApiParams(params || {})
    const res = await v2GetEnergyList(apiParams)

    if (res.code === '000000' && res.data?.list) {
      const sortedList = sortOrdersByCreatedTime(res.data.list)
      const exportList = sortedList.map((item) =>
        transformOrderToExportData(item, selectedSource.value)
      )

      simpleExportToExcel(exportList, '能量订单列表')
      handleSuccessMessage('订单导出成功')
    } else {
      handleErrorMessage('导出失败：数据格式错误')
    }
  } catch (error) {
    handleErrorMessage(error, '订单导出失败')
  }
}

const pollOrderStatus = async (orderId: string) => {
  let attempts = 0

  const checkStatus = async () => {
    attempts++

    try {
      await searchTableRef.value?.reload()

      const currentData = searchTableRef.value?.getTableData?.() || []
      const order = currentData.find((item: EnergyOrder) => item.id === orderId)

      if (!order || order.status !== 3) {
        stoppingOrders.value.delete(orderId)
        stoppedOrders.value.add(orderId)
        return
      }

      if (attempts < STOP_POLLING_CONFIG.MAX_ATTEMPTS) {
        setTimeout(checkStatus, STOP_POLLING_CONFIG.INTERVAL)
      } else {
        stoppingOrders.value.delete(orderId)
      }
    } catch (error) {
      console.error('轮询订单状态失败:', error)
      stoppingOrders.value.delete(orderId)
    }
  }

  setTimeout(checkStatus, STOP_POLLING_CONFIG.INTERVAL)
}

const handleStop = async (row: EnergyOrder) => {
  stoppingOrders.value.add(row.id)

  try {
    await v2RecycleOrder(row.id)
    handleSuccessMessage('停止代理成功')
    pollOrderStatus(row.id)
  } catch (error) {
    stoppingOrders.value.delete(row.id)
    handleErrorMessage(error, '停止代理失败')
  }
}

const handleDetail = (row: EnergyOrder) => {
  orderDetailRef.value?.open(row)
}

const handleDataLoaded = ({ success }: { success: boolean }) => {
  if (!success) {
    handleErrorMessage('加载数据失败')
  }
}

const handleLoadError = () => {
  handleErrorMessage('加载数据失败')
}

function onSearchTableReady(instance: any) {
  const query = route.query
  if (query.query) {
    instance.setSearchParams({ keyword: query.query })
    instance.reload()
  }
}
</script>
