<template>
  <div class="app-container">
    <ContentWrap>
      <SearchTable
        :columns="columns"
        :search-schema="searchSchema"
        :fetch-data-api="fetchReplyList"
        :fetch-del-api="deleteReplyAction"
        :action-column="actionColumn"
        @loaded="handleDataLoaded"
        ref="searchTableRef"
        @add="handleAdd"
        @search="onSearch"
      />
    </ContentWrap>

    <ReplyFormDialog
      v-model="dialogVisible"
      :is-edit="isEditMode"
      :row-data="currentRowData"
      :bot-options="botOptionsForDialog"
      @submitted="handleDialogSubmitted"
      ref="replyFormDialogRef"
    />

    <!-- New Dialog for viewing rich text content -->
    <Dialog
      v-model="viewContentDialogVisible"
      title="查看回复内容"
      width="50%"
      :close-on-click-modal="false"
    >
      <div v-html="currentContentToView"></div>
      <template #footer>
        <ElButton @click="viewContentDialogVisible = false">关闭</ElButton>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="tsx">
import { ref, reactive, onMounted, h, computed, nextTick } from 'vue'
import { ElButton, ElLink, ElTag, ElMessage, ElMessageBox, ElSwitch } from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import { SearchTable } from '@/components/SearchTable'
import { BaseButton } from '@/components/Button'
import { useI18n } from '@/hooks/web/useI18n'
import type { TableColumn } from '@/components/Table'
import type { FormSchema } from '@/components/Form'
import {
  getReplyListApi,
  deleteReplyApi,
  saveReplyApi,
  updateReplyStatusApi
} from '@/api/reply_list'
import { getBotListApi } from '@/api/botlist'
import type { ReplyItem, ReplySaveParams, BotOption } from '@/api/reply_list/types'
import { formatToDateTime } from '@/utils/dateUtil'
import ReplyFormDialog from './components/ReplyFormDialog.vue'
import { Dialog } from '@/components/Dialog'

const { t } = useI18n()
const searchTableRef = ref<InstanceType<typeof SearchTable> | null>(null)
const replyFormDialogRef = ref<InstanceType<typeof ReplyFormDialog> | null>(null)

const dialogVisible = ref(false)
const isEditMode = ref(false)
const submitLoading = ref(false)
const isLoaded = ref(false)
const currentRowData = ref<ReplyItem | null>(null)

const botOptionsForDialog = ref<BotOption[]>([])

const fetchBotOptionsForPage = async () => {
  try {
    const res = await getBotListApi({ page_size: 1000, current_page: 1 })
    botOptionsForDialog.value = (res.data.list || []).map((bot: any) => ({
      label: `${bot.name} (${bot.firstname})`,
      value: bot.tg_bot_id
    }))
  } catch (error) {
    console.error('获取机器人选项失败: ', error)
    botOptionsForDialog.value = []
  }
}

onMounted(async () => {
  await fetchBotOptionsForPage()
})

const columns: TableColumn[] = [
  {
    field: 'bot_id',
    label: '机器人ID',
    width: 120
    // Example slot for bot_id if it needs custom rendering or click action
    // slots: {
    //   default: (data: { row: ReplyItem }) => {
    //     return <ElLink type="primary" onClick={() => handleBotIdClick(data.row.bot_id)}>{data.row.bot_id}</ElLink>
    //   }
    // }
  },
  {
    field: 'bot_username',
    label: '机器人用户名',
    width: 150
  },
  {
    field: 'keyword',
    label: '关键词',
    minWidth: 180,
    slots: {
      // Slot for potential icon next to keyword
      default: (data: { row: ReplyItem }) => {
        // Placeholder for icon logic - e.g., if (data.row.has_icon) return <><ElIcon.../> {data.row.keyword}</>
        return <span>{data.row.keyword}</span>
      }
    }
  },
  {
    field: 'content',
    label: '回复内容',
    width: 100,
    slots: {
      default: (data: { row: ReplyItem }) => {
        return (
          <ElLink type="primary" onClick={() => handleViewContent(data.row)}>
            查看
          </ElLink>
        )
      }
    }
  },
  {
    field: 'status',
    label: '状态',
    width: 100,
    slots: {
      default: (data: { row: ReplyItem }) => {
        return (
          <ElSwitch
            v-model={data.row.status}
            activeValue={1}
            inactiveValue={2}
            onChange={(val: number) => handleStatusChange(data.row, val)}
            disabled={!isLoaded.value}
          />
        )
      }
    }
  },
  {
    field: 'create_time',
    label: '创建时间',
    width: 180,
    formatter: (row: ReplyItem) => formatToDateTime(row.create_time)
  },
  {
    field: 'update_time',
    label: '更新时间',
    width: 180,
    formatter: (row: ReplyItem) => formatToDateTime(row.update_time)
  }
]

const actionColumn: TableColumn = {
  field: 'action',
  label: '操作',
  width: 200,
  fixed: 'right',
  slots: {
    default: (data: { row: ReplyItem }) => {
      return (
        <>
          <BaseButton type="primary" onClick={() => handleEdit(data.row)}>
            编辑
          </BaseButton>
          <BaseButton type="danger" onClick={() => handleDeleteConfirmation(data.row)}>
            删除
          </BaseButton>
        </>
      )
    }
  }
}

const searchSchema = computed<FormSchema[]>(() => [
  {
    field: 'bot_id',
    label: '机器人',
    component: 'Select',
    componentProps: {
      placeholder: '全部',
      options: [{ label: '全部', value: '' }, ...botOptionsForDialog.value],
      clearable: true,
      filterable: true
    }
  },
  {
    field: 'keyword',
    label: '关键词',
    component: 'Input',
    componentProps: {
      placeholder: '请输入关键词'
    }
  }
])

const fetchReplyList = async (params: any) => {
  try {
    const res = await getReplyListApi(params)
    const mappedList = (res.data.list || []).map((item: any): ReplyItem => {
      // Assuming backend time is in seconds, convert to milliseconds for JavaScript Date
      const createTimeMs = item.create_time * 1000
      const updateTimeMs = item.update_time * 1000

      return {
        id: item.id,
        tg_bot_id: item.tg_bot_id,
        bot_name: item.name, // map name to bot_name
        key_name: item.key_name,
        content: item.content,
        status: item.status,
        create_time: createTimeMs, // use milliseconds timestamp
        update_time: updateTimeMs, // use milliseconds timestamp

        // Populate compatible fields for existing form/table logic
        bot_id: String(item.tg_bot_id), // Form expects string for bot_id selection, table display also uses bot_id
        keyword: item.key_name, // Form expects keyword, table display also uses keyword
        bot_username: item.name // Table display uses bot_username
      }
    })
    return {
      list: mappedList,
      total: res.data.totalCount || 0
    }
  } catch (error) {
    console.error('获取关键词回复列表失败:', error)
    return { list: [], total: 0 }
  }
}

const deleteReplyAction = async () => {
  if (currentRowData.value && currentRowData.value.id) {
    try {
      await deleteReplyApi(currentRowData.value.id)
      ElMessage.success('删除成功')
      return true
    } catch (error) {
      console.error('删除关键词回复失败:', error)
      ElMessage.error('删除失败')
      return false
    }
  }
  ElMessage.warning('未选择任何数据行进行删除')
  return false
}

const handleAdd = () => {
  isEditMode.value = false
  currentRowData.value = null
  dialogVisible.value = true
}

const handleEdit = (row: ReplyItem) => {
  isEditMode.value = true
  currentRowData.value = { ...row }
  dialogVisible.value = true
}

const handleDeleteConfirmation = async (row: ReplyItem) => {
  await ElMessageBox.confirm('确定删除选中的回复吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
  currentRowData.value = row
  searchTableRef.value?.delete(row)
}

const handleDialogSubmitted = async (data: ReplySaveParams) => {
  if (replyFormDialogRef.value && replyFormDialogRef.value.submitLoading !== undefined) {
    replyFormDialogRef.value.submitLoading = true
  }

  try {
    await saveReplyApi(data)
    ElMessage.success(data.id ? '更新成功' : '添加成功')
    dialogVisible.value = false
    searchTableRef.value?.reload()
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  } finally {
    if (replyFormDialogRef.value && replyFormDialogRef.value.submitLoading !== undefined) {
      replyFormDialogRef.value.submitLoading = false
    }
  }
}

const handleStatusChange = async (row: ReplyItem, newStatus: number) => {
  if (!isLoaded.value) return
  try {
    await updateReplyStatusApi({ ...row, status: newStatus })
    ElMessage.success('状态更新成功')
  } catch (error) {
    console.error('状态更新失败:', error)
    ElMessage.error('状态更新失败，请重试')
    row.status = newStatus === 1 ? 2 : 1
  }
}

const handleBotIdClick = (botId: string) => {
  ElMessage.info(`点击了机器人ID: ${botId}`)
}

const onSearch = (params: any) => {
  console.log('搜索参数:', params)
}

const handleDataLoaded = ({ data, total, success }) => {
  console.log('数据加载完成:', { total, success, data_count: data?.length || 0 })
  nextTick(() => {
    isLoaded.value = true
  })
}

// Refs for the view content dialog (viewContentDialogVisible and currentContentToView are already defined)
const viewContentDialogVisible = ref(false)
const currentContentToView = ref('')
const handleViewContent = (row: ReplyItem) => {
  currentContentToView.value = row.content || '<i>没有内容</i>' // Use <i> for placeholder if content is empty
  viewContentDialogVisible.value = true // Open the new dialog
}
</script>

<style scoped>
.app-container {
  padding: 15px;
}
</style>
