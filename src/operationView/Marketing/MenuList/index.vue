<template>
  <div class="app-container">
    <ContentWrap>
      <SearchTable
        :columns="columns"
        :fetch-data-api="fetchMenuList"
        :fetch-del-api="deleteMenu"
        :action-column="actionColumn"
        :table-props="{ pagination: undefined }"
        :search-schema="[]"
        :search-props="{ showSearch: false }"
        :immediate="true"
        @loaded="handleDataLoaded"
        ref="searchTableRef"
        @add="handleAdd"
      >
        <!-- 在工具栏左侧添加刷新按钮 -->
        <template #leftToolbar>
          <BaseButton @click="handleRefresh">刷新</BaseButton>
        </template>
        <!-- 在工具栏右侧添加预览按钮 -->
        <template #rightToolbar>
          <BaseButton type="primary" @click="handlePreview">点我预览</BaseButton>
        </template>
      </SearchTable>

      <!-- 表单弹窗 -->
      <Dialog v-model="dialogVisible" :title="dialogTitle">
        <!-- 表单内容 -->
        <Form ref="formRef" :schema="formSchema" @register="formRegister" />
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
import { ref, onMounted, h, reactive, nextTick } from 'vue'
import { ElButton, ElTag, ElMessage, ElSwitch } from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import { Dialog } from '@/components/Dialog'
import { SearchTable } from '@/components/SearchTable'
import { BaseButton } from '@/components/Button'
import { Form } from '@/components/Form'
import { useForm } from '@/hooks/web/useForm'
import type { TableColumn } from '@/components/Table'
import type { FormSchema } from '@/components/Form'
import { getBotMenuList, addBotMenu, deleteBotMenu, batchUpdateBotMenu } from '@/api/menu_list'
import type {
  GetBotMenuListParams,
  AddBotMenuParams,
  BatchUpdateBotMenuParams
} from '@/api/menu_list/types'
import {
  handleListMessage,
  handleErrorMessage,
  handleSuccessMessage,
  handleWarningMessage,
  handleDataFormatError
} from '@/utils/messageHelper'
import { useValidator } from '@/hooks/web/useValidator'
import MenuPreview from './components/MenuPreview.vue'
import { formatToDateTime } from '@/utils/dateUtil'

const { required } = useValidator()
const searchTableRef = ref<InstanceType<typeof SearchTable> | null>(null)
const previewVisible = ref(false)
const { formRegister, formMethods } = useForm()
const { getElFormExpose } = formMethods

const isLoaded = ref(false)

// 回调函数列表（新接口不需要，保留变量以避免错误）
const callbackList = ref<Array<{ label: string; value: string }>>([])

// 添加formValues来跟踪表单值（简化版）
const formValues = reactive<{
  menu_name: string
  order_num: number
  status: number
}>({
  menu_name: '',
  order_num: 0,
  status: 1 // 默认启用
})

// 表单配置（新接口只需要 menu_name, order_num, status）
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
      placeholder: '请输入排序（数字越小越靠前）',
      min: 0
    },
    formItemProps: {
      rules: required('排序不能为空')
    }
  },
  {
    field: 'status',
    component: 'Select' as const,
    label: '状态',
    value: 1,
    componentProps: {
      options: [
        { label: '启用', value: 1 },
        { label: '禁用', value: 2 }
      ],
      placeholder: '请选择状态'
    },
    formItemProps: {
      rules: required('状态不能为空')
    }
  }
])

// 表格列配置（简化版，只显示基本信息）
const columns: TableColumn[] = [
  {
    field: 'menu_name',
    label: '菜单名称',
    slots: {
      default: (data: any) => {
        return h(
          'span',
          {
            style: { color: '#333', fontWeight: '500' }
          },
          data.row.menu_name
        )
      }
    }
  },
  {
    field: 'order_num',
    label: '排序',
    width: 100,
    slots: {
      default: (data: any) => {
        return h(
          ElTag,
          {
            type: 'info',
            size: 'small'
          },
          () => data.row.order_num
        )
      }
    }
  },
  {
    field: 'status',
    label: '状态',
    width: 100,
    slots: {
      default: (data: any) => {
        return (
          <ElSwitch
            v-model={data.row.status}
            activeValue={1}
            inactiveValue={2}
            onChange={() => handleStatusChange(data.row)}
          />
        )
      }
    }
  },
  {
    field: 'created_at',
    label: '创建时间',
    width: 180,
    sortable: 'custom',
    formatter: (row: any) => {
      return formatToDateTime(row.created_at)
    }
  },
  {
    field: 'updated_at',
    label: '更新时间',
    width: 180,
    sortable: 'custom',
    formatter: (row: any) => {
      return formatToDateTime(row.updated_at)
    }
  }
]

// 操作列配置
const actionColumn = {
  field: 'action',
  label: '操作',
  width: 240,
  fixed: 'right',
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
    const queryParams: GetBotMenuListParams = {
      bot_id: params.bot_id || 0, // 从参数获取 bot_id，默认为 0
      status: params.status || undefined
    }

    const response = await getBotMenuList(queryParams)

    if (response.code === '000000' && response.data) {
      // 新接口返回简单数组，不是分页对象
      const list = Array.isArray(response.data) ? response.data : []

      // 按 order_num 从大到小排序
      list.sort((a, b) => b.order_num - a.order_num)
      const hasSearchCondition = !!(params.menu_name || params.status)
      handleListMessage(list, hasSearchCondition, '菜单')

      return {
        list,
        totalCount: list.length // 简单数组，总数就是数组长度
      }
    }

    handleDataFormatError('菜单列表')
    return { list: [], totalCount: 0 }
  } catch (error) {
    handleErrorMessage(error, '获取菜单列表失败')
    return { list: [], totalCount: 0 }
  }
}

const deleteMenu = async (): Promise<boolean> => {
  const row = searchTableRef.value?.currentRow
  if (row && row.id) {
    try {
      const res = await deleteBotMenu(row.id)
      if (res.code === '000000') {
        handleSuccessMessage('删除成功')
        return true
      }
      handleErrorMessage((res as any).msg || '删除失败', '删除失败')
      return false
    } catch (error) {
      handleErrorMessage(error, '删除菜单失败')
      return false
    }
  } else {
    handleWarningMessage('删除失败：数据不完整')
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

  // 重置表单（使用新接口的字段）
  const defaultValues = {
    menu_name: '',
    order_num: 0,
    status: 1 // 默认启用
  }

  // 更新本地响应式数据
  Object.assign(formValues, defaultValues)

  // 设置表单值
  formMethods.setValues(defaultValues)
}

const handleEdit = (row: any) => {
  dialogVisible.value = true
  dialogTitle.value = '编辑菜单'

  // 设置表单值（使用新接口的字段）
  const editValues = {
    id: row.id,
    menu_name: row.menu_name,
    order_num: row.order_num,
    status: row.status
  }

  // 更新本地响应式数据
  Object.assign(formValues, editValues)

  // 设置表单值
  formMethods.setValues(editValues)
}

const handlePreview = () => {
  previewVisible.value = true
}

const handleRefresh = () => {
  searchTableRef.value?.reload()
  ElMessage.success('刷新成功')
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

      // 排序号重复校验：与当前列表中除自身外的菜单比对
      const currentList: any[] = searchTableRef.value?.tableState?.dataList?.value || []
      const duplicated = currentList.find(
        (item) =>
          Number(item.order_num) === Number(values.order_num) &&
          (!values.id || item.id !== values.id)
      )
      if (duplicated) {
        ElMessage.warning(`排序号 ${values.order_num} 已被「${duplicated.menu_name}」占用，请更换`)
        return
      }

      // 判断是添加还是更新
      if (values.id) {
        // 更新操作 - 使用批量更新接口
        const updateParams: BatchUpdateBotMenuParams = {
          bot_id: 0, // 运营端默认 bot_id 为 0
          menus: [
            {
              id: values.id,
              menu_name: values.menu_name,
              order_num: values.order_num,
              status: values.status
            }
          ]
        }

        await batchUpdateBotMenu(updateParams)
        ElMessage.success('更新成功')
      } else {
        // 添加操作 - 使用新接口 addBotMenu
        const addParams: AddBotMenuParams = {
          menu_name: values.menu_name,
          order_num: values.order_num,
          status: values.status
        }

        await addBotMenu(addParams)
        ElMessage.success('添加成功')
      }

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

// 获取回调函数列表（新接口不需要）
const fetchCallbackList = async () => {
  // 新接口已简化，不需要回调函数列表
  callbackList.value = []
}

// 弹窗相关
const dialogVisible = ref(false)
const dialogTitle = ref('添加菜单')

const previewHandleClose = () => {
  previewVisible.value = false
  searchTableRef.value?.reload()
}

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

// 状态切换处理函数
const handleStatusChange = async (row: any) => {
  if (!isLoaded.value) return

  try {
    // 使用批量更新接口更新单个菜单的状态
    const updateParams: BatchUpdateBotMenuParams = {
      bot_id: 0, // 运营端默认 bot_id 为 0
      menus: [
        {
          id: row.id,
          menu_name: row.menu_name,
          order_num: row.order_num,
          status: row.status
        }
      ]
    }

    await batchUpdateBotMenu(updateParams)
    ElMessage.success('状态更新成功')

    // 刷新列表
    searchTableRef.value?.reload()
  } catch (error) {
    console.error('状态更新失败:', error)
    ElMessage.error('状态更新失败')

    // 恢复原状态
    row.status = row.status === 0 ? 1 : 0
  }
}

onMounted(async () => {
  // 获取回调函数列表
  await fetchCallbackList()
})
</script>

<style scoped>
/* 移除菜单预览相关样式 */
</style>
