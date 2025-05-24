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
import type { AxiosResponse } from 'axios' //  用于模拟 API 返回类型

// const { t } = useI18n() // 按需保留或移除

// ----- 假设的类型定义 (应放在 /api/blacklist/types.ts) -----
interface BlackListItem {
  id: number | string
  address: string
  create_time: number | string //  可以是秒级时间戳或 ISO 字符串
}

interface BlackListParams {
  current_page?: number
  page_size?: number
  address?: string // 用于搜索
}
// ----- 模拟 API 实现 (应放在 /api/blacklist.ts) -----
const mockBlacklistDB: BlackListItem[] = [
  {
    id: 1,
    address: '0x1234567890abcdef1234567890abcdef12345678',
    create_time: Math.floor(Date.now() / 1000) - 3600 * 24 * 2
  },
  {
    id: 2,
    address: '0xanotherAddressForTestingBlacklistFeature',
    create_time: Math.floor(Date.now() / 1000) - 3600 * 24 * 5
  },
  {
    id: 3,
    address: 'user_remark_for_blacklist_item_one',
    create_time: Math.floor(Date.now() / 1000) - 3600 * 24 * 10
  }
]
let nextId = 4

const getBlackListApi = async (
  params: BlackListParams
): Promise<AxiosResponse<{ list: BlackListItem[]; totalCount: number }>> => {
  console.log('Mock: getBlackListApi called with:', params)
  await new Promise((resolve) => setTimeout(resolve, 300))
  let items = [...mockBlacklistDB]
  if (params.address) {
    items = items.filter((item) =>
      item.address.toLowerCase().includes(params.address!.toLowerCase())
    )
  }
  const totalCount = items.length
  const page = params.current_page || 1
  const size = params.page_size || 10
  const paginatedItems = items.slice((page - 1) * size, page * size)
  return {
    data: { list: paginatedItems, totalCount },
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {}
  } as AxiosResponse<{ list: BlackListItem[]; totalCount: number }>
}

const deleteBlackListApi = async (id: number | string): Promise<AxiosResponse> => {
  console.log('Mock: deleteBlackListApi called with id:', id)
  await new Promise((resolve) => setTimeout(resolve, 300))
  const index = mockBlacklistDB.findIndex((item) => item.id === id)
  if (index > -1) {
    mockBlacklistDB.splice(index, 1)
  }
  return { data: {}, status: 200, statusText: 'OK', headers: {}, config: {} } as AxiosResponse
}

const addBlackListApi = async (data: {
  address: string
}): Promise<AxiosResponse<{ id: number | string; address: string; create_time: number }>> => {
  console.log('Mock: addBlackListApi called with data:', data)
  await new Promise((resolve) => setTimeout(resolve, 300))
  const newItem: BlackListItem = {
    id: nextId++,
    address: data.address,
    create_time: Math.floor(Date.now() / 1000)
  }
  mockBlacklistDB.unshift(newItem) // Add to the beginning for better visibility in mock
  return {
    data: newItem,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {}
  } as AxiosResponse<{ id: number | string; address: string; create_time: number }>
}
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

const fetchBlackListData = async (params: BlackListParams) => {
  try {
    const queryParams: BlackListParams = {
      current_page: Number(params.current_page) || 1,
      page_size: Number(params.page_size) || 10,
      address: params.address || undefined
    }
    const res = await getBlackListApi(queryParams)
    // 时间戳通常是秒，如果 API 返回的是秒，需要乘以 1000 转换为毫秒给 formatToDateTime
    // 假设 formatToDateTime 可以处理秒或毫秒，或者 API 返回的就是毫秒级时间戳或可直接格式化的字符串
    const mappedList = (res.data.list || []).map((item: BlackListItem): BlackListItem => {
      // 如果 create_time 是秒级时间戳且 formatToDateTime 需要毫秒，则转换
      // const createTimeMs = typeof item.create_time === 'number' && String(item.create_time).length === 10
      //                      ? item.create_time * 1000
      //                      : item.create_time;
      return {
        ...item
        // create_time: createTimeMs // 如果需要转换
      }
    })
    return {
      list: mappedList,
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
      await deleteBlackListApi(currentRowForDelete.value.id)
      ElMessage.success('删除成功')
      return true //  告知 SearchTable 删除成功，它会刷新列表
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
    // ElMessageBox.confirm(...) 可以放在这里，或者由 SearchTable 内部处理
    searchTableRef.value.delete(row) //  SearchTable 内部应有确认弹窗
  } else {
    console.warn('SearchTable ref is not available for delete.')
  }
}

const handleAdd = () => {
  console.log('handleAdd called by SearchTable @add event') // 1. 检查 handleAdd 是否被调用
  newAddressForm.address = ''
  if (newAddressFormRef.value) {
    newAddressFormRef.value.resetFields()
  }
  dialogVisible.value = true // 2. 检查 dialogVisible.value 是否变为 true
  console.log('dialogVisible.value after set:', dialogVisible.value)
}

const submitAdd = async () => {
  if (!newAddressFormRef.value) return
  try {
    await newAddressFormRef.value.validate()
    await addBlackListApi({ address: newAddressForm.address })
    ElMessage.success('新增成功')
    dialogVisible.value = false
    searchTableRef.value?.reload() // 使用从 SearchTable 暴露的 reload 方法
  } catch (error) {
    //  validate 失败会自动提示，API 错误在这里处理
    if (error !== false) {
      //  如果是 validate 抛出的错误，通常是 false 或者 fieldError
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
