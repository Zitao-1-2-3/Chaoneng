<template>
  <ContentWrap>
    <SearchTable
      v-if="botListLoaded"
      :columns="tableColumns"
      :search-schema="searchSchema"
      :fetch-data-api="fetchMessageList"
      :show-add-button="false"
      ref="searchTableRef"
    >
      <template #searchButtons>
        <BaseButton type="primary" @click="openMassSendDialog()">群发消息</BaseButton>
        <BaseButton type="success" @click="goToInlineButtons()">内联按钮</BaseButton>
      </template>
    </SearchTable>

    <!-- 发送消息弹窗 -->
    <MessageDialog
      v-model="messageDialogVisible"
      type="mass"
      :bot-list="botsForDialog"
      :custom-title="messageDialogCustomTitle"
      :is-single-user="false"
      @success="handleMessageSent"
    />

    <!-- 消息详情弹窗 -->
    <Dialog v-model="detailDialogVisible" title="消息详情" width="800px">
      <div v-if="currentDetailRecord.id" class="detail-content">
        <!-- 基本信息 -->
        <div class="mb-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <span class="font-semibold">消息ID：</span>
              <span>{{ currentDetailRecord.id }}</span>
            </div>
            <div>
              <span class="font-semibold">机器人：</span>
              <span>{{ currentDetailRecord.bot_name }}</span>
            </div>
            <div>
              <span class="font-semibold">接收类型：</span>
              <ElTag :type="getReceiveTypeTag(currentDetailRecord.receive_type).type">
                {{ getReceiveTypeTag(currentDetailRecord.receive_type).label }}
              </ElTag>
            </div>
            <div>
              <span class="font-semibold">状态：</span>
              <ElTag :type="getStatusTag(currentDetailRecord.status).type">
                {{ getStatusTag(currentDetailRecord.status).label }}
              </ElTag>
            </div>
            <div>
              <span class="font-semibold">进度：</span>
              <span>{{ currentDetailRecord.percent || 0 }}%</span>
            </div>
            <div>
              <span class="font-semibold">成功数：</span>
              <span>{{ currentDetailRecord.ok_num || 0 }} 个</span>
            </div>
            <div>
              <span class="font-semibold">失败数：</span>
              <span>{{ currentDetailRecord.fail_num || 0 }} 个</span>
            </div>
            <div>
              <span class="font-semibold">创建时间：</span>
              <span>{{
                currentDetailRecord.created_at
                  ? formatToDateTime(currentDetailRecord.created_at * 1000)
                  : '-'
              }}</span>
            </div>
          </div>
        </div>

        <ElDivider />

        <!-- 消息内容 -->
        <div class="mb-4">
          <div class="font-semibold mb-2">消息内容：</div>
          <div class="bg-gray-50 p-4 rounded">
            <!-- 图片/视频预览 -->
            <div
              v-if="currentDetailRecord.image || currentDetailRecord.file_url"
              class="mb-3 flex justify-center"
            >
              <template v-if="isVideo(currentDetailRecord.image || currentDetailRecord.file_url)">
                <video
                  :src="currentDetailRecord.image || currentDetailRecord.file_url"
                  controls
                  class="max-w-full h-auto rounded"
                  style="max-height: 400px"
                >
                  您的浏览器不支持视频播放
                </video>
              </template>
              <template v-else>
                <ElImage
                  :src="currentDetailRecord.image || currentDetailRecord.file_url"
                  alt="消息图片"
                  fit="contain"
                  class="max-w-full h-auto rounded"
                  :preview-src-list="[currentDetailRecord.image || currentDetailRecord.file_url]"
                />
              </template>
            </div>

            <!-- 文字内容 -->
            <p v-if="currentDetailRecord.content" class="text-sm whitespace-pre-wrap">
              {{ currentDetailRecord.content }}
            </p>
            <p v-else class="text-sm text-gray-400 italic">无文字内容</p>
          </div>

          <!-- 内联按钮预览 -->
          <div
            v-if="currentDetailRecord.keyboards && currentDetailRecord.keyboards.length > 0"
            class="mt-3"
          >
            <div class="font-semibold mb-2">内联按钮：</div>
            <div class="flex flex-wrap gap-2">
              <ElButton
                v-for="(button, index) in currentDetailRecord.keyboards"
                :key="index"
                size="small"
                disabled
              >
                {{ getButtonText(button) }}
              </ElButton>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="text-center text-gray-500 py-8">
        <p>暂无详情数据</p>
      </div>
      <template #footer>
        <BaseButton @click="detailDialogVisible = false">关闭</BaseButton>
      </template>
    </Dialog>

    <!-- 内联按钮管理弹窗 -->
    <InlineButtonDialog v-model="inlineButtonDialogVisible" />
  </ContentWrap>
</template>

<script setup lang="tsx">
import { ref, computed, onMounted } from 'vue'
import { ContentWrap } from '@/components/ContentWrap'
import { SearchTable } from '@/components/SearchTable'
import { BaseButton } from '@/components/Button'
import { Dialog } from '@/components/Dialog'
import type { TableColumn } from '@/components/Table'
import type { FormSchema } from '@/components/Form'
import { formatToDateTime } from '@/utils/dateUtil'
import { ElMessage, ElTag, ElMessageBox, ElDivider, ElImage, ElButton } from 'element-plus'
import { v1GetMassSendList, v1SendGroupMessage, v1DeleteMassSend } from '@/api/tgUser'
import type { MassSendListParamsV1 } from '@/api/tgUser/types'
import { v1GetBotList } from '@/api/botlist'
import MessageDialog from '../user_list/components/MessageDialog/index.vue'
import InlineButtonDialog from './components/InlineButtonDialog.vue'

// SearchTable 引用
const searchTableRef = ref<InstanceType<typeof SearchTable> | null>(null)

// 机器人列表加载状态
const botListLoaded = ref(false)

// 机器人列表
const botList = ref<Array<{ label: string; value: number }>>([])

// 消息发送相关
const messageDialogVisible = ref(false)
const messageDialogCustomTitle = ref('')

// 详情弹窗
const detailDialogVisible = ref(false)
const currentDetailRecord = ref<any>({})

// 内联按钮管理弹窗
const inlineButtonDialogVisible = ref(false)

// 获取机器人列表
const fetchBotList = async () => {
  try {
    const res = await v1GetBotList({
      current_page: 1,
      page_size: 100
    })
    if (res.code === '000000' && res.data) {
      botList.value = (res.data.list || []).map((bot: any) => ({
        label: `${bot.user_name} (${bot.first_name})`,
        value: bot.id
      }))
      // 标记机器人列表已加载
      botListLoaded.value = true
    }
  } catch (error) {
    console.error('获取机器人列表失败:', error)
    // 即使失败也要显示表格
    botListLoaded.value = true
  }
}

// 为弹窗准备的机器人列表（转换为 string value）
const botsForDialog = computed(() => {
  return botList.value.map((bot) => ({
    label: bot.label,
    value: String(bot.value)
  }))
})

// 打开群发消息弹窗
const openMassSendDialog = () => {
  messageDialogCustomTitle.value = '群发消息'
  messageDialogVisible.value = true
}

// 消息发送成功处理
const handleMessageSent = () => {
  messageDialogVisible.value = false
  searchTableRef.value?.reload()
}

// 跳转到内联按钮管理页面
const goToInlineButtons = () => {
  inlineButtonDialogVisible.value = true
}

// 判断是否为视频
const isVideo = (url: string) => {
  if (!url) return false
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi']
  return videoExtensions.some((ext) => url.toLowerCase().includes(ext))
}

// 获取按钮文本
const getButtonText = (button: any) => {
  if (typeof button === 'object' && button.text) {
    return button.text
  }
  return String(button)
}

// 获取接收类型标签
const getReceiveTypeTag = (type: string) => {
  const typeMap: Record<string, { label: string; type: any }> = {
    all_user: { label: '全部用户', type: 'info' },
    user_custom: { label: '指定用户', type: 'success' },
    one_user: { label: '单个用户', type: 'warning' }
  }
  return typeMap[type] || { label: type, type: '' }
}

// 获取状态标签
const getStatusTag = (status: number) => {
  const statusMap: Record<number, { label: string; type: any }> = {
    1: { label: '发送中', type: 'warning' },
    2: { label: '已完成', type: 'success' }
  }
  return statusMap[status] || { label: '未知', type: '' }
}

// 查看详情
const handleViewDetail = (row: any) => {
  currentDetailRecord.value = { ...row }
  detailDialogVisible.value = true
}

// 删除消息
const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除这条群发消息记录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const res = await v1DeleteMassSend(row.id)
    if (res.code === '000000') {
      ElMessage.success('删除成功')
      searchTableRef.value?.reload()
    } else {
      ElMessage.error((res as any).msg || '删除失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// 重发消息 - 使用群发消息接口重新发送，成功后删除记录并刷新
const handleResend = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要重新发送这条消息吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    // 使用群发消息接口 v1SendGroupMessage，参数与原记录一致
    const apiParams: any = {
      bot_id: row.tg_bot_id || row.bot_id,
      content: row.content
    }

    // 添加内联按钮（如果有）
    if (row.keyboards && row.keyboards.length > 0) {
      apiParams.keyboards = row.keyboards
        .map((btn: any) => {
          return typeof btn === 'object' ? btn.id : Number(btn)
        })
        .filter((id: number) => !isNaN(id))
    }

    // 添加文件URL（图片或视频）
    if (row.image || row.file_url) {
      apiParams.file_url = row.file_url || row.image
    }

    // 添加接收用户列表
    if (row.tg_user_ids) {
      let userIds: number[] = []

      if (Array.isArray(row.tg_user_ids)) {
        userIds = row.tg_user_ids
          .map((id: any) => Number(id))
          .filter((id: number) => !isNaN(id) && id !== 0)
      } else if (typeof row.tg_user_ids === 'string') {
        userIds = row.tg_user_ids
          .split(',')
          .map((id: string) => Number(id.trim()))
          .filter((id: number) => !isNaN(id) && id !== 0)
      } else if (typeof row.tg_user_ids === 'number') {
        userIds = [row.tg_user_ids]
      }

      if (userIds.length > 0) {
        apiParams.tg_user_ids = userIds
      }
    }

    // 1. 先调用群发接口
    const res = await v1SendGroupMessage(apiParams)
    if (res.code === '000000') {
      ElMessage.success('重发成功')

      // 2. 群发成功后，调用删除接口删除当前记录
      try {
        await v1DeleteMassSend(row.id)
        console.log('原记录已删除')
      } catch (deleteError) {
        console.error('删除原记录失败:', deleteError)
        // 删除失败不影响流程，继续执行
      }

      // 3. 最后刷新表格数据（无论删除成功与否）
      searchTableRef.value?.reload()
    } else {
      ElMessage.error((res as any).msg || '重发失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('重发失败:', error)
      ElMessage.error(error.message || '重发失败')
    }
  }
}

// 搜索表单配置
const searchSchema = computed<FormSchema[]>(() => [
  {
    field: 'bot_id',
    component: 'Select',
    label: '机器人',
    colProps: { span: 6 },
    componentProps: {
      options: botList.value,
      placeholder: '请选择机器人',
      clearable: true
    }
  },
  {
    field: 'keyword',
    component: 'Input',
    label: '关键词',
    colProps: { span: 6 },
    componentProps: {
      placeholder: '搜索消息内容',
      clearable: true
    }
  },
  {
    field: 'status',
    component: 'Select',
    label: '状态',
    colProps: { span: 6 },
    componentProps: {
      options: [
        { label: '发送中', value: 1 },
        { label: '已完成', value: 2 }
      ],
      placeholder: '请选择状态',
      clearable: true
    }
  }
])

// 表格列配置
const tableColumns: TableColumn[] = [
  {
    field: 'bot_name',
    label: '机器人',
    width: 150
  },
  {
    field: 'content',
    label: '消息内容',
    minWidth: 250,
    formatter: (row) => {
      const content = row.content || ''
      return content.length > 80 ? content.substring(0, 80) + '...' : content
    }
  },
  {
    field: 'status',
    label: '状态',
    width: 100,
    slots: {
      default: ({ row }: { row: any }) => {
        const statusMap: Record<number, { label: string; type: any }> = {
          1: { label: '发送中', type: 'warning' },
          2: { label: '已完成', type: 'success' }
        }
        const statusInfo = statusMap[row.status] || { label: '未知', type: '' }
        return <ElTag type={statusInfo.type}>{statusInfo.label}</ElTag>
      }
    }
  },
  {
    field: 'percent',
    label: '进度',
    width: 100,
    formatter: (row) => `${row.percent || 0}%`
  },
  {
    field: 'ok_num',
    label: '成功数',
    width: 100,
    formatter: (row) => `${row.ok_num || 0} 个`
  },
  {
    field: 'fail_num',
    label: '失败数',
    width: 100,
    formatter: (row) => `${row.fail_num || 0} 个`
  },
  {
    field: 'created_at',
    label: '创建时间',
    width: 180,
    sortable: 'custom',
    formatter: (row) => (row.created_at ? formatToDateTime(row.created_at * 1000) : '-')
  },
  {
    field: 'action',
    label: '操作',
    width: 280,
    fixed: 'right',
    slots: {
      default: ({ row }: { row: any }) => {
        return (
          <div>
            <BaseButton type="primary" onClick={() => handleViewDetail(row)}>
              查看详情
            </BaseButton>
            <BaseButton type="success" style="margin-left: 8px" onClick={() => handleResend(row)}>
              重发
            </BaseButton>
            <BaseButton type="danger" style="margin-left: 8px" onClick={() => handleDelete(row)}>
              删除
            </BaseButton>
          </div>
        )
      }
    }
  }
]

// API 封装 - 获取消息列表
const fetchMessageList = async (params: any) => {
  try {
    const queryParams: MassSendListParamsV1 = {
      current_page: Number(params.current_page) || 1,
      page_size: Number(params.page_size) || 10
    }

    // 添加可选参数
    if (params.bot_id) {
      queryParams.bot_id = Number(params.bot_id)
    }
    if (params.keyword) {
      queryParams.keyword = params.keyword
    }
    if (params.status) {
      queryParams.status = Number(params.status)
    }

    // 处理排序参数
    if (params.order) {
      queryParams.order = params.order
    }

    const response = await v1GetMassSendList(queryParams)

    if (response.code === '000000' && response.data) {
      return {
        list: response.data.list || [],
        total: response.data.pager?.total || 0
      }
    }

    return { list: [], total: 0 }
  } catch (error) {
    console.error('获取消息列表失败:', error)
    ElMessage.error('获取消息列表失败')
    return { list: [], total: 0 }
  }
}

// 组件挂载时获取机器人列表
onMounted(() => {
  fetchBotList()
})
</script>

<style scoped>
/* 可以添加自定义样式 */
</style>
