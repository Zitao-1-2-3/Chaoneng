<script setup lang="tsx">
import { ref, computed, h, nextTick, onMounted } from 'vue'
import { getRoleListApi, getRoleDetailApi, deleteRoleApiV2 } from '@/api/role'
import { useI18n } from '@/hooks/web/useI18n'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { ElMessageBox, ElMessage, ElTag } from 'element-plus'
import { formatToDateTime } from '@/utils/dateUtil'
import { Table, TableColumn } from '@/components/Table'
import Write from './components/Write.vue'
import { useTable } from '@/hooks/web/useTable'
import { handleErrorMessage, handleSuccessMessage } from '@/utils/messageHelper'

const { t } = useI18n()

// 表格列配置
const columns: TableColumn[] = [
  {
    field: 'name',
    label: t('role.roleName')
  },
  {
    field: 'status',
    label: t('menu.status'),
    slots: {
      default: ({ row }: any) => {
        return (
          <>
            <ElTag type={row.status === 1 ? 'success' : 'danger'}>
              {row.status === 1 ? '启用' : '禁用'}
            </ElTag>
          </>
        )
      }
    }
  },
  {
    field: 'created_at',
    label: t('tableDemo.displayTime'),
    formatter: (row: any) => (row.created_at ? formatToDateTime(row.created_at * 1000) : '-')
  },
  {
    field: 'action',
    label: t('userDemo.action'),
    width: 240,
    slots: {
      default: ({ row }: any) => [
        h(
          BaseButton,
          {
            type: 'primary',
            onClick: () => handleAction(row, 'edit'),
            style: { marginRight: '8px' }
          },
          () => t('exampleDemo.edit')
        ),
        h(
          BaseButton,
          {
            type: 'danger',
            onClick: () => handleDelete(row)
          },
          () => t('exampleDemo.del')
        )
      ]
    }
  }
]

// --- useTable Setup ---
const { tableRegister, tableMethods, tableState } = useTable({
  fetchDataApi: async () => {
    try {
      const res = await getRoleListApi()
      console.log('=== 角色列表数据 ===', res.data)
      return {
        list: res.data.list || [],
        total: res.data.pager.total || 0
      }
    } catch (error) {
      handleErrorMessage(error, '获取角色列表失败')
      return { list: [], total: 0 }
    }
  },
  immediate: true
})

const { getList, setProps } = tableMethods
const { dataList, loading, total, currentPage, pageSize } = tableState

// 弹窗相关
const dialogTitle = ref('')
const actionType = ref<'add' | 'edit' | 'detail' | ''>('')
const writeRef = ref<InstanceType<typeof Write> | null>(null)
const formLoading = ref(false)
const currentRow = ref<any>({})

// 新增/编辑弹窗
const handleAction = async (row: any, type: 'edit' | 'detail') => {
  dialogTitle.value = t(type === 'edit' ? 'exampleDemo.edit' : 'exampleDemo.detail')
  actionType.value = type
  if (type === 'detail') {
    // Detail view logic if needed
  } else {
    try {
      formLoading.value = true
      // 使用新的获取角色详情接口
      const res = await getRoleDetailApi(row.id)
      const roleDetail = res?.data || {}
      currentRow.value = { ...row, ...roleDetail }
      nextTick(() => {
        writeRef.value?.open()
      })
    } catch (error) {
      handleErrorMessage(error, '获取角色详情失败')
    } finally {
      formLoading.value = false
    }
  }
}

const handleAdd = () => {
  dialogTitle.value = t('exampleDemo.add')
  actionType.value = 'add'
  currentRow.value = {}
  nextTick(() => writeRef.value?.open())
}

// Handle success event from Write component
const handleSaveSuccess = () => {
  getList()
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm('确定删除该角色吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      try {
        // 使用新的删除角色接口
        await deleteRoleApiV2(row.id)
        handleSuccessMessage('删除成功')
        getList()
      } catch (error) {
        handleErrorMessage(error, '删除失败')
      }
    })
    .catch(() => {})
}

// --- Pagination Handlers ---
const handleCurrentChange = (newPage: number) => {
  currentPage.value = newPage
}
const handleSizeChange = (newSize: number) => {
  pageSize.value = newSize
}

// Set columns after mount
onMounted(() => {
  setProps({ columns: columns })
})
</script>

<template>
  <ContentWrap>
    <!-- Add Button -->
    <div class="mb-4">
      <BaseButton type="primary" @click="handleAdd">{{ t('exampleDemo.add') }}</BaseButton>
    </div>

    <!-- Table Component -->
    <Table
      :data="dataList"
      :loading="loading"
      :selection="false"
      :border="true"
      stripe
      @update:currentPage="handleCurrentChange"
      @update:pageSize="handleSizeChange"
      @register="tableRegister"
    />
  </ContentWrap>

  <Write
    ref="writeRef"
    :current-row="currentRow"
    :dialog-title="dialogTitle"
    :action-type="actionType"
    :form-loading="formLoading"
    @success="handleSaveSuccess"
  >
    <template #footer>
      <BaseButton
        v-if="actionType === 'add' || actionType === 'edit'"
        type="primary"
        @click="writeRef?.submit()"
      >
        {{ t('exampleDemo.save') }}
      </BaseButton>
      <BaseButton @click="writeRef?.close()">{{ t('dialogDemo.close') }}</BaseButton>
    </template>
  </Write>
</template>
