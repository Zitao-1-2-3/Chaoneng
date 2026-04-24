<template>
  <Dialog v-model="dialogVisible" title="内联按钮管理" width="1200px">
    <div class="inline-button-container">
      <!-- 搜索表格 -->
      <SearchTable
        :columns="columns"
        :fetch-data-api="fetchMenuList"
        :fetch-del-api="deleteMenu"
        :action-column="actionColumn"
        :immediate="false"
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
import { ref, h, reactive, watch, nextTick } from 'vue'
import { ElMessage, ElButton, ElTag } from 'element-plus'
import { Dialog } from '@/components/Dialog'
import { SearchTable } from '@/components/SearchTable'
import { BaseButton } from '@/components/Button'
import { Form } from '@/components/Form'
import { useForm } from '@/hooks/web/useForm'
import type { TableColumn } from '@/components/Table'
import type { FormSchema } from '@/components/Form'
import {
  v1GetMenuList,
  v1AddMenu,
  v1UpdateMenu,
  deleteMenuApi,
  getCallBackListApi
} from '@/api/menu_list'
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
watch(dialogVisible, async (val) => {
  emit('update:modelValue', val)
  if (val) {
    // 弹窗打开时获取回调函数列表
    fetchCallbackList()
    // 等待 DOM 更新后刷新内联按钮列表
    await nextTick()
    searchTableRef.value?.reload()
  }
})

// SearchTable引用
const searchTableRef = ref<InstanceType<typeof SearchTable> | null>(null)

// 回调函数列表
const callbackList = ref<Array<{ label: string; value: string }>>([])

// 添加formValues来跟踪表单值
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
    field: 'inner_type',
    component: 'Select' as const,
    label: '内联类型',
    value: 'url',
    componentProps: {
      options: [
        { label: 'URL链接', value: 'url' },
        { label: '回调函数', value: 'call' }
      ],
      placeholder: '请选择内联类型',
      onChange: async (value) => {
        formValues.inner_type = value
        await formMethods.setValues({
          inner_type: value,
          inner_value: '' // 切换类型时清空值
        })
      }
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
      remark: () => {
        if (formValues.inner_type === 'url') {
          return (
            <>
              <p>例如：https://www.123456789.com</p>
            </>
          )
        } else {
          return (
            <>
              <p>请选择回调函数</p>
            </>
          )
        }
      }
    },
    formItemProps: {
      rules: [
        {
          required: true,
          message: '该字段不能为空',
          validator: (_rule, value, callback) => {
            if (!value) {
              const errorMsg =
                formValues.inner_type === 'url' ? '链接地址不能为空' : '回调函数名称不能为空'
              callback(new Error(errorMsg))
            } else {
              callback()
            }
          }
        }
      ]
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

// API 封装
const fetchMenuList = async (params: any) => {
  try {
    const queryParams: MenuListParamsV1 = {
      current_page: Number(params.current_page) || 1,
      page_size: Number(params.page_size) || 10,
      menu_type: 2 // 固定为内联按钮类型
    }

    console.log('fetchMenuList 请求参数:', queryParams)
    const response = await v1GetMenuList(queryParams)
    console.log('fetchMenuList 响应数据:', response)

    if (response.code === '000000' && response.data) {
      const list = response.data.list || []
      const total = response.data.pager?.total || 0
      console.log('fetchMenuList 返回结果:', { list, total })
      return {
        list,
        total
      }
    }

    console.log('fetchMenuList 返回空数据')
    return { list: [], total: 0 }
  } catch (error) {
    console.error('获取内联按钮列表失败:', error)
    ElMessage.error('获取内联按钮列表失败')
    return { list: [], total: 0 }
  }
}

const deleteMenu = async (): Promise<boolean> => {
  const row = searchTableRef.value?.currentRow
  if (row && row.id) {
    try {
      const res = await deleteMenuApi(row.id)
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

// 获取回调函数列表
const fetchCallbackList = async () => {
  try {
    const response = await getCallBackListApi()
    if (response.code === '000000' && response.data) {
      callbackList.value = response.data.map((item: any) => ({
        label: item.name || item.callback_type,
        value: item.callback_type
      }))
    }
  } catch (error) {
    ElMessage.error('获取回调函数列表失败')
  }
}

// 表单相关
const formDialogVisible = ref(false)
const formDialogTitle = ref('添加内联按钮')

// 事件处理
const handleAdd = () => {
  formDialogVisible.value = true
  formDialogTitle.value = '添加内联按钮'

  // 重置表单
  const defaultValues = {
    menu_name: '',
    inner_type: 'url',
    inner_value: '',
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

  // 获取inner_type和相关值
  const innerType = row.inner_type

  // 根据inner_type决定使用哪个字段的值
  let innerValue = ''
  if (innerType === 'call') {
    // 如果是回调函数，使用callback_type字段
    innerValue = row.callback_type || row.inner_value || ''
  } else {
    // 如果是URL，使用inner_value字段
    innerValue = row.inner_value || ''
  }

  // 设置表单值
  const editValues = {
    id: row.id,
    menu_name: row.menu_name,
    status: row.status,
    inner_type: innerType,
    inner_value: innerValue
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
        // 更新操作
        const updateParams: UpdateMenuParamsV1 = {
          id: values.id,
          menu_name: values.menu_name,
          menu_type: 2, // 固定为内联按钮
          order_num: 0, // 默认排序为0
          status: values.status,
          inner_type: values.inner_type,
          inner_value: values.inner_value
        }

        // 如果是回调函数类型，添加callback_type字段
        if (values.inner_type === 'call') {
          updateParams.callback_type = values.inner_value
        }

        await v1UpdateMenu(updateParams)
        ElMessage.success('更新成功')
      } else {
        // 添加操作
        const addParams: AddMenuParamsV1 = {
          menu_name: values.menu_name,
          menu_type: 2, // 固定为内联按钮
          order_num: 0, // 默认排序为0
          status: values.status,
          inner_type: values.inner_type,
          inner_value: values.inner_value
        }

        // 如果是回调函数类型，添加callback_type字段
        if (values.inner_type === 'call') {
          addParams.callback_type = values.inner_value
        }

        await v1AddMenu(addParams)
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

// 监听inner_type变化，动态更新表单配置
watch(
  () => formValues.inner_type,
  () => {
    // 更新表单配置中的组件类型、label和placeholder
    formSchema.forEach((item) => {
      if (item.field === 'inner_value') {
        // 根据inner_type动态更新组件类型、label和placeholder
        if (formValues.inner_type === 'url') {
          item.component = 'Input' as const
          item.label = '链接地址'
          if (item.componentProps) {
            item.componentProps.placeholder = '请输入链接地址'
            delete item.componentProps.options // 移除options属性
          }
          if (item.formItemProps && item.formItemProps.rules && item.formItemProps.rules[0]) {
            item.formItemProps.rules[0].message = '链接地址不能为空'
          }
        } else if (formValues.inner_type === 'call') {
          item.component = 'Select' as const
          item.label = '回调函数'
          if (item.componentProps) {
            item.componentProps.placeholder = '请选择回调函数'
            item.componentProps.options = callbackList.value
          }
          if (item.formItemProps && item.formItemProps.rules && item.formItemProps.rules[0]) {
            item.formItemProps.rules[0].message = '回调函数不能为空'
          }
        }
      }
    })
  },
  { immediate: true }
)
</script>

<style scoped>
.inline-button-container {
  min-height: 400px;
}
</style>
