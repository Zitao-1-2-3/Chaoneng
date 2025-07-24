<template>
  <div class="app-container">
    <ContentWrap>
      <SearchTable
        ref="searchTableRef"
        :columns="columns"
        :searchSchema="searchSchema"
        :fetchDataApi="getUserList"
        @search="handleSearch"
        :show-add-button="false"
      >
        <!-- <template #searchButtons>
          <BaseButton type="primary" @click="handleExport">
            <Icon icon="ep:download" class="mr-5px" />
            导出
          </BaseButton>
        </template> -->
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
import { ContentWrap } from '@/components/ContentWrap'
import { getUserListApi, exportUserListApi } from '@/api/agent/user_list'

const searchTableRef = ref()

// Fetch data function
const getUserList = async (params?: any): Promise<{ list: any[]; total?: number }> => {
  try {
    const res = await getUserListApi(params)
    return { list: res.data?.list || [], total: res.data?.totalCount || 0 }
  } catch (error) {
    ElMessage.error('获取用户列表失败')
    return { list: [], total: 0 }
  }
}

// Export function
const exportUserList = async (params: any) => {
  try {
    const res = await exportUserListApi(params)
    // 处理文件下载，取 res.data 作为 Blob
    const blob = new Blob([res.data], { type: 'application/vnd.ms-excel' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', '用户列表.xlsx')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

// Search schema
const searchSchema = ref<FormSchema[]>([
  {
    field: 'query',
    component: 'Input',
    label: '关键字',
    componentProps: {
      placeholder: '请输入代理信息/机器人/用户名'
    }
  }
])

// 表格字段
const columns = ref<TableColumn[]>([
  { field: 'nickname', label: 'TG昵称', minWidth: 100 },
  { field: 'bot_info.bot_name', label: '机器人名', minWidth: 120 },
  { field: 'user_name', label: '用户账号', minWidth: 100 }
])

// Handle search
const handleSearch = (params) => {
  // 可选：调试用
  console.log(params)
}

// Handle export
const handleExport = async () => {
  try {
    const params = (await searchTableRef.value?.searchMethods.getFormData()) || {}
    await exportUserList(params)
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
