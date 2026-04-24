<template>
  <Dialog v-model="dialogVisible" title="内联按钮管理" width="1200px">
    <div class="inline-button-container">
      <!-- 搜索表格 -->
      <SearchTable
        :columns="columns"
        :search-schema="searchSchema"
        :fetch-data-api="fetchMenuList"
        :fetch-del-api="deleteMenu"
        :action-column="actionColumn"
        ref="searchTableRef"
        @add="handleAdd"
      />

      <!-- 表单弹窗 -->
      <Dialog v-model="formDialogVisible" :title="formDialogTitle" width="600px">
        <!-- 表单内容 -->
        <Form ref="formRef" :schema="formSchema" @register="formRegister" />
        <template #footer>
          <div class="flex justify-end">
            <ElButton @click="formDialogVisible = false">取消</ElButton>
            <ElButton type="primary" @click="handleFormSubmit">提交</ElButton>
          </div>
        </template>
      </Dialog>
    </div>
  </Dialog>
</template>

<script setup lang="tsx">
import { ref, h, reactive, watch } from 'vue'
import { ElMessage, ElButton, ElTag } from 'element-plus'
import { Dialog } from '@/components/Dialog'
import { SearchTable } from '@/components/SearchTable'
import { BaseButton } from '@/components/Button'
import { Form } from '@/components/Form'
import { useForm } from '@/hooks/web/useForm'
import type { TableColumn } from '@/components/Table'
import type { FormSchema } from '@/components/Form'
import { v2GetMenuList, v2AddMenu, v2UpdateMenu, v2DeleteMenuApi } from '@/api/menu_list'
import type { MenuListParamsV1, AddMenuParamsV1, UpdateMenuParamsV1 } from '@/api/menu_list/types'
import { useValidator } from '@/hooks/web/useValidator'

const { required } = useValidator()
const { formRegister, formMethods } = useForm()
const { getElFormExpose } = formMethods

// Props
const props = defineProps<{
  modelValue: boolean
}>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

// 弹窗显示状态
const dialogVisible = ref(props.modelValue)

// 监听props变化
watch(
  () => props.modelValue,
  (val) => {
    dialogVisible.value = val
  }
)

// 监听dialogVisible变化，同步到父组件
watch(dialogVisible, (val) => {
  emit('update:modelValue', val)
})

// SearchTable引用
const searchTableRef = ref<InstanceType<typeof SearchTable> | null>(null)

// 添加formValues来跟踪表单值（运营端固定为URL类型）
const formValues = reactive<{
  inner_type: string
  inner_value: string
  [key: string]: any
}>({
  inner_type: 'url',
  inner_value: ''
})

// 表单配置
const formSchema = reactive<FormSchema[]>([
  {
    field: 'menu_name',
    component: 'Input' as const,
    label: '内联按钮名称',
    componentProps: {
      placeholder: '请输入内联按钮名称'
    },
    formItemProps: {
      rules: required('内联按钮名称不能为空')
    }
  },
  {
    field: 'order_num',
    component: 'InputNumber' as const,
    label: '排序',
    componentProps: {
      placeholder: '请输入排序',
      min: 0
    },
    formItemProps: {
      rules: required('排序不能为空')
    }
  },
  {
    field: 'status',
    component: 'Switch' as const,
    label: '状态',
    value: 1,
    componentProps: {
      activeValue: 1,
      inactiveValue: 2
    },
    formItemProps: {
      rules: required('状态不能为空')
    }
  },
  {
    field: 'inner_type',
    component: 'Select' as const,
    label: '内联类型',
    value: 'url',
    componentProps: {
      options: [{ label: 'URL链接', value: 'url' }],
      placeholder: '请选择内联类型',
      disabled: true // 运营端只支持URL，禁用选择
    },
    formItemProps: {
      rules: required('内联类型不能为空')
    }
  },
  {
    field: 'inner_value',
    component: 'Input' as const,
    label: '链接地址',
    componentProps: {
      placeholder: '请输入链接地址',
      remark: () => (
        <>
          <p>例如：https://www.123456789.com</p>
        </>
      )
    },
    formItemProps: {
      rules: required('链接地址不能为空')
    }
  }
])

// 表格列配置
const columns: TableColumn[] = [
  {
    field: 'menu_name',
    label: '内联按钮名称'
  },
  {
    field: 'text',
    label: '使用功能',
    formatter: (row: any) => row.inner_value || '-'
  },
  {
    field: 'status',
    label: '状态',
    slots: {
      default: (data: any) => {
        const statusMap = {
          1: { label: '启用', type: 'success' },
          2: { label: '禁用', type: 'danger' }
        }
        const status = statusMap[data.row.status] || { label: '-', type: 'info' }
        return h(
          ElTag,
          {
            type: status.type
          },
          () => status.label
        )
      }
    }
  }
]

// 操作列配置
const actionColumn = {
  field: 'action',
  label: '操作',
  width: 200,
  slots: {
    default: (data: any) => {
      const row = data.row
      return (
        <>
          <BaseButton type="primary" onClick={() => handleEdit(row)}>
            编辑
          </BaseButton>
          <BaseButton type="danger" onClick={() => handleDelete(row)}>
            删除
          </BaseButton>
        </>
      )
    }
  }
}

// 搜索表单配置
const searchSchema: FormSchema[] = [
  {
    field: 'menu_name',
    component: 'Input' as const,
    label: '菜单名称',
    componentProps: {
      placeholder: '请输入菜单名称'
    }
  }
]

// API 封装
const fetchMenuList = async (params: any) => {
  try {
    const queryParams: MenuListParamsV1 = {
      current_page: Number(params.current_page) || 1,
      page_size: Number(params.page_size) || 10,
      keyword: params.menu_name || undefined,
      menu_type: 2, // 固定为内联按钮类型
      status: params.status || undefined
    }

    const response = await v2GetMenuList(queryParams)

    if (response.code === '000000' && response.data) {
      const list = response.data.list || []
      return {
        list,
        totalCount: response.data.pager?.total || 0
      }
    }

    return { list: [], totalCount: 0 }
  } catch (error) {
    ElMessage.error('获取内联按钮列表失败')
    return { list: [], totalCount: 0 }
  }
}

const deleteMenu = async (): Promise<boolean> => {
  const row = searchTableRef.value?.currentRow
  if (row && row.id) {
    try {
      const res = await v2DeleteMenuApi(row.id)
      if (res.code === '000000') {
        ElMessage.success('删除成功')
        return true
      }
      ElMessage.error('删除失败')
      return false
    } catch (error) {
      ElMessage.error('删除内联按钮失败')
      return false
    }
  } else {
    ElMessage.warning('删除失败：数据不完整')
    return false
  }
}

// 表单相关
const formDialogVisible = ref(false)
const formDialogTitle = ref('添加内联按钮')

// 事件处理
const handleAdd = () => {
  formDialogVisible.value = true
  formDialogTitle.value = '添加内联按钮'

  // 重置表单（运营端固定为URL类型）
  const defaultValues = {
    menu_name: '',
    inner_type: 'url',
    inner_value: '',
    order_num: 0,
    status: 1
  }

  // 更新本地响应式数据
  Object.assign(formValues, defaultValues)

  // 设置表单值
  formMethods.setValues(defaultValues)
}

const handleEdit = (row: any) => {
  formDialogVisible.value = true
  formDialogTitle.value = '编辑内联按钮'

  // 运营端只支持URL类型
  const editValues = {
    id: row.id,
    menu_name: row.menu_name,
    order_num: row.order_num,
    status: row.status,
    inner_type: 'url',
    inner_value: row.inner_value || ''
  }

  // 更新本地响应式数据
  Object.assign(formValues, editValues)

  // 设置表单值
  formMethods.setValues(editValues)
}

const handleDelete = (row: any) => {
  if (searchTableRef.value) {
    searchTableRef.value.delete(row)
  }
}

const handleFormSubmit = async () => {
  try {
    const formRef = await getElFormExpose()

    // 使用Promise方式处理表单验证
    try {
      // 添加非空检查
      if (!formRef) {
        ElMessage.error('表单实例获取失败')
        return
      }

      await formRef.validate()

      // 校验通过后获取表单数据
      const values = await formMethods.getFormData()

      // 判断是添加还是更新
      if (values.id) {
        // 更新操作（运营端固定为URL类型）
        const updateParams: UpdateMenuParamsV1 = {
          id: values.id,
          menu_name: values.menu_name,
          menu_type: 2, // 固定为内联按钮
          order_num: values.order_num,
          status: values.status,
          inner_type: 'url',
          inner_value: values.inner_value
        }

        await v2UpdateMenu(updateParams)
        ElMessage.success('更新成功')
      } else {
        // 添加操作（运营端固定为URL类型）
        const addParams: AddMenuParamsV1 = {
          menu_name: values.menu_name,
          menu_type: 2, // 固定为内联按钮
          order_num: values.order_num,
          status: values.status,
          inner_type: 'url',
          inner_value: values.inner_value
        }

        await v2AddMenu(addParams)
        ElMessage.success('添加成功')
      }

      formDialogVisible.value = false

      // 刷新列表
      searchTableRef.value?.reload()
    } catch (validationError) {
      console.error('表单验证失败:', validationError)
      ElMessage.error('表单验证失败，请检查填写内容')
    }
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  }
}

// 运营端不需要监听inner_type变化，因为固定为URL类型
</script>

<style scoped>
.inline-button-container {
  min-height: 400px;
}
</style>
