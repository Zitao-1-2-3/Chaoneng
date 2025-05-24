<template>
  <div class="app-container">
    <ContentWrap>
      <SearchTable
        :columns="columns"
        :search-schema="searchSchema"
        :fetch-data-api="fetchBlackListData"
        :action-column="actionColumn"
        :fetch-del-api="deleteBlackListItemAction"
        :show-add-button="true"
        @add="handleAdd"
        ref="searchTableRef"
      />
    </ContentWrap>

    <ElDialog v-model="dialogVisible" title="新增黑名单" width="400px">
      <ElForm
        :model="newAddressForm"
        ref="newAddressFormRef"
        label-width="80px"
        :rules="newAddressFormRules"
      >
        <ElFormItem label="地址" prop="address">
          <ElInput v-model="newAddressForm.address" placeholder="请输入地址" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="submitAdd">确定</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="tsx">
import { ref, reactive } from 'vue'
import { ElButton, ElMessage, ElDialog, ElForm, ElFormItem, ElInput } from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import { SearchTable } from '@/components/SearchTable'
import { BaseButton } from '@/components/Button'
// import { useI18n } from '@/hooks/web/useI18n' //  按需保留或移除
import type { TableColumn } from '@/components/Table'
import type { FormSchema } from '@/components/Form' // 只导入 FormSchema
import type { FormRules as ElementPlusFormRules } from 'element-plus' // 从 element-plus 导入 FormRules
import { formatToDateTime } from '@/utils/dateUtil' // 确保导入
// 从API文件导入类型和函数
import { getBlackListApi, addBlackListApi, deleteBlackListApi } from '@/api/black_list'
import type { BlackListItem, BlackListParams } from '@/api/black_list' // 导入类型

// const { t } = useI18n() // 按需保留或移除

// ----- 模拟 API 实现 (应放在 /api/blacklist.ts) -----
// [REMOVED MOCK APIs and related variables like mockBlacklistDB, nextId]
// ----- API 和类型定义结束 -----

const searchTableRef = ref<InstanceType<typeof SearchTable> | null>(null)
const currentRowForDelete = ref<BlackListItem | null>(null)

const dialogVisible = ref(false)
const newAddressForm = reactive({
  address: ''
})
const newAddressFormRef = ref<InstanceType<typeof ElForm> | null>(null)
const newAddressFormRules: ElementPlusFormRules = {
  address: [{ required: true, message: '请输入地址', trigger: 'blur' }]
}

const columns: TableColumn[] = [
  {
    field: 'address',
    label: '地址',
    minWidth: 300
  },
  {
    field: 'create_time',
    label: '创建时间',
    width: 180,
    formatter: (row: BlackListItem) => formatToDateTime(row.create_time)
  }
]

const actionColumn: TableColumn = {
  field: 'action',
  label: '操作',
  width: 100,
  fixed: 'right',
  slots: {
    default: (data: { row: BlackListItem }) => {
      return (
        <BaseButton type="danger" onClick={() => handleDeleteConfirmation(data.row)}>
          删除
        </BaseButton>
      )
    }
  }
}

const searchSchema: FormSchema[] = [
  {
    field: 'address',
    label: '地址',
    component: 'Input',
    componentProps: {
      placeholder: '请输入地址进行搜索'
    }
  }
]

const fetchBlackListData = async (params: {
  current_page?: number
  page_size?: number
  address?: string
}) => {
  try {
    const queryParams: BlackListParams = {
      page: Number(params.current_page) || 1,
      page_size: Number(params.page_size) || 10,
      address: params.address || undefined
    }
    const res = await getBlackListApi(queryParams)
    return {
      list: res.data.list || [],
      total: res.data.totalCount || 0
    }
  } catch (error) {
    console.error('获取黑名单列表失败:', error)
    ElMessage.error('获取黑名单列表失败')
    return { list: [], total: 0 }
  }
}

const deleteBlackListItemAction = async () => {
  if (currentRowForDelete.value && currentRowForDelete.value.id) {
    try {
      await deleteBlackListApi({ id: currentRowForDelete.value.id })
      ElMessage.success('删除成功')
      return true
    } catch (error) {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
      return false
    }
  }
  return false
}

const handleDeleteConfirmation = (row: BlackListItem) => {
  currentRowForDelete.value = row
  if (searchTableRef.value) {
    searchTableRef.value.delete(row)
  }
}

const handleAdd = () => {
  newAddressForm.address = ''
  if (newAddressFormRef.value) {
    newAddressFormRef.value.resetFields()
  }
  dialogVisible.value = true
}

const submitAdd = async () => {
  if (!newAddressFormRef.value) return
  try {
    await newAddressFormRef.value.validate()
    await addBlackListApi({ address: newAddressForm.address })
    ElMessage.success('新增成功')
    dialogVisible.value = false
    searchTableRef.value?.reload()
  } catch (error) {
    if (error !== false) {
      console.error('新增失败:', error)
      ElMessage.error('新增失败，请检查地址是否有效或联系管理员')
    }
  }
}
</script>

<style scoped>
.app-container {
  padding: 15px;
}
</style>
