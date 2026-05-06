<template>
  <div class="app-container">
    <ContentWrap>
      <SearchTable
        ref="searchTableRef"
        :columns="columns"
        :searchSchema="searchSchema"
        :fetchDataApi="getAgentRechargeList"
        @search="handleSearch"
        :show-add-button="false"
      >
        <template #searchButtons>
          <BaseButton type="primary" @click="handleExport">
            <Icon icon="ep:download" class="mr-5px" />
            导出
          </BaseButton>
        </template>
      </SearchTable>

      <!-- 详情弹窗 -->
      <Dialog v-model="dialogVisible" :title="'充值详情'">
        <ElTabs v-model="activeTab">
          <ElTabPane label="订单详情" name="order">
            <Descriptions :schema="orderDetailSchema" :data="orderDetail" :column="2" border />
          </ElTabPane>
          <ElTabPane label="充值详情" name="recharge">
            <Descriptions
              :schema="rechargeDetailSchema"
              :data="rechargeDetail"
              :column="2"
              border
            />
          </ElTabPane>
        </ElTabs>
        <template #footer>
          <div class="flex justify-end">
            <ElButton @click="dialogVisible = false">关闭</ElButton>
          </div>
        </template>
      </Dialog>
    </ContentWrap>
  </div>
</template>

<script setup lang="tsx">
import { ref, onMounted, h, computed } from 'vue'
import { ElButton, ElTabs, ElTabPane, ElLink, ElTag } from 'element-plus'
import { BaseButton } from '@/components/Button'
import { Icon } from '@/components/Icon'
import { SearchTable } from '@/components/SearchTable'
import { FormSchema } from '@/components/Form'
import { TableColumn } from '@/components/Table'
import { formatToDateTime } from '@/utils/dateUtil'
import {
  getAgentRechargeListApi,
  exportAgentRechargeApi,
  getAgentRechargeDetailApi,
  AgentRechargeQueryParams
} from '@/api/agent/agent_recharge'
import { ContentWrap } from '@/components/ContentWrap'
import { Dialog } from '@/components/Dialog'
import { Descriptions } from '@/components/Descriptions'
import type { DescriptionsSchema } from '@/components/Descriptions'
import { handleErrorMessage, handleSuccessMessage } from '@/utils/messageHelper'

const searchTableRef = ref()
const dialogVisible = ref(false)
const activeTab = ref('order')
const orderDetail = ref<any>({})
const rechargeDetail = ref<any>({})

// 订单详情schema
const orderDetailSchema = computed(() => {
  const schema: DescriptionsSchema[] = [
    { field: 'order_no', label: '订单号' },
    { field: 'agent_name', label: '代理名称' },
    { field: 'contact', label: '联系方式' },
    { field: 'recharge_type', label: '充值订单类型' },
    {
      field: 'amount',
      label: '充值金额',
      slots: { default: (row) => h('span', `${row.amount || '-'} USDT`) }
    },
    {
      field: 'status',
      label: '订单状态',
      slots: {
        default: (row: any) => {
          if (!row) return h('span', '-')
          return h(ElTag, { type: getStatusType(row.status), size: 'small' }, () =>
            getStatusText(row.status)
          )
        }
      }
    },
    {
      field: 'created_at',
      label: '创建时间',
      slots: { default: (row) => h('span', formatToDateTime(row.created_at) || '-') }
    },
    { field: 'remark', label: '备注' }
  ]
  return schema
})

// 充值详情schema
const rechargeDetailSchema = computed(() => {
  const schema: DescriptionsSchema[] = [
    { field: 'to_address', label: '收款地址' },
    { field: 'from_address', label: '支付地址' },
    { field: 'hash', label: '交易哈希' }
  ]
  return schema
})

// 获取订单状态显示类型
const getStatusType = (status: number): 'success' | 'warning' | 'danger' => {
  const statusMap = {
    0: 'warning', // 待处理
    1: 'success', // 已完成
    2: 'danger' // 已取消
  }
  return statusMap[status] || 'info'
}

// 获取订单状态文本
const getStatusText = (status: number): string => {
  const statusMap = {
    0: '待处理',
    1: '已完成',
    2: '已取消'
  }
  return statusMap[status] || '未知'
}

// 表格列配置
const columns = ref<TableColumn[]>([
  {
    field: 'order_no',
    label: '订单号',
    minWidth: 120
  },
  {
    field: 'agent_name',
    label: '代理名称',
    minWidth: 120
  },
  {
    field: 'contact',
    label: '联系方式',
    minWidth: 150
  },
  {
    field: 'recharge_type',
    label: '充值订单类型',
    minWidth: 120,
    formatter: () => '充值USDT'
  },
  {
    field: 'amount',
    label: '充值金额',
    minWidth: 100,
    formatter: (row) => `${row.amount} USDT`
  },
  {
    field: 'status',
    label: '订单状态',
    minWidth: 100,
    formatter: (row) => {
      const type = getStatusType(row.status)
      return <ElTag type={type}>{getStatusText(row.status) || '未知'}</ElTag>
    }
  },
  {
    field: 'created_at',
    label: '创建时间',
    minWidth: 150,
    formatter: (row) => formatToDateTime(row.created_at)
  },
  {
    field: 'remark',
    label: '备注',
    minWidth: 150,
    formatter: (row) => row.remark || '-'
  },
  {
    field: 'action',
    label: '操作',
    minWidth: 100,
    fixed: 'right',
    slots: {
      default: ({ row }: any) => (
        <ElLink type="primary" onClick={() => handleViewDetail(row)}>
          充值详情
        </ElLink>
      )
    }
  }
])

// 搜索表单配置（同之前）
const searchSchema = ref<FormSchema[]>([
  {
    field: 'query',
    component: 'Input',
    label: '关键字',
    componentProps: {
      placeholder: '请输入订单号/代理名称'
    }
  },
  {
    field: 'status',
    component: 'Select',
    label: '订单状态',
    componentProps: {
      placeholder: '请选择订单状态',
      clearable: true,
      options: [
        { label: '待处理', value: 0 },
        { label: '已完成', value: 1 },
        { label: '已取消', value: 2 }
      ]
    }
  }
])

// 定义API函数调用（同之前）
const getAgentRechargeList = async (params?: any): Promise<{ list: any[]; total?: number }> => {
  try {
    const res = await getAgentRechargeListApi(params)
    return {
      list: res.data.list || [],
      total: res.data.totalCount || 0
    }
  } catch (error) {
    handleErrorMessage(error, '获取代理充值明细列表失败')
    return {
      list: [],
      total: 0
    }
  }
}

// 导出数据API（同之前）
const exportAgentRecharge = async (params: AgentRechargeQueryParams) => {
  try {
    await exportAgentRechargeApi(params)
    handleSuccessMessage('导出成功')
  } catch (error) {
    handleErrorMessage(error, '导出失败')
  }
}

// 处理搜索（同之前）
const handleSearch = (params) => {
  console.log('搜索参数:', params)
}

// 处理导出（同之前）
const handleExport = async () => {
  try {
    const params = (await searchTableRef.value?.searchMethods.getFormData()) || {}
    await exportAgentRecharge(params as AgentRechargeQueryParams)
  } catch (error) {
    handleErrorMessage(error, '导出失败')
  }
}

// 查看订单详情（参考原文件实现）
const handleViewDetail = async (row) => {
  try {
    const response = await getAgentRechargeDetailApi(row.id)
    orderDetail.value = response.data.order_info || {} // 假设后端返回order_info
    rechargeDetail.value = response.data.recharge_info || {} // 假设后端返回recharge_info

    dialogVisible.value = true
    activeTab.value = 'order'
  } catch (error) {
    handleErrorMessage(error, '获取充值详情失败')
  }
}

onMounted(() => {
  searchTableRef.value?.reload()
})
</script>

<style scoped>
.app-container {
  padding: 20px;
}
</style>
