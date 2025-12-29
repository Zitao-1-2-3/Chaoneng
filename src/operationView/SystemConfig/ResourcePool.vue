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
import { ref, reactive } from 'vue'
import { ElButton, ElMessageBox, ElMessage, ElTag, ElSelect, ElOption } from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import { Icon } from '@/components/Icon'
import { FormSchema } from '@/components/Form'
import { formatToDateTime } from '@/utils/dateUtil'
import ResourcePoolAccountForm from './components/ResourcePoolAccountForm.vue'
import { BaseButton } from '@/components/Button'
import { SearchTable } from '@/components/SearchTable'
import type { TableColumn } from '@/components/Table'
import {
  getResourcePoolAccountListApi,
  deleteResourcePoolAccountApi,
  batchDeleteResourcePoolAccountApi,
  updateResourcePoolAccountApi
} from '@/api/system/resource_pool_account'
import { isPermission } from '@/utils/is'
const formRef = ref()
const searchTableRef = ref()

const resourceTypeMap = {
  1: 'TRX池子',
  2: 'USDT池子',
  3: '能量池子'
  // 4: '带宽池子'
}

const columns = ref<TableColumn[]>([
  // {
  //   type: 'selection',
  //   field: 'selection',
  //   width: '55px'
  // },
  // {
  //   field: 'id',
  //   label: '序号',
  //   width: '80px'
  // },
  {
    field: 'resource_type',
    label: '配置类型',
    width: '120px',
    formatter: (row) => {
      return resourceTypeMap[row.resource_type] || '未知类型'
    }
  },
  {
    field: 'public_key',
    label: '公钥',
    minWidth: '180px'
  },
  {
    field: 'permission_name',
    label: '权限名称',
    minWidth: '180px'
  },
  {
    field: '',
    label: '可用数量/阈值',
    minWidth: '180px',
    formatter: (row) => {
      const displayValue =
        row.resource_type === 3
          ? `${row.amount} / ${row.amount_limit == 0 ? '-' : row.amount_limit}`
          : `${row.amount}`

      if (row.resource_type === 3) {
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
    field: 'create_by',
    label: '创建人',
    width: '120px'
  },
  {
    field: 'status',
    label: '状态',
    width: '100px',
    slots: {
      default: ({ row }) => {
        const statusMap = { 1: '启用', 2: '禁用', 3: '备用' }
        const statusColors = {
          1: 'text-green-300 font-bold', // 启用 - 绿色
          2: 'text-red-300 font-bold', // 禁用 - 红色
          3: 'text-orange-300 font-bold' // 备用 - 橙色
        }
        // 判断是否应禁用非启用选项
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
    field: 'create_time',
    label: '创建时间',
    width: '180px',
    formatter: (row) => formatToDateTime(new Date(row.create_time * 1000))
  },
  {
    field: 'update_time',
    label: '更新时间',
    width: '180px',
    formatter: (row) => formatToDateTime(new Date(row.update_time * 1000))
  }
])

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'resource_type',
    component: 'Select',
    label: '配置类型：',
    componentProps: {
      placeholder: '请选择配置类型',
      clearable: true,
      options: [
        { label: '全部', value: '' },
        { label: 'TRX池子', value: 1 },
        { label: 'USDT池子', value: 2 },
        { label: '能量池子', value: 3 }
        // { label: '带宽池子', value: 4 }
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
    const res = await getResourcePoolAccountListApi(params)
    return res.data
  } catch (error) {
    console.error('获取数据失败 (catch):', error)
    const message = error instanceof Error ? error.message : '未知错误'
    ElMessage.error(`获取列表失败: ${message}`)
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
  console.log('编辑行:', row)
  const formData = {
    id: row.id,
    configType: row.resource_type,
    publicKey: row.public_key,
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
  if (row.resource_type === 3) {
    msg = `确认要将状态更改为 "${actionText}" ${intendedStatus === 1 ? '(设为主账户)' : intendedStatus === 3 ? '(设为备用账户)' : ''} 吗？`
  }

  try {
    await ElMessageBox.confirm(msg, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await updateResourcePoolAccountApi({
      id: row.id,
      status: intendedStatus,
      amount_limit: parseFloat(row.amount_limit)
    })

    ElMessage.success(`状态已更新为 "${actionText}"`)
    reloadTable()
  } catch (error) {
    console.error('操作失败:', error)
    if (error === 'cancel') {
      ElMessage.info('操作已取消')
    } else {
      const message = error instanceof Error ? error.message : '未知错误'
      ElMessage.error(`操作失败: ${message}`)
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
    console.error('删除失败:', error)
    if (error !== 'cancel') {
      const message = error instanceof Error ? error.message : '未知错误'
      ElMessage.error(`删除失败: ${message}`)
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

  console.log('选中的行:', selections)
  console.warn(
    '调用 batchDeleteResourcePoolAccountApi，请确保后端已实现 /manage/resource_pool/batch-delete 或类似接口'
  )

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
    console.error('批量删除失败:', error)
    if (error !== 'cancel') {
      const message = error instanceof Error ? error.message : '未知错误'
      ElMessage.error(`批量删除失败: ${message}`)
    }
  }
}

const handleSuccess = () => {
  reloadTable()
}

const handleEditThreshold = async (row) => {
  if (row.resource_type !== 3) return

  try {
    const { value } = await ElMessageBox.prompt(
      '请输入新的阈值 (输入0或留空表示不设阈值)',
      '编辑阈值',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputValue: row.amount_limit === 0 ? '' : String(row.amount_limit),
        inputPattern: /^\d*$/,
        inputErrorMessage: '请输入有效的非负整数'
      }
    )

    if (value === null) {
      return
    }

    const newThreshold = value === '' ? 0 : parseInt(value, 10)

    if (newThreshold === row.amount_limit) {
      ElMessage.info('阈值未改变')
      return
    }

    await updateResourcePoolAccountApi({
      id: row.id,
      amount_limit: newThreshold,
      status: row.status
    })

    ElMessage.success('阈值更新成功')
    reloadTable()
  } catch (error) {
    console.error('更新阈值失败:', error)
    if (error !== 'cancel') {
      const message = error instanceof Error ? error.message : '未知错误'
      ElMessage.error(`更新阈值失败: ${message}`)
    }
  }
}
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
