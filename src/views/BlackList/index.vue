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
        <ElFormItem label="描述" prop="describe">
          <ElInput v-model="newAddressForm.describe" placeholder="请输入描述" />
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
import { v1GetBlackList, v1CreateBlackList, v1DeleteBlackList } from '@/api/black_list'
import type { BlackListItemV1, BlackListParamsV1 } from '@/api/black_list/types'

// const { t } = useI18n() // 按需保留或移除

// ----- 模拟 API 实现 (应放在 /api/blacklist.ts) -----
// [REMOVED MOCK APIs and related variables like mockBlacklistDB, nextId]
// ----- API 和类型定义结束 -----

const searchTableRef = ref<InstanceType<typeof SearchTable> | null>(null)
const currentRowForDelete = ref<BlackListItemV1 | null>(null)

const dialogVisible = ref(false)
const newAddressForm = reactive({
  address: '',
  describe: ''
})
const newAddressFormRef = ref<InstanceType<typeof ElForm> | null>(null)
const newAddressFormRules: ElementPlusFormRules = {
  address: [{ required: true, message: '请输入地址', trigger: 'blur' }],
  describe: [{ required: true, message: '请输入描述', trigger: 'blur' }]
}

const columns: TableColumn[] = [
  {
    field: 'address',
    label: '地址',
    minWidth: 300
  },
  {
    field: 'describe',
    label: '描述'
  },
  {
    field: 'created_at',
    label: '创建时间',
    width: 180,
    formatter: (row: BlackListItemV1) => formatToDateTime(row.created_at)
  }
]

const actionColumn: TableColumn = {
  field: 'action',
  label: '操作',
  width: 100,
  fixed: 'right',
  slots: {
    default: (data: { row: BlackListItemV1 }) => {
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
    const queryParams: BlackListParamsV1 = {
      current_page: Number(params.current_page) || 1,
      page_size: Number(params.page_size) || 10,
      address: params.address || undefined
    }

    // 使用新接口 v1GetBlackList
    const res = await v1GetBlackList(queryParams)

    if (res.code === '000000' && res.data) {
      return {
        list: res.data.list || [],
        total: res.data.pager?.total || 0
      }
    }

    return { list: [], total: 0 }
  } catch (error) {
    console.error('获取黑名单列表失败:', error)
    return { list: [], total: 0 }
  }
}

const deleteBlackListItemAction = async () => {
  if (currentRowForDelete.value && currentRowForDelete.value.id) {
    try {
      // 使用新接口 v1DeleteBlackList，传递 id 和 address
      await v1DeleteBlackList({
        id: currentRowForDelete.value.id,
        address: currentRowForDelete.value.address
      })
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

const handleDeleteConfirmation = (row: BlackListItemV1) => {
  currentRowForDelete.value = row
  if (searchTableRef.value) {
    searchTableRef.value.delete(row)
  }
}

const handleAdd = () => {
  newAddressForm.address = ''
  newAddressForm.describe = ''
  if (newAddressFormRef.value) {
    newAddressFormRef.value.resetFields()
  }
  dialogVisible.value = true
}

const submitAdd = async () => {
  if (!newAddressFormRef.value) return
  try {
    await newAddressFormRef.value.validate()
    // 使用新接口 v1CreateBlackList
    await v1CreateBlackList({
      address: newAddressForm.address,
      describe: newAddressForm.describe
    })
    ElMessage.success('新增成功')
    dialogVisible.value = false
    searchTableRef.value?.reload()
  } catch (error) {
    if (error !== false) {
      console.error('新增失败:', error)
    }
  }
}
</script>

<style scoped>
.app-container {
  padding: 15px;
}
</style>
