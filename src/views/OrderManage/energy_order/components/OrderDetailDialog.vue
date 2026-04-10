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
const ResourceDetails = defineAsyncComponent(() => import('./details/ResourceDetails.vue'))
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

// --- Helper Functions (Keep only those used by the main schema) ---

const getStatusText = (status: number): string => {
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
            1: 'info', // 新订单
            2: 'warning', // 已支付
            3: 'info', // 已发送
            4: 'info', // 已回收
            5: 'success', // 已完成
            6: 'danger', // 失败订单
            7: 'warning', // 已退款
            8: 'info', // 已取消
            9: 'danger' // 中止订单
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
            4: '按时间',
            5: '按笔数',
            6: '福利',
            7: '闪租',
            8: '托管',
            9: '批量下单',
            10: '激活'
          }
          const typeColorMap: Record<
            number,
            'primary' | 'success' | 'warning' | 'danger' | 'info'
          > = {
            4: 'success',
            5: 'primary',
            6: 'primary',
            7: 'success',
            8: 'warning',
            9: 'danger',
            10: 'info'
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
          const tgName = data?.tg_name
          if (isEmpty(tgName)) return h('span', '-')
          return h(
            ElLink,
            { type: 'primary', onClick: () => navigateToUserList(data.tg_id) },
            () => tgName
          )
        }
      }
    },
    {
      field: 'nickname',
      label: 'TG用户昵称',
      slots: {
        default: (data: any) => h('span', data?.nickname || '-')
      }
    },
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
      field: 'order_amount',
      label: '订单金额',
      slots: {
        default: (data: any) => h('span', {}, `${data.order_amount || 0} ${data.pay_unit || 'TRX'}`)
      }
    },
    {
      field: 'pay_amount',
      label: '支付金额',
      slots: {
        default: (data: any) => h('span', {}, `${data.pay_amount || 0} ${data.pay_unit || 'TRX'}`)
      }
    },
    {
      field: 'energy_num',
      label: '能量数',
      slots: {
        default: (data: any) => h('span', {}, formatEnergyNum(data.energy_num))
      }
    },
    {
      field: 'receive_address',
      label: '收款地址',
      slots: {
        default: (data: any) => h('span', {}, data.receive_address || '余额支付')
      }
    },
    {
      field: 'energy_rent_text',
      label: '有效时长',
      slots: {
        default: (data: any) => {
          // 使用 order_type 计算有效时长，与列表保持一致
          const calculatedTime = formatExpirationTime(data.order_type)
          return h('span', {}, calculatedTime)
        }
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
      field: 'create_time',
      label: '创建时间',
      slots: {
        default: (data: any) =>
          h('span', {}, data.create_time ? formatToDateTime(data.create_time) : '-')
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
    },
    {
      field: 'recycle_time',
      label: '回收时间',
      slots: {
        default: (data: any) =>
          h('span', {}, data.recycle_time ? formatToDateTime(data.recycle_time) : '-')
      }
    },
    { field: 'describe', label: '描述' }
  ]
  return schema
})
</script>

<template>
  <Dialog v-model="localVisible" :title="'订单详情'" @close="handleClose">
    <ElTabs v-if="orderDetail && orderDetail.order_num" v-model="activeTab">
      <!-- 基础订单详情页 -->
      <ElTabPane label="基本信息" name="order">
        <Descriptions :schema="orderDetailSchema" :data="orderDetail" :column="2" border />
      </ElTabPane>

      <!-- 资源详情标签页 - 只有当 resources 数组存在且有数据时才显示 -->
      <ElTabPane
        label="资源详情"
        name="resources"
        v-if="orderDetail && orderDetail.resources && orderDetail.resources.length > 0"
      >
        <ResourceDetails :order-data="orderDetail" />
      </ElTabPane>

      <!-- 激活详情标签页 - 只有当 activations 数组存在且有数据时才显示 -->
      <ElTabPane
        label="激活详情"
        name="activations"
        v-if="orderDetail && orderDetail.activations && orderDetail.activations.length > 0"
      >
        <ActivationDetails :order-data="orderDetail" />
      </ElTabPane>
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
</template>

<style scoped>
/* Styles remain unchanged or can be cleaned up if specific table styles are removed */
</style>
