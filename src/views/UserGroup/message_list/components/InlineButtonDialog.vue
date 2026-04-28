<template>
  <Dialog v-model="dialogVisible" title="内联按钮管理" width="1200px">
    <div class="inline-button-container">
      <!-- 添加按钮 -->
      <div class="mb-4">
        <ElButton type="success" @click="handleAdd">添加</ElButton>
      </div>

      <!-- 表格 -->
      <ElTable :data="tableData" border stripe v-loading="loading">
        <ElTableColumn
          prop="text"
          label="内联按钮名称"
          min-width="120"
          align="center"
          header-align="center"
        />
        <ElTableColumn
          prop="inner_value"
          label="内联内容"
          min-width="200"
          show-overflow-tooltip
          align="center"
          header-align="center"
        />
        <ElTableColumn
          prop="inner_type"
          label="分类"
          width="100"
          align="center"
          header-align="center"
        >
          <template #default="{ row }">
            <ElTag :type="row.inner_type === 'url' ? 'primary' : 'success'">
              {{ row.inner_type === 'url' ? 'URL链接' : '回调函数' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn
          prop="created_at"
          label="创建时间"
          width="180"
          align="center"
          header-align="center"
        >
          <template #default="{ row }">
            {{ formatTimestamp(row.created_at) }}
          </template>
        </ElTableColumn>
        <ElTableColumn
          prop="updated_at"
          label="更新时间"
          width="180"
          align="center"
          header-align="center"
        >
          <template #default="{ row }">
            {{ formatTimestamp(row.updated_at) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="180" fixed="right" align="center" header-align="center">
          <template #default="{ row }">
            <ElButton type="primary" size="small" @click="handleEdit(row)">编辑</ElButton>
            <ElButton type="danger" size="small" @click="handleDelete(row)">删除</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>

      <!-- 分页 - 左对齐 -->
      <div class="flex justify-start mt-4">
        <ElPagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>

      <!-- 表单弹窗 -->
      <Dialog v-model="formDialogVisible" :title="formDialogTitle" width="600px">
        <!-- 表单内容 -->
        <ElForm
          ref="formRef"
          :model="formData"
          :rules="formRules"
          label-width="120px"
          style="padding: 10px 0"
        >
          <ElFormItem label="内联按钮名称" prop="menu_name" style="margin-bottom: 18px">
            <ElInput v-model="formData.menu_name" placeholder="请输入内联按钮名称" />
          </ElFormItem>
          <ElFormItem label="内联类型" prop="inner_type" style="margin-bottom: 18px">
            <ElSelect
              v-model="formData.inner_type"
              placeholder="请选择内联类型"
              style="width: 100%"
            >
              <ElOption label="URL链接" value="url" />
              <ElOption label="回调函数" value="call" />
            </ElSelect>
          </ElFormItem>
          <ElFormItem
            :label="formData.inner_type === 'url' ? '链接地址' : '回调函数'"
            prop="inner_value"
            style="margin-bottom: 18px"
          >
            <ElSelect
              v-if="formData.inner_type === 'call'"
              v-model="formData.inner_value"
              placeholder="请选择回调函数"
              style="width: 100%"
            >
              <ElOption
                v-for="item in callbackList"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </ElSelect>
            <div v-else style="width: 100%">
              <ElInput v-model="formData.inner_value" placeholder="请输入链接地址" />
              <div style="margin-top: 4px; font-size: 12px; color: #999">
                例如：https://www.123456789.com
              </div>
            </div>
          </ElFormItem>
        </ElForm>
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
import { ref, reactive, watch, nextTick } from 'vue'
import {
  ElMessage,
  ElButton,
  ElTag,
  ElTable,
  ElTableColumn,
  ElPagination,
  ElMessageBox,
  ElForm,
  ElFormItem,
  ElInput,
  ElSelect,
  ElOption
} from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Dialog } from '@/components/Dialog'
import {
  v1GetInnerButtonList,
  v1CreateInnerButton,
  v1UpdateInnerButton,
  v1DeleteInnerButton,
  getCallBackListApi
} from '@/api/menu_list'
import type {
  CreateInnerButtonParams,
  InnerButtonItem,
  UpdateInnerButtonParams
} from '@/api/menu_list/types'

// Props
const props = defineProps<{
  modelValue: boolean
}>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  success: []
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
    // 弹窗打开时获取回调函数列表和数据
    fetchCallbackList()
    await nextTick()
    fetchData()
  }
})

// 表格数据
const tableData = ref<InnerButtonItem[]>([])
const allData = ref<InnerButtonItem[]>([])
const loading = ref(false)

// 分页
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 时间戳格式化函数
const formatTimestamp = (timestamp: number): string => {
  if (!timestamp) return '-'
  const date = new Date(timestamp * 1000) // 转换为毫秒
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// 回调函数列表
const callbackList = ref<Array<{ label: string; value: string }>>([])

// 表单相关
const formDialogVisible = ref(false)
const formDialogTitle = ref('添加内联按钮')
const formRef = ref<FormInstance>()

// 表单数据
const formData = reactive({
  id: undefined as number | undefined,
  menu_name: '',
  inner_type: 'url' as 'url' | 'call',
  inner_value: '',
  status: 1
})

// 表单验证规则
const formRules: FormRules = {
  menu_name: [{ required: true, message: '内联按钮名称不能为空', trigger: 'blur' }],
  inner_type: [{ required: true, message: '内联类型不能为空', trigger: 'change' }],
  inner_value: [
    { required: true, message: '该字段不能为空', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (formData.inner_type === 'url' && value) {
          // URL 验证
          const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/
          if (!urlPattern.test(value)) {
            callback(new Error('请输入有效的URL地址'))
          } else {
            callback()
          }
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  status: [{ required: true, message: '状态不能为空', trigger: 'change' }]
}

// 获取数据
const fetchData = async () => {
  loading.value = true
  try {
    const response = await v1GetInnerButtonList()
    if (response.code === '000000' && response.data) {
      allData.value = response.data || []
      applyPagination()
    } else {
      allData.value = []
      tableData.value = []
      pagination.total = 0
    }
  } catch (error) {
    console.error('获取内联按钮列表失败:', error)
    ElMessage.error('获取内联按钮列表失败')
    allData.value = []
    tableData.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

// 应用分页
const applyPagination = () => {
  // 更新总数
  pagination.total = allData.value.length

  // 分页
  const startIndex = (pagination.currentPage - 1) * pagination.pageSize
  const endIndex = startIndex + pagination.pageSize
  tableData.value = allData.value.slice(startIndex, endIndex)
}

// 分页变化
const handleSizeChange = () => {
  pagination.currentPage = 1
  applyPagination()
}

const handleCurrentChange = () => {
  applyPagination()
}

// 删除
const handleDelete = async (row: InnerButtonItem) => {
  try {
    await ElMessageBox.confirm('确定要删除这个内联按钮吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const res = await v1DeleteInnerButton(row.id)
    if (res.code === '000000') {
      ElMessage.success('删除成功')
      fetchData()
      emit('success')
    } else {
      ElMessage.error('删除失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除内联按钮失败')
    }
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

// 事件处理
const handleAdd = () => {
  formDialogVisible.value = true
  formDialogTitle.value = '添加内联按钮'
  // 重置表单
  Object.assign(formData, {
    id: undefined,
    menu_name: '',
    inner_type: 'url',
    inner_value: '',
    status: 1
  })
  formRef.value?.resetFields()
}
const handleEdit = (row: InnerButtonItem) => {
  formDialogVisible.value = true
  formDialogTitle.value = '编辑内联按钮'
  // 设置表单值
  Object.assign(formData, {
    id: row.id,
    menu_name: row.text,
    inner_type: row.inner_type,
    inner_value: row.inner_value || '',
    status: 1 // 默认启用，因为接口返回的数据没有 status 字段
  })
}
const handleFormSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    // 判断是添加还是更新
    if (formData.id) {
      // 更新操作
      const updateParams: UpdateInnerButtonParams = {
        id: formData.id,
        text: formData.menu_name,
        inner_type: formData.inner_type,
        inner_value: formData.inner_value,
        order_num: 0,
        status: formData.status
      }
      await v1UpdateInnerButton(updateParams)
      ElMessage.success('更新成功')
    } else {
      // 添加操作 - 使用新的创建接口
      const createParams: CreateInnerButtonParams = {
        text: formData.menu_name,
        inner_type: formData.inner_type,
        inner_value: formData.inner_value,
        order_num: 0,
        status: formData.status
      }
      await v1CreateInnerButton(createParams)
      ElMessage.success('添加成功')
    }
    formDialogVisible.value = false
    // 刷新列表
    fetchData()
    emit('success')
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('保存失败:', error)
      ElMessage.error('保存失败')
    }
  }
}
</script>
<style scoped>
.inline-button-container {
  min-height: 400px;
}
</style>
