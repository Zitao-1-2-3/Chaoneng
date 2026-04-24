<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle">
    <ElForm
      ref="formRef"
      :model="formData"
      label-width="120px"
      style="max-height: 70vh; padding-right: 10px; overflow-y: auto"
    >
      <!-- 机器人和接收用户在同一行 -->
      <ElRow v-if="type === 'mass'" :gutter="20">
        <ElCol :span="12">
          <!-- 机器人选择器 -->
          <BotSelector
            v-model="formData.bot_id"
            :bot-list="botList"
            :is-single-user="isSingleUser"
            @change="handleBotChange"
          />
        </ElCol>
        <ElCol :span="12">
          <!-- 接收用户选择器（只显示类型选择） -->
          <RecipientSelector
            v-model:filter-type="formData.filter_type"
            v-model:user-list="formData.user_list"
            :is-single-user="isSingleUser"
            :is-multiple-bots="isMultipleBots"
            :show-user-list="false"
          />
        </ElCol>
      </ElRow>

      <!-- TG用户ID列表（独立一行） -->
      <RecipientSelector
        v-if="type === 'mass'"
        v-model:filter-type="formData.filter_type"
        v-model:user-list="formData.user_list"
        :is-single-user="isSingleUser"
        :is-multiple-bots="isMultipleBots"
        :show-filter-type="false"
        :show-user-list="true"
      />

      <!-- 消息内容编辑器 -->
      <MessageContentEditor v-model="formData.content" :show-formatting-buttons="false" />

      <!-- 文件上传器 -->
      <FileUploader
        :file-list="fileListRef"
        @preview="handlePreview"
        @change="handleFileChange"
        @remove="handleImageRemove"
      />

      <!-- 内联按钮选择器 -->
      <InlineButtonSelector
        v-model="checkList"
        :menu-list="menuList"
        @edit="openInlineButtonDialog"
      />
    </ElForm>

    <template #footer>
      <div class="flex justify-end">
        <ElButton @click="handleCancel">取消</ElButton>
        <ElButton type="primary" :loading="submitting" @click="handleSubmit">发送</ElButton>
      </div>
    </template>
  </Dialog>

  <!-- 图片预览 -->
  <ElImageViewer
    v-if="showImageViewer && previewFileType === 'image'"
    :url-list="imageViewerSrcList"
    @close="showImageViewer = false"
    :initial-index="0"
  />

  <!-- 视频预览 -->
  <VideoPreviewDialog v-model:visible="showVideoViewer" :video-url="videoPreviewUrl" />

  <!-- 内联按钮管理弹窗 -->
  <InlineButtonDialog v-model="inlineButtonDialogVisible" @success="fetchMenuList" />

  <!-- 消息预览对话框 -->
  <MessagePreviewDialog
    v-model="showMessagePreview"
    :preview-data="messagePreviewData"
    :submitting="submitting"
    @confirm="handleConfirmSend"
    @cancel="showMessagePreview = false"
  />
</template>

<script setup lang="tsx">
import { ref, computed, watch, onMounted } from 'vue'
import { ElButton, ElMessage, ElImageViewer, ElForm, ElRow, ElCol } from 'element-plus'
import type { UploadUserFile, FormInstance } from 'element-plus'
import { Dialog } from '@/components/Dialog'
import { v1SendGroupMessage } from '@/api/tgUser'
import { v1GetMenuList, v2GetMenuList } from '@/api/menu_list'
import { uploadFile as uploadAPI } from '@/api/utils/upload'
import type { MenuItem } from '@/api/menu_list/types'
// import { useHtmlInsert } from '@/hooks/web/useHtmlInsert'
import InlineButtonDialog from '../../../message_list/components/InlineButtonDialog.vue'

// 导入子组件
import BotSelector from './components/BotSelector.vue'
import RecipientSelector from './components/RecipientSelector.vue'
import MessageContentEditor from './components/MessageContentEditor.vue'
import FileUploader from './components/FileUploader.vue'
import InlineButtonSelector from './components/InlineButtonSelector.vue'
import VideoPreviewDialog from './components/VideoPreviewDialog.vue'
import MessagePreviewDialog from './components/MessagePreviewDialog.vue'
import type { MessagePreviewData } from './components/MessagePreviewDialog.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  type: {
    type: String as () => 'mass' | 'single',
    default: 'mass'
  },
  user: {
    type: Object as () => Record<string, any>,
    default: () => ({})
  },
  botList: {
    type: Array as () => Array<{ label: string; value: number | string }>,
    default: () => []
  },
  customTitle: {
    type: String,
    default: ''
  },
  isSingleUser: {
    type: Boolean,
    default: false
  },
  useV2Api: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'success'])

const submitting = ref(false)
const formRef = ref<FormInstance>()

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const dialogTitle = computed(() => {
  return props.customTitle || '群发消息'
})

// 表单数据
const formData = ref({
  bot_id: undefined as number | string | (number | string)[] | undefined,
  filter_type: 'user_custom' as 'user_custom' | 'all_user',
  user_list: '',
  content: ''
})

// 内联按钮管理
const inlineButtonDialogVisible = ref(false)
const checkList = ref<(number | string)[]>([])
const menuList = ref<MenuItem[]>([])

// 是否选了多个机器人（直接从 formData 派生，避免双状态不同步）
const isMultipleBots = computed(() => {
  const val = formData.value.bot_id
  return Array.isArray(val) && val.length > 1
})

// 文件上传相关
const fileListRef = ref<UploadUserFile[]>([])
const fileToUpload = ref<File | null>(null)

// 预览相关
const showImageViewer = ref(false)
const imageViewerSrcList = ref<string[]>([])
const showVideoViewer = ref(false)
const videoPreviewUrl = ref('')
const previewFileType = ref<'image' | 'video'>('image')

// 消息预览相关
const showMessagePreview = ref(false)
const messagePreviewData = ref<MessagePreviewData>({})

// 格式化按钮（暂时禁用，因为 v-html 渲染有问题）
// const getContent = async () => formData.value.content
// const setContent = async (newContent: string) => {
//   formData.value.content = newContent
// }
// const { renderFormattingButtons } = useHtmlInsert(getContent, setContent)
// const formattingButtonsHtml = computed(() => renderFormattingButtons())

// 判断文件类型
const getFileType = (file: File | UploadUserFile): 'image' | 'video' => {
  const fileName = file.name || ''
  const fileType = (file as File).type || (file as UploadUserFile).raw?.type || ''

  if (fileType.startsWith('video/') || /\.(mp4|avi|mov|wmv|flv|mkv)$/i.test(fileName)) {
    return 'video'
  }
  return 'image'
}

// 文件预览
const handlePreview = (uploadFile: UploadUserFile) => {
  const fileType = getFileType(uploadFile)
  previewFileType.value = fileType

  if (fileType === 'video') {
    if (uploadFile.url) {
      videoPreviewUrl.value = uploadFile.url
      showVideoViewer.value = true
    } else if (uploadFile.raw) {
      if (videoPreviewUrl.value.startsWith('blob:')) {
        URL.revokeObjectURL(videoPreviewUrl.value)
      }
      const objectURL = URL.createObjectURL(uploadFile.raw)
      videoPreviewUrl.value = objectURL
      showVideoViewer.value = true
    } else {
      ElMessage.warning('无法预览视频，缺少视频URL')
    }
  } else {
    if (uploadFile.url) {
      imageViewerSrcList.value = [uploadFile.url]
      showImageViewer.value = true
    } else if (uploadFile.raw) {
      const objectURL = URL.createObjectURL(uploadFile.raw)
      imageViewerSrcList.value = [objectURL]
      showImageViewer.value = true
    } else {
      ElMessage.warning('无法预览文件，缺少文件URL')
    }
  }
}

// 文件选择变化
const handleFileChange = (_file: UploadUserFile, fileList: UploadUserFile[]) => {
  // 处理每个文件的预览URL
  fileList.forEach((uploadFile) => {
    if (uploadFile.raw && !uploadFile.url) {
      const fileType = getFileType(uploadFile.raw)
      if (fileType === 'video') {
        const blobUrl = URL.createObjectURL(uploadFile.raw)
        uploadFile.url = blobUrl
      }
    }
  })

  fileListRef.value = fileList
  // 保存第一个文件用于上传（后续需要改为支持多文件上传）
  fileToUpload.value = fileList.length > 0 ? fileList[0].raw || null : null
}

// 移除文件
const handleImageRemove = (file: UploadUserFile) => {
  // 从文件列表中移除指定文件
  const index = fileListRef.value.findIndex((f) => f.uid === file.uid)
  if (index > -1) {
    fileListRef.value.splice(index, 1)
  }

  // 如果删除的是当前要上传的文件，清空
  if (fileToUpload.value && (fileToUpload.value as any).uid === file.uid) {
    fileToUpload.value = null
  }

  ElMessage.info('文件已移除')
  return true
}

// 机器人选择变化
const handleBotChange = (value: number | string | (number | string)[]) => {
  formData.value.bot_id = value
  if (Array.isArray(value) && value.length > 1) {
    formData.value.filter_type = 'all_user'
  }
}

// 获取内联菜单列表
const fetchMenuList = async () => {
  try {
    // 根据 useV2Api prop 决定使用哪个接口
    const apiFunc = props.useV2Api ? v2GetMenuList : v1GetMenuList
    const res = await apiFunc({
      menu_type: 2,
      current_page: 1,
      page_size: 100
    })

    if (res.code === '000000' && res.data) {
      menuList.value = res.data.list || []
    } else {
      menuList.value = []
    }
  } catch (error: any) {
    menuList.value = []
    console.error('获取内联菜单失败:', error)
    ElMessage.error('获取内联菜单失败: ' + (error?.msg || '未知错误'))
  }
}

// 打开内联按钮管理弹窗
const openInlineButtonDialog = () => {
  inlineButtonDialogVisible.value = true
}

// 取消操作
const handleCancel = () => {
  dialogVisible.value = false
}

// 提交消息 - 显示预览
const handleSubmit = async () => {
  if (!formRef.value) {
    ElMessage.error('表单实例获取失败')
    return
  }

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    // 准备预览数据
    const previewData: MessagePreviewData = {}

    // 机器人名称
    if (props.isSingleUser && props.user) {
      const actualBotId = Number(props.user.bot_id)
      const selectedBot = props.botList.find((bot) => bot.value === actualBotId)
      previewData.botName = selectedBot?.label || `机器人 ID: ${actualBotId}`
    } else {
      const botId = formData.value.bot_id
      if (Array.isArray(botId)) {
        // 多个机器人：使用数组，每个机器人一行
        previewData.botNames = botId.map((id) => {
          const bot = props.botList.find((b) => b.value === id)
          return bot?.label || `机器人 ID: ${id}`
        })
      } else {
        // 单个机器人
        const selectedBot = props.botList.find((bot) => bot.value === botId)
        previewData.botName = selectedBot?.label || `机器人 ID: ${botId}`
      }
    }

    // 接收用户信息
    if (formData.value.filter_type === 'all_user') {
      previewData.recipientInfo = '全部用户'
    } else {
      const userCount = formData.value.user_list
        ? formData.value.user_list.split(',').filter((id) => id.trim()).length
        : 0
      previewData.recipientInfo = `自定义用户 (${userCount} 人)`
    }

    // 消息内容
    previewData.content = formData.value.content

    // 文件列表
    if (fileListRef.value.length > 0) {
      previewData.files = fileListRef.value.map((file) => ({
        type: getFileType(file),
        url: file.url || (file.raw ? URL.createObjectURL(file.raw) : ''),
        name: file.name || ''
      }))
    }

    // 内联按钮
    if (checkList.value.length > 0) {
      previewData.buttons = checkList.value
        .map((id) => {
          const menu = menuList.value.find((m) => m.id === id)
          return menu ? { text: menu.text || menu.menu_name || '' } : null
        })
        .filter((btn) => btn !== null) as Array<{ text: string; url?: string }>
    }

    messagePreviewData.value = previewData
    showMessagePreview.value = true
  })
}

// 确认发送消息
const handleConfirmSend = async () => {
  submitting.value = true

  try {
    // 先上传文件
    let fileUrl = ''
    if (fileToUpload.value) {
      const formDataObj = new FormData()
      formDataObj.append('file', fileToUpload.value)
      try {
        const res = await uploadAPI(formDataObj)
        if (res && res.data && res.data.filename) {
          const browserOrigin = window.location.origin
          fileUrl = `${browserOrigin}/${res.data.filename}`
        } else {
          ElMessage.error('文件上传失败，未返回文件名')
          submitting.value = false
          return
        }
      } catch (error: any) {
        console.error('文件上传错误:', error)
        ElMessage.error('文件上传失败: ' + (error?.message || '请重试'))
        submitting.value = false
        return
      }
    }

    // 处理内联按钮
    const keyboards = checkList.value
      .map((item: any) => {
        if (typeof item === 'object' && item !== null && 'id' in item) {
          return Number(item.id)
        }
        return typeof item === 'number' ? item : Number(item)
      })
      .filter((id: number) => !isNaN(id))

    // 确定实际的 bot_id
    let actualBotId: number
    if (props.isSingleUser && props.user) {
      actualBotId = Number(props.user.bot_id)
    } else {
      actualBotId = Number(formData.value.bot_id)
    }

    const apiParams: any = {
      bot_id: actualBotId,
      content: formData.value.content
    }

    if (keyboards.length > 0) {
      apiParams.keyboards = keyboards
    }

    if (fileUrl) {
      apiParams.file_url = fileUrl
    }

    if (formData.value.filter_type === 'user_custom') {
      if (formData.value.user_list) {
        const tgUserIdsArray = formData.value.user_list
          .split(',')
          .map((id: string) => Number(id.trim()))
          .filter((id: number) => !isNaN(id) && id !== 0)
        if (tgUserIdsArray.length > 0) {
          apiParams.tg_user_ids = tgUserIdsArray
        } else {
          ElMessage.error('自定义用户列表解析后为空或格式不正确，请检查输入')
          submitting.value = false
          return
        }
      } else {
        ElMessage.error('自定义用户时，TG用户id列表不能为空')
        submitting.value = false
        return
      }
    }

    await v1SendGroupMessage(apiParams)

    emit('success')
    ElMessage.success('发送消息请求成功')
    showMessagePreview.value = false
    dialogVisible.value = false
  } catch (error: any) {
    console.error('发送消息请求失败:', error)
    const errorMsg = error?.response?.data?.msg || error?.message || '发送消息请求失败，请重试'
    ElMessage.error(errorMsg)
  } finally {
    submitting.value = false
  }
}

// 监听对话框打开
watch(
  () => dialogVisible.value,
  async (val) => {
    if (val) {
      await fetchMenuList()
      formRef.value?.resetFields()
      checkList.value = []
      fileToUpload.value = null
      fileListRef.value = []

      // 如果是单个用户模式，自动填充信息
      if (props.isSingleUser && props.user) {
        formData.value.filter_type = 'user_custom'

        const botInfo = props.botList.find((bot) => String(bot.value) === String(props.user.bot_id))
        if (botInfo) {
          formData.value.bot_id = botInfo.value
          formData.value.user_list = String(props.user.tg_user_id)
        }
      } else {
        formData.value.filter_type = 'user_custom'
      }
    } else {
      menuList.value = []
    }
  },
  { immediate: true }
)

onMounted(() => {
  // 初始化逻辑
})
</script>

<style scoped>
/* 确保表单内容不会超出视口 */
:deep(.el-dialog__body) {
  max-height: 70vh;
  overflow-y: auto;
}

/* 优化滚动条样式 */
:deep(.el-dialog__body)::-webkit-scrollbar {
  width: 6px;
}

:deep(.el-dialog__body)::-webkit-scrollbar-thumb {
  background-color: rgb(0 0 0 / 20%);
  border-radius: 3px;
}

:deep(.el-dialog__body)::-webkit-scrollbar-track {
  background-color: transparent;
}
</style>
