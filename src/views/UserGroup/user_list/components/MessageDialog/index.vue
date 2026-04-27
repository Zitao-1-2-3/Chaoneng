<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle">
    <ElForm
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      style="max-height: 70vh; padding-right: 10px; overflow-y: auto"
    >
      <!-- 机器人和接收用户在同一行 -->
      <ElRow v-if="type === 'mass'" :gutter="20">
        <ElCol :span="12">
          <!-- 机器人选择器 -->
          <BotSelector
            v-model="formData.bot_ids"
            :bot-list="botList"
            :is-single-user="isSingleUser"
            field-name="bot_ids"
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
        :selected-bot-id="selectedBotIdForUserList"
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

      <!-- 高级设置 -->
      <ElDivider content-position="left">
        <span class="text-sm text-gray-600">高级设置</span>
      </ElDivider>

      <!-- 启用周期和删除上次消息 -->
      <ElRow :gutter="20">
        <ElCol :span="12">
          <ElFormItem label="启用周期">
            <template #label>
              <ElTooltip
                content="开启后可设置消息周期发送，关闭后将禁止消息周期发送"
                placement="top"
              >
                <span class="cursor-help">启用周期 <span class="text-primary">ⓘ</span></span>
              </ElTooltip>
            </template>
            <ElSwitch
              v-model="formData.enable_period"
              :active-value="true"
              :inactive-value="false"
              active-text="是"
              inactive-text="否"
              inline-prompt
              style="

--el-switch-on-color: #13ce66; --el-switch-off-color: #dcdfe6"
            />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="删除上次消息">
            <template #label>
              <ElTooltip content="是否删除上一次发送的消息" placement="top">
                <span class="cursor-help">删除上次消息 <span class="text-primary">ⓘ</span></span>
              </ElTooltip>
            </template>
            <ElSwitch
              v-model="formData.delete_sent"
              :active-value="true"
              :inactive-value="false"
              active-text="是"
              inactive-text="否"
              inline-prompt
              style="

--el-switch-on-color: #13ce66; --el-switch-off-color: #dcdfe6"
            />
          </ElFormItem>
        </ElCol>
      </ElRow>

      <!-- 发送周期和发送时间 -->
      <ElRow :gutter="20">
        <ElCol :span="12" v-if="formData.enable_period">
          <ElFormItem label="发送周期">
            <template #label>
              <ElTooltip content="设置消息重复发送的周期（小时），最小值为1小时" placement="top">
                <span class="cursor-help">发送周期 <span class="text-primary">ⓘ</span></span>
              </ElTooltip>
            </template>
            <ElInputNumber
              v-model="formData.period"
              :min="1"
              :max="8760"
              placeholder="小时数"
              controls-position="right"
              class="period-input-center"
              style="width: 100%"
            >
              <template #suffix>
                <span class="text-gray-400 text-xs">小时</span>
              </template>
            </ElInputNumber>
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="发送时间">
            <template #label>
              <ElTooltip
                content="选择消息发送的具体时间，只能选择未来时间，不选择则立即发送"
                placement="top"
              >
                <span class="cursor-help">发送时间 <span class="text-primary">ⓘ</span></span>
              </ElTooltip>
            </template>
            <ElDatePicker
              v-model="formData.send_at"
              type="datetime"
              placeholder="选择发送时间"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
              style="width: 100%"
              :clearable="true"
              :disabled-date="(time: Date) => time.getTime() < Date.now()"
            />
          </ElFormItem>
        </ElCol>
      </ElRow>
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
import {
  ElButton,
  ElMessage,
  ElImageViewer,
  ElForm,
  ElRow,
  ElCol,
  ElFormItem,
  ElInputNumber,
  ElSwitch,
  ElDivider,
  ElTooltip,
  ElDatePicker
} from 'element-plus'
import type { UploadUserFile, FormInstance } from 'element-plus'
import { Dialog } from '@/components/Dialog'
import { v1SendGroupMessage, v2SendGroupMessage } from '@/api/tgUser'
import { v1GetInnerButtonList, v2GetInnerButtonList } from '@/api/menu_list'
import { uploadFile as uploadAPI } from '@/api/utils/upload'
import type { InnerButtonItem } from '@/api/menu_list/types'
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
  return props.customTitle || '发送消息'
})

// 表单数据
const formData = ref({
  bot_ids: [] as number | string | (number | string)[] | undefined,
  filter_type: 'user_custom' as 'user_custom' | 'all_user',
  user_list: '',
  content: '',
  period: 1,
  enable_period: false, // 启用周期开关
  delete_sent: false,
  send_at: '' as string | Date | number // 日期时间字符串、Date对象或空字符串
})

// 内联按钮管理
const inlineButtonDialogVisible = ref(false)
const checkList = ref<(number | string)[]>([])
const menuList = ref<InnerButtonItem[]>([])

// 是否选了多个机器人（直接从 formData 派生，避免双状态不同步）
const isMultipleBots = computed(() => {
  const val = formData.value.bot_ids
  return Array.isArray(val) && val.length > 1
})

// 用于获取用户列表的机器人ID（只在单选机器人时有效）
const selectedBotIdForUserList = computed(() => {
  const val = formData.value.bot_ids
  // 如果是数组且只有一个元素，返回该元素
  if (Array.isArray(val) && val.length === 1) {
    return val[0]
  }
  // 如果不是数组且有值，直接返回
  if (!Array.isArray(val) && val !== undefined && val !== '') {
    return val
  }
  return undefined
})

// 表单验证规则
const formRules = computed(() => ({
  user_list: [
    {
      required: formData.value.filter_type === 'user_custom' && !isMultipleBots.value,
      message: '自定义用户时，TG用户ID列表不能为空',
      trigger: ['blur', 'change'],
      validator: (_rule: any, value: string, callback: Function) => {
        // 如果不是自定义用户模式，或者是多选机器人，跳过验证
        if (formData.value.filter_type !== 'user_custom' || isMultipleBots.value) {
          callback()
          return
        }
        // 自定义用户模式下，必须选择用户
        if (!value || value.trim() === '') {
          callback(new Error('自定义用户时，TG用户ID列表不能为空'))
        } else {
          callback()
        }
      }
    }
  ]
}))

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
  formData.value.bot_ids = value
  if (Array.isArray(value) && value.length > 1) {
    formData.value.filter_type = 'all_user'
  }
}

// 获取内联菜单列表
const fetchMenuList = async () => {
  try {
    // 根据 useV2Api prop 决定使用哪个接口
    const apiFunc = props.useV2Api ? v2GetInnerButtonList : v1GetInnerButtonList
    const res = await apiFunc()

    if (res.code === '000000' && res.data) {
      // 新接口返回的 data 直接是数组
      menuList.value = res.data || []
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
      const botId = formData.value.bot_ids
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
          return menu ? { text: menu.text || '' } : null
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
    // 先上传所有文件
    const uploadedFiles: string[] = []
    if (fileListRef.value.length > 0) {
      for (const fileItem of fileListRef.value) {
        if (fileItem.raw) {
          const formDataObj = new FormData()
          formDataObj.append('file', fileItem.raw)
          try {
            const res = await uploadAPI(formDataObj)
            if (res && res.data && res.data.filename) {
              const browserOrigin = window.location.origin
              uploadedFiles.push(`${browserOrigin}/${res.data.filename}`)
            } else {
              ElMessage.error(`文件 ${fileItem.name} 上传失败，未返回文件名`)
              submitting.value = false
              return
            }
          } catch (error: any) {
            console.error('文件上传错误:', error)
            ElMessage.error(`文件 ${fileItem.name} 上传失败: ${error?.message || '请重试'}`)
            submitting.value = false
            return
          }
        }
      }
    }

    // 处理内联按钮
    const innerButtons = checkList.value
      .map((item: any) => {
        if (typeof item === 'object' && item !== null && 'id' in item) {
          return Number(item.id)
        }
        return typeof item === 'number' ? item : Number(item)
      })
      .filter((id: number) => !isNaN(id))

    // 确定实际的 bot_ids（支持多选）
    let botIds: number[]
    if (props.isSingleUser && props.user) {
      botIds = [Number(props.user.bot_id)]
    } else {
      const botId = formData.value.bot_ids
      if (Array.isArray(botId)) {
        botIds = botId.map((id) => Number(id))
      } else {
        botIds = [Number(botId)]
      }
    }

    // 处理发送时间：将日期字符串转换为Unix时间戳（秒）
    let sendAtTimestamp: number
    if (formData.value.send_at) {
      // 如果选择了日期，转换为Unix时间戳（秒）
      sendAtTimestamp = Math.floor(new Date(formData.value.send_at).getTime() / 1000)
    } else {
      // 如果没有选择日期，使用当前时间
      sendAtTimestamp = Math.floor(Date.now() / 1000)
    }

    const apiParams: any = {
      bot_ids: botIds,
      content: formData.value.content,
      delete_sent: formData.value.delete_sent ? 1 : 2, // 将 boolean 转换为 1/2
      files: uploadedFiles.length > 0 ? uploadedFiles : [],
      inner_buttons: innerButtons.length > 0 ? innerButtons : [],
      period: formData.value.enable_period
        ? formData.value.period >= 1
          ? formData.value.period
          : 1
        : 0, // 开关关闭传0，打开传实际值
      send_at: sendAtTimestamp,
      tg_user_ids: []
    }

    // 如果是自定义用户，设置 tg_user_ids
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

    // 根据 useV2Api 决定调用 v1 或 v2 接口
    if (props.useV2Api) {
      await v2SendGroupMessage(apiParams)
    } else {
      await v1SendGroupMessage(apiParams)
    }

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
          formData.value.bot_ids = botInfo.value
          formData.value.user_list = String(props.user.tg_user_id)
        }
      } else {
        formData.value.filter_type = 'user_custom'
      }
    } else {
      // 弹窗关闭时清空所有状态
      formRef.value?.resetFields()
      formData.value = {
        bot_ids: [],
        filter_type: 'user_custom',
        user_list: '',
        content: '',
        period: 1,
        enable_period: false,
        delete_sent: false,
        send_at: ''
      }
      menuList.value = []
      checkList.value = []
      fileToUpload.value = null
      fileListRef.value = []

      // 清理视频预览的 blob URL，避免内存泄漏
      if (videoPreviewUrl.value.startsWith('blob:')) {
        URL.revokeObjectURL(videoPreviewUrl.value)
      }
      videoPreviewUrl.value = ''
      showImageViewer.value = false
      showVideoViewer.value = false
      showMessagePreview.value = false
    }
  },
  { immediate: true }
)

// 监听启用周期开关变化
watch(
  () => formData.value.enable_period,
  (newVal, oldVal) => {
    // 当从关闭切换到打开时，设置默认值为1
    if (newVal && !oldVal) {
      formData.value.period = 1
    }
    // 当开关打开时，确保值不小于1
    if (newVal && formData.value.period < 1) {
      formData.value.period = 1
    }
  }
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

/* 优化表单项间距 */
:deep(.el-form-item) {
  margin-bottom: 18px;
}

/* 优化分割线样式 */
:deep(.el-divider) {
  margin: 24px 0 20px;
}

:deep(.el-divider__text) {
  padding: 0 12px;
  background-color: #fff;
}

/* 优化输入框样式 */
:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-input-number .el-input__inner) {
  text-align: left;
}

/* 发送周期输入框居中 */
:deep(.period-input-center .el-input__inner) {
  text-align: center;
}

/* 优化单选按钮组样式 */
:deep(.el-radio-group) {
  display: flex;
  align-items: center;
}

:deep(.el-radio) {
  margin-right: 24px;
}

/* 优化提示图标样式 */
.cursor-help {
  cursor: help;
}

/* 优化延迟时间提示文本 */
:deep(.el-form-item__content) {
  position: relative;
}

/* 快捷时间按钮样式 */
:deep(.el-button--small) {
  padding: 5px 12px;
  font-size: 12px;
}

/* 快捷按钮容器 */
.flex-wrap {
  flex-wrap: wrap;
}
</style>
