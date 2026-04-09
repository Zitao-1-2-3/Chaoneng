<template>
  <Dialog v-model="visible" title="订单详情">
    <ElTabs v-model="activeTab" class="order-detail-tabs">
      <!-- 基本信息标签页 - 始终显示 -->
      <ElTabPane label="基本信息" name="basic">
        <div v-if="currentOrder" class="order-detail">
          <Descriptions :schema="commonDetailSchema" :data="currentOrder" :column="2" border />
        </div>
        <div v-else-if="!currentOrder" class="p-4 text-center text-gray-500">
          无法加载订单详情。
        </div>
      </ElTabPane>

      <!-- 资源详情标签页 - 只有当 resources 数组存在且有数据时才显示 -->
      <ElTabPane
        label="资源详情"
        name="resources"
        v-if="currentOrder && currentOrder.resources && currentOrder.resources.length > 0"
      >
        <ResourceDetails :order-data="currentOrder" />
      </ElTabPane>

      <!-- 激活详情标签页 - 只有当 activations 数组存在且有数据时才显示 -->
      <ElTabPane
        label="激活详情"
        name="activations"
        v-if="currentOrder && currentOrder.activations && currentOrder.activations.length > 0"
      >
        <ActivationDetails :order-data="currentOrder" />
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
import { formatToWan } from '@/utils'
import { v2GetOrderDetail } from '@/api/energy_transaction'
import type { V2OrderDetailResponse } from '@/api/energy_transaction/types'
import Descriptions from '@/components/Descriptions/src/Descriptions.vue'

// 导入资源详情和激活详情组件
const ResourceDetails = defineAsyncComponent(() => import('./details/ResourceDetails.vue'))
const ActivationDetails = defineAsyncComponent(() => import('./details/ActivationDetails.vue'))

const visible = ref(false)
const currentOrder = ref<any | null>(null)
const activeTab = ref('basic')

const commonDetailSchema = reactive<any[]>([
  { label: '订单号', field: 'order_num' },
  { label: '用户名', field: 'tg_name', slots: { default: (data) => data?.tg_name || '-' } },
  { label: '机器人ID', field: 'bot_id' },
  { label: '机器人用户名', field: 'bot_name' },
  { label: '代理名称', field: 'username' },
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
        // 当订单类型为7(闪租)、9(批量下单)时，支付金额固定为0 TRX
        const orderType = Number(data?.order_type)
        if (orderType === 7 || orderType === 9) {
          return '0 TRX'
        }
        return data?.order_amount !== undefined
          ? `${data.order_amount} ${data.pay_unit || ''}`
          : '暂无'
      }
    }
  },
  {
    label: computed(() => {
      // 根据订单类型动态显示标签
      const orderType = Number(currentOrder.value?.order_type)
      return orderType === 7 || orderType === 9 ? '带宽数' : '能量数'
    }),
    field: 'energy_num',
    slots: {
      default: (data) => {
        const value = data?.energy_num
        if (value === null || value === undefined || value === '') return '0'
        return Number(value) >= 10000 ? formatToWan(value as any) : `${value}`
      }
    }
  },
  {
    label: '收款地址',
    field: 'receive_address',
    slots: { default: (data) => data?.receive_address || '余额支付' }
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
  4: '按时间',
  5: '按笔数',
  6: '福利',
  7: '闪租',
  8: '托管',
  9: '批量下单',
  10: '激活'
}
const orderTypeColorMap = {
  4: 'info',
  5: 'primary',
  6: 'success',
  7: 'danger',
  8: 'warning',
  9: 'warning',
  10: 'primary'
}
const statusMap = {
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
const statusColorMap = {
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

const open = async (row: { id: string | number; order_type?: number }) => {
  if (!row || !row.id) {
    ElMessage.error('无效的订单信息')
    return
  }
  visible.value = true
  activeTab.value = 'basic'
  currentOrder.value = null

  try {
    console.log('[OrderDetail] 调用新接口 v2GetOrderDetail, id:', row.id)

    // 调用新接口获取订单详情
    const response = await v2GetOrderDetail(String(row.id))

    if (response && response.data) {
      const detailData: V2OrderDetailResponse = response.data

      // 从 resources 中获取能量相关信息
      let energyAmount = '0'
      let energyAddress = ''
      let energyRentText = '-'
      let recycleTime = 0

      if (detailData.resources && detailData.resources.length > 0) {
        const firstResource = detailData.resources[0]
        energyAmount = String(firstResource.amount || 0)
        energyAddress = firstResource.target || ''

        // 计算有效时长
        if (firstResource.expirated_at && firstResource.delegated_at) {
          const expTime = new Date(firstResource.expirated_at).getTime()
          const delTime = new Date(firstResource.delegated_at).getTime()
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
          recycleTime = new Date(firstResource.recycled_at).getTime()
        }
      }

      // 笔数能量(5)和自动托管(8)显示为长期有效
      if (detailData.kind === 5 || detailData.kind === 8) {
        energyRentText = '长期有效'
      }

      // 字段映射转换
      currentOrder.value = {
        id: detailData.id,
        order_num: detailData.id, // 订单号
        tg_name: detailData.tg_first_name || detailData.tg_user_name, // 用户名（优先使用 tg_first_name）
        bot_id: detailData.bot_id, // 机器人ID
        bot_name: detailData.bot_user_name || detailData.bot_first_name, // 机器人用户名（优先使用 bot_user_name）
        username: detailData.agent_name, // 代理名称
        order_type: detailData.kind, // 订单类型
        order_amount: String(detailData.amount), // 支付金额（转换为字符串）
        pay_unit: detailData.coin, // 支付单位
        energy_num: energyAmount, // 能量数（从 resources 获取）
        receive_address: detailData.receive_address || '', // 使用API返回的收款地址
        energy_address: energyAddress, // 能量接收地址
        status: detailData.status, // 订单状态
        energy_rent_text: energyRentText, // 有效时长
        recycle_time: recycleTime, // 回收时间（时间戳毫秒）
        create_time: new Date(detailData.created_at).getTime(), // 创建时间（转换为毫秒）
        finish_time: new Date(detailData.updated_at).getTime(), // 完成时间（转换为毫秒）
        pay_time: detailData.paid_at ? new Date(detailData.paid_at).getTime() : null, // 支付时间（转换为毫秒）
        stop_time: null, // 停止时间（新接口暂无此字段）
        // 从 resources[0] 映射的字段（供子详情组件使用）
        stroke_num: detailData.summary?.energy_count || 0, // 笔数（从 summary 获取）
        txid: detailData.resources?.[0]?.delegated_txid || '', // 交易hash（委托交易ID）
        from_address: detailData.resources?.[0]?.source || '', // 发放能量地址
        recycle_txid: detailData.resources?.[0]?.recycled_txid || '', // 回收hash
        used_txid: detailData.resources?.[0]?.used_txid || '', // 使用交易ID
        flash_price: String(detailData.amount), // 闪租能量价格（直接使用订单金额）
        summary: detailData.summary, // 订单汇总信息
        resources: detailData.resources, // 订单资源列表
        activations: detailData.activations, // 激活记录列表
        exchange: detailData.exchange, // 兑换信息
        deliver_transaction: detailData.deliver_transaction, // 发放交易信息
        pay_transaction: detailData.pay_transaction // 支付交易信息
      }

      console.log('[OrderDetail] 订单详情加载成功:', currentOrder.value)
    } else {
      ElMessage.warning('未获取到订单详情数据或数据格式错误')
      currentOrder.value = null
    }
  } catch (error: any) {
    console.error('[OrderDetail] 获取订单详情失败:', error)
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
</style>
