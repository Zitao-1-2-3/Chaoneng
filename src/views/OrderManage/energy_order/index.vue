<template>
  <div class="app-container">
    <ContentWrap>
      <SearchTable
        :columns="columns"
        :search-schema="searchSchema"
        :action-column="actionColumn"
        :fetch-data-api="fetchEnergyOrderList"
        :showAddButton="false"
        :pagination="{
          total: totalCount
        }"
        ref="searchTableRef"
        @search="onSearch"
      >
        <template #searchButtons>
          <BaseButton type="primary" @click="handleExport">
            <Icon icon="ep:download" class="mr-5px" />
            导出订单
          </BaseButton>
        </template>
      </SearchTable>

      <!-- 订单详情弹窗 (使用新组件) -->
      <OrderDetailDialog v-model="orderDialogVisible" :order-data="selectedOrderDetail" />
    </ContentWrap>
  </div>
</template>

<script setup lang="tsx">
import { ref, onMounted, h } from 'vue'
import { formatToDateTime } from '@/utils/dateUtil'
import { useRoute, useRouter } from 'vue-router'
import { ElTag, ElLink, ElMessage } from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import { SearchTable } from '@/components/SearchTable'
import { BaseButton } from '@/components/Button'
import type { TableColumn } from '@/components/Table'
import {
  v1GetEnergyOrderList,
  v1GetEnergyOrderDetail,
  exportEnergyOrderApi
} from '@/api/energy_order'
import OrderDetailDialog from './components/OrderDetailDialog.vue'
import formatEnergyNum from '../helpers/formatEnergyNum'
import isEmpty from 'lodash-es/isEmpty'
import { Icon } from '@/components/Icon'
import { downloadByData } from '@/utils/download'

const router = useRouter()
const searchTableRef = ref<InstanceType<typeof SearchTable> | null>(null)
const totalCount = ref(0)
const orderDialogVisible = ref(false)
const selectedOrderDetail = ref<any>(null)
const currentSearchParams = ref({})

// 表格列配置
const columns: TableColumn[] = [
  {
    field: 'order_num',
    label: '订单号',
    width: 180
  },
  {
    field: 'tg_name',
    label: 'TG用户名',
    width: 120,
    slots: {
      default: ({ row }) => {
        if (isEmpty(row.tg_name)) return h('span', '-')
        return h(
          ElLink,
          {
            type: 'primary',
            onClick: () => navigateToUserList(row.tg_id)
          },
          () => row.tg_name
        )
      }
    }
  },
  {
    field: 'nickname',
    label: 'TG用户昵称',
    width: 120
  },
  {
    field: 'bot_name',
    label: '机器人名称',
    minWidth: 160,
    slots: {
      default: ({ row }) => {
        if (isEmpty(row.bot_name)) return h('span', '-')
        return h(
          ElLink,
          {
            type: 'primary',
            onClick: () => navigateToBotList(row.bot_id)
          },
          () => row.bot_name
        )
      }
    }
  },
  {
    field: 'order_type',
    label: '订单类型',
    width: 120,
    slots: {
      default: ({ row }: any) => {
        const typeTextMap: Record<number, string> = {
          1: '按笔数',
          2: '按时间',
          3: '批量下单',
          4: '闪租',
          5: '激活',
          6: '福利',
          7: '按笔数-带宽',
          8: '接口调用-按笔数',
          9: '接口调用-带宽'
        }
        // Assign fixed color types
        const typeColorMap: Record<number, 'primary' | 'success' | 'warning' | 'danger' | 'info'> =
          {
            1: 'primary',
            2: 'success',
            3: 'warning',
            4: 'danger',
            5: 'info',
            6: 'primary',
            7: 'success',
            8: 'warning',
            9: 'danger'
          }

        const orderTypeNum =
          typeof row.order_type === 'string' ? parseInt(row.order_type, 10) : row.order_type

        if (isNaN(orderTypeNum) || !(orderTypeNum in typeTextMap)) {
          return h(ElTag, { type: 'info', size: 'small' }, () => '未知类型')
        }

        const tagType = typeColorMap[orderTypeNum] || 'info' // Fallback to info
        const text = typeTextMap[orderTypeNum]

        return h(ElTag, { type: tagType, size: 'small' }, () => text)
      }
    }
  },
  {
    field: 'order_amount',
    label: '支付金额',
    width: 100,
    formatter: (row) => {
      return row.order_amount != 0 ? `${row.order_amount} ${row.pay_unit}` : '-'
    }
  },
  {
    field: 'energy_num',
    label: '能量数量',
    width: 100,
    formatter: (row) => {
      return formatEnergyNum(row.energy_num)
    }
  },
  {
    field: 'energy_rent_text',
    label: '能量有效期',
    width: 100,
    formatter: (row) => {
      return row.energy_rent_text ? row.energy_rent_text : '-'
    }
  },
  {
    field: 'bot_address',
    label: '收款钱包地址',
    minWidth: 180
  },
  {
    field: 'receive_address',
    label: '能量接收地址',
    minWidth: 180
  },
  {
    field: 'stroke_num',
    label: '笔数',
    width: 80,
    formatter: (row) => {
      return row.stroke_num ? row.stroke_num : '-'
    }
  },
  {
    field: 'status',
    label: '订单状态',
    width: 100,
    slots: {
      default: ({ row }) => {
        const statusColorMap: Record<number, 'success' | 'warning' | 'danger' | 'info'> = {
          1: 'success', // 已完成
          2: 'warning', // 已支付
          3: 'danger' // 支付失败
        }
        const type = statusColorMap[row.status] || 'info'
        const text = getStatusTextForTable(row.status)
        return h(ElTag, { type }, () => text)
      }
    }
  },
  {
    field: 'create_time',
    label: '创建时间',
    width: 180,
    formatter: (row) => (row.create_time ? formatToDateTime(row.create_time) : '-')
  },
  {
    field: 'finish_time',
    label: '完成时间',
    width: 180,
    formatter: (row) => (row.finish_time ? formatToDateTime(row.finish_time) : '-')
  }
]

// 操作列配置
const actionColumn: TableColumn = {
  field: 'action',
  label: '操作',
  width: 120,
  fixed: 'right',
  slots: {
    default: (data: any) => {
      const row = data.row
      return (
        <BaseButton type="primary" onClick={() => handleViewDetail(row)}>
          订单详情
        </BaseButton>
      )
    }
  }
}

// 搜索表单配置
const searchSchema = [
  {
    field: 'query',
    component: 'Input' as const,
    label: {
      text: '关键字',
      tips: 'TG用户名/TG昵称/机器人名称'
    },
    componentProps: {
      placeholder: '请输入关键字'
    }
  },
  {
    field: 'receive_address',
    component: 'Input' as const,
    label: '能量接收地址',
    componentProps: {
      placeholder: '请输入能量接收地址'
    }
  },
  {
    field: 'bot_address',
    component: 'Input' as const,
    label: '收款钱包地址',
    componentProps: {
      placeholder: '请输入收款钱包地址'
    }
  },
  {
    field: 'order_num',
    component: 'Input' as const,
    label: '订单号',
    componentProps: {
      placeholder: '请输入订单号'
    }
  },
  {
    field: 'order_type',
    component: 'Select' as const,
    label: '订单类型',
    componentProps: {
      options: [
        { label: '全部', value: '' },
        { label: '按笔数', value: 1 },
        { label: '按时间', value: 2 },
        { label: '批量下单', value: 3 },
        { label: '闪租', value: 4 },
        { label: '激活', value: 5 },
        { label: '福利', value: 6 },
        { label: '按笔数-带宽', value: 7 },
        { label: '接口调用-按笔数', value: 8 },
        { label: '接口调用-带宽', value: 9 }
      ],
      placeholder: '请选择订单类型'
    }
  },
  {
    field: 'status',
    component: 'Select' as const,
    label: '订单状态',
    componentProps: {
      options: [
        { label: '全部', value: '' },
        { label: '已完成', value: 1 },
        { label: '已支付', value: 2 },
        { label: '支付失败', value: 3 }
      ],
      placeholder: '请选择订单状态'
    }
  }
]

// 获取订单状态文本 (Kept for clarity)
const getStatusTextForTable = (status: number): string => {
  const statusMap: Record<number, string> = {
    1: '已完成',
    2: '已支付',
    3: '支付失败'
  }
  return statusMap[status] || '-'
}

// 跳转到用户列表
const navigateToUserList = (userId: string | number) => {
  if (!userId) return
  router.push({
    path: '/user_group/user_list',
    query: { tg_id: userId }
  })
}

// 跳转到机器人列表
const navigateToBotList = (botId: string | number) => {
  if (!botId) return
  router.push({
    path: '/bot_manage/bot_list',
    query: { tg_bot_id: botId }
  })
}

// API 封装
const fetchEnergyOrderList = async (params: any) => {
  try {
    // 映射参数字段
    const adaptedParams: any = {}

    if (params.order_num) adaptedParams.order_id = params.order_num // order_num → order_id
    if (params.status) adaptedParams.status = params.status
    if (params.query) adaptedParams.keyword = params.query // query → keyword
    if (params.order_type) adaptedParams.kind = params.order_type // order_type → kind
    if (params.receive_address) adaptedParams.receive_address = params.receive_address
    if (params.bot_address) adaptedParams.energy_address = params.bot_address // bot_address → energy_address
    if (params.currentPage) adaptedParams.current_page = params.currentPage
    if (params.pageSize) adaptedParams.page_size = params.pageSize

    // 处理时间范围（转换为秒数）
    if (params.dateRange && params.dateRange.length === 2) {
      adaptedParams.start_time = Math.floor(params.dateRange[0] / 1000).toString()
      adaptedParams.end_time = Math.floor(params.dateRange[1] / 1000).toString()
    }

    const response = await v1GetEnergyOrderList(adaptedParams)

    // 映射返回数据字段
    const list = (response.data?.list || []).map((item: any) => ({
      id: item.id,
      order_id: item.id,
      order_num: item.id, // id → order_num
      tg_name: item.tg_user_name, // tg_user_name → tg_name
      nickname: item.tg_first_name, // tg_first_name → nickname
      tg_id: item.user_id, // user_id → tg_id
      bot_name: item.bot_name,
      bot_id: item.bot_id,
      order_type: item.kind, // kind → order_type
      order_amount: item.amount, // amount → order_amount
      pay_unit: item.coin, // coin → pay_unit
      energy_num: item.energy_amount, // energy_amount → energy_num
      energy_rent_text: '', // 新接口无此字段，需要根据订单类型计算
      bot_address: item.energy_address, // energy_address → bot_address
      receive_address: item.receive_address,
      stroke_num: item.energy_count, // energy_count → stroke_num
      status: item.status,
      create_time: item.created_at, // created_at → create_time
      finish_time: item.paid_at // paid_at → finish_time
    }))

    totalCount.value = response.data?.pager?.total || 0
    currentSearchParams.value = params

    return {
      list,
      total: response.data?.pager?.total || 0,
      totalCount: response.data?.pager?.total || 0
    }
  } catch (error) {
    return { list: [], total: 0, totalCount: 0 }
  }
}

// 查看订单详情
const handleViewDetail = async (row: any) => {
  const orderId = row.id || row.order_id
  if (!orderId) {
    return
  }
  try {
    // 使用新接口获取详情
    const response = await v1GetEnergyOrderDetail(orderId)

    if (response && response.data) {
      // 映射新接口返回的数据到旧的数据结构
      const detail = response.data
      selectedOrderDetail.value = {
        ...detail,
        // 保持旧字段名以兼容 OrderDetailDialog 组件
        order_num: detail.id,
        order_type: detail.kind,
        tg_name: detail.tg_user_name,
        create_time: detail.created_at,
        finish_time: detail.paid_at,
        pay_time: detail.paid_at,
        order_amount: detail.amount,
        pay_unit: detail.coin,
        // 从列表数据中补充缺失的字段
        nickname: row.nickname,
        tg_id: row.tg_id,
        energy_num: row.energy_num,
        stroke_num: row.stroke_num,
        bot_address: row.bot_address
      }
      orderDialogVisible.value = true
    } else {
      // ElMessage.error removed
    }
  } catch (error) {
    // ElMessage.error removed
    selectedOrderDetail.value = null
  }
}

// 导出订单
const handleExport = async () => {
  try {
    const params = await searchTableRef.value?.searchMethods.getFormData()
    const res = await exportEnergyOrderApi(params)
    if (res.data instanceof Blob) {
      downloadByData(res.data, '能量订单列表.xlsx')

      ElMessage.success('订单导出成功')
    } else {
      ElMessage.error('导出失败: 文件数据格式错误')
    }
  } catch (error) {
    const errorMsg =
      (error as any)?.response?.data?.message || (error as Error)?.message || '订单导出失败'
    ElMessage.error(errorMsg)
  }
}

const onSearch = (params: any) => {
  currentSearchParams.value = params
}

onMounted(() => {
  const query = useRoute().query
  setTimeout(() => {
    if (searchTableRef.value) {
      searchTableRef.value.setSearchParams({
        order_num: query.order_num
      })
      searchTableRef.value.reload()
    }
  }, 100)
})
</script>

<style scoped>
.app-container {
  padding: 20px;
}
</style>
