<script setup lang="ts">
import { ref, computed, h, watch, defineAsyncComponent } from 'vue'
import { useRouter } from 'vue-router'
import { ElTabs, ElTabPane, ElTag, ElLink, ElButton } from 'element-plus'
import { Dialog } from '@/components/Dialog'
import { Descriptions } from '@/components/Descriptions'
import type { DescriptionsSchema } from '@/components/Descriptions'
import { formatToDateTime } from '@/utils/dateUtil'
import isEmpty from 'lodash-es/isEmpty'
import formatEnergyNum from '../../helpers/formatEnergyNum'
// Import the new detail components (using defineAsyncComponent for lazy loading)
const ByCountDetails = defineAsyncComponent(() => import('./details/ByCountDetails.vue'))
const ByTimeDetails = defineAsyncComponent(() => import('./details/ByTimeDetails.vue'))
const BatchOrderDetails = defineAsyncComponent(() => import('./details/BatchOrderDetails.vue'))
const FlashRentDetails = defineAsyncComponent(() => import('./details/FlashRentDetails.vue'))
const ActivationDetails = defineAsyncComponent(() => import('./details/ActivationDetails.vue'))

const props = defineProps({
  modelValue: {
    // for v-model:visible
    type: Boolean,
    default: false
  },
  orderData: {
    type: Object,
    default: () => null
  }
})

const emit = defineEmits(['update:modelValue'])

const router = useRouter()
const localVisible = ref(props.modelValue)
const activeTab = ref('order')
const orderDetail = ref<any>({})

// Watch for prop changes
watch(
  () => props.modelValue,
  (newVal) => {
    localVisible.value = newVal
    // Reset tab to 'order' when dialog opens
    if (newVal) {
      activeTab.value = 'order'
    }
  }
)

watch(
  () => props.orderData,
  (newData) => {
    if (newData) {
      orderDetail.value = newData
      // Reset tab when data changes
      activeTab.value = 'order'
    } else {
      orderDetail.value = {}
    }
  },
  { immediate: true, deep: true }
)

const handleClose = () => {
  emit('update:modelValue', false)
}

// --- Helper Functions (Keep only those used by the main schema) ---

const getStatusText = (status: number): string => {
  const statusMap: Record<number, string> = {
    1: '已完成',
    2: '已支付',
    3: '支付失败'
  }
  return statusMap[status] || '-'
}

const navigateToUserList = (userId: string | number) => {
  if (!userId) return
  router.push({
    path: '/user_group/user_list',
    query: { tg_id: userId }
  })
}

const navigateToBotList = (botId: string | number) => {
  if (!botId) return
  router.push({
    path: '/bot_manage/bot_list',
    query: { tg_bot_id: botId }
  })
}

// --- Schemas (Keep only the main order detail schema) ---

const orderDetailSchema = computed((): DescriptionsSchema[] => {
  const schema = [
    { field: 'order_num', label: '订单号' },
    {
      field: 'status',
      label: '订单状态',
      slots: {
        default: (data: any) => {
          if (!data || data.status === undefined) return h('span', '-')
          const statusColorMap: Record<number, 'success' | 'warning' | 'danger' | 'info'> = {
            1: 'success', // 已完成
            2: 'warning', // 已支付
            3: 'danger' // 支付失败
          }
          const tagType = statusColorMap[data.status] || 'info'
          return h(ElTag, { type: tagType, size: 'small' }, () => getStatusText(data.status))
        }
      }
    },
    {
      field: 'order_type',
      label: '订单类型',
      slots: {
        default: (data: any) => {
          if (!data || data.order_type === undefined) return h('span', '-')
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
          const typeColorMap: Record<
            number,
            'primary' | 'success' | 'warning' | 'danger' | 'info'
          > = {
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
            typeof data.order_type === 'string' ? parseInt(data.order_type, 10) : data.order_type

          if (isNaN(orderTypeNum) || !(orderTypeNum in typeTextMap)) {
            return h(ElTag, { type: 'info', size: 'small' }, () => '未知类型')
          }

          const tagType = typeColorMap[orderTypeNum] || 'info'
          const text = typeTextMap[orderTypeNum]
          return h(ElTag, { type: tagType, size: 'small' }, () => text)
        }
      }
    },
    {
      field: 'tg_name',
      label: 'TG用户名',
      slots: {
        default: (data: any) => {
          if (isEmpty(data?.tg_name)) return h('span', '-')
          return h(
            ElLink,
            { type: 'primary', onClick: () => navigateToUserList(data.tg_id) },
            () => data.tg_name
          )
        }
      }
    },
    { field: 'nickname', label: 'TG用户昵称' },
    {
      field: 'bot_name',
      label: '机器人名称',
      slots: {
        default: (data: any) => {
          if (isEmpty(data?.bot_name)) return h('span', '-')
          return h(
            ElLink,
            { type: 'primary', onClick: () => navigateToBotList(data.bot_id) },
            () => data.bot_name
          )
        }
      }
    },
    { field: 'bot_id', label: '机器人ID' },
    {
      field: 'create_time',
      label: '创建时间',
      slots: {
        default: (data: any) =>
          h('span', {}, data.create_time ? formatToDateTime(data.create_time) : '-')
      }
    },
    {
      field: 'order_amount',
      label: '订单金额',
      slots: {
        default: (data: any) => h('span', {}, data.order_amount + ' ' + data.pay_unit)
      }
    },
    {
      field: 'pay_amount',
      label: '支付金额',
      slots: {
        default: (data: any) => h('span', {}, data.pay_amount + ' ' + data.pay_unit)
      }
    },
    {
      field: 'pay_type',
      label: '支付类型',
      slots: {
        default: (data: any) => h('span', {}, data.pay_type == 2 ? '波场钱包转账' : '余额支付')
      }
    },
    {
      field: 'pay_time',
      label: '支付时间',
      slots: {
        default: (data: any) => h('span', {}, data.pay_time ? formatToDateTime(data.pay_time) : '-')
      }
    },
    {
      field: 'finish_time',
      label: '完成时间',
      slots: {
        default: (data: any) =>
          h('span', {}, data.finish_time ? formatToDateTime(data.finish_time) : '-')
      }
    }
  ]
  if (orderDetail.value.order_type === 4) {
    const flash = [
      {
        field: 'energy_num',
        label: '能量数',
        slots: {
          default: (data: any) => h('span', {}, formatEnergyNum(data.energy_num))
        }
      },
      {
        field: 'energy_rent_text',
        label: '能量有效期',
        slots: {
          default: (data: any) => h('span', {}, data.energy_rent_text)
        }
      }
    ]
    schema.push(...flash)
  }
  schema.push({ field: 'describe', label: '描述' })
  return schema
})

// --- Dynamic Component Logic ---
const detailComponent = computed(() => {
  const type = orderDetail.value?.order_type
  // Map the type number directly to the imported async component
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
    default:
      return null
  }
})

const detailTabLabel = computed(() => {
  const type = orderDetail.value?.order_type
  const typeTextMap: Record<number, string> = {
    1: '笔数详情',
    2: '时间详情',
    3: '批量订单详情',
    4: '闪租详情',
    5: '激活详情'
  }
  return type ? typeTextMap[type] || '详情' : '详情'
})

const detailTabName = computed(() => {
  const type = orderDetail.value?.order_type
  const typeNameMap: Record<number, string> = {
    1: 'byCount',
    2: 'byTime',
    3: 'batchOrder',
    4: 'flashRent',
    5: 'activate' // Using 'activate' as name, matching original code logic if needed
  }
  // Return a unique name for the tab based on type, fallback to 'details'
  return type ? typeNameMap[type] || `details-${type}` : 'details'
})
</script>

<template>
  <Dialog v-model="localVisible" :title="'订单详情'" @close="handleClose">
    <ElTabs v-if="orderDetail && orderDetail.order_num" v-model="activeTab">
      <!-- 基础订单详情页 -->
      <ElTabPane label="订单详情" name="order">
        <Descriptions :schema="orderDetailSchema" :data="orderDetail" :column="2" border />
      </ElTabPane>

      <!-- Dynamic Detail Tab: Render only if a specific component is determined -->
      <ElTabPane v-if="detailComponent" :label="detailTabLabel" :name="detailTabName">
        <!-- Use a key based on order ID to force re-render/remount if the order changes -->
        <component
          :is="detailComponent"
          :key="orderDetail.id"
          :order-data="orderDetail"
          :order-id="orderDetail.id"
        />
      </ElTabPane>

      <!-- Removed all static v-if based ElTabPanes for types 1-5 -->
    </ElTabs>
    <div v-else>
      <p>加载订单详情中或无详情数据...</p>
    </div>
    <template #footer>
      <div class="flex justify-end">
        <ElButton @click="handleClose">关闭</ElButton>
      </div>
    </template>
  </Dialog>

  <!-- Removed Transaction Detail Dialogs (now handled within subcomponents) -->
</template>

<style scoped>
/* Styles remain unchanged or can be cleaned up if specific table styles are removed */
</style>
