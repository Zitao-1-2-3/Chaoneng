<template>
  <div class="app-container">
    <ContentWrap>
      <!-- 使用 SearchTable 组件 -->
      <SearchTable
        ref="searchTableRef"
        :columns="columns"
        :search-schema="searchSchema"
        :fetch-data-api="fetchData"
        :table-props="{ rowKey: 'id' }"
        @add="handleAdd"
      >
        <!-- 搜索按钮插槽 -->
        <template #searchButtons>
          <ElButton type="success" @click="handleBatchImport">
            <Icon icon="ep:upload" class="mr-5px" />
            批量导入
          </ElButton>
          <!-- 添加导出模版按钮 -->
          <ElButton type="primary" plain @click="handleExportTemplate">
            <Icon icon="ep:download" class="mr-5px" />
            下载模版
          </ElButton>
        </template>
        <!-- 工具栏插槽 -->
        <template #toolbar>
          <ElButton type="primary" @click="handleAdd">
            <Icon icon="ep:plus" class="mr-5px" />
            新增地址
          </ElButton>
        </template>

        <!-- 操作列内容通过 columns formatter 定义 -->
      </SearchTable>
      <Dialog v-model="addDialogVisible" title="新增地址" width="500px" max-height="300px">
        <Form :schema="addFormSchema" @register="addFormRegister" label-position="top" />
        <template #footer>
          <div class="flex justify-end">
            <ElButton @click="addDialogVisible = false">取消</ElButton>
            <ElButton type="primary" @click="submitAddAddresses" :loading="submitting"
              >确定</ElButton
            >
          </div>
        </template>
      </Dialog>

      <!-- 批量导入弹窗 (保持不变) -->
      <Dialog v-model="batchImportVisible" title="批量导入地址" width="500px" max-height="200px">
        <Form :schema="importFormSchema" @register="importFormRegister" />
        <template #footer>
          <div class="flex justify-end">
            <ElButton @click="batchImportVisible = false">取消</ElButton>
            <ElButton type="primary" @click="submitBatchImport" :loading="submitting"
              >确定</ElButton
            >
          </div>
        </template>
      </Dialog>

      <!-- 绑定代理弹窗 (重新添加) -->
      <Dialog
        v-model="bindDialogVisible"
        title="绑定代理"
        width="500px"
        max-height="300px"
        @open="getAgentList"
      >
        <Form :schema="bindFormSchema" @register="bindFormRegister" :isCol="true" />
        <template #footer>
          <div class="flex justify-end">
            <ElButton @click="bindDialogVisible = false">取消</ElButton>
            <ElButton type="primary" @click="submitBindAgent" :loading="submitting">确定</ElButton>
          </div>
        </template>
      </Dialog>
    </ContentWrap>
  </div>
</template>

<script setup lang="tsx">
import { ref, reactive, nextTick } from 'vue'
import {
  ElButton,
  ElMessageBox,
  ElMessage,
  ElTag // 重新导入，用于显示状态
} from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import { Icon } from '@/components/Icon'
import { Dialog } from '@/components/Dialog'
import { Form, FormSchema } from '@/components/Form' // 移除 UploadFile
// import { Search } from '@/components/Search' // 移除
import { useForm } from '@/hooks/web/useForm'
// import { useSearch } from '@/hooks/web/useSearch' // 移除
import { formatToDateTime } from '@/utils/dateUtil'
// import TrxAddressForm from './components/TrxAddressForm.vue' // Commented out
import { BaseButton } from '@/components/Button'
import { SearchTable } from '@/components/SearchTable' // 引入
import type { TableColumn } from '@/components/Table' // 引入
import { downloadByData, downloadByBase64 } from '@/utils/download' // Revert import path

import {
  v2GetAddressList, // 新接口 - 获取列表
  v2CreateAddress, // 新接口 - 创建地址
  v2UpdateAddress, // 新接口 - 更新地址（绑定/解绑）
  v2DeleteAddress, // 新接口 - 删除地址
  v2GetUnboundAgents, // 新接口 - 获取未绑定的代理列表
  v2ExportAddressModule, // 新接口 - 导出模版
  v2BatchImportAddress // 新接口 - 批量导入
} from '@/api/marketing/trx_address'
import { handleListMessage, handleErrorMessage, handleSuccessMessage } from '@/utils/messageHelper'

// Separate imports for clarity

// 表格和表单引用
const searchTableRef = ref<InstanceType<typeof SearchTable> | null>(null) // SearchTable 引用
const submitting = ref(false)
const batchImportVisible = ref(false)
const addDialogVisible = ref(false) // 新增弹窗
const bindDialogVisible = ref(false) // 绑定弹窗
const currentBindAddress = ref<any>(null) // 当前操作地址 (用于绑定/解绑)
const agentList = ref<Array<{ label: string; value: number | string }>>([])

// 使用表单Hook - 导入表单
const { formRegister: importFormRegister, formMethods: importFormMethods } = useForm()

// 使用表单Hook - 新增表单
const { formRegister: addFormRegister, formMethods: addFormMethods } = useForm()

// 使用表单Hook - 绑定代理表单
const { formRegister: bindFormRegister, formMethods: bindFormMethods } = useForm()

// 表格列配置 - 根据新接口 v2 的响应字段调整
const columns = ref<TableColumn[]>([
  {
    field: 'address',
    label: 'TRX收款地址',
    minWidth: '240px'
  },
  {
    field: 'agent_name',
    label: '代理信息',
    minWidth: '200px',
    formatter: (row) => {
      if (row.agent_name && row.email) {
        return `${row.agent_name} (${row.email})`
      }
      return row.agent_name || '-'
    }
  },
  {
    field: 'created_by',
    label: '创建人',
    width: '120px',
    formatter: (row) => row.created_by || '-'
  },
  {
    field: 'kind',
    label: '状态',
    width: '100px',
    formatter: (row) => {
      // 根据 agent_id 判断是否绑定
      const isBound = !!row.agent_id && row.agent_id > 0
      return isBound ? <ElTag type="success">已绑定</ElTag> : <ElTag type="info">未绑定</ElTag>
    }
  },
  {
    field: 'created_at',
    label: '创建时间',
    sortable: 'custom',
    width: '180px',
    formatter: (row) => formatToDateTime(row.created_at * 1000) // Unix时间戳转换
  },
  {
    field: 'updated_at',
    label: '修改时间',
    sortable: 'custom',
    width: '180px',
    formatter: (row) => formatToDateTime(row.updated_at * 1000) // Unix时间戳转换
  },
  // 操作列 - 暂时保留，但需要根据新接口调整逻辑
  {
    label: '操作',
    field: 'action',
    width: '200px',
    fixed: 'right',
    formatter: (row) => {
      // 新接口中没有明确的绑定状态字段，暂时根据 agent_id 判断
      const isBound = !!row.agent_id && row.agent_id > 0
      return (
        <>
          {isBound ? (
            <BaseButton type="warning" onClick={() => handleUnbind(row)}>
              解绑
            </BaseButton>
          ) : (
            <BaseButton type="success" onClick={() => handleBind(row)}>
              绑定
            </BaseButton>
          )}
          <BaseButton type="danger" onClick={() => handleDelete(row)}>
            删除
          </BaseButton>
        </>
      )
    }
  }
])

// 搜索项配置 - 移除状态下拉框，只保留关键字
const searchSchema = reactive<FormSchema[]>([
  {
    field: 'keyword',
    component: 'Input',
    label: '关键字',
    componentProps: {
      placeholder: 'TRX地址/代理信息',
      clearable: true
    }
  }
  // Removed status dropdown
])

// 数据获取函数，供 SearchTable 使用
const fetchData = async (params) => {
  try {
    // 处理关键字：如果包含括号，删除括号及后面的所有内容
    const processedParams = { ...params }
    if (processedParams.keyword) {
      // 删除括号及后面的内容，例如 "代理名称 (邮箱)" -> "代理名称"
      processedParams.keyword = processedParams.keyword.replace(/\s*[\(（].*$/g, '').trim()
    }

    // 处理排序参数
    if (params.order) {
      const fieldMapping: Record<string, string> = {
        created_at: 'created_at',
        updated_at: 'updated_at'
      }

      const orderParts = params.order.split(' ')
      if (orderParts.length === 2) {
        const [field, direction] = orderParts
        const mappedField = fieldMapping[field] || field
        processedParams.order = `${mappedField} ${direction}`
      }
    }

    // 使用新接口 v2GetAddressList，指定 kind: 1
    const res = await v2GetAddressList({ ...processedParams, kind: 1 })
    const data = res.data || {}

    // 新接口返回的数据结构：{ list: [...], pager: { current_page, page_size, total } }
    // SearchTable 需要的格式：{ list: [...], totalCount: number }
    return {
      list: data.list || [],
      totalCount: data.pager?.total || 0
    }
  } catch (error) {
    handleErrorMessage(error, '获取地址列表失败')
    return { list: [], totalCount: 0 }
  }
}

// --- Agent List Loading ---
const getAgentList = async () => {
  try {
    const res = await v2GetUnboundAgents()
    if (res && res.data && res.data.list) {
      agentList.value = res.data.list.map((agent: any) => ({
        label: `${agent.username} ${agent.email ? `(${agent.email})` : ''}`,
        value: agent.id
      }))
    } else {
      console.error('Failed to parse agent list from API response:', res)
      agentList.value = []
    }
  } catch (error) {
    handleErrorMessage(error, '获取代理列表失败')
    agentList.value = []
  }
}

// Call after definition
getAgentList()

// 刷新表格方法
const reloadTable = () => {
  searchTableRef.value?.reload() // 调用 SearchTable 的 reload
}

// 新增地址
const handleAdd = () => {
  addDialogVisible.value = true
  nextTick(() => {
    addFormMethods.setValues({ addresses: '' })
  })
}

// 批量导入按钮点击
const handleBatchImport = () => {
  batchImportVisible.value = true
  // 重置表单状态
  nextTick(() => {
    importFormMethods.setValues({ file: [] }) // 清空已上传文件列表
  })
}

// 提交批量导入
const importFormSchema = reactive<FormSchema[]>([
  {
    field: 'file',
    label: '选择文件',
    component: 'Upload',
    componentProps: {
      limit: 1,
      accept: '.xlsx,.xls',
      autoUpload: false,
      multiple: false,
      // 添加 onExceed 处理
      onExceed: () => {
        ElMessage.warning('只能上传一个文件')
      },
      // 添加 slots 以自定义按钮和提示
      slots: {
        default: () => <BaseButton type="primary">选择文件</BaseButton>,
        tip: () => (
          <div class="el-upload__tip text-red">
            只支持 .xlsx 或 .xls 格式的文件，不支持 .csv
            格式。请先下载模板，按照模板格式填写后上传。
          </div>
        )
      }
    },
    formItemProps: {
      rules: [{ required: true, message: '请选择上传文件', trigger: 'blur' }]
    },
    colProps: {
      span: 24
    }
  }
])
// 提交批量导入
const submitBatchImport = async () => {
  try {
    const formDataRaw = await importFormMethods.getFormData()
    const fileList = formDataRaw.file

    if (!fileList || fileList.length === 0) {
      ElMessage.warning('请先选择文件')
      return
    }

    const file = fileList[0]?.raw
    if (!file) {
      ElMessage.error('无法获取文件对象')
      return
    }

    // 验证文件格式
    const fileName = file.name
    const fileExtension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase()
    if (!['.xlsx', '.xls'].includes(fileExtension)) {
      ElMessage.error('只支持 .xlsx 或 .xls 格式的文件，不支持 .csv 格式')
      return
    }

    const formData = new FormData()
    formData.append('file', file) // 将文件添加到 FormData

    submitting.value = true
    await v2BatchImportAddress(formData)
    handleSuccessMessage('批量导入成功')
    batchImportVisible.value = false
    reloadTable()
  } catch (error: any) {
    console.error('批量导入失败:', error)
    // 检查是否有返回的错误文件
    if (error?.data instanceof Blob) {
      downloadByBase64(error.data, '批量导入失败.xlsx')
      ElMessage.error('批量导入失败，请查看下载的错误文件')
    } else {
      handleErrorMessage(error, '批量导入失败')
    }
  } finally {
    submitting.value = false
  }
}

// 绑定代理按钮点击
const handleBind = (row: any) => {
  currentBindAddress.value = row
  bindDialogVisible.value = true
  nextTick(() => {
    // Reset Select value to undefined for proper placeholder display
    bindFormMethods.setValues({ userId: undefined })
    bindFormMethods.setValues({ address: row.address })
  })
}

// 绑定代理表单配置
const bindFormSchema = reactive<FormSchema[]>([
  {
    field: 'address',
    component: 'Input',
    label: '当前地址:',
    componentProps: {
      disabled: true
    },
    colProps: {
      span: 24
    }
  },
  {
    field: 'userId',
    label: '所属代理：',
    component: 'Select',
    componentProps: {
      placeholder: '请选择所属代理',
      options: agentList, // <--- 绑定到 agentList ref
      filterable: true // 允许搜索
    },
    formItemProps: {
      rules: [{ required: true, message: '请选择所属代理', trigger: 'change' }] // Updated message
    },
    colProps: {
      span: 24
    }
  }
])

// 提交绑定代理
const submitBindAgent = async () => {
  try {
    const formData = await bindFormMethods.getFormData()
    const userId = formData.userId
    if (!userId) {
      ElMessage.error('请选择所属代理')
      return
    }

    submitting.value = true
    // 使用新接口 v2UpdateAddress 进行绑定
    const updateData = {
      address: currentBindAddress.value.address,
      agent_id: parseInt(userId, 10), // 绑定的代理ID
      bot_id: currentBindAddress.value.bot_id,
      created_at: currentBindAddress.value.created_at,
      created_by: currentBindAddress.value.created_by,
      id: currentBindAddress.value.id,
      kind: currentBindAddress.value.kind,
      updated_at: currentBindAddress.value.updated_at
    }

    console.log('=== 收款配置 - 绑定代理 ===')
    console.log('提交数据:', JSON.stringify(updateData, null, 2))

    await v2UpdateAddress(updateData)
    handleSuccessMessage('绑定成功')
    bindDialogVisible.value = false
    reloadTable()
  } catch (error) {
    handleErrorMessage(error, '绑定失败')
  } finally {
    submitting.value = false
  }
}

// 解绑代理按钮点击 - 使用新接口 v2UpdateAddress
const handleUnbind = async (row: any) => {
  // 新接口使用 agent_id 字段
  if (!row.agent_id) {
    ElMessage.error('无法获取当前绑定代理的ID')
    return
  }
  try {
    await ElMessageBox.confirm(`确认要解绑地址 ${row.address} 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    submitting.value = true
    // 使用新接口 v2UpdateAddress，将 agent_id 设为 0 表示解绑
    const updateData = {
      address: row.address,
      agent_id: 0, // 解绑时设为0
      bot_id: row.bot_id,
      created_at: row.created_at,
      created_by: row.created_by,
      id: row.id,
      kind: row.kind,
      updated_at: row.updated_at
    }

    console.log('=== 收款配置 - 解绑代理 ===')
    console.log('提交数据:', JSON.stringify(updateData, null, 2))

    await v2UpdateAddress(updateData)
    handleSuccessMessage('解绑成功')
    reloadTable()
  } catch (error) {
    if (error !== 'cancel') {
      handleErrorMessage(error, '解绑失败')
    }
  } finally {
    submitting.value = false
  }
}

// 删除地址
const handleDelete = async (row) => {
  // 判断是否已绑定代理
  const isBound = !!row.agent_id && row.agent_id > 0
  if (isBound) {
    ElMessage.warning('该地址已绑定代理，无法删除。请先解绑后再删除。')
    return
  }

  try {
    await ElMessageBox.confirm(`确认要删除地址 ${row.address} 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await v2DeleteAddress({ list: [row.address] })
    handleSuccessMessage('删除成功')
    reloadTable()
  } catch (error) {
    if (error !== 'cancel') {
      handleErrorMessage(error, '删除失败')
    }
  }
}

// 批量删除功能已注释
// const handleBatchDelete = async () => { ... }

// --- 新增地址逻辑 ---
const addFormSchema = reactive<FormSchema[]>([
  {
    field: 'addresses',
    label: 'TRX地址:',
    component: 'Input',
    componentProps: {
      type: 'textarea',
      rows: 10,
      placeholder: '请输入TRX地址，每行一个'
    },
    formItemProps: {
      rules: [{ required: true, message: '地址不能为空', trigger: 'blur' }]
    },
    // 添加 colProps 使其占满整行
    colProps: {
      span: 24
    }
  }
])

const submitAddAddresses = async () => {
  try {
    const formData = await addFormMethods.getFormData()
    if (!formData.addresses) {
      ElMessage.warning('请输入地址')
      return
    }
    const addressList = formData.addresses
      .split(/[\n\r]+/)
      .filter((addr: string) => addr.trim() !== '')
    if (addressList.length === 0) {
      ElMessage.warning('未输入有效地址')
      return
    }

    submitting.value = true
    await v2CreateAddress({ kind: 1, list: addressList })
    handleSuccessMessage('新增成功')
    addDialogVisible.value = false
    reloadTable()
  } catch (error: any) {
    console.log('新增地址错误:', error)
    // 检查错误码，000007 表示地址重复
    const errorCode = error?.code
    const errorMsg = error?.msg || error?.message || ''
    console.log('错误信息:', errorMsg)
    console.log('错误码:', errorCode)

    if (errorCode === '000007') {
      ElMessage.error('地址重复，请检查后重新输入')
    } else if (errorMsg) {
      // 如果有具体错误信息，直接显示
      ElMessage.error(errorMsg)
    } else {
      ElMessage.error('新增地址失败')
    }
  } finally {
    submitting.value = false
  }
}

// --- 导出模版处理函数 ---
const handleExportTemplate = async () => {
  try {
    const res = await v2ExportAddressModule()
    // 使用下载工具处理 blob 数据
    if (res.data instanceof Blob) {
      downloadByData(res.data, '地址导入模版.xlsx')
      handleSuccessMessage('模版下载成功')
    } else {
      ElMessage.error('文件数据格式错误')
    }
  } catch (error) {
    handleErrorMessage(error, '模版下载失败')
  }
}
</script>
