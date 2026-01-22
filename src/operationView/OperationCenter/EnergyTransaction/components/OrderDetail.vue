<template>
  <Dialog v-model="visible" title="订单详情">
    <ElTabs v-model="activeTab" class="order-detail-tabs">
      <ElTabPane label="基本信息" name="basic">
        <div v-if="currentOrder" class="order-detail">
          <Descriptions :schema="commonDetailSchema" :data="currentOrder" :column="2" border />
        </div>
        <div v-else-if="!currentOrder" class="p-4 text-center text-gray-500">
          无法加载订单详情。
        </div>
      </ElTabPane>

      <ElTabPane
        :label="detailTabLabel"
        name="specificDetails"
        v-if="currentOrder && currentOrder.order_type"
      >
        <component :is="detailComponent" :order-data="currentOrder" :order-id="currentOrder?.id" />
      </ElTabPane>
    </ElTabs>
    <template #footer>
      <div class="flex justify-end">
        <ElButton @click="visible = false">关闭</ElButton>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="tsx">
import { ref, reactive, computed, defineAsyncComponent, h } from 'vue'
import { ElButton, ElTag, ElMessage, ElTabs, ElTabPane } from 'element-plus'
import { Dialog } from '@/components/Dialog'
import { formatToDateTime } from '@/utils/dateUtil'
import { getEnergyTransactionDetailApi, getBandwidthOrderDetailApi } from '@/api/energy_transaction'
import { formatToWan } from '@/utils'
import Descriptions from '@/components/Descriptions/src/Descriptions.vue'

const ByCountDetails = defineAsyncComponent(() => import('./details/ByCountDetails.vue'))
const ByTimeDetails = defineAsyncComponent(() => import('./details/ByTimeDetails.vue'))
const BatchOrderDetails = defineAsyncComponent(() => import('./details/BatchOrderDetails.vue'))
const FlashRentDetails = defineAsyncComponent(() => import('./details/FlashRentDetails.vue'))
const ActivationDetails = defineAsyncComponent(() => import('./details/ActivationDetails.vue'))
const WealOrderDetails = defineAsyncComponent(() => import('./details/WealOrderDetails.vue'))
const BandwidthCountDetails = defineAsyncComponent(
  () => import('./details/BandwidthCountDetails.vue')
)

const visible = ref(false)
const currentOrder = ref<any | null>(null)
const activeTab = ref('basic')

const commonDetailSchema = reactive<any[]>([
  { label: '订单号', field: 'order_num' },
  { label: '用户名', field: 'username', slots: { default: (data) => data?.username || '-' } },
  {
    label: '订单类型',
    field: 'order_type',
    slots: {
      default: (data) => {
        const value = Number(data?.order_type)
        return h(ElTag, { type: getTagType('order_type', value) }, () =>
          getTagText('order_type', value)
        )
      }
    }
  },
  {
    label: '支付金额',
    field: 'order_amount',
    slots: {
      default: (data) => {
        // 当订单类型为7、8、9时，支付金额固定为0 TRX
        const orderType = Number(data?.order_type)
        if (orderType === 7 || orderType === 8 || orderType === 9) {
          return '0 TRX'
        }
        return data?.order_amount !== undefined
          ? `${data.order_amount} ${data.pay_unit || ''}`
          : '暂无'
      }
    }
  },
  {
    label: '能量数',
    field: 'energy_num',
    slots: {
      default: (data) => (data?.energy_num ? `${formatToWan(data.energy_num)}` : '-')
    }
  },
  {
    label: '接收地址',
    field: 'receive_address',
    slots: { default: (data) => data?.receive_address || '暂无' }
  },
  {
    label: '订单状态',
    field: 'status',
    slots: {
      default: (data) => {
        const value = Number(data?.status)
        return h(ElTag, { type: getTagType('status', value) }, () => getTagText('status', value))
      }
    }
  },
  {
    label: '有效时长',
    field: 'energy_rent_text',
    slots: { default: (data) => data?.energy_rent_text || '-' }
  },
  {
    label: '回收时间',
    field: 'recycle_time',
    slots: { default: (data) => (data?.recycle_time ? formatToDateTime(data?.recycle_time) : '-') }
  },
  {
    label: '创建时间',
    field: 'create_time',
    slots: { default: (data) => (data?.create_time ? formatToDateTime(data?.create_time) : '-') }
  },
  {
    label: '完成时间',
    field: 'finish_time',
    slots: { default: (data) => (data?.finish_time ? formatToDateTime(data?.finish_time) : '-') }
  },
  {
    label: '支付时间',
    field: 'pay_time',
    slots: { default: (data) => formatToDateTime(data?.pay_time) }
  },
  {
    label: '停止时间',
    field: 'stop_time',
    slots: { default: (data) => (data?.stop_time ? formatToDateTime(data?.stop_time) : '-') }
  }
])

const orderTypeMap = {
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
const orderTypeColorMap = {
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
const statusMap = { 1: '已完成', 2: '待支付' }
const statusColorMap = { 1: 'success', 2: 'warning' }

const getTagType = (field, value) => {
  if (isNaN(value)) return 'info'
  if (field === 'order_type') return orderTypeColorMap[value] || 'info'
  if (field === 'status') return statusColorMap[value] || 'info'
  return 'info'
}

const getTagText = (field, value) => {
  if (isNaN(value)) return '未知'
  if (field === 'order_type') return orderTypeMap[value] || '未知类型'
  if (field === 'status') return statusMap[value] || '-'
  return '未知'
}

const detailComponent = computed(() => {
  const type = Number(currentOrder.value?.order_type)
  if (!currentOrder.value || isNaN(type)) return null

  switch (type) {
    case 1:
      return ByCountDetails
    case 2:
      return ByTimeDetails
    case 3:
      return BatchOrderDetails
    case 4:
      return FlashRentDetails
    case 5:
      return ActivationDetails
    case 6:
      return WealOrderDetails
    case 7: // 按笔数-带宽
    case 8: // 接口调用-按笔数
    case 9: // 接口调用-带宽
      return BandwidthCountDetails
    default:
      return null
  }
})

const detailTabLabel = computed(() => {
  const type = Number(currentOrder.value?.order_type)
  if (!currentOrder.value || isNaN(type)) return '详情'

  const typeTextMap = {
    1: '按笔数详情',
    2: '按时间详情',
    3: '批量下单详情',
    4: '闪租详情',
    5: '激活详情',
    6: '福利详情',
    7: '按笔数-带宽详情',
    8: '接口调用-按笔数详情',
    9: '接口调用-带宽详情'
  }
  return typeTextMap[type] || '详情'
})

const open = async (row: { id: string | number; order_type?: number }) => {
  if (!row || !row.id) {
    ElMessage.error('无效的订单信息')
    return
  }
  visible.value = true
  activeTab.value = 'basic'
  currentOrder.value = null

  try {
    let detailData: any = null

    // 根据订单类型调用不同的API
    if (row.order_type === 7) {
      // 按笔数-带宽类型：调用带宽订单详情API
      const response = await getBandwidthOrderDetailApi(String(row.id))
      if (response && response.code === '000000' && response.data) {
        detailData = response.data
        // 确保order_type与列表数据一致
        detailData.order_type = row.order_type
      } else {
        ElMessage.warning(response?.msg || '未获取到带宽订单详情数据')
        currentOrder.value = null
        return
      }
    } else if (row.order_type === 8 || row.order_type === 9) {
      // 接口调用类型：复用带宽订单详情API
      const response = await getBandwidthOrderDetailApi(String(row.id))
      if (response && response.code === '000000' && response.data) {
        detailData = response.data
        // 确保order_type与列表数据一致
        detailData.order_type = row.order_type
      } else {
        ElMessage.warning(response?.msg || '未获取到接口调用订单详情数据')
        currentOrder.value = null
        return
      }
    } else {
      // 其他类型：调用原有的能量交易详情API
      const response = await getEnergyTransactionDetailApi(String(row.id))
      if (response && response.code === '000000' && response.data) {
        detailData = response.data
        // 如果详情API返回的order_type与列表数据不一致，使用列表数据的order_type
        if (row.order_type && detailData.order_type !== row.order_type) {
          detailData.order_type = row.order_type
        }
      } else {
        ElMessage.warning(response?.msg || '未获取到订单详情数据或数据格式错误')
        currentOrder.value = null
        return
      }
    }

    currentOrder.value = detailData
  } catch (error: any) {
    ElMessage.error(`获取订单详情失败: ${error?.message || '请检查网络或联系管理员'}`)
    currentOrder.value = null
  }
}

defineExpose({
  open
})
</script>

<style scoped>
.order-detail {
  width: 100%;
}

.order-detail-tabs .el-tabs__content {
  min-height: 150px;
}

:deep(.descriptions-label) {
  /* width: 100px; */
}
</style>
