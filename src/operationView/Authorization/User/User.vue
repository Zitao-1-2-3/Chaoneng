<script setup lang="tsx">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { ref, nextTick, h, onMounted } from 'vue'
import {
  getManageUserListApiV2, // 新接口——获取运营用户列表
  addManageUserApiV2, // 新接口——运营新增运营
  updateManageUserApiV2, // 新接口——运营更新运营
  deleteManageUserApiV2, // 新接口——运营删除运营
  type AddManageUserPayload, // 新接口类型——运营新增运营
  type UpdateManageUserPayload, // 新接口类型——运营更新运营
  type DeleteManageUserPayload // 新接口类型——运营删除运营
} from '@/api/manageUser/index'
import type { DepartmentUserItem } from '@/api/department/types'
import { Table, TableExpose } from '@/components/Table'
import { useTable } from '@/hooks/web/useTable'
import { ElTag, ElMessageBox, ElMessage } from 'element-plus'
import Write from './components/Write.vue'
import Detail from './components/Detail.vue'
import { BaseButton } from '@/components/Button'
import { formatToDateTime } from '@/utils/dateUtil'

const { t } = useI18n()

const columns = [
  {
    field: 'username',
    label: t('userDemo.username')
  },
  {
    field: 'role_name',
    label: t('userDemo.role')
  },
  {
    field: 'status',
    label: t('userDemo.status'),
    slots: {
      default: ({ row }: any) =>
        h(ElTag, { type: row.status === 1 ? 'success' : 'danger' }, () =>
          row.status === 1 ? t('userDemo.enable') : t('userDemo.disable')
        )
    }
  },
  {
    field: 'created_at',
    label: t('tableDemo.displayTime'),
    formatter: (row: any) => (row.created_at ? formatToDateTime(row.created_at * 1000) : '-')
  },
  {
    field: 'updated_at',
    label: '更新时间',
    formatter: (row: any) => (row.updated_at ? formatToDateTime(row.updated_at * 1000) : '-')
  },
  {
    field: 'action',
    label: t('userDemo.action'),
    width: 240,
    slots: {
      default: ({ row }: any) => [
        <BaseButton /* v-hasPermi="User.edit" */ type="primary" onClick={() => action(row, 'edit')}>
          {t('exampleDemo.edit')}
        </BaseButton>,
        <BaseButton /* v-hasPermi="User.delete" */ type="danger" onClick={() => delData(row)}>
          {t('exampleDemo.del')}
        </BaseButton>
      ]
    }
  }
]

const { tableRegister, tableMethods, tableState } = useTable({
  fetchDataApi: async () => {
    const page = tableState.currentPage.value
    const size = tableState.pageSize.value
    try {
      const res = await getManageUserListApiV2({ current_page: page, page_size: size })
      return {
        list: res.data.list || [],
        total: res.data.pager?.total || 0
      }
    } catch (error) {
      console.error('User.vue: getManageUserListApiV2 error:', error)
      return { list: [], total: 0 }
    }
  },
  immediate: true
})

const { getList, setProps } = tableMethods
const { dataList, loading, total, currentPage, pageSize } = tableState

const dialogTitle = ref('')
const currentRow = ref<DepartmentUserItem | undefined>()
const actionType = ref('')
const writeRef = ref<InstanceType<typeof Write> | null>(null)
const detailRef = ref<InstanceType<typeof Detail> | null>(null)

const AddAction = () => {
  dialogTitle.value = t('exampleDemo.add')
  currentRow.value = undefined
  actionType.value = 'add'
  nextTick(() => writeRef.value?.open())
}

const delLoading = ref(false)

const delData = async (row?: DepartmentUserItem) => {
  if (!row) return
  try {
    await ElMessageBox.confirm(
      t('userDemo.confirmDeleteMessage', `确定要删除用户 ${row.username} 吗？`),
      t('userDemo.confirmTitle', '确认删除'),
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )
    delLoading.value = true
    try {
      // 使用新接口删除运营用户
      const payload: DeleteManageUserPayload = {
        id: Number(row.id) // 将 string 转换为 number
      }
      await deleteManageUserApiV2(payload)
      ElMessage.success('删除成功')
      getList()
    } catch (error) {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    } finally {
      delLoading.value = false
    }
  } catch {
    ElMessage.info('取消操作')
  }
}

const action = (row: DepartmentUserItem, type: string) => {
  dialogTitle.value = t(type === 'edit' ? 'exampleDemo.edit' : 'exampleDemo.detail')
  actionType.value = type
  if (type === 'detail') {
    currentRow.value = { ...row }
    nextTick(() => detailRef.value?.open())
  } else {
    currentRow.value = { ...row }
    nextTick(() => writeRef.value?.open())
  }
}

const saveLoading = ref(false)

const save = async () => {
  const write = writeRef.value
  const formData = await write?.submit()
  if (formData) {
    saveLoading.value = true
    try {
      let res: any
      if (actionType.value === 'edit') {
        // 使用新接口更新运营用户
        const payload: UpdateManageUserPayload = {
          id: Number(formData.id), // 将 string 转换为 number
          username: formData.username,
          password: formData.password || undefined, // 空密码不传
          role_id: formData.role_id,
          status: formData.status
        }
        res = await updateManageUserApiV2(payload)
      } else {
        // 使用新接口创建运营用户
        const payload: AddManageUserPayload = {
          username: formData.username,
          password: formData.password,
          role_id: formData.role_id,
          status: formData.status
        }
        res = await addManageUserApiV2(payload)
      }
      ElMessage.success(actionType.value === 'edit' ? '编辑成功' : '添加成功')
      if (res.code == '000000') {
        // getList() // Remove this call
      }
    } catch (error) {
      console.log(error)
    } finally {
      saveLoading.value = false
      writeRef.value?.close()
    }
  }
}

// --- Handlers for pagination updates from Table component ---
const handleCurrentChange = (newPage: number) => {
  currentPage.value = newPage
  // getList() will be triggered by the watcher inside useTable
}
const handleSizeChange = (newSize: number) => {
  pageSize.value = newSize
  // getList() will be triggered by the watcher inside useTable
}

onMounted(() => {
  setProps({ columns: columns })
})
</script>

<template>
  <div class="flex flex-col w-100% h-100%">
    <ContentWrap class="flex-1 mb-4">
      <div class="mb-4">
        <BaseButton type="primary" @click="AddAction">{{ t('exampleDemo.add') }}</BaseButton>
      </div>

      <Table
        :data="dataList"
        :loading="loading"
        :selection="false"
        :border="true"
        stripe
        :pagination="{
          total: total,
          currentPage: currentPage,
          pageSize: pageSize,
          pageSizes: [10, 20, 50, 100],
          layout: 'total, sizes, prev, pager, next, jumper',
          background: true
        }"
        @update:currentPage="handleCurrentChange"
        @update:pageSize="handleSizeChange"
        @register="tableRegister"
      />
    </ContentWrap>

    <Write
      ref="writeRef"
      :current-row="currentRow"
      :dialog-title="dialogTitle"
      :save-loading="saveLoading"
      :action-type="actionType"
      @closed="getList"
    >
      <template #footer>
        <BaseButton
          v-if="actionType !== 'detail'"
          type="primary"
          :loading="saveLoading"
          @click="save"
        >
          {{ t('exampleDemo.save') }}
        </BaseButton>
        <BaseButton @click="writeRef?.close()">{{ t('dialogDemo.close') }}</BaseButton>
      </template>
    </Write>
    <Detail
      ref="detailRef"
      :current-row="currentRow"
      :dialog-title="dialogTitle"
      :action-type="actionType"
    />
  </div>
</template>
