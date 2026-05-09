<template>
  <div class="app-container">
    <ContentWrap>
      <!-- 使用 SearchTable 组件 -->
      <SearchTable
        :columns="columns"
        :search-schema="searchSchema"
        :fetch-data-api="getResourcePoolData"
        @add="handleAdd"
        :table-props="{ rowKey: 'id' }"
        ref="searchTableRef"
      >
        <!-- 工具栏插槽 -->
        <template #toolbar>
          <ElButton v-hasPermi="'ResourcePool.add'" type="primary" @click="handleAdd">
            <Icon icon="ep:plus" class="mr-5px" />
            新增
          </ElButton>
          <!-- <ElButton type="danger" @click="handleBatchDelete">
            <Icon icon="ep:delete" class="mr-5px" />
            批量删除
          </ElButton> -->
        </template>
      </SearchTable>

      <!-- 表单弹窗 -->
      <ResourcePoolAccountForm ref="formRef" @success="handleSuccess" />
    </ContentWrap>
  </div>
</template>

<script setup lang="tsx">
import { ref, reactive, onActivated } from 'vue'
import { ElButton, ElMessageBox, ElMessage, ElSelect, ElOption } from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import { Icon } from '@/components/Icon'
import { FormSchema } from '@/components/Form'
import { formatToDateTime } from '@/utils/dateUtil'
import ResourcePoolAccountForm from './components/ResourcePoolAccountForm.vue'
import { SearchTable } from '@/components/SearchTable'
import type { TableColumn } from '@/components/Table'
import {
  deleteResourcePoolAccountApi,
  batchDeleteResourcePoolAccountApi,
  v2GetPoolList,
  v2UpdatePool
} from '@/api/system/resource_pool_account'
import { isPermission } from '@/utils/is'
import { handleListMessage, handleErrorMessage, handleSuccessMessage } from '@/utils/messageHelper'
const formRef = ref()
const searchTableRef = ref()

const resourceTypeMap = {
  1: 'TRX池子',
  2: 'USDT池子',
  3: '能量池子',
  4: '带宽池子',
  5: '激活池子'
}

const columns = ref<TableColumn[]>([
  {
    field: 'kind',
    label: '配置类型',
    width: '120px',
    formatter: (row) => {
      return resourceTypeMap[row.kind] || '未知类型'
    }
  },
  {
    field: 'address',
    label: '公钥',
    minWidth: '180px',
    formatter: (row) => row.address || '-'
  },
  {
    field: 'permission_name',
    label: '权限名称',
    minWidth: '180px',
    formatter: (row) => row.permission_name || '-'
  },
  {
    field: '',
    label: '可用数量/阈值',
    minWidth: '180px',
    formatter: (row) => {
      const amount = row.amount ?? '-'
      const limit = row.limit == 0 ? '-' : row.limit
      const displayValue = row.kind === 3 ? `${amount} / ${limit}` : `${amount}`

      if (row.kind === 3) {
        return (
          <span onDblclick={() => handleEditThreshold(row)} style={{ cursor: 'pointer' }}>
            {displayValue}
          </span>
        )
      } else {
        return <span>{displayValue}</span>
      }
    }
  },
  {
    field: 'created_by',
    label: '创建人',
    width: '120px',
    formatter: (row) => row.created_by || '-'
  },
  {
    field: 'status',
    label: '状态',
    width: '100px',
    slots: {
      default: ({ row }) => {
        const statusMap = { 1: '启用', 2: '禁用', 3: '备用' }
        const statusColors = {
          1: 'text-green-300 font-bold',
          2: 'text-red-300 font-bold',
          3: 'text-orange-300 font-bold'
        }
        const disableOthers = row.status === 1
        return (
          <ElSelect
            modelValue={row.status}
            onChange={(newValue) => handleStatusChangeAttempt(row, newValue)}
            placeholder="请选择"
            disabled={!isPermission('ResourcePool.edit')}
          >
            {{
              prefix: () => {
                return <span class={statusColors[row.status]}>{statusMap[row.status]}</span>
              },
              default: () => {
                return Object.entries(statusMap).map(([value, label]) => (
                  <ElOption
                    key={value}
                    label={label}
                    value={parseInt(value, 10)}
                    disabled={disableOthers && parseInt(value, 10) !== 1}
                  />
                ))
              }
            }}
          </ElSelect>
        )
      }
    }
  },
  {
    field: 'created_at',
    label: '创建时间',
    width: '180px',
    formatter: (row) => (row.created_at ? formatToDateTime(new Date(row.created_at * 1000)) : '-')
  },
  {
    field: 'updated_at',
    label: '更新时间',
    width: '180px',
    formatter: (row) => (row.updated_at ? formatToDateTime(new Date(row.updated_at * 1000)) : '-')
  }
])

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'kind',
    component: 'Select',
    label: '配置类型：',
    componentProps: {
      placeholder: '请选择配置类型',
      clearable: true,
      options: [
        { label: '全部', value: '' },
        { label: 'TRX池子', value: 1 },
        { label: 'USDT池子', value: 2 },
        { label: '能量池子', value: 3 },
        { label: '带宽池子', value: 4 },
        { label: '激活池子', value: 5 }
      ]
    }
  },
  {
    field: 'status',
    component: 'Select',
    label: '状态：',
    componentProps: {
      placeholder: '请选择状态',
      clearable: true,
      options: [
        { label: '全部', value: '' },
        { label: '启用', value: 1 },
        { label: '禁用', value: 2 }
      ]
    }
  }
])

const getResourcePoolData = async (params) => {
  try {
    const apiParams: any = {
      current_page: params.current_page || 1,
      page_size: params.page_size || 10
    }

    if (params.keyword) {
      apiParams.keyword = params.keyword
    }

    if (params.kind) {
      apiParams.kind = params.kind
    }

    if (params.status) {
      apiParams.status = params.status
    }

    const response: any = await v2GetPoolList(apiParams)

    if (response?.data) {
      const data = response.data
      const list = data.list || []
      const total = data.pager?.total || 0

      return {
        list: list,
        totalCount: total
      }
    } else {
      console.warn('API 返回格式异常', response)
      return { list: [], totalCount: 0 }
    }
  } catch (error) {
    handleErrorMessage(error, '获取列表失败')
    return { list: [], totalCount: 0 }
  }
}

const handleAdd = () => {
  formRef.value?.open({
    mode: 'add',
    data: {}
  })
}

const handleEdit = (row: any) => {
  const formData = {
    id: row.id,
    configType: row.kind,
    publicKey: row.address,
    privateKey: row.private_key,
    status: row.status
  }
  formRef.value?.open({
    mode: 'edit',
    data: formData
  })
}

const reloadTable = () => {
  searchTableRef.value?.reload()
}

const handleStatusChangeAttempt = async (row, newValue) => {
  const originalStatus = row.status
  const intendedStatus = newValue

  if (originalStatus === intendedStatus) {
    return
  }

  const statusMap = { 1: '启用', 2: '禁用', 3: '备用' }
  const actionText = statusMap[intendedStatus]
  let msg = `确认要将状态更改为 "${actionText}" 吗？`
  if (row.kind === 3) {
    msg = `确认要将状态更改为 "${actionText}" ${intendedStatus === 1 ? '(设为主账户)' : intendedStatus === 3 ? '(设为备用账户)' : ''} 吗？`
  }

  try {
    await ElMessageBox.confirm(msg, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await v2UpdatePool({
      id: row.id,
      status: intendedStatus,
      limit: parseFloat(row.limit) || 0
    })

    handleSuccessMessage(`状态已更新为 "${actionText}"`)
    reloadTable()
  } catch (error) {
    if (error === 'cancel') {
      ElMessage.info('操作已取消')
    } else {
      handleErrorMessage(error, '操作失败')
    }
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确认要删除该账户吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await deleteResourcePoolAccountApi({ id: row.id })

    ElMessage.success('删除成功')
    reloadTable()
  } catch (error) {
    if (error !== 'cancel') {
      handleErrorMessage(error, '删除失败')
    }
  }
}

const handleBatchDelete = async () => {
  const elTableRef = await searchTableRef.value?.getElTableExpose()
  if (!elTableRef) {
    console.error('无法获取 Table 实例')
    return
  }
  const selections = elTableRef.getSelectionRows() || []

  if (selections.length === 0) {
    ElMessage.warning('请至少选择一项进行删除')
    return
  }

  try {
    await ElMessageBox.confirm('确认要批量删除选中的账户吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const id_list = selections.map((item: any) => item.id)
    await batchDeleteResourcePoolAccountApi({ id_list })

    ElMessage.success('批量删除成功')
    reloadTable()
  } catch (error) {
    if (error !== 'cancel') {
      handleErrorMessage(error, '批量删除失败')
    }
  }
}

const handleSuccess = () => {
  reloadTable()
}

const handleEditThreshold = async (row) => {
  if (row.kind !== 3) return

  try {
    const { value } = await ElMessageBox.prompt(
      '请输入新的阈值 (输入0或留空表示不设阈值)',
      '编辑阈值',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputValue: row.limit === 0 ? '' : String(row.limit),
        inputPattern: /^\d*$/,
        inputErrorMessage: '请输入有效的非负整数'
      }
    )

    if (value === null) {
      return
    }

    const newThreshold = value === '' ? 0 : parseInt(value, 10)

    if (newThreshold === row.limit) {
      ElMessage.info('阈值未改变')
      return
    }

    await v2UpdatePool({
      id: row.id,
      limit: newThreshold,
      status: row.status
    })

    handleSuccessMessage('阈值更新成功')
    reloadTable()
  } catch (error) {
    if (error !== 'cancel') {
      handleErrorMessage(error, '更新阈值失败')
    }
  }
}

// 当页面被激活时（从缓存中恢复或首次进入），重新加载数据
onActivated(() => {
  reloadTable()
})
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
}
</style>
