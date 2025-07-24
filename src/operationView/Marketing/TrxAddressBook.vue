<template>
  <div class="app-container">
    <ContentWrap>
      <SearchTable
        ref="searchTableRef"
        :columns="columns"
        :searchSchema="searchSchema"
        :fetchDataApi="getTrxAddressBookList"
        @search="handleSearch"
        :show-add-button="true"
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
  getTrxAddressBookListApi,
  exportTrxAddressBookApi,
  TrxAddressBookQueryParams
} from '@/api/marketing/trx_address_book'
import { ContentWrap } from '@/components/ContentWrap'

const searchTableRef = ref()

// 定义API函数调用
const getTrxAddressBookList = async (params?: any): Promise<{ list: any[]; total?: number }> => {
  try {
    const res = await getTrxAddressBookListApi(params)
    return {
      list: res.data.list || [],
      total: res.data.totalCount || 0
    }
  } catch (error) {
    console.error('获取收款地址簿列表失败:', error)
    ElMessage.error('获取收款地址簿列表失败')
    return {
      list: [],
      total: 0
    }
  }
}

// 导出数据API
const exportTrxAddressBook = async (params: TrxAddressBookQueryParams) => {
  try {
    ElMessage.success('导出已开始，请稍候')
    await exportTrxAddressBookApi(params)
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
      placeholder: '请输入代理名称/收款地址'
    }
  }
])

// 表格列配置
const columns = ref<TableColumn[]>([
  {
    field: 'agentName',
    label: '代理名称',
    minWidth: 120
  },
  {
    field: 'receivingAddress',
    label: '收款地址',
    minWidth: 150
  },
  {
    field: 'bot',
    label: '机器人',
    minWidth: 100
  },
  {
    field: 'purpose',
    label: '用途',
    minWidth: 100
  },
  {
    field: 'trxBalance',
    label: 'TRX余额',
    minWidth: 100,
    formatter: (row) => `${row.trxBalance} TRX`
  },
  {
    field: 'usdtBalance',
    label: 'USDT余额',
    minWidth: 100,
    formatter: (row) => `${row.usdtBalance} USDT`
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
    await exportTrxAddressBook(params as TrxAddressBookQueryParams)
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
