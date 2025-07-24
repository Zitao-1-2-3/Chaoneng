<template>
  <div class="app-container">
    <ContentWrap>
      <SearchTable
        ref="searchTableRef"
        :columns="columns"
        :searchSchema="searchSchema"
        :fetchDataApi="getRechargeOrderList"
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
    </ContentWrap>
  </div>
</template>

<script setup lang="tsx">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { BaseButton } from '@/components/Button'
import { Icon } from '@/components/Icon'
import { SearchTable } from '@/components/SearchTable'
import { FormSchema } from '@/components/Form'
import { TableColumn } from '@/components/Table'
import {
  getRechargeOrderListApi,
  exportRechargeOrderApi,
  RechargeOrderQueryParams
} from '@/api/operation/recharge_order'
import { ContentWrap } from '@/components/ContentWrap'

const searchTableRef = ref()

// 定义API函数调用
const getRechargeOrderList = async (params?: any): Promise<{ list: any[]; total?: number }> => {
  try {
    const res = await getRechargeOrderListApi(params)
    return {
      list: res.data.list || [],
      total: res.data.totalCount || 0
    }
  } catch (error) {
    console.error('获取充值订单列表失败:', error)
    ElMessage.error('获取充值订单列表失败')
    return {
      list: [],
      total: 0
    }
  }
}

// 导出数据API
const exportRechargeOrder = async (params: RechargeOrderQueryParams) => {
  try {
    ElMessage.success('导出已开始，请稍候')
    await exportRechargeOrderApi(params)
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

// 搜索表单配置
const searchSchema = ref<FormSchema[]>([
  {
    field: 'query',
    component: 'Input',
    label: '关键字',
    componentProps: {
      placeholder: '请输入代理信息/TG用户名'
    }
  }
])

// 表格列配置
const columns = ref<TableColumn[]>([
  {
    field: 'agentInfo',
    label: '代理信息',
    minWidth: 150
  },
  {
    field: 'bot',
    label: '机器人',
    minWidth: 120
  },
  {
    field: 'tgUsername',
    label: '用户的TG用户名',
    minWidth: 150
  },
  {
    field: 'address',
    label: '地址',
    minWidth: 200
  },
  {
    field: 'amount',
    label: '金额',
    minWidth: 100,
    formatter: (row) => `${row.amount} USDT` // 假设单位为USDT，根据实际调整
  }
])

// 处理搜索
const handleSearch = (params) => {
  console.log('搜索参数:', params)
}

// 处理导出
const handleExport = async () => {
  try {
    const params = (await searchTableRef.value?.searchMethods.getFormData()) || {}
    await exportRechargeOrder(params as RechargeOrderQueryParams)
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
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
