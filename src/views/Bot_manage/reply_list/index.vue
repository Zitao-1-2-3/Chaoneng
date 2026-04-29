<template>
  <div class="app-container">
    <ContentWrap>
      <SearchTable
        v-if="isBotlistLoaded"
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
      <div v-html="currentContentToView" style="white-space: pre-line"></div>
      <template #footer>
        <ElButton @click="viewContentDialogVisible = false">关闭</ElButton>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="tsx">
import { ref, onMounted, computed, nextTick } from 'vue'
import { ElButton, ElLink, ElSwitch, ElMessage } from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import { SearchTable } from '@/components/SearchTable'
import { BaseButton } from '@/components/Button'
import type { TableColumn } from '@/components/Table'
import type { FormSchema } from '@/components/Form'
import {
  v1GetReplyList,
  v1CreateReply,
  v1UpdateReply,
  v1DeleteReply,
  updateReplyStatusApi
} from '@/api/reply_list'
import { v1GetBotList } from '@/api/botlist'
import type {
  ReplyItem,
  ReplySaveParams,
  BotOption,
  ReplyListParamsV1,
  CreateReplyParamsV1,
  UpdateReplyParamsV1
} from '@/api/reply_list/types'
import { formatToDateTime } from '@/utils/dateUtil'
import ReplyFormDialog from './components/ReplyFormDialog.vue'
import { Dialog } from '@/components/Dialog'
import { handleListMessage, handleErrorMessage, handleSuccessMessage } from '@/utils/messageHelper'
const searchTableRef = ref<InstanceType<typeof SearchTable> | null>(null)
const replyFormDialogRef = ref<InstanceType<typeof ReplyFormDialog> | null>(null)

const dialogVisible = ref(false)
const isEditMode = ref(false)
const isLoaded = ref(false)
const isBotlistLoaded = ref(false)
const currentRowData = ref<ReplyItem | null>(null)

const botOptionsForDialog = ref<BotOption[]>([])
const botInfoMap = ref<Map<number, { user_name: string; first_name: string }>>(new Map())

const fetchBotOptionsForPage = async () => {
  try {
    const res = await v1GetBotList({ page_size: 1000, current_page: 1 })
    if (res.code === '000000' && res.data) {
      botOptionsForDialog.value = (res.data.list || []).map((bot: any) => {
        botInfoMap.value.set(bot.id, {
          user_name: bot.user_name,
          first_name: bot.first_name
        })
        return {
          label: `${bot.user_name} (${bot.first_name})`,
          value: bot.id
        }
      })
    }
    isBotlistLoaded.value = true
  } catch (error) {
    handleErrorMessage(error, '获取机器人列表失败')
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
  },
  {
    field: 'bot_username',
    label: '机器人用户名',
    width: 150
  },
  {
    field: 'keyword',
    label: '关键词',
    minWidth: 180
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
    field: 'created_at',
    label: '创建时间',
    sortable: 'custom',
    width: 180,
    formatter: (row: ReplyItem) =>
      row.created_at ? formatToDateTime(new Date(row.created_at).getTime()) : '-'
  },
  {
    field: 'updated_at',
    label: '更新时间',
    sortable: 'custom',
    width: 180,
    formatter: (row: ReplyItem) =>
      row.updated_at ? formatToDateTime(new Date(row.updated_at).getTime()) : '-'
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
    field: 'tg_bot_id',
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
    field: 'query',
    label: '关键词',
    component: 'Input',
    componentProps: {
      placeholder: '请输入关键词'
    }
  }
])

const fetchReplyList = async (params: any) => {
  try {
    const queryParams: ReplyListParamsV1 = {
      current_page: Number(params.current_page) || 1,
      page_size: Number(params.page_size) || 10
    }

    if (params.tg_bot_id !== undefined && params.tg_bot_id !== '') {
      queryParams.bot_id = Number(params.tg_bot_id)
    }

    if (params.query && params.query.trim()) {
      queryParams.key_name = params.query.trim()
    }

    if (params.status !== undefined && params.status !== '') {
      queryParams.status = params.status
    }

    if (params.order) {
      queryParams.order = params.order
    }

    const res = await v1GetReplyList(queryParams)

    if (res.code === '000000' && res.data) {
      const mappedList = (res.data.list || []).map((item: any): ReplyItem => {
        const botInfo = botInfoMap.value.get(item.bot_id)
        const userName = botInfo ? botInfo.user_name : ''
        const fullName = botInfo ? `${botInfo.user_name} (${botInfo.first_name})` : ''

        return {
          id: item.id,
          tg_bot_id: item.bot_id,
          bot_name: fullName,
          key_name: item.key_name,
          content: item.content,
          status: item.status,
          created_at: item.created_at,
          updated_at: item.updated_at,
          bot_id: String(item.bot_id),
          keyword: item.key_name,
          bot_username: userName
        }
      })

      const hasSearchCondition = !!(params.tg_bot_id || params.query || params.status)
      handleListMessage(mappedList, hasSearchCondition, '关键词回复')

      return {
        list: mappedList,
        total: res.data.pager?.total || 0
      }
    }

    return { list: [], total: 0 }
  } catch (error) {
    handleErrorMessage(error, '获取关键词回复列表失败')
    return { list: [], total: 0 }
  }
}

const deleteReplyAction = async () => {
  if (currentRowData.value && currentRowData.value.id) {
    try {
      // 使用新接口 v1DeleteReply
      await v1DeleteReply(currentRowData.value.id)
      handleSuccessMessage('删除成功')
      return true
    } catch (error) {
      handleErrorMessage(error, '删除关键词回复失败')
      return false
    }
  }
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

const handleDeleteConfirmation = (row: ReplyItem) => {
  currentRowData.value = row
  searchTableRef.value?.delete(row)
}

const handleDialogSubmitted = async (data: ReplySaveParams) => {
  if (replyFormDialogRef.value) {
    replyFormDialogRef.value.submitLoading = true
  }

  try {
    if (data.id) {
      const updateParams: UpdateReplyParamsV1 = {
        id: data.id,
        content: data.content || '',
        status: data.status
      }
      await v1UpdateReply(updateParams)
      handleSuccessMessage('更新成功')
    } else {
      const createParams: CreateReplyParamsV1 = {
        bot_id: data.tg_bot_id,
        content: data.content || '',
        key_name: data.key_name,
        status: data.status
      }
      await v1CreateReply(createParams)
      handleSuccessMessage('添加成功')
    }

    dialogVisible.value = false
    searchTableRef.value?.reload()
  } catch (error) {
    handleErrorMessage(error, '保存失败')
  } finally {
    if (replyFormDialogRef.value) {
      replyFormDialogRef.value.submitLoading = false
    }
  }
}

const handleStatusChange = async (row: ReplyItem, newStatus: number) => {
  if (!isLoaded.value) return
  try {
    await updateReplyStatusApi({ ...row, status: newStatus })
    handleSuccessMessage('状态更新成功')
  } catch (error) {
    handleErrorMessage(error, '状态更新失败')
    row.status = newStatus === 1 ? 2 : 1
  }
}

const onSearch = (params: any) => {
  // 搜索参数处理
}

const handleDataLoaded = ({ data, total, success }) => {
  nextTick(() => {
    isLoaded.value = true
  })
}

const viewContentDialogVisible = ref(false)
const currentContentToView = ref('')
const handleViewContent = (row: ReplyItem) => {
  currentContentToView.value = row.content || '<i>没有内容</i>'
  viewContentDialogVisible.value = true
}
</script>

<style scoped>
.app-container {
  padding: 15px;
}
</style>
