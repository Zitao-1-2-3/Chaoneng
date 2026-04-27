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
                  ? formatToDateTime(new Date(currentDetailRecord.created_at).getTime())
                  : '-'
              }}</span>
            </div>
            <div v-if="currentDetailRecord.sent_at">
              <span class="font-semibold">发送时间：</span>
              <span>{{ formatToDateTime(new Date(currentDetailRecord.sent_at).getTime()) }}</span>
            </div>
          </div>
        </div>

        <ElDivider />

        <!-- 消息预览 -->
        <div class="mb-4">
          <div class="font-semibold mb-2">消息预览：</div>

          <!-- Telegram 风格的消息卡片 -->
          <div class="message-preview-container">
            <!-- 如果有文件，遍历显示 -->
            <template v-if="currentDetailRecord.files && currentDetailRecord.files.length > 0">
              <div
                v-for="(file, index) in currentDetailRecord.files"
                :key="`file-${index}`"
                class="message-card"
              >
                <!-- 图片/视频 -->
                <div class="media-container">
                  <template v-if="isVideo(file)">
                    <video
                      :src="file"
                      controls
                      disablePictureInPicture
                      controlslist="nodownload noremoteplayback"
                      class="media-content"
                    >
                      您的浏览器不支持视频播放
                    </video>
                  </template>
                  <template v-else>
                    <ElImage
                      :src="file"
                      alt="消息图片"
                      fit="cover"
                      class="media-content cursor-pointer"
                      :preview-src-list="currentDetailRecord.files"
                      :initial-index="Number(index)"
                    />
                  </template>
                </div>

                <!-- 只在最后一个文件上显示文字内容和内联按钮 -->
                <template v-if="index === currentDetailRecord.files.length - 1">
                  <!-- 文字内容 -->
                  <div v-if="currentDetailRecord.content" class="message-text">
                    {{ currentDetailRecord.content }}
                  </div>

                  <!-- 内联按钮 -->
                  <div
                    v-if="
                      currentDetailRecord.inner_buttons &&
                      currentDetailRecord.inner_buttons.length > 0
                    "
                    class="inline-buttons"
                  >
                    <div
                      v-for="(button, btnIndex) in currentDetailRecord.inner_buttons"
                      :key="btnIndex"
                      class="inline-button"
                    >
                      {{ button.text }}
                    </div>
                  </div>
                </template>
              </div>
            </template>

            <!-- 如果没有文件，只显示文字和按钮 -->
            <template v-else>
              <div class="message-card text-only">
                <!-- 文字内容 -->
                <div v-if="currentDetailRecord.content" class="message-text">
                  {{ currentDetailRecord.content }}
                </div>
                <div v-else class="message-text text-gray-400 italic"> 无文字内容 </div>

                <!-- 内联按钮 -->
                <div
                  v-if="
                    currentDetailRecord.inner_buttons &&
                    currentDetailRecord.inner_buttons.length > 0
                  "
                  class="inline-buttons"
                >
                  <div
                    v-for="(button, btnIndex) in currentDetailRecord.inner_buttons"
                    :key="btnIndex"
                    class="inline-button"
                  >
                    {{ button.text }}
                  </div>
                </div>
              </div>
            </template>
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

    <!-- 高级设置弹窗 -->
    <AdvancedSettingsDialog
      v-model="advancedSettingsDialogVisible"
      :row-data="currentEditRow"
      @success="handleAdvancedSettingsSuccess"
    />

    <!-- 文件预览弹窗 - 图片 -->
    <ElImageViewer
      v-if="filePreviewVisible && !isPreviewVideo"
      :url-list="previewFileList"
      :initial-index="previewInitialIndex"
      teleported
      @close="filePreviewVisible = false"
    />

    <!-- 文件预览弹窗 - 视频 -->
    <VideoPreviewDialog
      v-model:visible="filePreviewVisible"
      :video-url="previewFileUrl"
      v-if="isPreviewVideo"
    />
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
import { ElMessage, ElMessageBox, ElDivider, ElImage, ElImageViewer } from 'element-plus'
import {
  v1GetMassSendList,
  v1DeleteMassSend,
  v1SendGroupMessage,
  v1GetMessageBotList
} from '@/api/tgUser'
import type { MassSendListParamsV1 } from '@/api/tgUser/types'
import MessageDialog from '../user_list/components/MessageDialog/index.vue'
import InlineButtonDialog from './components/InlineButtonDialog.vue'
import AdvancedSettingsDialog from './components/AdvancedSettingsDialog.vue'
import VideoPreviewDialog from '../user_list/components/MessageDialog/components/VideoPreviewDialog.vue'

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

// 文件预览
const filePreviewVisible = ref(false)
const previewFileUrl = ref('')
const previewFileList = ref<string[]>([])
const previewInitialIndex = ref(0)
const isPreviewVideo = ref(false)

// 内联按钮管理弹窗
const inlineButtonDialogVisible = ref(false)

// 高级设置弹窗
const advancedSettingsDialogVisible = ref(false)
const currentEditRow = ref<any>(null)

// 获取机器人列表
const fetchBotList = async () => {
  try {
    const res = await v1GetMessageBotList()
    if (res.code === '000000' && res.data) {
      botList.value = (res.data || []).map((bot: any) => ({
        label: bot.user_name,
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

// 判断是否为视频文件
const isVideo = (url: string): boolean => {
  if (!url) return false
  return /\.(mp4|avi|mov|wmv|flv|mkv|webm)$/i.test(url)
}

// 文件预览
const handleFilePreview = (fileUrl: string, allFiles?: string[]) => {
  if (!fileUrl) return

  previewFileUrl.value = fileUrl
  isPreviewVideo.value = isVideo(fileUrl)

  // 如果提供了所有文件列表，过滤出所有图片
  if (allFiles && allFiles.length > 0) {
    const imageFiles = allFiles.filter((file) => !isVideo(file))
    previewFileList.value = imageFiles
    previewInitialIndex.value = imageFiles.indexOf(fileUrl)
  } else {
    previewFileList.value = [fileUrl]
    previewInitialIndex.value = 0
  }

  filePreviewVisible.value = true
}

// 查看详情
const handleViewDetail = (row: any) => {
  currentDetailRecord.value = { ...row }
  detailDialogVisible.value = true
}

// 编辑消息
const handleEdit = (row: any) => {
  currentEditRow.value = row
  advancedSettingsDialogVisible.value = true
}

// 高级设置成功回调
const handleAdvancedSettingsSuccess = () => {
  searchTableRef.value?.reload()
}

// 重发消息
const handleResend = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要立即重发这条消息吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    // 再次调用发送消息接口，只修改 period 为 0 和 sent_at 为当前时间
    const res = await v1SendGroupMessage({
      bot_ids: [row.bot_id],
      content: row.content || '',
      delete_sent: row.delete_sent || 2,
      files: row.files || [],
      inner_buttons: (row.inner_buttons || []).map((btn: any) => btn.id),
      period: 0, // 重发时周期改为0（只发一次）
      sent_at: Math.floor(Date.now() / 1000), // 发送时间改为当前时间
      tg_user_ids: row.tg_user_ids || []
    })

    if (res.code === '000000') {
      ElMessage.success('重发成功')
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
    field: 'status',
    component: 'Select',
    label: '发送周期',
    colProps: { span: 6 },
    componentProps: {
      options: [
        { label: '全部', value: 0 },
        { label: '只发一次', value: 1 },
        { label: '周期发送', value: 2 }
      ],
      placeholder: '请选择发送周期',
      clearable: true
    }
  }
])

// 表格列配置
const tableColumns: TableColumn[] = [
  {
    field: 'bot_id',
    label: '机器人ID',
    width: 120
  },
  {
    field: 'bot_name',
    label: '发送目标',
    width: 150,
    formatter: (row) => row.bot_name || '-'
  },
  {
    field: 'tg_user_ids',
    label: 'TG用户ID',
    width: 150,
    formatter: (row) => {
      if (!row.tg_user_ids || row.tg_user_ids.length === 0) return '全部用户'
      if (row.tg_user_ids.length === 1) return String(row.tg_user_ids[0])
      return `${row.tg_user_ids.length}个用户`
    }
  },
  {
    field: 'content',
    label: '消息内容',
    formatter: (row) => {
      const content = row.content || ''
      return content.length > 50 ? content.substring(0, 50) + '...' : content || '—'
    }
  },
  {
    field: 'files',
    label: '文件',
    align: 'center',
    slots: {
      default: ({ row }: { row: any }) => {
        if (row.files && row.files.length > 0) {
          const firstFile = row.files[0]
          const isVideoFile = isVideo(firstFile)

          if (isVideoFile) {
            return (
              <div style="display: flex; justify-content: center; align-items: center;">
                <div
                  style="width: 50px; height: 50px; border-radius: 4px; overflow: hidden; cursor: pointer; position: relative; background: #000;"
                  onClick={() => handleFilePreview(firstFile, row.files)}
                >
                  <video
                    src={firstFile + '#t=0.1'}
                    style="width: 100%; height: 100%; object-fit: cover;"
                    muted
                    preload="metadata"
                    disablePictureInPicture
                    controlslist="nodownload noremoteplayback"
                  />
                  <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; font-size: 20px; pointer-events: none; text-shadow: 0 0 4px rgba(0,0,0,0.8);">
                    ▶
                  </div>
                </div>
              </div>
            )
          } else {
            return (
              <div style="display: flex; justify-content: center; align-items: center;">
                <div
                  style="width: 50px; height: 50px; border-radius: 4px; overflow: hidden; cursor: pointer;"
                  onClick={() => handleFilePreview(firstFile, row.files)}
                >
                  <ElImage
                    src={firstFile}
                    fit="cover"
                    style="width: 100%; height: 100%; object-fit: cover;"
                    preview-teleported={false}
                  />
                </div>
              </div>
            )
          }
        }
        return <div style="text-align: center;">—</div>
      }
    }
  },
  {
    field: 'sent_at',
    label: '发送时间',
    width: 180,
    formatter: (row) => {
      if (!row.sent_at) return '—'

      let timestamp: number

      // 处理不同的时间格式
      if (typeof row.sent_at === 'number') {
        // 如果是数字，判断是秒还是毫秒
        timestamp = row.sent_at < 10000000000 ? row.sent_at * 1000 : row.sent_at
      } else if (typeof row.sent_at === 'string') {
        // 如果是字符串，尝试解析
        timestamp = new Date(row.sent_at).getTime()
      } else {
        return '—'
      }

      // 检查时间是否有效
      if (isNaN(timestamp) || timestamp <= 0) return '—'

      return formatToDateTime(timestamp)
    }
  },
  {
    field: 'time_diff',
    label: '距离上次发送',
    width: 130,
    formatter: (row) => {
      if (!row.sent_at) return '—'
      const now = Date.now()
      let sentTime: number

      // 处理不同的时间格式
      if (typeof row.sent_at === 'number') {
        // 如果是数字，判断是秒还是毫秒
        sentTime = row.sent_at < 10000000000 ? row.sent_at * 1000 : row.sent_at
      } else if (typeof row.sent_at === 'string') {
        // 如果是字符串，尝试解析
        sentTime = new Date(row.sent_at).getTime()
      } else {
        return '—'
      }

      // 检查时间是否有效
      if (isNaN(sentTime) || sentTime <= 0) return '—'

      const diffMs = now - sentTime
      // 如果是未来时间，显示"未发送"
      if (diffMs < 0) return '未发送'

      const diffMinutes = Math.floor(diffMs / 1000 / 60)
      // 小于1小时，显示分钟
      if (diffMinutes < 60) return `${diffMinutes}分钟`

      const diffHours = Math.floor(diffMinutes / 60)
      // 小于24小时，显示小时
      if (diffHours < 24) return `${diffHours}小时`

      const diffDays = Math.floor(diffHours / 24)
      return `${diffDays}天`
    }
  },
  {
    field: 'delete_sent',
    label: '删除上次',
    width: 100,
    formatter: (row) => {
      return row.delete_sent === 1 ? '是' : '否'
    }
  },
  {
    field: 'period',
    label: '发送周期',
    width: 120,
    formatter: (row) => {
      // 当 period 为 null 或 4294967295 时，显示"只发一次"
      if (row.period === null || row.period === 4294967295) return '只发一次'
      if (row.period === 0) return '只发一次'
      return `${row.period}小时`
    }
  },
  {
    field: 'created_at',
    label: '创建时间',
    width: 180,
    sortable: 'custom',
    formatter: (row) =>
      row.created_at ? formatToDateTime(new Date(row.created_at).getTime()) : '-'
  },
  {
    field: 'action',
    label: '操作',
    width: 300,
    fixed: 'right',
    slots: {
      default: ({ row }: { row: any }) => {
        return (
          <div style="display: flex; gap: 4px; justify-content: center;">
            <BaseButton type="primary" onClick={() => handleEdit(row)} style="margin: 0;">
              高级设置
            </BaseButton>
            <BaseButton type="success" onClick={() => handleResend(row)} style="margin: 0;">
              重发
            </BaseButton>
            <BaseButton type="default" onClick={() => handleViewDetail(row)} style="margin: 0;">
              详情
            </BaseButton>
            <BaseButton type="danger" onClick={() => handleDelete(row)} style="margin: 0;">
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

    // 处理发送周期筛选：0-全部（不传参数），1-只发一次，2-周期发送
    // 只有当 status 为 1 或 2 时才传递给后端
    if (params.status && (params.status === 1 || params.status === 2)) {
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
/* Telegram 风格的消息预览样式 */
.message-preview-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.message-card {
  position: relative;
  width: 100%;
  max-width: 500px;
  margin-bottom: 8px;
  overflow: hidden;
  background: #dcf8c6;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgb(0 0 0 / 10%);
}

.message-card.text-only {
  width: 100%;
  max-width: 500px;
  padding: 8px 12px;
}

.media-container {
  width: 100%;
  overflow: hidden;
  background: #000;
  border-radius: 8px 8px 0 0;
}

.media-content {
  display: block;
  width: 100%;
  max-width: 500px;
  max-height: 400px;
  object-fit: contain;
}

.message-text {
  padding: 8px 12px;
  font-size: 14px;
  line-height: 1.5;
  color: #000;
  word-break: break-word;
  white-space: pre-wrap;
}

.inline-buttons {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 4px;
  padding: 0 8px 8px;
}

.inline-button {
  width: 100%;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.5;
  color: #08c;
  text-align: center;
  cursor: pointer;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  transition: background-color 0.2s;
  user-select: none;
}

.inline-button:hover {
  background: #f5f5f5;
}

.inline-button:active {
  background: #e8e8e8;
}
</style>
