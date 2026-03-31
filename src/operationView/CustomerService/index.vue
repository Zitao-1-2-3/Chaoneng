<template>
  <ContentWrap>
    <SearchTable
      ref="searchTableRef"
      :columns="columns"
      :search-schema="searchSchema"
      :fetch-data-api="fetchCustomerServiceListData"
      @add="handleAddCustomerService"
      :table-props="{ rowKey: 'id' }"
    >
      <!-- 新增客服按钮 -->
      <template #toolbar>
        <BaseButton type="success" @click="handleAddCustomerService">
          <Icon icon="ep:plus" class="mr-5px" />
          新增客服
        </BaseButton>
      </template>
    </SearchTable>

    <!-- 添加/编辑客服弹窗 -->
    <Dialog v-model="dialogVisible" :title="dialogTitle" width="500px" @close="handleDialogClose">
      <Form
        ref="formRef"
        :schema="customerServiceFormSchema"
        :is-custom="false"
        label-width="100px"
        @register="formRegister"
      />
      <template #footer>
        <div class="flex justify-end">
          <BaseButton @click="handleDialogClose">取消</BaseButton>
          <BaseButton type="primary" @click="handleSubmit" :loading="submitLoading">
            确定
          </BaseButton>
        </div>
      </template>
    </Dialog>
  </ContentWrap>
</template>

<script setup lang="tsx">
import { ref, reactive, computed } from 'vue'
import { ContentWrap } from '@/components/ContentWrap'
import { SearchTable } from '@/components/SearchTable'
import { Dialog } from '@/components/Dialog'
import { Form } from '@/components/Form'
import type { TableColumn } from '@/components/Table'
import type { FormSchema } from '@/components/Form'
import { ElTag, ElMessage, ElMessageBox } from 'element-plus'
import { Icon } from '@/components/Icon'
import { BaseButton } from '@/components/Button'
import { useForm } from '@/hooks/web/useForm'
import {
  getCustomerServiceListApi,
  createCustomerServiceApi,
  updateCustomerServiceApi,
  // deleteCustomerServiceApi, // 暂时注释，不需要删除功能
  type CustomerServiceItem,
  type CustomerServiceQueryParams,
  type CreateCustomerServiceParams,
  type UpdateCustomerServiceParams
} from '@/api/customer_service'
import { UnixTime } from '@/components/UnixTime'

// --- Refs and Reactive Variables ---
const searchTableRef = ref<InstanceType<typeof SearchTable> | null>(null)
const formRef = ref()
const dialogVisible = ref(false)
const submitLoading = ref(false)
const isEdit = ref(false)
const currentEditData = ref<CustomerServiceItem | null>(null)

// 弹窗标题
const dialogTitle = computed(() => (isEdit.value ? '编辑客服' : '新增客服'))

// --- 表单注册 ---
const { formRegister, formMethods } = useForm()

// --- API调用 ---
const fetchCustomerServiceListData = async (params: CustomerServiceQueryParams) => {
  try {
    const res = await getCustomerServiceListApi(params)
    const processedList = (res.data.list || []).map((item) => ({
      ...item
    }))

    // 适配新的分页格式：从 pager 对象中获取 total
    return {
      list: processedList,
      total: res.data.pager?.total || 0
    }
  } catch (error) {
    console.error('获取客服列表失败:', error)
    ElMessage.error('获取客服列表失败')
    return { list: [], total: 0 }
  }
}

// --- 表格列定义 ---
const columns = ref<TableColumn[]>([
  { field: 'id', label: 'ID', width: '80px' },
  { field: 'tg_name', label: 'TG用户名', minWidth: '150px' },
  {
    field: 'status',
    label: '状态',
    width: '100px',
    formatter: (row) => (
      <ElTag type={row.status === 1 ? 'success' : 'danger'}>
        {row.status === 1 ? '启用' : '禁用'}
      </ElTag>
    )
  },
  {
    field: 'created_at',
    label: '创建时间',
    width: '180px',
    formatter: (row) => <UnixTime timestamp={row.created_at} />
  },
  {
    label: '操作',
    field: 'action',
    width: '200px', // 调整宽度，因为移除了删除按钮
    fixed: 'right',
    formatter: (row) => {
      const isEnabled = row.status === 1
      const statusButtonText = isEnabled ? '禁用' : '启用'
      const statusButtonType = isEnabled ? 'danger' : 'success'
      const targetStatus = isEnabled ? 2 : 1

      return (
        <>
          <BaseButton type="primary" onClick={() => handleEditCustomerService(row)}>
            编辑
          </BaseButton>
          <BaseButton type={statusButtonType} onClick={() => handleStatusChange(row, targetStatus)}>
            {statusButtonText}
          </BaseButton>
          {/* 暂时注释删除功能 */}
          {/* <BaseButton type="danger" onClick={() => handleDeleteCustomerService(row)}>
            删除
          </BaseButton> */}
        </>
      )
    }
  }
])

// --- 搜索条件 ---
const searchSchema = reactive<FormSchema[]>([
  {
    field: 'keyword',
    label: '关键字',
    component: 'Input',
    componentProps: {
      placeholder: '请输入TG用户名'
    }
  },
  {
    field: 'status',
    label: '状态',
    component: 'Select',
    componentProps: {
      placeholder: '请选择状态',
      options: [
        { label: '全部', value: '' },
        { label: '启用', value: 1 },
        { label: '禁用', value: 2 }
      ]
    }
  }
])

// --- 客服表单配置 ---
const customerServiceFormSchema = reactive<FormSchema[]>([
  {
    field: 'tg_name',
    label: 'TG用户名',
    component: 'Input',
    componentProps: {
      placeholder: '请输入TG用户名'
    },
    formItemProps: {
      rules: [{ required: true, message: '请输入TG用户名', trigger: 'blur' }]
    },
    colProps: {
      span: 24
    }
  },
  {
    field: 'status',
    label: '状态',
    component: 'Select',
    value: 1,
    componentProps: {
      placeholder: '请选择状态',
      options: [
        { label: '启用', value: 1 },
        { label: '禁用', value: 2 }
      ]
    },
    formItemProps: {
      rules: [{ required: true, message: '请选择状态', trigger: 'change' }]
    }
  }
])

// --- 事件处理函数 ---

// 新增客服
const handleAddCustomerService = async () => {
  isEdit.value = false
  currentEditData.value = null
  dialogVisible.value = true
  // 重置表单
  setTimeout(async () => {
    try {
      const elForm = await formMethods.getElFormExpose()
      elForm?.resetFields()
      formMethods.setValues({ status: 1 })
    } catch (e) {
      console.error('Error resetting form:', e)
    }
  }, 100)
}

// 编辑客服
const handleEditCustomerService = (row: CustomerServiceItem) => {
  isEdit.value = true
  currentEditData.value = row
  dialogVisible.value = true
  // 设置表单值
  setTimeout(() => {
    formMethods.setValues({
      tg_name: row.tg_name,
      status: row.status
    })
  }, 100)
}

// 状态切换
const handleStatusChange = async (row: CustomerServiceItem, targetStatus: number) => {
  try {
    await ElMessageBox.confirm(`确定要${targetStatus === 1 ? '启用' : '禁用'}该客服吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const updateData: UpdateCustomerServiceParams = {
      id: Number(row.id),
      tg_name: row.tg_name,
      status: targetStatus
    }

    await updateCustomerServiceApi(updateData)
    ElMessage.success(`${targetStatus === 1 ? '启用' : '禁用'}成功`)
    searchTableRef.value?.reload()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('状态切换失败:', error)
      ElMessage.error('操作失败')
    }
  }
}

// 删除客服 - 暂时注释，不需要此功能
/* const handleDeleteCustomerService = async (row: CustomerServiceItem) => {
  try {
    await ElMessageBox.confirm(`确定要删除客服"${row.tg_name}"吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await deleteCustomerServiceApi({ id: Number(row.id) })
    ElMessage.success('删除成功')
    searchTableRef.value?.reload()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除客服失败:', error)
      ElMessage.error('删除失败')
    }
  }
} */

// 弹窗关闭
const handleDialogClose = async () => {
  dialogVisible.value = false
  try {
    const elForm = await formMethods.getElFormExpose()
    elForm?.resetFields()
  } catch (e) {
    console.error('Error resetting form:', e)
  }
  isEdit.value = false
  currentEditData.value = null
}

// 表单提交
const handleSubmit = async () => {
  try {
    const elForm = await formMethods.getElFormExpose()
    await elForm?.validate()
    const formData = await formMethods.getFormData()

    submitLoading.value = true

    if (isEdit.value && currentEditData.value) {
      // 编辑
      const updateData: UpdateCustomerServiceParams = {
        id: Number(currentEditData.value.id),
        tg_name: formData.tg_name,
        status: formData.status
      }
      await updateCustomerServiceApi(updateData)
      ElMessage.success('编辑成功')
    } else {
      // 新增 - 使用新的创建接口
      const createData: CreateCustomerServiceParams = {
        tg_name: formData.tg_name,
        status: formData.status
      }
      await createCustomerServiceApi(createData)
      ElMessage.success('新增成功')
    }

    handleDialogClose()
    searchTableRef.value?.reload()
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('操作失败')
  } finally {
    submitLoading.value = false
  }
}
</script>

<style scoped>
/* 可以添加自定义样式 */
</style>
