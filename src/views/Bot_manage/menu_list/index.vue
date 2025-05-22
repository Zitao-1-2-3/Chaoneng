<template>
  <div class="app-container">
    <ContentWrap>
      <SearchTable
        :columns="columns"
        :search-schema="searchSchema"
        :fetch-data-api="fetchMenuList"
        :fetch-del-api="deleteMenu"
        :action-column="actionColumn"
        @loaded="handleDataLoaded"
        ref="searchTableRef"
        @add="handleAdd"
        @search="onSearch"
      >
        <!-- 自定义搜索按钮 -->
        <template #searchButtons>
          <BaseButton type="primary" @click="handlePreview">点我预览</BaseButton>
        </template>
      </SearchTable>

      <!-- 表单弹窗 -->
      <Dialog v-model="dialogVisible" :title="dialogTitle">
        <!-- 表单内容 -->
        <Form
          ref="formRef"
          :schema="formSchema"
          @register="formRegister"
          @validate="formValidate"
        />
        <template #footer>
          <div class="flex justify-end">
            <ElButton @click="dialogVisible = false">取消</ElButton>
            <ElButton type="primary" @click="handleSubmit">提交</ElButton>
          </div>
        </template>
      </Dialog>

      <!-- 使用菜单预览组件 -->
      <MenuPreview v-model="previewVisible" @update:modelValue="previewHandleClose" />
    </ContentWrap>
  </div>
</template>

<script setup lang="tsx">
import { ref, onMounted, h, computed, watch, reactive, nextTick } from 'vue'
import {
  ElButton,
  ElLink,
  ElTag,
  ElMessage,
  ElMessageBox,
  ElSwitch,
  ElRow,
  ElCol,
  ElInput,
  FormItemProp
} from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import { Dialog } from '@/components/Dialog'
import { SearchTable } from '@/components/SearchTable'
import { BaseButton } from '@/components/Button'
import { Form } from '@/components/Form'
import { useForm } from '@/hooks/web/useForm'
import { useI18n } from '@/hooks/web/useI18n'
import type { TableColumn } from '@/components/Table'
import type { FormSchema } from '@/components/Form'
import { getMenuListApi, deleteMenuApi, saveMenuApi } from '@/api/menu_list'
import { MenuItem } from '@/api/menu_list/types'
import { useValidator } from '@/hooks/web/useValidator'
import MenuPreview from './components/MenuPreview.vue'
import { formatToDateTime } from '@/utils/dateUtil'

const { t } = useI18n()
const { required } = useValidator()
const searchTableRef = ref<InstanceType<typeof SearchTable> | null>(null)
const previewVisible = ref(false)
const { formRegister, formMethods } = useForm()
const { getElFormExpose } = formMethods

// 控制按钮类型相关表单项显示 - 转换为计算属性
const isUrlType = computed(() => formValues.inner_type === 'url')

const isLoaded = ref(false)

// 添加formValues来跟踪表单值
const formValues = reactive<{
  menu_type: number
  inner_type: string
  inner_value: string
  [key: string]: any
}>({
  menu_type: 1,
  inner_type: '',
  inner_value: ''
})

// 表单配置
const formSchema = reactive<FormSchema[]>([
  {
    field: 'menu_name',
    component: 'Input' as const,
    label: '菜单名称',
    componentProps: {
      placeholder: '请输入菜单名称'
    },
    formItemProps: {
      rules: required('菜单名称不能为空')
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
    value: 2,
    componentProps: {
      activeValue: 1,
      inactiveValue: 2
    },
    formItemProps: {
      rules: required('状态不能为空')
    }
  },
  {
    field: 'menu_type',
    component: 'Select' as const,
    label: '菜单类型',
    componentProps: {
      options: [
        { label: '菜单', value: 1 },
        { label: '内联按钮', value: 2 }
      ],
      placeholder: '请选择菜单类型',
      onChange: async (value) => {
        formValues.menu_type = value
        await formMethods.setValues({
          menu_type: value,
          inner_value: ''
        })
      }
    },
    formItemProps: {
      rules: required('菜单类型不能为空')
    }
  },
  {
    field: 'inner_type',
    component: 'Select' as const,
    label: '内联类型',
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
      // 动态规则：只有当菜单类型为内联按钮(2)时才需要验证
      rules: [
        {
          required: true,
          message: '内联类型不能为空',
          validator: (rule, value, callback) => {
            if (formValues.menu_type === 2 && !value) {
              callback(new Error('内联类型不能为空'))
            } else {
              callback()
            }
          }
        }
      ]
    }
  },
  {
    field: 'inner_value',
    component: 'Input' as const,
    label: '链接地址',
    componentProps: {
      placeholder: '请输入链接地址',
      remark: () => {
        if (isUrlType.value) {
          return (
            <>
              <p>例如：https://www.123456789.com</p>
            </>
          )
        } else {
          return (
            <>
              <p>例如：callbackName</p>
            </>
          )
        }
      }
    },
    formItemProps: {
      // 动态规则：只有当菜单类型为内联按钮(2)时才需要验证
      rules: [
        {
          required: true,
          message: '该字段不能为空',
          validator: (rule, value, callback) => {
            if (formValues.menu_type === 2 && !value) {
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
  }
])

// 表格列配置
const columns: TableColumn[] = [
  {
    field: 'menu_name',
    label: '菜单名称',
    slots: {
      default: (data: any) => {
        return h(
          'span',
          {
            style: { color: '#333' }
          },
          data.row.menu_name
        )
      }
    }
  },
  {
    field: 'menu_type',
    label: '类型',
    slots: {
      default: (data: any) => {
        const typeMap = {
          1: { label: '菜单', type: 'success' },
          2: { label: '内联按钮', type: 'primary' }
        }
        const type = typeMap[data.row.menu_type] || { label: '-', type: 'info' }
        return h(
          ElTag,
          {
            type: type.type
          },
          () => type.label
        )
      }
    }
  },
  // {
  //   field: 'inner_type',
  //   label: '内联类型',
  //   slots: {
  //     default: (data: any) => {
  //       if (data.row.menu_type !== 2) {
  //         return h('span', {}, '-')
  //       }

  //       const typeMap = {
  //         url: { label: 'URL链接', type: 'warning' },
  //         call: { label: '回调函数', type: 'info' }
  //       }
  //       const type = typeMap[data.row.inner_type] || { label: '-', type: 'info' }
  //       return h(
  //         ElTag,
  //         {
  //           type: type.type
  //         },
  //         () => type.label
  //       )
  //     }
  //   }
  // },
  {
    field: 'other',
    label: '其他'
    // formatter: (row: any) => {
    //   if (row.menu_type === 2) {
    //     return row.inner_value || '-'
    //   }
    //   return '-'
    // }
  },
  { field: 'order_num', label: '排序' },
  {
    field: 'status',
    label: '状态',
    slots: {
      default: (data: any) => {
        return (
          <>
            <ElSwitch
              v-model={data.row.status}
              activeValue={1}
              inactiveValue={2}
              onChange={() => handleStatusChange(data.row)}
            />
          </>
        )
      }
    }
  },
  {
    field: 'create_time',
    label: '创建时间',
    formatter: (row: any) => {
      return formatToDateTime(row.create_time)
    }
  },
  {
    field: 'update_time',
    label: '更新时间',
    formatter: (row: any) => {
      return formatToDateTime(row.update_time)
    }
  }
]

// 操作列配置
const actionColumn = {
  field: 'action',
  label: '操作',
  width: 240,
  slots: {
    default: (data: any) => {
      const row = data.row
      return (
        <>
          <BaseButton type="primary" onClick={() => handleEdit(row)}>
            编辑
          </BaseButton>
          <BaseButton type="danger" v-show={false} onClick={() => handleDelete(row)}>
            删除
          </BaseButton>
        </>
      )
    }
  }
}

// 搜索表单配置
const searchSchema = [
  {
    field: 'menu_name',
    component: 'Input' as const,
    label: '菜单名称',
    componentProps: {
      placeholder: '请输入菜单名称'
    }
  },
  {
    field: 'menu_type',
    component: 'Select' as const,
    label: '类型',
    componentProps: {
      options: [
        { label: '全部', value: '' },
        { label: '菜单', value: 1 },
        { label: '内联按钮', value: 2 }
      ],
      placeholder: '请选择菜单类型'
    }
  }
]

// API 封装
const fetchMenuList = async (params: any) => {
  try {
    const response = await getMenuListApi(params)
    return response.data
  } catch (error) {
    console.error('获取菜单列表失败:', error)
    return { list: [], totalCount: 0 }
  }
}

// 修改deleteMenu函数签名以满足接口要求
const deleteMenu = async () => {
  // 获取当前选中行数据
  const row = searchTableRef.value?.currentRow
  if (row && row.id) {
    try {
      // 直接调用API删除菜单
      const res = await deleteMenuApi(row.id)
      // 返回删除操作的结果，useTable会根据此结果显示成功消息并刷新列表
      return res
    } catch (error) {
      console.error('删除菜单失败:', error)
      ElMessage.error('删除失败')
      return false
    }
  } else {
    console.error('当前选中行不存在或ID为空')
    ElMessage.error('删除失败：数据不完整')
    return false
  }
}

// 处理删除按钮点击
const handleDelete = (row: any) => {
  // 直接调用tableMethods.delList方法
  if (searchTableRef.value) {
    // 使用useSearchTable的handleDelete方法设置currentRow并调用delList
    searchTableRef.value.delete(row)
  }
}

// 事件处理函数
const handleAdd = () => {
  dialogVisible.value = true
  dialogTitle.value = '添加菜单'

  // 重置表单
  const defaultValues = {
    menu_name: '',
    menu_type: 1,
    inner_type: '',
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
  dialogVisible.value = true
  dialogTitle.value = '编辑菜单'

  // 获取inner_type和相关值
  const innerType = row.inner_type

  // 设置表单值
  const editValues = {
    id: row.id,
    menu_name: row.menu_name,
    menu_type: row.menu_type,
    order_num: row.order_num,
    status: row.status,
    inner_type: innerType,
    inner_value: row.inner_value || '' // 统一使用inner_value字段
  }

  // 更新本地响应式数据
  Object.assign(formValues, editValues)

  // 设置表单值
  formMethods.setValues(editValues)
}

const handlePreview = () => {
  previewVisible.value = true
}

const formValidate = (prop: FormItemProp, isValid: boolean, message: string) => {
  console.log(prop, isValid, message)
}

const handleSubmit = async () => {
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

      // 调用保存API
      await saveMenuApi(values)

      ElMessage.success(values.id ? '更新成功' : '添加成功')
      dialogVisible.value = false

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

const onSearch = (params: any) => {
  console.log('搜索参数:', params)
}

// 弹窗相关
const dialogVisible = ref(false)
const dialogTitle = ref('添加菜单')

const previewHandleClose = () => {
  previewVisible.value = false
  searchTableRef.value?.reload()
}

// 监听状态变化
watch(
  [() => formValues.menu_type, () => formValues.inner_type],
  () => {
    // 更新表单配置中的disabled和hidden属性
    formSchema.forEach((item) => {
      if (item.field === 'inner_type') {
        item.hidden = formValues.menu_type !== 2
      } else if (item.field === 'inner_value') {
        item.hidden = formValues.menu_type !== 2

        // 根据inner_type动态更新label和placeholder
        if (formValues.inner_type === 'url') {
          item.label = '链接地址'
          if (item.componentProps) {
            item.componentProps.placeholder = '请输入链接地址'
          }
          if (item.formItemProps && item.formItemProps.rules && item.formItemProps.rules[0]) {
            item.formItemProps.rules[0].message = '链接地址不能为空'
          }
        } else {
          item.label = '回调函数名称'
          if (item.componentProps) {
            item.componentProps.placeholder = '请输入回调函数名称'
          }
          if (item.formItemProps && item.formItemProps.rules && item.formItemProps.rules[0]) {
            item.formItemProps.rules[0].message = '回调函数名称不能为空'
          }
        }
      }
    })
  },
  { immediate: true }
)

// 数据加载完成回调
const handleDataLoaded = ({ data, total, success }) => {
  console.log('数据加载完成:', {
    总条数: total,
    成功: success,
    数据: data,
    条数: data?.length || 0
  })
  nextTick(() => {
    isLoaded.value = true
  })
  if (data?.length === 0 && success) {
    ElMessage.info('未查询到符合条件的数据')
  }
}
// 状态切换
const handleStatusChange = async (value) => {
  if (!isLoaded.value) return
  console.log('状态切换:', value)
  // 调用API更新状态
  const res = await saveMenuApi(value)
  if (res.code === '000000') {
    ElMessage.success('状态更新成功')
  } else {
    ElMessage.error('状态更新失败')
  }
  console.log('状态切换结果:', res)
}

onMounted(() => {
  // 组件加载后自动调用首次查询
  searchTableRef.value?.reload()
})
</script>

<style scoped>
/* 移除菜单预览相关样式 */
</style>
