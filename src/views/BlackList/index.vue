<template>
  <div class="app-container">
    <ContentWrap>
      <SearchTable
        :columns="columns"
        :search-schema="searchSchema"
        :fetch-data-api="fetchBlackListData"
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
import { ElButton, ElDialog, ElForm, ElFormItem, ElInput } from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import { SearchTable } from '@/components/SearchTable'
import { BaseButton } from '@/components/Button'
import type { TableColumn } from '@/components/Table'
import type { FormSchema } from '@/components/Form'
import type { FormRules as ElementPlusFormRules } from 'element-plus'
import { formatToDateTime } from '@/utils/dateUtil'
import { v1GetBlackList, v1CreateBlackList, v1DeleteBlackList } from '@/api/black_list'
import type { BlackListItemV1, BlackListParamsV1 } from '@/api/black_list/types'
import { handleListMessage, handleErrorMessage, handleSuccessMessage } from '@/utils/messageHelper'

const searchTableRef = ref<InstanceType<typeof SearchTable> | null>(null)
const currentRowForDelete = ref<BlackListItemV1 | null>(null)

const dialogVisible = ref(false)
const newAddressForm = reactive({
  address: '',
  describe: ''
})
const newAddressFormRef = ref<InstanceType<typeof ElForm> | null>(null)
const newAddressFormRules: ElementPlusFormRules = {
  address: [
    { required: true, message: '请输入地址', trigger: 'blur' },
    {
      pattern: /^[^\u4e00-\u9fa5]+$/,
      message: '地址不能包含汉字',
      trigger: 'blur'
    }
  ],
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
    label: '描述',
    minWidth: 150
  },
  {
    field: 'created_at',
    label: '创建时间',
    sortable: 'custom',
    width: 180,
    formatter: (row: BlackListItemV1) => formatToDateTime(row.created_at * 1000)
  },
  {
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
]

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
  order?: string
}) => {
  try {
    const queryParams: BlackListParamsV1 = {
      current_page: Number(params.current_page) || 1,
      page_size: Number(params.page_size) || 10
    }

    // 处理地址搜索
    if (params.address) {
      queryParams.address = params.address
    }

    // 处理排序参数
    if (params.order) {
      const fieldMapping: Record<string, string> = {
        created_at: 'created_at'
      }

      const orderParts = params.order.split(' ')
      if (orderParts.length === 2) {
        const [field, direction] = orderParts
        const mappedField = fieldMapping[field] || field
        queryParams.order = `${mappedField} ${direction}`
      }
    }

    const res = await v1GetBlackList(queryParams)

    if (res.code === '000000' && res.data) {
      const list = res.data.list || []

      // 添加数据为空提示
      const hasSearchCondition = !!params.address
      handleListMessage(list, hasSearchCondition, '黑名单')

      return {
        list,
        total: res.data.pager?.total || 0
      }
    }

    return { list: [], total: 0 }
  } catch (error) {
    handleErrorMessage(error, '获取黑名单列表失败')
    return { list: [], total: 0 }
  }
}

const deleteBlackListItemAction = async () => {
  if (currentRowForDelete.value && currentRowForDelete.value.id) {
    try {
      await v1DeleteBlackList({
        id: currentRowForDelete.value.id,
        address: currentRowForDelete.value.address
      })
      handleSuccessMessage('删除成功')
      return true
    } catch (error) {
      handleErrorMessage(error, '删除黑名单失败')
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
    await v1CreateBlackList({
      address: newAddressForm.address,
      describe: newAddressForm.describe
    })
    handleSuccessMessage('新增成功')
    dialogVisible.value = false
    searchTableRef.value?.reload()
  } catch (error) {
    if (error !== false) {
      handleErrorMessage(error, '新增黑名单失败')
    }
  }
}
</script>

<style scoped>
.app-container {
  padding: 15px;
}
</style>
