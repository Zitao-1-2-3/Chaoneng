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
import { v1GetEnergyOrderList, v1GetEnergyOrderDetail } from '@/api/energy_order'
import OrderDetailDialog from './components/OrderDetailDialog.vue'
import formatEnergyNum from '../helpers/formatEnergyNum'
import isEmpty from 'lodash-es/isEmpty'
import { Icon } from '@/components/Icon'
import { simpleExportToExcel } from '@/utils/excel'
import { handleListMessage, handleErrorMessage, handleSuccessMessage } from '@/utils/messageHelper'

const router = useRouter()
const searchTableRef = ref<InstanceType<typeof SearchTable> | null>(null)
const totalCount = ref(0)
const orderDialogVisible = ref(false)
const selectedOrderDetail = ref<any>(null)
const currentSearchParams = ref({})

// 根据订单类型（kind）格式化能量有效期
const formatExpirationTime = (orderType?: number): string => {
  // 根据订单类型返回对应的有效期
  switch (orderType) {
    case 4: // KindTimeEnergy - 时间能量（闪租能量，1小时有效）
      return '1小时'

    case 5: // KindStrokeEnergy - 笔数能量（长期有效，每天不用额外扣一笔，一次发放两笔，用完再扣）
      return '一天'

    case 6: // KindWealEnergy - 福利能量（打折的时间能量，有购买限制）
      return '1小时'

    case 7: // KindFlashEnergy - 快速能量（快速租用，1小时有效，用了会提前回收）
      return '1小时'

    case 8: // KindHosting - 自动托管（一次发放两笔）
      return '一天'

    case 9: // KindBatchEnergy - 批量能量（带自动激活）
      return '1小时'

    default:
      // 其他订单类型不显示有效期
      return '-'
  }
}

// 表格列配置
const columns: TableColumn[] = [
  {
    field: 'order_num',
    label: '订单号',
    width: 180,
    formatter: (row) => row.order_num || '-'
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
    width: 120,
    formatter: (row) => row.nickname || '-'
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
          4: '按时间',
          5: '按笔数',
          6: '福利',
          7: '闪租',
          8: '托管',
          9: '批量下单',
          10: '激活'
        }
        // Assign fixed color types
        const typeColorMap: Record<number, 'primary' | 'success' | 'warning' | 'danger' | 'info'> =
          {
            4: 'success',
            5: 'primary',
            6: 'primary',
            7: 'success',
            8: 'warning',
            9: 'danger',
            10: 'info'
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
      return row.order_amount && row.order_amount != 0
        ? `${row.order_amount} ${row.pay_unit || ''}`
        : '-'
    }
  },
  {
    field: 'energy_num',
    label: '能量数量',
    width: 100,
    formatter: (row) => {
      return row.energy_num ? formatEnergyNum(row.energy_num) : '-'
    }
  },
  {
    field: 'energy_rent_text',
    label: '能量有效期',
    width: 100,
    formatter: (row) => {
      return row.energy_rent_text || '-'
    }
  },
  {
    field: 'receive_address',
    label: '收款钱包地址',
    minWidth: 180,
    formatter: (row) => row.receive_address || '-'
  },
  {
    field: 'energy_address',
    label: '能量接收地址',
    minWidth: 180,
    formatter: (row) => row.energy_address || '-'
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
          1: 'info', // 新订单
          2: 'warning', // 已支付
          3: 'info', // 已发送
          4: 'warning', // 已回收
          5: 'success', // 已完成
          6: 'danger', // 失败订单
          7: 'info', // 已退款
          8: 'info', // 已取消
          9: 'danger' // 中止订单
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
    sortable: 'custom',
    width: 180,
    formatter: (row) => (row.create_time ? formatToDateTime(row.create_time) : '-')
  },
  {
    field: 'finish_time',
    label: '完成时间',
    sortable: 'custom',
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
      tips: 'TG用户名/机器人名称'
    },
    componentProps: {
      placeholder: '请输入关键字'
    }
  },
  {
    field: 'receive_address',
    component: 'Input' as const,
    label: '收款钱包地址',
    componentProps: {
      placeholder: '请输入收款钱包地址'
    }
  },
  {
    field: 'energy_address',
    component: 'Input' as const,
    label: '能量接收地址',
    componentProps: {
      placeholder: '请输入能量接收地址'
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
        { label: '按时间', value: 4 },
        { label: '按笔数', value: 5 },
        { label: '福利', value: 6 },
        { label: '闪租', value: 7 },
        { label: '托管', value: 8 },
        { label: '批量下单', value: 9 },
        { label: '激活', value: 10 }
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
        { label: '新订单', value: 1 },
        { label: '已支付', value: 2 },
        { label: '已发送', value: 3 },
        { label: '已回收', value: 4 },
        { label: '已完成', value: 5 },
        { label: '失败订单', value: 6 },
        { label: '已退款', value: 7 },
        { label: '已取消', value: 8 },
        { label: '中止订单', value: 9 }
      ],
      placeholder: '请选择订单状态'
    }
  }
]

// 获取订单状态文本
const getStatusTextForTable = (status: number): string => {
  const statusMap: Record<number, string> = {
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
    if (params.receive_address) adaptedParams.receive_address = params.receive_address // 收款钱包地址
    if (params.energy_address) adaptedParams.energy_address = params.energy_address // 能量接收地址

    // 分页参数
    adaptedParams.current_page = params.current_page || 1
    adaptedParams.page_size = params.page_size || 10

    // 处理排序参数 - 字段名映射
    if (params.order) {
      const fieldMapping: Record<string, string> = {
        create_time: 'created_at',
        finish_time: 'paid_at'
      }

      // 解析排序参数，格式：column ASC 或 column DESC
      const orderParts = params.order.split(' ')
      if (orderParts.length === 2) {
        const [field, direction] = orderParts
        const mappedField = fieldMapping[field] || field
        adaptedParams.order = `${mappedField} ${direction}`
      }
    }

    // 处理时间范围（转换为秒级Unix时间戳字符串）
    if (params.dateRange && params.dateRange.length === 2) {
      adaptedParams.start_time = Math.floor(params.dateRange[0] / 1000).toString()
      adaptedParams.end_time = Math.floor(params.dateRange[1] / 1000).toString()
    }

    console.log('能量订单查询参数:', adaptedParams)
    const response = await v1GetEnergyOrderList(adaptedParams)

    // 映射返回数据字段
    const list = (response.data?.list || []).map((item: any) => ({
      id: item.id,
      order_id: item.id,
      order_num: item.id, // id → order_num
      tg_name: item.tg_user_name, // tg_user_name → tg_name
      nickname: item.tg_first_name, // tg_first_name → nickname
      tg_id: item.user_id, // user_id → tg_id
      bot_name: item.bot_name, // bot_name
      bot_id: item.bot_id,
      order_type: item.kind, // kind → order_type
      order_amount: item.amount, // amount → order_amount
      pay_unit: item.coin, // coin → pay_unit
      energy_num: item.energy_amount, // energy_amount → energy_num
      energy_rent_text: formatExpirationTime(item.kind), // 根据订单类型计算有效期
      receive_address: item.receive_address, // 收款钱包地址
      energy_address: item.energy_address, // 能量接收地址
      stroke_num: item.energy_count, // energy_count → stroke_num
      status: item.status,
      create_time: item.created_at * 1000, // created_at（秒）→ create_time（毫秒）
      finish_time: item.paid_at ? item.paid_at * 1000 : undefined // paid_at（秒）→ finish_time（毫秒）
    }))

    totalCount.value = response.data?.pager?.total || 0
    currentSearchParams.value = params

    // 提示消息
    const hasSearchCondition = !!(
      params.query ||
      params.order_num ||
      params.status ||
      params.order_type ||
      params.dateRange
    )
    handleListMessage(list, hasSearchCondition, '能量订单')

    return {
      list,
      total: response.data?.pager?.total || 0
    }
  } catch (error) {
    handleErrorMessage(error, '获取能量订单列表失败')
    return { list: [], total: 0 }
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
      // 映射新接口返回的数据
      const detail = response.data

      // 从 resources 中获取能量相关信息
      let energyAmount = '0'
      let energyAddress = ''
      let energyRentText = '-'
      let recycleTime = 0

      if (detail.resources && detail.resources.length > 0) {
        const firstResource = detail.resources[0]
        energyAmount = String(firstResource.amount || 0)
        energyAddress = firstResource.target || ''

        // 计算有效时长
        if (firstResource.expirated_at && firstResource.delegated_at) {
          const expTime = firstResource.expirated_at * 1000
          const delTime = firstResource.delegated_at * 1000
          const diffMs = expTime - delTime
          const diffMinutes = Math.floor(diffMs / (1000 * 60))
          const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

          if (diffDays > 0) {
            energyRentText = `${diffDays}天`
          } else if (diffHours > 0) {
            energyRentText = `${diffHours}小时`
          } else if (diffMinutes > 0) {
            energyRentText = `${diffMinutes}分钟`
          }
        }

        // 回收时间
        if (firstResource.recycled_at) {
          recycleTime = firstResource.recycled_at * 1000
        }
      }

      // 笔数能量(5)和自动托管(8)显示为长期有效
      if (detail.kind === 5 || detail.kind === 8) {
        energyRentText = '长期有效'
      }

      selectedOrderDetail.value = {
        ...detail,
        // 基本字段映射
        order_num: detail.id,
        order_type: detail.kind,
        tg_id: detail.user_id,
        tg_name: detail.tg_user_name,
        nickname: detail.tg_first_name,
        bot_name: detail.bot_user_name,
        create_time: detail.created_at * 1000,
        finish_time: detail.paid_at ? detail.paid_at * 1000 : null,
        pay_time: detail.paid_at ? detail.paid_at * 1000 : null,
        order_amount: detail.amount,
        pay_amount: detail.amount,
        pay_unit: detail.coin,
        pay_type: 1, // 默认为余额支付
        // 从 resources 计算的字段
        energy_num: energyAmount,
        receive_address: detail.receive_address || '', // 使用API返回的收款地址
        energy_address: energyAddress, // 能量接收地址
        energy_rent_text: energyRentText,
        recycle_time: recycleTime,
        // 新增字段
        summary: detail.summary,
        resources: detail.resources,
        activations: detail.activations // 添加激活记录列表
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
    // 尝试获取当前搜索条件，如果失败则使用保存的参数
    let params
    try {
      params = await searchTableRef.value?.searchMethods?.getFormData()
    } catch (e) {
      // 如果 getFormData 不可用，使用保存的搜索参数
      params = currentSearchParams.value
    }

    // 映射当前搜索条件参数
    const adaptedParams: any = {}

    if (params?.order_num) adaptedParams.order_id = params.order_num
    if (params?.status) adaptedParams.status = params.status
    if (params?.query) adaptedParams.keyword = params.query
    if (params?.order_type) adaptedParams.kind = params.order_type
    if (params?.receive_address) adaptedParams.receive_address = params.receive_address
    if (params?.energy_address) adaptedParams.energy_address = params.energy_address

    // 处理时间范围
    if (params?.dateRange && params.dateRange.length === 2) {
      adaptedParams.start_time = Math.floor(params.dateRange[0] / 1000).toString()
      adaptedParams.end_time = Math.floor(params.dateRange[1] / 1000).toString()
    }

    console.log('导出参数:', adaptedParams)

    // 使用获取列表的接口，传入搜索条件
    const res = await v1GetEnergyOrderList(adaptedParams)

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

      // 将数据转换为 Excel 格式，列名与列表显示一致
      const list = res.data.list.map((item: any) => ({
        订单号: item.id,
        TG用户名: item.tg_user_name,
        TG用户昵称: item.tg_first_name,
        机器人名称: item.bot_name,
        订单类型: typeTextMap[item.kind] || '-',
        支付金额: item.amount && item.amount != 0 ? `${item.amount} ${item.coin || ''}` : '-',
        能量数量: formatEnergyNum(item.energy_amount),
        能量有效期: item.energy_rent_text || '-',
        收款钱包地址: item.receive_address || '-',
        能量接收地址: item.energy_address || '-',
        笔数: item.stroke_num || '-',
        订单状态: getStatusTextForTable(item.status),
        创建时间: item.created_at ? formatToDateTime(item.created_at * 1000) : '-',
        完成时间: item.paid_at ? formatToDateTime(item.paid_at * 1000) : '-'
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
