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

      <!-- 交易详情弹窗 -->
      <Dialog v-model="transactionDialogVisible" :title="'交易详情'">
        <Descriptions
          :schema="transactionDetailSchema"
          :data="transactionDetail"
          :column="2"
          border
        />
        <template #footer>
          <div class="flex justify-end">
            <ElButton @click="transactionDialogVisible = false">关闭</ElButton>
          </div>
        </template>
      </Dialog>
    </ContentWrap>
  </div>
</template>

<script setup lang="tsx">
import { ref, onMounted, h, computed } from 'vue'
import { formatToDateTime } from '@/utils/dateUtil'
import { useRoute, useRouter } from 'vue-router'
import { ElButton, ElTag, ElLink, ElMessage } from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import { Dialog } from '@/components/Dialog'
import { SearchTable } from '@/components/SearchTable'
import { BaseButton } from '@/components/Button'
import { Descriptions } from '@/components/Descriptions'
// import { useI18n } from '@/hooks/web/useI18n'
import type { TableColumn } from '@/components/Table'
import type { DescriptionsSchema } from '@/components/Descriptions'
import {
  getEnergyOrderListApi,
  getEnergyOrderDetailApi,
  exportEnergyOrderApi,
  getTransactionDetailApi
} from '@/api/energy_order'
import OrderDetailDialog from './components/OrderDetailDialog.vue'
import formatEnergyNum from '../helpers/formatEnergyNum'
import isEmpty from 'lodash-es/isEmpty'
import { Icon } from '@/components/Icon'
import { downloadByData } from '@/utils/download'

// const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const searchTableRef = ref<InstanceType<typeof SearchTable> | null>(null)
const totalCount = ref(0)
const orderDialogVisible = ref(false)
const selectedOrderDetail = ref<any>(null)
const transactionDialogVisible = ref(false)
const transactionDetail = ref<any>({})
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
          6: '福利'
        }
        // Assign fixed color types
        const typeColorMap: Record<number, 'primary' | 'success' | 'warning' | 'danger' | 'info'> =
          {
            1: 'primary',
            2: 'success',
            3: 'warning',
            4: 'danger',
            5: 'info',
            6: 'primary'
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
        // Simplified status color mapping
        const statusColorMap: Record<number, 'success' | 'warning' | 'danger' | 'info'> = {
          1: 'success', // 已完成
          2: 'warning', // 已支付
          3: 'danger' // 支付失败
        }
        const type = statusColorMap[row.status] || 'info' // Use simplified map
        const text = getStatusTextForTable(row.status) // Keep text helper for clarity
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
  // {
  //   field: 'pay_time',
  //   label: '支付时间',
  //   width: 180,
  //   formatter: (row) => (row.pay_time ? formatToDateTime(row.pay_time) : '-')
  // },
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
  width: 240,
  fixed: 'right',
  slots: {
    default: (data: any) => {
      const row = data.row
      const orderId = row.id || row.order_id // 获取订单ID
      return (
        <>
          <BaseButton type="primary" onClick={() => handleViewDetail(orderId)}>
            订单详情
          </BaseButton>

          <BaseButton
            type="success"
            onClick={() => handleTransactionDetail(row)}
            disabled={[1, 3, 5].includes(row.order_type)}
          >
            交易详情
          </BaseButton>
        </>
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
        { label: '福利', value: 6 }
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
    const response = await getEnergyOrderListApi(params)
    totalCount.value = response.data.totalCount
    currentSearchParams.value = params
    // console.log('Updated search params after fetch:', currentSearchParams.value);
    return response.data
  } catch (error) {
    console.error('获取能量订单列表失败:', error)
    // ElMessage.error removed
    return { list: [], total: 0 }
  }
}

// 查看订单详情
const handleViewDetail = async (orderId: number | string) => {
  if (!orderId) {
    console.warn('无效的订单ID') // Changed to console.warn
    // ElMessage.warning removed
    return
  }
  try {
    const response = await getEnergyOrderDetailApi(orderId)
    if (response && response.data) {
      selectedOrderDetail.value = response.data
      orderDialogVisible.value = true
    } else {
      console.error('获取订单详情失败: 无效的响应') // Changed to console.error
      // ElMessage.error removed
    }
  } catch (error) {
    console.error('获取订单详情失败:', error)
    // ElMessage.error removed
    selectedOrderDetail.value = null
  }
}

// 查看交易详情 (实际调用订单详情API)
const handleTransactionDetail = async (row: any) => {
  const orderId = row.id || row.order_id // 使用订单ID获取详情
  const txid = row.txid // 保留 txid 用于可能的显示或参考

  if (!orderId) {
    console.warn('无法获取订单ID以查看详情')
    return
  }

  try {
    // 调用订单详情 API
    const response = await getEnergyOrderDetailApi(orderId)

    if (response && response.data) {
      // 将获取到的订单详情数据赋值给交易详情变量
      transactionDetail.value = response.data
      transactionDialogVisible.value = true // 打开交易详情弹窗
    } else {
      console.error('获取订单详情失败 (用于交易详情): 无效的响应', orderId)
      // API 调用失败时，显示基础信息
      transactionDetail.value = {
        order_id: orderId,
        txid: txid || '-',
        status: '查询失败' // 表明查询失败
      }
      transactionDialogVisible.value = true
    }
  } catch (error) {
    console.error('获取订单详情失败 (用于交易详情):', error)
    // 发生错误时，显示基础信息
    transactionDetail.value = {
      order_id: orderId,
      txid: txid || '-',
      status: '查询失败'
    }
    transactionDialogVisible.value = true
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
      console.error('Export failed: Response data is not a Blob', res.data)
      ElMessage.error('导出失败: 文件数据格式错误')
    }
  } catch (error) {
    console.error('订单导出失败:', error)
    const errorMsg =
      (error as any)?.response?.data?.message || (error as Error)?.message || '订单导出失败'
    ElMessage.error(errorMsg)
  }
}

const onSearch = (params: any) => {
  // console.log('搜索事件触发，参数:', params);
  currentSearchParams.value = params
}

// transactionDetailSchema updated for order status display
const transactionDetailSchema = computed((): DescriptionsSchema[] => [
  {
    field: 'txid', // Ensure 'txid' is in getEnergyOrderDetailApi response
    label: '交易哈希',
    span: 24,
    slots: {
      default: (data: any) => {
        if (!data || !data.txid) return h('span', '-')
        return h(
          ElLink,
          {
            href: `${import.meta.env.VITE_TRONSCAN_URL}/#/transaction/${data.txid}`,
            type: 'primary',
            target: '_blank'
          },
          () => data.txid
        )
      }
    }
  },
  { field: 'from_address', label: '发起地址', span: 24 }, // Ensure 'from_address' is present
  { field: 'receive_address', label: '能量接收地址', span: 24 }, // Ensure 'receive_address' is present
  {
    field: 'status', // Use the order status field from getEnergyOrderDetailApi response
    label: '订单状态', // Label changed to reflect it's order status now
    slots: {
      default: (data: any) => {
        if (data?.status === undefined) return h('span', '-')

        // Use the same status mapping as the main table/order detail dialog
        const statusColorMap: Record<number, 'success' | 'warning' | 'danger' | 'info'> = {
          1: 'success', // 已完成
          2: 'warning', // 已支付
          3: 'danger' // 支付失败
        }
        const statusTextMap: Record<number, string> = {
          1: '已完成',
          2: '已支付',
          3: '支付失败'
        }
        const numericStatus =
          typeof data.status === 'string' ? parseInt(data.status, 10) : data.status
        if (isNaN(numericStatus)) {
          return h(ElTag, { type: 'info', size: 'small' }, () => String(data.status || '未知'))
        }
        const type = statusColorMap[numericStatus] || 'info'
        const text = statusTextMap[numericStatus] || '-'
        return h(ElTag, { type: type, size: 'small' }, () => text)
      }
    }
  },
  {
    field: 'energy_num',
    label: '能量数量',
    slots: {
      default: (data: any) => h('span', {}, formatEnergyNum(data.energy_num))
    }
  }, // Ensure 'energy_num' is present
  {
    field: 'create_time',
    label: '创建时间',
    span: 24,
    slots: {
      default: (data: any) =>
        h('span', {}, data.create_time ? formatToDateTime(data.create_time) : '-')
    }
  },
  {
    field: 'finish_time',
    label: '完成时间',
    span: 24,
    slots: {
      default: (data: any) =>
        h('span', {}, data.finish_time ? formatToDateTime(data.finish_time) : '-')
    }
  }
  // Add/Remove/Adjust other fields based precisely on getEnergyOrderDetailApi response structure
])

onMounted(() => {
  const query = useRoute().query
  setTimeout(() => {
    if (searchTableRef.value) {
      searchTableRef.value.setSearchParams({
        order_num: query.order_num
      })
      console.log('手动触发数据刷新')
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
