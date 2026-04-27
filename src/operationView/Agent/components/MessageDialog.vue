<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle">
    <Form :schema="formSchema" @register="messageFormRegister" />
    <template #footer>
      <div class="flex justify-end">
        <ElButton @click="handleCancel">取消</ElButton>
        <ElButton type="primary" :loading="submitting" @click="handleSubmit">发送</ElButton>
      </div>
    </template>
  </Dialog>

  <!-- 内联按钮管理弹窗 -->
  <InlineButtonDialog v-model="inlineButtonDialogVisible" @success="fetchMenuList" />

  <!-- 消息预览对话框 -->
  <MessagePreviewDialog
    v-model="showMessagePreview"
    :preview-data="messagePreviewData"
    @confirm="handleConfirmSend"
  />

  <!-- 图片预览 -->
  <ElImageViewer
    v-if="showImageViewer && previewFileType === 'image'"
    :url-list="imageViewerSrcList"
    @close="showImageViewer = false"
    :initial-index="0"
  />

  <!-- 视频预览（模仿图片查看器样式） -->
  <Teleport to="body">
    <div
      v-if="showVideoViewer && previewFileType === 'video'"
      class="el-image-viewer__wrapper"
      style="z-index: 3000"
      @click.self="closeVideoViewer"
    >
      <div class="el-image-viewer__mask" @click="closeVideoViewer"></div>

      <!-- 关闭按钮 -->
      <span class="el-image-viewer__btn el-image-viewer__close" @click="closeVideoViewer">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
          <path
            fill="currentColor"
            d="M764.288 214.592 512 466.88 259.712 214.592a31.936 31.936 0 0 0-45.12 45.12L466.752 512 214.528 764.224a31.936 31.936 0 1 0 45.12 45.184L512 557.184l252.288 252.288a31.936 31.936 0 0 0 45.12-45.12L557.12 512.064l252.288-252.352a31.936 31.936 0 1 0-45.12-45.184z"
          />
        </svg>
      </span>

      <!-- 视频容器 -->
      <div
        class="el-image-viewer__canvas"
        style="display: flex; align-items: center; justify-content: center"
      >
        <video
          v-if="videoPreviewUrl"
          :src="videoPreviewUrl"
          controls
          autoplay
          disablePictureInPicture
          controlslist="nodownload noremoteplayback"
          style="max-width: 90vw; max-height: 90vh; outline: none"
          @click.stop
        >
          您的浏览器不支持视频播放
        </video>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="tsx">
import { ref, computed, watch, onMounted } from 'vue'
import {
  ElButton,
  ElMessage,
  ElCheckbox,
  ElCheckboxGroup,
  ElUpload,
  ElImageViewer,
  ElDivider,
  ElTooltip
} from 'element-plus'
import type { UploadUserFile } from 'element-plus'
import { Dialog } from '@/components/Dialog'
import { Form, FormSchema } from '@/components/Form'
import { useForm } from '@/hooks/web/useForm'
import { useValidator } from '@/hooks/web/useValidator'
import { v1SendGroupMessage } from '@/api/tgUser'
import { v1GetInnerButtonList } from '@/api/menu_list'
import { v1GetBotUserList } from '@/api/tgUser' // 添加获取用户列表API
import { uploadFileV2 as uploadAPI } from '@/api/utils/upload' // 使用 v2 版本的上传接口
import type { InnerButtonItem } from '@/api/menu_list/types'
import { BaseButton } from '@/components/Button'
import { useHtmlInsert } from '@/hooks/web/useHtmlInsert'
import InlineButtonDialog from '../MessageList/components/InlineButtonDialog.vue'
import MessagePreviewDialog from '@/views/UserGroup/user_list/components/MessageDialog/components/MessagePreviewDialog.vue'
import type { MessagePreviewData } from '@/views/UserGroup/user_list/components/MessageDialog/components/MessagePreviewDialog.vue'

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
  // 新增：自定义标题
  customTitle: {
    type: String,
    default: ''
  },
  // 新增：是否为单个用户发送（机器人信息只读）
  isSingleUser: {
    type: Boolean,
    default: false
  }
})
console.log('props', props)
const emit = defineEmits(['update:modelValue', 'success'])

const { required } = useValidator()
const submitting = ref(false)

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const dialogTitle = computed(() => {
  // 如果有自定义标题，优先使用自定义标题
  if (props.customTitle) {
    return props.customTitle
  }
  // 否则默认使用"发送消息"
  return '发送消息'
})

const checkList = ref<(number | string)[]>([])
const menuList = ref<InnerButtonItem[]>([])
const currentFilterType = ref<'user_custom' | 'all_user'>('user_custom') // 改为默认自定义用户

// 用户列表相关状态
const loadingUsers = ref(false)
const userOptions = ref<Array<{ label: string; value: number }>>([])
const selectedBotId = ref<number | undefined>(undefined)

// 内联按钮管理弹窗
const inlineButtonDialogVisible = ref(false)

// 新增：文件上传相关状态（支持图片和视频，最多10个）
const fileListRef = ref<UploadUserFile[]>([])

const showImageViewer = ref(false)
const imageViewerSrcList = ref<string[]>([])
const showVideoViewer = ref(false)
const videoPreviewUrl = ref('')
const previewFileType = ref<'image' | 'video'>('image')

// 消息预览相关
const showMessagePreview = ref(false)
const messagePreviewData = ref<MessagePreviewData>({})

// Track enable_period state for controlling period field visibility
const enablePeriodState = ref(false)

// 关闭视频预览
const closeVideoViewer = () => {
  showVideoViewer.value = false
  // 清理 object URL 避免内存泄漏
  if (videoPreviewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(videoPreviewUrl.value)
  }
  videoPreviewUrl.value = ''
}

// 判断文件类型
const getFileType = (file: File | UploadUserFile): 'image' | 'video' => {
  const fileName = file.name || ''
  const fileType = (file as File).type || (file as UploadUserFile).raw?.type || ''

  if (fileType.startsWith('video/') || /\.(mp4|avi|mov|wmv|flv|mkv)$/i.test(fileName)) {
    return 'video'
  }
  return 'image'
}

const handlePreview = (uploadFile: UploadUserFile) => {
  const fileType = getFileType(uploadFile)
  previewFileType.value = fileType

  if (fileType === 'video') {
    // 视频预览
    if (uploadFile.url) {
      videoPreviewUrl.value = uploadFile.url
      showVideoViewer.value = true
    } else if (uploadFile.raw) {
      const objectURL = URL.createObjectURL(uploadFile.raw)
      videoPreviewUrl.value = objectURL
      showVideoViewer.value = true
    } else {
      ElMessage.warning('无法预览视频，缺少视频URL')
    }
  } else {
    // 图片预览
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

// 文件选择变化（支持图片和视频，最多10个）
const handleFileChange = (_file: UploadUserFile, fileList: UploadUserFile[]) => {
  if (fileList.length > 10) {
    ElMessage.warning('最多只能上传 10 个文件')
    fileListRef.value = fileList.slice(0, 10)
  } else {
    // 为每个文件生成预览URL
    fileList.forEach((uploadFile) => {
      if (uploadFile.raw && !uploadFile.url) {
        const fileType = getFileType(uploadFile.raw)

        if (fileType === 'video') {
          // 视频文件：生成 blob URL 用于预览
          const blobUrl = URL.createObjectURL(uploadFile.raw)
          uploadFile.url = blobUrl
        }
        // 图片文件会自动生成预览，不需要特殊处理
      }
    })

    fileListRef.value = fileList
  }
}

// 移除文件
const handleImageRemove = (file: UploadUserFile) => {
  const index = fileListRef.value.findIndex((f) => f.uid === file.uid)
  if (index > -1) {
    // 如果是视频文件，清理 blob URL
    const removedFile = fileListRef.value[index]
    if (removedFile.url && removedFile.url.startsWith('blob:')) {
      URL.revokeObjectURL(removedFile.url)
    }
    fileListRef.value.splice(index, 1)
    ElMessage.info('文件已移除')
  }
  return true
}

// 表单相关
const { formRegister: messageFormRegister, formMethods } = useForm()
const { getFormData, setValues } = formMethods

const getContent = async () => (await getFormData())?.content || ''
const setContent = async (newContent: string) => await setValues({ content: newContent })
const { renderFormattingButtons } = useHtmlInsert(getContent, setContent)

// 获取内联菜单列表 - 使用 v1GetInnerButtonList
const fetchMenuList = async () => {
  try {
    const res = await v1GetInnerButtonList()

    console.log('res', res)
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

// 获取机器人用户列表
const fetchBotUsers = async (botId: number) => {
  if (!botId) {
    userOptions.value = []
    return
  }

  loadingUsers.value = true
  try {
    const res = await v1GetBotUserList(botId)
    if (res.code === '000000' && res.data) {
      userOptions.value = res.data.map((user) => ({
        label: `${user.tg_user_name || user.tg_first_name || 'Unknown'} (${user.tg_user_id})`,
        value: user.tg_user_id
      }))
    } else {
      userOptions.value = []
    }
  } catch (error) {
    console.error('获取用户列表失败:', error)
    userOptions.value = []
    ElMessage.error('获取用户列表失败')
  } finally {
    loadingUsers.value = false
  }
}

// 根据类型动态生成表单配置
const formSchema = computed<FormSchema[]>(() => {
  const baseSchema: FormSchema[] = [
    {
      field: 'content',
      component: 'Input',
      label: '消息内容',
      colProps: { span: 24 },
      componentProps: {
        type: 'textarea',
        rows: 4,
        placeholder: '请输入消息内容',
        remark: renderFormattingButtons
      },
      formItemProps: {
        rules: [required('消息内容不能为空')]
      }
    },
    {
      field: 'image_upload_control',
      label: '上传图片/视频',
      colProps: { span: 24 },
      formItemProps: {
        slots: {
          default: () => (
            <div class="flex flex-col gap-2">
              {/* 文件计数显示 */}
              {fileListRef.value.length > 0 && (
                <div
                  style={{
                    color: fileListRef.value.length >= 10 ? '#f56c6c' : '#409eff',
                    fontWeight: 600,
                    fontSize: '13px',
                    marginBottom: '8px'
                  }}
                >
                  {fileListRef.value.length}/10
                </div>
              )}
              <ElUpload
                action="#"
                listType="picture-card"
                limit={10}
                accept="image/png,image/jpeg,image/gif,video/mp4,video/avi,video/mov,video/quicktime"
                autoUpload={false}
                fileList={fileListRef.value}
                onPreview={handlePreview}
                onChange={handleFileChange}
                onRemove={handleImageRemove}
                onExceed={() => ElMessage.warning('最多只能上传 10 个文件')}
                show-file-list={true}
                class="compact-upload"
                v-slots={{
                  file: ({ file }: { file: UploadUserFile }) => {
                    const fileType = getFileType(file)
                    if (fileType === 'video' && file.url) {
                      // 视频文件显示视频第一帧作为缩略图
                      return (
                        <div
                          style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #000; overflow: hidden; cursor: pointer;"
                          onClick={() => handlePreview(file)}
                        >
                          <video
                            src={file.url}
                            style="width: 100%; height: 100%; object-fit: cover;"
                            muted
                            preload="metadata"
                            disablePictureInPicture
                            controlslist="nodownload nofullscreen noremoteplayback"
                          />
                          {/* 播放图标覆盖层 */}
                          <div
                            class="play-icon-overlay"
                            style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); pointer-events: none; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; background: rgba(0,0,0,0.6); border-radius: 50%; transition: all 0.3s ease;"
                          >
                            <svg
                              class="play-icon"
                              style="width: 14px; height: 14px; color: #fff; margin-left: 1px;"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path fill="currentColor" d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                          {/* 删除按钮 */}
                          <span
                            class="el-upload-list__item-delete"
                            style="position: absolute; top: 2px; right: 2px; z-index: 10; display: flex; width: 20px; height: 20px; cursor: pointer; background-color: rgba(0,0,0,0.5); border-radius: 50%; opacity: 0; transition: all 0.2s; align-items: center; justify-content: center;"
                            onClick={(e: Event) => {
                              e.stopPropagation()
                              handleImageRemove(file)
                            }}
                          >
                            <svg
                              class="el-icon"
                              style="width: 12px; height: 12px; color: #fff;"
                              viewBox="0 0 1024 1024"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                fill="currentColor"
                                d="M764.288 214.592 512 466.88 259.712 214.592a31.936 31.936 0 0 0-45.12 45.12L466.752 512 214.528 764.224a31.936 31.936 0 1 0 45.12 45.184L512 557.184l252.288 252.288a31.936 31.936 0 0 0 45.12-45.12L557.12 512.064l252.288-252.352a31.936 31.936 0 1 0-45.12-45.184z"
                              />
                            </svg>
                          </span>
                        </div>
                      )
                    }
                    // 图片文件使用默认显示
                    return null
                  }
                }}
              >
                {
                  <BaseButton type="primary" size="small">
                    选择文件
                  </BaseButton>
                }
              </ElUpload>
              <p class="text-gray-500 text-sm m-0">
                支持图片（PNG、JPEG、GIF）和视频（MP4、AVI、MOV），最多上传 10 个文件
              </p>
            </div>
          )
        }
      }
    },
    {
      field: 'inline_buttons',
      component: 'CheckboxGroup',
      label: '内联按钮',
      colProps: { span: 24 },
      componentProps: {
        // 不使用 options，而是使用自定义 slot
      },
      formItemProps: {
        slots: {
          default: () => {
            return (
              <div class="flex flex-col gap-2 w-full">
                <BaseButton
                  link
                  type="primary"
                  plain
                  onClick={openInlineButtonDialog}
                  class="self-start"
                >
                  编辑内联按钮
                </BaseButton>
                {menuList.value.length > 0 ? (
                  <ElCheckboxGroup v-model={checkList.value} class="flex flex-wrap gap-2">
                    {menuList.value.map((menu) => (
                      // 关键：在 ElCheckboxGroup 中，label 属性是选中时的值
                      // 不要同时设置 value 属性，只设置 label
                      <ElCheckbox key={menu.id} label={menu.id}>
                        {menu.text}
                      </ElCheckbox>
                    ))}
                  </ElCheckboxGroup>
                ) : (
                  <p class="text-gray-500 text-sm m-0">
                    暂无可用的内联按钮，请先点击上方按钮添加。
                  </p>
                )}
              </div>
            )
          }
        }
      }
    },
    {
      field: 'divider_advanced',
      colProps: { span: 24 },
      formItemProps: {
        slots: {
          default: () => (
            <ElDivider content-position="left">
              <span class="text-sm text-gray-600">高级设置</span>
            </ElDivider>
          )
        }
      }
    },
    {
      field: 'enable_period',
      component: 'Switch',
      label: '启用周期',
      value: false,
      colProps: { span: 12 },
      componentProps: {
        activeValue: true,
        inactiveValue: false,
        activeText: '是',
        inactiveText: '否',
        inlinePrompt: true,
        style: '--el-switch-on-color: #13ce66; --el-switch-off-color: #dcdfe6',
        onChange: async (value: boolean) => {
          enablePeriodState.value = value
          // When enabling period, set default value to 1
          if (value) {
            await formMethods.setValues({ period: 1 })
          }
        }
      },
      formItemProps: {
        slots: {
          label: () => (
            <ElTooltip content="开启后可设置消息周期发送，关闭后将禁止消息周期发送" placement="top">
              <span class="cursor-help">
                启用周期 <span style="color: var(--el-color-primary);">ⓘ</span>
              </span>
            </ElTooltip>
          )
        }
      }
    },
    {
      field: 'delete_sent',
      component: 'Switch',
      label: '删除上次消息',
      value: false,
      colProps: { span: 12 },
      componentProps: {
        activeValue: true,
        inactiveValue: false,
        activeText: '是',
        inactiveText: '否',
        inlinePrompt: true,
        style: '--el-switch-on-color: #13ce66; --el-switch-off-color: #dcdfe6'
      },
      formItemProps: {
        slots: {
          label: () => (
            <ElTooltip content="是否删除上一次发送的消息" placement="top">
              <span class="cursor-help">
                删除上次消息 <span style="color: var(--el-color-primary);">ⓘ</span>
              </span>
            </ElTooltip>
          )
        }
      }
    },
    {
      field: 'period',
      component: 'InputNumber',
      label: '发送周期',
      value: 1,
      colProps: { span: 12 },
      componentProps: {
        min: 1,
        max: 8760,
        placeholder: '小时数',
        style: { width: '100%' },
        controlsPosition: 'right',
        class: 'period-input-center'
      },
      formItemProps: {
        slots: {
          label: () => (
            <ElTooltip content="设置消息重复发送的周期（小时），最小值为1小时" placement="top">
              <span class="cursor-help">
                发送周期 <span style="color: var(--el-color-primary);">ⓘ</span>
              </span>
            </ElTooltip>
          )
        }
      },
      // 根据 enable_period 控制显示/隐藏
      hidden: () => !enablePeriodState.value
    },
    {
      field: 'send_at',
      component: 'DatePicker',
      label: '发送时间',
      value: '',
      colProps: { span: 12 },
      componentProps: {
        type: 'datetime',
        placeholder: '选择发送时间',
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
        style: { width: '100%' },
        clearable: true,
        disabledDate: (time: Date) => time.getTime() < Date.now()
      },
      formItemProps: {
        slots: {
          label: () => (
            <ElTooltip
              content="选择消息发送的具体时间，只能选择未来时间，不选择则立即发送"
              placement="top"
            >
              <span class="cursor-help">
                发送时间 <span style="color: var(--el-color-primary);">ⓘ</span>
              </span>
            </ElTooltip>
          )
        }
      }
    }
  ]

  if (props.type === 'mass') {
    const massSpecificSchemaItems: FormSchema[] = [
      {
        field: 'bot_id',
        component: props.isSingleUser ? 'Input' : 'Select', // 单个用户时使用 Input，群发时使用 Select
        label: '机器人',
        value: [], // 默认值为空数组
        colProps: { span: 12 },
        componentProps: props.isSingleUser
          ? {
              // 单个用户模式：只读文本框
              disabled: true,
              placeholder: '当前机器人'
            }
          : {
              // 群发模式：下拉选择框，支持多选
              options: props.botList,
              placeholder: '请选择机器人（可多选）',
              multiple: true,
              collapseTags: true,
              maxCollapseTags: 1,
              collapseTagsTooltip: true,
              onChange: async (value: any) => {
                // 当机器人选择变化时，如果是单选且选择了自定义用户，获取用户列表
                const botIds = Array.isArray(value) ? value : [value]
                if (botIds.length === 1 && currentFilterType.value === 'user_custom') {
                  selectedBotId.value = Number(botIds[0])
                  await fetchBotUsers(Number(botIds[0]))
                } else {
                  selectedBotId.value = undefined
                  userOptions.value = []
                }
              }
            },
        formItemProps: {
          rules: [
            {
              required: true,
              validator: (_rule: any, value: any, callback: any) => {
                // 如果是数组，检查数组长度
                if (Array.isArray(value)) {
                  if (value.length === 0) {
                    callback(new Error('请选择至少一个机器人'))
                  } else {
                    callback()
                  }
                }
                // 如果是单个值，检查是否为空
                else if (value === undefined || value === null || value === '') {
                  callback(new Error('请选择机器人'))
                } else {
                  callback()
                }
              },
              trigger: 'change'
            }
          ]
        }
      },
      {
        field: 'filter_type',
        component: 'RadioGroup',
        label: '接受用户',
        value: 'user_custom', // 改为默认自定义用户
        colProps: { span: 12 },
        hidden: false, // 显示此选项
        componentProps: {
          options: [
            { label: '自定义', value: 'user_custom' },
            { label: '全部', value: 'all_user' }
          ],
          onChange: async (value: 'user_custom' | 'all_user') => {
            currentFilterType.value = value
            if (value === 'all_user') {
              const formData = await formMethods.getFormData()
              if (formData && Object.prototype.hasOwnProperty.call(formData, 'user_list')) {
                formMethods.setValues({ user_list: undefined })
              }
            } else {
              // 切换到自定义用户时，如果有选中的机器人，获取用户列表
              const formData = await formMethods.getFormData()
              if (formData && formData.bot_id) {
                const botIds = Array.isArray(formData.bot_id) ? formData.bot_id : [formData.bot_id]
                if (botIds.length === 1) {
                  await fetchBotUsers(Number(botIds[0]))
                }
              }
            }
          }
        },
        formItemProps: {
          rules: [required('请选择接受用户类型')]
        }
      }
    ]

    if (currentFilterType.value === 'user_custom') {
      massSpecificSchemaItems.push({
        field: 'user_list',
        component: 'Select',
        label: props.isSingleUser ? 'TG用户ID' : 'TG用户ID列表',
        colProps: { span: 24 },
        componentProps: props.isSingleUser
          ? {
              // 单个用户模式：单行输入框，不可编辑
              disabled: true,
              placeholder: '当前用户TG ID'
            }
          : {
              // 群发模式：下拉多选框
              options: userOptions.value,
              placeholder: '请选择用户',
              multiple: true,
              filterable: true,
              collapseTags: true,
              collapseTagsTooltip: true,
              maxCollapseTags: 3,
              loading: loadingUsers.value,
              disabled: !selectedBotId.value || loadingUsers.value
            },
        formItemProps: {
          rules: [
            {
              required: true,
              validator: (_rule, value, callback) => {
                if (currentFilterType.value === 'user_custom') {
                  // 如果是数组，检查长度
                  if (Array.isArray(value)) {
                    if (value.length === 0) {
                      callback(new Error('自定义用户时，TG用户ID列表不能为空'))
                    } else {
                      callback()
                    }
                  }
                  // 如果是字符串或其他类型，检查是否为空
                  else if (!value) {
                    callback(new Error('自定义用户时，TG用户ID列表不能为空'))
                  } else {
                    callback()
                  }
                } else {
                  callback()
                }
              }
            }
          ]
        }
      })
    }
    return [...massSpecificSchemaItems, ...baseSchema]
  } else {
    return baseSchema
  }
})

// 监听对话框打开，获取机器人列表和内联菜单
watch(
  () => dialogVisible.value,
  async (val) => {
    if (val) {
      await fetchMenuList()
      const elForm = await formMethods.getElFormExpose()
      elForm?.resetFields()
      checkList.value = []
      fileListRef.value = []

      // 运营端默认为自定义用户
      currentFilterType.value = 'user_custom'

      // 如果是单个用户模式，自动填充机器人信息和用户ID
      if (props.isSingleUser && props.user) {
        // 从 botList 中查找当前用户的机器人信息
        const botInfo = props.botList.find((bot) => String(bot.value) === String(props.user.bot_id))
        if (botInfo) {
          // 设置机器人 ID 和显示文本，以及用户ID
          await formMethods.setValues({
            bot_id: botInfo.label, // 显示机器人名称
            filter_type: 'user_custom' // 默认为自定义用户
          })
        }
      }
    } else {
      // 弹窗关闭时清空所有状态
      const elForm = await formMethods.getElFormExpose()
      elForm?.resetFields()
      menuList.value = []
      checkList.value = []
      fileListRef.value = []
      userOptions.value = []
      selectedBotId.value = undefined
      currentFilterType.value = 'user_custom' // 重置为自定义用户

      // 清理视频预览的 blob URL，避免内存泄漏
      fileListRef.value.forEach((file) => {
        if (file.url && file.url.startsWith('blob:')) {
          URL.revokeObjectURL(file.url)
        }
      })
      videoPreviewUrl.value = ''
      showImageViewer.value = false
      showVideoViewer.value = false
    }
  },
  { immediate: true }
)

// Note: Period field visibility and validation are handled by the form schema
// The InputNumber component enforces min: 1, and the field is always visible in this implementation

// 取消操作
const handleCancel = () => {
  dialogVisible.value = false
}

// 打开内联按钮管理弹窗
const openInlineButtonDialog = () => {
  inlineButtonDialogVisible.value = true
}

// 提交消息 - 显示预览
const handleSubmit = async () => {
  const elForm = await formMethods.getElFormExpose()
  if (!elForm) {
    ElMessage.error('表单实例获取失败')
    return
  }

  await elForm.validate(async (valid) => {
    if (!valid) return

    const formData = await formMethods.getFormData()

    // 准备预览数据
    const previewData: MessagePreviewData = {}

    // 机器人名称
    if (props.isSingleUser && props.user) {
      const actualBotId = Number(props.user.bot_id)
      const selectedBot = props.botList.find((bot) => Number(bot.value) === actualBotId)
      previewData.botName = selectedBot?.label || `机器人 ID: ${actualBotId}`
    } else {
      const botId = formData.bot_id
      if (Array.isArray(botId)) {
        // 多个机器人：使用数组，每个机器人一行
        previewData.botNames = botId.map((id) => {
          const bot = props.botList.find((b) => Number(b.value) === Number(id))
          return bot?.label || `机器人 ID: ${id}`
        })
      } else {
        // 单个机器人
        const selectedBot = props.botList.find((bot) => Number(bot.value) === Number(botId))
        previewData.botName = selectedBot?.label || `机器人 ID: ${botId}`
      }
    }

    // 接收用户信息 - 运营端永远是全部用户
    previewData.recipientInfo = '全部用户'

    // 消息内容
    previewData.content = formData.content

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
    const formData = await formMethods.getFormData()

    // 先上传所有文件（图片或视频）
    const fileUrls: string[] = []
    if (fileListRef.value.length > 0) {
      for (const uploadFile of fileListRef.value) {
        if (uploadFile.raw) {
          const formDataObj = new FormData()
          formDataObj.append('file', uploadFile.raw)
          try {
            const res = await uploadAPI(formDataObj)
            console.log('文件上传响应:', res)

            // 从返回值中获取 filename 并拼接完整URL
            if (res && res.data && res.data.filename) {
              // 使用当前浏览器的域名拼接 filename
              const browserOrigin = window.location.origin
              const fileUrl = `${browserOrigin}/${res.data.filename}`
              fileUrls.push(fileUrl)
              console.log('拼接后的文件URL:', fileUrl)
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
      }
    }

    // 从 checkList 中提取纯数字 ID
    const keyboards = checkList.value
      .map((item: any) => {
        // 如果是对象，提取 id 属性
        if (typeof item === 'object' && item !== null && 'id' in item) {
          return Number(item.id)
        }
        // 如果是数字或字符串，直接转换
        return typeof item === 'number' ? item : Number(item)
      })
      .filter((id: number) => !isNaN(id))

    console.log('checkList.value:', checkList.value)
    console.log('keyboards (纯数字数组):', keyboards)

    // 确定实际的 bot_ids（支持单个或多个）
    let botIds: number[]
    if (props.isSingleUser && props.user) {
      // 单个用户模式：使用用户的 bot_id
      botIds = [Number(props.user.bot_id)]
    } else {
      // 群发模式：使用表单选择的 bot_id（可能是单个或数组）
      const botId = formData.bot_id
      if (Array.isArray(botId)) {
        botIds = botId.map((id) => Number(id))
      } else {
        botIds = [Number(botId)]
      }
    }

    // 处理发送时间：将日期字符串转换为Unix时间戳（秒）
    let sendAtTimestamp: number
    if (formData.send_at) {
      // 如果选择了日期，转换为Unix时间戳（秒）
      sendAtTimestamp = Math.floor(new Date(formData.send_at).getTime() / 1000)
    } else {
      // 如果没有选择日期，使用当前时间
      sendAtTimestamp = Math.floor(Date.now() / 1000)
    }

    // 群发 - 使用新接口 v1SendGroupMessage
    const apiParams: any = {
      bot_ids: botIds,
      content: formData.content,
      delete_sent: formData.delete_sent ? 1 : 2, // 将 boolean 转换为 1/2
      files: fileUrls, // 使用上传后的所有文件URL数组
      inner_buttons: keyboards.length > 0 ? keyboards : [],
      period: formData.enable_period ? (formData.period >= 1 ? formData.period : 1) : 0, // 开关关闭传0，打开传实际值
      send_at: sendAtTimestamp,
      tg_user_ids: []
    }

    // 添加接收用户列表
    if (formData.filter_type === 'user_custom') {
      if (formData.user_list) {
        let tgUserIdsArray: number[]

        // 如果user_list已经是数组（从下拉选择框来的）
        if (Array.isArray(formData.user_list)) {
          tgUserIdsArray = formData.user_list
            .map((id: any) => Number(id))
            .filter((id: number) => !isNaN(id) && id !== 0)
        }
        // 如果是字符串（从文本框来的，向后兼容）
        else if (typeof formData.user_list === 'string') {
          tgUserIdsArray = formData.user_list
            .split(',')
            .map((id: string) => Number(id.trim()))
            .filter((id: number) => !isNaN(id) && id !== 0)
        }
        // 其他情况
        else {
          tgUserIdsArray = []
        }

        if (tgUserIdsArray.length > 0) {
          apiParams.tg_user_ids = tgUserIdsArray
        } else {
          ElMessage.error('自定义用户列表解析后为空或格式不正确，请检查输入')
          submitting.value = false
          return
        }
      } else {
        // 这个分支理论上会被表单校验的 validator 阻止，但作为保险
        ElMessage.error('自定义用户时，TG用户id列表不能为空')
        submitting.value = false
        return
      }
    }
    // 对于 'all_user' 类型，tg_user_ids 为空数组，表示发送给所有用户

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

onMounted(() => {
  // if (dialogVisible.value) {
  //   fetchMenuList();
  // }
})
</script>

<style scoped>
/* 发送周期输入框居中 */
:deep(.period-input-center .el-input__inner) {
  text-align: center;
}

/* 紧凑型上传组件 - 缩小尺寸 */
:deep(.compact-upload .el-upload-list--picture-card) {
  --el-upload-list-picture-card-size: 80px;
}

:deep(.compact-upload .el-upload--picture-card) {
  --el-upload-picture-card-size: 80px;

  display: flex;
  align-items: center;
  justify-content: center;
}

/* 一行最多5个 */
:deep(.compact-upload .el-upload-list--picture-card .el-upload-list__item) {
  width: 80px;
  height: 80px;
  margin: 0 8px 8px 0;
}

/* 视频缩略图悬停效果 */
:deep(.compact-upload .el-upload-list__item:hover .play-icon-overlay) {
  background: rgb(0 0 0 / 75%) !important;
  transform: translate(-50%, -50%) scale(1.1) !important;
}

:deep(.compact-upload .el-upload-list__item:hover .el-upload-list__item-delete) {
  opacity: 1 !important;
}

:deep(.compact-upload .el-upload-list__item-delete:hover) {
  background-color: var(--el-color-danger) !important;
}

/* 视频预览器样式 - 模仿 ElImageViewer */
.el-image-viewer__wrapper {
  position: fixed;
  inset: 0;
}

.el-image-viewer__mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #000;
  opacity: 0.5;
}

.el-image-viewer__btn {
  position: absolute;
  z-index: 1;
  display: flex;
  width: 44px;
  height: 44px;
  font-size: 24px;
  color: #fff;
  cursor: pointer;
  background-color: #606266;
  border-radius: 50%;
  opacity: 0.8;
  box-sizing: border-box;
  user-select: none;
  align-items: center;
  justify-content: center;
}

.el-image-viewer__btn:hover {
  opacity: 1;
}

.el-image-viewer__close {
  top: 40px;
  right: 40px;
  width: 44px;
  height: 44px;
}

.el-image-viewer__close svg {
  width: 24px;
  height: 24px;
}

.el-image-viewer__canvas {
  position: absolute;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
